'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';

interface CreateCompedBookDialogProps {
  onCreated: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateCompedBookDialog({ onCreated }: CreateCompedBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amountCash, setAmountCash] = useState('');
  const [bookQuantity, setBookQuantity] = useState('1');
  const [isDemo, setIsDemo] = useState(false);

  const resetForm = useCallback(() => {
    setEmail('');
    setCustomerName('');
    setAmountCash('');
    setBookQuantity('1');
    setIsDemo(false);
    setError('');
    setSuccess(null);
  }, []);

  const amountNum = Number(amountCash);
  const qtyNum = parseInt(bookQuantity, 10);
  const isValid =
    EMAIL_RE.test(email.trim()) &&
    customerName.trim().length > 0 &&
    Number.isFinite(amountNum) &&
    amountNum >= 0 &&
    Number.isInteger(qtyNum) &&
    qtyNum >= 1;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      const res = await fetch('/api/v1/admin/books/create-comped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          customerName: customerName.trim(),
          amountCashDollars: amountNum,
          bookQuantity: qtyNum,
          isDemo,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to create book');
        setSubmitting(false);
        return;
      }

      setSuccess(`Magic link sent to ${result.email}. They'll finish setup themselves.`);
      onCreated();
      // Reason: leave dialog open briefly so the admin sees confirmation, then auto-close.
      setTimeout(() => {
        resetForm();
        setOpen(false);
      }, 2200);
    } catch {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-brand-honey text-white hover:bg-brand-honey-dark transition-colors">
          <Plus className="w-4 h-4" />
          Cash/Comped Book
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Cash/Comped Book</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Send the customer a magic link. They&apos;ll set up the book themselves.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Customer email */}
          <div>
            <label className="block text-form-label font-medium text-gray-700 mb-1.5">Customer email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-honey focus:border-transparent outline-none"
              autoComplete="off"
            />
          </div>

          {/* Customer name */}
          <div>
            <label className="block text-form-label font-medium text-gray-700 mb-1.5">Customer name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="First name (used in the email greeting)"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-honey focus:border-transparent outline-none"
            />
          </div>

          {/* Amount + quantity (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-form-label font-medium text-gray-700 mb-1.5">Cash amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  value={amountCash}
                  onChange={(e) => setAmountCash(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-honey focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-form-label font-medium text-gray-700 mb-1.5">Book quantity</label>
              <input
                type="number"
                value={bookQuantity}
                onChange={(e) => setBookQuantity(e.target.value)}
                min="1"
                step="1"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-honey focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Demo checkbox */}
          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDemo}
              onChange={(e) => setIsDemo(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-brand-honey focus:ring-brand-honey"
            />
            <span className="text-sm text-gray-600">
              This is for demo/testing
              <span className="block text-xs text-gray-400 mt-0.5">
                Order will be flagged so it doesn&apos;t count as real revenue.
              </span>
            </span>
          </label>

          {/* Feedback */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting || !!success}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-brand-honey hover:bg-brand-honey-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending magic link...
              </>
            ) : (
              'Send magic link'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
