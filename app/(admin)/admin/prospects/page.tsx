"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';

interface PurchaseIntent {
  id: string;
  email: string;
  selected_tier: string;
  user_type: 'couple' | 'gift_giver';
  status: 'pending' | 'contacted' | 'paid' | 'cancelled';
  couple_first_name: string | null;
  couple_last_name: string | null;
  partner_first_name: string | null;
  partner_last_name: string | null;
  wedding_date: string | null;
  wedding_date_undecided: boolean;
  planning_stage: string | null;
  guest_count: string | null;
  gift_giver_name: string | null;
  relationship: string | null;
  timeline: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminProspectsPage() {
  const [prospects, setProspects] = useState<PurchaseIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<PurchaseIntent | null>(null);
  const [activationEmail, setActivationEmail] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoad = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!isAdminEmail(user?.email)) {
      router.push('/');
      return;
    }

    setIsAdmin(true);
    await loadProspects();
  };

  const loadProspects = async () => {
    setLoading(true);
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('purchase_intents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading prospects:', error);
      alert(`Error loading prospects: ${error.message}`);
    } else {
      setProspects(data || []);
    }

    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: PurchaseIntent['status']) => {
    setUpdating(id);
    const supabase = createSupabaseClient();

    const { error } = await supabase
      .from('purchase_intents')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert(`Error updating status: ${error.message}`);
    } else {
      await loadProspects();
    }

    setUpdating(null);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      contacted: 'bg-blue-100 text-blue-800 border-blue-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const labels: Record<string, string> = {
      'the-book': 'The Book ($149)',
      'family-collection': 'Family ($249)',
      'kitchen-table': 'Kitchen Table ($349)',
    };
    return labels[tier] || tier;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const handleGenerateActivationLink = (prospect: PurchaseIntent) => {
    setSelectedProspect(prospect);
    setActivationEmail(prospect.email);
    setActivationLink(null);
    setActivationError(null);
    setShowActivationModal(true);
  };

  const handleCreateActivationToken = async () => {
    if (!selectedProspect) return;

    setGeneratingToken(true);
    setActivationError(null);

    try {
      const response = await fetch('/api/v1/purchase-activations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseIntentId: selectedProspect.id,
          email: activationEmail.trim() || selectedProspect.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate activation link');
      }

      setActivationLink(data.activationUrl);
    } catch (err) {
      console.error('Error generating activation link:', err);
      setActivationError(err instanceof Error ? err.message : 'Failed to generate activation link');
    } finally {
      setGeneratingToken(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  const closeModal = () => {
    setShowActivationModal(false);
    setSelectedProspect(null);
    setActivationEmail('');
    setActivationLink(null);
    setActivationError(null);
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4A854] mx-auto mb-4"></div>
          <p className="text-gray-600">{isAdmin ? 'Loading prospects...' : 'Checking access...'}</p>
        </div>
      </div>
    );
  }

  const pendingCount = prospects.filter(p => p.status === 'pending').length;
  const contactedCount = prospects.filter(p => p.status === 'contacted').length;
  const paidCount = prospects.filter(p => p.status === 'paid').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Prospects</h1>
              <p className="text-gray-600">
                Soft launch purchase intents. Contact within 24 hours.
              </p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Admin
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold">{prospects.length}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6 border-2 border-yellow-200">
            <div className="text-sm text-yellow-800 mb-1">🔔 Pending</div>
            <div className="text-3xl font-bold text-yellow-800">{pendingCount}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <div className="text-sm text-blue-800 mb-1">Contacted</div>
            <div className="text-3xl font-bold text-blue-800">{contactedCount}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-sm text-green-800 mb-1">Paid</div>
            <div className="text-3xl font-bold text-green-800">{paidCount}</div>
          </div>
        </div>

        {/* Alert for pending */}
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>{pendingCount} prospect{pendingCount > 1 ? 's' : ''} waiting!</strong> Contact them within 24 hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {prospects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-gray-500 text-lg">No prospects yet.</p>
              <p className="text-gray-400 text-sm mt-2">They will appear here after completing the onboarding flow.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type / Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Couple
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prospects.map((prospect) => {
                    const { date, time } = formatDate(prospect.created_at);
                    return (
                      <tr key={prospect.id} className={`hover:bg-gray-50 ${prospect.status === 'pending' ? 'bg-yellow-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{prospect.email}</div>
                          {prospect.user_type === 'gift_giver' && prospect.gift_giver_name && (
                            <div className="text-xs text-gray-500">From: {prospect.gift_giver_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 capitalize">{prospect.user_type.replace('_', ' ')}</div>
                          <div className="text-xs text-[#D4A854] font-medium">{getTierBadge(prospect.selected_tier)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {prospect.couple_first_name || '-'} {prospect.couple_last_name || ''}
                            {prospect.partner_first_name && (
                              <span> & {prospect.partner_first_name} {prospect.partner_last_name || ''}</span>
                            )}
                          </div>
                          {prospect.wedding_date && (
                            <div className="text-xs text-gray-500">
                              Wedding: {new Date(prospect.wedding_date).toLocaleDateString()}
                            </div>
                          )}
                          {prospect.wedding_date_undecided && (
                            <div className="text-xs text-gray-400 italic">Date TBD</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-500 space-y-1">
                            {prospect.planning_stage && <div>Stage: {prospect.planning_stage}</div>}
                            {prospect.guest_count && <div>Guests: {prospect.guest_count}</div>}
                            {prospect.relationship && <div>Relationship: {prospect.relationship}</div>}
                            {prospect.timeline && <div>Timeline: {prospect.timeline}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {getStatusBadge(prospect.status)}
                            <select
                              value={prospect.status}
                              onChange={(e) => updateStatus(prospect.id, e.target.value as PurchaseIntent['status'])}
                              disabled={updating === prospect.id}
                              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white disabled:opacity-50"
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="paid">Paid</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {prospect.status === 'paid' && (
                              <button
                                onClick={() => handleGenerateActivationLink(prospect)}
                                className="text-xs px-3 py-1.5 bg-[#D4A854] text-white rounded hover:bg-[#c49b4a] transition-colors font-medium mt-1"
                              >
                                Generate Activation Link
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{date}</div>
                          <div className="text-xs text-gray-500">{time}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadProspects}
            className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            ↻ Refresh List
          </button>
        </div>
      </div>

      {/* Activation Link Modal */}
      {showActivationModal && selectedProspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Generate Activation Link</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Prospect Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 mb-2">Prospect Information:</div>
                <div className="space-y-1 text-sm">
                  <div><strong>Email:</strong> {selectedProspect.email}</div>
                  <div><strong>Type:</strong> {selectedProspect.user_type === 'couple' ? 'Couple' : 'Gift Giver'}</div>
                  {selectedProspect.couple_first_name && (
                    <div>
                      <strong>Couple:</strong> {selectedProspect.couple_first_name}
                      {selectedProspect.partner_first_name && ` & ${selectedProspect.partner_first_name}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Input */}
              <div className="mb-6">
                <label htmlFor="activation-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Activation Email
                </label>
                <input
                  id="activation-email"
                  type="email"
                  value={activationEmail}
                  onChange={(e) => setActivationEmail(e.target.value)}
                  placeholder={selectedProspect.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: {selectedProspect.email}. Change if needed (e.g., for multiple accounts).
                </p>
              </div>

              {/* Error Message */}
              {activationError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{activationError}</p>
                </div>
              )}

              {/* Activation Link Display */}
              {activationLink && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800 mb-2">✅ Activation Link Generated!</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={activationLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(activationLink)}
                      className="px-4 py-2 bg-[#D4A854] text-white rounded hover:bg-[#c49b4a] transition-colors text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    Send this link to the user. They will use it to create their password and activate their account.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {activationLink ? 'Close' : 'Cancel'}
                </button>
                {!activationLink && (
                  <button
                    onClick={handleCreateActivationToken}
                    disabled={generatingToken || !activationEmail.trim()}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      generatingToken || !activationEmail.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#D4A854] text-white hover:bg-[#c49b4a]'
                    }`}
                  >
                    {generatingToken ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Generating...
                      </>
                    ) : (
                      'Generate Link'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
