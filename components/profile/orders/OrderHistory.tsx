"use client";

import React, { useState } from 'react';
import { Package, Clock, CheckCircle, Truck, MapPin } from 'lucide-react';
import { AddressManagement } from './AddressManagement';

export function OrderHistory() {
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');

  // Mock data for demonstration
  const mockOrders = [
    {
      id: '1',
      orderNumber: 'SPL-2024-001',
      date: '2024-01-15',
      status: 'processing',
      total: 'Waitlist Price',
      cookbook: {
        title: 'Waitlist Cookbook Print',
        recipes: 'Unknown',
        cover: 'Hardcover'
      }
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-amber-500" />;
      case 'processing': return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped': return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processing': return 'In progress';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Orders & Shipping</h2>
        <p className="text-gray-600 mt-1">Manage your orders and shipping addresses</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'orders'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="inline-block h-4 w-4 mr-2" />
            Order History
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'addresses'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MapPin className="inline-block h-4 w-4 mr-2" />
            Shipping Addresses
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {mockOrders.length > 0 ? (
            mockOrders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.cookbook.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Order #{order.orderNumber} • {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-lg font-bold text-gray-900">{order.total}</span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recipes</p>
                    <p className="text-sm font-medium text-gray-900">{order.cookbook.recipes}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cover Type</p>
                    <p className="text-sm font-medium text-gray-900">{order.cookbook.cover}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                    <p className="text-sm font-medium text-gray-900">{getStatusText(order.status)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium">
                    View Details
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                    Order Another Copy
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete your guest list to create your first cookbook.
              </p>
            </div>
          )}

          {/* Empty State Enhancement */}
          {mockOrders.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to create your cookbook?</h3>
              <p className="text-gray-600 mb-4">
                Once you have collected recipes from your guests, you&apos;ll be able to order your printed cookbook here.
              </p>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium">
                Go to Guest List
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <AddressManagement />
      )}
    </div>
  );
}