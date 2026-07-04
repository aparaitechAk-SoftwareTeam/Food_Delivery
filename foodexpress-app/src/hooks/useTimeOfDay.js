/**
 * useTimeOfDay.js
 * React hook that returns the current time-of-day metadata
 * and automatically re-evaluates every 60 seconds.
 */
import { useState, useEffect } from "react";
import { getTimeOfDay, formatTime } from "../utils/timeOfDay";

/**
 * @returns {{ period: string, greeting: string, emoji: string, subtitle: string, accentColor: string, gradientColors: string[], timeLabel: string }}
 */
export function useTimeOfDay() {
  const [timeInfo, setTimeInfo] = useState(() => {
    const now = new Date();
    return { ...getTimeOfDay(now), timeLabel: formatTime(now) };
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeInfo({ ...getTimeOfDay(now), timeLabel: formatTime(now) });
    };

    // Re-check every 60 seconds
    const intervalId = setInterval(tick, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  return timeInfo;
}
