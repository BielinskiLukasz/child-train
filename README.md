# Mały pociąg dziecka

A calm, silent Polish-language train activity for a young child. **Intended for supervised use.** A parent sets the child's name in the parent settings; the default is "dziecka". The app itself is controlled with only the Enter key or the large on-screen button.

**Try it live: [Mały pociąg dziecka](https://bielinskilukasz.github.io/child-enter/)**

## Purpose

A quiet cause-and-effect activity that encourages watching, waiting, and discovering animal friends without reading, timing, scoring, or failure. The train waits patiently at every station until the child is ready to continue. The parent-selected name appears in the title and the home station in Polish genitive form (for example, "dziecka", "Mai", or "Artura"). The footer dedication _"Z myślą o Arturze"_ is intentionally fixed and does not change.

## Flow

The weather and time of day are randomized upon session start and evolve dynamically along the route right from the first journey. The home station is named _Stacja {imię dziecka}_ (default: _Stacja dziecka_):

1. **Home Station:** The train waits at _Stacja dziecka_ with a randomly selected animal conductor wearing a conductor's cap. The conductor stands on the platform beside the locomotive and waves, and the cab is empty.
2. **First Pickup:** Pressing `Enter` (or tapping the on-screen button) makes the conductor climb back into the cab before the train starts a slow trip to the first destination station, where the first passenger boards a carriage and waves.
3. **Subsequent Pickups:** The train waits indefinitely at each stop. Pressing `Enter` advances to the next two stations, picking up two more unique animal friends so all three carriages are full.
4. **Scenic Tour:** With all passengers aboard, the next `Enter` begins a scenic tour through three randomized landscapes under smooth sky and weather transitions.
5. **Return & Farewell:** The train returns to _Stacja dziecka_ where the new conductor is already waiting on the station platform. As the train stops, the passenger friends and the actual train driver get off the train onto the platform, waving goodbye. The new conductor takes over on the platform, ready to board the train after Enter is pressed.
6. **Rest Screen:** After $N$ complete rounds (default: 4, or triggered manually via parent controls), a peaceful _"Pora na odpoczynek"_ sleeping-moon screen offers a calm transition to rest.

## Cast & Map

**16 animals**, all drawn from one shared template — round head, round body, stubby paws, one waving arm, a scarf — with the species carried by silhouette and a single fur colour:

Króliczek · Lisek · Miś · Jeżyk · Sówka · Wiewiórka · Kotek · Piesek · Żabka · Borsuk · Jelonek · **Myszka** · **Kaczuszka** · **Owieczka** · **Prosiaczek** · **Żółwik**

**11 destinations**, three of which are visited per journey in a randomized order:

Leśna Polana · Słoneczna Wieś · Górska Dolina · Nadbrzeże Rzeki · Brzozowy Gaj · Śnieżna Polana · Szepcząca Łąka · **Stary Sad** (orchard) · **Ciche Jezioro** (lake) · **Lawendowe Pole** (lavender field) · **Kamienny Most** (stone viaduct)

## Controls & Rules

- **Single Control:** The `Enter` key, numeric-keypad `Enter`, and the large on-screen `Enter` button are equivalent and are the only child controls.
- **No Queuing:** Each press or tap starts at most one leg. Holding keys, keyboard auto-repeat, or drumming on the button never queues extra actions or accelerates travel.
- **Ignored Inputs:** Clicking or touching anywhere else (the train, scenery, sky, or title) and pressing other keys (`Space`, arrows, letters) does nothing.
- **Patient Pacing:** Every waiting state lasts until the child is ready. When the browser tab is hidden, both the journey timer and all animations pause and resume seamlessly from the same point.

## Dynamic Environment & Atmosphere

- **Dynamic from Launch:** Time of day (0–24h), weather (`clear`, `rain`, `snow`, `fog`), moon phase and starting season are all randomized at startup and transition smoothly along the active travel distance right from Journey 1.
- **Day/Night Cycle:** Seamless progression through dawn, daytime, sunset, and night, with the sun and moon following smooth arcs, twinkling stars at night, and warm illuminated cabin and cottage windows.
- **Moon Phases:** Each session is dealt a moon phase from its random start hour, so the moon may be a thin crescent or full, and it stays consistent for the whole session.
- **Seasons:** A full year passes over four rounds (about one season per round), recoloring foliage, pines, hill bands and blossom across the leafy landscapes. Rock, water and snow keep their own fixed palettes, because seasons barely change them.
- **Station clock:** The hands on the station clock follow the simulated hour, so the clock always agrees with the sky. Because both hands land on the same visual angle at midnight, the daily wrap is invisible.
- **Passengers react to the sky:** The friend in the first carriage grows drowsy and nods off after dark; the friend in the second presses closer to the glass in snow, fog or rain. Driven purely by CSS from `data-time-of-day` and `data-weather`, so it follows the atmosphere with no extra state.
- **Foreground & Scenery Parallax:** Two ground depths — the tree line at 48 s and the foreground wildflowers, grasses and railway sleepers at 24 s and 1.2 s — sweep past while the train moves and freeze at stations. The sun, moon and stars sit in `.celestial-sky` and deliberately never parallax: sky phenomena are optically at infinity, so dragging them would read as wrong. Every parallax layer is `animation-play-state: paused` at rest, runs only under `.is-moving`, and is frozen outright by `.is-paused` when the tab is hidden.
- **Reduced Motion:** Respects `prefers-reduced-motion: reduce` by disabling continuous particle movement while preserving gentle sky colour transitions and the passengers' poses.

## Parent Controls & Safety

- **Parent Value Strip:** A subtle top banner informs supervising adults of the app's safety guarantees (`Bez dźwięku · Bez reklam · Bez internetu · Jedna interakcja · Nic nie wychodzi z urządzenia`).
- **Parent Escape Hatch & Gate:** Long-pressing the sun brand mark for 3 seconds, clicking the gear icon (`⚙`), or pressing `Escape` opens a changing addition challenge. The answer is never revealed after a wrong attempt. This is a child-resistant convenience gate, not account authentication.
- **Parent Settings:**
  - **Imię dziecka:** Enter the child's name in Polish genitive form (default: _dziecka_; for example _Mai_ or _Artura_). This immediately updates the in-app title, home-station name, browser-tab title, scene description, and screen-reader labels. It is kept in memory for this session only; the footer dedication _"Z myślą o Arturze"_ stays fixed.
  - **Plan the next journey** ("Plan podróży"): choose which animal drives (Maszynista), which three animals ride the carriages (Pasażer 1–3), and which three stations the train visits (Stacja 1–3). Every slot defaults to _"Losowo"_ (random). A value already chosen in another slot is offered disabled, so no friend or stop can be booked twice; a random slot is filled from the remaining friends and never steals a value a later slot asked for. "Wszystko losowo" clears the plan. Picks apply from the **next** journey (after returning home or "Nowa podróż").
  - Reset the session immediately with a newly randomized (or planned) conductor, passengers, and station order.
  - Trigger the _"Pora na odpoczynek"_ rest screen on demand or configure how many rounds occur before automatic rest. Waking the train requires passing the parent gate again.
  - Set an active, visible-session playtime limit (default: 20 minutes). An hourglass appears without a numeric countdown; at the limit the rest screen opens. A parent can approve one continuation from the gated settings.
  - Lock atmosphere overrides for soothing sessions (e.g. _Zawsze noc_, _Zawsze dzień_, _Cichy śnieg_, _Spokojny deszcz_, _Lekka mgła_).
  - **Pace** ("Tempo podróży"): _Bardzo spokojne_ (1.45×), _Spokojne_ (1.2×), _Zwykłe_ (1×, default) or _Żywe_ (0.8×). Every phase is scaled by the same factor, so the proportions of a round never change and the atmosphere maths stays valid at any pace. The change applies immediately; the train still waits at stations for as long as the child needs.

## Phones, Tablets & PWA

The on-screen `Enter` keycap is a real `<button>` sized for a small finger (at least 74 px tall on touch devices) and positioned at the bottom of the screen with `env(safe-area-inset-*)` padding. On touch devices the prompt changes from _"Naciśnij"_ to _"Dotknij"_. The button suppresses text selection, tap highlights, double-tap activation, and its long-press context menu. Browser zoom remains available for caregivers with low vision. Short landscape screens use a compact layout so nothing overlaps or scrolls.

There are two offline delivery modes. The production `dist/index.html` is self-contained and works directly offline, but file URLs cannot install a service worker. For an installable PWA, deploy the complete `dist/` directory to HTTPS (for example GitHub Pages) or localhost. The manifest uses the generic name "Mały pociąg dziecka" (the installed app label cannot follow the in-app parent setting). On the first online visit the service worker precaches the HTML shell, manifest, and icon PNGs; later visits can open while offline. Updates are served network-first for page navigations and replace cached shell assets for the next visit.

## Home Page UI Reference

The app is a single full-viewport screen; there is no routing. This section describes that screen as built, so future work can extend it without breaking its calm, one-control character. Markup lives in `src/App.tsx`; layout in `src/styles/layout.css`; breakpoints in `src/styles/responsive.css`; colour tokens in `src/styles/tokens.css` and `src/atmosphere.css`.

### Design principles (do not break)

- **One child control.** The only thing a child can act on is the `Enter` keycap. Everything else is `pointer-events: none`, decorative, or parent-only. New child-facing interactions are out of scope.
- **Nothing is urgent.** No countdowns, scores, badges, or progress bars. The hourglass is a wordless icon with no number. Time pressure is expressed only as a gentle dim of the scene.
- **Calm palette, no hard edges.** Paper-cream base (`#f6f3e8`), muted greens for text, one warm accent (`#9c7155`). A faint SVG noise overlay (`.little-world::after`, 12% opacity) sits over everything to keep flat fills from looking digital.
- **The sky is the theme engine.** Nearly every colour is a CSS variable set at runtime by `useAtmosphere`. Hard-code a colour only for things that must never change with the time of day.

### Art style

The illustration is a **flat, paper-cut storybook** — closer to a gouache picture book or layered construction paper than to a cartoon. Everything is hand-authored inline SVG in `src/components/illustration/`; there are no raster images. New artwork should pass as a page from the same book.

**Rendering rules (as implemented)**

- **Fills, not outlines.** Shapes are built from solid fills. Strokes appear only where a stroke _is_ the object — a blade of grass, a tree trunk, a whisker, a birch bark notch, a railway rail. There are no black contour lines around characters or props.
- **Every line is soft.** Every stroke in the scene is `strokeLinecap="round"` — there is not a single butt or square cap. Weights cluster at 2–5 px (in a 1600 × 640 viewBox), up to 8–9 px for trunks and ties. Nothing is sharp or hairline.
- **No digital effects.** Zero `<filter>`s, blurs, or drop shadows in the scene. Depth comes from stacking: a lighter band at the top of a carriage (`#f9f0d3` at 32 % opacity), a darker "shade" tone per carriage, a faint 10 %-opacity ellipse under the train. Only four gradients exist in total — ground fade, fog, night wash, moon halo — and all are smooth multi-stop washes.
- **Rounded corners everywhere.** Rectangles carry `rx` 3–11; the locomotive boiler is `rx="29"`. Hills, water and clouds are drawn with quadratic/cubic curves, never polygons.
- **One paper grain over all of it.** The 12 % SVG-noise overlay on `.little-world::after` is part of the look; it is what makes flat fills read as pigment on paper. Don't disable it for new elements.

**Palette.** Low saturation, warm, slightly desaturated as if seen through cream paper. Pure black never appears; pure white is reserved for tiny points of light — eye glints, the deer's spots, a sheen on fruit — and everything else that reads as "white" is a cream.

| Family         | Representative values                             | Used for                                                                                 |
| -------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Paper creams   | `#fffcf3` `#f5eedb` `#f7f2b5` `#f8f5e8`           | Clouds, steam, snow caps, light fur, petals, window light                                |
| Meadow greens  | `#8da982` `#94aa83` `#648a71` `#557c66` `#a8bfaa` | Tree crowns and pines — several nearby greens per scene, never one flat green            |
| Ink greens     | `#3f4d40` `#3e5b4d` `#405d4b` `#4e7163`           | Eyes, loco cab, chassis, conductor's cap, text ink                                       |
| Earth and bark | `#b96f52` `#b78268` `#9c7155` `#777c58`           | Locomotive body, roofs, trunks, accent text                                              |
| Carriage trio  | `#dfbc70` / `#a5bbae` / `#d4a38c`                 | Ochre, sage, clay — one per carriage, each with a matching darker `shade` and olive roof |
| Blush          | `#cf9f89` (55 % opacity) `#dcb9a8` `#deb09d`      | Cheeks, inner ears                                                                       |
| Water and dusk | `#a6c8c7` `#c0d4cf` `#b7c4ce`                     | River, snow shadow, cloudy-sky tint                                                      |

Weather and time of day do **not** repaint the artwork; they tint it through the CSS variables listed under _Theming contract_. That is why fixed colours above stay plausible at noon and at 1 a.m.

**Character grammar.** All sixteen animals are one template with swappable parts, which is what keeps them reading as a family:

- Round or near-round head (`r ≈ 26–34`) over a smaller round body; stubby oval paws; one arm raised in a slow `friendly-wave`.
- A shared face: two small dark ovals for eyes (`#3f4d40`), a tiny rounded nose (`#495043`), a two-bump smile, and translucent pink cheeks. Four species draw their own face instead — the owl (cream eye-discs and beak), the duck (flat bill), the sheep (dark face on a wool cloud) and the turtle (shell and beak-ish mouth) — listed in `CUSTOM_FACE`.
- Species is carried **only by silhouette** — rabbit ears, fox muzzle, hedgehog quills, owl tufts, squirrel ear-tufts, cat triangles, floppy dog ears, frog eye-bumps, badger stripe, deer antlers, mouse ears and tail, duck head-tuft, sheep wool, pig snout and curly tail, turtle shell — plus one fur colour from `FUR_COLORS`. No character has patterns, outlines or extra details beyond that.
- Every animal wears a small scarf/collar in one of four muted tones (`scarfFor`); the driver adds a green two-tone conductor's cap with a gold badge.
- The shared face can be re-drawn per `mood` — `cheerful`, `curious` (wider eyes with a glint) or `dozing` (closed arcs) — without touching the silhouette.

When adding an animal: start from the template, change the fur hex and the silhouette layer, keep the face unless the species genuinely needs its own, keep the scarf, and register it in `AnimalKind`, `ALL_ANIMALS` and `FUR_COLORS`. TypeScript will refuse to compile until all three agree.

**Scenery grammar.** Each of the eleven landscapes is three to four overlapping hill bands (lighter and bluer with distance) plus two or three reusable props from a small kit: `Pine`, `Tree` (two crown shapes), `BirchTree`, `FruitTree`, `LavenderBush`, `Cottage`, `Windmill`, `Sailboat`, `StoneBridge`, `Jetty`, reeds, fence lines, wildflowers. Distant mountains get a cream snow-cap triangle; nothing in the far ground has detail smaller than a window. Birds are a single two-arc stroke. New landscapes should be assembled from this kit before new props are drawn.

**Seasonal dressing.** The leafy landscapes (home, forest, village, meadow, birch, orchard, lavender) read their hill and foliage colours from CSS variables — `--foliage-a/b`, `--pine-a/b`, `--hill-far/near`, `--blossom` — which the atmosphere engine blends between four seasonal palettes. Rock, water and snow landscapes keep fixed hexes, because seasons barely change them. Every `var()` carries the original authored colour as its fallback, so the scene still paints before the first atmosphere frame.

**What the style is not.** No gradients on characters, no gloss or specular highlights, no thick outlines, no saturated primaries, no sharp corners, no fine texture inside shapes, no perspective. If a new element looks like a sticker, an icon or a video-game sprite, it is off-style.

### Anatomy, top to bottom

| Zone                 | Element / class                                                                | Purpose                                                                                                                                                                                                                                                                                                                                                              | Interactive?           |
| -------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Screen-reader region | `.sr-only[aria-live="polite"]`                                                 | Single live region; announces `journeyAriaAnnouncement()` on every phase change. Keep exactly one live region on the page.                                                                                                                                                                                                                                           | No                     |
| Parent value strip   | `<aside class="parent-value-strip">` → collapses to `.parent-pill-trigger`     | Safety line: _Bez dźwięku · Bez reklam · Bez internetu · Jedna interakcja · Nic nie wychodzi z urządzenia_. Has **Ustawienia** and **✕**. Dismissing it swaps in a small "Dla rodziców" pill at top-right.                                                                                                                                                           | Parent                 |
| Header               | `<header class="site-header">`                                                 | Left: wordless **sun brand mark** (`SunMark`, a `<button>`; 3 s hold opens the parent gate). Right: optional **hourglass** (only when a playtime limit is set), **mute icon + "Zawsze bez dźwięku"**, and the **⚙ gear** button. The name is intentionally not repeated here because the `<h1>` carries it.                                                         | Parent                 |
| Introduction         | `<section class="introduction">` (`top: 13.5%`, `pointer-events: none`)        | Decorative leaf flourish, `<h1>` **Mały pociąg _{imię dziecka}_** in Fraunces (serif), with the parent-selected genitive name in the accent colour (default _dziecka_), and `.intro-subtitle` showing the current **Maszynista** and **Stacja**. The subtitle is the only header text that changes during play. The footer dedication remains _"Z myślą o Arturze"_. | No                     |
| Landscape            | `<div class="landscape">` (`inset: 27% 0 135px`, `pointer-events: none`)       | The full SVG scene from `components/illustration/`: sky and celestial bodies, crossfading scenery, parallax trees, station, railway, train with three carriages, foreground meadow and weather particles. Only the active and crossfading landscapes are mounted.                                                                                                    | No                     |
| Journey invitation   | `<section class="journey-invitation">` (`bottom: max(60px, safe-area + 50px)`) | `.journey-message` (narrative line from `journeyMessage()`), `.journey-teaser` (next stop and friend, only while waiting), the `.keyboard-invitation` row **Naciśnij / Dotknij → `[Enter ↵]` → i ruszajmy w drogę**, and `.patient-note` ("Pociąg poczeka. Mamy czas.").                                                                                             | **Child (Enter only)** |
| Footer               | `<footer class="page-footer">`                                                 | Two muted taglines with a leaf and a heart. Hidden on short landscape phones.                                                                                                                                                                                                                                                                                        | No                     |
| Overlays             | `RestScreen`, `ParentModal` (native `<dialog>`)                                | Rest screen (`z-index: 60`) and parent modal (`z-index: 50`) sit above the noise layer (`z-index: 10`). Both trap focus and restore it on close.                                                                                                                                                                                                                     | Parent                 |

### The Enter keycap

The keycap is a real `<button class="enter-key">`, styled as a physical key: cream face, 1 px olive border, a thicker 4 px bottom border plus a `0 3px 0` shadow for depth, and a `translateY(2px)` press state that shortens the bottom border. It carries the label **Enter** plus a return-arrow glyph.

| Context                                   | Size                                                       | Prompt word  |
| ----------------------------------------- | ---------------------------------------------------------- | ------------ |
| Pointer devices                           | 122 × 50 px, 16 px DM Sans 600                             | **Naciśnij** |
| Touch (`hover: none` + `pointer: coarse`) | `min(280px, 72vw)` × 74 px, 23 px text, 7 px bottom border | **Dotknij**  |
| Short landscape touch (≤ 560 px tall)     | `min(240px, 44vw)` × 52 px                                 | Dotknij      |

It suppresses text selection, tap highlight, double-tap zoom and the long-press context menu. While the train is moving it stays in the DOM (so focus never jumps) but is marked `aria-disabled` and the whole invitation row fades to 45% opacity (`.is-travelling`). While waiting (`.is-ready`) it idles with a slow `key-presence` breathe animation. Clicks with `event.detail === 0` are ignored so a keyboard `Enter` on the focused button is not counted twice.

### State classes on `<main class="little-world">`

| Class / attribute                                                  | Set when                                                         | Visual effect                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.is-moving`                                                       | phase is departing / travelling / arriving / touring / returning | Starts wheel spin, pistons, parallax trees, rail sleepers and foreground meadow                                                                                                                                                                             |
| `.is-paused`                                                       | tab hidden                                                       | Pauses **every** CSS animation (`animation-play-state: paused` on `*`)                                                                                                                                                                                      |
| `.time-near-limit`                                                 | ≥ 80% of the playtime limit used, not yet resting                | Dims the landscape to 86% opacity over 1.2 s; nothing else changes                                                                                                                                                                                          |
| `.is-ready` / `.is-travelling`                                     | on `.journey-invitation`                                         | Full vs. 45% opacity of the invitation row                                                                                                                                                                                                                  |
| `data-driver`                                                      | always                                                           | `outside` or `cab`. When `outside`, the conductor stands on the platform (`.platform-driver` fades and settles down from cab height) and the cab figure (`.cab-driver`) fades out; `cab` reverses it. Only ever `outside` at _Stacja dziecka_ while parked. |
| `data-time-of-day`, `data-weather`                                 | always                                                           | Real CSS hooks, not just test hooks: they drive the passenger moods (`.passenger-mood--dozer` at dusk/night, `.passenger-mood--watcher` in snow/fog/rain).                                                                                                  |
| `data-season`                                                      | always                                                           | `spring`, `summer`, `autumn` or `winter`. Informational; the palette itself travels through the `--foliage-*` variables.                                                                                                                                    |
| `data-phase`, `data-passengers`, `data-landscape`, `data-journeys` | always                                                           | Test hooks and CSS hooks; no visual effect on their own.                                                                                                                                                                                                    |

### Theming contract (CSS variables)

`useAtmosphere` writes these onto `.little-world` at up to 24 fps; the whole page reads them. New UI should use them instead of literal colours.

| Variable                                                            | Drives                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `--sky-top`, `--sky-bottom`                                         | Page background gradient                                                                               |
| `--ink`                                                             | Heading, journey message, keycap text                                                                  |
| `--muted`                                                           | Subtitle, teaser, patient note, footer, header notes                                                   |
| `--accent`                                                          | The parent-selected child name in the title, footer heart                                              |
| `--ground`                                                          | Lower ground fill and the page's bottom fade                                                           |
| `--window`                                                          | Lit windows in cottages and the station                                                                |
| `--cloud`, `--cloud-opacity`                                        | Cloud fill and fog-thinning                                                                            |
| `--sun-x/-y/-opacity`, `--moon-x/-y/-opacity`, `--stars-opacity`    | Celestial positions and visibility                                                                     |
| `--rain-opacity`, `--snow-opacity`, `--fog-opacity`, `--night-veil` | Weather layers and the night tint                                                                      |
| `--moon-phase-shift`                                                | Horizontal offset of the moon's shadow disc: `0` is a crescent, `±78` a full moon. Fixed per session.  |
| `--day-hour`                                                        | The simulated hour (0–24). Drives the station clock hands via `rotate(calc(var(--day-hour) * 30deg))`. |
| `--foliage-a/b`, `--pine-a/b`, `--hill-far/near`, `--blossom`       | The seasonal palette for leafy landscapes; already darkened for night.                                 |

Day and night text colours switch rather than blend, so contrast stays ≥ 4.5:1 at dusk and dawn.

### Stacking order

`landscape`/`introduction`/`journey-invitation` (z 2) → `site-header` (z 3) → noise overlay `::after` (z 10) → `parent-value-strip` / pill (z 20) → `ParentModal` (z 50) → `RestScreen` (z 60). Keep new chrome below 10 so it stays under the paper grain, and keep anything that must be tappable above it.

### Responsive behaviour

| Breakpoint                           | What changes                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| ≥ 1800 px                            | Slightly taller landscape band, more bottom spacing                                                              |
| ≤ 820 px tall (desktop)              | Compact header, smaller title and keycap                                                                         |
| ≤ 1000 px                            | Title wraps; landscape widened past the edges (`inset: 32% -3% 160px`) so the train stays centred                |
| 481–1000 px portrait                 | The parent-selected child name drops to its own line; scenery stretched vertically                               |
| ≤ 480 px                             | Scenery stretched further; the "Zawsze bez dźwięku" label is hidden, leaving only its icon                       |
| ≤ 600 px tall (desktop)              | Flourish hidden, everything tightened; ≤ 450 px also hides the patient note                                      |
| Touch                                | Big keycap, "Dotknij", invitation row wraps, footer hidden                                                       |
| Touch ≤ 560 px tall (phone sideways) | Value strip, subtitle, teaser, patient note and footer hidden; title shrinks; `min-height: 0` so nothing scrolls |
| `prefers-reduced-motion`             | All keyframe animations collapse; sky still changes colour                                                       |

Horizontal insets use `env(safe-area-inset-left/right)` on the root and `env(safe-area-inset-bottom)` on the invitation row and footer.

### Motion vocabulary

Every animation is slow and transform- or opacity-only. On load the header, intro, landscape and invitation fade up in a staggered sequence (`appear`, `intro-appear`, `landscape-appear`). While moving: wheels 5 s, pistons 2.5 s, sleepers 1.2 s, foreground meadow and ground plane 24 s, parallax trees 48 s, clouds 56 s — three distinct depths, so the world reads as having distance rather than sliding as one sheet. The journey message re-mounts (`key={...}`) so each new line fades in.

At rest the scene is not frozen, just unhurried: the conductor's platform wave loops every 6.5 s, steam lifts off the funnel over 9 s, clouds drift on a 56 s alternate, a dozing passenger nods on a 9 s cycle, and the keycap breathes once every 5 s to invite the next press. Nothing bounces or flashes, and no loop anywhere in the app is faster than the 1.2 s railway sleepers — which only run while the train is moving.

### Adding to the home page safely

1. Put non-interactive decoration inside the SVG scene or `.introduction`, both already `pointer-events: none`.
2. Put any new control behind the parent gate (`ParentModal`), never on the main surface.
3. Colour it with the variables above; test it at `--day-hour` noon and 1 a.m.
4. Check it against `.is-paused` (must stop), `.time-near-limit` (must not add urgency) and reduced motion.
5. Verify the sideways-phone breakpoint still fits without scrolling (`tests/journey.spec.ts` asserts this).

## Run Locally

```sh
npm install
npm run dev
```

Python 3 (standard library only) is used by the npm lifecycle scripts to generate the PWA PNG icons from their source SVGs.

## Standalone HTML Build

```sh
npm run build
```

The generated `dist/index.html` bundles the complete application, SVG illustrations, and embedded WOFF2 fonts into a single self-contained file that works offline without a web server.

## Implementation

- `src/App.tsx`: keyboard/touch handling, parent gate trigger, rest screen, and page layout.
- `src/game.ts`: finite-state machine, the journey planner (conductor / passengers / stations, with a no-repeat assignment), the session randomizer (16 animals, 11 destinations), pace presets, and Polish copy.
- `src/atmosphere.ts`: road-progress weather/time engine, seamless 24-hour colour interpolation, the four-season palette blend, and the per-session moon phase.
- `src/components/Atmosphere.tsx` & `src/atmosphere.css`: sun, moon and its phase mask, stars, and the rain/snow/fog layers.
- `src/components/illustration/`: modular SVG art — `Scenery` (11 landscapes plus the shared prop kit), `Animal` (16 species, one template), `Train`, `Station` (including the clock driven by `--day-hour`) and `Meadow` (parallax foreground). Only the active and crossfading landscapes are mounted, and the whole scene is memoised so the once-a-second playtime tick does not rebuild it.
- `src/components/ParentModal.tsx` & `src/components/ParentValueStrip.tsx`: parent trust banner and gated settings modal (journey planner, pace, playtime, atmosphere locks).
- `src/components/RestScreen.tsx`: calm sleeping-moon rest overlay, dismissible only through the parent gate.
- `src/hooks/useAtmosphere.ts`, `src/hooks/useJourneyClock.ts`, `src/hooks/useActivePlaytime.ts` and `src/hooks/useModalFocus.ts`: DOM-variable atmosphere renderer, visibility-aware journey and playtime clocks, and native-dialog focus management.
- `src/styles/`: split tokens, layout, animations, dialogs, and responsive rules.

## Privacy

No backend, cookies, ads, third-party requests, analytics, or child data stored on the device. Journey state, parent settings, and active-session playtime exist in memory only. When served as an installable PWA, the Service Worker stores only the application shell and static icons in Cache Storage so the app can reopen offline. No audio is created or played. Fonts and artwork are bundled locally.

## Verification

```sh
npm run build
npm run typecheck
npm test
```

Automated Chromium tests verify the state machine and pure reducer replay, settings preservation on reset, the no-repeat journey planner, single-control input latching, emulated phone touch taps, sideways phone layout, three-second parent hold, dynamic parent challenge, focus restoration, parent-gated rest, the active playtime limit and its one approved continuation, the pace setting scaling real leg timing, dynamic Journey 1 atmosphere, the season drift and its seamless round boundary, per-session moon phase, station clock hands matching the simulated hour, passenger mood reactions, that the sky never parallaxes while the ground sweeps at two distinct depths and freezes at rest, hidden-tab pause/resume, reduced-motion fallback, bounded crossfading scenery, service-worker offline shell caching, and zero-network offline execution from `dist/index.html`.

## Credits

Original SVG illustrations are in the source. PWA PNG icons are generated automatically before development, tests, and production builds with `python3 tools/generate-icons.py`. DM Sans and Fraunces are bundled under the SIL Open Font License; license texts are in `src/assets/licenses/` and subsets are embedded in `src/fonts.css` (regenerated with `python3 tools/build-fonts.py`).
