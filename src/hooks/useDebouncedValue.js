import { useEffect, useState } from 'react';

/**
 * Single source of truth for how long search inputs wait before firing their
 * API call. Tune this one value to change the debounce delay app-wide.
 */
export const SEARCH_DEBOUNCE_MS = 500;

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms have
 * passed without `value` changing. Used to throttle API calls driven by search
 * inputs so we hit the backend once the user pauses typing, not on every key press.
 */
export default function useDebouncedValue(value, delay = SEARCH_DEBOUNCE_MS) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
