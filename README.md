# Sentinel Visualizer

Sentinel Visualizer is a real-time monitoring dashboard for the Sentinel Microkernel. It renders hardware telemetry, MRAM (Magnetoresistive RAM) state, and system boot logs in a single operator console, built with React and p5.js.

## Overview

The application is organized into three synchronized panels:

| Panel | Description |
|---|---|
| **Hardware Telemetry Canvas** | A live p5.js visualization of the microkernel's hardware state |
| **MRAM State Table** | A React-rendered table reflecting current MRAM contents, updated in real time from the canvas |
| **System Log Terminal** | A scrolling terminal displaying timestamped logs from power-on through the boot sequence |

State is shared between the p5.js canvas and the React UI via callback props (`addLog`, `syncMram`), keeping the log terminal and MRAM table in sync with events occurring in the visualization.

## Tech Stack

- **React 19** — application UI and state management
- **Vite** — build tooling and development server
- **p5.js** — canvas-based hardware visualization
- **ESLint** — code quality and linting

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Production Build

\`\`\`bash
npm run build
npm run preview
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

## Project Structure

\`\`\`
src/
├── App.jsx                   # Application entry point
└── components/
    ├── Dashboard.jsx         # Main layout and panel composition
    ├── HardwareCanvas.jsx    # p5.js hardware telemetry visualization
    ├── MramTable.jsx         # MRAM state table
    └── MatrixTerminal.jsx    # System log terminal
\`\`\`