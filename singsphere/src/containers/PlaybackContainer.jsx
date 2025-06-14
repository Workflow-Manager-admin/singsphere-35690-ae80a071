import React, { useState, useEffect, useRef } from "react";
import LyricsDisplay from "../components/LyricsDisplay";
import PlaybackControls from "../components/PlaybackControls";

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

// Demo filter options, reused from Recorder/FilterSelector
const FILTERS = [
  { label: "Reverb", value: "reverb", icon: "🌊" },
  { label: "Auto-Tune", value: "autotune", icon: "🎶" },
  { label: "Robot", value: "robot", icon: "🤖" }
];

// PUBLIC_INTERFACE
function PlaybackContainer() {
  /**
   * Simulated playback container with synced lyrics display and playback controls.
   * Integrates new PlaybackControls component.
   * Handles mock playback timing, filter state, and lyric sync.
   */

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const INTERVAL_MS = 400;
  const duration =
    MOCK_LYRICS.length > 0 ? MOCK_LYRICS[MOCK_LYRICS.length - 1].time + 5 : 40;
  const intervalRef = useRef();

  // Simulated playback timer effect
  useEffect(() => {
    if (!isPlaying) return;
    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) =>
        prev + INTERVAL_MS / 1000 < duration
          ? prev + INTERVAL_MS / 1000
          : duration
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

  // Play/Pause toggle
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

  function handleSeek(newTime) {
    setCurrentTime(Number(newTime));
    // Restart playback if seeking to start after finished
    if (!isPlaying && newTime < duration) setIsPlaying(false);
  }

  function handleToggleFilter(newSelection) {
    setSelectedFilters(newSelection);
    // In real app, triggers audio pipeline change
  }

  return (
    <div
      className="container"
      style={{
        paddingTop: 110,
        paddingBottom: 40,
        minHeight: 400,
        maxWidth: 540,
        margin: "0 auto",
      }}
    >
      <h2 className="title" style={{ marginTop: 0, marginBottom: 16 }}>
        Playback Performance
      </h2>
      <div className="description" style={{ marginBottom: 22 }}>
        Listen to your performance and watch synced lyrics!
      </div>
      <PlaybackControls
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onRestart={handleRestart}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        filters={FILTERS}
        selectedFilters={selectedFilters}
        onToggleFilter={handleToggleFilter}
      />
      {/* Show selected filters info */}
      <div style={{ textAlign: "center", marginBottom: 12, color: "#bfefff", fontWeight: 500 }}>
        {selectedFilters.length > 0
          ? (
            <>
              Filters applied:&nbsp;
              {selectedFilters
                .map(
                  (val) =>
                    (FILTERS.find((f) => f.value === val)?.icon || "") +
                    " " +
                    (FILTERS.find((f) => f.value === val)?.label || val)
                )
                .join(", ")}
              &nbsp;(mock)
            </>
          )
          : "No filters applied"}
      </div>
      <LyricsDisplay lyrics={MOCK_LYRICS} currentTime={currentTime} />
      <div
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.93rem",
          marginTop: 18,
          textAlign: "center",
        }}
      >
        Demo – Lyrics scroll as playback progresses.<br />
        This is a mock; actual audio/recording pipeline will be integrated soon.
      </div>
    </div>
  );
}

export default PlaybackContainer;
