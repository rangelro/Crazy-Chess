# Crazy Chess 3D Design

## Goal

Replace the interactive 2D board on the game route with a playable 3D board while preserving the existing server-authoritative multiplayer rules and WebSocket protocol.

## Architecture

`Game` remains responsible for session recovery, WebSocket requests, card selection, valid-move state, errors, and the HTML interface around the board. A new 3D board component receives only the rendered board state and interaction callbacks. It does not validate or mutate game rules locally.

The 3D scene uses Three.js through React Three Fiber. It has an orthographic isometric camera, fixed lighting, reusable procedural meshes for the board and pieces, and pointer interaction on board squares. It derives player orientation from `jogadorCor` so black sees the board rotated 180 degrees.

## UX

- Use a stylized premium tabletop: dark-green frame, warm wooden squares, brass accents, ivory white pieces, and graphite black pieces.
- Show selected squares and valid destinations with emissive 3D overlays.
- Animate changed piece positions and captured-piece disappearance after server state updates.
- Keep the card hand, revive modal, match information, and leave-room action as accessible HTML controls.
- If WebGL cannot start, show the existing fully playable 2D board and a brief compatibility message.

## Compatibility

- Do not change server data, SQLite persistence, or WebSocket actions.
- Keep the current piece data shape (`{ tipo, cor }`) and square shape (`{ linha, coluna }`).
- Use dependencies compatible with React 18 and the current Vite application.

## Acceptance Criteria

- A player can select a friendly piece and choose a permitted destination on the 3D board.
- White and black players see the board from their respective sides.
- Existing cards, revive flow, turn checks, reconnect flow, and multiplayer state updates remain functional.
- Board updates visibly animate normal moves and captures.
- The 2D board remains usable if 3D rendering is unavailable.
