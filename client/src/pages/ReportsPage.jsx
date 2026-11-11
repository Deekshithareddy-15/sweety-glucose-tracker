import React, { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { getTodayString, formatDisplayDate } from '../utils/date';
import StatCard from '../components/StatCard';
import GlucoseTrendChart from '../components/GlucoseTrendChart';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

const ReportsPage = () => {
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'mtd' | 'monthly'

  const [dailyData, setDailyData] = useState(null);
  const [mtdData, setMtdData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const [daily, mtd, monthly] = await Promise.all([
        reportService.getDailyReport(selectedDate),
        reportService.getMonthToDateReport(selectedDate),
        reportService.getMonthlyReport(selectedDate),
      ]);

      setDailyData(daily);
      setMtdData(mtd);
      setMonthlyData(monthly);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to calculate reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    if (next <= today) {
      setSelectedDate(next);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Glucose Analytics & Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Comprehensive daily, month-to-date, and previous-month statistical summaries.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
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
              className="px-3 py-1.5 rounded-xl border-none text-slate-800 text-xs font-semibold focus:outline-hidden bg-slate-50"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
          <button
            onClick={handleNextDay}
            disabled={selectedDate >= today}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'daily'
              ? 'border-pink-500 text-pink-700 bg-pink-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Daily Summary ({dailyData?.dateLabel || formatDisplayDate(selectedDate)})
        </button>
        <button
          onClick={() => setActiveTab('mtd')}
          className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'mtd'
              ? 'border-purple-500 text-purple-700 bg-purple-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Month-to-Date ({mtdData?.dateRangeLabel || 'MTD'})
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'monthly'
              ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Previous Month ({monthlyData?.dateRangeLabel || 'Monthly'})
        </button>
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
          <p className="text-xs font-medium">Computing report metrics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: DAILY REPORT */}
          {activeTab === 'daily' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">
                    Report Period: Selected Date
                  </span>
                  <h2 className="text-xl font-bold text-slate-800 mt-1">
                    {dailyData?.dateLabel}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Highest, lowest, average and slots breakdown for this day.
                  </p>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Highest"
                  value={dailyData?.summary?.highest}
                  icon={TrendingUp}
                  color="pink"
                  subtext="Daily peak reading"
                />
                <StatCard
                  title="Lowest"
                  value={dailyData?.summary?.lowest}
                  icon={TrendingDown}
                  color="mint"
                  subtext="Daily lowest reading"
                />
                <StatCard
                  title="Average"
                  value={dailyData?.summary?.average}
                  icon={Activity}
                  color="purple"
                  subtext="Rounded to 1 decimal"
                />
                <StatCard
                  title="Total Count"
                  value={dailyData?.summary?.count}
                  unit="readings"
                  icon={Layers}
                  color="indigo"
                  subtext="Slots recorded"
                />
              </div>

              {/* Individual Readings with Slot */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">
                    Daily Readings Breakdown ({dailyData?.readings?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Measured glucose levels by slot in chronological order
                  </p>
                </div>

                {!dailyData?.readings || dailyData.readings.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No readings for this date</p>
                    <p className="mt-1">Use the Dashboard to log readings for {dailyData?.dateLabel}.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-6 py-3.5">Time Slot</th>
                          <th className="px-6 py-3.5">Glucose Level</th>
                          <th className="px-6 py-3.5">Logged At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dailyData.readings.map((reading) => (
                          <tr key={reading.id} className="hover:bg-pink-50/20 transition-colors">
                            <td className="px-6 py-3.5">
                              <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-semibold text-[11px]">
                                {reading.slot}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="font-bold text-sm text-slate-900">
                                {reading.value}
                              </span>{' '}
                              <span className="text-slate-400 text-[11px]">mg/dl</span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                              {reading.created_at ? new Date(reading.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MONTH-TO-DATE REPORT */}
          {activeTab === 'mtd' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                  Report Period: Month-to-Date
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-1">
                  {mtdData?.dateRangeLabel}
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregating all glucose measurements from the 1st of this month through {formatDisplayDate(selectedDate)} inclusive.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Highest"
                  value={mtdData?.summary?.highest}
                  icon={TrendingUp}
                  color="pink"
                  subtext="Peak in MTD range"
                />
                <StatCard
                  title="Lowest"
                  value={mtdData?.summary?.lowest}
                  icon={TrendingDown}
                  color="mint"
                  subtext="Lowest in MTD range"
                />
                <StatCard
                  title="Average"
                  value={mtdData?.summary?.average}
                  icon={Activity}
                  color="purple"
                  subtext="Rounded to 1 decimal"
                />
                <StatCard
                  title="Total Count"
                  value={mtdData?.summary?.count}
                  unit="readings"
                  icon={Layers}
                  color="indigo"
                  subtext="Total measurements"
                />
              </div>

              {/* MTD Trend Chart */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Glucose Progression ({mtdData?.dateRangeLabel})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological readings logged across the month to date
                  </p>
                </div>
                <GlucoseTrendChart readings={mtdData?.readings || []} />
              </div>
            </div>
          )}

          {/* TAB 3: PREVIOUS MONTH REPORT */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Report Period: Previous Calendar Month
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-1">
                  {monthlyData?.dateRangeLabel}
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregating the full calendar month preceding {formatDisplayDate(selectedDate)}.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Highest"
                  value={monthlyData?.summary?.highest}
                  icon={TrendingUp}
                  color="pink"
                  subtext="Peak of previous month"
                />
                <StatCard
                  title="Lowest"
                  value={monthlyData?.summary?.lowest}
                  icon={TrendingDown}
                  color="mint"
                  subtext="Lowest of previous month"
                />
                <StatCard
                  title="Average"
                  value={monthlyData?.summary?.average}
                  icon={Activity}
                  color="purple"
                  subtext="Rounded to 1 decimal"
                />
                <StatCard
                  title="Total Count"
                  value={monthlyData?.summary?.count}
                  unit="readings"
                  icon={Layers}
                  color="indigo"
                  subtext="Readings in previous month"
                />
              </div>

              {/* Monthly Trend Chart */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Monthly Glucose Progression ({monthlyData?.dateRangeLabel})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological readings logged during the previous calendar month
                  </p>
                </div>
                <GlucoseTrendChart readings={monthlyData?.readings || []} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
