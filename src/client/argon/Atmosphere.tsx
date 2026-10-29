import { useEffect, useRef } from "react";

/** Decorative GPU layer only. Missing WebGL never prevents a game command. */
export function Atmosphere({ intense = false }: { intense?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const impact = useRef(false);
  impact.current = intense;
  useEffect(() => {
    const element = host.current;
    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let alive = true;
    let cleanup = () => {};
    void (async () => {
      try {
        const { Application, Graphics } = await import("pixi.js");
        if (!alive) return;
        const app = new Application();
        await app.init({
          resizeTo: element,
          backgroundAlpha: 0,
          antialias: false,
          resolution: Math.min(window.devicePixelRatio || 1, 1.5),
          autoDensity: true,
          preference: "webgl",
        });
        if (!alive) {
          app.destroy(true, { children: true });
          return;
        }
        element.appendChild(app.canvas);
        const rain = new Graphics();
        app.stage.addChild(rain);
        let elapsed = 0;
        app.ticker.add((ticker) => {
          elapsed += ticker.deltaMS;
          rain.clear();
          const w = app.screen.width,
            h = app.screen.height;
          for (let i = 0; i < 65; i++) {
            const x = ((i * 137.7 + elapsed * 0.045) % (w + 60)) - 30;
            const y =
              ((i * 97.3 + elapsed * (0.32 + (i % 3) * 0.04)) % (h + 35)) - 25;
            rain
              .moveTo(x, y)
              .lineTo(x - 8, y + 23)
              .stroke({
                width: 0.8,
                color: 0xc5d8d5,
                alpha: 0.12 + (i % 3) * 0.025,
              });
          }
          if (impact.current) {
            for (let i = 0; i < 10; i++) {
              const theta = i * 0.628,
                r = elapsed % 220;
              rain
                .moveTo(
                  w / 2 + Math.cos(theta) * r,
                  h * 0.6 + Math.sin(theta) * r * 0.5,
                )
                .lineTo(
                  w / 2 + Math.cos(theta) * (r + 14),
                  h * 0.6 + Math.sin(theta) * (r + 14) * 0.5,
                )
                .stroke({ width: 2, color: 0xffba65, alpha: 0.6 });
            }
          }
        });
        const visibility = () => (document.hidden ? app.stop() : app.start());
        document.addEventListener("visibilitychange", visibility);
        cleanup = () => {
          document.removeEventListener("visibilitychange", visibility);
          app.destroy(true, { children: true });
        };
        visibility();
      } catch {
        element.dataset.fallback = "css";
      }
    })();
    return () => {
      alive = false;
      cleanup();
    };
  }, []);
  return <div className="atmosphere" ref={host} aria-hidden="true" />;
}
