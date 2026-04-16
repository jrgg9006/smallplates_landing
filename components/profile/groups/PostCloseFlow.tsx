"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Minus, Plus, AlertCircle, Check, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { ADDITIONAL_BOOK_PRICE, BASE_BOOK_PRICE } from "@/lib/stripe/pricing";
import { closeBook } from "@/lib/supabase/groups";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PostCloseFlowProps {
  groupId: string;
  onDone: () => void;
  onBack: () => void;
}

type CloseStep = "extras" | "shipping" | "payment" | "done";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
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
  { code: "MT", name: "Malta", postalLabel: "Postal Code", postalPlaceholder: "VLT 1000", regionLabel: "Region", regionType: "text" },
  { code: "NL", name: "Netherlands", postalLabel: "Postal Code", postalPlaceholder: "1000 AA", regionLabel: "Region", regionType: "text" },
  { code: "PL", name: "Poland", postalLabel: "Postal Code", postalPlaceholder: "00-001", regionLabel: "Region", regionType: "text" },
  { code: "PT", name: "Portugal", postalLabel: "Postal Code", postalPlaceholder: "1000-001", regionLabel: "Region", regionType: "text" },
  { code: "RO", name: "Romania", postalLabel: "Postal Code", postalPlaceholder: "010011", regionLabel: "County", regionType: "text" },
  { code: "SK", name: "Slovakia", postalLabel: "Postal Code", postalPlaceholder: "010 01", regionLabel: "Region", regionType: "text" },
  { code: "SI", name: "Slovenia", postalLabel: "Postal Code", postalPlaceholder: "1000", regionLabel: "Region", regionType: "text" },
  { code: "ES", name: "Spain", postalLabel: "Postal Code", postalPlaceholder: "28001", regionLabel: "Region", regionType: "text" },
  { code: "SE", name: "Sweden", postalLabel: "Postal Code", postalPlaceholder: "100 00", regionLabel: "Region", regionType: "text" },
];

const QTY_MESSAGES = [
  "",
  "One extra. Her mom would want one.",
  "Two extras. One for each family.",
  "Three extras. Everyone that matters.",
  "Four copies. Generous. They'll feel it.",
  "Five extras. Every kitchen covered.",
];

const HINT_PILLS = ["Her mom", "His parents", "The couple themselves", "A second copy to gift"];

