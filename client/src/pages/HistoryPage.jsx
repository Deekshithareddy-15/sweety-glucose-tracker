import React, { useState, useEffect, useCallback } from 'react';
import { readingService } from '../services/readingService';
import { formatDisplayDate, getTodayString } from '../utils/date';
import ReadingModal from '../components/ReadingModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import {
  History,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const HistoryPage = () => {
  const today = getTodayString();
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [filterDate, setFilterDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingReading, setDeletingReading] = useState(null);

  const fetchReadings = useCallback(
    async (pageToLoad = 1) => {
      try {
        setIsLoading(true);
        setError('');

        const params = {
          page: pageToLoad,
          limit: pagination.limit,
        };
        if (filterDate) {
          params.date = filterDate;
        }

        const data = await readingService.getReadings(params);
        setReadings(data.readings || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Failed to load readings:', err);
        setError('Unable to load reading history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [filterDate, pagination.limit]
  );

  useEffect(() => {
    fetchReadings(1);
  }, [fetchReadings]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReadings(newPage);
    }
  };

  const handleClearFilter = () => {
    setFilterDate('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Reading History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, filter, and manage your complete historical glucose logs.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReading(null);
            setIsReadingModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 shadow-md shadow-pink-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Reading</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by Date:</span>
          </div>
          <div className="relative">
            <input
              type="date"
              max={today}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-pink-300 bg-slate-50/50"
            />
          </div>
          {filterDate && (
            <button
              onClick={handleClearFilter}
              className="text-xs text-pink-600 hover:text-pink-700 font-medium underline"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Total entries: <strong className="text-slate-800">{pagination.total}</strong>
          </span>
          <button
            onClick={() => fetchReadings(pagination.page)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
            <p className="text-xs font-medium">Loading history...</p>
          </div>
        ) : readings.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <p className="text-sm font-semibold text-slate-700">No readings found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filterDate
                ? `No readings recorded on ${formatDisplayDate(filterDate)}. Try clearing the filter.`
                : 'Your reading history is empty. Start logging readings to monitor your levels.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Time Slot</th>
                  <th className="px-6 py-3.5">Glucose Level</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-pink-50/20 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">
                      {formatDisplayDate(reading.reading_date)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium text-[11px]">
                        {reading.slot}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-sm text-slate-900">
                        {reading.value}
                      </span>{' '}
                      <span className="text-slate-400 text-[11px]">mg/dl</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingReading(reading);
                            setIsReadingModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit reading"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingReading(reading);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete reading"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Reading Modal */}
      <ReadingModal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
        onSuccess={() => fetchReadings(pagination.page)}
        initialData={editingReading}
      />

      {/* Delete Reading Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => fetchReadings(pagination.page)}
        reading={deletingReading}
      />
    </div>
  );
};

export default HistoryPage;
