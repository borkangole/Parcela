"use client";

// The intro on the login page: the nine lots of the P drop in (the cherry lot last),
// "PARCELA" rises letter by letter, then the whole logo glides into its real place
// in the page while the black screen fades away, and crossfades into the real logo.
//
// Plays once per browser session, on a full page load only. Click or any key skips it.
// Skipped entirely for visitors who ask their device to reduce motion.
import { useEffect, useRef } from "react";

const STORAGE_KEY = "parcela-intro-seen";
const EXIT_AT = 1650; // ms after page load when the logo starts moving to its place
const EXIT_MS = 750;

// Order the lots are placed in: the stem from the bottom up, then the bowl, the sold lot last.
// [column, row] on the 3 x 4 grid, same geometry as <ParcelaMark>.
const ORDER: [number, number][] = [
  [0, 3], [0, 2], [0, 1], [0, 0],
  [1, 0], [2, 1], [2, 2], [1, 2],
  [2, 0], // the cherry lot
];
const UNIT = 8.4;
const STEP = UNIT + 1.6;
const OX = (40 - (3 * UNIT + 2 * 1.6)) / 2;
const OY = (40 - (4 * UNIT + 3 * 1.6)) / 2;

// Runs before the page is painted (server HTML only), so there is never a flash of the
// page before the intro, and the intro never shows when it shouldn't.
const DECIDE = `try{var d=document.documentElement;d.dataset.intro=(sessionStorage.getItem("${STORAGE_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)?"skip":"play"}catch(e){document.documentElement.dataset.intro="skip"}`;

export function LogoIntro() {
  const lockupRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro !== "play") return;

    let finished = false;
    const finish = () => {
      root.dataset.intro = "done";
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    };

    const exit = (duration: number) => {
      if (finished) return;
      finished = true;
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);

      const lockup = lockupRef.current;
      const bg = bgRef.current;
      // The real logo on the page that's visible at this screen size
      const target = [...document.querySelectorAll<HTMLElement>("[data-intro-target]")].find(
        (el) => el.offsetParent !== null,
      );
      if (!lockup || !bg || !target) return finish();

      // FLIP: move and shrink the big logo onto the real one, then swap them.
      const from = lockup.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const scale = to.height / from.height;
      const dx = to.left - from.left;
      const dy = to.top - from.top;
      const color = getComputedStyle(target).color;
      const ease = "cubic-bezier(0.65, 0, 0.2, 1)";

      lockup.animate(
        [
          { transform: "translate(0, 0) scale(1)" },
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, color },
        ],
        { duration, easing: ease, fill: "forwards" },
      );
      root.dataset.intro = "leaving"; // lets the page rise in underneath
      bg.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: duration * 0.8,
        delay: duration * 0.15,
        easing: "ease-out",
        fill: "forwards",
      })
        .finished.then(() => {
          // Crossfade onto the real logo (hides any sub-pixel difference in the lettering).
          root.dataset.intro = "landing";
          return lockup.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" })
            .finished;
        })
        .then(finish, finish);
    };

    const skip = () => exit(380);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);

    const wait = Math.max(0, EXIT_AT - performance.now());
    const timer = window.setTimeout(() => exit(EXIT_MS), wait);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DECIDE }} />
      <div className="logo-intro" aria-hidden>
        <div ref={bgRef} className="logo-intro-bg" />
        <div className="logo-intro-stage">
          <div ref={lockupRef} className="logo-intro-lockup">
            <svg viewBox="0 0 40 40" className="logo-intro-mark">
              {ORDER.map(([c, r], i) => (
                <rect
                  key={`${c}-${r}`}
                  x={OX + c * STEP}
                  y={OY + r * STEP}
                  width={UNIT}
                  height={UNIT}
                  className={i === ORDER.length - 1 ? "intro-lot intro-lot-sold" : "intro-lot"}
                  style={{ "--i": i } as React.CSSProperties}
                />
              ))}
            </svg>
            <span className="logo-intro-word">
              {"PARCELA".split("").map((ch, i) => (
                <span key={i} className="intro-letter" style={{ "--i": i } as React.CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
