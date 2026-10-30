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
  private music: HTMLAudioElement | null = null;
  private musicGain: GainNode | null = null;
  musicVolume = 0.65;
  sfxVolume = 0.8;
  ambienceVolume = 0.55;
  private scene: Scene = "menu";
  enabled = true;
  volume = 0.4;
  status = "Chờ tương tác";
  changed: (() => void) | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;

  constructor() {
    try {
      const raw = localStorage.getItem("last-convoy:audio");
      if (raw) {
        const data = JSON.parse(raw) as {
          enabled?: boolean;
          volume?: number;
          music?: number;
          sfx?: number;
          ambience?: number;
        };
        this.enabled = data.enabled !== false;
        if (typeof data.volume === "number")
          this.volume = Math.max(0, Math.min(1, data.volume));
        if (typeof data.music === "number")
          this.musicVolume = Math.max(0, Math.min(1, data.music));
        if (typeof data.sfx === "number")
          this.sfxVolume = Math.max(0, Math.min(1, data.sfx));
        if (typeof data.ambience === "number")
          this.ambienceVolume = Math.max(0, Math.min(1, data.ambience));
      }
    } catch {
      /* audio remains usable without storage */
    }
  }
  private persist() {
    try {
      localStorage.setItem(
        "last-convoy:audio",
        JSON.stringify({
          enabled: this.enabled,
          volume: this.volume,
          music: this.musicVolume,
          sfx: this.sfxVolume,
          ambience: this.ambienceVolume,
        }),
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
        this.musicGain = this.context.createGain();
        this.musicGain.connect(this.master);
        this.music = new Audio("/audio/argon/market-combat.mp3");
        this.music.loop = true;
        this.music.preload = "none";
        this.context
          .createMediaElementSource(this.music)
          .connect(this.musicGain);
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
      this.startBgm();
      document.removeEventListener("visibilitychange", this.visibility);
      document.addEventListener("visibilitychange", this.visibility);
      this.changed?.();
    } catch {
      this.status = "Trình duyệt chưa cho phát âm thanh";
      this.changed?.();
    }
  }
  private startBgm() {
    if (this.bgmTimer != null || typeof window === "undefined") return;
    this.bgmTimer = window.setInterval(() => {
      if (!this.enabled || !this.context || this.context.state !== "running")
        return;
      this.tickBgm();
    }, 550);
  }
  private stopBgm() {
    if (this.bgmTimer != null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
  private tickBgm() {
    if (!this.context || !this.master) return;
    if (this.music && !this.music.paused && !this.music.error) return;
    this.bgmStep = (this.bgmStep + 1) % 32;

    if (this.scene === "combat") {
      if (this.bgmStep % 2 === 0) {
        this.musicTone(95, 0.22, 0, "triangle", 0.35);
        this.musicTone(48, 0.28, 0.01, "sine", 0.45);
      } else {
        this.musicTone(140, 0.08, 0, "sawtooth", 0.12);
      }
      if (this.bgmStep % 4 === 0) {
        const combatNotes = [58.27, 65.41, 69.3, 77.78];
        const note = combatNotes[(this.bgmStep / 4) % combatNotes.length]!;
        this.musicTone(note, 0.7, 0, "sawtooth", 0.18);
      }
    } else if (this.scene === "road" || this.scene === "menu") {
      if (this.bgmStep % 8 === 0) {
        const chords = [
          [130.81, 155.56, 196.0],
          [116.54, 155.56, 174.61],
          [103.83, 130.81, 155.56],
          [98.0, 146.83, 174.61],
        ];
        const chord = chords[Math.floor(this.bgmStep / 8) % chords.length]!;
        chord.forEach((freq, idx) => {
          this.musicTone(freq, 2.2, idx * 0.12, "sine", 0.12);
        });
      }
      if (this.bgmStep % 8 === 4) {
        const bellNotes = [523.25, 587.33, 659.25, 783.99];
        const bell =
          bellNotes[Math.floor(this.bgmStep / 8) % bellNotes.length]!;
        this.musicTone(bell, 0.8, 0, "triangle", 0.08);
      }
    }
  }
  private applyVolume() {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        this.enabled ? this.volume * 0.35 : 0,
        this.context.currentTime,
        0.04,
      );
    this.updateMusic();
  }
  private visibility = () => {
    if (document.hidden) {
      this.music?.pause();
      void this.context?.suspend();
    } else if (this.enabled)
      void this.context?.resume().then(() => this.updateMusic());
  };
  private updateMusic() {
    if (!this.context || !this.music || !this.musicGain) return;
    const playing = this.enabled && !document.hidden && this.scene === "combat";
    this.musicGain.gain.setTargetAtTime(
      playing ? this.musicVolume : 0,
      this.context.currentTime,
      0.45,
    );
    if (playing && this.context.state === "running")
      void this.music
        .play()
        .then(() => {
          if (
            this.music &&
            !this.music.paused &&
            this.scene === "combat" &&
            this.status !== "Đang phát nhạc combat"
          ) {
            this.status = "Đang phát nhạc combat";
            this.changed?.();
          }
        })
        .catch(() => {});
    else this.music.pause();
  }
  setMix(channel: "music" | "sfx" | "ambience", value: number) {
    const level = Math.max(0, Math.min(1, value));
    if (channel === "music") this.musicVolume = level;
    if (channel === "sfx") this.sfxVolume = level;
    if (channel === "ambience") this.ambienceVolume = level;
    this.persist();
    this.setScene(this.scene);
    this.changed?.();
  }
  setEnabled(value: boolean) {
    this.enabled = value;
    this.persist();
    this.applyVolume();
    if (value) {
      this.startBgm();
      void this.unlock().then(() => this.cue("reward"));
    } else {
      this.stopBgm();
      this.status = "Đã tắt";
    }
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
        (scene === "menu" ? 0 : scene === "combat" ? 0.2 : 0.12) *
          this.ambienceVolume,
        this.context.currentTime,
        0.6,
      );
    this.updateMusic();
    if (this.context && this.drone)
      this.drone.frequency.setTargetAtTime(
        scene === "combat" ? 73 : 55,
        this.context.currentTime,
        0.4,
      );
  }
  private musicTone(
    frequency: number,
    duration: number,
    offset = 0,
    type: OscillatorType = "sine",
    strength = 0.55,
  ) {
    this.tone(frequency, duration, offset, type, strength, "music");
  }
  private tone(
    frequency: number,
    duration: number,
    offset = 0,
    type: OscillatorType = "sine",
    strength = 0.55,
    channel: "music" | "sfx" = "sfx",
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
    gain.gain.exponentialRampToValueAtTime(
      Math.max(
        0.0001,
        strength * (channel === "music" ? this.musicVolume : this.sfxVolume),
      ),
      at + 0.008,
    );
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
  private noiseBurst(duration: number, strength: number, frequency: number) {
    if (!this.context || !this.master) return;
    const samples = Math.ceil(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(
      1,
      samples,
      this.context.sampleRate,
    );
    const data = buffer.getChannelData(0);
    let seed = 0x735a1d;
    for (let i = 0; i < samples; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = (seed / 0x80000000 - 1) * Math.pow(1 - i / samples, 2);
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    const gain = this.context.createGain();
    gain.gain.value = strength * this.sfxVolume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
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
        this.noiseBurst(0.13, 0.65, 1700);
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
        this.noiseBurst(0.3, 0.95, 650);
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
    const field = payloads.find((p) => p.type === "field.event");
    if (field?.type === "field.event") {
      void this.unlock().then(() => {
        if (report.danger || field.cue === "hit") {
          this.cue("hurt");
          this.cue("heartbeat");
        } else if (field.cue === "advance") {
          this.tone(47, 0.25, 0, "sawtooth", 0.3);
          this.cue("heartbeat");
        } else if (field.cue === "knock") {
          for (const delay of [0, 0.16, 0.39])
            this.tone(95, 0.07, delay, "triangle", 0.3);
        } else if (field.action === "enter") this.cue("eerie_bell");
        else if (field.action === "return") this.cue("reward");
        else if (field.action === "rescue") this.cue("hurt");
        else if (field.action === "interact") this.cue("config");
        else if (field.action === "torch")
          this.tone(240, 0.04, 0, "square", 0.12);
        else if (field.action === "move")
          this.tone(68, 0.06, 0, "triangle", 0.18);
      });
      return;
    }
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
  playBeat(beat: Extract<DomainEvent["payload"], { type: "battle.beat" }>) {
    const cue: Cue =
      beat.effect === "heal" || beat.effect === "repair"
        ? "heal"
        : beat.effect === "damage" || beat.effect === "reflect"
          ? beat.amount >= 20
            ? "heavy_hit"
            : "attack"
          : beat.effect === "status"
            ? "skill"
            : "config";
    void this.unlock().then(() => this.cue(cue));
  }
  startTravel() {
    if (!this.enabled || !this.context || !this.master) return () => {};
    const context = this.context;
    const engine = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    engine.type = "sawtooth";
    engine.frequency.setValueAtTime(43, context.currentTime);
    engine.frequency.linearRampToValueAtTime(68, context.currentTime + 3);
    filter.type = "lowpass";
    filter.frequency.value = 170;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(
      this.sfxVolume * 0.28,
      context.currentTime + 0.6,
    );
    engine.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    engine.start();
    return () => {
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setTargetAtTime(0, context.currentTime, 0.06);
      engine.stop(context.currentTime + 0.25);
      engine.onended = () => {
        engine.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    };
  }
  close() {
    this.changed = null;
    this.stopBgm();
    document.removeEventListener("visibilitychange", this.visibility);
    this.music?.pause();
    this.music?.removeAttribute("src");
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
    musicVolume: director.musicVolume,
    sfxVolume: director.sfxVolume,
    ambienceVolume: director.ambienceVolume,
    status: director.status,
    unlock: () => director.unlock(),
    setEnabled: (value: boolean) => director.setEnabled(value),
    setVolume: (value: number) => director.setVolume(value),
    setMix: (channel: "music" | "sfx" | "ambience", value: number) =>
      director.setMix(channel, value),
    setScene: (scene: Scene) => director.setScene(scene),
    play: (report: ActionReport, events: readonly DomainEvent[]) =>
      director.play(report, events),
    startTravel: () => director.startTravel(),
    playBeat: (
      beat: Extract<DomainEvent["payload"], { type: "battle.beat" }>,
    ) => director.playBeat(beat),
  };
}
