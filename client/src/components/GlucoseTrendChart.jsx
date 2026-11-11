import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-lg border border-slate-100 text-xs">
        <p className="font-semibold text-slate-800">{data.date || label}</p>
        <p className="text-slate-500 text-[11px] mb-1">{data.slot}</p>
        <p className="font-bold text-pink-600 text-sm">
          {data.value} <span className="text-slate-400 font-normal text-xs">mg/dl</span>
        </p>
      </div>
    );
  }
  return null;
};

const GlucoseTrendChart = ({ readings = [] }) => {
  if (!readings || readings.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">No glucose readings in this period</p>
        <p className="text-xs text-slate-400 mt-1">Log readings to see your glucose trend chart</p>
      </div>
    );
  }

  // Format data for chart (sorted chronologically)
  const chartData = readings.map((r, index) => ({
    index: index + 1,
    date: r.reading_date,
    slot: r.slot,
    label: `${r.reading_date.slice(5)} (${r.slot.split(' ')[0]})`,
    value: r.value,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            domain={['dataMin - 10', 'dataMax + 10']}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="#cbd5e1" strokeDasharray="3 3" />
          <ReferenceLine y={140} stroke="#cbd5e1" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#ec4899"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#be185d', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GlucoseTrendChart;
