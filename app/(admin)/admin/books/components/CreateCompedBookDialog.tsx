'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, Calendar } from 'lucide-react';
import { COMPED_EMAILS } from '@/lib/config/admin';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format } from 'date-fns';

interface CreateCompedBookDialogProps {
  onCreated: () => void;
}

type UserType = 'couple' | 'gift_giver';

export default function CreateCompedBookDialog({ onCreated }: CreateCompedBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [ownerEmail, setOwnerEmail] = useState(COMPED_EMAILS[0]);
  const [userType, setUserType] = useState<UserType>('gift_giver');
  const [coupleFirstName, setCoupleFirstName] = useState('');
  const [partnerFirstName, setPartnerFirstName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [weddingDate, setWeddingDate] = useState<Date | undefined>();
  const [dateUndecided, setDateUndecided] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const resetForm = useCallback(() => {
    setOwnerEmail(COMPED_EMAILS[0]);
    setUserType('gift_giver');
    setCoupleFirstName('');
    setPartnerFirstName('');
    setRelationship('');
    setWeddingDate(undefined);
    setDateUndecided(false);
    setCalendarOpen(false);
    setError('');
  }, []);

  const isValid = ownerEmail && coupleFirstName.trim() && partnerFirstName.trim() &&
    (userType === 'couple' || relationship);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/v1/admin/books/create-comped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail,
          coupleFirstName: coupleFirstName.trim(),
          partnerFirstName: partnerFirstName.trim(),
          relationship: userType === 'couple' ? 'couple' : relationship,
          weddingDate: dateUndecided ? null : (weddingDate ? format(weddingDate, 'yyyy-MM-dd') : null),
          weddingDateUndecided: dateUndecided,
          userType,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to create book');
        setSubmitting(false);
        return;
      }

      resetForm();
      setOpen(false);
      onCreated();
    } catch {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#D4A854] text-white hover:bg-[#c49b4a] transition-colors">
          <Plus className="w-4 h-4" />
          Free Book
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Free Book</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Creates a fully active book without Stripe payment.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Owner email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Book owner</label>
            <select
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none bg-white"
            >
              {COMPED_EMAILS.map((email) => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>
          </div>

          {/* User type — gift_giver prominent, couple as text link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Who is setting up the book?</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUserType('gift_giver')}
                className={`flex-1 py-2.5 text-sm rounded-lg border transition-colors ${
                  userType === 'gift_giver'
                    ? 'border-[#D4A854] bg-[#FBF7F0] text-[#2D2D2D] font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                Gift giver
              </button>
              <button
                onClick={() => setUserType('couple')}
                className={`text-sm transition-colors ${
                  userType === 'couple'
                    ? 'text-[#D4A854] font-medium underline underline-offset-2'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                or the couple
              </button>
            </div>
          </div>

          {/* Couple names */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {userType === 'couple' ? 'Your name' : "Partner 1's name"}
            </label>
            <input
              type="text"
              value={coupleFirstName}
              onChange={(e) => setCoupleFirstName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {userType === 'couple' ? "Partner's name" : "Partner 2's name"}
            </label>
            <input
              type="text"
              value={partnerFirstName}
              onChange={(e) => setPartnerFirstName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none"
              placeholder="First name"
            />
          </div>

          {/* Relationship — only for gift giver */}
          {userType === 'gift_giver' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship to couple</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#D4A854] focus:border-transparent outline-none bg-white"
              >
                <option value="">Select...</option>
                <option value="friend">Friend</option>
                <option value="family">Family</option>
                <option value="bridesmaid">Bridesmaid</option>
                <option value="wedding-planner">Wedding planner</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Wedding date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Wedding date</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCalendarOpen(!calendarOpen)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm text-left flex items-center gap-2 transition-colors ${
                  weddingDate ? 'border-[#D4A854] text-[#2D2D2D]' : 'border-gray-200 text-gray-400'
                } ${dateUndecided ? 'opacity-50' : ''}`}
                disabled={dateUndecided}
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                {weddingDate ? format(weddingDate, 'MMMM d, yyyy') : 'Select date'}
              </button>
              {calendarOpen && !dateUndecided && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2">
                  <DayPicker
                    mode="single"
                    selected={weddingDate}
                    onSelect={(d) => { setWeddingDate(d || undefined); if (d) setCalendarOpen(false); }}
                  />
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dateUndecided}
                onChange={(e) => { setDateUndecided(e.target.checked); if (e.target.checked) { setWeddingDate(undefined); setCalendarOpen(false); } }}
                className="w-4 h-4 rounded border-gray-300 text-[#D4A854] focus:ring-[#D4A854]"
              />
              <span className="text-sm text-gray-600">Not decided yet</span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#D4A854] hover:bg-[#c49b4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Book'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
