"use client";

import React from 'react';
import { Users, Settings, Package } from 'lucide-react';

export type ProfileTab = 'guests' | 'account' | 'orders';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  guestCounts?: {
    all: number;
    pending: number;
    submitted: number;
  };
}

export function ProfileTabs({ activeTab, onTabChange, guestCounts }: ProfileTabsProps) {
  const tabs = [
    {
      id: 'guests' as ProfileTab,
      label: 'Guest List',
      icon: Users,
      count: guestCounts?.all || 0,
      description: 'Manage your cookbook contributors'
    },
    {
      id: 'account' as ProfileTab,
      label: 'Account',
      icon: Settings,
      description: 'Personal info and preferences'
    },
    {
      id: 'orders' as ProfileTab,
      label: 'Orders',
      icon: Package,
      description: 'Order history and tracking'
    }
  ];

  return (
    <>
      {/* Desktop Tabs */}
      <div className="hidden lg:block mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    mr-2 h-5 w-5 transition-colors
                    ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {tab.label}
                  {tab.id === 'guests' && tab.count && tab.count > 0 && (
                    <span className={`
                      ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden mb-6">
        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center py-3 px-2 rounded-md text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className={`
                  h-5 w-5 mb-1 transition-colors
                  ${isActive ? 'text-gray-900' : 'text-gray-500'}
                `} />
                <span className="text-center leading-tight">{tab.label}</span>
                {tab.id === 'guests' && tab.count && tab.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{tab.count}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}