// --- Step Indicator ---
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const completed = stepNum < current;
        const active = stepNum === current;
        return (
          <React.Fragment key={stepNum}>
            {i > 0 && (
              <div className={`w-8 h-px ${completed ? "bg-[#D4A854]" : "bg-[rgba(45,45,45,0.12)]"}`} />
            )}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                completed
                  ? "bg-[#D4A854] text-white"
                  : active
                  ? "border-2 border-[#D4A854] text-[#D4A854]"
                  : "border border-[rgba(45,45,45,0.12)] text-[#8A8780]"
              }`}
            >
              {completed ? <Check className="w-3.5 h-3.5" /> : stepNum}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// --- Screen A: Upsell ---
function StepExtras({
  qty,
  setQty,
  onContinue,
  onSkip,
  onBack,
  totalSteps,
}: {
  qty: number;
  setQty: (n: number) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  totalSteps: number;
}) {
  const total = qty * ADDITIONAL_BOOK_PRICE;

  return (
    <div className="flex flex-col items-center w-full">
      <StepIndicator current={1} total={totalSteps} />

      {/* Headline */}
      <h1 className="font-serif text-[34px] font-normal text-[#2D2D2D] text-center leading-tight mb-3">
        Before we print, <br />who else gets one?
      </h1>
      <p className="text-[15px] text-[#8A8780] text-center leading-relaxed mb-6 max-w-sm">
        This book is going to live in a kitchen for years.<br />
        Some people should have their own.
      </p>

      {/* Hint pills — hidden for now */}
      {/* <div className="flex flex-wrap justify-center gap-2 mb-10">
        {HINT_PILLS.map((pill) => (
          <span
            key={pill}
            className="bg-white border border-[rgba(45,45,45,0.12)] rounded-[20px] px-3.5 py-1.5 text-[13px] text-[#5A5855]"
          >
            {pill}
          </span>
        ))}
      </div> */}

      {/* Price block */}
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#8A8780] mb-2">
        Each additional copy
      </p>
      <div className="flex items-baseline justify-center gap-3 mb-1">
        <span className="font-serif text-[22px] text-[#B0ADA8] line-through decoration-[1.5px]">${BASE_BOOK_PRICE}</span>
        <span className="flex items-baseline">
          <span className="font-serif text-2xl text-[#8A8780] mr-1">$</span>
          <span className="font-serif text-[56px] text-[#2D2D2D] leading-none">129</span>
        </span>
      </div>
      <div className="flex items-center gap-2 mb-10">
        <span className="text-sm text-[#8A8780]">same book, same quality</span>
        <span className="bg-[#F5EDD8] text-[#7A5C10] text-[11px] rounded-[10px] px-2.5 py-0.5 font-medium">
          ships free
        </span>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-6 mb-3">
        <button
          onClick={() => setQty(Math.max(0, qty - 1))}
          disabled={qty === 0}
          className="w-[50px] h-[50px] rounded-full border-[1.5px] border-[rgba(45,45,45,0.12)] flex items-center justify-center text-[#2D2D2D] text-2xl disabled:opacity-25 transition-opacity"
          aria-label="Remove copy"
        >
          <Minus className="w-5 h-5" />
        </button>
        <span className="font-serif text-[40px] text-[#2D2D2D] min-w-[52px] text-center tabular-nums">
          {qty}
        </span>
        <button
          onClick={() => setQty(Math.min(5, qty + 1))}
          disabled={qty >= 5}
          className="w-[50px] h-[50px] rounded-full bg-[#D4A854] flex items-center justify-center text-white disabled:opacity-50 transition-opacity"
          aria-label="Add copy"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Dynamic message — hidden for now */}
      {/* <p className="text-sm italic text-[#D4A854] h-5 mb-8 text-center">
        {QTY_MESSAGES[qty] || ""}
      </p> */}
      <div className="mb-8" />

      {/* Totals — only when qty > 0 */}
      {qty > 0 && (
        <div className="w-full border-t border-[rgba(45,45,45,0.12)] pt-4 mb-6 space-y-2 text-[13px]">
          <div className="flex justify-between text-[#8A8780]">
            <span>Original book</span>
            <span>Already paid · ${BASE_BOOK_PRICE}</span>
          </div>
          <div className="flex justify-between text-[#2D2D2D]">
            <span>{qty} extra {qty === 1 ? "copy" : "copies"}</span>
            <span>
              <span className="text-[#8A8780] line-through mr-1.5">${qty * BASE_BOOK_PRICE}</span>
              ${total}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8A8780]">Shipping</span>
            <span className="text-[#14532D]">Free — ships with your book</span>
          </div>
          <div className="flex justify-between font-medium text-[15px] text-[#2D2D2D] pt-2 border-t border-[rgba(45,45,45,0.12)]">
            <span>Due today</span>
            <span>${total}</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onContinue}
        className="w-full bg-[#2D2D2D] text-[#FAF7F2] rounded-full py-4 text-base font-medium hover:bg-gray-800 transition-colors"
      >
        {qty > 0
          ? `Add ${qty} ${qty === 1 ? "copy" : "copies"} — $${total} →`
          : "Continue without extras →"}
      </button>

      {/* Ghost skip */}
      {qty > 0 && (
        <button
          onClick={onSkip}
          className="mt-4 text-sm text-[#8A8780] hover:underline transition-colors"
        >
          Continue without extra copies
        </button>
      )}

      {/* Caption */}
      <p className="text-xs text-[#8A8780] text-center mt-4">
        {qty > 0
          ? `All ${qty + 1} copies ship to the same address. Shipping is free on extras.`
          : ""}
      </p>
    </div>
  );
}

// --- Screen B: Shipping ---
function StepShipping({
  qty,
  groupId,
  onContinue,
  onBack,
  totalSteps,
}: {
  qty: number;
  groupId: string;
  onContinue: () => void;
  onBack: () => void;
  totalSteps: number;
}) {
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
  const [loaded, setLoaded] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const countryConfig = SUPPORTED_COUNTRIES.find((c) => c.code === country) || SUPPORTED_COUNTRIES[0];

  // Reason: Pre-fill from existing shipping address if available
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const res = await fetch(`/api/v1/groups/${groupId}/shipping`);
        const json = await res.json();
        if (json.address) {
          setRecipientName(json.address.recipient_name || "");
          setStreetAddress(json.address.street_address || "");
          setApartmentUnit(json.address.apartment_unit || "");
          setCity(json.address.city || "");
          setRegion(json.address.state || "");
          setPostalCode(json.address.postal_code || "");
          setPhoneNumber(json.address.phone_number || "");
          if (json.address.country) {
            const match = SUPPORTED_COUNTRIES.find(
              (c) => c.name === json.address.country || c.code === json.address.country
            );
            if (match) setCountry(match.code);
          }
        }
      } catch {
        // Reason: Non-critical — form just won't be pre-filled
      } finally {
        setLoaded(true);
      }
    };
    fetchAddress();
  }, [groupId]);

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

  const handleSubmit = async () => {
    setError(null);
    if (!recipientName.trim()) { setError("Enter the recipient's name"); return; }
    if (!streetAddress.trim()) { setError("Enter the street address"); return; }
    if (!city.trim()) { setError("Enter the city"); return; }
    if (!region.trim()) { setError(`Enter the ${countryConfig.regionLabel.toLowerCase()}`); return; }
    if (!postalCode.trim()) { setError(`Enter the ${countryConfig.postalLabel.toLowerCase()}`); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/shipping`, {
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
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const totalCopies = 1 + qty;
  const extraTotal = qty * ADDITIONAL_BOOK_PRICE;

  const inputClasses = "bg-white border-[rgba(45,45,45,0.12)] rounded-[10px] px-4 py-3 text-[15px] focus:border-[#D4A854] focus:ring-[#D4A854]/20";

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4A854]" />
      </div>
    );
  }

  // Reason: Render region field based on country type
  const renderRegionField = () => {
    // Reason: Native selects used here because Google Maps script conflicts with Radix portals
    if (countryConfig.regionType === "dropdown-us") {
      return (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          disabled={saving}
          className="w-full h-[46px] bg-white border border-[rgba(45,45,45,0.12)] rounded-[10px] px-3 text-[14px] text-[#2D2D2D] focus:border-[#D4A854] focus:ring-2 focus:ring-[#D4A854]/20 focus:outline-none"
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
          className="w-full h-[46px] bg-white border border-[rgba(45,45,45,0.12)] rounded-[10px] px-3 text-[14px] text-[#2D2D2D] focus:border-[#D4A854] focus:ring-2 focus:ring-[#D4A854]/20 focus:outline-none"
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

  return (
    <div className="flex flex-col items-center w-full">
      <StepIndicator current={2} total={totalSteps} />

      <h1 className="font-serif text-[34px] font-normal text-[#2D2D2D] text-center leading-tight mb-3">
        {qty > 0 ? "Where should we send them?" : "Where should we send it?"}
      </h1>
      <p className="text-[15px] text-[#8A8780] text-center mb-8">
        We&apos;ll email you tracking details when it ships.
      </p>

      {/* Context bar */}
      <div className="w-full bg-white border border-[rgba(45,45,45,0.12)] rounded-[10px] px-[18px] py-[14px] flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-medium text-[#2D2D2D]">
            {totalCopies} {totalCopies === 1 ? "copy" : "copies"}
          </p>
          <p className="text-xs text-[#8A8780]">
            {qty > 0
              ? `Original + ${qty} extra · $${extraTotal} due · shipping included`
              : `Original book · $${BASE_BOOK_PRICE} already paid · shipping included`}
          </p>
        </div>
        <span className="text-2xl opacity-50">📦</span>
      </div>

      {/* Form */}
      <div className="w-full space-y-4">
        {/* Country — native select to avoid Radix/Google Maps portal conflicts */}
        <div>
          <Label className="text-xs text-[#8A8780] mb-1 block">Country</Label>
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={saving}
            className="w-full h-[46px] bg-white border border-[rgba(45,45,45,0.12)] rounded-[10px] px-4 text-[15px] text-[#2D2D2D] focus:border-[#D4A854] focus:ring-2 focus:ring-[#D4A854]/20 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A8780%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat"
          >
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs text-[#8A8780] mb-1 block">Recipient name</Label>
          <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Who should receive the book?" disabled={saving} className={inputClasses} />
        </div>

        {/* Street address with Google Places Autocomplete */}
        <div>
          <Label className="text-xs text-[#8A8780] mb-1 block">Street address</Label>
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
          <Label className="text-xs text-[#8A8780] mb-1 block">Apt / Suite <span className="text-[#8A8780]/60">(optional)</span></Label>
          <Input value={apartmentUnit} onChange={(e) => setApartmentUnit(e.target.value)} placeholder="Optional" disabled={saving} className={inputClasses} />
        </div>

        <div className="grid grid-cols-[1fr_88px_100px] gap-3">
          <div>
            <Label className="text-xs text-[#8A8780] mb-1 block">City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" disabled={saving} className={inputClasses} />
          </div>
          <div>
            <Label className="text-xs text-[#8A8780] mb-1 block">{countryConfig.regionLabel}</Label>
            {renderRegionField()}
          </div>
          <div>
            <Label className="text-xs text-[#8A8780] mb-1 block">{countryConfig.postalLabel}</Label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={countryConfig.postalPlaceholder} disabled={saving} className={inputClasses} />
          </div>
        </div>

        <div>
          <Label className="text-xs text-[#8A8780] mb-1 block">Phone <span className="text-[#8A8780]/60">(optional)</span></Label>
          <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" disabled={saving} className={inputClasses} />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-[#2D2D2D] text-[#FAF7F2] rounded-full py-4 text-base font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors mt-2"
        >
          {saving ? "Saving..." : "Send it to print →"}
        </button>

        <p className="text-[13px] text-[#8A8780] text-center mt-4 leading-[1.5]">
          Need to ship copies to different addresses?{" "}
          <a href="mailto:team@smallplatesandcompany.com" className="text-[#D4A854] hover:opacity-80 transition-opacity">Email us</a> and we&apos;ll sort it out.
        </p>

        <p className="text-xs text-[#8A8780] text-center mt-3">
          We&apos;ll email you tracking details when it ships.
        </p>
      </div>
    </div>
  );
}

// --- Screen C: Payment (inner form, inside Elements) ---
function PaymentForm({
  qty,
  paymentIntentId,
  onSuccess,
  onBack,
}: {
  qty: number;
  paymentIntentId: string;
  onSuccess: (piId: string) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const total = qty * ADDITIONAL_BOOK_PRICE;

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    setPaymentError("");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile/groups`,
        },
        redirect: "if_required",
      });

      if (error) {
        setPaymentError(error.message || "Payment failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      onSuccess(paymentIntentId);
    } catch {
      setPaymentError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Order recap */}
      <div className="bg-[#F5F3EF] border border-[rgba(45,45,45,0.12)] rounded-[10px] px-[18px] py-[14px] mb-6 text-[13px] space-y-2">
        <div className="flex justify-between text-[#2D2D2D]">
          <span>{qty} extra {qty === 1 ? "copy" : "copies"}</span>
          <span>${total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8A8780]">Shipping on extras</span>
          <span className="text-[#14532D]">Free</span>
        </div>
        <div className="border-t border-[rgba(45,45,45,0.12)] pt-2">
          <div className="flex justify-between font-medium text-[15px] text-[#2D2D2D]">
            <span>Total due today</span>
            <span>${total}</span>
          </div>
        </div>
        <p className="text-xs italic text-[#8A8780] pt-1">
          Your book (${BASE_BOOK_PRICE}, shipping included) was already paid.
        </p>
      </div>

      {/* Stripe element */}
      <div className="mb-6">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {paymentError && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg mb-4">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{paymentError}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !stripe || !elements}
        className="w-full bg-[#2D2D2D] text-[#FAF7F2] rounded-full py-4 text-base font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "Processing..." : `Purchase for $${total} →`}
      </button>

      <button
        onClick={onBack}
        disabled={isSubmitting}
        className="w-full mt-3 text-sm text-[#8A8780] hover:underline text-center"
      >
        ← Back to shipping
      </button>

      <p className="text-xs text-[#8A8780] text-center mt-4">
        🔒 Secure checkout powered by <span className="text-[#635BFF] font-medium">Stripe</span>
      </p>
    </div>
  );
}

// --- Screen C wrapper: handles PaymentIntent creation + Elements provider ---
function StepPayment({
  qty,
  groupId,
  onSuccess,
  onBack,
  totalSteps,
}: {
  qty: number;
  groupId: string;
  onSuccess: (piId: string) => void;
  onBack: () => void;
  totalSteps: number;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPI = async () => {
      try {
        const res = await fetch(`/api/v1/groups/${groupId}/extra-copies-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qty }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to create payment");
        setClientSecret(json.clientSecret);
        setPaymentIntentId(json.paymentIntentId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    };
    createPI();
  }, [groupId, qty]);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={onBack} className="text-sm text-[#8A8780] hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4A854]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <StepIndicator current={3} total={totalSteps} />

      <h1 className="font-serif text-[30px] font-normal text-[#2D2D2D] text-center leading-tight mb-2">
        One last thing.
      </h1>
      <p className="text-sm text-[#8A8780] text-center mb-8">
        Payment for your extra {qty === 1 ? "copy" : "copies"}.
      </p>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#2D2D2D",
              colorBackground: "#F5F5F5",
              colorText: "#2D2D2D",
              borderRadius: "10px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            },
            rules: {
              ".Input": {
                border: "1px solid rgba(45,45,45,0.12)",
                boxShadow: "none",
                padding: "13px 16px",
              },
              ".Input:focus": {
                border: "1px solid #D4A854",
                boxShadow: "0 0 0 2px rgba(212, 168, 84, 0.2)",
              },
            },
          },
        }}
      >
        <PaymentForm
          qty={qty}
          paymentIntentId={paymentIntentId}
          onSuccess={onSuccess}
          onBack={onBack}
        />
      </Elements>
    </div>
  );
}

