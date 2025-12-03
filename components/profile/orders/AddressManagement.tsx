"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getUserAddresses, deleteAddress, setDefaultAddress } from '@/lib/supabase/addresses';
import { AddressForm } from './AddressForm';
import type { ShippingAddress } from '@/lib/types/database';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Phone, 
  Loader2, 
  AlertCircle,
  CheckCircle 
} from 'lucide-react';

export function AddressManagement() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load addresses on component mount
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await getUserAddresses();
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setAddresses(data || []);
    } catch (err) {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setShowAddForm(true);
    setEditingAddress(null);
  };

  const handleEditAddress = (address: ShippingAddress) => {
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    loadAddresses(); // Reload the list
    setSuccess(editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingAddress(null);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      setActionLoading(addressId);
      setError(null);
      
      const { error: setDefaultError } = await setDefaultAddress(addressId);
      
      if (setDefaultError) {
        setError(setDefaultError);
        return;
      }

      await loadAddresses(); // Refresh the list
      setSuccess('Default address updated!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to set default address');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAddress = async (addressId: string, recipientName: string) => {
    if (!confirm(`Are you sure you want to delete the address for ${recipientName}?`)) {
      return;
    }

    try {
      setActionLoading(addressId);
      setError(null);
      
      const { error: deleteError } = await deleteAddress(addressId);
      
      if (deleteError) {
        setError(deleteError);
        return;
      }

      await loadAddresses(); // Refresh the list
      setSuccess('Address deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete address');
    } finally {
      setActionLoading(null);
    }
  };

  const formatAddress = (address: ShippingAddress) => {
    const parts = [address.street_address];
    if (address.apartment_unit) {
      parts[0] += `, ${address.apartment_unit}`;
    }
    parts.push(`${address.city}, ${address.state} ${address.postal_code}`);
    if (address.country !== 'United States') {
      parts.push(address.country);
    }
    return parts.join('\n');
  };

  // Show form if adding or editing
  if (showAddForm) {
    return (
      <div className="space-y-6">
        <AddressForm
          address={editingAddress}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Shipping Addresses</h3>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Shipping Addresses</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your delivery addresses for cookbook orders
          </p>
        </div>
        <Button
          onClick={handleAddAddress}
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Addresses List */}
      <div className="space-y-4">
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
                address.is_default ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {/* Default Badge - Moved inside the content area */}

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Address Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {address.recipient_name}
                        </h4>
                        {address.is_default && (
                          <span className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                            <Star className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-line mb-2">
                        {formatAddress(address)}
                      </div>
                      {address.phone_number && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {address.phone_number}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:gap-2 lg:min-w-[100px]">
                  {!address.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      disabled={actionLoading === address.id}
                      className="text-xs"
                    >
                      {actionLoading === address.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Star className="h-3 w-3 mr-1" />
                          Set Default
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAddress(address)}
                    disabled={!!actionLoading}
                    className="text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id, address.recipient_name)}
                    disabled={actionLoading === address.id}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {actionLoading === address.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first shipping address to get started with cookbook orders.
            </p>
            <Button
              onClick={handleAddAddress}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}