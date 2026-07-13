# Design System: NUSFuel — Field Notes

## 1. Visual Theme & Atmosphere

NUSFuel is a calm, editorial mobile companion for making one good food decision at a time. The atmosphere is "campus field notes": warm paper, precise ink, small moments of burnt-apricot energy, and generous breathing room. Density is 5/10, variance is 6/10, and motion is 5/10. Layouts are mostly left-aligned with occasional offset blocks that make the app feel authored rather than templated.

The interface should feel smooth, minimal, elegant, and useful within three seconds. It should never feel like a generic calorie tracker, a medical dashboard, or a noisy fitness game.

## 2. Color Palette & Roles

- **Warm Paper** (`#F5F0E8`) — primary canvas background.
- **Porcelain** (`#FFFDF8`) — raised surfaces and input fields.
- **Linen** (`#E9E2D7`) — quiet secondary surfaces and selected states.
- **Deep Olive Ink** (`#1F2521`) — primary text and high-value numbers.
- **Moss Grey** (`#667068`) — body copy, metadata, and helper text.
- **Soft Rule** (`#D7CEC2`) — structural dividers and input borders.
- **Burnt Apricot** (`#D26A3A`) — the only accent; CTAs, active states, progress, and key nutrition emphasis.
- **Apricot Ink** (`#FFF9F2`) — text on accent surfaces.
- **Clear Warning** (`#FBEDD6`) with **Warning Rule** (`#D8A36B`) — incomplete allergen data only.

Dark mode uses the same roles with **Charcoal Canvas** (`#1B1D1B`), **Night Porcelain** (`#252925`), **Moss Surface** (`#30362F`), **Warm White Ink** (`#FAF6EE`), and **Soft Moss** (`#B4B9AF`). Never use pure black.

## 3. Typography Rules

- **Display:** Avenir Next on iOS, the platform sans-serif fallback elsewhere — track-tight, weight-led, never oversized for its own sake.
- **Body:** the same humanist sans-serif family with relaxed line-height and a maximum readable measure.
- **Numbers:** compact, high-contrast sans-serif figures; use tabular-looking alignment through consistent right edges.
- Use sentence case for headings. Use small tracked uppercase labels only for provenance, step labels, and units.
- Never use Inter, generic serif fonts, gradient text, or fake precision.

## 4. Component Stylings

- **Buttons:** one full-width primary action per screen. Burnt-apricot fill, warm-white label, 18px radius, tactile opacity/scale press feedback, no glow.
- **Cards:** use porcelain or linen only when they group a decision or a nutrition summary. Radius 20px, 1px soft rule when needed, no heavy shadow.
- **Inputs:** labels above fields, 54px minimum height, porcelain fill, quiet bottom-aligned unit label, inline errors below.
- **Choice rows:** generous touch targets with a thin accent edge or linen fill when selected. Selection is communicated with color and a clear status label.
- **Progress:** short horizontal rule with a single accent fill; never use circular dashboard meters for setup.
- **Loading:** use the platform activity indicator only for network waits; keep it close to the message.
- **Warnings:** warm, explicit, and inline. Missing allergen information is never framed as safe.

## 5. Layout Principles

- Mobile-first, single-column, edge-to-edge canvas with 20–24px horizontal gutters.
- Prefer left-aligned editorial hierarchy and offset blocks over centered marketing compositions.
- Use a 4 / 8 / 12 / 16 / 24 / 32 / 40 spacing rhythm.
- Keep the next useful action visually obvious and anchored near the bottom when the screen is a flow step.
- Never create a generic three-equal-card dashboard row. Nutrition values should read as a calm list or one strong hero metric plus supporting rows.
- Every interactive control is at least 44px tall and has an accessibility label.

## 6. Motion & Interaction

Use restrained spring-like press feedback through `opacity` and `transform` only. Pressable elements shrink to 0.985 and soften to 0.82 opacity. Avoid decorative loops in the core flow; motion should confirm a choice, save, or navigation action. Respect reduced-motion settings when a future animation layer is introduced.

## 7. Anti-Patterns (Banned)

- No emojis or decorative unicode icons in product copy.
- No Inter, pure black, purple/blue neon, oversaturated accent colors, or gradient buttons.
- No floating-glass dashboard aesthetic, heavy drop shadows, or excessive pill controls.
- No centered hero block that hides the next action.
- No fake names, fake nutrition facts, fake review counts, or unsupported safety claims.
- No "seamless", "elevate", "next-gen", or other AI copywriting clichés.
- No overlapping content, horizontal overflow, or touch targets below 44px.
