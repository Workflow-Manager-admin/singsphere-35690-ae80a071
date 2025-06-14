import React from "react";
import SongCard from "./SongCard";

// PUBLIC_INTERFACE
function SongGrid({ songs, onSongSelect }) {
  /**
   * Displays a grid of SongCards.
   * @param {Array} songs - List of song objects.
   * @param {function} onSongSelect - Handler for selecting a song.
   */
  if (!songs || songs.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
        No songs found.
      </div>
    );
  }

  return (
    <div
      className="song-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "24px",
        margin: "32px 0"
      }}
    >
      {songs.map((song) => (
        <SongCard key={song.id} song={song} onSelect={onSongSelect} />
      ))}
    </div>
  );
}

export default SongGrid;
