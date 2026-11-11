import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getTodayString, ALL_SLOTS } from '../utils/date';
import { readingService } from '../services/readingService';

const ReadingModal = ({ isOpen, onClose, onSuccess, initialData = null, defaultDate = null, defaultSlot = null }) => {
  const today = getTodayString();

  const [formData, setFormData] = useState({
    reading_date: today,
    slot: ALL_SLOTS[0],
    value: '',
  });

  const [inlineError, setInlineError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          reading_date: initialData.reading_date,
          slot: initialData.slot,
          value: String(initialData.value),
        });
      } else {
        setFormData({
          reading_date: defaultDate || today,
          slot: defaultSlot || ALL_SLOTS[0],
          value: '',
        });
      }
      setInlineError('');
      setSuccessMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, defaultDate, defaultSlot]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setInlineError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInlineError('');
    setSuccessMessage('');

    // Frontend pre-validations matching server
    if (!formData.reading_date) {
      setInlineError('Please enter a valid reading date.');
      return;
    }
    if (formData.reading_date > today) {
      setInlineError('Date cannot be in the future.');
      return;
    }
    if (!formData.slot || !ALL_SLOTS.includes(formData.slot)) {
      setInlineError('Please select a valid time slot.');
      return;
    }
    if (formData.value === '' || formData.value === undefined) {
      setInlineError('Please enter a glucose value.');
      return;
    }

    const numValue = Number(formData.value);
    if (!Number.isInteger(numValue) || numValue < 40 || numValue > 600) {
      setInlineError('Value must be a whole number between 40 and 600 mg/dl.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (initialData) {
        // Update
        await readingService.updateReading(initialData.id, {
          reading_date: formData.reading_date,
          slot: formData.slot,
          value: numValue,
        });
        setSuccessMessage('Reading updated successfully!');
      } else {
        // Create
        await readingService.createReading({
          reading_date: formData.reading_date,
          slot: formData.slot,
          value: numValue,
        });
        setSuccessMessage('Reading added successfully!');
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      const serverMsg = err.response?.data?.error || 'Failed to save glucose reading. Please try again.';
      setInlineError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {initialData ? 'Edit Glucose Reading' : 'Log Blood Glucose'}
            </h3>
            <p className="text-xs text-slate-500">
              Record your measured glucose level in mg/dl.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inline Feedback alerts */}
        {inlineError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{inlineError}</span>
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Date input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reading Date
            </label>
            <input
              type="date"
              name="reading_date"
              max={today}
              value={formData.reading_date}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-400 bg-slate-50/50"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Measurements cannot be recorded for future dates.
            </p>
          </div>

          {/* Slot dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Time Slot
            </label>
            <select
              name="slot"
              value={formData.slot}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-400 bg-slate-50/50"
              required
            >
              {ALL_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Value numeric input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Glucose Value (mg/dl)
            </label>
            <div className="relative">
              <input
                type="number"
                name="value"
                min="40"
                max="600"
                step="1"
                placeholder="e.g. 95"
                value={formData.value}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-pink-300 focus:border-pink-400 bg-slate-50/50 pr-16"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                mg/dl
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Must be a whole number between 40 and 600 mg/dl.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 shadow-sm shadow-pink-200 focus:outline-hidden focus:ring-2 focus:ring-pink-300 disabled:opacity-60 transition-all flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? 'Update Reading' : 'Save Reading'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReadingModal;
