import { useLayoutEffect, useRef } from "react";
import { phaseDuration, type JourneyState } from "../game";

export type PhaseClock = { read: () => number };

/** One visibility-aware clock shared by the story and its atmosphere. */
export function useJourneyClock(journey: JourneyState, onAdvance: () => void) {
  const clock = useRef<PhaseClock>({ read: () => 0 });
  const advanceRef = useRef(onAdvance);
  const paceRef = useRef(journey.settings.pace);
  const changePace = useRef<((pace: number) => void) | null>(null);

  useLayoutEffect(() => {
    advanceRef.current = onAdvance;
    paceRef.current = journey.settings.pace;
  }, [onAdvance, journey.settings.pace]);

  useLayoutEffect(() => {
    clock.current = { read: () => 0 };
    changePace.current = null;
    if (journey.phase === "waiting") return;
    const phase = journey.phase;

    // The parent pace setting scales every phase by the same factor.
    let duration = phaseDuration(phase, paceRef.current);
    let elapsed = 0;
    let startedAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const read = () =>
      Math.min(
        1,
        (elapsed + (timer === undefined ? 0 : performance.now() - startedAt)) /
          duration,
      );
    clock.current = { read };

    const resume = () => {
      if (timer !== undefined) return;
      startedAt = performance.now();
      timer = setTimeout(() => {
        elapsed = duration;
        clearTimeout(timer);
        timer = undefined;
        advanceRef.current();
      }, duration - elapsed);
    };
    const pause = () => {
      if (timer === undefined) return;
      elapsed = Math.min(duration, elapsed + performance.now() - startedAt);
      clearTimeout(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) pause();
      else resume();
    };
    changePace.current = (pace) => {
      // Parent presets may change speed mid-leg: keep distance already covered.
      const progress = read();
      pause();
      duration = phaseDuration(phase, pace);
      elapsed = progress * duration;
      if (!document.hidden && progress < 1) resume();
    };
    if (!document.hidden) resume();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      changePace.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [journey.phase, journey.tourIndex]);

  useLayoutEffect(() => {
    changePace.current?.(journey.settings.pace);
  }, [journey.settings.pace]);
  return clock;
}