// --- Main Orchestrator ---
export function PostCloseFlow({ groupId, onDone, onBack }: PostCloseFlowProps) {
  const [step, setStep] = useState<CloseStep>("extras");
  const [qty, setQty] = useState(0);
  const [closing, setClosing] = useState(false);

  // Reason: Total steps depends on whether user selected extras (adds payment step)
  const totalSteps = qty > 0 ? 3 : 2;

  const handleExtrasNext = () => setStep("shipping");

  const handleExtrasSkip = () => {
    setQty(0);
    setStep("shipping");
  };

  const handleShippingDone = async () => {
    if (qty > 0) {
      setStep("payment");
    } else {
      // Reason: No extras — close book immediately after shipping
      await finalizeClose();
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    await finalizeClose(paymentIntentId);
  };

  const finalizeClose = async (paymentIntentId?: string) => {
    setClosing(true);
    try {
      const { error } = await closeBook(groupId);
      if (error) {
        console.error("Failed to close book:", error);
        return;
      }
      // Reason: Record extra copies as an order if purchased during close
      if (qty > 0 && paymentIntentId) {
        await fetch(`/api/v1/groups/${groupId}/extra-copies-payment`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ additionalCopies: qty, paymentIntentId }),
        });
      }
      setStep("done");
      onDone();
    } catch (err) {
      console.error("Error closing book:", err);
    } finally {
      setClosing(false);
    }
  };

  const handleBackPress = () => {
    if (step === "shipping") setStep("extras");
    else if (step === "payment") setStep("shipping");
    else onBack();
  };

  if (closing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F5F3EF]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A854] mb-4" />
        <p className="text-sm text-[#8A8780]">Closing the book...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3EF]">
      {/* Header with back button */}
      <div className="flex items-center px-4 py-3 flex-shrink-0">
        <button
          onClick={handleBackPress}
          className="p-2 rounded-full hover:bg-white/60 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-[#2D2D2D]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-start justify-center min-h-full px-6 pt-4 pb-16">
          <div className="w-full max-w-[560px]">
            {step === "extras" && (
              <StepExtras
                qty={qty}
                setQty={setQty}
                onContinue={handleExtrasNext}
                onSkip={handleExtrasSkip}
                onBack={onBack}
                totalSteps={totalSteps}
              />
            )}

            {step === "shipping" && (
              <StepShipping
                qty={qty}
                groupId={groupId}
                onContinue={handleShippingDone}
                onBack={() => setStep("extras")}
                totalSteps={totalSteps}
              />
            )}

            {step === "payment" && (
              <StepPayment
                qty={qty}
                groupId={groupId}
                onSuccess={handlePaymentSuccess}
                onBack={() => setStep("shipping")}
                totalSteps={totalSteps}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
