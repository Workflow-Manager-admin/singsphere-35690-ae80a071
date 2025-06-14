import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import { useState, useEffect, useRef } from 'react';

import ReactModal from 'react-modal';

/**
 * PUBLIC_INTERFACE
 * The NavBar component handles persistent navigation, user recording history modal/dropdown,
 * and the karaoke embed logic. All .map and render conditionals are defensively written
 * to guarantee that **only valid JSX elements or renderable primitives** are ever rendered.
 *
 * Defensive type guards, explicit null/undefined handling, and try/catch-wrapped rendering ensure
 * that neither the modal/dropdown nor embed code ever produces arrays or bare objects as children for React.
 *
 * Fallback UI (user-friendly warnings/actions) is always rendered in empty/null/malformed states.
 * All non-trivial .map or embed logic has careful documentation. DO NOT relax these checks or return
 * plain objects/arrays in future code — such code will break React rendering and modal logic!
 */
function NavBar() {
  // State for user recordings, recording modal UI, and the currently selected recording
  const [recordings, setRecordings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);

  // PUBLIC_INTERFACE
  // Helper: Find the most recent valid YouTube recording from an array
  // Always returns either a valid recording object or null (never an array/object that is not a recording)
  function getLatestRecording(allRecs) {
    if (!Array.isArray(allRecs)) return null;
    // Defensive: filter to objects with valid karaokeYoutubeUrl
    const sorted = [...allRecs].sort(
      (a, b) => new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0)
    );
    for (const r of sorted) {
      if (
        r &&
        typeof r === "object" &&
        r.karaokeYoutubeUrl &&
        typeof r.karaokeYoutubeUrl === "string" &&
        r.karaokeYoutubeUrl.trim().startsWith("http")
      ) {
        return r;
      }
    }
    return null;
  }

  // On mount, load recordings from localStorage. Defensive for non-arrays and bad/malformed JSON.
  useEffect(() => {
    function loadRecordings() {
      try {
        const items = JSON.parse(localStorage.getItem('userRecordings') || '[]');
        setRecordings(Array.isArray(items) ? items : []);
        // Select the most recent or valid recording if none selected
        if (!selectedRecording) {
          setSelectedRecording(getLatestRecording(items));
        }
      } catch {
        setRecordings([]);
        setSelectedRecording(null);
      }
    }
    loadRecordings();
    function handleStorageEvent(e) {
      if (e.key === 'userRecordings') loadRecordings();
    }
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
    // eslint-disable-next-line
  }, []);

  // Utility to extract YouTube ID
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

  // Modal logic
  function handleRecordClick(e) {
    e.preventDefault();
    // If only one recording, select it, else show modal for most recent
    if (recordings.length === 1) setSelectedRecording(recordings[0]);
    else if (recordings.length > 0 && !selectedRecording) setSelectedRecording(getLatestRecording(recordings));
    setShowModal(true);
  }
  function handleModalClose() {
    setShowModal(false);
    // Optionally clear selection for next time
    // setSelectedRecording(null);
  }

  function handleRecordingMenuSelect(rec, e) {
    e.preventDefault();
    setSelectedRecording(rec);
    setShowModal(true);
  }

  // Render Recording button drop-down, if more than 1 recording
  function renderRecordingDropdown() {
    // Defensive guard for sanity: never render if not >1 valid recording
    if (!Array.isArray(recordings) || recordings.length <= 1) return null;

    // TRICKY: The callback to .map must always yield only valid JSX or string/primitive.
    // - We never return a plain object/array.
    // - If any row is malformed or an error occurs, renders a yellow warning <div>.
    // - This is CRITICAL: never push anything non-renderable!
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          type="button"
          className="btn"
          style={{ minWidth: 110 }}
          title="Open your past recordings"
          // Always open the modal
          onClick={(e) => setShowModal(true)}
          tabIndex={0}
        >
          Recordings <span style={{ fontSize: 17, marginLeft: 4 }}>▼</span>
        </button>
        <div
          style={{
            display: showModal ? "block" : "none",
            position: "absolute",
            top: "105%",
            right: 0,
            background: "#090d18",
            border: "2px solid var(--base-light)",
            borderRadius: 8,
            minWidth: 256,
            zIndex: 1040,
            boxShadow: "0 4px 20px #3bf3ee20"
          }}
        >
          {
            // Only map if valid array and not empty; fallback otherwise.
            Array.isArray(recordings) && recordings.length > 0
              ?
              recordings.map((rawRec, i) => {
                // Defensive: always return only JSX or string/primitive in this callback.
                // No arrays, no plain objects.
                try {
                  // Guard: Only process if rawRec is an object (non-null)
                  if (typeof rawRec !== "object" || rawRec === null) {
                    // Malformed: fallback warning, but always JSX element.
                    return (
                      <div
                        key={`malformed_${i}`}
                        style={{
                          padding: "13px 16px",
                          color: "#ffa500",
                          fontStyle: "italic",
                          borderBottom: i !== recordings.length - 1 ? "1px solid #04ffff22" : "none",
                        }}
                      >
                        Malformed recording entry
                      </div>
                    );
                  }
                  // Defensive: coerce .title and .artist for safe text display/render
                  let title = "Untitled";
                  if (typeof rawRec.title === "string") title = rawRec.title;
                  else if (rawRec.title !== undefined) title = String(rawRec.title);

                  let artist = null;
                  if (typeof rawRec.artist === "string") artist = rawRec.artist;
                  else if (rawRec.artist !== undefined) artist = String(rawRec.artist);

                  // Compute a unique key for React rendering (safe-to-string)
                  const keyParts = [
                    rawRec && rawRec.recordedAt ? String(rawRec.recordedAt) : "",
                    rawRec && rawRec.songId ? String(rawRec.songId) : "",
                    i,
                  ];
                  // Highlight if this is the currently selected recording
                  const isSelected =
                    selectedRecording && rawRec &&
                    selectedRecording.recordedAt === rawRec.recordedAt &&
                    selectedRecording.songId === rawRec.songId;

                  return (
                    <button
                      key={keyParts.join("_")}
                      className="btn"
                      style={{
                        display: "block",
                        width: "100%",
                        background:
                          isSelected ? "var(--base-light)" : "rgba(20,50,130,0.26)",
                        color: isSelected ? "#fff" : "#bfefff",
                        textAlign: "left",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: "1rem",
                        border: "none",
                        borderBottom:
                          i !== recordings.length - 1 ? "1px solid #04ffff22" : "none",
                        borderRadius: 0,
                        padding: "13px 16px",
                        cursor: "pointer"
                      }}
                      onClick={e => handleRecordingMenuSelect(rawRec, e)}
                      tabIndex={0}
                    >
                      <div>
                        {/* Only string or undefined appears as title */}
                        {typeof title === "string" ? title : "Untitled"}
                        {artist ? (
                          <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 7 }}>
                            by {artist}
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: ".93em", color: "#53ffee" }}>
                        Saved: {rawRec && rawRec.recordedAt
                          ? (() => {
                            const dateVal = new Date(rawRec.recordedAt);
                            return isNaN(dateVal.getTime()) ? "" : dateVal.toLocaleString();
                          })()
                          : ""}
                      </div>
                    </button>
                  );
                } catch (err) {
                  // Any catch: show error fallback (renderable, not object)
                  return (
                    <div
                      key={`errorrow_${i}`}
                      style={{
                        padding: "13px 16px",
                        color: "#ffa500",
                        fontStyle: "italic",
                        borderBottom: i !== recordings.length - 1 ? "1px solid #04ffff22" : "none",
                      }}
                    >
                      Error rendering recording info
                    </div>
                  );
                }
              })
              :
              // Fallback: No recordings available—always render a JSX div
              (
                <div style={{ padding: "15px 0", color: "#ffa500", textAlign: "center" }}>
                  No recordings found.
                </div>
              )
          }
        </div>
      </div>
    );
  }

  // Render modal content for a recording: always return JSX/primitives.
  // Includes robust fallback blocks for empty/malformed/null.
  function renderModalContent() {
    try {
      // Defensive: If selectedRecording is null/not object/empty, show relevant UI fallback.
      if (
        !selectedRecording ||
        typeof selectedRecording !== "object" ||
        (Array.isArray(selectedRecording) && selectedRecording.length === 0)
      ) {
        // No prior recording at all
        if (!Array.isArray(recordings) || recordings.length === 0) {
          // No recordings exist -- render a call-to-action block (JSX)
          return (
            <div style={{ color: "var(--text-secondary)", fontSize: "1.12rem", textAlign: "center", margin: "18px 0" }}>
              No previous recording found.<br />
              <Link to="/record" className="btn btn-large" onClick={handleModalClose}>
                Start Recording
              </Link>
            </div>
          );
        }
        // At least one recording exists but selection is corrupted/null
        return (
          <div style={{ color: "#ffa500", textAlign: "center", padding: 18 }}>
            Error: Recording data could not be loaded.<br />
            Please try another one.
          </div>
        );
      }

      // Defensive check for YouTube ID extraction on selectedRecording's karaokeYoutubeUrl (must be a string)
      const videoId =
        typeof selectedRecording.karaokeYoutubeUrl === "string"
          ? extractYouTubeVideoId(selectedRecording.karaokeYoutubeUrl)
          : null;

      // If not a valid video id, fallback to an error block (never render a raw object or array)
      if (!videoId) {
        // Always JSX fallback for invalid/malformed YouTube embedding
        return (
          <div style={{ color: "var(--text-secondary)", fontSize: "1.12rem", textAlign: "center", margin: "18px 0" }}>
            Could not embed YouTube video for this recording.<br />
            {selectedRecording &&
              selectedRecording.karaokeYoutubeUrl &&
              typeof selectedRecording.karaokeYoutubeUrl === "string" &&
              !extractYouTubeVideoId(selectedRecording.karaokeYoutubeUrl) ? (
                <span style={{ color: "#FFA500" }}>Invalid YouTube URL.</span>
              ) : null}
          </div>
        );
      }

      // Defensive: For all displays (title, artist), always coerce to string.
      const safeTitle =
        typeof selectedRecording.title === "string"
          ? selectedRecording.title
          : selectedRecording.title !== undefined
            ? String(selectedRecording.title)
            : "Untitled";
      const safeArtist =
        typeof selectedRecording.artist === "string"
          ? selectedRecording.artist
          : selectedRecording.artist !== undefined
            ? String(selectedRecording.artist)
            : null;
      const recordedAtDate =
        selectedRecording.recordedAt
          ? (() => {
              const dt = new Date(selectedRecording.recordedAt);
              return isNaN(dt.getTime()) ? "" : dt.toLocaleString();
            })()
          : "";

      // Karaoke video embed (iframe) and all children strictly return JSX and renderable primitives.
      // NOTE: NEVER returns a plain object or array, always fragments and elements.
      return (
        <>
          <div style={{ width: "100%", aspectRatio: "16/9", maxWidth: 480, margin: "0 auto 18px auto" }}>
            <iframe
              title="Your Karaoke Recording"
              width="100%"
              height="100%"
              style={{ width: "100%", height: "100%", border: 0, borderRadius: 9, background: "#000" }}
              src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
          <div style={{ fontWeight: 600, color: "#bfefff", fontSize: "1.08rem", textAlign: "center" }}>
            {safeTitle}
            {safeArtist && (
              <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: 7 }}>
                by {safeArtist}
              </span>
            )}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: ".96rem", textAlign: "center", margin: "6px 0" }}>
            Saved: {recordedAtDate}
          </div>
          <div style={{ color: "#53ffee", fontSize: "0.98rem", textAlign: "center" }}>
            <a
              href={selectedRecording.karaokeYoutubeUrl}
              style={{ textDecoration: "underline", color: "#53ffee" }}
              target="_blank" rel="noopener noreferrer"
            >View on YouTube</a>
          </div>
          <div style={{ marginTop: 13, textAlign: "center" }}>
            <Link
              className="btn btn-large"
              style={{ margin: "0 auto", background: "linear-gradient(90deg, var(--base-light), #4A90E2)" }}
              to={
                selectedRecording.songId
                  ? `/record/${selectedRecording.songId}`
                  : "/record"
              }
              state={{
                songId: selectedRecording.songId,
                title: safeTitle,
              }}
              onClick={handleModalClose}
            >
              Record Again
            </Link>
          </div>
        </>
      );
    } catch (ex) {
      // Robust fallback for any rendering bug or broken data: strictly render JSX primitive error UI.
      return (
        <div style={{ color: "#ffa500", textAlign: "center", fontSize: "1.07rem", padding: 16 }}>
          Error displaying recording details.<br />
          Please try again or reload the page.
        </div>
      );
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="container" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
          <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="logo-symbol">*</span> SingSphere
          </Link>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', position: "relative" }}>
            <Link to="/" className="btn" style={{ textDecoration: 'none' }}>Home</Link>
            <Link to="/library" className="btn" style={{ textDecoration: 'none' }}>Song Library</Link>
            {renderRecordingDropdown()}
            {/* If only one or zero recording, single Record button. */}
            {recordings.length <= 1 && (
              <button
                type="button"
                className="btn"
                style={{ minWidth: 92 }}
                onClick={handleRecordClick}
                title={recordings.length === 1
                  ? "See your recording"
                  : "No recording yet"}
              >
                Record
              </button>
            )}
          </div>
        </div>
      </nav>
      <ReactModal
        isOpen={showModal}
        onRequestClose={handleModalClose}
        style={{
          overlay: { background: "rgba(12,24,38,0.88)", zIndex: 2000 },
          content: {
            background: "#090d18",
            borderRadius: "13px",
            maxWidth: 512,
            margin: "72px auto",
            top: 72, left: 0, right: 0, bottom: "auto",
            border: "2px solid var(--base-light)",
            boxShadow: "0 4px 28px #0fa",
            padding: "24px 18px 18px"
          }
        }}
        ariaHideApp={false}
        contentLabel="Your Recording"
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn"
            style={{ padding: "4.5px 16px", minWidth: 0, fontSize: "1.1em", background: "#f53e1299", color: "#fff", marginBottom: 2 }}
            onClick={handleModalClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <h2 className="title" style={{ fontSize: "2.2rem", margin: "1px 0 9px 0", textAlign: "center" }}>
          {recordings.length > 1 ? "Your Recordings" : "Your Recording"}
        </h2>
        {renderModalContent()}
      </ReactModal>
    </>
  );
}

