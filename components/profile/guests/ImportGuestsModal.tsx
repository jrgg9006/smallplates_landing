"use client";

import React, { useState, useRef, useCallback } from "react";
import { X, Upload, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { GuestInsert } from "@/lib/types/database";

interface ImportGuestsModalProps {
  groupId: string;
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

type Step = "select-source" | "upload-file" | "select-guests";
type Source = "zola" | "the_knot" | null;

interface ParsedGuest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alreadyExists?: boolean;
}

// Reason: Zola and The Knot export CSVs with varying column names across versions
function extractColumn(row: Record<string, string>, candidates: string[]): string {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== "") return String(row[key]).trim();
  }
  return "";
}

export function ImportGuestsModal({
  groupId,
  onClose,
  onImportComplete,
}: ImportGuestsModalProps) {
  const [step, setStep] = useState<Step>("select-source");
  const [source, setSource] = useState<Source>(null);
  const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(
    async (file: File): Promise<ParsedGuest[]> => {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: "",
      });

      const guests = rows
        .map((row) => ({
          id: crypto.randomUUID(),
          first_name: extractColumn(row, [
            "First Name",
            "first_name",
            "FirstName",
          ]),
          last_name: extractColumn(row, [
            "Last Name",
            "last_name",
            "LastName",
          ]),
          email: extractColumn(row, [
            "Email Address",
            "Email",
            "email",
            "Email address",
          ]),
          phone: extractColumn(row, [
            "Phone Number",
            "Phone",
            "phone",
            "Phone number",
          ]),
        }))
        .filter((g) => g.first_name.trim() !== "");

      // Reason: The Knot exports sometimes include wedding date — save it if group has none
      if (source === "the_knot") {
        const dateColumns = ["Wedding Day", "Wedding Date", "WeddingDay"];
        for (const row of rows) {
          const dateVal = extractColumn(row, dateColumns);
          if (dateVal) {
            const parsed = new Date(dateVal);
            if (!isNaN(parsed.getTime())) {
              const supabase = createSupabaseClient();
              const { data: group } = await supabase
                .from("groups")
                .select("wedding_date")
                .eq("id", groupId)
                .single();
              if (group && !group.wedding_date) {
                await supabase
                  .from("groups")
                  .update({ wedding_date: parsed.toISOString().split("T")[0] })
                  .eq("id", groupId);
              }
              break;
            }
          }
        }
      }

      // Deduplication check against existing guests
      const supabase = createSupabaseClient();
      const { data: existing } = await supabase
        .from("guests")
        .select("email")
        .eq("group_id", groupId)
        .eq("is_archived", false);

      const existingEmails = new Set(
        existing
          ?.map((g) => g.email?.toLowerCase())
          .filter((e): e is string => !!e && !e.startsWith("no_email_"))
      );

      return guests.map((g) => ({
        ...g,
        alreadyExists: g.email
          ? existingEmails.has(g.email.toLowerCase())
          : false,
      }));
    },
    [source, groupId]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validTypes = [
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

      if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
        setError("Please upload a .csv or .xlsx file.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const guests = await parseFile(file);
        if (guests.length === 0) {
          setError(
            "No guests found in this file. Make sure it has a 'First Name' column."
          );
          setIsLoading(false);
          return;
        }

        setParsedGuests(guests);

        // Pre-select all non-duplicate guests
        const initialSelected = new Set(
          guests.filter((g) => !g.alreadyExists).map((g) => g.id)
        );
        setSelectedIds(initialSelected);
        setStep("select-guests");
      } catch {
        setError("Could not read this file. Please check the format and try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [parseFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be logged in to import guests.");
      setIsLoading(false);
      return;
    }

    const toInsert: GuestInsert[] = parsedGuests
      .filter((g) => selectedIds.has(g.id) && !g.alreadyExists)
      .map((g) => ({
        user_id: user.id,
        group_id: groupId,
        first_name: g.first_name,
        last_name: g.last_name || "",
        email:
          g.email ||
          "NO_EMAIL_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substr(2, 9),
        phone: g.phone || null,
        status: "pending" as const,
        source: "imported" as const,
        number_of_recipes: 1,
        recipes_received: 0,
        is_archived: false,
        is_self: false,
      }));

    const { error: insertError } = await supabase.from("guests").insert(toInsert);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
      return;
    }

    onImportComplete(toInsert.length);
  };

  const selectableGuests = parsedGuests.filter((g) => !g.alreadyExists);
  const selectedCount = [...selectedIds].filter(
    (id) => !parsedGuests.find((g) => g.id === id)?.alreadyExists
  ).length;

  const toggleSelectAll = () => {
    if (selectedCount === selectableGuests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableGuests.map((g) => g.id)));
    }
  };

  const toggleGuest = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-[600px] rounded-2xl bg-[#FAF7F2] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]
                    max-sm:max-w-none max-sm:rounded-none max-sm:rounded-t-2xl max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:max-h-[90vh] max-sm:overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-[#2D2D2D] hover:text-[#C4856C] transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-semibold">
            Import Guests
          </h2>
        </div>

        {/* ==================== STEP 1: Select Source ==================== */}
        {step === "select-source" && (
          <div>
            <p className="text-sm text-[#2D2D2D] mb-5">
              Where is your guest list from?
            </p>

            <div className="flex gap-3 mb-4">
              {/* Zola card */}
              <button
                onClick={() => { setSource("zola"); setStep("upload-file"); }}
                className={`flex-1 rounded-xl border-[1.5px] p-6 flex items-center justify-center cursor-pointer transition-all
                  border-[#E8E0D5] bg-white hover:border-[#D4A854] hover:bg-[#FFF8EC]`}
              >
                <img src="/images/guest_modal/Zola_Logo.png" alt="Zola" className="h-5 object-contain" />
              </button>

              {/* The Knot card */}
              <button
                onClick={() => { setSource("the_knot"); setStep("upload-file"); }}
                className={`flex-1 rounded-xl border-[1.5px] p-6 flex items-center justify-center cursor-pointer transition-all
                  border-[#E8E0D5] bg-white hover:border-[#D4A854] hover:bg-[#FFF8EC]`}
              >
                <img src="/images/guest_modal/knot_logo.png" alt="The Knot" className="h-5 object-contain" />
              </button>
            </div>

            <p className="text-xs text-[#999] mb-6">
              Export your guest list from your registry account, then upload it
              here.
            </p>

          </div>
        )}

        {/* ==================== STEP 2: Upload File ==================== */}
        {step === "upload-file" && (
          <div>
            <p className="text-sm text-[#2D2D2D] mb-4">
              Upload your{" "}
              {source === "zola" ? "Zola" : "The Knot"} guest list (CSV or
              Excel)
            </p>

            {/* How to export helper */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1 text-sm text-[#D4A854] mb-4 hover:opacity-80 transition-opacity"
            >
              How do I export my list?
              {showHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showHelp && (
              <div className="text-xs text-[#999] bg-white rounded-lg p-3 mb-4 border border-[#E8E0D5]">
                {source === "zola" ? (
                  <p>
                    Go to <strong>Guest List</strong> &rarr; click{" "}
                    <strong>&quot;Export&quot;</strong> &rarr; download CSV
                  </p>
                ) : (
                  <p>
                    Go to <strong>Guest List</strong> &rarr; click{" "}
                    <strong>&quot;Export Guest List&quot;</strong> &rarr; download
                    Excel
                  </p>
                )}
              </div>
            )}

            {/* Upload zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all
                ${
                  isDragOver
                    ? "bg-[#FFF8EC] border-[#C4856C]"
                    : "bg-[#FDFBF8] border-[#D4A854] hover:bg-[#FFF8EC]"
                }`}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-[#D4A854] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#999]">Reading your file...</p>
                </div>
              ) : (
                <>
                  <Upload
                    size={32}
                    className="mx-auto mb-3 text-[#D4A854]"
                  />
                  <p className="text-sm text-[#2D2D2D] font-medium">
                    Drop your file here
                  </p>
                  <p className="text-sm text-[#999] mt-1">
                    or click to browse
                  </p>
                  <p className="text-xs text-[#999] mt-3">
                    Accepts .csv and .xlsx files
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = "";
              }}
              className="hidden"
            />

            {error && (
              <p className="text-sm text-red-600 mt-3">{error}</p>
            )}

            <button
              onClick={() => setStep("select-source")}
              className="w-full text-center text-sm text-[#999] hover:text-[#2D2D2D] mt-6 transition-colors"
            >
              &larr; Back
            </button>
          </div>
        )}

        {/* ==================== STEP 3: Select Guests ==================== */}
        {step === "select-guests" && (
          <div>
            <p className="text-xs text-[#2D2D2D] mb-3">
              Select who to add to your book
            </p>

            {/* Select All / Counter */}
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectableGuests.length > 0 &&
                    selectedCount === selectableGuests.length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded accent-[#D4A854] cursor-pointer"
                />
                <span className="text-xs text-[#2D2D2D]">
                  {selectedCount === selectableGuests.length
                    ? "Deselect All"
                    : "Select All"}
                </span>
              </label>
              <span className="text-xs text-[#999]">
                {selectedCount} of {selectableGuests.length} selected
              </span>
            </div>

            {/* Guest list */}
            <div className="max-h-[340px] overflow-y-auto rounded-lg border border-[#E8E0D5] bg-white">
              {parsedGuests.map((guest) => {
                const isDisabled = guest.alreadyExists;
                const isSelected = selectedIds.has(guest.id);
                const hasContact = guest.email || guest.phone;

                return (
                  <div
                    key={guest.id}
                    className={`flex items-center gap-2 px-3 py-2 border-b border-[#E8E0D5] last:border-b-0
                      ${isDisabled ? "opacity-60" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected && !isDisabled}
                      disabled={isDisabled}
                      onChange={() => !isDisabled && toggleGuest(guest.id)}
                      className="w-4 h-4 flex-shrink-0 rounded accent-[#D4A854] cursor-pointer disabled:cursor-not-allowed"
                    />

                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <span className="text-xs font-medium text-[#2D2D2D] truncate">
                        {guest.first_name} {guest.last_name}
                      </span>
                      {!hasContact && (
                        <span title="No email or phone">
                          <AlertTriangle
                            size={12}
                            className="text-[#D4A854] flex-shrink-0"
                          />
                        </span>
                      )}
                    </div>

                    {!isDisabled && hasContact && (
                      <span className="text-[10px] text-[#999] flex-shrink-0 whitespace-nowrap">
                        {[guest.email, guest.phone].filter(Boolean).join(" · ")}
                      </span>
                    )}

                    {isDisabled && (
                      <span className="text-[10px] bg-[#E8E0D5] text-[#999] px-2 py-0.5 rounded-full flex-shrink-0">
                        Already added
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <p className="text-xs text-red-600 mt-2">{error}</p>
            )}

            {/* Back + CTA */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => {
                  setStep("upload-file");
                  setError(null);
                }}
                className="text-xs text-[#999] hover:text-[#2D2D2D] transition-colors"
              >
                &larr; Back
              </button>
              <button
                onClick={handleImport}
                disabled={selectedCount === 0 || isLoading}
                className="px-4 py-2 rounded-lg bg-[#D4A854] text-white text-xs font-medium transition-opacity
                           disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center gap-1.5"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  `Add ${selectedCount} guest${selectedCount !== 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
