"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Minus, Plus, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import {
  ADDITIONAL_BOOK_PRICE,
  EXTRA_COPIES_SHIPPING_COST,
} from "@/lib/stripe/pricing";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

interface ExtraCopyPurchaseProps {
  groupId: string;
  existingAddress: {
    recipient_name: string;
    street_address: string;
    apartment_unit: string | null;
    city: string;
    state: string;
    postal_code: string;
    phone_number: string | null;
    country?: string;
  } | null;
  onBack: () => void;
}

type Step = "qty" | "shipping";

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
  { code: "GB", name: "United Kingdom", postalLabel: "Postcode", postalPlaceholder: "SW1A 1AA", regionLabel: "County", regionType: "text" },
  { code: "CA", name: "Canada", postalLabel: "Postal Code", postalPlaceholder: "K1A 0B1", regionLabel: "Province", regionType: "text" },
  { code: "FR", name: "France", postalLabel: "Postal Code", postalPlaceholder: "75001", regionLabel: "Region", regionType: "text" },
  { code: "DE", name: "Germany", postalLabel: "Postal Code", postalPlaceholder: "10115", regionLabel: "Region", regionType: "text" },
  { code: "ES", name: "Spain", postalLabel: "Postal Code", postalPlaceholder: "28001", regionLabel: "Province", regionType: "text" },
  { code: "IT", name: "Italy", postalLabel: "Postal Code", postalPlaceholder: "00100", regionLabel: "Region", regionType: "text" },
];

const inputClasses = "bg-white border-brand-sand focus:border-brand-honey focus:ring-brand-honey/20";

