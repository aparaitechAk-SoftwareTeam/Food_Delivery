import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

const ConfirmationModal = ({ visible, title, message, onConfirm, onCancel, type = 'danger' }) => {
  if (!visible) return null;

  const typeConfig = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
      iconBg: 'bg-rose-50',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
      confirmText: 'Confirm Suspension',
    },
    success: {
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
      confirmText: 'Confirm Activation',
    },
  };

  const config = typeConfig[type] || typeConfig.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />
      
      {/* Content */}
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all p-6">
        <button 
          onClick={onCancel} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${config.iconBg} shrink-0`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ${config.btnBg}`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
