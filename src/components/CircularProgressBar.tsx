import React from 'react';

interface CircularProgressBarProps {
  value: number; 
  size?: number; 
  strokeWidth?: number; 
  status?: string; 
  title?: string; 
  color?: string; 
}

export const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  value,
  size = 350,
  strokeWidth = 20,
  status = '',
  title = '',
  color = 'red',
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ height: size, width: size }}>
      <svg
        className="relative z-10"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={title}
        role="progressbar"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          stroke="#e6e6e6"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={center}
          cy={center}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} // Ensure transition is smooth
        />
      </svg>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-semibold tracking-tight sm:text-5xl tabular-nums">
          {value}
          <span>%</span>
        </span>
        <div className="text-lg font-medium mt-2">{status}</div>
        {title && <div className="text-sm mt-1">{title}</div>}
      </div>
    </div>
  );
};
