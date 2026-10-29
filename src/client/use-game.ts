import { useEffect, useState } from "react";
import { argonDefinition } from "../content/argon";
import { campaignDefinition } from "../content/campaign";
import type { GameCommand } from "../core/commands";
import type { DomainEvent } from "../core/events";
import { processCommand } from "../core/processor";
import { createGame } from "../core/state";
import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";
import { LocalSaveStore } from "../persistence/local-storage";
import { loadCompatibleSlot } from "../persistence/compatible";
import { summarizeTransition } from "../read-models/transition";
import type { ActionReport } from "../read-models/transition";
import { useAudio } from "./audio";

export interface GameTransition {
  before: GameState;
  after: GameState;
  events: DomainEvent[];
}

/** QA setups use the same accepted commands as the game; never write localStorage. */
function previewState(kind: string): GameState {
  let current = createGame(42, argonDefinition);
  const take = (payload: GameCommand["payload"]) => {
    const result = processCommand(
      current,
      {
        id: `command.${current.commandLog.length + 1}`,
        issuerId: current.player.id,
        payload,
      },
      { principalId: current.player.id },
      argonDefinition,
    );
    if (!result.ok) throw new Error(result.error.message);
    current = result.state;
  };
  const choose = (choiceId: string) =>
    take({
      type: "choose",
      convoyId: current.player.convoyId,
      instanceId: current.activeEvents[0]!.instanceId,
      choiceId,
    });
  if (kind === "gara") return current;
  choose("prepare");
  if (kind === "map") return current;
  take({
    type: "travel",
    convoyId: current.player.convoyId,
    routeId: "route.garage-market",
  });
  if (kind === "scenario") {
    take({
      type: "scenario-start",
      convoyId: current.player.convoyId,
      scenarioId: "scenario.market-blackout",
      scoutIds: ["character.minh", "character.bao"],
      guardId: "character.lan",
    });
    return current;
  }
  if (kind === "market") return current;
  choose("leave-ha");
  choose("raid-cache");
  return current;
}

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [definition, setDefinition] =
    useState<WorldDefinition>(argonDefinition);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<ActionReport | null>(null);
  const [transition, setTransition] = useState<GameTransition | null>(null);
  const audio = useAudio();
  const store = (content = definition) =>
    new LocalSaveStore(window.localStorage, content);
  const slotName = (slot: string, content = definition) =>
    content.campaign?.tactics
      ? `argon-${slot}`
      : content.campaign?.operations
        ? `r1-${slot}`
        : slot;
  const safely = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Không thể thực hiện thao tác.",
      );
    }
  };
  const start = (seed: number) =>
    safely(() => {
      void audio.unlock();
      const next = createGame(seed, argonDefinition);
      setDefinition(argonDefinition);
      setState(next);
      setReport(null);
      setTransition(null);
      setMessage("");
      audio.setScene("road");
      try {
        store(argonDefinition).save("argon-autosave", next);
      } catch {
        setMessage("Đã bắt đầu nhưng chưa ghi được autosave.");
      }
    });
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const kind = new URLSearchParams(window.location.search).get("qa");
    if (kind)
      safely(() => {
        const next = previewState(kind);
        setState(next);
        setDefinition(argonDefinition);
      });
  }, []);
  const dispatch = (payload: GameCommand["payload"]) => {
    if (!state) return;
    void audio.unlock();
    const command = {
      id: `command.${state.commandLog.length + 1}`,
      issuerId: state.player.id,
      payload,
    };
    const result = processCommand(
      state,
      command,
      { principalId: state.player.id },
      definition,
    );
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }
    const summary = summarizeTransition(
      state,
      result.state,
      command,
      result.events,
      definition,
    );
    setState(result.state);
    setReport(summary);
    setTransition({
      before: state,
      after: result.state,
      events: result.events,
    });
    setMessage("");
    audio.setScene(
      result.state.combat
        ? "combat"
        : result.state.status === "active"
          ? "road"
          : "menu",
    );
    if (!result.events.some((e) => e.payload.type === "battle.beat"))
      audio.play(summary, result.events);
    // Save the authoritative result before the presentation queue starts.
    try {
      store().save(slotName("autosave"), result.state);
    } catch {
      setMessage("Hành động đã thực hiện nhưng autosave không ghi được.");
    }
  };
  const load = (slot = "manual") =>
    safely(() => {
      const loaded =
        slot === "legacy"
          ? loadCompatibleSlot(window.localStorage, "legacy")
          : slot === "r1"
            ? loadCompatibleSlot(window.localStorage, "manual")
            : {
                state: store(state ? definition : argonDefinition).load(
                  slotName(slot, state ? definition : argonDefinition),
                ),
                definition: state ? definition : argonDefinition,
              };
      void audio.unlock();
      setState(loaded.state);
      setDefinition(loaded.definition);
      setReport(null);
      setTransition(null);
      setMessage("Đã tải và xác minh replay.");
      audio.setScene(loaded.state.combat ? "combat" : "road");
    });
  return {
    state,
    definition,
    message,
    report,
    transition,
    audio,
    start,
    dispatch,
    load,
    save: () =>
      safely(() => {
        if (state) {
          store().save(slotName("manual"), state);
          setMessage("Đã lưu hành trình.");
        }
      }),
    menu: () => {
      setState(null);
      setReport(null);
      setTransition(null);
      setMessage("");
      audio.setScene("menu");
    },
    dismiss: () => setMessage(""),
    dismissReport: () => setReport(null),
    // Retain the known R1 bundle for explicitly selected older saves.
    legacyVersion: campaignDefinition.contentVersion,
  };
}
