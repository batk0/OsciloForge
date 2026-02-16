# OscilloForge

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Electron](https://img.shields.io/github/package-json/dependency-version/batk0/OsciloForge/dev/electron)](https://www.electronjs.org/)
[![Tests](https://img.shields.io/github/package-json/dependency-version/batk0/OsciloForge/dev/vitest)](https://vitest.dev/)
[![Lint](https://img.shields.io/github/package-json/dependency-version/batk0/OsciloForge/dev/eslint)](https://eslint.org/)
[![CI](https://github.com/batk0/OsciloForge/actions/workflows/tests.yml/badge.svg)](https://github.com/batk0/OsciloForge/actions/workflows/tests.yml)
[![codecov](https://codecov.io/gh/batk0/OsciloForge/branch/main/graph/badge.svg)](https://codecov.io/gh/batk0/OsciloForge)

![OscilloForge Screenshot](OsciloForge.png)

## Overview

OscilloForge is a cross-platform desktop waveform editor built with Electron. It provides a set of tools for creating, viewing, and manipulating waveform data, inspired by the functionality of software for digital storage oscilloscopes.

The application features a responsive UI that adapts to the window size and a dark theme suitable for technical applications.

## Features

-   **File Operations:** Open and save waveform data in both CSV and the proprietary ARB format.
-   **Waveform Generation:** Generate standard **Sine**, **Square**, **Triangle** waves **Noise** and **Linear** and **Exponential** ramps 
-   **Interactive Editing:**
    -   **Freehand Drawing:** Click and drag to draw the waveform.
    -   **Line Drawing:** Click to set points and draw connected straight lines.
-   **Advanced Navigation:**
    -   Independent horizontal and vertical zoom.
    -   Fluid panning in all directions.
-   **Dynamic Grid:** An oscilloscope-style grid that dynamically adjusts its density as you zoom, providing a clear and constant visual reference.

## Supported Formats

OscilloForge supports importing and exporting waveform data in the following formats:

-   **CSV (.csv)**: Comma-Separated Values. The file should contain one floating-point value per line. Values are normalized between -1.0 and 1.0.
-   **ARB (.arb)**: A proprietary binary format used by **Hantek** hardware. It consists of a standard header followed by 16-bit signed integer data.

## Usage

### Navigation
-   **Pan**: Hold `Shift` and click-drag to move the waveform view.
-   **Zoom**: Hold `Cmd` (Mac) or `Ctrl` (Windows/Linux) and click-drag.
    -   Drag **horizontally** to zoom in/out on the time axis.
    -   Drag **vertically** to zoom in/out on the amplitude axis.

### Editing
-   **Freehand Mode**: Click and drag on the canvas to draw the waveform freely.
-   **Line Mode**: Click to set a point, then click elsewhere to draw a straight line connecting them. Continue clicking to create a multi-segment line. Right-click to complete the contiguous line segment.

### Waveform Generation
Use the toolbar to generate standard waveforms:
-   **Sine, Square, Triangle, Ramp (up/down), Exponential (up/down), Noise**: Select the type and adjust Max/Min, Cycles, and Duty (except noise)
-   **Generate**: Click to replace the current waveform with the generated one.

## License

This project is licensed under the ISC License.
