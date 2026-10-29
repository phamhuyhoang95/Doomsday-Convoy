import { useEffect, useRef, useState } from "react";

/** Presentation only: starting/skipping a film never dispatches a gameplay command. */
export function OpeningCinematic({
  finish,
  volume,
}: {
  finish: () => void;
  volume: number;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const close = useRef(finish);
  close.current = finish;
  const [reduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => close.current(), 12000);
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
    };
    document.addEventListener("keydown", key);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    if (video.current) video.current.volume = volume;
  }, [volume]);
  return (
    <section
      className="travel-cinematic opening-cinematic"
      role="dialog"
      aria-modal="true"
      aria-labelledby="opening-title"
    >
      <div
        className="travel-film"
        data-playback={
          failed
            ? "fallback"
            : reduced
              ? "reduced"
              : playing
                ? "playing"
                : "waiting"
        }
      >
        {failed || reduced ? (
          <img
            className="opening-still"
            src="/video/resonance/zero-bell-opening.jpg"
            alt="Xe số 07 trong khu chợ mưa"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/art/argon/market-stage.jpg";
            }}
          />
        ) : (
          <video
            ref={video}
            autoPlay
            playsInline
            muted={volume === 0}
            preload="auto"
            poster="/video/resonance/zero-bell-opening.jpg"
            onPlaying={() => setPlaying(true)}
            onEnded={finish}
            onError={() => setFailed(true)}
            aria-label="Xe số 07 lăn bánh qua khu chợ trong mưa"
          >
            <source
              src="/video/resonance/zero-bell-opening.mp4"
              type="video/mp4"
              onError={() => setFailed(true)}
            />
          </video>
        )}
      </div>
      <div className="travel-grain" />
      <header>
        <span>LAST CONVOY / HỒI CHUÔNG SỐ KHÔNG</span>
        <button autoFocus onClick={finish}>
          Bỏ qua mở đầu ↗
        </button>
      </header>
      <div className="travel-caption">
        <small>00:07 / THÀNH PHỐ KHÔNG CÒN TRẢ LỜI</small>
        <h1 id="opening-title">
          Đừng đáp lại
          <br />
          tiếng gọi cuối cùng.
        </h1>
        <p>Giữ đèn sáng. Đếm đủ người. Tiếp tục đi.</p>
        {!playing && !failed && !reduced && (
          <button
            onClick={() => {
              void video.current?.play().catch(() => setFailed(true));
            }}
          >
            Phát mở đầu ▷
          </button>
        )}
        {(failed || reduced) && (
          <button onClick={finish}>Tiếp tục hành trình ↗</button>
        )}
      </div>
    </section>
  );
}
