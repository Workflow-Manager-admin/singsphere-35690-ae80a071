import React, { useState, useMemo } from "react";
import SongGrid from "../components/SongGrid";
import { useNavigate } from "react-router-dom";

// Mock song data
const MOCK_SONGS = [
  {
    id: "1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    coverUrl: ""
  },
  {
    id: "2",
    title: "Pirai Thedum Iravile",
    artist: "Saindhavi",
    album: "N/A",
    coverUrl: ""
  },
  {
    id: "3",
    title: "Oru Paadhi Kadhavu Neeyadi",
    artist: "G V Prakash Kumar",
    album: "N/A",
    coverUrl: ""
  },
  {
    id: "4",
    title: "Ennai Konjam Maatri",
    artist: "Harris Jayaraj",
    album: "Anniyan",
    coverUrl: ""
  },
  {
    id: "5",
    title: "Kaun Tujhe",
    artist: "Palak Muchhal",
    album: "M.S. Dhoni: The Untold Story",
    coverUrl: ""
  },
  {
    id: "6",
    title: "Billie Jean",
    artist: "Michael Jackson",
    album: "Thriller",
    coverUrl: ""
  },
  {
    id: "7",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "Divide",
    coverUrl: ""
  }
];

/**
 * PUBLIC_INTERFACE - SongLibraryContainer lists all songs with Record options.
 */
function SongLibraryContainer() {
  /**
   * Container for browsing/searching the song library.
   * Handles state for search input and passes filtered data to SongGrid.
   * Now includes navigation to Recording screen for the selected song via Record.
   */
  const [search, setSearch] = useState("");
  const [songs] = useState(MOCK_SONGS);

  // Filters songs based on title/artist/album
  const filteredSongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((song) => {
      return (
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        song.album.toLowerCase().includes(q)
      );
    });
  }, [search, songs]);

  const navigate = useNavigate();

  // Called when user clicks on a song card background
  function handleSongSelect(song) {
    // Optionally: could pop up details, but for now do nothing/silent
  }

  // PUBLIC_INTERFACE
  function handleSongRecord(song) {
    // Navigates to the recording screen for the selected song
    navigate(`/record/${song.id}`, { state: { songId: song.id, title: song.title } });
  }
  
  // SongGrid uses SongCard, so we can pass a render function for Record
  // But for simplicity and visibility, SongCard will handle 'Record' button as default
  
  return (
    <div className="container" style={{ paddingTop: 120, minHeight: "80vh" }}>
      <h2 className="title" style={{ marginTop: 0 }}>Song Library</h2>
      <div className="description" style={{ marginBottom: 16 }}>
        Browse and search for songs to sing!
      </div>
      <input
        type="text"
        placeholder="Search by title, artist, or album..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 6,
          outline: "none",
          border: "1.5px solid var(--border-color)",
          marginBottom: 32,
          fontSize: "1.04rem",
          background: "rgba(0,20,50,0.13)",
          color: "#fff"
        }}
        autoFocus
        aria-label="Search songs"
      />
      {/* Pass handleSongRecord for navigation to recording */}
      <SongGrid
        songs={filteredSongs}
        onSongSelect={handleSongRecord}
      />
    </div>
  );
}

export default SongLibraryContainer;
