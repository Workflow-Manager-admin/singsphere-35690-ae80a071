import React from "react";

// PUBLIC_INTERFACE
function SongCard({ song, onSelect }) {
  /**
   * Card UI for displaying a single song.
   * @param {object} song - The song data: {id, title, artist, album, coverUrl?}.
   * @param {function} onSelect - Called when the card is clicked (stub for navigation).
   */
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
        transition: "background 0.17s"
      }}
      onClick={() => {
        // Stub: replace with navigation to song detail/record
        if (onSelect) onSelect(song);
        else alert("Song detail coming soon for: " + song.title);
      }}
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
    </div>
  );
}

export default SongCard;
