# IOSH Independent Certificate Document Viewer (React Application)

A modern React and TypeScript application rewriting the imported IOSH Independent Certificate Document Viewer. It provides local record verification and a feature-rich document viewer for certificate PDFs with the exact visual fidelity and layout of the original.

## Features

- **Local Certificate Verification**:
  - Validates certificate reference numbers via URL query parameter (`?ref=...`) or interactive lookup bar.
  - Matches local records with status indicators (Valid, Invalid, Not Found, Missing Parameter).
  - Displays local-record disclosure disclaimer matching original format.

- **Interactive High-Fidelity PDF Viewer**:
  - Built on PDF.js with high-DPI canvas rendering.
  - Calibrated scaling factor ensuring optimal certificate display without artificial grey bands.
  - **Thumbnail Sidebar**: Toggleable thumbnail panel with size slider zoom controls.
  - **Page Settings**: Continuous Page vs. Page-by-Page transition modes with arrow key navigation.
  - **Page Orientation**: 90-degree clockwise and counter-clockwise rotation.
  - **Page Layout**: Single Page, Double Page, and Cover Facing layouts.
  - **Zoom Suite**: Zoom in/out, preset dropdown (50%, 69%, 75%, 77%, 100%, 125%, 150%, 200%), Fit Width, and Fit Page.
  - **Pan Tool**: Click-and-drag viewport panning.
  - **Full Screen**: Fullscreen inspection toggle.

- **Faithful Design & Typography**:
  - Exact hex map background (`#0a1a34` with repeating hex pattern).
  - IOSH Training and Smart Verify Plus branding logos.
  - Poppins typography and matched status banner dimensions.
  - Sticky smooth scroll-to-top button.
  - Unified footer navigation and copyright.

## Running the App

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Build for production
npm run build
```

## Sample URL

View the local record:
`http://localhost:3000/?ref=93548623-01-MYX8`
