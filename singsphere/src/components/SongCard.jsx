import React from "react";

import { useNavigate } from "react-router-dom";

// PUBLIC_INTERFACE
function SongCard({ song, onSelect, showRecordButton = true }) {
  /**
   * Card UI for displaying a single song with optional Record button.
   * @param {object} song - The song data: {id, title, artist, album, coverUrl?}.
   * @param {function} onSelect - Called when the card is clicked.
   * @param {boolean} showRecordButton - If true, shows the 'Record' button. Defaults true.
   */
  const navigate = useNavigate();

  function handleCardClick(e) {
    // Only card background clicks (not button) should trigger onSelect
    if (e.target.closest("button")) return;
    if (onSelect) onSelect(song);
    else alert("Song detail coming soon for: " + song.title);
  }

  function handleRecordClick(event) {
    event.stopPropagation();
    // Navigate to recording screen WITH song id as param and optionally title
    navigate(`/record/${song.id}`, { state: { songId: song.id, title: song.title } });
  }

  return (
    <div
      className="song-card"
      style={{
        background: "rgba(35, 35, 45, 0.92)",
        borderRadius: 10,
        padding: 16,
        minWidth: 180,
        minHeight: 180,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
        cursor: "pointer",
        transition: "background 0.17s",
        position: "relative"
      }}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
    >
      {/* Cover art placeholder */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 8,
          marginBottom: 16,
          background:
            song.coverUrl
              ? `url(${song.coverUrl}) center/cover`
              : "linear-gradient(135deg, var(--base-light), var(--base-dark))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          color: "#fff"
        }}
      >
        {!song.coverUrl && (song.title ? song.title.charAt(0) : "♪")}
      </div>
      <div style={{ fontWeight: 600, fontSize: "1.08rem", marginBottom: 6, textAlign: "center" }}>
        {song.title}
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.94rem", textAlign: "center" }}>
        {song.artist}
      </div>
      <div style={{ marginTop: 8, fontSize: "0.85rem", color: "#9ff", textAlign: "center" }}>
        {song.album}
      </div>
      {/* Record Button */}
      {showRecordButton && (
        <button
          className="btn btn-large"
          style={{
            marginTop: 12,
            width: "76%",
            alignSelf: "center",
            background: "linear-gradient(90deg, var(--base-light), #4A90E2)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "1.08rem",
            border: "none",
            borderRadius: 6,
            boxShadow: "0 1.5px 6px rgba(36,255,250,0.10)",
            cursor: "pointer"
          }}
          aria-label={`Record song ${song.title}`}
          onClick={handleRecordClick}
        >
          <span style={{ fontSize: 19, marginRight: 9 }}>⏺</span>
          Record
        </button>
      )}
    </div>
  );
}

export default SongCard;
