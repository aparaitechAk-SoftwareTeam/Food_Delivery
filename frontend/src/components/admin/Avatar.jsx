import React from 'react';

const Avatar = ({ name, image, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  const getInitials = (n) => {
    if (!n) return '';
    return n.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
  };

  const getGradient = (n) => {
    const colors = [
      'from-pink-500 to-rose-500',
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
      'from-teal-500 to-emerald-500',
      'from-amber-500 to-orange-500',
      'from-fuchsia-500 to-purple-600',
    ];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover border border-gray-100 shadow-sm`}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size] || sizeClasses.md} rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br ${getGradient(name || 'Restaurant')} shadow-sm border border-white/20`}>
      {getInitials(name || 'RE')}
    </div>
  );
};

export default Avatar;
