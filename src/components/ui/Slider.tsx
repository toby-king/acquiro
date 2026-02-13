import { HTMLAttributes, useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SliderProps extends Omit<HTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showLabels?: boolean;
  customLabels?: {
    left?: string;
    middle?: string;
    right?: string;
  };
  positionMap?: (value: number) => number; // Maps actual value to visual position percentage
}

export function Slider({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  showLabels = false,
  customLabels,
  positionMap,
  className = '',
  ...props 
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const handleMove = useCallback((e: MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(min + percentage * (max - min));
    onChange(Math.round(newValue / step) * step);
  }, [min, max, step, onChange]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.nativeEvent);
  };
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMove, handleMouseUp]);
  
  const rawPercentage = ((value - min) / (max - min)) * 100;
  const thumbPercentage = positionMap ? positionMap(value) : rawPercentage;
  
  return (
    <div className={`w-full ${className}`} style={{ paddingTop: '6px', paddingBottom: '6px' }}>
      <div
        ref={sliderRef}
        className="relative h-2 rounded-full cursor-pointer overflow-visible"
        style={{ 
          minHeight: '8px',
          background: `linear-gradient(to right, rgb(96, 165, 250) 0%, rgb(52, 211, 153) 25%, rgb(251, 191, 36) 50%, rgb(251, 146, 60) 75%, rgb(239, 68, 68) 100%)`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Dark overlay for unfilled portion */}
        <div
          className="absolute inset-y-0 right-0 rounded-full transition-all duration-200 z-0"
          style={{
            width: `${100 - thumbPercentage}%`,
            background: 'var(--bg-card)',
          }}
        />
        <div
          className="absolute z-10"
          style={{ 
            left: `calc(${thumbPercentage}% - 10px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            transformOrigin: 'center center',
          }}
        >
          <motion.div
            className="w-5 h-5 bg-white rounded-full shadow-lg border-2 border-accent cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
              handleMove(e.nativeEvent);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>
      {showLabels && (
        <div className={`mt-2 text-xs text-[var(--text-secondary)] ${
          customLabels ? 'relative flex justify-between' : 'flex justify-between'
        }`}>
          {customLabels ? (
            <>
              <span>{customLabels.left || ''}</span>
              {customLabels.middle && (
                <span className="absolute left-1/2 -translate-x-1/2">
                  {customLabels.middle}
                </span>
              )}
              <span>{customLabels.right || ''}</span>
            </>
          ) : (
            <>
              <span>{min}</span>
              <span>{max}</span>
            </>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sr-only"
        {...props}
      />
    </div>
  );
}
