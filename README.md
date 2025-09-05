...not working and depreciated...

# Paper Plane Sim

Paper Plane Sim is a lightweight, browser-based paper airplane flight simulator. The single HTML file demonstrates a simple physics model, multiple environments, and unlockable plane designs rendered with a clean wireframe aesthetic.

## Prerequisites
- A modern desktop web browser (Chrome, Firefox, etc.)
- Optional: Python 3 or any static web server to serve the page locally

## Running
1. Clone this repository and navigate into it.
2. Start a local web server:
   ```bash
   python -m http.server 8000
   ```
3. Open [http://localhost:8000/paper-plane.html](http://localhost:8000/paper-plane.html) in your browser.

You can also simply open `paper-plane.html` directly in a browser, though some features may require a server for best results.

## Testing
Install dependencies and run the test suite with:

```bash
npm install
npm test
```

## Controls
- Keyboard: `W/S` pitch, `A/D` roll, `Q/E` yaw, `Space` throw, `P` pause.
- Gamepad: left stick for pitch/roll, right stick X for yaw, `A` throw, `Start` pause.

## Contributing
Contributions are welcome!
1. Fork the repository and create a feature branch.
2. Make your changes with clear commit messages.
3. Open a pull request describing your work and any testing performed.

Please keep contributions focused and ensure code remains self-contained. Feel free to open an issue to discuss ideas before implementation.
