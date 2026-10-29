import { useEffect, useRef, useState } from "react";
import type { GameState } from "../../core/state-schema";
import type { GameCommand } from "../../core/commands";
import type { WorldDefinition } from "../../world/schema";
import { autoCombatAction } from "../../read-models/auto-combat";

export function useAutoCombat(
  state: GameState,
  definition: WorldDefinition,
  busy: boolean,
  dispatch: (p: GameCommand["payload"]) => boolean | void,
) {
  const [enabled, setEnabled] = useState(false);
  const previous = useRef(state);
  const submitted = useRef<string | null>(null);
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  useEffect(() => {
    const before = previous.current;
    previous.current = state;
    if (
      state.combat?.phase !== "active" ||
      before.combat?.id !== state.combat?.id ||
      (before !== state && state.commandLog.length <= before.commandLog.length)
    )
      setEnabled(false);
  }, [state]);
  useEffect(() => {
    const stop = () => setEnabled(false);
    const hide = () => {
      if (document.hidden) stop();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };
    document.addEventListener("visibilitychange", hide);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      document.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (!enabled || busy || document.hidden) return;
    const payload = autoCombatAction(state, definition);
    if (!payload) {
      setEnabled(false);
      return;
    }
    const token = `${state.combat?.id}:${state.commandLog.length}`;
    if (submitted.current === token) {
      setEnabled(false);
      return;
    }
    const timer = window.setTimeout(() => {
      if (document.hidden) {
        setEnabled(false);
        return;
      }
      submitted.current = token;
      if (dispatchRef.current(payload) === false) setEnabled(false);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [enabled, busy, state, definition]);
  return {
    enabled,
    stop: () => setEnabled(false),
    toggle: () => setEnabled((value) => !value),
  };
}
