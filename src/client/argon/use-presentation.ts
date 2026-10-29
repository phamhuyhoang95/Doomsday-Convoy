import { useLayoutEffect, useRef, useState } from "react";
import type { GameState } from "../../core/state-schema";
import type { DomainEvent } from "../../core/events";
import type { GameTransition } from "../use-game";

type Beat = Extract<DomainEvent["payload"], { type: "battle.beat" }>;
export function usePresentation(
  state: GameState | null,
  transition: GameTransition | null,
  sound: (beat: Beat) => void,
) {
  const [frame, setFrame] = useState<GameState | null>(state);
  const [beat, setBeat] = useState<Beat | null>(null);
  const [busy, setBusy] = useState(false);
  const cancel = useRef<() => void>(() => {});
  const soundRef = useRef(sound);
  soundRef.current = sound;
  useLayoutEffect(() => {
    const beats =
      transition?.events.flatMap((e) =>
        e.payload.type === "battle.beat" ? [e.payload] : [],
      ) ?? [];
    if (
      !state ||
      !transition ||
      !beats.length ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setFrame(state);
      setBeat(null);
      setBusy(false);
      if (beats[0]) soundRef.current(beats[0]);
      return;
    }
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const view = structuredClone(transition.before);
    setFrame(structuredClone(view));
    setBusy(true);
    const finish = () => {
      alive = false;
      timers.forEach(clearTimeout);
      setFrame(state);
      setBeat(null);
      setBusy(false);
    };
    cancel.current = finish;
    const play = (i: number) => {
      if (!alive) return;
      const current = beats[i];
      if (!current) {
        finish();
        return;
      }
      setBeat(current);
      timers.push(
        setTimeout(() => {
          if (!alive) return;
          soundRef.current(current);
          const target = view.actors[current.targetId];
          if (target && current.healthAfter !== undefined) {
            target.health = current.healthAfter;
            target.status = target.health === 0 ? "downed" : "active";
          }
          for (const convoy of Object.values(view.convoys))
            if (
              convoy.vehicle.id === current.targetId &&
              current.healthAfter !== undefined
            )
              convoy.vehicle.condition = current.healthAfter;
          if (current.effect === "move" && view.combat?.tactics) {
            const positions = view.combat.tactics.positions;
            const old = positions[current.actorId]!;
            const occupant = Object.keys(positions).find(
              (id) =>
                view.actors[id]?.convoyId ===
                  view.actors[current.actorId]?.convoyId &&
                positions[id] === current.amount,
            );
            if (occupant) positions[occupant] = old;
            positions[current.actorId] = current.amount;
          }
          setFrame(structuredClone(view));
        }, 170),
      );
      timers.push(
        setTimeout(() => play(i + 1), current.effect === "status" ? 280 : 620),
      );
    };
    play(0);
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      cancel.current = () => {};
    };
  }, [state, transition]);
  return { frame: frame ?? state, beat, busy, skip: () => cancel.current() };
}
