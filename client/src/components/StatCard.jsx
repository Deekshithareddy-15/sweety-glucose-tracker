import React from 'react';

const StatCard = ({ title, value, unit = 'mg/dl', icon: Icon, color = 'pink', subtext }) => {
  const colorStyles = {
    pink: {
      bg: 'bg-pink-50/60',
      border: 'border-pink-100',
      text: 'text-pink-600',
      iconBg: 'bg-pink-100 text-pink-600',
    },
    purple: {
      bg: 'bg-purple-50/60',
      border: 'border-purple-100',
      text: 'text-purple-600',
      iconBg: 'bg-purple-100 text-purple-600',
    },
    mint: {
      bg: 'bg-emerald-50/60',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    indigo: {
      bg: 'bg-indigo-50/60',
      border: 'border-indigo-100',
      text: 'text-indigo-600',
      iconBg: 'bg-indigo-100 text-indigo-600',
    },
  };

  const style = colorStyles[color] || colorStyles.pink;

  return (
    <div
      className={`rounded-2xl p-5 border ${style.border} ${style.bg} bg-white shadow-xs transition-all hover:shadow-md flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl ${style.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-slate-800">
            {value !== null && value !== undefined ? value : '—'}
          </span>
          {value !== null && value !== undefined && unit && (
            <span className="text-xs font-medium text-slate-500">{unit}</span>
          )}
        </div>
        {subtext && <p className="text-[11px] text-slate-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

export default StatCard;
