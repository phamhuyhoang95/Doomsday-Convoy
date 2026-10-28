import { useEffect, useRef, useState } from "react";
import type { ActionReport } from "../read-models/transition";
import type { DomainEvent } from "../core/events";

type Scene = "menu" | "road" | "combat";
type Cue =
  | "travel"
  | "scout"
  | "rest"
  | "repair"
  | "attack"
  | "heal"
  | "skill"
  | "reward"
  | "hurt"
  | "victory"
  | "choice"
  | "config"
  | "battle"
  | "heavy_hit"
  | "heartbeat"
  | "eerie_bell";

/** Procedural audio is a client effect. No audio clocks or nodes enter GameState. */
class AudioDirector {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: GainNode | null = null;
  private drone: OscillatorNode | null = null;
  private scene: Scene = "menu";
  enabled = true;
  volume = 0.4;
  status = "Chờ tương tác";
  changed: (() => void) | null = null;

  constructor() {
    try {
      const raw = localStorage.getItem("last-convoy:audio");
      if (raw) {
        const data = JSON.parse(raw) as { enabled?: boolean; volume?: number };
        this.enabled = data.enabled !== false;
        if (typeof data.volume === "number")
          this.volume = Math.max(0, Math.min(1, data.volume));
      }
    } catch {
      /* audio remains usable without storage */
    }
  }
  private persist() {
    try {
      localStorage.setItem(
        "last-convoy:audio",
        JSON.stringify({ enabled: this.enabled, volume: this.volume }),
      );
    } catch {
      /* preference only */
    }
  }
  async unlock(): Promise<void> {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        const compressor = this.context.createDynamicsCompressor();
        compressor.threshold.value = -14;
        this.master.connect(compressor);
        compressor.connect(this.context.destination);
        this.ambient = this.context.createGain();
        this.ambient.gain.value = 0;
        this.ambient.connect(this.master);
        this.drone = this.context.createOscillator();
        this.drone.type = "sine";
        this.drone.frequency.value = 55;
        this.drone.connect(this.ambient);
        this.drone.start();
        const buffer = this.context.createBuffer(
          1,
          this.context.sampleRate * 3,
          this.context.sampleRate,
        );
        const data = buffer.getChannelData(0);
        let seed = 0x12345678;
        for (let i = 0; i < data.length; i += 1) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          data[i] = ((seed / 0x100000000) * 2 - 1) * 0.35;
        }
        const wind = this.context.createBufferSource();
        wind.buffer = buffer;
        wind.loop = true;
        const filter = this.context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 420;
        wind.connect(filter);
        filter.connect(this.ambient);
        wind.start();
      }
      await this.context.resume();
      this.status =
        this.context.state === "running" ? "Đang phát" : "Chạm để phát";
      this.applyVolume();
      this.setScene(this.scene);
      this.changed?.();
    } catch {
      this.status = "Trình duyệt chưa cho phát âm thanh";
      this.changed?.();
    }
  }
  private applyVolume() {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        this.enabled ? this.volume * 0.35 : 0,
        this.context.currentTime,
        0.04,
      );
  }
  setEnabled(value: boolean) {
    this.enabled = value;
    this.persist();
    this.applyVolume();
    if (value) void this.unlock().then(() => this.cue("reward"));
    else this.status = "Đã tắt";
    this.changed?.();
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    this.persist();
    this.applyVolume();
    this.changed?.();
  }
  setScene(scene: Scene) {
    this.scene = scene;
    if (this.context && this.ambient)
      this.ambient.gain.setTargetAtTime(
        scene === "menu" ? 0 : scene === "combat" ? 0.2 : 0.12,
        this.context.currentTime,
        0.6,
      );
    if (this.context && this.drone)
      this.drone.frequency.setTargetAtTime(
        scene === "combat" ? 73 : 55,
        this.context.currentTime,
        0.4,
      );
  }
  private tone(
    frequency: number,
    duration: number,
    offset = 0,
    type: OscillatorType = "sine",
    strength = 0.55,
  ) {
    if (!this.context || !this.master) return;
    const at = this.context.currentTime + offset;
    const node = this.context.createOscillator();
    const gain = this.context.createGain();
    node.type = type;
    node.frequency.setValueAtTime(frequency, at);
    node.frequency.exponentialRampToValueAtTime(
      Math.max(25, frequency * 0.8),
      at + duration,
    );
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(strength, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    node.connect(gain);
    gain.connect(this.master);
    node.start(at);
    node.stop(at + duration + 0.03);
    node.onended = () => {
      node.disconnect();
      gain.disconnect();
    };
  }
  cue(cue: Cue) {
    if (!this.enabled || !this.context || this.context.state !== "running")
      return;
    switch (cue) {
      case "travel":
        this.tone(90, 0.6, 0, "sawtooth", 0.16);
        this.tone(72, 0.4, 0.12, "triangle", 0.2);
        break;
      case "attack":
        this.tone(140, 0.12, 0, "sawtooth", 0.7);
        this.tone(48, 0.22, 0.02, "triangle", 0.6);
        break;
      case "hurt":
        this.tone(66, 0.3, 0, "sawtooth", 0.35);
        break;
      case "scout":
        this.tone(600, 0.22);
        this.tone(900, 0.3, 0.13);
        break;
      case "heal":
        this.tone(330, 0.4);
        this.tone(440, 0.4, 0.1);
        this.tone(660, 0.45, 0.22);
        break;
      case "skill":
        this.tone(250, 0.2, 0, "triangle");
        this.tone(500, 0.3, 0.1, "triangle");
        break;
      case "reward":
        this.tone(523, 0.24);
        this.tone(659, 0.3, 0.1);
        break;
      case "victory":
        [262, 330, 392, 523].forEach((note, i) =>
          this.tone(note, 0.45, i * 0.11, "triangle"),
        );
        break;
      case "repair":
        [0, 0.11, 0.22].forEach((delay) =>
          this.tone(180, 0.08, delay, "square", 0.18),
        );
        break;
      case "rest":
        this.tone(196, 0.7, 0, "sine", 0.25);
        this.tone(294, 0.6, 0.2, "sine", 0.2);
        break;
      case "battle":
        this.tone(110, 0.5, 0, "sawtooth", 0.3);
        this.tone(165, 0.5, 0.2, "sawtooth", 0.25);
        break;
      case "config":
        this.tone(440, 0.14, 0, "triangle", 0.3);
        this.tone(660, 0.2, 0.09, "triangle", 0.25);
        break;
      case "choice":
        this.tone(220, 0.18, 0, "triangle", 0.25);
        break;
      case "heavy_hit":
        this.tone(80, 0.35, 0, "sawtooth", 0.75);
        this.tone(42, 0.45, 0.03, "triangle", 0.85);
        this.tone(190, 0.15, 0.01, "square", 0.35);
        break;
      case "heartbeat":
        this.tone(55, 0.18, 0, "sine", 0.65);
        this.tone(45, 0.22, 0.14, "sine", 0.55);
        break;
      case "eerie_bell":
        this.tone(440, 0.85, 0, "sine", 0.35);
        this.tone(880, 0.7, 0.02, "sine", 0.25);
        this.tone(1320, 0.5, 0.04, "sine", 0.15);
        break;
    }
  }
  play(report: ActionReport, events: readonly DomainEvent[]) {
    const payloads = events.map((event) => event.payload);
    const isHeavyHit =
      payloads.some(
        (p) =>
          (p.type === "combat.action" &&
            p.action !== "heal" &&
            p.amount >= 20) ||
          p.type === "travel.hazard",
      ) || report.vehicle < -5;
    const isAnomalyEvent = payloads.some(
      (p) =>
        p.type === "event.resolved" &&
        (p.eventId.includes("hospital") ||
          p.eventId.includes("bell") ||
          p.eventId.includes("echo")),
    );

    const cue: Cue = report.victory
      ? "victory"
      : isHeavyHit
        ? "heavy_hit"
        : payloads.some((p) => p.type === "combat.started")
          ? "battle"
          : isAnomalyEvent
            ? "eerie_bell"
            : payloads.some(
                (p) =>
                  p.type === "combat.action" &&
                  (p.action === "attack" || p.action === "skill"),
              )
              ? "attack"
              : payloads.some((p) => p.type === "skill.used")
                ? payloads.some(
                    (p) => p.type === "combat.action" && p.action === "heal",
                  )
                  ? "heal"
                  : "skill"
                : payloads.some((p) => p.type === "expedition.scouted")
                  ? "scout"
                  : payloads.some((p) => p.type === "vehicle.repaired")
                    ? "repair"
                    : payloads.some((p) => p.type === "expedition.rested")
                      ? "rest"
                      : payloads.some((p) => p.type === "actor.configured")
                        ? "config"
                        : payloads.some((p) => p.type === "convoy.moved")
                          ? "travel"
                          : Object.values(report.gains).some((n) => n > 0)
                            ? "reward"
                            : "choice";
    void this.unlock().then(() => {
      this.cue(cue);
      if (report.danger) {
        if (cue !== "heavy_hit" && cue !== "attack") this.cue("hurt");
        this.cue("heartbeat");
      }
    });
  }
  close() {
    this.changed = null;
    if (this.context) void this.context.close().catch(() => {});
  }
}

export function useAudio() {
  const ref = useRef<AudioDirector | null>(null);
  if (!ref.current) ref.current = new AudioDirector();
  const director = ref.current;
  const [, refresh] = useState(0);
  useEffect(() => {
    director.changed = () => refresh((n) => n + 1);
    return () => director.close();
  }, [director]);
  return {
    enabled: director.enabled,
    volume: director.volume,
    status: director.status,
    unlock: () => director.unlock(),
    setEnabled: (value: boolean) => director.setEnabled(value),
    setVolume: (value: number) => director.setVolume(value),
    setScene: (scene: Scene) => director.setScene(scene),
    play: (report: ActionReport, events: readonly DomainEvent[]) =>
      director.play(report, events),
  };
}