// PUBLIC_INTERFACE
function Homepage() {
  /** The homepage component for SingSphere. */
  return (
    <div className="container">
      <div className="hero">
        <div className="subtitle">Welcome to SingSphere</div>
        <h1 className="title">Karaoke. Redefined.</h1>
        <div className="description">
          Discover tracks, sing along, record your voice, and remix yourself with AI-powered filters. Your personalized karaoke experience starts here!
        </div>
        <Link to="/library" className="btn btn-large">Browse Songs</Link>
      </div>
    </div>
  );
}

import SongLibraryContainer from "./containers/SongLibraryContainer";

// PUBLIC_INTERFACE
function SongLibrary() {
  // Song library feature implementation.
  return <SongLibraryContainer />;
}

import RecordingContainer from "./containers/RecordingContainer";
import { useParams, useLocation } from "react-router-dom";

// PUBLIC_INTERFACE
function Recording() {
  /**
   * The recording interface rendering RecordingContainer.
   * Accepts /record/:songId as param, passes songId/title to RecordingContainer to load correct lyrics/audio.
   */
  const params = useParams();
  const location = useLocation();
  // songId may come from either URL param or navigation state
  const songId = params.songId || (location.state && location.state.songId);
  const title = (location.state && location.state.title) || "";

  return <RecordingContainer songId={songId} title={title} />;
}

import PlaybackContainer from "./containers/PlaybackContainer";

// PUBLIC_INTERFACE
function Playback() {
  /** The playback screen rendering lyrics sync and mock playback. */
  return <PlaybackContainer />;
}

// PUBLIC_INTERFACE
function NotFound() {
  /** Fallback page for unmatched routes. */
  return (
    <div className="container" style={{ paddingTop: 120 }}>
      <h2 className="title">404 - Not Found</h2>
      <div className="description">
        Oops! The page you requested does not exist.
      </div>
      <Link className="btn btn-large" to="/">Go Home</Link>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE - App root with routing and persistent navigation bar.
 * Adds dynamic /record/:songId support for song-specific recording.
 */
function App() {
  return (
    <Router>
      <div className="app">
        <NavBar />
        <main style={{ paddingTop: 80, flex: 1 }}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/library" element={<SongLibrary />} />
            {/* Dynamic route for song-specific recording */}
            <Route path="/record/:songId" element={<Recording />} />
            {/* Default (global/legacy) recording page */}
            <Route path="/record" element={<Recording />} />
            <Route path="/playback" element={<Playback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
