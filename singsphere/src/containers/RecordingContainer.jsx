import React, { useState, useRef, useEffect } from "react";
import RecorderControls from "../components/RecorderControls";
import FilterSelector from "../components/FilterSelector";
import LyricsDisplay from "../components/LyricsDisplay";

/**
 * PUBLIC_INTERFACE
 * RecordingContainer: Karaoke via YouTube video with synchronized lyrics and user microphone recording.
 * Plays YouTube karaoke video, syncs lyrics (demo), and records user voice (mic via MediaRecorder).
 * 
 * - For "Shape of You", uses designated YouTube video: https://youtu.be/o71_MatpYV0?si=81WB6he6uruAe8us
 * - Video playback is triggered (with audio) when user clicks Record.
 * - Accepts youtubeUrl prop (has override), otherwise automatically injects video for Shape of You.
 * - Lyrics display is retained for demo purposes.
 */

// Utility: Extract YouTube Video ID (supports various link formats)
function extractYouTubeVideoId(url) {
  if (!url) return null;
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  for (let regex of regexes) {
    const match = url.match(regex);
    if (match && match[1]) return match[1];
  }
  return null;
}

function RecordingContainer({ songId, title, youtubeUrl }) {
  // Karaoke video mapping for specific songs (Shape of You)
  const SONG_KARAOKE_VIDEO_MAP = {
    // ID or title
    "7": "https://youtu.be/o71_MatpYV0?si=81WB6he6uruAe8us",
    "Shape of You": "https://youtu.be/o71_MatpYV0?si=81WB6he6uruAe8us",
  };

  // DEMO_FALLBACK
  const DEMO_LYRICS = [
    { time: 0, text: "Demo: Is this the real life?" },
    { time: 3, text: "Demo: Placeholder lyrics for unknown song" }
  ];

  // Find the intended karaoke YouTube link, with override for "Shape of You"
  let karaokeYoutubeUrl = youtubeUrl;
  if (!karaokeYoutubeUrl) {
    if (songId && SONG_KARAOKE_VIDEO_MAP[songId])
      karaokeYoutubeUrl = SONG_KARAOKE_VIDEO_MAP[songId];
    else if (title && SONG_KARAOKE_VIDEO_MAP[title])
      karaokeYoutubeUrl = SONG_KARAOKE_VIDEO_MAP[title];
    else
      karaokeYoutubeUrl = "https://www.youtube.com/watch?v=Zi_XLOBDo_Y";
  }

  // State for active karaoke YouTube URL (supports hot update)
  const [activeYoutubeUrl, setActiveYoutubeUrl] = useState(karaokeYoutubeUrl);
  useEffect(() => {
    let newUrl = youtubeUrl;
    if (!newUrl) {
      if (songId && SONG_KARAOKE_VIDEO_MAP[songId]) newUrl = SONG_KARAOKE_VIDEO_MAP[songId];
      else if (title && SONG_KARAOKE_VIDEO_MAP[title]) newUrl = SONG_KARAOKE_VIDEO_MAP[title];
      else newUrl = "https://www.youtube.com/watch?v=Zi_XLOBDo_Y";
    }
    setActiveYoutubeUrl(newUrl);
  }, [songId, title, youtubeUrl]);
  const youtubeVideoId = extractYouTubeVideoId(activeYoutubeUrl);

  // Lyrics state (demo-only)
  const [lyrics, setLyrics] = useState([]);
  const [lyricsLoadStatus, setLyricsLoadStatus] = useState("idle"); // idle/loading/loaded/fallback

  // Demo lyrics loader (in real app, would load lyrics for songId)
  useEffect(() => {
    setLyricsLoadStatus("loading");
    setTimeout(() => {
      setLyrics(DEMO_LYRICS);
      setLyricsLoadStatus("loaded");
    }, 500);
  }, [songId]);

  // --- YouTube playback timer for lyrics demo ---
  const karaokeDuration = lyrics.length > 0 ? lyrics[lyrics.length - 1].time + 5 : 40;
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(false);
  const ytTimeIntervalRef = useRef(null);
  useEffect(() => {
    if (isYoutubePlaying) {
      ytTimeIntervalRef.current = setInterval(() => {
        setAudioCurrentTime((t) => (t + 1 < karaokeDuration ? t + 1 : karaokeDuration));
      }, 1000);
    } else {
      clearInterval(ytTimeIntervalRef.current);
    }
    return () => clearInterval(ytTimeIntervalRef.current);
  }, [isYoutubePlaying, karaokeDuration]);
  // When new video/recording starts, reset lyric timer
  useEffect(() => {
    setAudioCurrentTime(0);
  }, [youtubeVideoId, isYoutubePlaying]);

  // --- YouTube Player control via IFrame API ---
  const youtubeIframeRef = useRef(null);
  function playYouTubeVideo() {
    const iframe = youtubeIframeRef.current;
    if (!iframe) return;
    // JS API: Play
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "*"
    );
    setIsYoutubePlaying(true);
  }
  function pauseYouTubeVideo() {
    const iframe = youtubeIframeRef.current;
    if (!iframe) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
      "*"
    );
    setIsYoutubePlaying(false);
  }

  // --- MediaRecorder/Mic recording state ---
  const [isRecording, setIsRecording] = useState(false);
  const [durationRec, setDurationRec] = useState(0);
  const [status, setStatus] = useState("idle");
  const [isBlocked, setIsBlocked] = useState(false);
  const [recBlob, setRecBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const micStreamRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recTimerRef = useRef();

  // Start mic recording and trigger YouTube video play
  async function startRecording() {
    setStatus("starting");
    setIsBlocked(false);
    setDurationRec(0);
    setRecBlob(null);

    try {
      // Request mic first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false } });
      micStreamRef.current = stream;
      const options = { mimeType: "audio/webm" };
      const mediaRecorder = new window.MediaRecorder(stream, options);
      recordChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

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

      // Auto-play the YouTube karaoke on user click (record)
      playYouTubeVideo();

      setIsRecording(true);
      setStatus("recording");
      setDurationRec(0);

      // Timer for UI
      recTimerRef.current = setInterval(() => {
        setDurationRec((d) => d + 1);
      }, 1000);

      mediaRecorder.start();
    } catch (err) {
      setIsBlocked(true);
      setIsRecording(false);
      setStatus("blocked");
      setDurationRec(0);
      pauseYouTubeVideo();
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      return;
    }
  }

  // Stop recording and also pause video
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
    pauseYouTubeVideo();
  }

  // Cleanup on unmount
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
  }, []);

  // Filters (demo, mock only)
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

  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 36, maxWidth: 570, margin: "0 auto" }}>
      <h2 className="title" style={{ marginTop: 0 }}>
        Record Your Singing
      </h2>
      <div className="description" style={{ marginBottom: 20, textAlign: "center", maxWidth: 500 }}>
        Karaoke now via YouTube!<br />
        <span style={{ color: "#89fff1" }}>
          {title ? `Now playing: ${title}` : "Paste or provide a YouTube karaoke link below."}
        </span>
      </div>

      {/* Karaoke video for Shape of You uses Youtube https://youtu.be/o71_MatpYV0?si=81WB6he6uruAe8us */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "0 auto 26px auto",
          background: "rgba(30,42,52,0.95)",
          borderRadius: 10,
          padding: 9,
          border: "1.5px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        {youtubeVideoId ? (
          <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", height: 0, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
            <iframe
              ref={youtubeIframeRef}
              title="Karaoke YouTube Video"
              width="100%"
              height="100%"
              style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                border: 0, borderRadius: 8, boxShadow: "0 1.5px 10px #000b"
              }}
              src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&modestbranding=1&rel=0&controls=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : (
          <div style={{ color: "#FFA500", fontSize: "1.08rem", padding: 14 }}>
            Invalid YouTube link.<br />Please check the URL.
          </div>
        )}
        <div style={{ fontWeight: 600, color: "#bfefff", fontSize: "1.09rem", textAlign: "center", marginBottom: 5 }}>
          {activeYoutubeUrl}
        </div>
        {/* Optional: input to enter/change YouTube link */}
        {/* <input
          type="text"
          style={{ width: "92%", margin: "0 0 8px 0", padding: 7, borderRadius: 6, border: "1px solid #409", color: "#0ad", background: "#fff2" }}
          value={activeYoutubeUrl}
          onChange={e => setActiveYoutubeUrl(e.target.value)}
          placeholder="Paste YouTube karaoke link"
        /> */}
        <div style={{ color: "#53f1c9", fontSize: "0.97rem", textAlign: "center" }}>
          The karaoke video will play when you click <b>Record</b>.
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
        Karaoke video and lyrics are for demo purposes.<br />
        Your voice will be recorded live via your browser mic.<br />
        <b>Tip</b>: Use earphones to prevent echo/feedback!
      </div>
    </div>
  );
}

export default RecordingContainer;
