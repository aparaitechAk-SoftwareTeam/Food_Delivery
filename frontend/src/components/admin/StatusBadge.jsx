import React from 'react';

const StatusBadge = ({ status }) => {
  const normalizedStatus = status ? status.toLowerCase() : 'pending';

  const styles = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const currentStyle = styles[normalizedStatus] || styles.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${currentStyle}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current"></span>
      {status || 'Pending'}
    </span>
  );
};

export default StatusBadge;
