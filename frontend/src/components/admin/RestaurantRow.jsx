import React from 'react';
import { Eye, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';
import VerificationBadge from './VerificationBadge';

const RestaurantRow = ({ restaurant, onViewDetails, onToggleStatus }) => {
  const isApproved = restaurant.status === 'Approved' || restaurant.status === 'Active';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b border-gray-100 last:border-0 group">
      {/* PHOTO & NAME */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <Avatar name={restaurant.name} image={restaurant.avatar} />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors">
              {restaurant.name}
            </span>
            <span className="text-xs text-gray-400">Owner: {restaurant.owner}</span>
          </div>
        </div>
      </td>

      {/* CUISINE */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          {restaurant.cuisine}
        </span>
      </td>

      {/* PHONE */}
      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
        {restaurant.phone}
      </td>

      {/* LOCATION */}
      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
        {restaurant.location}
      </td>

      {/* RATING */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center text-amber-500 gap-1 text-xs font-bold">
          ★ <span>{restaurant.rating.toFixed(1)}</span>
        </div>
      </td>

      {/* FSSAI */}
      <td className="px-6 py-4 whitespace-nowrap">
        <VerificationBadge type={restaurant.fssaiStatus} />
      </td>

      {/* STATUS */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={restaurant.status} />
      </td>

      {/* ACTIONS */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => onViewDetails(restaurant)}
            className="p-1.5 bg-slate-50 border border-gray-200 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-150 active:scale-95"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onToggleStatus(restaurant)}
            className={`p-1.5 border rounded-lg transition-all duration-150 active:scale-95 ${
              isApproved
                ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-600 hover:text-white hover:border-transparent'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-transparent'
            }`}
            title={isApproved ? 'Suspend Access' : 'Activate Access'}
          >
            {isApproved ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </button>

          <button
            disabled
            className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-300 cursor-not-allowed"
            title="Delete (Disabled)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default React.memo(RestaurantRow);
