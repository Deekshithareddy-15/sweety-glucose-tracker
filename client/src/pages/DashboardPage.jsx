import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { readingService } from '../services/readingService';
import { reportService } from '../services/reportService';
import { getTodayString, formatDisplayDate, ALL_SLOTS } from '../utils/date';
import SlotCard from '../components/SlotCard';
import StatCard from '../components/StatCard';
import ReadingModal from '../components/ReadingModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import GlucoseTrendChart from '../components/GlucoseTrendChart';
import {
  Calendar,
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const today = getTodayString();

  const [selectedDate, setSelectedDate] = useState(today);
  const [dailyReport, setDailyReport] = useState(null);
  const [recentReadings, setRecentReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [modalDefaultSlot, setModalDefaultSlot] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingReading, setDeletingReading] = useState(null);

  // Fetch daily report for selected date + recent readings
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const [reportData, allReadingsData] = await Promise.all([
        reportService.getDailyReport(selectedDate),
        readingService.getReadings({ limit: 10 }),
      ]);

      setDailyReport(reportData);
      setRecentReadings(allReadingsData.readings || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Quick date navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const prev = d.toISOString().split('T')[0];
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    if (next <= today) {
      setSelectedDate(next);
    }
  };

  // Open modal for new reading
  const handleOpenAdd = (slot = null) => {
    setEditingReading(null);
    setModalDefaultSlot(slot || ALL_SLOTS[0]);
    setIsReadingModalOpen(true);
  };

  // Open modal for editing reading
  const handleOpenEdit = (reading) => {
    setEditingReading(reading);
    setModalDefaultSlot(reading.slot);
    setIsReadingModalOpen(true);
  };

  // Open delete confirmation modal
  const handleOpenDelete = (reading) => {
    setDeletingReading(reading);
    setIsDeleteModalOpen(true);
  };

  const readingsOnDate = dailyReport?.readings || [];
  const count = dailyReport?.summary?.count || 0;
  const progressPercent = Math.min(100, Math.round((count / 4) * 100));

  // Map slots to reading (if logged)
  const slotReadingsMap = {};
  readingsOnDate.forEach((r) => {
    slotReadingsMap[r.slot] = r;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            Welcome back, <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">{user?.name}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track daily glucose levels and monitor your glycemic trends.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleOpenAdd()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 shadow-md shadow-pink-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Log Glucose Reading</span>
        </button>
      </div>

      {/* Date Selector & Daily Progress Card */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Date Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center">
            <input
              type="date"
              max={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-pink-300 bg-slate-50/60"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
          </div>

          <button
            onClick={handleNextDay}
            disabled={selectedDate >= today}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 transition-colors ml-2"
            >
              Jump to Today
            </button>
          )}
        </div>

        {/* Progress Counter (e.g. 2/4 logged) */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Daily Target
            </span>
            <span className="text-sm font-bold text-slate-700">
              <span className="text-pink-600 font-extrabold text-base">{count}</span> of 4 slots logged
            </span>
          </div>
          <div className="w-28 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
          <p className="text-xs font-medium">Loading dashboard insights...</p>
        </div>
      ) : (
        <>
          {/* Daily Statistics Cards */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Daily Statistics ({formatDisplayDate(selectedDate)})
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Highest"
                value={dailyReport?.summary?.highest}
                icon={TrendingUp}
                color="pink"
                subtext="Maximum glucose"
              />
              <StatCard
                title="Lowest"
                value={dailyReport?.summary?.lowest}
                icon={TrendingDown}
                color="mint"
                subtext="Minimum glucose"
              />
              <StatCard
                title="Average"
                value={dailyReport?.summary?.average}
                icon={Activity}
                color="purple"
                subtext="Rounded to 1 decimal"
              />
              <StatCard
                title="Readings Logged"
                value={dailyReport?.summary?.count}
                unit="readings"
                icon={Layers}
                color="indigo"
                subtext="Out of 4 slots daily"
              />
            </div>
          </div>

          {/* 4 Reading Slot Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Measurement Slots ({formatDisplayDate(selectedDate)})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ALL_SLOTS.map((slot) => (
                <SlotCard
                  key={slot}
                  slot={slot}
                  reading={slotReadingsMap[slot] || null}
                  onAdd={(slotName) => handleOpenAdd(slotName)}
                  onEdit={(reading) => handleOpenEdit(reading)}
                  onDelete={(reading) => handleOpenDelete(reading)}
                />
              ))}
            </div>
          </div>

          {/* Daily Trend Chart (Bonus Recharts feature) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Glucose Trend on {formatDisplayDate(selectedDate)}
                </h3>
                <p className="text-xs text-slate-500">
                  Visual graph across measurement slots
                </p>
              </div>
            </div>
            <GlucoseTrendChart readings={readingsOnDate} />
          </div>

          {/* Recent Readings Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Readings</h3>
                <p className="text-xs text-slate-500">Your latest logged blood glucose entries</p>
              </div>
            </div>

            {recentReadings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No readings recorded yet. Click "Log Glucose Reading" to add your first reading!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Time Slot</th>
                      <th className="px-6 py-3.5">Value (mg/dl)</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentReadings.map((reading) => (
                      <tr key={reading.id} className="hover:bg-pink-50/20 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-slate-800">
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
                              onClick={() => handleOpenEdit(reading)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Edit Reading"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(reading)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Delete Reading"
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
          </div>
        </>
      )}

      {/* Reading Modal (Add / Edit) */}
      <ReadingModal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
        onSuccess={loadDashboardData}
        initialData={editingReading}
        defaultDate={selectedDate}
        defaultSlot={modalDefaultSlot}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={loadDashboardData}
        reading={deletingReading}
      />
    </div>
  );
};

export default DashboardPage;
