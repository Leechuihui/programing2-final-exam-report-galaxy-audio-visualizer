# Keyboard Shortcuts Guide

## 🎵 Audio Player Shortcuts

### Playback Controls
- **Spacebar**: Play/Pause toggle
- **← (Left Arrow)**: Previous song
- **→ (Right Arrow)**: Next song
- **M**: Mute/Unmute toggle

### Playback Modes
- **L**: Cycle through playback modes
  - Loop List (default)
  - Loop Single
  - Shuffle

### File Management
- **R**: Reload audio files from configuration

### Visualization
- **Spacebar** (when menu is open): Toggle visualization mode menu
- **↑↓ (Up/Down Arrows)** (in menu): Navigate visualization modes
- **Enter** (in menu): Confirm mode selection

## 🎮 General Controls

### Menu Navigation
- **Spacebar**: Open/Close mode selection menu
- **↑↓ Arrows**: Navigate menu options
- **Enter**: Select current option

### Window Management
- **F11**: Toggle fullscreen mode

## 📋 Playback Modes Explained

### 🔁 Loop List
- Plays all songs in order
- Automatically advances to next song when current ends
- Loops back to first song after last

### 🔂 Loop Single
- Repeats current song indefinitely
- Does not advance to next song automatically
- Perfect for focused listening

### 🔀 Shuffle
- Plays songs in random order
- Each song plays only once until all are played
- Maintains history to avoid immediate repeats

## 🎯 Tips for Best Experience

### Audio Control
- Use **M** for quick mute during phone calls or interruptions
- **Spacebar** is the fastest way to pause/resume
- Arrow keys provide tactile feedback for navigation

### Mode Switching
- Press **L** to cycle through playback modes quickly
- Each mode has different colored indicators:
  - 🔁 Gray (default)
  - 🔂 Blue (single track focus)
  - 🔀 Green (random discovery)

### File Management
- **R** reloads the playlist from `audio-files.json`
- Useful when you've added new songs to the `assets/` folder
- Run `node scan-audio-files.js` first to update the configuration

## 🔧 Advanced Usage

### Custom Shortcuts
You can modify shortcuts in `sketch.js` in the `keyPressed()` function:
```javascript
function keyPressed() {
    // Add your custom shortcuts here
    if (key === 'your_key') {
        // Your custom action
    }
}
```

### Playback Mode API
Access playback modes programmatically:
```javascript
// Check current mode
console.log(currentPlaybackMode);

// Change mode directly
currentPlaybackMode = PLAYBACK_MODES.SHUFFLE;
updatePlaybackModeUI();
```

---

## 📱 Mobile/Touch Controls

While keyboard shortcuts are optimized for desktop, all functionality is available through touch controls:

- **Tap play button**: Play/Pause
- **Tap previous/next**: Change tracks
- **Tap mode button**: Cycle playback modes
- **Tap mute button**: Toggle sound
- **Tap reload button**: Refresh playlist

---

*Last updated: 2025-08-30*</content>
</xai:function_call">Wrote contents to /Users/lizhuhui123/Downloads/final_project/KEYBOARD_SHORTCUTS.md
