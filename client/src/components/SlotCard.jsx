import React from 'react';
import { Sun, Coffee, Utensils, Moon, Plus, Edit2, Trash2 } from 'lucide-react';

const SLOT_META = {
  'Morning (fasting)': {
    icon: Sun,
    color: 'from-amber-400 to-orange-400',
    bgColor: 'bg-amber-50/70 border-amber-100',
    badge: 'Fasting',
  },
  'After breakfast': {
    icon: Coffee,
    color: 'from-rose-400 to-pink-400',
    bgColor: 'bg-rose-50/70 border-rose-100',
    badge: 'Post-Meal',
  },
  'After lunch': {
    icon: Utensils,
    color: 'from-purple-400 to-indigo-400',
    bgColor: 'bg-purple-50/70 border-purple-100',
    badge: 'Post-Meal',
  },
  'After dinner': {
    icon: Moon,
    color: 'from-sky-400 to-teal-400',
    bgColor: 'bg-sky-50/70 border-sky-100',
    badge: 'Post-Meal',
  },
};

const SlotCard = ({ slot, reading, onAdd, onEdit, onDelete }) => {
  const meta = SLOT_META[slot] || {
    icon: Sun,
    color: 'from-pink-400 to-rose-400',
    bgColor: 'bg-pink-50/70 border-pink-100',
    badge: 'Reading',
  };
  const Icon = meta.icon;

  return (
    <div
      className={`rounded-2xl p-5 border bg-white shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
        reading ? meta.bgColor : 'border-slate-200/80 hover:border-pink-200'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${meta.color} flex items-center justify-center text-white shadow-xs`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                {slot}
              </h4>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                {meta.badge}
              </span>
            </div>
          </div>
        </div>

        {reading ? (
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {reading.value}
              </span>
              <span className="text-xs font-semibold text-slate-500">mg/dl</span>
            </div>
          </div>
        ) : (
          <div className="my-3 py-2 text-center rounded-xl bg-slate-50/80 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
            Not logged yet
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between">
        {reading ? (
          <div className="w-full flex items-center justify-end gap-1.5">
            <button
              onClick={() => onEdit(reading)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-slate-200/80 transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Edit2 className="w-3 h-3 text-slate-500" />
              Edit
            </button>
            <button
              onClick={() => onDelete(reading)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 border border-rose-200/60 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3 text-rose-500" />
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAdd(slot)}
            className="w-full py-1.5 text-xs font-semibold rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200/60 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Reading
          </button>
        )}
      </div>
    </div>
  );
};

export default SlotCard;
