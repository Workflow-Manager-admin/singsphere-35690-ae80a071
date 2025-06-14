import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

// Helper: render within Router (as App does)
function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

// Helper: set up userRecordings state before app render
function setLocalRecordings(val) {
  if (val === null) {
    window.localStorage.removeItem("userRecordings");
  } else {
    window.localStorage.setItem("userRecordings", JSON.stringify(val));
  }
}

// Helper: Flush any modals
function closeModalIfOpen() {
  const closeBtn = screen.queryByLabelText(/close/i);
  if (closeBtn) fireEvent.click(closeBtn);
}

describe("Recordings modal and dropdown rendering logic", () => {
  afterEach(() => {
    setLocalRecordings(null);
    closeModalIfOpen();
  });

  test("[No recordings] - UI shows helpful fallback action", () => {
    setLocalRecordings([]);
    renderApp();
    // Open the Record button modal
    fireEvent.click(screen.getByRole("button", { name: /record/i }));
    // Text for no previous recordings and action button
    expect(screen.getByText(/no previous recording/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start recording/i })).toBeInTheDocument();
  });

  test("[One recording] - Shows details for the recording and valid embed", () => {
    setLocalRecordings([
      {
        title: "Blinding Lights",
        artist: "The Weeknd",
        karaokeYoutubeUrl: "https://www.youtube.com/watch?v=GgcyCJEEpbg",
        recordedAt: "2024-01-02T13:22:00Z",
        songId: "1",
      },
    ]);
    renderApp();
    // Record button should be visible and have correct tooltip
    const recBtn = screen.getByRole("button", { name: /record/i });
    expect(recBtn).toBeInTheDocument();

    // Open modal
    fireEvent.click(recBtn);
    // Song/title and iframe
    expect(screen.getByText(/blinding lights/i)).toBeInTheDocument();
    expect(screen.getByText(/the weeknd/i)).toBeInTheDocument();

    // Karaoke iframe
    const iframe = screen.getByTitle(/karaoke|your karaoke recording/i);
    expect(iframe).toBeInTheDocument();

    // View on YouTube link
    expect(screen.getByRole("link", { name: /view on youtube/i })).toBeInTheDocument();
  });

  test("[Multiple recordings] - Dropdown appears, each item is valid and selectable", () => {
    setLocalRecordings([
      {
        title: "Blinding Lights",
        artist: "The Weeknd",
        karaokeYoutubeUrl: "https://www.youtube.com/watch?v=GgcyCJEEpbg",
        recordedAt: "2024-01-02T13:22:00Z",
        songId: "1",
      },
      {
        title: "Pirai Thedum Iravile",
        artist: "Saindhavi",
        karaokeYoutubeUrl: "https://www.youtube.com/watch?v=UAhhhRGfD5E",
        recordedAt: "2024-01-03T13:22:00Z",
        songId: "2",
      },
    ]);
    renderApp();
    // Dropdown button
    const dropdownBtn = screen.getByRole("button", { name: /recordings/i });
    expect(dropdownBtn).toBeInTheDocument();
    // Open dropdown - shows list of both recordings
    fireEvent.click(dropdownBtn);
    // Dropdown menu listing each title
    expect(screen.getByText(/blinding lights/i)).toBeInTheDocument();
    expect(screen.getByText(/pirai thedum iravile/i)).toBeInTheDocument();
    // Select second recording
    const piraiBtn = screen.getByRole("button", { name: /pirai thedum iravile/i });
    fireEvent.click(piraiBtn);
    // Modal updates with selection
    expect(screen.getByText(/pirai thedum iravile/i)).toBeInTheDocument();
    // Should show correct YouTube embed for second song
    expect(screen.getByRole("link", { name: /view on youtube/i }).href).toMatch(/UAhhhRGfD5E/);
  });

  test("[Malformed/missing YouTube link] - Shows friendly error fallback", () => {
    setLocalRecordings([
      {
        title: "Bad Song",
        artist: "Unknown",
        karaokeYoutubeUrl: "not a youtube link",
        recordedAt: "2024-01-04T14:10:00Z",
        songId: "99",
      },
      {
        title: "Empty Link",
        artist: "Nobody",
        karaokeYoutubeUrl: "",
        recordedAt: "2024-01-05T12:10:00Z",
        songId: "100",
      },
    ]);
    renderApp();
    // Open dropdown
    fireEvent.click(screen.getByRole("button", { name: /recordings/i }));
    // Bad Song selectable, should show the fallback UI after clicking
    fireEvent.click(screen.getByRole("button", { name: /bad song/i }));
    // Modal: Error/fallback for embed
    expect(screen.getByText(/could not embed youtube video/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid youtube url/i)).toBeInTheDocument();

    // Now select the second malformed (empty) link
    fireEvent.click(screen.getByRole("button", { name: /empty link/i }));
    expect(screen.getByText(/could not embed youtube video/i)).toBeInTheDocument();
  });

  test("[Robust fallback for null/malformed array entries] - Never renders raw objects/arrays as JSX", () => {
    setLocalRecordings([
      null,
      42,
      "stringy",
      { title: "Valid Song", artist: "Ok Guy", karaokeYoutubeUrl: "https://youtu.be/AKDP1cbICN8?si=oq6b-Po4-DgTIz-i", recordedAt: "2023-06-02T14:10:00Z", songId: "8" },
    ]);
    renderApp();
    // Open dropdown
    fireEvent.click(screen.getByRole("button", { name: /recordings/i }));

    // Should show explicit fallback for malformed (null/number/string) entries:
    expect(screen.getAllByText(/malformed recording entry/i).length).toBeGreaterThan(0);

    // Valid selectable is present
    fireEvent.click(screen.getByRole("button", { name: /valid song/i }));
    expect(screen.getByText(/valid song/i)).toBeInTheDocument();
    // Valid iframe
    expect(screen.getByTitle(/karaoke|your karaoke recording/i)).toBeInTheDocument();
  });

  test("[Comprehensive: All code paths return valid primitives or JSX]", () => {
    setLocalRecordings([{ foo: "bar" }]); // malformed data (no required fields)
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: /record/i }));
    // Modal fallback for missing data
    expect(screen.getByText(/error: recording data could not be loaded/i)).toBeInTheDocument();
  });
});
