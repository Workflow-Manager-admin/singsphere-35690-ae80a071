import React, { useState, useRef, useEffect } from "react";
import RecorderControls from "../components/RecorderControls";
import FilterSelector from "../components/FilterSelector";
import LyricsDisplay from "../components/LyricsDisplay";

// PUBLIC_INTERFACE
/**
 * RecordingContainer enhancement:
 * Plays a karaoke audio track when the recording screen loads for the selected song
 * Synchronizes LyricsDisplay highlighting with the audio's playback position
 * Provides audio playback controls (play, pause, seek)
 * (Recording microphone pipeline - next step, not included here)
 */
function RecordingContainer({ songId, title }) {
  // --- Lyrics and Karaoke Track (mocked for demo) ---
  // In a real app, these would be fetched based on songId/title.
  const MOCK_KARAOKE_AUDIO_URL = "https://cdn.pixabay.com/audio/2022/09/27/audio_124b4fa8b2.mp3"; // Royalty free, replace for actual karaoke audio
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
  const duration = MOCK_LYRICS.length > 0 ? MOCK_LYRICS[MOCK_LYRICS.length - 1].time + 5 : 40;

  // --- Audio Playback State/Refs ---
  const audioRef = useRef(null);
  const seekInputRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);

  // --- Recording state (as-is for demo) ---
  const [isRecording, setIsRecording] = useState(false);
  const [durationRec, setDurationRec] = useState(0);
  const [status, setStatus] = useState("idle");
  const [isBlocked, setIsBlocked] = useState(false);

  // Filters state (mock logic)
  const FILTERS = [
    { label: "Reverb", value: "reverb", icon: "🌊" },
    { label: "Auto-Tune", value: "autotune", icon: "🎶" },
    { label: "Robot", value: "robot", icon: "🤖" }
  ];
  const [selectedFilters, setSelectedFilters] = useState([]);

  function handleFiltersChange(newSelection) {
    setSelectedFilters(newSelection);
    // Stub: in real version, might update audio pipeline here.
  }

  // --- Karaoke audio events ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleLoaded = () => {
      setAudioDuration(audio.duration);
      setAudioReady(true);
    };
    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
    };
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // --- Audio playback control handlers ---
  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Always play from where it left off.
      audio.play();
      setIsPlaying(true);
    }
  }
  function handleRestart() {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play();
      setIsPlaying(true);
    }
  }
  function handleSeek(e) {
    const audio = audioRef.current;
    const newTime = Number(e.target.value);
    if (audio) {
      audio.currentTime = newTime;
    }
    setAudioCurrentTime(newTime);
  }
  // Auto play on load for "karaoke" effect (optional - autoplay is often blocked by browser)
  useEffect(() => {
    setIsPlaying(false);
    setAudioCurrentTime(0);
    setTimeout(() => {
      // Try to auto play (browser may block if not user-initiated).
      // audioRef.current?.play();
    }, 200);
  }, [songId]);

  // Simulate recording states (for UI demo only)
  const intervalRef = useRef();
  const handleStart = () => {
    setStatus("recording");
    setIsBlocked(false);
    setIsRecording(true);
    setDurationRec(0);
  };
  const handleStop = () => {
    setIsRecording(false);
    setStatus("idle");
  };
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setDurationRec((d) => d + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);
  useEffect(() => {
    // Demo mock blocking (simulate 1/8 requests are blocked for demo)
    if (!isRecording && Math.random() < 0.12) {
      setIsBlocked(true);
      setStatus("blocked");
    } else if (!isRecording) {
      setIsBlocked(false);
      setStatus("idle");
    }
  }, [isRecording]);

  // --- Render ---
  function formatTime(secs) {
    if (!secs && secs !== 0) return "--:--";
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${("0" + sec).slice(-2)}`;
  }

  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 36, maxWidth: 570, margin: "0 auto" }}>
      <h2 className="title" style={{ marginTop: 0 }}>
        Record Your Singing
      </h2>
      <div className="description" style={{ marginBottom: 20, textAlign: "center", maxWidth: 500 }}>
        Listen to the karaoke track, sing as it plays, and record your voice!<br />
        <span style={{color: "#89fff1"}}>{title ? `Now playing: ${title}` : ""}</span>
      </div>
      {/* Karaoke Audio controls */}
      <div style={{
        background: "rgba(30,42,52,0.96)",
        borderRadius: 10,
        padding: "17px 18px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
        border: "1.2px solid var(--border-color)",
        margin: "0 auto 24px",
        width: "100%",
        maxWidth: 410,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 11
      }}>
        <audio
          ref={audioRef}
          src={MOCK_KARAOKE_AUDIO_URL}
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{ display: "none" }}
        />
        <div style={{fontWeight: 600, color: "#bfefff", fontSize: "1.13rem", marginBottom: 2, textAlign: "center"}}>
          Karaoke Track <span style={{fontWeight: 400, fontSize: 14, color: "#53f1c9"}}>Demo</span>
        </div>
        {/* Controls: play/pause, restart, timer/info */}
        <div style={{display: "flex", alignItems: "center", gap: 16, justifyContent: "center"}}>
          <button
            className="btn"
            style={{fontWeight: 600, minWidth: 72, background: isPlaying ? "#F53E12" : "var(--base-light)"}}
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <><span style={{ fontSize: 18, marginRight: 7 }}>⏸</span> Pause</>
            ) : (
              <><span style={{ fontSize: 18, marginRight: 7 }}>▶️</span> {audioCurrentTime > 0 && audioCurrentTime < audioDuration ? "Resume" : "Play"}</>
            )}
          </button>
          <button
            className="btn"
            style={{background: "#F5A623", fontWeight: 600, minWidth: 72, color: "#1A1A1A"}}
            onClick={handleRestart}
            disabled={audioCurrentTime === 0 && !isPlaying}
          >
            <span style={{ fontSize: 17, marginRight: 7 }}>⏮</span>Restart
          </button>
          <span style={{ minWidth: 54, color: "#bfefff", fontWeight: 500, fontSize: 16 }}>
            {formatTime(audioCurrentTime)}/{formatTime(audioDuration)}
          </span>
        </div>
        {/* Seekbar */}
        <input
          type="range"
          min={0}
          max={audioDuration}
          ref={seekInputRef}
          value={Math.min(audioCurrentTime, audioDuration)}
          onChange={handleSeek}
          step={0.1}
          style={{ width: "100%", marginTop: 9, accentColor: "var(--base-light, #00ffff)" }}
          aria-label="Karaoke seek"
        />
        <div style={{fontSize: "0.96rem", color: "var(--text-secondary)", marginTop: 2, textAlign: "center"}}>
          Drag to skip to part of the song
        </div>
      </div>
      {/* FilterSelector for voice filters */}
      <FilterSelector
        filters={FILTERS}
        selectedFilters={selectedFilters}
        onChange={handleFiltersChange}
        selectionMode="multiple"
      />
      {/* Show currently selected filters visually */}
      <div style={{ marginBottom: 18, textAlign: "center" }}>
        <span style={{ color: "#bfefff", fontWeight: 500, fontSize: "1.03rem" }}>
          {selectedFilters.length === 0
            ? "No filters selected."
            : (
              <>
                Filters applied:&nbsp;
                <span>
                  {selectedFilters
                    .map(
                      (val) =>
                        (FILTERS.find((f) => f.value === val)?.icon || "") +
                        " " +
                        (FILTERS.find((f) => f.value === val)?.label || val)
                    )
                    .join(", ")}
                </span>
              </>
            )}
        </span>
      </div>
      {/* Recorder controls (mocked) */}
      <RecorderControls
        isRecording={isRecording}
        onStart={handleStart}
        onStop={handleStop}
        duration={durationRec}
        status={status}
        isBlocked={isBlocked}
      />
      {/* Lyrics, synced to audio playback */}
      <div style={{ marginTop: 21, marginBottom: 5 }}>
        <LyricsDisplay lyrics={MOCK_LYRICS} currentTime={audioCurrentTime} />
      </div>
      {/* Optionally, visual/audio feedback for saved file (mocked) */}
      {!isRecording && durationRec > 0 && !isBlocked && (
        <div
          style={{
            marginTop: 16,
            color: "#6fffad",
            fontSize: 17,
            textAlign: "center",
            fontWeight: 500,
          }}
          aria-live="polite"
        >
          Recording complete! (Simulated audio file saved)
          <br />
          {/* Stub: Filters would be applied in actual post-process */}
          {selectedFilters.length > 0 && (
            <span style={{ fontSize: "0.97rem", color: "#a5e2fa" }}>
              <br />Filters chosen: {selectedFilters.map(
                (val) => FILTERS.find((f) => f.value === val)?.label || val
              ).join(", ")} (mock, not applied to audio)
            </span>
          )}
        </div>
      )}
      {isBlocked && (
        <div
          style={{
            marginTop: 14,
            color: "#FFA500",
            fontWeight: 600,
            fontSize: 17,
            textAlign: "center",
          }}
          aria-live="assertive"
        >
          Microphone access blocked.<br />
          Please allow mic permission in your browser settings.
        </div>
      )}
      <div
        style={{
          marginTop: 10,
          color: "var(--text-secondary)",
          fontSize: "0.98rem",
          textAlign: "center",
        }}
      >
        Karaoke audio and lyrics are demo content.<br />
        Next: layering live mic (recording) in real time with playback!
      </div>
    </div>
  );
}

export default RecordingContainer;
