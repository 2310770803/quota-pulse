# Design QA — Windows transparent-edge recovery

- Source visual truth: `C:\Users\23107\AppData\Local\Temp\codex-clipboard-bd601b42-affb-4aac-bedc-19389364f0b9.png`
- Implementation screenshot: `F:\Projects\codex-push\app\tmp\design\transparent-gap-fix-2026-07-30\01-alerts-fixed.png`
- Full-view comparison: `F:\Projects\codex-push\app\tmp\design\transparent-gap-fix-2026-07-30\comparison-full.png`
- Focused comparison: `F:\Projects\codex-push\app\tmp\design\transparent-gap-fix-2026-07-30\comparison-right-edge.png`
- Source pixels: 517 × 655, including desktop visible through the erroneous right-side window region.
- Normalized source window: the left 456 × 655 window region was normalized to 464 × 654.
- Implementation pixels: 464 × 654.
- Implementation CSS viewport: 371 × 523 at `devicePixelRatio: 1.25`.
- State: Windows packaged app, light theme, Settings > Alerts, workspace at scroll top.

## Findings

- No remaining P0, P1, or P2 findings.
- Earlier P1: the native window reported an outer width of 368px while a lingering DevTools emulation override constrained the renderer to 338px. The 30px difference appeared as a transparent strip on the right.
- The defect was runtime-only. The product CSS already sizes `html`, `body`, and `.shell` to 100%; no application source change was required.

## Fixes and post-fix evidence

- Terminated the affected packaged-app process and relaunched it, which removed the renderer-only device-metrics override.
- Post-fix measurements show `innerWidth: 371`, `outerWidth: 372`, and `.shell` width `371.2`; the measured right-side gap is effectively zero after subpixel rounding.
- `scrollWidth` and `clientWidth` are both 371px, confirming there is no hidden horizontal overflow.
- The Alerts page and its controls remain functional after recovery.

## Required fidelity surfaces

- Fonts and typography: unchanged; the existing Segoe UI Variable / Microsoft YaHei UI stack renders consistently before and after recovery.
- Spacing and layout: restored to the full native content width. Navigation, headings, inputs, and toggles now align to the real right edge.
- Colors and visual tokens: the canvas fills the complete renderer surface; no transparent desktop color leaks through.
- Image quality and assets: the existing Quota Pulse brand asset and settings icons remain sharp at 1.25 density.
- Copy and content: all Alerts labels, inputs, and actions remain unchanged.

## Interaction and runtime checks

- Settings opened successfully and Alerts navigation became active.
- The renderer fills the native window without horizontal overflow.
- Console warning/error count during the capture flow: 0.
- The packaged app remains running on the verified Alerts screen.

final result: passed
