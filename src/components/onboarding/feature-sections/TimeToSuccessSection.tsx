import { useRef, useEffect, useState, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import { Card } from '../../ui/Card';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDateMonthsAhead(months: number): Date {
  const date = new Date();
  const currentDay = date.getDate();
  date.setMonth(date.getMonth() + months);
  
  // Handle edge case: if current day doesn't exist in target month (e.g. 31st -> February)
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  if (currentDay > lastDayOfMonth) {
    date.setDate(lastDayOfMonth);
  } else {
    date.setDate(currentDay);
  }
  
  return date;
}

const TIMELINE_STAGES = [
  {
    label: 'Agent created',
    timeframe: 'Today',
    position: 0, // 0% - at the start
    isStart: true,
  },
  {
    label: 'First Matches',
    timeframe: 'Week 1',
    position: 0.25, // 25% - evenly spaced
  },
  {
    label: 'Shortlist & Calls',
    timeframe: 'Week 2–4',
    position: 0.5, // 50% - evenly spaced
  },
  {
    label: 'Due Diligence',
    timeframe: 'Month 2–3',
    position: 0.75, // 75% - evenly spaced
  },
  {
    label: 'Deal Closed',
    timeframe: '', // Will be set dynamically
    position: 1.0, // 100% - at the end
    isFinal: true,
  },
];

// Easing function for progress animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Rolling Date Component with Odometer Effect
interface RollingDateProps {
  startDate: Date;
  endDate: Date;
}

function RollingDate({ startDate, endDate }: RollingDateProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // Format day as string (no leading zeros to match formatDate)
  const formatDay = (day: number) => day.toString();
  const formatYear = (year: number) => year.toString();

  const startDayStr = formatDay(startDay);
  const endDayStr = formatDay(endDay);
  const startYearStr = formatYear(startYear);
  const endYearStr = formatYear(endYear);

  // Calculate month indices (handle year wrap-around)
  const getMonthIndex = (month: number, year: number) => {
    return month;
  };

  const startMonthIndex = getMonthIndex(startMonth, startYear);
  const endMonthIndex = getMonthIndex(endMonth, endYear);

  // Calculate how many months to scroll (handle wrap-around)
  const calculateMonthScroll = () => {
    if (startYear === endYear) {
      return startMonthIndex - endMonthIndex;
    } else {
      // Crosses year boundary - scroll backwards through remaining months
      return (12 - endMonthIndex) + startMonthIndex;
    }
  };

  const monthScrollDistance = calculateMonthScroll();

  useEffect(() => {
    // Start animation after a brief delay
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 500);

    // Mark as settled after animation completes (1.8s duration + 0.5s delay + buffer)
    const settleTimer = setTimeout(() => {
      setIsSettled(true);
    }, 500 + 1800 + 300); // delay + duration + small buffer

    return () => {
      clearTimeout(timer);
      clearTimeout(settleTimer);
    };
  }, []);

  // Day digit columns - always use 2 digits for consistent odometer effect
  const renderDayDigits = () => {
    // Always pad to 2 digits for odometer effect
    const padDay = (day: number) => day.toString().padStart(2, '0');
    const startDayPadded = padDay(startDay);
    const endDayPadded = padDay(endDay);
    
    const digits = [];
    
    // Render 2 digits (tens and units)
    for (let i = 0; i < 2; i++) {
      const startChar = startDayPadded[i];
      const endChar = endDayPadded[i];
      const startDigit = parseInt(startChar);
      const endDigit = parseInt(endChar);
      
      // Create column of digits 0-9 (repeat 3 times for smooth wrap-around)
      const digitColumn = [];
      for (let d = 0; d <= 9; d++) {
        digitColumn.push(
          <div key={d} className="text-3xl font-medium text-[var(--text-primary)] tabular-nums" style={{ height: '1.2em', lineHeight: '1.2em' }}>
            {d}
          </div>
        );
      }
      // Repeat for wrap-around
      const repeatedColumn = [...digitColumn, ...digitColumn, ...digitColumn];

      // Calculate translateY: start at startDigit (in the middle set, index 10 + startDigit)
      // This gives us room to scroll in either direction
      const startTranslateY = -(10 + startDigit) * 1.2;
      
      // Calculate how many digits to scroll
      const digitDiff = startDigit - endDigit;
      let scrollAmount = digitDiff;
      
      // If digit stays the same, still scroll down and back up for visual effect
      if (digitDiff === 0) {
        scrollAmount = -10; // Scroll down 10 digits (full rotation) then back
      }
      
      // End position: scroll to endDigit (in the middle set, index 10 + endDigit)
      // If same digit, we scroll down 10 then back up 10 to end at the same position
      let endTranslateY = -(10 + endDigit) * 1.2;
      if (digitDiff === 0) {
        // Scroll down 10 digits, then back up 10 to end at same position
        endTranslateY = -(10 + endDigit + 10) * 1.2;
      } else if (digitDiff > 0) {
        // Rolling down - add extra rotation for visual effect
        endTranslateY = -(10 + endDigit) * 1.2 - (digitDiff * 1.2);
      }

      digits.push(
        <div
          key={i}
          className="relative inline-block overflow-hidden"
          style={{ 
            height: '1.2em',
            width: '0.6em',
            verticalAlign: 'baseline'
          }}
        >
          <motion.div
            className="absolute"
            style={{
              transform: `translateY(${startTranslateY}em)`,
            }}
            animate={isAnimating ? {
              transform: `translateY(${endTranslateY}em)`,
            } : {}}
            transition={{
              duration: 1.8,
              ease: [0.16, 1, 0.3, 1], // cubic-bezier ease-out
              delay: i * 0.1, // Stagger digits slightly
            }}
          >
            {repeatedColumn}
          </motion.div>
        </div>
      );
    }
    return digits;
  };

  // Month column
  const renderMonth = () => {
    // Create column of all 12 months (repeat 3 times for smooth wrap-around in both directions)
    const monthColumn = [...monthNames, ...monthNames, ...monthNames].map((month, index) => (
      <div key={index} className="text-3xl font-medium text-[var(--text-primary)]" style={{ height: '1.2em', lineHeight: '1.2em', whiteSpace: 'nowrap' }}>
        {month}
      </div>
    ));

    // Calculate translateY: start at startMonth (in the middle set, index 12 + startMonthIndex)
    // This gives us room to scroll in either direction
    const startTranslateY = -(12 + startMonthIndex) * 1.2;
    
    // End position: scroll to endMonth (in the middle set, index 12 + endMonthIndex)
    const endTranslateY = -(12 + endMonthIndex) * 1.2;

    return (
      <div
        className="relative inline-block overflow-hidden"
        style={{ 
          height: '1.2em',
          minWidth: '120px', // Wide enough for longest month name
          verticalAlign: 'baseline'
        }}
      >
        <motion.div
          className="absolute"
          style={{
            transform: `translateY(${startTranslateY}em)`,
          }}
          animate={isAnimating ? {
            transform: `translateY(${endTranslateY}em)`,
          } : {}}
          transition={{
            duration: 1.8,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.2, // Slight delay after day digits
          }}
        >
          {monthColumn}
        </motion.div>
      </div>
    );
  };

  // Year digit columns - always animate, even if year doesn't change
  const renderYearDigits = () => {
    const digits = [];
    for (let i = 0; i < startYearStr.length; i++) {
      const startDigit = parseInt(startYearStr[i]);
      const endDigit = parseInt(endYearStr[i]);
      
      // Create column of digits 0-9 (repeat 3 times for smooth wrap-around)
      const digitColumn = [];
      for (let d = 0; d <= 9; d++) {
        digitColumn.push(
          <div key={d} className="text-3xl font-medium text-[var(--text-primary)] tabular-nums" style={{ height: '1.2em', lineHeight: '1.2em' }}>
            {d}
          </div>
        );
      }
      // Repeat for wrap-around
      const repeatedColumn = [...digitColumn, ...digitColumn, ...digitColumn];

      // Calculate translateY: start at startDigit (in the middle set, index 10 + startDigit)
      const startTranslateY = -(10 + startDigit) * 1.2;
      
      const digitDiff = startDigit - endDigit;
      let endTranslateY = -(10 + endDigit) * 1.2;
      
      // If digit stays the same, still scroll down and back up for visual effect
      if (digitDiff === 0) {
        // Scroll down 10 digits (full rotation) then back
        endTranslateY = -(10 + endDigit + 10) * 1.2;
      } else if (digitDiff > 0) {
        // Rolling down - add extra rotation for visual effect
        endTranslateY = -(10 + endDigit) * 1.2 - (digitDiff * 1.2);
      } else {
        // Rolling up (shouldn't happen in countdown, but handle it)
        endTranslateY = -(10 + endDigit) * 1.2 + (Math.abs(digitDiff) * 1.2);
      }

      digits.push(
        <div
          key={i}
          className="relative inline-block overflow-hidden"
          style={{ 
            height: '1.2em',
            width: '0.6em',
            verticalAlign: 'baseline'
          }}
        >
          <motion.div
            className="absolute"
            style={{
              transform: `translateY(${startTranslateY}em)`,
            }}
            animate={isAnimating ? {
              transform: `translateY(${endTranslateY}em)`,
            } : {}}
            transition={{
              duration: 1.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.4 + (i * 0.1), // Delay after month
            }}
          >
            {repeatedColumn}
          </motion.div>
        </div>
      );
    }
    return digits;
  };

  return (
    <motion.span 
      className="inline-flex items-baseline"
      initial={{
        gap: '0.5em', // Wider spacing during counter animation
      }}
      animate={isSettled ? {
        gap: '0.05em', // Very tight spacing - minimal gap
      } : {
        gap: '0.5em', // Keep wider spacing during counter animation
      }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        delay: 0, // No delay, animates when isSettled changes
      }}
    >
      {/* Day digits */}
      {renderDayDigits()}
      
      {/* Month */}
      {renderMonth()}
      
      {/* Year digits */}
      {renderYearDigits()}
    </motion.span>
  );
}

