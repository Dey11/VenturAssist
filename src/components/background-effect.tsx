import React from 'react';

interface BackgroundEffectProps {
  className?: string;
}

export default function BackgroundEffect({ className = "" }: BackgroundEffectProps) {
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-blue-50 to-white" />
      
      {/* Blurred circles at the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[600px] overflow-hidden">
        {/* Blue circle - left side */}
        <div 
          className="absolute -bottom-32 -left-5 w-[800px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'linear-gradient(135deg, #296A86 0%, #1E4A5F 100%)',
            filter: 'blur(60px)',
          }}
        />
        
        {/* Yellow circle - right side */}
        <div 
          className="absolute -bottom-32 -right-5 w-[800px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'linear-gradient(135deg, #FFC868 0%, #FFA500 100%)',
            filter: 'blur(60px)',
          }}
        />
      </div>
    </div>
  );
}
