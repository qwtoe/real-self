# Real Self — Mirror vs Reality

A privacy-first web application that helps you see the difference between your mirrored reflection and how others actually perceive you.

## Features

- **Side-by-Side Comparison** — View mirrored and unflipped video streams simultaneously
- **Slider Mode** — Drag to seamlessly compare both perspectives
- **Snapshot Capture** — Save both views for later reference
- **Privacy First** — All processing happens locally in your browser; no images are ever uploaded
- **PWA Support** — Install as a standalone app on mobile and desktop
- **Keyboard Shortcuts** — Quick controls without touching the mouse

## Usage

1. Open the application in a modern web browser
2. Click **Start Camera** and grant permission
3. Choose between **Side by Side** or **Slider** mode
4. Click **Take Snapshot** to capture both views

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `S` | Start camera |
| `1` | Switch to side-by-side mode |
| `2` | Switch to slider mode |
| `P` | Take snapshot |

## Tech Stack

- Pure HTML5, CSS3, and vanilla JavaScript
- MediaDevices API for camera access
- Canvas API for frame rendering
- Progressive Web App (PWA) capabilities

## Browser Support

- Chrome / Edge (recommended)
- Firefox
- Safari (iOS 11+)

Camera access requires a secure context (HTTPS or localhost).

## License

MIT License — see [LICENSE](LICENSE) for details.
