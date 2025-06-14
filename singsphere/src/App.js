import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import { useState, useEffect, useRef } from 'react';

import ReactModal from 'react-modal';

/**
 * PUBLIC_INTERFACE
 * Updates NavBar so that clicking the "Recordings" dropdown (or Record button if only one) loads the correct karaoke video based on the user's actual recordings.
 */
function NavBar() {
  const [recordings, setRecordings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);

  // Find most recent valid YouTube recording from localStorage (fallback)
  function getLatestRecording(allRecs) {
    if (!Array.isArray(allRecs)) return null;
    const sorted = [...allRecs].sort(
      (a, b) => new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0)
    );
    for (const r of sorted) {
      if (
        r.karaokeYoutubeUrl &&
        typeof r.karaokeYoutubeUrl === "string" &&
        r.karaokeYoutubeUrl.trim().startsWith("http")
      ) {
        return r;
      }
    }
    return null;
  }

  // On mount, load recordings from localStorage
  useEffect(() => {
    function loadRecordings() {
      try {
        const items = JSON.parse(localStorage.getItem('userRecordings') || '[]');
        setRecordings(Array.isArray(items) ? items : []);
        // If none is selected, pick latest
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
    if (recordings.length <= 1) return null;
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          type="button"
          className="btn"
          style={{ minWidth: 110 }}
          title="Open your past recordings"
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
          {recordings.map((rec, i) => (
            <button
              key={(rec.recordedAt || "") + (rec.songId ?? "") + "_" + i}
              className="btn"
              style={{
                display: "block",
                width: "100%",
                background: selectedRecording === rec ? "var(--base-light)" : "rgba(20,50,130,0.26)",
                color: selectedRecording === rec ? "#fff" : "#bfefff",
                textAlign: "left",
                fontWeight: selectedRecording === rec ? 700 : 500,
                fontSize: "1rem",
                border: "none",
                borderBottom: i !== recordings.length - 1 ? "1px solid #04ffff22" : "none",
                borderRadius: 0,
                padding: "13px 16px",
                cursor: "pointer"
              }}
              onClick={handleRecordingMenuSelect.bind(null, rec)}
              tabIndex={0}
            >
              <div>
                {typeof rec.title === "string" ? rec.title : "Untitled"}
                {rec.artist && typeof rec.artist === "string" ? (
                  <span style={{ fontWeight: 400, color: "#aaa", marginLeft: 7 }}>
                    by {rec.artist}
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: ".93em", color: "#53ffee" }}>
                Saved: {rec.recordedAt ? new Date(rec.recordedAt).toLocaleString() : ""}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Render modal recording details, or YouTube fallback UI
  function renderModalContent() {
    if (!selectedRecording || !extractYouTubeVideoId(selectedRecording.karaokeYoutubeUrl)) {
      // Only strings, JSX, and primitive types allowed. No object/array as root child; flatten logic.
      if (recordings.length === 0) {
        return (
          <div style={{ color: "var(--text-secondary)", fontSize: "1.12rem", textAlign: "center", margin: "18px 0" }}>
            No previous recording found.<br />
            <Link to="/record" className="btn btn-large" onClick={handleModalClose}>
              Start Recording
            </Link>
          </div>
        );
      } else {
        return (
          <div style={{ color: "var(--text-secondary)", fontSize: "1.12rem", textAlign: "center", margin: "18px 0" }}>
            Could not embed YouTube video for this recording.<br />
            {selectedRecording && selectedRecording.karaokeYoutubeUrl && !extractYouTubeVideoId(selectedRecording.karaokeYoutubeUrl) ? (
              <span style={{ color: "#FFA500" }}>Invalid YouTube URL.</span>
            ) : null}
          </div>
        );
      }
    }
    // Recording exists and has valid YT URL
    return (
      <>
        <div style={{ width: "100%", aspectRatio: "16/9", maxWidth: 480, margin: "0 auto 18px auto" }}>
          <iframe
            title="Your Karaoke Recording"
            width="100%"
            height="100%"
            style={{ width: "100%", height: "100%", border: 0, borderRadius: 9, background: "#000" }}
            src={`https://www.youtube.com/embed/${extractYouTubeVideoId(selectedRecording.karaokeYoutubeUrl)}?modestbranding=1&rel=0&controls=1&autoplay=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
        <div style={{ fontWeight: 600, color: "#bfefff", fontSize: "1.08rem", textAlign: "center" }}>
          {selectedRecording.title || "Untitled"}
          {selectedRecording.artist && (
            <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: 7 }}>
              by {selectedRecording.artist}
            </span>
          )}
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: ".96rem", textAlign: "center", margin: "6px 0" }}>
          Saved: {selectedRecording.recordedAt ? new Date(selectedRecording.recordedAt).toLocaleString() : ""}
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
              title: selectedRecording.title,
            }}
            onClick={handleModalClose}
          >
            Record Again
          </Link>
        </div>
      </>
    );
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
