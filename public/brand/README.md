# EthValue — Brand assets

Logo direction **C4**: a rounded-join monoline take on the Ethereum diamond,
paired with the *EthValue* wordmark (Sora — `Eth` 600 / `Value` 300).

Open **`index.html`** for the visual brand sheet + live previews.

## Files

```
ethvalue-brand/
├─ svg/
│  ├─ ethvalue-mark.svg          mark, white — for dark backgrounds
│  ├─ ethvalue-mark-ink.svg      mark, ink — for light backgrounds
│  ├─ ethvalue-lockup.svg        mark + wordmark, white
│  └─ ethvalue-lockup-ink.svg    mark + wordmark, ink
├─ favicon/
│  ├─ favicon.svg                scalable tab icon (dark rounded tile)
│  ├─ favicon-16.png  -32  -48
│  ├─ apple-touch-icon.png       180×180
│  ├─ icon-192.png   icon-512.png  (PWA / maskable)
│  └─ site.webmanifest
└─ avatar/
   ├─ avatar-dark-400 / 800 / 1000.png    profile pics (dark)
   ├─ avatar-light-1000.png               profile pic (light)
   └─ og-image-1200x630.png               social / Open Graph card
```

## Install on the site

Drop the contents of `favicon/` into your `public/` (or site root) and add to `<head>`:

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#070709" />

<!-- social card -->
<meta property="og:image" content="/og-image-1200x630.png" />
<meta name="twitter:card" content="summary_large_image" />
```

### Inline the mark in a React/Next nav

`ethvalue-mark.svg` is a clean, currentColor-friendly outline — paste the SVG inline
and set `stroke="currentColor"` to recolor it, or just `<img src="/ethvalue-mark.svg" />`.
The lockup wordmark uses **Sora**, which your site already loads; keep that font
linked so `ethvalue-lockup.svg` renders correctly.

## Notes
- The monoline stroke is intentionally light at large sizes and thickens for small
  icons so the diamond stays legible down to 16px. The 16px favicon drops the inner
  fold lines for clarity.
- Profile/avatar PNGs are full-bleed (no baked-in rounding) so platforms can crop to
  circle or square cleanly. Use the **dark** avatar by default; **light** for white UIs.
- Need a different stroke weight, an SVG favicon without the tile, or extra sizes
  (e.g. 1024 app-store icon)? Easy to regenerate.
