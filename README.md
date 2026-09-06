# XIAO PowerConsole Web

A dual-channel power monitoring console for XIAO PowerBread, connected through Web Serial.
Built with React 19, TypeScript, Vite, Tailwind CSS, Zustand, and ECharts. Runs entirely in the browser, with no backend service.

![Dark measurement interface with simulated device data](docs/console-preview.png)

## Status and Compatibility

The project is being prepared for a public preview. Cross-platform stability testing with physical hardware is not yet complete.

- Development: Node.js 22 or 24 and npm. Run `nvm use` to select the project version. Use `package-lock.json` as the only dependency lockfile.
- Browser: Use a desktop Chromium browser with Web Serial support. Open the app over localhost or HTTPS and select a serial port when prompted. In other environments, support depends on the availability of `navigator.serial`. See the [Web Serial documentation](https://developer.chrome.com/docs/capabilities/serial).
- Hardware: [XIAO PowerBread](https://github.com/nicho810/XIAO-PowerBread), running firmware that implements the XPB binary handshake and frame format described below. A verified range of firmware releases has not yet been established.
- Without hardware: Start the development server and open `/tests/preview.html`. This page uses simulated data, not actual measurements.
- Production: Deploy only `dist/`. Do not expose the development server publicly.

## Development and Validation

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Build output is written to `dist/`. Serial access requires localhost or HTTPS. The app displays an error when Web Serial is unavailable.

`npm test` uses simulated serial ports to validate session lifecycle, protocol handling, measurement precision, integration, and peak sampling. No hardware is required.
The development-only `/tests/preview.html` fixture provides deterministic data, including positive and negative single-sample spikes and stream gaps. It is excluded from production builds.

## Usage

1. Attach the device, click **Connect**, and select its serial port in the browser.
2. The app performs the START → CONFIG → CONFIG_ACK handshake at 115200 baud, then receives samples.
3. The main workspace emphasizes power for both channels, with voltage, current, and charge as secondary readings. Charts appear below in power, current, and voltage order.
4. Device calibration settings and logs are collapsed by default. On desktop, resize the sidebar by dragging the divider or using the left/right arrow keys while it is focused. Narrow screens use a scrolling, single-column layout.
5. **Disconnect** cancels a connection attempt or stops acquisition. Wait for shutdown to finish before reconnecting. If the browser's port picker is still open, select a port or cancel the picker first.

## Measurement Behavior

- XPB binary frames use `AA 55 TYPE LEN PAYLOAD CRC8`. CRC-8/MAXIM covers TYPE, LEN, and PAYLOAD.
- CONFIG contains 9 bytes: two little-endian float32 shunt resistances and one version byte.
- DATA contains 20 bytes: float32 bus and shunt voltages for both channels, plus a uint32 timestamp in milliseconds.
- Calculations retain the full precision of decoded float32 values. Formatting happens only in the display layer. Invalid payloads, non-finite values, and non-positive shunt resistances terminate the session with an error.
- Charge is calculated by trapezoidal integration of raw current samples and expressed in µAh/mAh. It is not energy in mWh.
- Integration and elapsed time include only valid intervals where `0 < dt ≤ 500ms`. Connection waiting time, stream gaps, and clock resets do not contribute to elapsed time.
- Disconnecting clears live charts and readings. Accumulated charge and valid elapsed time persist across connections until each channel's **Reset** is used.
- Chart sampling preserves the first, last, minimum, and maximum points in each bucket. Lines are straight, and gaps longer than 500ms remain visible. Downsampling affects display only, not calculations.
- The ring buffer retains the latest 3000 samples, or approximately 30 seconds at 100Hz. If the device clock moves backward, chart history is cleared and a new time segment begins.

## Architecture

```text
Device → SerialConnection (single reader) → SerialSession (handshake/re-handshake/sampling)
       → FrameParser → codec → measurement-store → Raw-sample charge integration
                                                → Peak-preserving chart sampling, 15fps
                                                → Dual-channel readings, 10Hz
```

See [AGENTS.md](AGENTS.md) for module maps and maintenance conventions.
Long-running acquisition, physical unplug/replug behavior, and operating system driver differences still require validation with real hardware.

## Pausing and Synchronized Inspection

- **Pause view** freezes all three charts, readings, and charge snapshots together. Acquisition, recording, and health monitoring continue.
- **Resume live** jumps to the latest data. A paused snapshot survives disconnection and ring-buffer overwrites until live display resumes.
- Select a 5, 10, or 30-second time window, including while paused. Available history is still limited by the 3000-sample buffer.
- All three charts share sampled timestamps and a synchronized cursor, showing voltage, current, and power for both channels at the same sample. Cursor timestamps have millisecond precision.

## CSV Recording

- Click **Start recording** after connecting to append raw samples from that moment onward. Earlier chart-buffer data is not included.
- After stopping, recording can resume by appending more samples. Each resume or backward device-clock jump increments `segment` to distinguish acquisition segments.
- Export captures all complete rows at the moment of the click without interrupting recording. Disconnecting automatically stops recording but preserves recorded data.
- CSV columns include sample index, segment, reception time in UTC, device time in milliseconds, bus voltage, shunt voltage, current, and power for both channels, calibration resistances, and protocol version. Column names specify SI units.
- Recording is independent of the chart buffer and stores text chunks in the current tab's memory. Recording stops automatically at the 64 MiB CSV limit, preserves complete rows, and prompts for export. Export before refreshing or closing the tab.
- **Clear recording** is available only while recording is stopped. It does not reset live measurements or accumulated charge.

## Acquisition Health

The toolbar displays the valid sample reception rate over approximately the last 2 seconds, the age of the most recent valid sample, and the CRC error count. Statistics reset when a connection begins. A stream is marked stale after more than 2 seconds without a valid sample and recovers automatically when samples return. Health monitoring uses the host's monotonic clock, so device-clock resets do not affect it. The CRC count represents frames that failed validation, not an exact packet-loss count.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for issue reporting and pre-submission checks. GitHub Actions runs dependency installation, tests, builds, and dependency audits on Node 22 and 24 for pushes and pull requests.

Before release, validate with physical hardware: at least one hour of continuous acquisition, repeated unplug/replug and reconnection, handshake cancellation, recording while the view is paused, and CSV comparison against device data. Record the operating system, browser version, firmware version, and results. Simulated tests do not replace these checks.

## License

Copyright (C) 2026 Nicho Deng.

This project is licensed under **GNU GPL v3.0 only** (SPDX: `GPL-3.0-only`). See [LICENSE](LICENSE) for the full terms. Commercial use, modification, and distribution are permitted. When distributing this project or a modified version covered by the GPL, you must comply with GPLv3, preserve copyright and license notices, identify modifications, and provide recipients with the corresponding source as required by the license. Private modifications that are not distributed do not need to be published, and there is no general requirement to publish source to the entire world.

This software comes without any warranty; see LICENSE for the exact terms. Third-party dependencies retain their own licenses. Related hardware and firmware projects are governed by the licenses in their respective repositories.

Frontend JavaScript deployed to Cloudflare Workers is delivered to users' browsers. When publishing build artifacts, also make the complete corresponding source and necessary build files available, with prominent source and license links at the download or application entry point. Use a fixed release or tag matching the deployed version rather than linking only to a default branch that may change over time.
