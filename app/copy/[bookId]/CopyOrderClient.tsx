"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Minus, Plus, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import {
  ADDITIONAL_BOOK_PRICE,
  EXTRA_COPIES_SHIPPING_COST,
} from "@/lib/stripe/pricing";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

interface BookData {
  id: string;
  title: string;
  bookStatus: string;
  closeDate: string | null;
  coverPhotoUrl: string | null;
  recipeCount: number;
  contributorCount: number;
}

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

const SUPPORTED_COUNTRIES: {
  code: string;
  name: string;
  postalLabel: string;
  postalPlaceholder: string;
  regionLabel: string;
  regionType: "dropdown-us" | "dropdown-mx" | "text";
}[] = [
  { code: "US", name: "United States", postalLabel: "ZIP", postalPlaceholder: "12345", regionLabel: "State", regionType: "dropdown-us" },
  { code: "MX", name: "Mexico", postalLabel: "Código Postal", postalPlaceholder: "01000", regionLabel: "Estado", regionType: "dropdown-mx" },
  { code: "GB", name: "United Kingdom", postalLabel: "Postcode", postalPlaceholder: "SW1A 1AA", regionLabel: "County", regionType: "text" },
  { code: "CA", name: "Canada", postalLabel: "Postal Code", postalPlaceholder: "K1A 0B1", regionLabel: "Province", regionType: "text" },
  { code: "FR", name: "France", postalLabel: "Postal Code", postalPlaceholder: "75001", regionLabel: "Region", regionType: "text" },
  { code: "DE", name: "Germany", postalLabel: "Postal Code", postalPlaceholder: "10115", regionLabel: "Region", regionType: "text" },
  { code: "ES", name: "Spain", postalLabel: "Postal Code", postalPlaceholder: "28001", regionLabel: "Province", regionType: "text" },
  { code: "IT", name: "Italy", postalLabel: "Postal Code", postalPlaceholder: "00100", regionLabel: "Region", regionType: "text" },
];

const inputClasses =
  "bg-white border-brand-sand focus:border-brand-honey focus:ring-brand-honey/20";

