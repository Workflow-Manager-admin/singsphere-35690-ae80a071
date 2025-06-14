import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import { useState, useEffect, useRef } from 'react';

// PUBLIC_INTERFACE
function NavBar() {
  /**
   * Persistent navigation bar for SingSphere.
   * - Displays Home and Song Library links.
   * - 'Record' becomes a dropdown if there are any songs in storage.
   * Reads user recordings from localStorage dynamically.
   */
  const [recordings, setRecordings] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownTimeout = useRef();

  // On mount, load recordings from localStorage
  useEffect(() => {
    function loadRecordings() {
      try {
        const items = JSON.parse(localStorage.getItem('userRecordings') || '[]');
        if (Array.isArray(items)) setRecordings(items);
        else setRecordings([]);
      } catch {
        setRecordings([]);
      }
    }
    loadRecordings();

    // Listen for changes made in other tabs/windows (storage event)
    function handleStorageEvent(e) {
      if (e.key === 'userRecordings') loadRecordings();
    }
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // Dropdown open/close handlers
  function openDropdown() {
    clearTimeout(dropdownTimeout.current);
    setShowDropdown(true);
  }
  function closeDropdown() {
    dropdownTimeout.current = setTimeout(() => setShowDropdown(false), 180);
  }

  // Render
  return (
    <nav className="navbar">
      <div className="container" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
        <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="logo-symbol">*</span> SingSphere
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', position: "relative" }}>
          <Link to="/" className="btn" style={{ textDecoration: 'none' }}>Home</Link>
          <Link to="/library" className="btn" style={{ textDecoration: 'none' }}>Song Library</Link>
          {/* Recordings dropdown if there are any recorded songs */}
          {(recordings && recordings.length > 0) ? (
            <div
              style={{ position: "relative", minWidth: 0 }}
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
              tabIndex={0}
              onFocus={openDropdown}
              onBlur={closeDropdown}
            >
              <button
                className="btn"
                style={{ minWidth: 92, position: "relative", zIndex: 2 }}
                aria-haspopup="listbox"
                aria-expanded={showDropdown}
                type="button"
                onClick={() => setShowDropdown((v) => !v)}
              >
                Recordings <span style={{marginLeft: 5, fontSize: 12, verticalAlign: 'middle'}}>▼</span>
              </button>
              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "110%",
                    right: 0,
                    background: "rgba(12,24,38,0.97)",
                    border: "1.5px solid var(--border-color)",
                    minWidth: 260,
                    boxShadow: "0 2px 14px #003fba1a",
                    borderRadius: 9,
                    padding: "7px 0",
                    zIndex: 1000,
                  }}
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                  role="listbox"
                  aria-label="Recorded songs"
                >
                  {recordings
                    .filter(rec => rec && (rec.title || rec.songId))
                    .sort((a, b) => new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0))
                    .map((rec, idx) => (
                    <Link
                      key={rec.songId || rec.title || idx}
                      to={
                        rec.songId
                          ? `/record/${rec.songId}`
                          : "/record"
                      }
                      state={{
                        songId: rec.songId,
                        title: rec.title
                      }}
                      className="btn"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        width: "100%",
                        borderRadius: 0,
                        borderBottom: "1px solid var(--border-color)",
                        background: "none",
                        color: "#fff",
                        textAlign: "left",
                        boxShadow: "none",
                        margin: 0,
                        padding: "11.5px 18px",
                        fontSize: "1.00rem",
                        whiteSpace: "normal",
                        textDecoration: "none",
                        gap: 0
                      }}
                      onClick={() => setShowDropdown(false)}
                    >
                      <span>
                        <b>{rec.title || "Untitled"}</b>
                        {!!rec.artist && <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: ".96em", marginLeft: 5 }}>by {rec.artist}</span>}
                      </span>
                      {!!rec.karaokeYoutubeUrl && (
                        <span style={{ fontSize: ".93em", color: "#6ceeff" }}>
                          YouTube: <a href={rec.karaokeYoutubeUrl} style={{ color: "#53ffee", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Preview</a>
                        </span>
                      )}
                      {!!rec.recordedAt && <span style={{ color: "var(--text-secondary)", fontSize: ".87em" }}>{new Date(rec.recordedAt).toLocaleString()}</span>}
                    </Link>
                  ))}
                  {recordings.length === 0 && (
                    <span style={{ padding: "10px 18px", color: "var(--text-secondary)" }}>
                      No recordings found.
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            // No recordings: simple Record button
            <Link to="/record" className="btn" style={{ textDecoration: 'none' }}>Record</Link>
          )}
        </div>
      </div>
    </nav>
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
