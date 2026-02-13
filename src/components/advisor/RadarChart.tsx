import { PersonalityPreset } from '../../types/advisor';
import { motion } from 'framer-motion';

interface RadarChartProps {
  stats: PersonalityPreset['stats'];
  isActive?: boolean;
  size?: number;
}

export function RadarChart({ stats, isActive = false, size = 120 }: RadarChartProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const numPoints = 5;
  
  // Stat labels in order
  const statKeys: (keyof typeof stats)[] = ['patience', 'analytical', 'warmth', 'directness', 'verbosity'];
  
  // Calculate points for the radar chart
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2; // Start from top
    const distance = (value / 100) * radius;
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
    };
  };
  
  // Create path for the filled area - ensure complete closed shape
  const createPath = () => {
    const points = statKeys.map((key, index) => getPoint(index, stats[key]));
    // Create path that explicitly closes back to first point
    const pathCommands = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    );
    // Explicitly close by returning to first point
    return pathCommands.join(' ') + ` L ${points[0].x} ${points[0].y} Z`;
  };
  
  const fillPath = createPath();
  const points = statKeys.map((key, index) => getPoint(index, stats[key]));
  
  // Create hexagonal grid paths
  const createHexagonPath = (scale: number) => {
    const hexPoints = statKeys.map((_, index) => {
      const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
      const distance = radius * scale;
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
      };
    });
    return hexPoints.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';
  };
  
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {/* Hexagonal grid lines */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <path
          key={scale}
          d={createHexagonPath(scale)}
          fill="none"
          stroke={isActive ? 'rgba(198, 255, 74, 0.2)' : 'rgba(255, 255, 255, 0.1)'}
          strokeWidth="1"
        />
      ))}
      
      {/* Grid spokes */}
      {statKeys.map((_, index) => {
        const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        return (
          <line
            key={index}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke={isActive ? 'rgba(198, 255, 74, 0.2)' : 'rgba(255, 255, 255, 0.1)'}
            strokeWidth="1"
          />
        );
      })}
      
      {/* Animated line drawing (only when active) */}
      {isActive && (
        <motion.path
          d={fillPath}
          fill="none"
          stroke="#C6FF4A"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeInOut', delay: 0.1 }}
        />
      )}
      
      {/* Filled area (only when active, after line animation) */}
      {isActive && (
        <motion.path
          d={fillPath}
          fill="#C6FF4A"
          fillOpacity="0.3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.5 }}
        />
      )}
      
      {/* Dot points at each vertex (only when active) */}
      {isActive && points.map((point, index) => (
        <motion.circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="3"
          fill="#C6FF4A"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.15, 
            delay: 0.4 + (index * 0.05),
            type: 'spring',
            stiffness: 300
          }}
        />
      ))}
    </svg>
  );
}
