import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { readingService } from '../services/readingService';

const DeleteConfirmModal = ({ isOpen, onClose, onSuccess, reading }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !reading) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setError('');
      await readingService.deleteReading(reading.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete reading.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-800">
          Delete Reading?
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Are you sure you want to delete the <span className="font-semibold text-slate-700">{reading.slot}</span> reading of <span className="font-semibold text-slate-700">{reading.value} mg/dl</span> on {reading.reading_date}? This action cannot be undone.
        </p>

        {error && (
          <p className="mt-3 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg font-medium">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-1/2 py-2 text-xs font-medium rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-1/2 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 focus:outline-hidden focus:ring-2 focus:ring-rose-300 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
