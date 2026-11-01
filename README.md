# IOSH Independent Certificate Document Viewer

This is a locally hosted document display that shows a locally stored PDF and its associated local record. It does **not** query IOSH, validate the certificate, or act as the official verification service.

## Run locally

1. Extract the ZIP.
2. Open this exact `iosh_project_final` folder in VS Code. `index.html` should be directly inside it.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Use the URL opened by Live Server. Add this query if needed: `?ref=93548623-01-MYX8`.
5. Set Chrome's page zoom to 100% (`Ctrl+0`) before comparing screenshots.

Sample URL when Live Server serves the parent directory on port 5500:
`http://127.0.0.1:5500/iosh_project_final/index.html?ref=93548623-01-MYX8`

If Live Server serves the project folder as its root:
`http://127.0.0.1:5500/index.html?ref=93548623-01-MYX8`

## Main files

- `index.html`: page layout, local record lookup, local-record disclosure and viewer iframe.
- `assets/css/original-match.css`: page/background/layout overrides calibrated against the screenshots.
- `pages/viewer.html`: custom PDF.js viewer, with a native Chrome PDF fallback if the PDF.js CDN is unavailable.
- `data/students.js`: local record data. Preserve its object schema.
- `documents/93548623-01-MYX8.pdf`: locally stored PDF.
- `assets/images/hex_map_bg.jpg`: background image.
- `assets/images/logo-default.png` and `Smart-Verify-Plus-Logo.png`: logo assets.
- `reference/` and `vendor/`: retained original capture and legacy WebViewer files, not loaded by the active page.

## Viewer controls

- Sidebar: opens page thumbnails; selecting a thumbnail navigates to that page.
- Page settings: Continuous Page / Page by Page, rotate clockwise/counterclockwise, Single / Double / Cover Facing layout.
- Zoom: presets, zoom in/out, Fit Width and Fit Page.
- Pan: click-and-drag scrolling.
- Settings: Full screen.

For the enhanced custom toolbar, the browser must be able to load PDF.js 3.11.174 from cdnjs. If the CDN cannot be loaded, the page falls back to Chrome's built-in PDF viewer, whose controls are supplied by Chrome and are not the custom toolbar.

## Transparency note

The local `status` field in `students.js` only controls how the local record is displayed. It is not evidence of official certificate validity. The status strip therefore says this is an independent local record and that the page does not verify authenticity.
