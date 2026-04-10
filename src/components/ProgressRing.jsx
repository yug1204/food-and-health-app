import { useState, useEffect } from 'react';

export default function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 10,
  color = 'var(--primary-500)',
  label = '',
  unit = '',
  showPercentage = false,
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((animatedValue / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="progress-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="progress-ring-text">
        <div className="progress-ring-value">
          {showPercentage
            ? `${Math.round(percentage)}%`
            : `${Math.round(animatedValue)}${unit}`}
        </div>
        {label && <div className="progress-ring-label">{label}</div>}
      </div>
    </div>
  );
}
