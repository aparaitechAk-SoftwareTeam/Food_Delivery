import React from 'react';
import { X, Calendar, Landmark, Clock, MapPin, Phone, Award, CheckCircle, AlertCircle } from 'lucide-react';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';
import VerificationBadge from './VerificationBadge';

const RestaurantDetailModal = ({ visible, restaurant, onClose }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {restaurant ? (
        /* Content Container */
        <div className="relative bg-slate-50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 transform transition-all flex flex-col z-10">
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white border-b border-slate-800 shrink-0">
            <button 
              onClick={onClose} 
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left mt-2">
              <Avatar name={restaurant.name} image={restaurant.avatar} size="lg" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h3 className="text-xl font-black">{restaurant.name}</h3>
                  <StatusBadge status={restaurant.status} />
                </div>
                <p className="text-xs text-indigo-200 mt-1 font-medium">{restaurant.cuisine} Cuisine</p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> {restaurant.location}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {restaurant.phone}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> Joined: {restaurant.joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Key Stats Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>
                <span className="text-lg font-black text-slate-800 mt-1">₹{restaurant.revenue?.toLocaleString() || '0'}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
                <span className="text-lg font-black text-slate-800 mt-1">{restaurant.orders || '0'}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Rating</span>
                <span className="text-lg font-black text-amber-500 mt-1">★ {restaurant.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Delivery Time</span>
                <span className="text-lg font-black text-slate-800 mt-1">{restaurant.avgDeliveryTime || '25 min'}</span>
              </div>
            </div>

            {/* Details Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Merchant Details */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-gray-100 pb-2">
                  Merchant Info
                </h4>
                <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Owner / Partner</span>
                    <span className="font-bold text-gray-700">{restaurant.owner}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Email Address</span>
                    <span className="font-bold text-gray-700">{restaurant.email || 'partner@express.com'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Opening Hours</span>
                    <span className="font-bold text-gray-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500" /> {restaurant.openingHours || '10:00 AM - 11:00 PM'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Physical Address</span>
                    <span className="font-bold text-gray-700 truncate block" title={restaurant.address}>{restaurant.address || 'Street 1, Main Area'}</span>
                  </div>
                </div>
              </div>

              {/* Compliance & Verification details */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-gray-100 pb-2">
                  Compliance & Verification
                </h4>
                <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-1">FSSAI License Status</span>
                    <VerificationBadge type={restaurant.fssaiStatus} />
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">FSSAI License ID</span>
                    <span className="font-bold text-gray-700">{restaurant.fssai || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">GST Registration</span>
                    <span className="font-bold text-gray-700 uppercase">{restaurant.gstin || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Compliance Level</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><Award className="w-3.5 h-3.5" /> High</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank details & Verification Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Details */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-indigo-500" /> Bank Settlement Account
                </h4>
                <div className="grid grid-cols-3 gap-y-3 text-xs">
                  <div className="col-span-2">
                    <span className="text-gray-400 block mb-0.5">Beneficiary Account Number</span>
                    <span className="font-mono font-bold text-gray-700">{restaurant.bankDetails?.accountNo || '•••• •••• •••• 9872'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">IFSC Code</span>
                    <span className="font-mono font-bold text-gray-700">{restaurant.bankDetails?.ifsc || 'SBIN0002143'}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-gray-400 block mb-0.5">Settlement Bank Name</span>
                    <span className="font-bold text-gray-700">{restaurant.bankDetails?.bankName || 'State Bank of India'}</span>
                  </div>
                </div>
              </div>

              {/* Verification Timeline */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-gray-100 pb-2">
                  Onboarding Timeline
                </h4>
                <div className="space-y-3.5 text-xs">
                  <div className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-700">Profile Created</p>
                      <span className="text-[10px] text-gray-400">Merchant registered on {restaurant.createdDate}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-700">FSSAI Verification Approved</p>
                      <span className="text-[10px] text-gray-400">License validated successfully</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-100 border-t border-gray-200 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Close Profile
            </button>
          </div>
        </div>
      ) : (
        /* Empty State Illustration when opened without selection */
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-8 text-center flex flex-col items-center z-10">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-indigo-500 animate-bounce" />
          </div>
          
          <h3 className="text-base font-bold text-gray-950 mb-1">No Restaurant Selected</h3>
          <p className="text-xs text-gray-400 max-w-xs mb-6">
            Please choose a restaurant partner from the directory list to view its complete operational profile.
          </p>
          
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetailModal;
