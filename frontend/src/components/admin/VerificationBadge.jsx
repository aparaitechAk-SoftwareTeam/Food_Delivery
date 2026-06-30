import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';

const VerificationBadge = ({ type }) => {
  const normalized = type ? type.toLowerCase() : 'pending';

  const badgeConfig = {
    verified: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
      label: 'Verified',
      sub: 'Valid license upload',
    },
    pending: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      label: 'Pending',
      sub: 'Reviewing document',
    },
    missing: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
      label: 'Missing',
      sub: 'No document uploaded',
    },
    expired: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
      label: 'Expired',
      sub: 'Needs renewal',
    },
  };

  const config = badgeConfig[normalized] || badgeConfig.pending;

  return (
    <div className="flex flex-col">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border w-fit ${config.bg}`}>
        {config.icon}
        {config.label}
      </span>
      <span className="text-[10px] text-gray-400 mt-0.5 ml-0.5">{config.sub}</span>
    </div>
  );
};

export default VerificationBadge;
