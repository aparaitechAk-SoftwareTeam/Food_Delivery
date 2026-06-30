import React from 'react';

const FilterDropdown = ({ label, value, onChange, options }) => {
  return (
    <div className="flex flex-col min-w-[130px]">
      {label && <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-0.5">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 cursor-pointer"
      >
        <option value="">All {label || 'Filters'}</option>
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const name = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {name}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default FilterDropdown;
