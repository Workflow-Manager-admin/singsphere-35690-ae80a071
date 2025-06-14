import React from "react";

/**
 * PUBLIC_INTERFACE
 * PlaybackControls: UI for play/pause, seek, and filter toggling (mock controls).
 * Props:
 *  - isPlaying: boolean
 *  - onPlayPause: function
 *  - onRestart: function
 *  - currentTime: number (seconds)
 *  - duration: number (seconds)
 *  - onSeek: function(newTime: number)
 *  - filters: Array<{label, value, icon}>
 *  - selectedFilters: Array<string>
 *  - onToggleFilter: function(updatedFilters: Array)
 */
function PlaybackControls({
  isPlaying,
  onPlayPause,
  onRestart,
  currentTime,
  duration,
  onSeek,
  filters,
  selectedFilters,
  onToggleFilter,
}) {
  function formatTime(secs) {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${("0" + sec).slice(-2)}`;
  }

  function handleSeekChange(e) {
    onSeek(Number(e.target.value));
  }

  function handleFilterClick(filterVal) {
    let nextSelected;
    if (selectedFilters.includes(filterVal)) {
      nextSelected = selectedFilters.filter((v) => v !== filterVal);
    } else {
      nextSelected = [...selectedFilters, filterVal];
    }
    onToggleFilter(nextSelected);
  }

  return (
    <div
      style={{
        background: "rgba(30,42,62,0.88)",
        borderRadius: 14,
        padding: "20px 22px",
        margin: "0 auto 22px auto",
        maxWidth: 440,
        boxShadow: "0 2px 14px #0050ba14",
        border: "1.3px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      {/* Play/Pause, Restart Controls */}
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <button
          className="btn"
          style={{
            background: isPlaying ? "#F53E12" : "var(--base-light)",
            minWidth: 70,
            fontWeight: 600,
          }}
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <>
              <span style={{ fontSize: 19, marginRight: 7 }}>⏸</span> Pause
            </>
          ) : (
            <>
              <span style={{ fontSize: 19, marginRight: 7 }}>▶️</span> {currentTime > 0 && currentTime < duration ? "Resume" : "Play"}
            </>
          )}
        </button>
        <button
          className="btn"
          style={{
            background: "#F5A623",
            minWidth: 70,
            fontWeight: 600,
            color: "#1A1A1A",
          }}
          onClick={onRestart}
          disabled={currentTime === 0 && !isPlaying}
        >
          <span style={{ fontSize: 19, marginRight: 7 }}>⏮</span>Restart
        </button>
        <span style={{minWidth: 52, color: "#bfefff", fontWeight: 500, fontSize: 16}}>
          {formatTime(currentTime)}/{formatTime(duration)}
        </span>
      </div>
      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={duration}
        value={Math.min(currentTime, duration)}
        onChange={handleSeekChange}
        step={0.1}
        style={{
          width: "100%",
          marginTop: 13,
          accentColor: "var(--base-light, #00ffff)"
        }}
        aria-label="Seek"
      />
      {/* Filter toggles */}
      <div style={{ display: "flex", gap: 11, flexWrap: "wrap", marginTop: 7, justifyContent: "center" }}>
        {filters.map((filter) => {
          const selected = selectedFilters && selectedFilters.includes(filter.value);
          return (
            <button
              key={filter.value}
              className="btn"
              type="button"
              aria-pressed={selected}
              onClick={() => handleFilterClick(filter.value)}
              style={{
                background: selected
                  ? "linear-gradient(90deg, var(--base-light), #4A90E2)"
                  : "rgba(70,105,144,0.19)",
                color: selected ? "#fff" : "var(--text-color)",
                border: selected
                  ? "2px solid #4A90E2"
                  : "1.5px solid var(--border-color)",
                borderRadius: 8,
                padding: "7px 15px",
                fontWeight: selected ? 700 : 500,
                fontSize: "1rem",
                outline: selected ? "2px solid #5fdfff66" : undefined,
                transition: "all 0.13s",
                boxShadow: selected ? "0 0 12px #00fffc22" : undefined,
              }}
              tabIndex={0}
            >
              <span style={{ fontSize: "1.2em", marginRight: 9 }}>
                {filter.icon}
              </span>
              {filter.label}
            </button>
          );
        })}
      </div>
      {/* Filters Info */}
      <div
        style={{
          fontSize: "0.99rem",
          marginTop: 9,
          color: "var(--text-secondary)",
          textAlign: "center"
        }}
      >
        Toggle filters to (mock) modify playback voice. Demo only.
      </div>
    </div>
  );
}

export default PlaybackControls;
