import React from 'react';
import RestaurantRow from './RestaurantRow';

const RestaurantTable = ({ restaurants, onViewDetails, onToggleStatus }) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Restaurant Name
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Cuisine
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Rating
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              FSSAI License
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {restaurants.map((rest) => (
            <RestaurantRow
              key={rest.id || rest._id}
              restaurant={rest}
              onViewDetails={onViewDetails}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(RestaurantTable);
