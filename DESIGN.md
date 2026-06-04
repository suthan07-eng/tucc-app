---
name: Tamil United CC
description: Cricket club team management — availability, selection, and stats for Tamil United CC
colors:
  green: "#1a5c38"
  green-dark: "#0f3825"
  green-light: "#22744a"
  green-bg: "#e6f4ed"
  gold: "#e9a020"
  bg: "#f0f6f3"
  white: "#ffffff"
  gray-subtle: "#f1f5f2"
  gray-border: "#dde8e2"
  gray-muted: "#8fa898"
  gray-secondary: "#5c7468"
  gray-text: "#2d3f38"
  dark: "#0f1f19"
  red: "#c8302a"
  red-bg: "#fdf1f0"
  ok: "#15803d"
  ok-bg: "#edfaf3"
typography:
  display:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "-0.5px"
  heading:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.2px"
  body:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.8px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: "13px 22px"
  button-primary-hover:
    backgroundColor: "{colors.green-light}"
    textColor: "{colors.white}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    rounded: "{rounded.md}"
    padding: "13px 22px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  nav:
    backgroundColor: "{colors.green-dark}"
    textColor: "{colors.white}"
    height: "56px"
---

## Overview

Tamil United CC is a **product-register** app: a mobile-first team management tool for a Tamil cricket club in Plymouth. The design serves the players and captain, not the brand — every decision prioritises speed of comprehension and ease of use over decoration.

The visual identity is rooted in the club's colours: deep forest green and warm gold. The font is **Outfit** — geometric, confident, with real weight range. The palette is warm-tinted throughout (even grays carry a green hue) so nothing feels borrowed from a generic SaaS template.

The emotional tone is **proud and community-rooted**. Rich, not minimal. Substantial, not loud.

## Colors

### The Palette

**Forest green** (`#1a5c38`) is the primary brand colour — used for interactive elements, active states, and CTAs. The darker variant (`#0f3825`) forms the nav bar and footer. Green-bg (`#e6f4ed`) is the surface tint for selected/active states.

**Gold** (`#e9a020`) is the accent. Used sparingly: active nav indicator, hero label text, badge highlights. Not used for body copy or large fills.

**Neutral grays** are all green-tinted — no cold blue-grays. This is non-negotiable; cold grays break the palette cohesion immediately.

**Semantic colours**: red (`#c8302a`) for unavailable/error states, green-ok (`#15803d`) for available/success states.

### Shadows

All shadows carry the brand hue: `rgba(15, 56, 37, 0.08)` not `rgba(0,0,0,0.1)`. This keeps depth feeling warm rather than dirty.

### Surface hierarchy

1. Background: `#f0f6f3` (tinted off-white)
2. Card surface: `#ffffff`
3. Subtle fill: `#f1f5f2`
4. Border: `#dde8e2`

## Typography

**Outfit** is the sole typeface. Variable weight from 400 to 900 gives full hierarchy control within one family.

Scale hierarchy:
- **Display (hero headings)**: 900 weight, 30px, -0.5px tracking, 1.15 line-height
- **Heading**: 800 weight, 22px, -0.2px tracking
- **Section title**: 700 weight, 15px
- **Body**: 400–500 weight, 14px, 1.6 line-height
- **Label/caps**: 600 weight, 10–11px, 0.8px tracking, uppercase

Numeric data (counts, stats, batting scores) uses `font-variant-numeric: tabular-nums` to prevent layout shift as values change.

Negative letter-spacing on large headings (-0.5px on display, -0.2px on headings) makes Outfit feel more intentional at size.

## Elevation

Three shadow levels, all green-tinted:

| Level | Token | Use |
|---|---|---|
| Low | `0 2px 12px rgba(15,56,37,0.08), 0 1px 3px rgba(15,56,37,0.12)` | Cards |
| Medium | `0 4px 16px rgba(15,56,37,0.12)` | Floating elements, active cards |
| Nav | `0 2px 8px rgba(15,56,37,0.18)` | Sticky nav bar |

Never use `rgba(0,0,0,...)` shadows. The warmth of the tinted shadow is the tell.

## Components

### Nav

Sticky, 56px tall, `#0f3825` background. Logo in a 44px white circle (overflow: hidden). Brand name in gold, 800 weight. Nav links use a sliding `layoutId` gold underline indicator (framer-motion). Active links have a subtle `rgba(255,255,255,0.1)` pill background.

On screens < 400px the brand text hides; the logo circle remains.

### Card

White background, 18px radius, green-tinted shadow, 1px `#dde8e2` border. Padding 24px. Cards exist because they need to — not as a default container for everything.

### Button

- **Primary**: green fill, white text, 12px radius, 13px padding top/bottom, 22px left/right. Press: `scale(0.97)`. Hover: `brightness(1.07)` + lift.
- **Ghost**: transparent, green border 1.5px, green text. Same radius and padding.
- **Subtle**: green-bg fill, green text, no border.
- Disabled: `opacity: 0.5`, `cursor: not-allowed`.

### Hero section

Radial gradient accent + directional linear gradient on the dark green background. Subtle SVG noise overlay (pointer-events: none, ~4% opacity) breaks the flat digital look.

### Stat counters

3-column grid, overlapping the hero by `-32px` with `z-index: 2`. Coloured top border (3px) indicates status. Numbers at 34px / 900 weight, labels uppercase 10px.

### Availability chips

Player name + coloured dot. Circle avatar with consistent colour assignment by name hash. Chip radius: 9999px (fully rounded).

### Animations

All entry animations use `cubic-bezier(0.23, 1, 0.32, 1)` — strong ease-out, snappy, intentional. Duration 250–280ms for UI elements. Stagger: 55ms between children. Spring physics for scale interactions (`duration: 0.4, bounce: 0.15`).

## Do's and Don'ts

**Do:**
- Use the full weight range of Outfit — 900 for hero numbers, 400 for body text
- Tint every gray with the green hue; never pull in a neutral blue-gray
- Let the DTU shield logo lead — it's identity, not decoration
- Overlap the stat cards into the hero section for depth
- Keep all text `text-wrap: balance` on headings to prevent orphans

**Don't:**
- Use pure `#000000` or `#ffffff` anywhere — always a tinted near-equivalent
- Add `box-shadow` with `rgba(0,0,0,...)` — always use the brand-tinted shadow tokens
- Use border-left accent stripes on cards or list items
- Use gradient text (`background-clip: text`)
- Make it feel minimal or sparse — this community is proud, and the design should feel substantial
- Use the same padding everywhere — vary spacing for rhythm
- Use generic system-font stack without Outfit as the first family
