import type { useAudio } from "../audio";

export function AudioControl({
  audio,
}: {
  audio: ReturnType<typeof useAudio>;
}) {
  const playing = audio.enabled && audio.status === "Đang phát";
  return (
    <div className="audio-control">
      <button
        className={`button subtle ${playing ? "audio-on" : ""}`}
        aria-label={playing ? "Tắt âm thanh" : "Bật âm thanh"}
        onClick={() => audio.setEnabled(!playing)}
        title={audio.status}
      >
        {playing ? "♫" : "♩"}
        <span>Âm thanh</span>
      </button>
      <label title="Âm lượng">
        <input
          aria-label="Âm lượng"
          type="range"
          min="0"
          max="100"
          value={Math.round(audio.volume * 100)}
          onChange={(event) => {
            audio.setVolume(Number(event.target.value) / 100);
            void audio.unlock();
          }}
        />
      </label>
      <small className="audio-status" aria-live="polite">
        {audio.enabled ? audio.status : "Đã tắt"}
      </small>
    </div>
  );
}
