import React from 'react';

interface StudiiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light'; // 'dark' = dark text on light bg, 'light' = white text on dark bg
  collapsed?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
  onClick?: () => void;
}

export const StudiiLogo: React.FC<StudiiLogoProps> = ({
  size = 'md',
  theme = 'dark',
  collapsed = false,
  showBadge = true,
  badgeText = 'v0.8 BETA',
  className = '',
  onClick,
}) => {
  const isLight = theme === 'light';

  // Size configurations
  const textSizes = {
    sm: 'text-base tracking-tight',
    md: 'text-xl tracking-tight',
    lg: 'text-3xl tracking-tighter',
    xl: 'text-4xl sm:text-5xl tracking-tighter',
  };

  const emblemSizes = {
    sm: 'w-7 h-7 rounded-xl text-xs',
    md: 'w-9 h-9 rounded-xl text-sm',
    lg: 'w-11 h-11 rounded-2xl text-base',
    xl: 'w-14 h-14 rounded-2xl text-xl',
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.2',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-0.5',
    xl: 'text-xs px-3 py-1',
  };

  const textColor = isLight ? 'text-white' : 'text-[#1B2A4A]';

  // Core Squircle Emblem (from user specification: st + orange i + green i)
  const renderEmblem = (customClass = '') => (
    <div
      className={`flex items-center justify-center font-extrabold transition-all select-none shadow-xs border ${
        isLight
          ? 'bg-white/10 border-white/20 text-white'
          : 'bg-white border-[#DFD9CC] text-[#1B2A4A]'
      } ${customClass}`}
    >
      <span className="font-extrabold tracking-tighter flex items-baseline font-sans">
        <span>st</span>
        <span className="text-[#D97736]">i</span>
        <span className="text-[#2E6B4F]">i</span>
      </span>
    </div>
  );

  // If collapsed in sidebar, render only the iconic squircle mark
  if (collapsed) {
    return (
      <div
        onClick={onClick}
        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 select-none cursor-pointer ${className}`}
        title="studii"
      >
        {renderEmblem('w-10 h-10 rounded-2xl text-sm')}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer hover:opacity-95' : ''} ${className}`}
    >
      {/* Exact stii Squircle Emblem */}
      {renderEmblem(emblemSizes[size])}

      {/* Wordmark Typography: studii */}
      <div className="flex items-baseline">
        <span className={`font-extrabold font-sans leading-none ${textSizes[size]} ${textColor}`}>
          stud
          <span className="text-[#D97736] relative">i</span>
          <span className="text-[#2E6B4F] relative">i</span>
        </span>
      </div>

      {/* Version Badge: v0.8 BETA */}
      {showBadge && (
        <span
          className={`rounded-full font-mono font-bold leading-none border transition-all ${badgeSizes[size]} ${
            isLight
              ? 'bg-white/15 text-white/90 border-white/20'
              : 'bg-[#D97736]/10 text-[#D97736] border-[#D97736]/25'
          }`}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
};
