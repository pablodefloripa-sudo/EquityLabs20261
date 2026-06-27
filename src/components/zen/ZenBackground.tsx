import { memo } from 'react';

export const ZenBackground = memo(() => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-zinc-900/20 via-black to-black" />
      
      {/* Subtle circuit pattern */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="zen-circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            {/* Horizontal lines */}
            <line x1="0" y1="50" x2="40" y2="50" stroke="hsl(180, 100%, 50%)" strokeWidth="0.5" />
            <line x1="60" y1="50" x2="100" y2="50" stroke="hsl(180, 100%, 50%)" strokeWidth="0.5" />
            
            {/* Vertical lines */}
            <line x1="50" y1="0" x2="50" y2="40" stroke="hsl(180, 100%, 50%)" strokeWidth="0.5" />
            <line x1="50" y1="60" x2="50" y2="100" stroke="hsl(180, 100%, 50%)" strokeWidth="0.5" />
            
            {/* Connection nodes */}
            <circle cx="50" cy="50" r="2" fill="hsl(180, 100%, 50%)" />
            <circle cx="0" cy="50" r="1" fill="hsl(180, 100%, 50%)" />
            <circle cx="100" cy="50" r="1" fill="hsl(180, 100%, 50%)" />
            <circle cx="50" cy="0" r="1" fill="hsl(180, 100%, 50%)" />
            <circle cx="50" cy="100" r="1" fill="hsl(180, 100%, 50%)" />
            
            {/* Corner accents */}
            <path d="M 10 10 L 20 10 L 20 15" stroke="hsl(280, 100%, 60%)" strokeWidth="0.3" fill="none" />
            <path d="M 90 90 L 80 90 L 80 85" stroke="hsl(280, 100%, 60%)" strokeWidth="0.3" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#zen-circuit)" />
      </svg>
      
      {/* Subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.02] blur-3xl" />
    </div>
  );
});

ZenBackground.displayName = 'ZenBackground';
