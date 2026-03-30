"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Minus, Plus, AlertCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { ADDITIONAL_BOOK_PRICE, calculateShipping } from "@/lib/stripe/pricing";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface ExtraCopyPurchaseProps {
  groupId: string;
  bookStatus: string;
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
  existingExtraCopies: number;
  onDone: () => void;
  onBack: () => void;
}

type Step = "qty" | "shipping" | "payment" | "done";

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

const inputClasses = "bg-white border-[#E8E0D5] focus:border-[#D4A854] focus:ring-[#D4A854]/20";

// --- Step 1: Quantity selector ---
function StepQty({
  qty,
  setQty,
  shippingCost,
  onContinue,
  onBack,
}: {
  qty: number;
  setQty: (q: number) => void;
  shippingCost: number;
  onContinue: () => void;
  onBack: () => void;
}) {
  const total = qty * ADDITIONAL_BOOK_PRICE;
  const totalWithShipping = total + shippingCost;

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="font-serif text-[28px] text-[#2D2D2D] text-center leading-tight mb-2">
        Get another copy.
      </h1>
      <p className="text-sm text-[#8A8780] text-center mb-8">
        Same book. Same recipes. Ready when the original ships.
      </p>

      {/* Qty selector */}
      <div className="flex items-center gap-6 mb-4">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="w-10 h-10 rounded-full border border-[#E8E0D5] flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
          disabled={qty <= 1}
        >
          <Minus className="w-4 h-4 text-[#2D2D2D]" />
        </button>
        <span className="text-4xl font-serif text-[#2D2D2D] w-12 text-center">{qty}</span>
        <button
          onClick={() => setQty(Math.min(5, qty + 1))}
          className="w-10 h-10 rounded-full border border-[#E8E0D5] flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
          disabled={qty >= 5}
        >
          <Plus className="w-4 h-4 text-[#2D2D2D]" />
        </button>
      </div>

      {/* Pricing breakdown */}
      <div className="w-full border-t border-[rgba(45,45,45,0.12)] pt-4 mb-6 space-y-2 text-[13px]">
        <div className="flex justify-between text-[#2D2D2D]">
          <span>{qty} {qty === 1 ? "copy" : "copies"}</span>
          <span>${total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8A8780]">Shipping</span>
          {shippingCost > 0 ? (
            <span className="text-[#2D2D2D]">${shippingCost}</span>
          ) : (
            <span className="text-[#14532D]">Free — ships with your book</span>
          )}
        </div>
        <div className="flex justify-between font-medium text-[15px] text-[#2D2D2D] pt-2 border-t border-[rgba(45,45,45,0.12)]">
          <span>Due today</span>
          <span>${totalWithShipping}</span>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-[#2D2D2D] text-[#FAF7F2] rounded-full py-4 text-base font-medium hover:bg-gray-800 transition-colors"
      >
        Continue — ${totalWithShipping}
      </button>

      <button
        onClick={onBack}
        className="mt-4 text-sm text-[#8A8780] hover:underline transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}

// --- Step 2: Shipping ---
function StepShipping({
  groupId,
  existingAddress,
  useSameAddress,
  setUseSameAddress,
  onContinue,
  onBack,
}: {
  groupId: string;
  existingAddress: ExtraCopyPurchaseProps["existingAddress"];
  useSameAddress: boolean;
  setUseSameAddress: (v: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
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
    if (useSameAddress) {
      onContinue();
      return;
    }

    setError(null);
    if (!recipientName.trim()) { setError("Enter the recipient's name"); return; }
    if (!streetAddress.trim()) { setError("Enter the street address"); return; }
    if (!city.trim()) { setError("Enter the city"); return; }
    if (!region.trim()) { setError(`Enter the ${countryConfig.regionLabel.toLowerCase()}`); return; }
    if (!postalCode.trim()) { setError(`Enter the ${countryConfig.postalLabel.toLowerCase()}`); return; }

    setSaving(true);
    try {
      // Reason: Save the new shipping address for this extra copy order
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

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="font-serif text-[28px] text-[#2D2D2D] text-center leading-tight mb-2">
        Where should we send it?
      </h1>
      <p className="text-sm text-[#8A8780] text-center mb-6">
        Confirm the shipping address for your extra copies.
      </p>

      {/* Same address checkbox */}
      {existingAddress && (
        <div className="w-full mb-5">
          <label className="flex items-start gap-3 cursor-pointer p-4 bg-white border border-[#E8E0D5] rounded-xl hover:border-[#D4A854]/50 transition-colors">
            <input
              type="checkbox"
              checked={useSameAddress}
              onChange={(e) => setUseSameAddress(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#D4A854] focus:ring-[#D4A854]"
            />
            <div>
              <p className="text-sm font-medium text-[#2D2D2D]">Ship to same address</p>
              <p className="text-xs text-[#8A8780] mt-0.5">
                {existingAddress.recipient_name} — {existingAddress.street_address}, {existingAddress.city}, {existingAddress.state} {existingAddress.postal_code}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Address form (hidden if using same address) */}
      {!useSameAddress && (
        <div className="w-full space-y-3">
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
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Full name" disabled={saving} className={inputClasses} />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Street address</Label>
            {mapsLoaded ? (
              <Autocomplete
                onLoad={(ac) => { autocompleteRef.current = ac; }}
                onPlaceChanged={onPlaceSelected}
                options={{ componentRestrictions: { country: country.toLowerCase() }, types: ["address"] }}
              >
                <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Start typing an address..." disabled={saving} className={inputClasses} />
              </Autocomplete>
            ) : (
              <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="1234 Main Street" disabled={saving} className={inputClasses} />
            )}
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Apt / Suite <span className="text-gray-400">(optional)</span></Label>
            <Input value={apartmentUnit} onChange={(e) => setApartmentUnit(e.target.value)} placeholder="Optional" disabled={saving} className={inputClasses} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" disabled={saving} className={inputClasses} />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">{countryConfig.regionLabel}</Label>
              {renderRegionField()}
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">{countryConfig.postalLabel}</Label>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={countryConfig.postalPlaceholder} disabled={saving} className={inputClasses} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Phone <span className="text-gray-400">(optional)</span></Label>
            <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" disabled={saving} className={inputClasses} />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg mt-3 w-full">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-[#2D2D2D] text-[#FAF7F2] rounded-full py-4 text-base font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors mt-5"
      >
        {saving ? "Saving..." : "Continue to payment →"}
      </button>

      <button onClick={onBack} className="mt-4 text-sm text-[#8A8780] hover:underline transition-colors">
        ← Back
      </button>
    </div>
  );
}

// --- Step 3: Payment form (inside Stripe Elements) ---
function PaymentForm({
  qty,
  shippingCost,
  paymentIntentId,
  onSuccess,
  onBack,
}: {
  qty: number;
  shippingCost: number;
  paymentIntentId: string;
  onSuccess: (piId: string) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const bookTotal = qty * ADDITIONAL_BOOK_PRICE;
  const grandTotal = bookTotal + shippingCost;

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
          <span>${bookTotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8A8780]">Shipping</span>
          {shippingCost > 0 ? (
            <span className="text-[#2D2D2D]">${shippingCost}</span>
          ) : (
            <span className="text-[#14532D]">Free</span>
          )}
        </div>
        <div className="border-t border-[rgba(45,45,45,0.12)] pt-2">
          <div className="flex justify-between font-medium text-[15px] text-[#2D2D2D]">
            <span>Total</span>
            <span>${grandTotal}</span>
          </div>
        </div>
      </div>

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
        {isSubmitting ? "Processing..." : `Pay $${grandTotal} →`}
      </button>

      <button
        onClick={onBack}
        disabled={isSubmitting}
        className="w-full mt-3 text-sm text-[#8A8780] hover:underline text-center"
      >
        ← Back
      </button>

      <p className="text-xs text-[#8A8780] text-center mt-4">
        Secure checkout powered by <span className="text-[#635BFF] font-medium">Stripe</span>
      </p>
    </div>
  );
}

// --- Step 3 wrapper: creates PaymentIntent + Stripe Elements ---
function StepPayment({
  qty,
  shippingCost,
  groupId,
  onSuccess,
  onBack,
}: {
  qty: number;
  shippingCost: number;
  groupId: string;
  onSuccess: (piId: string) => void;
  onBack: () => void;
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
          body: JSON.stringify({ qty, includeShipping: shippingCost > 0 }),
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
  }, [groupId, qty, shippingCost]);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={onBack} className="text-sm text-[#8A8780] hover:underline">← Go back</button>
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
      <h1 className="font-serif text-[28px] text-[#2D2D2D] text-center leading-tight mb-2">
        Almost done.
      </h1>
      <p className="text-sm text-[#8A8780] text-center mb-6">
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
          shippingCost={shippingCost}
          paymentIntentId={paymentIntentId}
          onSuccess={onSuccess}
          onBack={onBack}
        />
      </Elements>
    </div>
  );
}

// --- Step 4: Done ---
function StepDone({ qty, onDone }: { qty: number; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center w-full text-center py-10">
      <div className="w-14 h-14 rounded-full bg-[#D4A854] flex items-center justify-center mb-5">
        <Check className="w-7 h-7 text-white" />
      </div>
      <h1 className="font-serif text-[28px] text-[#2D2D2D] leading-tight mb-2">
        Done.
      </h1>
      <p className="text-sm text-[#8A8780] mb-8">
        {qty} extra {qty === 1 ? "copy" : "copies"} added. It&apos;ll ship with your book.
      </p>
      <button
        onClick={onDone}
        className="bg-[#2D2D2D] text-[#FAF7F2] rounded-full px-8 py-4 text-base font-medium hover:bg-gray-800 transition-colors"
      >
        Back to your book
      </button>
    </div>
  );
}

// --- Main Orchestrator ---
export function ExtraCopyPurchase({
  groupId,
  bookStatus,
  existingAddress,
  existingExtraCopies,
  onDone,
  onBack,
}: ExtraCopyPurchaseProps) {
  const [step, setStep] = useState<Step>("qty");
  const [qty, setQty] = useState(1);
  const [useSameAddress, setUseSameAddress] = useState(!!existingAddress);
  const [updatingDb, setUpdatingDb] = useState(false);

  // Reason: Shipping is free ONLY when book is not yet printed AND shipping to same address.
  // If printed → always charge shipping (separate shipment).
  // If not printed but different address → also charge shipping (can't bundle).
  const needsShipping = bookStatus === "printed" || !useSameAddress;
  const shippingCost = needsShipping ? calculateShipping(qty, "US") : 0;

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setUpdatingDb(true);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/extra-copies-payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          additionalCopies: qty,
          paymentIntentId,
          amount: (qty * ADDITIONAL_BOOK_PRICE + shippingCost) * 100,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      // Reason: Payment succeeded, DB update is best-effort. User will see updated count on reload.
    } finally {
      setUpdatingDb(false);
      setStep("done");
    }
  };

  if (updatingDb) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4A854] mb-4" />
        <p className="text-sm text-[#8A8780]">Updating your order...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[60vh] px-6 py-10">
      <div className="w-full max-w-md">
        {step === "qty" && (
          <StepQty
            qty={qty}
            setQty={setQty}
            shippingCost={shippingCost}
            onContinue={() => setStep("shipping")}
            onBack={onBack}
          />
        )}

        {step === "shipping" && (
          <StepShipping
            groupId={groupId}
            existingAddress={existingAddress}
            useSameAddress={useSameAddress}
            setUseSameAddress={setUseSameAddress}
            onContinue={() => setStep("payment")}
            onBack={() => setStep("qty")}
          />
        )}

        {step === "payment" && (
          <StepPayment
            qty={qty}
            shippingCost={shippingCost}
            groupId={groupId}
            onSuccess={handlePaymentSuccess}
            onBack={() => setStep("shipping")}
          />
        )}

        {step === "done" && (
          <StepDone qty={qty} onDone={onDone} />
        )}
      </div>
    </div>
  );
}
