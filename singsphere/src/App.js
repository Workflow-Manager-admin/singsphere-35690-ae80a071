import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// PUBLIC_INTERFACE
function NavBar() {
  /** Persistent navigation bar for SingSphere. */
  return (
    <nav className="navbar">
      <div className="container" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
        <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="logo-symbol">*</span> SingSphere
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn" style={{ textDecoration: 'none' }}>Home</Link>
          <Link to="/library" className="btn" style={{ textDecoration: 'none' }}>Song Library</Link>
          <Link to="/record" className="btn" style={{ textDecoration: 'none' }}>Record</Link>
          <Link to="/playback" className="btn" style={{ textDecoration: 'none' }}>Playback</Link>
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