// --- Step 1: Quantity selector ---
function StepQty({
  qty,
  setQty,
  onContinue,
  onBack,
}: {
  qty: number;
  setQty: (q: number) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const booksTotal = qty * ADDITIONAL_BOOK_PRICE;
  const grandTotal = booksTotal + EXTRA_COPIES_SHIPPING_COST;

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="font-serif text-[28px] text-brand-charcoal text-center leading-tight mb-2">
        Get another copy.
      </h1>
      <p className="text-sm text-[hsl(var(--brand-warm-gray))] text-center mb-8">
        Same book. Same recipes. Ships in its own box.
      </p>

      <div className="flex items-center gap-6 mb-4">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="w-10 h-10 rounded-full border border-brand-sand flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
          disabled={qty <= 1}
        >
          <Minus className="w-4 h-4 text-brand-charcoal" />
        </button>
        <span className="text-4xl font-serif text-brand-charcoal w-12 text-center">{qty}</span>
        <button
          onClick={() => setQty(Math.min(5, qty + 1))}
          className="w-10 h-10 rounded-full border border-brand-sand flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
          disabled={qty >= 5}
        >
          <Plus className="w-4 h-4 text-brand-charcoal" />
        </button>
      </div>

      <div className="w-full border-t border-[rgba(45,45,45,0.12)] pt-4 mb-6 space-y-2 text-[13px]">
        <div className="flex justify-between text-brand-charcoal">
          <span>{qty} extra {qty === 1 ? "copy" : "copies"}</span>
          <span>${booksTotal}</span>
        </div>
        <div className="flex justify-between text-brand-charcoal">
          <span className="text-[hsl(var(--brand-warm-gray))]">Shipping</span>
          <span>${EXTRA_COPIES_SHIPPING_COST}</span>
        </div>
        <div className="flex justify-between font-medium text-[15px] text-brand-charcoal pt-2 border-t border-[rgba(45,45,45,0.12)]">
          <span>Due today</span>
          <span>${grandTotal}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="btn btn-md btn-dark w-full"
      >
        Continue — ${grandTotal}
      </button>

      <button
        onClick={onBack}
        className="mt-4 text-sm text-[hsl(var(--brand-warm-gray))] hover:underline transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}

// --- Step 2: Shipping + redirect to Stripe Checkout ---
function StepShipping({
  groupId,
  qty,
  existingAddress,
  onBack,
}: {
  groupId: string;
  qty: number;
  existingAddress: ExtraCopyPurchaseProps["existingAddress"];
  onBack: () => void;
}) {
  const prefillCountry = (() => {
    if (!existingAddress?.country) return "US";
    const match = SUPPORTED_COUNTRIES.find(
      (c) =>
        c.name === existingAddress.country ||
        c.code === existingAddress.country
    );
    return match?.code || "US";
  })();

  const [country, setCountry] = useState(prefillCountry);
  const [recipientName, setRecipientName] = useState(existingAddress?.recipient_name || "");
  const [streetAddress, setStreetAddress] = useState(existingAddress?.street_address || "");
  const [apartmentUnit, setApartmentUnit] = useState(existingAddress?.apartment_unit || "");
  const [city, setCity] = useState(existingAddress?.city || "");
  const [region, setRegion] = useState(existingAddress?.state || "");
  const [postalCode, setPostalCode] = useState(existingAddress?.postal_code || "");
  const [phoneNumber, setPhoneNumber] = useState(existingAddress?.phone_number || "");
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const countryConfig = SUPPORTED_COUNTRIES.find((c) => c.code === country) || SUPPORTED_COUNTRIES[0];

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

    setRedirecting(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-extras-dashboard-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          qty,
          shippingAddress: {
            recipientName: recipientName.trim(),
            streetAddress: streetAddress.trim(),
            apartmentUnit: apartmentUnit.trim() || undefined,
            city: city.trim(),
            state: region.trim(),
            postalCode: postalCode.trim(),
            country: countryConfig.name,
            phoneNumber: phoneNumber.trim() || undefined,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error || "Failed to start checkout");
        setRedirecting(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setRedirecting(false);
    }
  };

  const renderRegionField = () => {
    if (countryConfig.regionType === "dropdown-us") {
      return (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          disabled={redirecting}
          className="w-full h-10 bg-white border border-brand-sand rounded-md px-3 text-sm text-brand-charcoal focus:border-brand-honey focus:ring-2 focus:ring-brand-honey/20 focus:outline-none"
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
          disabled={redirecting}
          className="w-full h-10 bg-white border border-brand-sand rounded-md px-3 text-sm text-brand-charcoal focus:border-brand-honey focus:ring-2 focus:ring-brand-honey/20 focus:outline-none"
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
        disabled={redirecting}
        className={inputClasses}
      />
    );
  };

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-honey mb-4" />
        <p className="text-sm text-[hsl(var(--brand-warm-gray))]">Redirecting to checkout…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="font-serif text-[28px] text-brand-charcoal text-center leading-tight mb-2">
        Where should we send it?
      </h1>
      <p className="text-sm text-[hsl(var(--brand-warm-gray))] text-center mb-6">
        Each extra order ships in its own box, so a different address is OK.
      </p>

      <div className="w-full space-y-3">
        <div>
          <Label className="text-secondary-sm text-gray-500 mb-1 block">Country</Label>
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={redirecting}
            className="w-full h-10 bg-white border border-brand-sand rounded-md px-3 text-sm text-brand-charcoal focus:border-brand-honey focus:ring-2 focus:ring-brand-honey/20 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A8780%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
          >
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-secondary-sm text-gray-500 mb-1 block">Recipient name</Label>
          <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Full name" disabled={redirecting} className={inputClasses} />
        </div>
        <div>
          <Label className="text-secondary-sm text-gray-500 mb-1 block">Street address</Label>
          {mapsLoaded ? (
            <Autocomplete
              onLoad={(ac) => { autocompleteRef.current = ac; }}
              onPlaceChanged={onPlaceSelected}
              options={{ componentRestrictions: { country: country.toLowerCase() }, types: ["address"] }}
            >
              <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Start typing an address..." disabled={redirecting} className={inputClasses} />
            </Autocomplete>
          ) : (
            <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="1234 Main Street" disabled={redirecting} className={inputClasses} />
          )}
        </div>
        <div>
          <Label className="text-secondary-sm text-gray-500 mb-1 block">Apt / Suite <span className="text-gray-400">(optional)</span></Label>
          <Input value={apartmentUnit} onChange={(e) => setApartmentUnit(e.target.value)} placeholder="Optional" disabled={redirecting} className={inputClasses} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-secondary-sm text-gray-500 mb-1 block">City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" disabled={redirecting} className={inputClasses} />
          </div>
          <div>
            <Label className="text-secondary-sm text-gray-500 mb-1 block">{countryConfig.regionLabel}</Label>
            {renderRegionField()}
          </div>
          <div>
            <Label className="text-secondary-sm text-gray-500 mb-1 block">{countryConfig.postalLabel}</Label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={countryConfig.postalPlaceholder} disabled={redirecting} className={inputClasses} />
          </div>
        </div>
        <div>
          <Label className="text-secondary-sm text-gray-500 mb-1 block">Phone <span className="text-gray-400">(optional)</span></Label>
          <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" disabled={redirecting} className={inputClasses} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg mt-3 w-full">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={redirecting}
        className="btn btn-md btn-dark w-full mt-5"
      >
        Continue to payment →
      </button>

      <button onClick={onBack} disabled={redirecting} className="mt-4 text-sm text-[hsl(var(--brand-warm-gray))] hover:underline transition-colors disabled:opacity-50">
        ← Back
      </button>
    </div>
  );
}

// --- Main Orchestrator ---
export function ExtraCopyPurchase({
  groupId,
  existingAddress,
  onBack,
}: ExtraCopyPurchaseProps) {
  const [step, setStep] = useState<Step>("qty");
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col items-center min-h-[60vh] px-6 py-10">
      <div className="w-full max-w-md">
        {step === "qty" && (
          <StepQty
            qty={qty}
            setQty={setQty}
            onContinue={() => setStep("shipping")}
            onBack={onBack}
          />
        )}

        {step === "shipping" && (
          <StepShipping
            groupId={groupId}
            qty={qty}
            existingAddress={existingAddress}
            onBack={() => setStep("qty")}
          />
        )}
      </div>
    </div>
  );
}
