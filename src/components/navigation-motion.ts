import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Respect the device setting for every navigator, including changes while open. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); });
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}
