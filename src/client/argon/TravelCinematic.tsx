import { useEffect, useRef, useState } from "react";
import type { TravelShot } from "./use-travel";
import { useDefinition } from "../definition";
export function TravelCinematic({
  shot,
  finish,
  motor,
}: {
  shot: TravelShot;
  finish: () => void;
  motor: () => () => void;
}) {
  const definition = useDefinition();
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const motorRef = useRef(motor);
  motorRef.current = motor;
  useEffect(() => {
    const stop = motorRef.current();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      stop();
      document.body.style.overflow = overflow;
    };
  }, [shot.key]);
  const place = (id: string) =>
    definition.locations.find((l) => l.id === id)?.name ?? "Phía trước";
  return (
    <section
      className="travel-cinematic"
      role="dialog"
      aria-modal="true"
      aria-labelledby="travel-title"
    >
      <div
        className={`travel-film ${failed ? "video-failed" : ""}`}
        data-playback={failed ? "fallback" : playing ? "playing" : "waiting"}
      >
        {!failed && (
          <video
            autoPlay
            muted
            playsInline
            preload="auto"
            poster="/video/journey/convoy-departure.jpg"
            onPlaying={() => setPlaying(true)}
            onEnded={finish}
            onError={() => setFailed(true)}
            aria-label="Xe khách lăn bánh trên đường mưa"
          >
            <source
              src="/video/journey/convoy-departure.mp4"
              type="video/mp4"
              onError={() => setFailed(true)}
            />
          </video>
        )}
        {failed && (
          <div className="travel-fallback">
            <img
              src="/art/a2/vehicle.bus.png"
              alt="Xe khách số 07 đang lên đường"
            />
          </div>
        )}
      </div>
      <div className="travel-grain" />
      <header>
        <span>LAST CONVOY / TRÊN ĐƯỜNG</span>
        <button autoFocus onClick={finish}>
          Bỏ qua chuyển cảnh ↗
        </button>
      </header>
      <div className="travel-caption">
        <small>
          {place(shot.from)} <span>———</span> {place(shot.to)}
        </small>
        <h1 id="travel-title">Đèn vẫn còn sáng.</h1>
        <p>
          {shot.hours} giờ qua vùng tối.{" "}
          {shot.hazard
            ? "Một va chạm trên đường. Kiểm tra đoàn xe khi tới nơi."
            : "Tiếng máy nổ giữ nhịp. Phía trước vẫn còn đường."}
        </p>
        <div className="travel-progress" />
      </div>
    </section>
  );
}
