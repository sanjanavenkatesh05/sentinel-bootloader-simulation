# Sentinel Visualizer

A browser-based hardware fault-injection simulator for the **Sentinel Bootloader** — a fault-tolerant bare-metal bootloader targeting the STM32F405 (ARM Cortex-M4). The visualizer models the full bootloader state machine, MRAM-backed fault triage algorithm, IWDG watchdog behavior, and PMIC power-gating logic in an interactive operator console.

> **Note:** This is the simulation and visualization repository only. The actual C firmware, flashable `.bin`, linker script, and `arm-none-eabi-gcc` toolchain live in the companion firmware repository (see [Related Repositories](#related-repositories)).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Simulated Hardware](#simulated-hardware)
- [Simulation Architecture](#simulation-architecture)
- [Requirements & Dependencies](#requirements--dependencies)
- [Getting Started](#getting-started)
  - [Clone](#clone)
  - [Install](#install)
  - [Run (Development)](#run-development)
  - [Build (Production)](#build-production)
  - [Deploy (Vercel)](#deploy-vercel)
- [Using the Simulator](#using-the-simulator)
  - [Boot Sequence](#boot-sequence)
  - [Fault Injection](#fault-injection)
  - [Reading the Panels](#reading-the-panels)
- [Configuration](#configuration)
- [Code Quality](#code-quality)
- [Project Structure](#project-structure)
- [Related Repositories](#related-repositories)

---

## Project Overview

The Sentinel Bootloader implements a **3-strike, MRAM-persistent fault triage algorithm** that survives single-event upsets (SEU) and single-event latch-ups (SEL) across hard power cycles. On every boot, it reads the previous peripheral health state from MRAM, bypasses power-gated hardware domains, initializes surviving peripherals under IWDG supervision, and hands off execution to the flight OS at `0x08008000`.

This visualizer lets you:
- Step through the full 4-state boot sequence in real time
- Inject SEU (transient) and SEL (permanent latch-up) faults into any peripheral at any point
- Watch the MRAM register table and strike counters update live as the algorithm responds
- Observe the IWDG watchdog drain and trigger a hardware reset
- See PMIC power-gate lines cut after a peripheral hits 3 strikes

---

## Simulated Hardware

| Component | Part / Spec | Notes |
|---|---|---|
| **MCU** | STM32F405RGT6 — ARM Cortex-M4 @ 168 MHz | PLL configured via `rcc_hse_8mhz_3v3[RCC_CLOCK_3V3_168MHZ]` |
| **IWDG** | Independent Watchdog Timer | 1,000 ms timeout; reset detected via `RCC_CSR_IWDGRSTF` |
| **MRAM** | Magnetoresistive RAM at `0x08040000` | Connected over I²C1 (PB6/PB7, GPIO_AF4, 42 MHz) |
| **PMIC** | Power Management IC | Issues power-gate commands to peripheral voltage domains |
| **Flash** | 32 KB bootloader partition at `0x08000000` | OS entry at `0x08008000` |
| **SRAM** | 128 KB at `0x20000000` | |

### Simulated Peripherals

| ID | Name | Bus | MRAM Address |
|---|---|---|---|
| 0 | I²C Sensors | I²C | `0x00A` |
| 1 | SPI Comm | SPI | `0x01A` |
| 2 | UART Log | UART | `0x02A` |

---

## Simulation Architecture

The simulator has three synchronized panels driven by a single state machine in `src/simulation/hardwareSketch.js`:

```
┌─────────────────────────────────────┬──────────────────────────────┐
│  Hardware Telemetry Canvas (p5.js)  │  MRAM State Table (React)    │
│  800 × 450 px · 30 fps             │  Live register view          │
│                                     ├──────────────────────────────┤
│  PMIC ──── MCU (STM32F405) ──── Peripherals  │  System Log Terminal         │
│              [IWDG bar]             │  Timestamped boot logs       │
└─────────────────────────────────────┴──────────────────────────────┘
```

**State machine** (`hardwareSketch.js`):

| State | Description |
|---|---|
| `IDLE` | Power-off; awaiting boot command |
| `BOOTING` | Sequential peripheral initialization under IWDG supervision |
| `OS_RUNNING` | All peripherals initialized; flight OS executing |
| `CRASHED` | IWDG timeout or SEL latch-up; 1,500 ms before auto-reboot |

**Cross-boundary state sync:** The p5.js canvas pushes MRAM state to React via two callback props (`addLog`, `syncMram`) passed down from `Dashboard.jsx`. This keeps the log terminal and MRAM table live with zero polling and no global store.

---

## Requirements & Dependencies

### Runtime

| Dependency | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18.x LTS recommended | JavaScript runtime |
| npm | ≥ 9.x (bundled with Node) | Package manager |

### npm Packages

| Package | Version | Purpose |
|---|---|---|
| `react` | `^19.2.8` | UI framework |
| `react-dom` | `^19.2.8` | React DOM renderer |
| `p5` | `^2.3.2` | Canvas-based hardware visualization |
| `vite` | `^8.2.0` | Build tool and dev server |
| `@vitejs/plugin-react` | `^6.0.4` | Vite React plugin (Babel-based fast refresh) |
| `eslint` | `^10.8.0` | Static analysis |
| `eslint-plugin-react-hooks` | `^7.1.1` | Hooks lint rules |
| `eslint-plugin-react-refresh` | `^0.5.3` | HMR safety rules |

### Git Submodules

| Submodule | URL | Purpose |
|---|---|---|
| `libopencm3` | https://github.com/libopencm3/libopencm3.git | ARM Cortex-M peripheral library (bundled with `.elf` reference artifact only; not used by the JS simulation) |

> The `libopencm3` submodule is only needed if you intend to inspect or rebuild the reference firmware artifacts (`.elf`, `.bin`). The JavaScript simulation runs without it.

---

## Getting Started

### Clone

If you only need the simulation (no firmware rebuild):

```bash
git clone https://github.com/your-username/sentinel-bootloader-simulation.git
cd sentinel-bootloader-simulation
```

If you also want the `libopencm3` submodule (for the reference firmware):

```bash
git clone --recursive https://github.com/your-username/sentinel-bootloader-simulation.git
cd sentinel-bootloader-simulation
```

If you already cloned without `--recursive`:

```bash
git submodule update --init --recursive
```

### Install

```bash
npm install
```

### Run (Development)

```bash
npm run dev
```

Vite starts a local dev server with hot module replacement. Open the URL printed in the terminal (typically `http://localhost:5173`).

### Build (Production)

```bash
npm run build
```

Output is written to `dist/`. Preview the production build locally:

```bash
npm run preview
```

### Deploy (Vercel)

The repository includes a `vercel.json` that rewrites all routes to `index.html` for SPA behavior. To deploy:

```bash
# Install Vercel CLI if needed
npm install -g vercel

vercel --prod
```

Or connect the repository to a Vercel project via the dashboard — it will auto-detect Vite and apply the `vercel.json` rewrite rules.

---

## Using the Simulator

### Boot Sequence

Click **[ POWER CYCLE / BOOT ]** to start the boot sequence.

The MCU transitions through:

```
IDLE → BOOTING → OS_RUNNING
```

Each peripheral (I²C Sensors → SPI Comm → UART Log) initializes sequentially with a 2,000 ms window. The IWDG watchdog bar drains continuously during each window and is reset on successful initialization. On completion, the log prints:

```
HANDOFF: Executing jump_to_os(0x08008000).
=== FLIGHT OS RUNNING ===
```

If a crash occurs, the MCU automatically reboots after 1,500 ms, reads the culprit peripheral ID from MRAM, increments its strike counter, and resumes the boot sequence — bypassing any peripheral that has reached 3 strikes.

### Fault Injection

Six fault injection buttons are available:

| Button | Fault Type | Behavior |
|---|---|---|
| **Inject \<Peripheral\> (SEU)** | Single-Event Upset | Transient fault; drains IWDG. One strike added on next reboot. |
| **Inject \<Peripheral\> (SEL)** *(red)* | Single-Event Latch-Up | Hard latch-up; immediately sets strike count to 2. Next reboot will push to 3 and power-gate the peripheral. |

**During `BOOTING`:** The fault is queued as `pendingFault` and applied to the active peripheral's initialization window.

**During `OS_RUNNING`:** The fault is critical — the flight OS halts, IWDG starves, and the MCU resets.

**After 3 strikes:** The peripheral is flagged `PMIC_GATE: OPEN (CUT)`. All future boot sequences bypass it and its power-rail trace is visually cut on the canvas.

### Reading the Panels

**Hardware Telemetry Canvas**

| Element | Meaning |
|---|---|
| PMIC block (left) | Power Management IC |
| STM32F405 block (center) | MCU; turns red on `CRASHED`, blue on `OS_RUNNING` |
| IWDG bar (inside MCU) | Green when > 50%, red when ≤ 50%; empties on fault |
| Peripheral blocks (right) | Yellow border = active; red flash = SEL latch-up; dimmed = power-gated |
| Animated dots on power traces | Live current flow; disappear when power-gated or crashed |
| `CUT` label on a trace | PMIC has power-gated that peripheral domain |

**MRAM State Table** (`0x08040000`)

| Column | Description |
|---|---|
| `MEM_ADDR` | Simulated MRAM register address |
| `MODULE` | Peripheral name |
| `STRIKES` | Current fault strike count (max 3) |
| `PMIC_GATE` | `CLOSED (OK)` = powered; `OPEN (CUT)` = power-gated |

**System Log Terminal**

Timestamped log lines (using `performance.now()`) mirror the actual boot log output the real firmware would emit over UART. The terminal auto-scrolls on each new entry.

---

## Configuration

The following constants are defined in `src/simulation/hardwareSketch.js` and can be adjusted to modify simulation behavior:

| Constant | Location | Default | Description |
|---|---|---|---|
| `STRIKE_THRESHOLD` | `main.c:5` (mirrors `hardwareSketch.js:33`) | `3` | Strikes before power-gating a peripheral |
| Peripheral init window | `hardwareSketch.js:135` | `2000 ms` | Time allowed per peripheral before IWDG fires |
| IWDG drain rate (SEU) | `hardwareSketch.js:124` | `-4` per frame | WDT drain speed during an active fault |
| Crash hold time | `hardwareSketch.js:84` | `1500 ms` | Delay before automatic reboot after crash |
| Frame rate | `hardwareSketch.js:24` | `30 fps` | p5.js canvas frame rate |
| Canvas size | `hardwareSketch.js:23` | `800 × 450 px` | p5.js canvas dimensions |

---

## Code Quality

Run ESLint across all `.js` and `.jsx` files:

```bash
npm run lint
```

The ESLint config (`eslint.config.js`) enforces:
- `@eslint/js` recommended rules
- `eslint-plugin-react-hooks` — hooks dependency array correctness
- `eslint-plugin-react-refresh` — Vite HMR compatibility

The `dist/` directory is excluded from linting.

---

## Project Structure

```
sentinel-bootloader-simulation/
├── public/                        # Static assets
├── src/
│   ├── App.jsx                    # Application root
│   ├── App.css                    # Global styles
│   ├── index.css                  # Base reset and body styles
│   ├── main.jsx                   # React DOM entry point
│   ├── components/
│   │   ├── Dashboard.jsx          # Layout composition and shared state (logs, mramState)
│   │   ├── HardwareCanvas.jsx     # p5.js instance lifecycle wrapper
│   │   ├── MramTable.jsx          # Live MRAM register table
│   │   └── MatrixTerminal.jsx     # Auto-scrolling system log terminal
│   ├── simulation/
│   │   └── hardwareSketch.js      # Full state machine, boot algorithm, and draw loop
│   └── styles/                    # Component-level styles
├── libopencm3/                    # Git submodule — ARM peripheral library (firmware reference only)
├── sentinel-bootloader.elf        # Reference ELF with debug symbols (from firmware repo)
├── sentinel-bootloader.bin        # Reference flashable binary, 2.5 KB (from firmware repo)
├── sentinel.ld                    # Linker script — 32 KB Flash @ 0x08000000
├── Makefile                       # arm-none-eabi-gcc build rules (firmware reference only)
├── index.html                     # Vite HTML entry point
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # ESLint flat config
├── vercel.json                    # Vercel SPA rewrite rules
└── package.json                   # npm dependencies and scripts
```

---

## Related Repositories

| Repository | Description |
|---|---|
| **This repo** | Browser simulation — React 19, p5.js, Vite |
| [Sentinal-Bootloader](https://github.com/sanjanavenkatesh05/Sentinal-Bootloader) | Bare-metal C firmware — `arm-none-eabi-gcc`, libopencm3, STM32F405, ST-Link flashing |

The firmware repository contains the actual `main.c`, `hal_stm32.c`, `hal.h`, full build instructions with `arm-none-eabi-gcc`, ST-Link flashing procedure via OpenOCD, and UART debug setup (115,200 baud).
