import React, { useRef, useEffect } from "react";

/*
  PUBLIC_INTERFACE
  LyricsDisplay component displays lyrics, highlighting the line that matches current playback time.
  Props:
    - lyrics: Array<{ time: number, text: string }>
    - currentTime: Current playback time in seconds
*/
function LyricsDisplay({ lyrics, currentTime }) {
  const activeIndex = lyrics.findIndex((l, i) => {
    if (i === lyrics.length - 1) return currentTime >= l.time;
    return currentTime >= l.time && currentTime < lyrics[i + 1].time;
  });

  const lineRefs = useRef([]);

  useEffect(() => {
    if (activeIndex !== -1 && lineRefs.current[activeIndex]) {
      lineRefs.current[activeIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  return (
    <div
      style={{
        overflowY: "auto",
        maxHeight: 320,
        background: "rgba(30,40,50,0.90)",
        borderRadius: 10,
        padding: 20,
        border: "2px solid var(--border-color)",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
      aria-label="Lyrics"
      tabIndex={0}
    >
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {lyrics.map((line, i) => (
          <li
            key={i}
            ref={el => (lineRefs.current[i] = el)}
            style={{
              color: activeIndex === i ? "var(--base-light, #00ffff)" : "var(--text-secondary, #bfefff)",
              fontSize: activeIndex === i ? "1.34rem" : "1.05rem",
              fontWeight: activeIndex === i ? 700 : 450,
              opacity: activeIndex === i ? 1 : 0.68,
              background: activeIndex === i ? "rgba(36,255,250,0.13)" : "none",
              borderRadius: activeIndex === i ? 4 : 0,
              padding: "7px 2px",
              transition: "background 0.18s, color 0.18s, font-size 0.18s",
              textAlign: "center",
              letterSpacing: "0.01em",
            }}
            aria-current={activeIndex === i ? "true" : undefined}
          >
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LyricsDisplay;
