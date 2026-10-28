import { useState } from "react";
import { campaignDefinition } from "../content/campaign";
import type { GameCommand } from "../core/commands";
import { processCommand } from "../core/processor";
import { createGame } from "../core/state";
import type { GameState } from "../core/state-schema";
import { LocalSaveStore } from "../persistence/local-storage";
import { SaveError } from "../persistence/save";
import { summarizeTransition } from "../read-models/transition";
import type { ActionReport } from "../read-models/transition";
import { useAudio } from "./audio";
import { loadCompatibleSlot } from "../persistence/compatible";

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [definition, setDefinition] = useState(campaignDefinition);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<ActionReport | null>(null);
  const audio = useAudio();
  const store = (content = definition): LocalSaveStore =>
    new LocalSaveStore(window.localStorage, content);
  const slotName = (slot: string, content = definition) =>
    content.campaign?.operations ? `r1-${slot}` : slot;
  const safely = (operation: () => void): void => {
    try {
      operation();
    } catch (error) {
      const saveMessages = {
        INVALID_SAVE: "Bản lưu bị lỗi hoặc thiếu dữ liệu.",
        UNSUPPORTED_VERSION: "Phiên bản bản lưu chưa được hỗ trợ.",
        CONTENT_MISMATCH: "Bản lưu dùng phiên bản nội dung khác.",
        REPLAY_MISMATCH: "Bản lưu không khớp lịch sử hành động.",
        STORAGE_ERROR: "Không truy cập được bộ nhớ trình duyệt.",
        NOT_FOUND: "Chưa có bản lưu ở slot này.",
      };
      setMessage(
        error instanceof SaveError
          ? saveMessages[error.code]
          : error instanceof Error
            ? error.message
            : "Không thể thực hiện thao tác.",
      );
    }
  };
  const start = (seed: number): void =>
    safely(() => {
      void audio.unlock();
      audio.setScene("road");
      const next = createGame(seed, campaignDefinition);
      setState(next);
      setDefinition(campaignDefinition);
      setReport(null);
      setMessage(
        "R1: Trinh sát lấy cache/intel, nâng chỉ số ngay trên map, rồi tới chợ để thử trận chiến đầu tiên.",
      );
      try {
        store(campaignDefinition).save("r1-autosave", next);
      } catch {
        setMessage("Đã bắt đầu nhưng chưa ghi được autosave.");
      }
    });
  const dispatch = (payload: GameCommand["payload"]): void => {
    if (!state) return;
    void audio.unlock();
    const command: GameCommand = {
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
      setReport(null);
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
    setMessage("");
    audio.setScene(
      result.state.combat
        ? "combat"
        : result.state.status === "active"
          ? "road"
          : "menu",
    );
    audio.play(summary, result.events);
    try {
      store().save(slotName("autosave"), result.state);
    } catch {
      setMessage("Hành động đã thực hiện nhưng autosave không ghi được.");
    }
  };
  const save = (): void =>
    safely(() => {
      if (state) {
        store().save(slotName("manual"), state);
        setMessage("Đã lưu hành trình. Slot R1 và v0.1 tách riêng.");
      }
    });
  const load = (slot = "manual"): void =>
    safely(() => {
      void audio.unlock();
      const loaded = loadCompatibleSlot(
        window.localStorage,
        slot,
        !!state && !definition.campaign?.operations,
      );
      const content = loaded.definition;
      const next = loaded.state;
      setDefinition(content);
      setState(next);
      setReport(null);
      audio.setScene(
        next.combat ? "combat" : next.status === "active" ? "road" : "menu",
      );
      setMessage(
        content.campaign?.operations
          ? "Đã tải hành trình R1 và xác minh replay."
          : "Đã giữ nguyên hành trình v0.1. Để chơi trinh sát/nghỉ/tùy chỉnh mới, về Menu và bắt đầu R1; bản lưu cũ không bị ghi đè.",
      );
    });
  return {
    state,
    definition,
    message,
    report,
    audio,
    start,
    dispatch,
    save,
    load,
    menu: () => {
      setState(null);
      setReport(null);
      audio.setScene("menu");
    },
    dismiss: () => setMessage(""),
    dismissReport: () => setReport(null),
  };
}
