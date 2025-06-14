import React, { useState, useRef, useEffect } from "react";
import RecorderControls from "../components/RecorderControls";
import FilterSelector from "../components/FilterSelector";
import LyricsDisplay from "../components/LyricsDisplay";

/**
 * PUBLIC_INTERFACE
 * RecordingContainer: Karaoke playback with synchronized lyrics and user microphone recording.
 * Plays karaoke track, syncs lyrics, and records user voice (not backing track) with MediaRecorder.
 */
function RecordingContainer({ songId, title }) {
  // Demo Karaoke audio and lyrics
  const MOCK_KARAOKE_AUDIO_URL = "https://cdn.pixabay.com/audio/2022/09/27/audio_124b4fa8b2.mp3";
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

  // Karaoke playback state
  const audioRef = useRef(null);
  const seekInputRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [durationRec, setDurationRec] = useState(0);
  const [status, setStatus] = useState("idle");
  const [isBlocked, setIsBlocked] = useState(false);
  const [recBlob, setRecBlob] = useState(null);

  // Controls for MediaRecorder/mic
  const mediaRecorderRef = useRef(null);
  const micStreamRef = useRef(null);
  const recordChunksRef = useRef([]);

  // Filters (mock only)
  const FILTERS = [
    { label: "Reverb", value: "reverb", icon: "🌊" },
    { label: "Auto-Tune", value: "autotune", icon: "🎶" },
    { label: "Robot", value: "robot", icon: "🤖" }
  ];
  const [selectedFilters, setSelectedFilters] = useState([]);
  function handleFiltersChange(newSelection) {
    setSelectedFilters(newSelection);
  }

  // Karaoke audio events and syncing
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
      // If recording, auto-stop recording too
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        stopRecording();
      }
    };
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
    // eslint-disable-next-line
  }, []);

  // Play/Pause karaoke and optionally pause/resume the mic recording
  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
      }
    } else {
      audio.play();
      setIsPlaying(true);
      if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }
    }
  }
  function handleRestart() {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play();
      setIsPlaying(true);
      if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
        mediaRecorderRef.current.resume();
      }
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

  // Reset on songId change
  useEffect(() => {
    setIsPlaying(false);
    setAudioCurrentTime(0);
    setRecBlob(null);
    setIsBlocked(false);
    setStatus("idle");
  }, [songId]);

  // Timer for voice recording duration UI
  const recTimerRef = useRef();

  // PUBLIC_INTERFACE: Start user voice recording along with karaoke playback
  async function startRecording() {
    setStatus("starting");
    setIsBlocked(false);
    setDurationRec(0);
    setRecBlob(null);

    try {
      // Request user mic (raw/no echo cancellation preferred)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false } });
      micStreamRef.current = stream;
      const options = { mimeType: "audio/webm" };
      const mediaRecorder = new window.MediaRecorder(stream, options);
      recordChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      // On data available (buffer mic chunks for final blob)
      mediaRecorder.ondataavailable = function (evt) {
        if (evt.data.size > 0) recordChunksRef.current.push(evt.data);
      };
      mediaRecorder.onstop = function () {
        const audioBlob = new Blob(recordChunksRef.current, { type: "audio/webm" });
        setRecBlob(audioBlob);
        // Release mic
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }
      };

      // Start karaoke playback if not already playing
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
      // UI states
      setIsRecording(true);
      setStatus("recording");
      setDurationRec(0);

      // Timer for UI
      recTimerRef.current = setInterval(() => {
        setDurationRec((d) => d + 1);
      }, 1000);

      // Actually begin mic record
      mediaRecorder.start();
    } catch (err) {
      setIsBlocked(true);
      setIsRecording(false);
      setStatus("blocked");
      setDurationRec(0);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      return;
    }
  }

  // PUBLIC_INTERFACE: Stop mic recording, save blob, release mic
  function stopRecording() {
    setIsRecording(false);
    setStatus("idle");
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    // (Optional: stop karaoke audio here)
  }

  // Cleanup on component unmount: release mic, clear timer
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
    // eslint-disable-next-line
  }, []);

  function formatTime(secs) {
    if (!secs && secs !== 0) return "--:--";
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${("0" + sec).slice(-2)}`;
  }

  // --- Render ---
  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 36, maxWidth: 570, margin: "0 auto" }}>
      <h2 className="title" style={{ marginTop: 0 }}>
        Record Your Singing
      </h2>
      <div className="description" style={{ marginBottom: 20, textAlign: "center", maxWidth: 500 }}>
        Listen to the karaoke track, sing as it plays, and record your voice!<br />
        <span style={{ color: "#89fff1" }}>{title ? `Now playing: ${title}` : ""}</span>
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
        <div style={{ fontWeight: 600, color: "#bfefff", fontSize: "1.13rem", marginBottom: 2, textAlign: "center" }}>
          Karaoke Track <span style={{ fontWeight: 400, fontSize: 14, color: "#53f1c9" }}>Demo</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
          <button
            className="btn"
            style={{ fontWeight: 600, minWidth: 72, background: isPlaying ? "#F53E12" : "var(--base-light)" }}
            onClick={handlePlayPause}
            disabled={isBlocked}
          >
            {isPlaying ? (
              <><span style={{ fontSize: 18, marginRight: 7 }}>⏸</span> Pause</>
            ) : (
              <><span style={{ fontSize: 18, marginRight: 7 }}>▶️</span> {audioCurrentTime > 0 && audioCurrentTime < audioDuration ? "Resume" : "Play"}</>
            )}
          </button>
          <button
            className="btn"
            style={{ background: "#F5A623", fontWeight: 600, minWidth: 72, color: "#1A1A1A" }}
            onClick={handleRestart}
            disabled={audioCurrentTime === 0 && !isPlaying}
          >
            <span style={{ fontSize: 17, marginRight: 7 }}>⏮</span>Restart
          </button>
          <span style={{ minWidth: 54, color: "#bfefff", fontWeight: 500, fontSize: 16 }}>
            {formatTime(audioCurrentTime)}/{formatTime(audioDuration)}
          </span>
        </div>
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
        <div style={{ fontSize: "0.96rem", color: "var(--text-secondary)", marginTop: 2, textAlign: "center" }}>
          Drag to skip to part of the song
        </div>
      </div>
      <FilterSelector
        filters={FILTERS}
        selectedFilters={selectedFilters}
        onChange={handleFiltersChange}
        selectionMode="multiple"
      />
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
      {/* Recorder Controls (with mic) */}
      <RecorderControls
        isRecording={isRecording}
        onStart={startRecording}
        onStop={stopRecording}
        duration={durationRec}
        status={status}
        isBlocked={isBlocked}
      />
      <div style={{ marginTop: 21, marginBottom: 5 }}>
        <LyricsDisplay lyrics={MOCK_LYRICS} currentTime={audioCurrentTime} />
      </div>
      {/* Feedback: show voice recording (not karaoke mix) if available */}
      {!isRecording && recBlob && !isBlocked && (
        <div style={{
            marginTop: 18,
            color: "#6fffad",
            fontSize: 17,
            textAlign: "center",
            fontWeight: 500,
          }} aria-live="polite">
          <div>
            Recording complete!
            <br />
            <audio controls src={URL.createObjectURL(recBlob)} style={{ marginTop: 9, maxWidth: 260 }} />
          </div>
          <br />
          {selectedFilters.length > 0 && (
            <span style={{ fontSize: "0.97rem", color: "#a5e2fa" }}>
              Filters chosen: {selectedFilters.map(
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
        Your voice will be recorded live via your browser mic.<br />
        <b>Tip</b>: Use earphones to prevent echo/feedback!
      </div>
    </div>
  );
}

export default RecordingContainer;