const selectClasses =
  "w-full h-10 bg-white border border-brand-sand rounded-md px-3 text-sm text-brand-charcoal focus:border-brand-honey focus:ring-2 focus:ring-brand-honey/20 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238A8780%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function CopyOrderClient({ book }: { book: BookData }) {
  const [step, setStep] = useState<"order" | "shipping">("order");
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [country, setCountry] = useState("US");
  const [recipientName, setRecipientName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [apartmentUnit, setApartmentUnit] = useState("");
  const [city, setCity] = useState("");
  const [regionState, setRegionState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const countryConfig = SUPPORTED_COUNTRIES.find((c) => c.code === country) || SUPPORTED_COUNTRIES[0];
  const subtotal = qty * ADDITIONAL_BOOK_PRICE;
  const total = subtotal + EXTRA_COPIES_SHIPPING_COST;

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setRegionState("");
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
    if (newRegion) setRegionState(newRegion);
    if (newPostal) setPostalCode(newPostal);
  }, []);

  const handleOrderContinue = () => {
    setEmailError("");
    if (!email.trim()) {
      setEmailError("Enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setStep("shipping");
  };

  const handleShippingContinue = async () => {
    setShippingError(null);
    if (!recipientName.trim()) { setShippingError("Enter the recipient's name."); return; }
    if (!streetAddress.trim()) { setShippingError("Enter the street address."); return; }
    if (!city.trim()) { setShippingError("Enter the city."); return; }
    if (!regionState.trim()) { setShippingError(`Enter the ${countryConfig.regionLabel.toLowerCase()}.`); return; }
    if (!postalCode.trim()) { setShippingError(`Enter the ${countryConfig.postalLabel.toLowerCase()}.`); return; }

    setRedirecting(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-copy-order-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          qty,
          email: email.trim(),
          shippingAddress: {
            recipientName: recipientName.trim(),
            streetAddress: streetAddress.trim(),
            apartmentUnit: apartmentUnit.trim() || undefined,
            city: city.trim(),
            state: regionState.trim(),
            postalCode: postalCode.trim(),
            country: countryConfig.name,
            phoneNumber: phoneNumber.trim() || undefined,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setShippingError(data.error || "Failed to start checkout.");
        setRedirecting(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : "Something went wrong.");
      setRedirecting(false);
    }
  };

  const renderRegionField = () => {
    if (countryConfig.regionType === "dropdown-us") {
      return (
        <select
          value={regionState}
          onChange={(e) => setRegionState(e.target.value)}
          disabled={redirecting}
          className={selectClasses}
        >
          <option value="">State</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      );
    }
    if (countryConfig.regionType === "dropdown-mx") {
      return (
        <select
          value={regionState}
          onChange={(e) => setRegionState(e.target.value)}
          disabled={redirecting}
          className={selectClasses}
        >
          <option value="">Estado</option>
          {MX_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      );
    }
    return (
      <Input
        value={regionState}
        onChange={(e) => setRegionState(e.target.value)}
        placeholder={countryConfig.regionLabel}
        disabled={redirecting}
        className={inputClasses}
      />
    );
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-honey mb-4" />
        <p className="text-sm text-[#8A8780]">Redirecting to checkout…</p>
      </div>
    );
  }

  // Step: Order
  if (step === "order") {
    return (
      <div className="min-h-screen bg-[#F5F3EF]">
        <div className="flex items-start justify-center min-h-full px-6 pt-6 pb-16">
          <div className="w-full max-w-[560px]">
            <div className="flex justify-center mb-6">
              <Image
                src="/images/SmallPlates_logo_horizontal.png"
                alt="Small Plates & Co."
                width={180}
                height={36}
                priority
              />
            </div>

            <p className="text-xs text-[#8A8780] uppercase tracking-[0.08em] text-center mb-2">
              A copy is available
            </p>

            <h1 className="font-serif text-[30px] text-brand-charcoal text-center leading-tight mb-2">
              {book.title}
            </h1>

            <p className="text-sm text-[#8A8780] text-center mb-8">
              {book.recipeCount} recipes
              {book.contributorCount > 0 && ` from ${book.contributorCount} people`}
              {book.closeDate && ` \u00B7 Closed ${formatDate(book.closeDate)}`}
            </p>

            <div className="bg-white border border-[rgba(45,45,45,0.12)] rounded-[10px] px-[18px] py-[14px] mb-6 text-[13px] space-y-2">
              <div className="flex justify-between text-brand-charcoal">
                <span>One copy</span>
                <span>${ADDITIONAL_BOOK_PRICE}</span>
              </div>
              <div className="flex justify-between text-brand-charcoal">
                <span className="text-[#8A8780]">Shipping</span>
                <span>${EXTRA_COPIES_SHIPPING_COST}</span>
              </div>
              <p className="text-[11px] text-[#8A8780] pt-1">
                ${ADDITIONAL_BOOK_PRICE} per copy. ${EXTRA_COPIES_SHIPPING_COST} shipping. That&apos;s it.
              </p>
            </div>

            <p className="text-xs text-[#8A8780] uppercase tracking-[0.08em] text-center mb-3">
              How many copies?
            </p>
            <div className="flex items-center justify-center gap-6 mb-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-full border border-brand-sand flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
                disabled={qty <= 1}
              >
                <Minus className="w-4 h-4 text-brand-charcoal" />
              </button>
              <span className="text-4xl font-serif text-brand-charcoal w-12 text-center tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(5, qty + 1))}
                className="w-10 h-10 rounded-full border border-brand-sand flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
                disabled={qty >= 5}
              >
                <Plus className="w-4 h-4 text-brand-charcoal" />
              </button>
            </div>
            <p className="text-sm text-[#8A8780] text-center mb-8">
              Total: ${total} ({qty} {qty === 1 ? "copy" : "copies"} + ${EXTRA_COPIES_SHIPPING_COST} shipping)
            </p>

            <div className="mb-6">
              <Label className="text-xs text-gray-500 mb-1 block">Your email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="you@example.com"
                className={inputClasses}
              />
              {emailError && (
                <div className="flex items-center gap-2 mt-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{emailError}</p>
                </div>
              )}
              <p className="text-[11px] text-[#8A8780] mt-1.5">
                Receipt and tracking details will be sent here.
              </p>
            </div>

            <button
              onClick={handleOrderContinue}
              className="w-full bg-brand-charcoal text-[#FAF7F2] rounded-full py-4 text-base font-medium hover:bg-gray-800 transition-colors"
            >
              Order &mdash; ${total} &rarr;
            </button>

            <p className="text-[11px] text-[#8A8780] text-center mt-4 leading-relaxed">
              Questions?{" "}
              <a
                href="mailto:team@smallplatesandcompany.com"
                className="underline hover:text-brand-charcoal transition-colors"
              >
                team@smallplatesandcompany.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step: Shipping
  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="flex items-start justify-center min-h-full px-6 pt-6 pb-16">
        <div className="w-full max-w-[520px]">
          <div className="flex justify-center mb-10">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={200}
              height={40}
            />
          </div>

          <h1 className="font-serif text-[28px] text-brand-charcoal text-center leading-tight mb-2">
            Where should we send it?
          </h1>
          <p className="text-sm text-[#8A8780] text-center mb-6">
            Enter the shipping address for your {qty === 1 ? "copy" : "copies"}.
          </p>

          <div className="bg-white border border-brand-sand rounded-[10px] px-[18px] py-[14px] mb-6 text-[13px] space-y-1.5">
            <div className="flex justify-between text-brand-charcoal">
              <span>{qty} {qty === 1 ? "copy" : "copies"}</span>
              <span>${subtotal}</span>
            </div>
            <div className="flex justify-between text-brand-charcoal">
              <span className="text-[#8A8780]">Shipping</span>
              <span>${EXTRA_COPIES_SHIPPING_COST}</span>
            </div>
            <div className="flex justify-between font-medium text-[15px] text-brand-charcoal pt-2 border-t border-[rgba(45,45,45,0.12)]">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Country</Label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                disabled={redirecting}
                className={selectClasses}
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
                disabled={redirecting}
                className={inputClasses}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Street address</Label>
              {mapsLoaded ? (
                <Autocomplete
                  onLoad={(ac) => { autocompleteRef.current = ac; }}
                  onPlaceChanged={onPlaceSelected}
                  options={{ componentRestrictions: { country: country.toLowerCase() }, types: ["address"] }}
                >
                  <Input
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Start typing an address..."
                    disabled={redirecting}
                    className={inputClasses}
                  />
                </Autocomplete>
              ) : (
                <Input
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="1234 Main Street"
                  disabled={redirecting}
                  className={inputClasses}
                />
              )}
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">
                Apt / Suite <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                value={apartmentUnit}
                onChange={(e) => setApartmentUnit(e.target.value)}
                placeholder="Optional"
                disabled={redirecting}
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
                  disabled={redirecting}
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
                  disabled={redirecting}
                  className={inputClasses}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">
                Phone <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={redirecting}
                className={inputClasses}
              />
            </div>
          </div>

          {shippingError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg mt-3 w-full">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{shippingError}</p>
            </div>
          )}

          <button
            onClick={handleShippingContinue}
            disabled={redirecting}
            className="w-full bg-brand-charcoal text-[#FAF7F2] rounded-full py-4 text-base font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors mt-5"
          >
            Continue to payment &rarr;
          </button>

          <button
            onClick={() => setStep("order")}
            disabled={redirecting}
            className="w-full mt-4 text-sm text-[#8A8780] hover:underline text-center disabled:opacity-50"
          >
            &larr; Back
          </button>
        </div>
      </div>
    </div>
  );
}
