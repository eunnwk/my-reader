# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**My Reader** is a zero-dependency, no-build-step browser app for reading `.txt` files with text highlighting and Twitter sharing. The entire app is three files: `index.html`, `app.js`, `style.css`. Open `index.html` directly in a browser — there is no server, no npm, no bundler.

## Running the App

```bash
# Open directly in the default browser (Linux)
xdg-open index.html

# Or serve locally to avoid file:// quirks
python3 -m http.server 8000
# then open http://localhost:8000
```

There are no build, lint, or test commands.

## Architecture

Three screens are toggled via `showScreen()` in `app.js` — only one is visible at a time using the `.hidden` CSS class:

| Screen element (`#id`) | Purpose |
|---|---|
| `upload-screen` | Landing page; file picker for `.txt` files |
| `reader-screen` | Displays file content; mouseup listener triggers highlight flow |
| `highlight-screen` | Lists all saved highlights with share buttons |

**Data flow:**
1. `FileReader` reads the `.txt` file as UTF-8 text and sets `content.textContent`.
2. On text selection + confirm, the selected text is pushed to the `highlights` array and saved to `localStorage` under the key `'highlights'`.
3. `applyHighlights()` re-renders `content.innerHTML` by running `String.replace()` on the raw text for each saved highlight, wrapping matches in `<mark class="highlight" data-id="...">`.
4. The highlight list screen is rendered from the in-memory `highlights` array by `renderHighlightList()`.

**Known limitation:** `applyHighlights()` uses a plain `String.replace()` (not `replaceAll`), so only the **first occurrence** of a duplicated phrase gets marked. Keep this in mind if improving highlight rendering.

## Conventions

- **Language:** UI text is in Korean. Keep all user-facing strings in Korean.
- **Accent color:** `#c8a96e` (gold) is used throughout for interactive elements, highlights, and borders. Do not introduce other accent colors.
- **Dark theme:** Background `#1a1a1a`, surface `#2a2a2a`, text `#e0d5c5`. All additions must respect this palette.
- **No external dependencies:** Do not add `<script src="...">` CDN links, npm packages, or build tooling. Keep the app self-contained.
- **Inline event handlers in HTML are intentional:** `shareHighlight(id)` is called via `onclick` in dynamically generated HTML (`renderHighlightList`). This is the established pattern — do not refactor to event delegation without good reason.
- **localStorage schema:** Each highlight object has `{ id: number, text: string, book: string, date: string }`. Changing this shape requires a migration strategy since existing user data will break.
