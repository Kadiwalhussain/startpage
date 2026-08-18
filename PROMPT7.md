# Prompt 7 — Final Integration

ChronoTab is assembled end-to-end.

## Layout
- Hero: Orbit Ring ~65–70vh with air below
- Desktop: Quote (7 cols) | Tasks + Notes stacked (5 cols)
- Tablet/mobile: stack Quote → Tasks → Notes

## QA (verified in build tree)
- `pnpm test` — 42 passed
- `pnpm compile` — clean
- `pnpm lint` — clean
- `pnpm build` — MV3 extension with icons, fonts bundled, no Google Fonts CDN

## Load
```bash
pnpm build
# chrome://extensions → Load unpacked → .output/chrome-mv3
```
