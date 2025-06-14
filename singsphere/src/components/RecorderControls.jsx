import React from "react";

// PUBLIC_INTERFACE
function RecorderControls({
  isRecording,
  onStart,
  onStop,
  duration,
  status,
  isBlocked,
}) {
  /**
   * Recorder controls: record/stop buttons, timer, and status.
   * Props:
   *   - isRecording: boolean (if currently recording)
   *   - onStart: function (start recording)
   *   - onStop: function (stop recording)
   *   - duration: number (seconds recorded)
   *   - status: 'idle' | 'recording' | 'blocked'
   *   - isBlocked: boolean (microphone blocked)
   */
  function formatTime(secs) {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${("0" + sec).slice(-2)}`;
  }

  let statusColor = "#bfefff";
  if (isRecording) statusColor = "#F53E12";
  else if (status === "blocked" || isBlocked) statusColor = "#FFA500";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 160,
      }}
    >
      {/* Status and Timer */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          aria-label={isRecording ? "Recording" : "Idle"}
          style={{
            width: 18,
            height: 18,
            borderRadius: 10,
            marginRight: 8,
            background: isRecording
              ? "#F53E12"
              : status === "blocked" || isBlocked
              ? "#FFA500"
              : "#bfefff",
            boxShadow:
              isRecording && duration % 2 === 0
                ? "0 0 8px 2px #F53E12"
                : undefined,
            border: "2px solid var(--border-color)",
            transition: "background 0.15s, box-shadow 0.2s",
          }}
        ></div>
        <span style={{ color: statusColor, fontWeight: 600, fontSize: 19 }}>
          {isBlocked ? "Mic Blocked" : isRecording ? "Recording..." : "Idle"}
        </span>
        <span
          style={{
            color: "#bfefff",
            fontSize: 17,
            minWidth: 60,
            marginLeft: 18,
            letterSpacing: 1.5,
          }}
          aria-label="Recording time"
        >
          {formatTime(duration)}
        </span>
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        {!isRecording && (
          <button
            className="btn btn-large"
            style={{
              background: isBlocked ? "#bbb" : "var(--base-light)",
              opacity: isBlocked ? 0.4 : 1,
            }}
            disabled={isBlocked}
            onClick={onStart}
            aria-label="Start recording"
          >
            <span style={{fontSize:18, marginRight:6}}>⏺</span> Record
          </button>
        )}
        {isRecording && (
          <button
            className="btn btn-large"
            style={{ background: "#F53E12" }}
            onClick={onStop}
            aria-label="Stop recording"
          >
            <span style={{fontSize:18, marginRight:6}}>⏹</span> Stop
          </button>
        )}
      </div>
    </div>
  );
}

export default RecorderControls;