export function TimeToSuccessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [dealClosedDate, setDealClosedDate] = useState<string>('');
  const [showCheckmark, setShowCheckmark] = useState(false);
  
  // Animation state - first node (index 0) always visible
  const [barProgress, setBarProgress] = useState(0);
  const [visibleNodes, setVisibleNodes] = useState<Set<number>>(new Set([0]));
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate initial and final dates - memoize to prevent infinite loops
  // Start: 12 months ahead, End: 4 months ahead
  const startDate = useMemo(() => getDateMonthsAhead(12), []);
  const endDate = useMemo(() => getDateMonthsAhead(4), []);

  // Timeline center is at 32px from top
  const TIMELINE_CENTER = 32;
  const ANIMATION_DURATION = 3000; // 3 seconds

  useEffect(() => {
    if (!isInView) return;

    // Reset state - first node (index 0) should be visible immediately since position is 0
    setBarProgress(0);
    setVisibleNodes(new Set([0])); // First node visible immediately
    startTimeRef.current = performance.now(); // Use performance.now() for better accuracy

    // Start countdown when bar reaches 100%
    const countdownTimer = setTimeout(() => {
      let currentMonth = 12; // Start at 12 months (matches startDate)
      const totalSteps = 8; // 12 months - 4 months = 8 steps
      let step = 0;

      const animateCountdown = () => {
        if (step >= totalSteps) {
          setDealClosedDate(formatDate(endDate));
          setShowCheckmark(true);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return;
        }

        const progress = step / totalSteps;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        
        const baseDelay = 60; // Reduced from 100 for faster animation
        const maxDelay = 250; // Reduced from 400 for faster animation
        const delay = baseDelay + (maxDelay - baseDelay) * easedProgress;

        const stepTimer = setTimeout(() => {
          currentMonth--;
          const date = getDateMonthsAhead(currentMonth);
          setDealClosedDate(formatDate(date));
          step++;
          
          if (step < totalSteps) {
            animateCountdown();
          } else {
            setDealClosedDate(formatDate(endDate));
            setShowCheckmark(true);
          }
        }, delay);

        countdownIntervalRef.current = stepTimer;
      };

      setDealClosedDate(formatDate(startDate));
      
      setTimeout(() => {
        animateCountdown();
      }, 200);
    }, ANIMATION_DURATION);

    // Animation loop using requestAnimationFrame
    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const rawProgress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = easeOutCubic(rawProgress);

      setBarProgress(easedProgress);

      // Check which nodes should be visible based on current progress
      const newVisibleNodes = new Set<number>();
      TIMELINE_STAGES.forEach((stage, index) => {
        // First node (position 0) is always visible, others appear when bar reaches them
        if (stage.position === 0 || easedProgress >= stage.position) {
          newVisibleNodes.add(index);
        }
      });
      setVisibleNodes(newVisibleNodes);

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure all nodes are visible when animation completes
        setVisibleNodes(new Set(TIMELINE_STAGES.map((_, i) => i)));
      }
    };

    // Start animation immediately
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearTimeout(countdownTimer);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isInView, startDate, endDate]);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4" style={{ overflow: 'visible' }}>
      <Card className="max-w-[600px] w-full border-none" style={{ background: 'transparent', border: 'none', overflow: 'visible' }}>
        <div className="space-y-8" style={{ overflow: 'visible' }}>
          {/* Headline */}
          <h2 className="text-3xl font-medium text-[var(--text-primary)] text-center">
            Close your ideal acquisition by{' '}
            <RollingDate startDate={startDate} endDate={endDate} />
          </h2>
          
          {/* Subtext */}
          <p className="text-lg text-[var(--text-secondary)] text-center leading-relaxed">
            With the right advisor and the right matches, the timeline is shorter than you think.
          </p>

          {/* Horizontal Timeline */}
          <div className="mt-8 relative pb-24" style={{ minHeight: '200px', overflow: 'visible' }}>
            {/* Background track line - spans full width, starts at first node center, ends at last node center */}
            <div 
              className="absolute h-0.5 bg-[#333]" 
              style={{ 
                top: `${TIMELINE_CENTER - 1}px`,
                left: 0,
                right: 0,
                zIndex: 1,
              }}
            />
            
            {/* Animated progress bar - driven by barProgress state */}
            {/* Progress bar spans full width */}
            <div
              className="absolute h-1 bg-accent rounded-full origin-left"
              style={{
                top: `${TIMELINE_CENTER - 2}px`,
                left: 0,
                width: `${barProgress * 100}%`,
                zIndex: 2,
                minWidth: barProgress > 0 ? '2px' : '0',
              }}
            />

            {/* Timeline stages */}
            <div className="relative" style={{ zIndex: 10, overflow: 'visible' }}>
              {TIMELINE_STAGES.map((stage, index) => {
                // Node sizes: w-5 h-5 = 20px (center at 10px), w-6 h-6 = 24px (center at 12px)
                const nodeSize = stage.isFinal ? 24 : 20; // pixels
                const nodeCenterOffset = nodeSize / 2; // 12px or 10px
                const nodeTop = TIMELINE_CENTER - nodeCenterOffset; // 20px for w-6, 22px for w-5
                
                // Node visibility based on bar progress
                const isNodeVisible = visibleNodes.has(index);
                const isLabelVisible = isNodeVisible; // Labels appear with nodes

                // Calculate node horizontal position
                // Nodes are evenly spaced: 0%, 25%, 50%, 75%, 100%
                // Timeline spans full width (no padding), so nodes are positioned at exact percentages
                const nodeLeft = `${stage.position * 100}%`;
                
                // Transform: first node uses translateX(-50%) to center on left edge
                // Last node uses translateX(50%) to center on right edge
                // Middle nodes use translateX(-50%) to center on their position
                const nodeTransform = stage.isStart 
                  ? 'translateX(-50%)' 
                  : stage.isFinal 
                    ? 'translateX(50%)' 
                    : 'translateX(-50%)';

                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      left: nodeLeft,
                      top: '0px',
                      transform: nodeTransform,
                      overflow: 'visible',
                    }}
                  >
                      {/* Stage label (above node) - perfectly centered with node */}
                      <motion.div
                        className="text-center absolute"
                        style={{
                          top: `${nodeTop - 32}px`,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          whiteSpace: 'nowrap',
                          width: 'max-content',
                          textAlign: 'center',
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={isLabelVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-base font-medium text-[var(--text-primary)] text-center">
                          {stage.label}
                        </div>
                      </motion.div>

                      {/* Node - centered on timeline */}
                      <motion.div
                        className={`${stage.isFinal ? 'w-6 h-6' : 'w-5 h-5'} rounded-full bg-accent flex items-center justify-center flex-shrink-0 absolute z-20`}
                        style={{
                          top: `${nodeTop}px`,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 20,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={isNodeVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: [0.34, 1.56, 0.64, 1], // Overshoot bounce
                        }}
                      >
                        {stage.isFinal && isNodeVisible && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            style={{ opacity: 1 }}
                          >
                            <Check className="w-4 h-4 text-black" style={{ opacity: 1 }} />
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Timeframe label (below node) - perfectly centered with node */}
                      <motion.div
                        className="text-center absolute"
                        style={{
                          top: `${nodeTop + nodeSize + 10}px`,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          whiteSpace: 'nowrap',
                          width: 'max-content',
                          textAlign: 'center',
                        }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={isLabelVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        {stage.isFinal ? (
                          <motion.div
                            className={`text-sm font-semibold text-accent whitespace-nowrap flex items-center gap-1 justify-center ${
                              showCheckmark ? 'scale-110' : ''
                            }`}
                            animate={showCheckmark ? {
                              scale: [1, 1.1, 1],
                              filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
                            } : {}}
                            transition={{ duration: 0.5, delay: 0 }}
                          >
                            {dealClosedDate || formatDate(startDate)}
                          </motion.div>
                        ) : (
                          <div className="text-sm text-[var(--text-secondary)] whitespace-nowrap text-center">
                            {stage.timeframe}
                          </div>
                        )}
                      </motion.div>
                    </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
