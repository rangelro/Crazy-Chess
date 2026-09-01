# Crazy Chess 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a playable Three.js board for Crazy Chess without changing the game server or WebSocket contract.

**Architecture:** Keep `Game` as the state and network owner. Extract the existing grid as a fallback component, and render a separate React Three Fiber scene that maps the same board and interaction callbacks to 3D meshes.

**Tech Stack:** React 18, Vite, Three.js, @react-three/fiber, @react-three/drei, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-31-crazy-chess-3d-design.md`

## Global Constraints

- Preserve existing WebSocket messages and server-authoritative move validation.
- Use only procedural Three.js geometry; do not add downloaded 3D models.
- Keep a playable 2D fallback when WebGL fails.

---

### Task 1: Board-coordinate utilities and test harness

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/game3d/coordinates.js`
- Create: `frontend/src/game3d/coordinates.test.js`

**Interfaces:**
- Produces: `squareToPosition(linha, coluna): [number, number, number]`, `displaySquares(cor): { linha: number, coluna: number }[]`.

- [ ] Write tests for corner positions and black-player orientation.
- [ ] Run the tests and confirm they fail because the module does not exist.
- [ ] Add the smallest coordinate utility and Vitest script needed for the tests.
- [ ] Run the tests and confirm they pass.

### Task 2: 2D fallback and 3D scene

**Files:**
- Create: `frontend/src/components/ChessBoard2D.jsx`
- Create: `frontend/src/components/ChessBoard3D.jsx`
- Create: `frontend/src/components/ChessBoard3D.module.css`
- Modify: `frontend/src/pages/Game.jsx`
- Modify: `frontend/src/pages/Game.module.css`

**Interfaces:**
- Consumes: board state, player color, selected square, permitted moves, and `onSquareClick(linha, coluna)`.
- Produces: a responsive 3D board with `onError` fallback notification.

- [ ] Write a failing component test for an interactive rendered square and the fallback state.
- [ ] Implement board extraction and 3D scene with board squares, procedural pieces, highlights, camera, lights, and state-driven move/capture animation.
- [ ] Run focused tests and verify the fallback receives the same interactions.

### Task 3: Integration and verification

**Files:**
- Modify: `frontend/src/pages/Game.jsx`
- Modify: `frontend/src/pages/Game.module.css`

**Interfaces:**
- Consumes: existing `Game` socket and selection logic unchanged.
- Produces: the 3D board as the default game presentation.

- [ ] Build the frontend and fix all compilation failures.
- [ ] Test white and black orientation, allowed-destination click flow, selected-card flow, revive modal, and WebGL fallback.
- [ ] Run the complete frontend test suite and production build.
