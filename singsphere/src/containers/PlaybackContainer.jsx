import React, { useState, useEffect, useRef } from "react";
import LyricsDisplay from "../components/LyricsDisplay";

// Mock lyrics: simple example
const MOCK_LYRICS = [
  { time: 0, text: "Is this the real life?" },
  { time: 3, text: "Is this just fantasy?" },
  { time: 7, text: "Caught in a landslide, no escape from reality" },
  { time: 13, text: "Open your eyes, look up to the skies and see" },
  { time: 20, text: "I'm just a poor boy, I need no sympathy" },
  { time: 27, text: "Because I'm easy come, easy go" },
  { time: 30, text: "Little high, little low" },
  { time: 33, text: "Any way the wind blows, doesn't really matter to me, to me" }
];

// PUBLIC_INTERFACE
function PlaybackContainer() {
  /**
   * Simulated playback container with synced lyrics display.
   * Shows playback controls stub, handles simulated playback timing,
   * and highlights current lyric line.
   */

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const INTERVAL_MS = 400;
  const duration = MOCK_LYRICS.length > 0 ? MOCK_LYRICS[MOCK_LYRICS.length - 1].time + 5 : 40;

  const intervalRef = useRef();

  // Simulated playback timer effect
  useEffect(() => {
    if (!isPlaying) return;

    intervalRef.current = setInterval(() => {
      setCurrentTime(prev =>
        prev + INTERVAL_MS / 1000 < duration ? prev + INTERVAL_MS / 1000 : duration
      );
    }, INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, duration]);

  // Stop when reached end
  useEffect(() => {
    if (currentTime >= duration && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentTime, duration, isPlaying]);

  // Play/Pause handlers
  function handlePlayPause() {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentTime >= duration) setCurrentTime(0);
      setIsPlaying(true);
    }
  }

  function handleRestart() {
    setCurrentTime(0);
    setIsPlaying(true);
  }

  return (
    <div className="container" style={{ paddingTop: 110, paddingBottom: 40, minHeight: 400 }}>
      <h2 className="title" style={{ marginTop: 0, marginBottom: 16 }}>Playback Performance</h2>
      <div className="description" style={{ marginBottom: 22 }}>
        Listen to your performance and watch synced lyrics!
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 30, marginBottom: 25, alignItems: "center" }}>
        <button
          className="btn"
          style={{ background: "#4A90E2", minWidth: 80 }}
          onClick={handlePlayPause}
        >
          {isPlaying ? "Pause" : currentTime > 0 && currentTime < duration ? "Resume" : "Play"}
        </button>
        <button
          className="btn"
          style={{ background: "#F5A623", minWidth: 80 }}
          onClick={handleRestart}
          disabled={currentTime === 0 && !isPlaying}
        >
          Restart
        </button>
        <span style={{ color: "#bfefff", fontWeight: 500 }}>
          {Math.floor(currentTime / 60)}:{("0" + Math.floor(currentTime % 60)).slice(-2)}
        </span>
      </div>
      <LyricsDisplay lyrics={MOCK_LYRICS} currentTime={currentTime} />
      <div style={{ color: "var(--text-secondary)", fontSize: "0.93rem", marginTop: 18, textAlign: "center" }}>
        Demo – Lyrics sync scrolls as playback progresses.<br />
        This is a mock; actual audio/recording API will be integrated soon.
      </div>
    </div>
  );
}

export default PlaybackContainer;
