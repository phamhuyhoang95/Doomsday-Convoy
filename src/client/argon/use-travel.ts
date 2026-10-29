import { useLayoutEffect, useRef, useState } from "react";
import type { GameState } from "../../core/state-schema";
import type { GameTransition } from "../use-game";
export interface TravelShot {
  key: string;
  from: string;
  to: string;
  hours: number;
  hazard: boolean;
}
export function useTravel(
  state: GameState | null,
  transition: GameTransition | null,
) {
  const [shot, setShot] = useState<TravelShot | null>(null);
  const cancel = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    const moved = transition?.events.find(
      (e) =>
        e.payload.type === "convoy.moved" &&
        e.payload.convoyId === state?.player.convoyId,
    )?.payload;
    if (
      !state ||
      !transition ||
      moved?.type !== "convoy.moved" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShot(null);
      return;
    }
    const next = {
      key: `${state.initialSeed}:${state.commandLog.length}`,
      from: moved.from,
      to: moved.to,
      hours: state.world.tick - transition.before.world.tick,
      hazard: transition.events.some((e) => e.payload.type === "travel.hazard"),
    };
    setShot(next);
    const finish = () => setShot(null);
    cancel.current = finish;
    // Independent of media events: a failed/blocked video never traps the player.
    const timer = window.setTimeout(finish, 6000);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    document.addEventListener("keydown", key);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", key);
      cancel.current = () => {};
    };
  }, [state, transition]);
  return { shot, skip: () => cancel.current() };
}
