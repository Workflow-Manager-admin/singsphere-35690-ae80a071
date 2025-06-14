import React, { useState, useRef, useEffect } from "react";
import RecorderControls from "../components/RecorderControls";

// PUBLIC_INTERFACE
function RecordingContainer() {
  /**
   * Container for recording user singing (mock logic).
   * Shows recording controls, status, and timer.
   * Handles state for (mocked) audio recording.
   */

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState("idle"); // 'idle' | 'recording' | 'blocked'
  const [isBlocked, setIsBlocked] = useState(false);

  const intervalRef = useRef();

  // Start recording mock (simulates audio rec start)
  // PUBLIC_INTERFACE
  const handleStart = () => {
    // In real logic: check microphone permission here, show blocked if denied
    setStatus("recording");
    setIsBlocked(false);
    setIsRecording(true);
    setDuration(0);
  };

  // Stop recording mock (simulates audio rec stop)
  // PUBLIC_INTERFACE
  const handleStop = () => {
    setIsRecording(false);
    setStatus("idle");
  };

  // Simulate timer while recording
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  // Simulate 'audio blocked' scenario randomly for UI demo (mock only)
  useEffect(() => {
    // Demo mock blocking (simulate 1/8 requests are blocked for demo)
    if (!isRecording && Math.random() < 0.12) {
      setIsBlocked(true);
      setStatus("blocked");
    } else if (!isRecording) {
      setIsBlocked(false);
      setStatus("idle");
    }
  }, [isRecording]);

  return (
    <div className="container" style={{ paddingTop: 120, paddingBottom: 36 }}>
      <h2 className="title" style={{ marginTop: 0 }}>
        Record Your Singing
      </h2>
      <div className="description" style={{ marginBottom: 20, textAlign: "center", maxWidth: 500 }}>
        Press Record to start singing. Your voice will be saved (demo: recording is mocked).
      </div>
      <RecorderControls
        isRecording={isRecording}
        onStart={handleStart}
        onStop={handleStop}
        duration={duration}
        status={status}
        isBlocked={isBlocked}
      />
      {/* Optionally, visual/audio feedback for saved file (mocked) */}
      {!isRecording && duration > 0 && !isBlocked && (
        <div
          style={{
            marginTop: 26,
            color: "#6fffad",
            fontSize: 17,
            textAlign: "center",
            fontWeight: 500,
          }}
          aria-live="polite"
        >
          Recording complete! (Simulated audio file saved)
        </div>
      )}
      {isBlocked && (
        <div
          style={{
            marginTop: 24,
            color: "#FFA500",
            fontWeight: 600,
            fontSize: 17,
            textAlign: "center",
          }}
          aria-live="assertive"
        >
          Microphone access blocked.<br />
          Please allow mic permission in your browser settings.
        </div>
      )}
      <div
        style={{
          marginTop: 18,
          color: "var(--text-secondary)",
          fontSize: "0.98rem",
          textAlign: "center",
        }}
      >
        This is a mock demo &ndash; actual audio will be recorded in full version.
      </div>
    </div>
  );
}

export default RecordingContainer;
