"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAddress, updateAddress } from '@/lib/supabase/addresses';
import type { ShippingAddress } from '@/lib/types/database';
import { CheckCircle, AlertCircle, Loader2, MapPin } from 'lucide-react';

interface AddressFormProps {
  address?: ShippingAddress | null;
  onSuccess: () => void;
  onCancel: () => void;
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

export function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const [recipientName, setRecipientName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartmentUnit, setApartmentUnit] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isEditing = !!address;

  // Load existing address data for editing
  useEffect(() => {
    if (address) {
      setRecipientName(address.recipient_name);
      setStreetAddress(address.street_address);
      setApartmentUnit(address.apartment_unit || '');
      setCity(address.city);
      setState(address.state);
      setPostalCode(address.postal_code);
      setCountry(address.country);
      setPhoneNumber(address.phone_number || '');
      setIsDefault(address.is_default);
    }
  }, [address]);

  const validateForm = () => {
    if (!recipientName.trim()) {
      setError('Please enter the recipient name');
      return false;
    }

    if (!streetAddress.trim()) {
      setError('Please enter the street address');
      return false;
    }

    if (!city.trim()) {
      setError('Please enter the city');
      return false;
    }

    if (!state.trim()) {
      setError('Please select a state');
      return false;
    }

    if (!postalCode.trim()) {
      setError('Please enter the postal code');
      return false;
    }

    // US ZIP code validation
    if (country === 'United States' && !/^\d{5}(-\d{4})?$/.test(postalCode.trim())) {
      setError('Please enter a valid US ZIP code (e.g., 12345 or 12345-6789)');
      return false;
    }

    // Phone number validation (optional field)
    if (phoneNumber.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const addressData = {
        recipient_name: recipientName.trim(),
        street_address: streetAddress.trim(),
        apartment_unit: apartmentUnit.trim() || null,
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country: country.trim(),
        phone_number: phoneNumber.trim() || null,
        is_default: isDefault,
      };

      let result;
      if (isEditing && address) {
        result = await updateAddress(address.id, addressData);
      } else {
        result = await createAddress(addressData);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      setError('Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isEditing) {
      // Reset form for new address
      setRecipientName('');
      setStreetAddress('');
      setApartmentUnit('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('United States');
      setPhoneNumber('');
      setIsDefault(false);
    }
    setError(null);
    setSuccess(false);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Shipping Address' : 'Add New Shipping Address'}
        </h3>
      </div>

      {/* Recipient Name */}
      <div>
        <Label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-1">
          Recipient Name *
        </Label>
        <Input
          id="recipientName"
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className="w-full"
          placeholder="Full name of the person receiving the package"
          required
          disabled={loading}
        />
      </div>

      {/* Street Address */}
      <div>
        <Label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
          Street Address *
        </Label>
        <Input
          id="streetAddress"
          type="text"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          className="w-full"
          placeholder="1234 Main Street"
          required
          disabled={loading}
        />
      </div>

      {/* Apartment/Unit */}
      <div>
        <Label htmlFor="apartmentUnit" className="block text-sm font-medium text-gray-700 mb-1">
          Apartment, Suite, Unit, etc.
        </Label>
        <Input
          id="apartmentUnit"
          type="text"
          value={apartmentUnit}
          onChange={(e) => setApartmentUnit(e.target.value)}
          className="w-full"
          placeholder="Apt 123, Suite 456, etc. (optional)"
          disabled={loading}
        />
      </div>

      {/* City, State, ZIP Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City */}
        <div>
          <Label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </Label>
          <Input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full"
            placeholder="City"
            required
            disabled={loading}
          />
        </div>

        {/* State */}
        <div>
          <Label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </Label>
          <Select value={state} onValueChange={setState} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((stateName) => (
                <SelectItem key={stateName} value={stateName}>
                  {stateName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Postal Code */}
        <div>
          <Label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code *
          </Label>
          <Input
            id="postalCode"
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="w-full"
            placeholder="12345"
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full"
          placeholder="+1 (555) 123-4567"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional - used by shipping carrier for delivery notifications
        </p>
      </div>

      {/* Default Address Toggle */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="isDefault"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={loading}
        />
        <Label htmlFor="isDefault" className="text-sm text-blue-900 cursor-pointer">
          Set as my default shipping address
        </Label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600">
            Address {isEditing ? 'updated' : 'added'} successfully!
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Address' : 'Add Address'}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}