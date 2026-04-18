"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { AlertCircle, Check, ArrowRight, Plus, Link2 } from "lucide-react";
import { ExtraCopyPurchase } from "./ExtraCopyPurchase";
import type { GroupWithMembers, ShippingAddress } from "@/lib/types/database";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

function ShareCopyLink({ groupId }: { groupId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/copy/${groupId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E8E0D5] text-[#2D2D2D] text-xs font-medium rounded-full hover:border-[#D4A854] hover:text-[#D4A854] transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-[#D4A854]" />
            Link copied
          </>
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5" />
            Share order link
          </>
        )}
      </button>
      <p className="text-[11px] text-[#8A8780] mt-1.5 pl-1">
        Anyone with the link can order their own copy.
      </p>
    </div>
  );
}

const REFERRAL_CODE = "REFERRAL2026";

function ReferralBox() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(REFERRAL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-[14px] bg-[radial-gradient(ellipse_at_top_left,#C4897A_0%,#B07261_40%,#96594B_100%)]">
      {/* Reason: Subtle gold accent line at top for brand warmth */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A854] to-transparent" />

      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Copy */}
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[15px] text-white/90 leading-snug">
              Know someone getting married?
            </p>
            <p className="text-[12px] text-white/50 mt-0.5">
              Share your code. They get 15% off their book.
            </p>
          </div>

          {/* Right: Code + button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="px-3.5 py-2 bg-white/25 border border-white/20 rounded-lg">
              <span className="text-[13px] font-mono font-medium text-white tracking-wider">
                {REFERRAL_CODE}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                copied
                  ? "bg-[#D4A854] text-[#2D2D2D]"
                  : "bg-white text-[#2D2D2D] hover:bg-[#D4A854] hover:text-[#2D2D2D]"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                "Copy"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BookClosedStatusProps {
  group: GroupWithMembers;
  recipeCount: number;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const MX_STATES = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua",
  "Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero",
  "Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla",
  "Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas",
  "Tlaxcala","Veracruz","Yucatán","Zacatecas",
];

const SUPPORTED_COUNTRIES: { code: string; name: string; postalLabel: string; postalPlaceholder: string; regionLabel: string; regionType: "dropdown-us" | "dropdown-mx" | "text" }[] = [
  { code: "US", name: "United States", postalLabel: "ZIP", postalPlaceholder: "12345", regionLabel: "State", regionType: "dropdown-us" },
  { code: "MX", name: "Mexico", postalLabel: "Código Postal", postalPlaceholder: "01000", regionLabel: "Estado", regionType: "dropdown-mx" },
  { code: "AT", name: "Austria", postalLabel: "Postal Code", postalPlaceholder: "1010", regionLabel: "Region", regionType: "text" },
  { code: "BE", name: "Belgium", postalLabel: "Postal Code", postalPlaceholder: "1000", regionLabel: "Region", regionType: "text" },
  { code: "BG", name: "Bulgaria", postalLabel: "Postal Code", postalPlaceholder: "1000", regionLabel: "Region", regionType: "text" },
  { code: "HR", name: "Croatia", postalLabel: "Postal Code", postalPlaceholder: "10000", regionLabel: "Region", regionType: "text" },
  { code: "CY", name: "Cyprus", postalLabel: "Postal Code", postalPlaceholder: "1000", regionLabel: "Region", regionType: "text" },
  { code: "CZ", name: "Czech Republic", postalLabel: "Postal Code", postalPlaceholder: "100 00", regionLabel: "Region", regionType: "text" },
  { code: "DK", name: "Denmark", postalLabel: "Postal Code", postalPlaceholder: "1000", regionLabel: "Region", regionType: "text" },
  { code: "EE", name: "Estonia", postalLabel: "Postal Code", postalPlaceholder: "10000", regionLabel: "County", regionType: "text" },
  { code: "FI", name: "Finland", postalLabel: "Postal Code", postalPlaceholder: "00100", regionLabel: "Region", regionType: "text" },
  { code: "FR", name: "France", postalLabel: "Postal Code", postalPlaceholder: "75001", regionLabel: "Region", regionType: "text" },
  { code: "DE", name: "Germany", postalLabel: "Postal Code", postalPlaceholder: "10115", regionLabel: "Region", regionType: "text" },
  { code: "GR", name: "Greece", postalLabel: "Postal Code", postalPlaceholder: "10431", regionLabel: "Region", regionType: "text" },
  { code: "HU", name: "Hungary", postalLabel: "Postal Code", postalPlaceholder: "1000", regionLabel: "County", regionType: "text" },
  { code: "IE", name: "Ireland", postalLabel: "Eircode", postalPlaceholder: "D01 AB12", regionLabel: "County", regionType: "text" },
  { code: "IT", name: "Italy", postalLabel: "Postal Code", postalPlaceholder: "00100", regionLabel: "Region", regionType: "text" },
  { code: "LV", name: "Latvia", postalLabel: "Postal Code", postalPlaceholder: "LV-1001", regionLabel: "Region", regionType: "text" },
  { code: "LT", name: "Lithuania", postalLabel: "Postal Code", postalPlaceholder: "01001", regionLabel: "Region", regionType: "text" },
  { code: "LU", name: "Luxembourg", postalLabel: "Postal Code", postalPlaceholder: "1009", regionLabel: "Region", regionType: "text" },
  { code: "NL", name: "Netherlands", postalLabel: "Postal Code", postalPlaceholder: "1011", regionLabel: "Province", regionType: "text" },
  { code: "PL", name: "Poland", postalLabel: "Postal Code", postalPlaceholder: "00-001", regionLabel: "Region", regionType: "text" },
  { code: "PT", name: "Portugal", postalLabel: "Postal Code", postalPlaceholder: "1000-001", regionLabel: "District", regionType: "text" },
  { code: "RO", name: "Romania", postalLabel: "Postal Code", postalPlaceholder: "010011", regionLabel: "County", regionType: "text" },
  { code: "SK", name: "Slovakia", postalLabel: "Postal Code", postalPlaceholder: "811 01", regionLabel: "Region", regionType: "text" },
  { code: "SI", name: "Slovenia", postalLabel: "Postal Code", postalPlaceholder: "1000", regionLabel: "Region", regionType: "text" },
  { code: "ES", name: "Spain", postalLabel: "Postal Code", postalPlaceholder: "28001", regionLabel: "Province", regionType: "text" },
  { code: "SE", name: "Sweden", postalLabel: "Postal Code", postalPlaceholder: "111 22", regionLabel: "Region", regionType: "text" },
  { code: "GB", name: "United Kingdom", postalLabel: "Postcode", postalPlaceholder: "SW1A 1AA", regionLabel: "County", regionType: "text" },
  { code: "CA", name: "Canada", postalLabel: "Postal Code", postalPlaceholder: "K1A 0B1", regionLabel: "Province", regionType: "text" },
];

function TimelineSection({ bookStatus }: { bookStatus: string }) {
  // Reason: Map book_status from admin pipeline to timeline step completion
  const designActive = ['reviewed', 'ready_to_print', 'printed'].includes(bookStatus);
  const printedActive = bookStatus === 'printed';

  const steps = [
    {
      completed: true,
      title: "Book closed",
      description: "Recipes locked and ready for design.",
    },
    {
      completed: designActive,
      title: "Design & layout",
      description: designActive
        ? (printedActive ? "Layout complete." : "We're working on your book right now.")
        : "We'll lay out every recipe and send you a preview.",
    },
    {
      completed: printedActive,
      title: "Printing & shipping",
      description: printedActive
        ? "Your book has been printed and is on its way."
        : "Your book ships and arrives at your door.",
    },
  ];

  return (
    <div className="bg-white border border-[rgba(45,45,45,0.12)] rounded-[10px] overflow-hidden">
      {steps.map((s, i) => (
        <div
          key={s.title}
          className={`flex items-start gap-3 px-[18px] py-4 ${
            i < steps.length - 1 ? "border-b border-[rgba(45,45,45,0.12)]" : ""
          }`}
        >
          {/* Icon */}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              s.completed ? "bg-[#D4A854]" : "border border-gray-300"
            }`}
          >
            {s.completed ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <ArrowRight className="w-3 h-3 text-gray-400" />
            )}
          </div>
          {/* Content */}
          <div>
            <p className="text-sm font-medium text-[#2D2D2D]">{s.title}</p>
            <p className="text-[13px] text-[#8A8780]">{s.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const inputClasses = "bg-white border-[#E8E0D5] focus:border-[#D4A854] focus:ring-[#D4A854]/20";

export function BookClosedStatus({ group, recipeCount }: BookClosedStatusProps) {
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [extraCopiesCount, setExtraCopiesCount] = useState(0);

  // Shipping form state
  const [country, setCountry] = useState("US");
  const [recipientName, setRecipientName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [apartmentUnit, setApartmentUnit] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const countryConfig = SUPPORTED_COUNTRIES.find((c) => c.code === country) || SUPPORTED_COUNTRIES[0];

  const coupleName = group.print_couple_name || group.couple_display_name || group.name;
  const closedDate = group.book_closed_by_user
    ? new Date(group.book_closed_by_user).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const res = await fetch(`/api/v1/groups/${group.id}/shipping`);
        const json = await res.json();
        if (json.address) setShippingAddress(json.address);
      } catch {
        // Reason: Non-critical — address just won't show
      } finally {
        setLoadingAddress(false);
      }
    };
    // Reason: Count extra copies from orders table instead of groups.extra_copies
    const fetchExtraCopies = async () => {
      try {
        const res = await fetch(`/api/v1/groups/${group.id}/orders?type=extra_copy`);
        const json = await res.json();
        if (json.totalCopies != null) setExtraCopiesCount(json.totalCopies);
      } catch {
        // Reason: Non-critical — falls back to 0
      }
    };
    fetchAddress();
    fetchExtraCopies();
  }, [group.id]);

  // Reason: When country changes, clear region since state lists differ
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setRegion("");
  };

  const onPlaceSelected = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.address_components) return;

    let street = "";
    let streetNumber = "";
    let newCity = "";
    let newRegion = "";
    let newPostal = "";

    for (const comp of place.address_components) {
      const types = comp.types;
      if (types.includes("street_number")) streetNumber = comp.long_name;
      else if (types.includes("route")) street = comp.long_name;
      else if (types.includes("locality") || types.includes("postal_town")) newCity = comp.long_name;
      else if (types.includes("administrative_area_level_1")) newRegion = comp.long_name;
      else if (types.includes("postal_code")) newPostal = comp.long_name;
      // Reason: sublocality fallback for cities that don't have locality (e.g. Brooklyn, NY)
      else if (types.includes("sublocality_level_1") && !newCity) newCity = comp.long_name;
    }

    setStreetAddress(streetNumber ? `${streetNumber} ${street}` : street);
    if (newCity) setCity(newCity);
    if (newRegion) setRegion(newRegion);
    if (newPostal) setPostalCode(newPostal);
  }, []);

  const validateAndSave = async () => {
    setError(null);
    if (!recipientName.trim()) { setError("Enter the recipient's name"); return; }
    if (!streetAddress.trim()) { setError("Enter the street address"); return; }
    if (!city.trim()) { setError("Enter the city"); return; }
    if (!region.trim()) { setError(`Enter the ${countryConfig.regionLabel.toLowerCase()}`); return; }
    if (!postalCode.trim()) { setError(`Enter the ${countryConfig.postalLabel.toLowerCase()}`); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/groups/${group.id}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_name: recipientName.trim(),
          street_address: streetAddress.trim(),
          apartment_unit: apartmentUnit.trim() || null,
          city: city.trim(),
          state: region.trim(),
          postal_code: postalCode.trim(),
          phone_number: phoneNumber.trim() || null,
          country: countryConfig.name,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setShippingAddress(json.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Reason: Native selects used here because Google Maps script conflicts with Radix portals
  const renderRegionField = () => {
    if (countryConfig.regionType === "dropdown-us") {
      return (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          disabled={saving}
          className="w-full h-10 bg-white border border-[#E8E0D5] rounded-md px-3 text-sm text-[#2D2D2D] focus:border-[#D4A854] focus:ring-2 focus:ring-[#D4A854]/20 focus:outline-none"
        >
          <option value="">{countryConfig.regionLabel}</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      );
    }
    if (countryConfig.regionType === "dropdown-mx") {
      return (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          disabled={saving}
          className="w-full h-10 bg-white border border-[#E8E0D5] rounded-md px-3 text-sm text-[#2D2D2D] focus:border-[#D4A854] focus:ring-2 focus:ring-[#D4A854]/20 focus:outline-none"
        >
          <option value="">{countryConfig.regionLabel}</option>
          {MX_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      );
    }
    return (
      <Input
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder={countryConfig.regionLabel}
        disabled={saving}
        className={inputClasses}
      />
    );
  };

  // Reason: Show purchase flow as full-page overlay when user clicks "Get another copy".
  // Successful flow redirects to Stripe then returns to /profile/groups?from=dashboard-extras-purchase,
  // which the parent page.tsx detects and refreshes the groups list. onBack handles the cancel path.
  if (showPurchase) {
    return (
      <ExtraCopyPurchase
        groupId={group.id}
        existingAddress={shippingAddress}
        onBack={() => setShowPurchase(false)}
      />
    );
  }

  return (
    <div className="min-h-[60vh] px-6 py-10">
      <div className="max-w-2xl mx-auto">

          {/* Header */}
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4A854] font-medium mb-2">
            Your book is closed.
          </p>
          <h1 className="font-serif text-3xl text-[#2D2D2D] leading-tight mb-1">
            {coupleName}
          </h1>
          {closedDate && (
            <p className="text-sm text-gray-400">
              Closed {closedDate}
            </p>
          )}

          {/* Details grid */}
          <div className="mt-6 grid grid-cols-2 gap-5">
            {/* Printed as */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Printed as</p>
              <p className="text-sm text-[#2D2D2D]">{coupleName}</p>
            </div>

            {/* Recipes */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Recipes</p>
              <p className="text-sm text-[#2D2D2D]">{recipeCount} recipes</p>
            </div>

            {/* Book photo */}
            {group.couple_image_url && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Book photo</p>
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E8E0D5]">
                  <Image
                    src={group.couple_image_url}
                    alt={coupleName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              </div>
            )}

            {/* Copies */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Copies</p>
              <p className="text-sm text-[#2D2D2D]">
                {extraCopiesCount > 0
                  ? `${1 + extraCopiesCount} books`
                  : "1 book"}
              </p>
              <div className="flex flex-wrap items-start gap-2 mt-3">
                <button
                  onClick={() => setShowPurchase(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D2D2D] text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Get more copies
                </button>
                <ShareCopyLink groupId={group.id} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#E8E0D5] my-6" />

          {/* Shipping section */}
          {loadingAddress ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#D4A854]" />
            </div>
          ) : shippingAddress ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Ships to</p>
              <p className="text-sm text-[#2D2D2D] font-medium">{shippingAddress.recipient_name}</p>
              <p className="text-sm text-gray-500">
                {shippingAddress.street_address}
                {shippingAddress.apartment_unit && `, ${shippingAddress.apartment_unit}`}
              </p>
              <p className="text-sm text-gray-500">
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
              </p>
            </div>
          ) : (
            <div>
              {/* Urgent: no address on file */}
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    We can&apos;t ship your book without an address.
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Your book is ready to go — just tell us where to send it.
                  </p>
                </div>
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Ships to</p>
              <p className="font-serif text-lg text-[#2D2D2D] mb-4">
                Where should we send the book?
              </p>

              <div className="space-y-3">
                {/* Country */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Country</Label>
                  <select
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    disabled={saving}
                    className="w-full h-10 bg-white border border-[#E8E0D5] rounded-md px-3 text-sm text-[#2D2D2D] focus:border-[#D4A854] focus:ring-2 focus:ring-[#D4A854]/20 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A8780%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
                  >
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Recipient name</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full name"
                    disabled={saving}
                    className={inputClasses}
                  />
                </div>

                {/* Street address with Google Places Autocomplete */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Street address</Label>
                  {mapsLoaded ? (
                    <Autocomplete
                      onLoad={(ac) => { autocompleteRef.current = ac; }}
                      onPlaceChanged={onPlaceSelected}
                      options={{
                        componentRestrictions: { country: country.toLowerCase() },
                        types: ["address"],
                      }}
                    >
                      <Input
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="Start typing an address..."
                        disabled={saving}
                        className={inputClasses}
                      />
                    </Autocomplete>
                  ) : (
                    <Input
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="1234 Main Street"
                      disabled={saving}
                      className={inputClasses}
                    />
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Apt / Suite <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    value={apartmentUnit}
                    onChange={(e) => setApartmentUnit(e.target.value)}
                    placeholder="Optional"
                    disabled={saving}
                    className={inputClasses}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">City</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      disabled={saving}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">{countryConfig.regionLabel}</Label>
                    {renderRegionField()}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">{countryConfig.postalLabel}</Label>
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder={countryConfig.postalPlaceholder}
                      disabled={saving}
                      className={inputClasses}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Phone <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    disabled={saving}
                    className={inputClasses}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <button
                  onClick={validateAndSave}
                  disabled={saving}
                  className="w-full bg-[#2D2D2D] text-white rounded-full py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors mt-2"
                >
                  {saving ? "Saving..." : "Save shipping address"}
                </button>
              </div>
            </div>
          )}

          {/* Referral */}
          <div className="border-t border-[#E8E0D5] my-6" />
          <ReferralBox />

          {/* What happens next */}
          <div className="border-t border-[#E8E0D5] my-6" />
          <p className="text-xs uppercase tracking-[0.25em] text-[#D4A854] font-medium mb-4">
            What happens next
          </p>
          <TimelineSection bookStatus={group.book_status} />

          {/* Footer */}
          <div className="border-t border-[#E8E0D5] my-6" />
          <p className="text-center text-sm text-gray-400">
            We&apos;ll email you updates as we design and print your book.
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            Questions? <a href="mailto:team@smallplatesandcompany.com" className="text-[#D4A854] hover:underline">team@smallplatesandcompany.com</a>
          </p>
      </div>
    </div>
  );
}
