import React, { useState, useRef, useEffect, useCallback } from "react";
import RecorderControls from "../components/RecorderControls";
import FilterSelector from "../components/FilterSelector";
import LyricsDisplay from "../components/LyricsDisplay";

/**
 * PUBLIC_INTERFACE
 * RecordingContainer: Karaoke playback with synchronized lyrics and user microphone recording.
 * Plays karaoke track, syncs lyrics, and records user voice (not backing track) with MediaRecorder.
 * 
 * Refactored to dynamically load lyrics and karaoke audio from static assets
 * - Accepts songId and title (from route params or props)
 * - Lyrics loaded from "/assets/lyrics_{songid}.json", falls back to demo if missing/invalid
 * - Karaoke audio from "/assets/karaoke_{songid}.mp3", falls back to demo if missing
 * - [Special-case]: For "Shape of You", uses Google Drive karaoke link as required.
 */
function RecordingContainer({ songId, title }) {
  // DEMO_FALLBACK
  const DEMO_LYRICS = [
    { time: 0, text: "Demo: Is this the real life?" },
    { time: 3, text: "Demo: Placeholder lyrics for unknown song" }
  ];

  const [lyrics, setLyrics] = useState([]);
  const [lyricsLoadStatus, setLyricsLoadStatus] = useState("idle"); // idle/loading/loaded/fallback

  // Audio
  const [audioUrl, setAudioUrl] = useState("");
  const [audioLoadStatus, setAudioLoadStatus] = useState("idle"); // idle/loading/loaded/fail

  // Returns karaoke audio src URL for a given song.
  // For "Shape of You", returns the external Google Drive direct link as required by business logic.
  const getAudioAssetUrl = (songId, title) => {
    if (
      (title && title.trim().toLowerCase() === "shape of you") ||
      (songId && songId === "7") // SongLibraryContainer mock data id for 'Shape of You'
    ) {
      // Provided Google Drive direct download link (special case)
      return "https://drive.google.com/uc?export=download&id=1k_cnpqL_wfSw-ZmAmNUtggirUcWDMj_M";
    }
    return songId ? `/assets/karaoke_${songId}.mp3` : "/assets/karaoke_demo.mp3";
  };
  // Helper: lyrics file path by songId (default demo)
  const getLyricsAssetUrl = (songId) =>
    songId ? `/assets/lyrics_${songId}.json` : "";

  // Effect: Load lyrics JSON from asset if possible, otherwise fallback
  useEffect(() => {
    let isSubscribed = true;
    setLyricsLoadStatus("loading");

    async function tryFetchLyrics() {
      if (!songId) {
        setLyrics(DEMO_LYRICS);
        setLyricsLoadStatus("fallback");
        return;
      }
      // Try fetch from assets: /assets/lyrics_{songid}.json in public directory
      try {
        const res = await fetch(getLyricsAssetUrl(songId));
        if (!res.ok) throw new Error("Lyrics JSON not found for id " + songId);
        const data = await res.json();
        // Validate format: expects [{time, text}]
        if (!Array.isArray(data) || !data.every(line => "time" in line && "text" in line)) {
          throw new Error("Lyrics data invalid for " + songId);
        }
        if (isSubscribed) {
          setLyrics(data);
          setLyricsLoadStatus("loaded");
        }
      } catch (e) {
        // Fallback to demo
        if (isSubscribed) {
          setLyrics(DEMO_LYRICS);
          setLyricsLoadStatus("fallback");
        }
      }
    }
    tryFetchLyrics();

    setAudioLoadStatus("loading");
    setAudioUrl(getAudioAssetUrl(songId, title));
    return () => {
      isSubscribed = false;
    };
  }, [songId, title]);

  // Karaoke duration
  const karaokeDuration = lyrics.length > 0 ? lyrics[lyrics.length - 1].time + 5 : 40;

  // Karaoke playback state
  const audioRef = useRef(null);
  const seekInputRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(karaokeDuration);

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

  // Karaoke audio events and syncing, update duration based on loaded song
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleLoaded = () => {
      setAudioDuration(audio.duration || karaokeDuration);
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
    // Fallback if the audio fails to load: show fail, fallback to demo on audio error
    const handleAudioFail = () => {
      setAudioLoadStatus("fail");
      setAudioUrl("/assets/karaoke_demo.mp3");
    };
    audio.addEventListener("error", handleAudioFail);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleAudioFail);
    };
    // eslint-disable-next-line
  }, [audioUrl]);

  // --- BEGIN SYNCHRONIZED, ERROR-HANDLED AUDIO LOGIC REFACTOR ---

  // Synchronized local state for safe playback control
  const [audioAction, setAudioAction] = useState(null); // 'play' | 'pause' | null

  // Flag to indicate if a play/pause promise is pending, preventing overlapping calls
  const [isAudioActionPending, setIsAudioActionPending] = useState(false);

  // Use ref for rapid update in async closures
  const isAudioActionPendingRef = useRef(false);
  useEffect(() => { isAudioActionPendingRef.current = isAudioActionPending; }, [isAudioActionPending]);

  // Play/Pause karaoke and optionally pause/resume the mic recording
  const handlePlayPause = useCallback(() => {
    // Prevent double-click causing race conditions
    if (isAudioActionPendingRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // Request a pause
      setAudioAction("pause");
      if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
      }
    } else {
      // Request a play, but don't redundantly call play if already playing
      setAudioAction("play");
      if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }
    }
  // eslint-disable-next-line
  }, [isPlaying, isRecording]);

  // Centralized effect for play/pause transitions to avoid race
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const suppressKnownPlayError = (err) =>
      err &&
      (err.name === "AbortError" ||
        (typeof err.message === "string" &&
          err.message.indexOf("The play() request was interrupted") !== -1) ||
        (typeof err.message === "string" &&
          err.message.includes("is already playing")));

    // Only trigger play/pause if action is requested and state sync matches
    // Use guarded logic to prevent overlapping actions
    if (audioAction === "pause" && !isAudioActionPendingRef.current) {
      if (!audio.paused) {
        setIsAudioActionPending(true);
        try {
          audio.pause();
          setIsPlaying(false);
        } catch (err) {
          // Unexpected error (rare for pause, just log)
          // eslint-disable-next-line no-console
          console.warn("Audio pause() failed:", err);
          setIsPlaying(false);
        }
        setIsAudioActionPending(false);
      } else {
        setIsPlaying(false);
      }
      setAudioAction(null);
    } else if (audioAction === "play" && !isAudioActionPendingRef.current) {
      if (audio.paused) {
        // play() should always use promise handling for error suppression
        setIsAudioActionPending(true);
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsAudioActionPending(false);
            })
            .catch((err) => {
              if (!suppressKnownPlayError(err)) {
                // eslint-disable-next-line no-console
                console.warn("Audio play() failed:", err);
              }
              setIsPlaying(false);
              setIsAudioActionPending(false);
            });
        } else {
          // Fallback: synchronous play (should be rare)
          try {
            audio.play();
            setIsPlaying(true);
          } catch (err) {
            if (!suppressKnownPlayError(err)) {
              // eslint-disable-next-line no-console
              console.warn("Audio play() failed (sync):", err);
            }
            setIsPlaying(false);
          }
          setIsAudioActionPending(false);
        }
      } else {
        setIsPlaying(true); // Already playing
        setIsAudioActionPending(false);
      }
      setAudioAction(null);
    }
    // Only respond to audioAction or isAudioActionPending changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioAction]);

  const handleRestart = useCallback(() => {
    if (isAudioActionPendingRef.current) return;
    const audio = audioRef.current;
    if (audio) {
      // Don't reset or set audio.currentTime unless not in transition
      // Only set currentTime and trigger play
      audio.currentTime = 0;
      setAudioAction("play");
      if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
        mediaRecorderRef.current.resume();
      }
    }
    // eslint-disable-next-line
  }, [isRecording]);

  const handleSeek = useCallback(
    (e) => {
      if (isAudioActionPendingRef.current) return;
      const audio = audioRef.current;
      const newTime = Number(e.target.value);
      if (audio) {
        audio.currentTime = newTime;
      }
      setAudioCurrentTime(newTime);
    },
    []
  );

  // --- END SYNCHRONIZED, ERROR-HANDLED AUDIO LOGIC REFACTOR ---

  // Reset on songId change
  useEffect(() => {
    setIsPlaying(false);
    setAudioCurrentTime(0);
    setRecBlob(null);
    setIsBlocked(false);
    setStatus("idle");
    setAudioAction(null); // Ensure race-safe state clear on song change
    setIsAudioActionPending(false);
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
        setAudioAction('play');
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
      setIsAudioActionPending(false);
    };
    // eslint-disable-next-line
  }, []);

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
          preload="auto"
          style={{ display: "none" }}
          aria-label="Karaoke audio track"
          onError={() => setAudioLoadStatus("fail")}
          onLoadedMetadata={() => setAudioLoadStatus("loaded")}
          // Defensive: ensure state sync, suppress double-calls
          onPlay={() => {
            setIsPlaying(true);
            setAudioAction(null);
            setIsAudioActionPending(false);
          }}
          onPause={() => {
            setIsPlaying(false);
            setAudioAction(null);
            setIsAudioActionPending(false);
          }}
        >
          <source src={audioUrl} type="audio/mp3" />
          {/* fallback is now handled by listening to .onError and setting audioUrl to demo if needed */}
          Sorry, your browser does not support the audio element. Please use a modern browser.
        </audio>
        <div style={{ fontWeight: 600, color: "#bfefff", fontSize: "1.13rem", marginBottom: 2, textAlign: "center" }}>
          Karaoke Track{" "}
          <span style={{ fontWeight: 400, fontSize: 14, color: "#53f1c9" }}>
            {audioLoadStatus === "fail"
              ? "Unavailable (Demo fallback playing)"
              : songId
                ? `Song #${songId}`
                : "Demo"}
          </span>
        </div>
        {audioLoadStatus === "fail" && (
          <div style={{ color: "#FFA500", textAlign: "center", fontSize: "1.01rem", margin: "6px 0" }}>
            Karaoke audio not found for this song.<br />Fallback to demo.
          </div>
        )}
        {/* Banner showing usage of Google Drive link for Shape of You */}
        {((title && title.trim().toLowerCase() === "shape of you") || (songId === "7")) && (
          <div style={{
            color: "#4A90E2",
            background: "#182B3F",
            padding: "8px 12px",
            borderRadius: 8,
            textAlign: "center",
            fontSize: "0.99rem",
            margin: "10px 0 2px 0"
          }}>
            Using external karaoke audio for 'Shape of You' via Google Drive link.
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
          <button
            className="btn"
            style={{ fontWeight: 600, minWidth: 72, background: isPlaying ? "#F53E12" : "var(--base-light)" }}
            onClick={handlePlayPause}
            disabled={isBlocked || isAudioActionPending}
          >
            {isPlaying ? (<><span style={{ fontSize: 18, marginRight: 7 }}>⏸</span> Pause</>)
              : (<><span style={{ fontSize: 18, marginRight: 7 }}>▶️</span> {audioCurrentTime > 0 && audioCurrentTime < audioDuration ? "Resume" : "Play"}</>)
            }
          </button>
          <button
            className="btn"
            style={{ background: "#F5A623", fontWeight: 600, minWidth: 72, color: "#1A1A1A" }}
            onClick={handleRestart}
            disabled={audioCurrentTime === 0 && !isPlaying || isAudioActionPending}
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
          onChange={isAudioActionPending ? undefined : handleSeek}
          step={0.1}
          style={{ width: "100%", marginTop: 9, accentColor: "var(--base-light, #00ffff)" }}
          aria-label="Karaoke seek"
          disabled={isAudioActionPending}
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
        <LyricsDisplay lyrics={lyrics} currentTime={audioCurrentTime} />
        {lyricsLoadStatus === "fallback" && (
          <div style={{ color: "#FFA500", textAlign: "center", fontSize: "0.98rem", marginTop: 6 }}>
            Lyrics not found for this song: showing demo lyrics.
          </div>
        )}
        {lyricsLoadStatus === "loaded" && songId && (
          <div style={{ color: "#69efad", fontSize: "0.92rem", marginTop: 6, textAlign: "center" }}>
            Loaded lyrics for song #{songId}
          </div>
        )}
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
