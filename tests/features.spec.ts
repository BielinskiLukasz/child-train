import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import {
  ALL_ANIMALS,
  ALL_LOCATIONS,
  ANIMAL_KEYS,
  DESTINATION_LOCATIONS,
  generateSessionPlan,
  PACE_PRESETS,
  phaseDuration,
  PHASE_DURATION,
} from "../src/game";
import { sampleAtmosphere, WEATHER_TYPES } from "../src/atmosphere";

async function openParent(page: Page) {
  await page.keyboard.press("Escape");
  const question = (await page
    .locator(".parent-gate-challenge span")
    .textContent())!;
  const [a, b] = question.match(/\d+/g)!.map(Number);
  await page.locator(".parent-gate-input").fill(String(a + b));
  await page.locator(".parent-gate-submit").click();
  await expect(page.locator(".parent-settings-content")).toBeVisible();
}

const cssVar = (page: Page, name: string) =>
  page
    .locator("main")
    .evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), name);

test.describe("expanded cast and map", () => {
  test("sixteen animals and eleven landscapes are available and named", () => {
    expect(ANIMAL_KEYS).toHaveLength(16);
    expect(DESTINATION_LOCATIONS).toHaveLength(11);
    for (const kind of ANIMAL_KEYS) {
      expect(ALL_ANIMALS[kind].name.length).toBeGreaterThan(1);
    }
    for (const location of DESTINATION_LOCATIONS) {
      const stop = ALL_LOCATIONS[location];
      expect(stop.name.length).toBeGreaterThan(1);
      expect(stop.teaser.length).toBeGreaterThan(1);
    }
    // The new arrivals specifically.
    for (const kind of ["mouse", "duck", "sheep", "pig", "turtle"] as const) {
      expect(ANIMAL_KEYS).toContain(kind);
    }
    for (const location of ["orchard", "lake", "lavender", "bridge"] as const) {
      expect(DESTINATION_LOCATIONS).toContain(location);
    }
  });

  test("the planner can choose every new animal and landscape", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    await openParent(page);
    for (const kind of ANIMAL_KEYS) {
      await expect(
        page.locator(`#planner-driver option[value=${kind}]`),
      ).toHaveCount(1);
    }
    for (const location of DESTINATION_LOCATIONS) {
      await expect(
        page.locator(`#planner-station-0 option[value=${location}]`),
      ).toHaveCount(1);
    }
  });

  test("a plan still never repeats an animal or a station", () => {
    for (const seed of [0.05, 0.3, 0.55, 0.8, 0.99]) {
      const plan = generateSessionPlan(() => seed);
      const animals = [plan.driver, ...plan.passengers];
      expect(new Set(animals).size).toBe(4);
      expect(new Set(plan.tour).size).toBe(3);
      expect(plan.tour).not.toContain("home");
      expect(plan.stops).toHaveLength(4);
    }
  });
});

test.describe("seasons and moon phases", () => {
  test("the season drifts across a journey and differs between sessions", () => {
    const start = { hour: 12, weather: "clear" as const, seasonStart: 0 };
    const early = sampleAtmosphere(start, 0, 0).season;
    // Four rounds carry a whole year, so one round is roughly one season.
    const later = sampleAtmosphere(start, 3, 0).season;
    expect(early).not.toBe(later);
    for (const seasonStart of [0, 0.25, 0.5, 0.75]) {
      expect(
        sampleAtmosphere({ hour: 12, weather: "clear", seasonStart }, 0, 0)
          .season,
      ).toBeDefined();
    }
    // The seasonal palette is a real colour, and night darkens it.
    const day = sampleAtmosphere({ ...start, hour: 12 }, 0, 0);
    const night = sampleAtmosphere({ ...start, hour: 1 }, 0, 0);
    expect(day.foliage1).toMatch(/^#[0-9a-f]{6}$/);
    expect(night.foliage1).not.toBe(day.foliage1);
  });

  test("the season wraps seamlessly at the round boundary", () => {
    const start = { hour: 6, weather: "rain" as const, seasonStart: 0.4 };
    for (const round of [0, 1, 2, 5]) {
      expect(sampleAtmosphere(start, round, 1)).toEqual(
        sampleAtmosphere(start, round + 1, 0),
      );
    }
  });

  test("the moon phase is fixed per session and varies between sessions", async ({
    browser,
  }) => {
    const seen = new Set<string>();
    for (const seed of [0.1, 0.4, 0.7, 0.95]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.addInitScript((value) => {
        Math.random = () => value;
      }, seed);
      await page.goto(`file://${resolve("dist/index.html")}`);
      await expect(page.locator("main")).toHaveAttribute(
        "data-phase",
        "waiting",
      );
      const shift = await cssVar(page, "--moon-phase-shift");
      expect(parseFloat(shift)).toBeGreaterThanOrEqual(-78);
      expect(parseFloat(shift)).toBeLessThanOrEqual(78);
      seen.add(shift);
      await context.close();
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

test.describe("the station clock", () => {
  test("the hands follow the simulated hour", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    for (const [time, expectedHour] of [
      ["night", 1],
      ["dawn", 6],
      ["day", 12],
      ["dusk", 19],
    ] as const) {
      await openParent(page);
      await page.locator("#time-override").selectOption(time);
      await page.locator(".parent-done-btn").click();
      const hour = parseFloat(await cssVar(page, "--day-hour"));
      expect(hour).toBeCloseTo(expectedHour, 1);
      // rotate(hour * 30deg) -> cos/sin of that angle in the matrix.
      const matrix = await page
        .locator(".clock-hand--hour")
        .first()
        .evaluate((el) => getComputedStyle(el).transform);
      const values = matrix.match(/-?[\d.]+/g)!.map(Number);
      const radians = (expectedHour * 30 * Math.PI) / 180;
      expect(values[0]).toBeCloseTo(Math.cos(radians), 2);
      expect(values[1]).toBeCloseTo(Math.sin(radians), 2);
    }
  });
});

test.describe("passengers react to the sky", () => {
  async function boardTwo(page: Page) {
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("Enter");
      for (const phase of [
        "departing",
        "travelling",
        "arriving",
        "boarding",
      ] as const) {
        await page.clock.runFor(PHASE_DURATION[phase] + 10);
      }
    }
    await expect(page.locator("main")).toHaveAttribute("data-passengers", "2");
  }

  test("one dozes after dark and another presses to the glass in snow", async ({
    page,
  }) => {
    test.slow();
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    await openParent(page);
    await page.locator("#time-override").selectOption("night");
    await page.locator("#weather-override").selectOption("clear");
    await page.locator(".parent-done-btn").click();
    await boardTwo(page);
    await expect(page.locator(".passenger-mood--dozer")).toHaveCSS(
      "animation-name",
      "passenger-doze",
    );
    await expect(page.locator(".passenger-mood--watcher")).toHaveCSS(
      "animation-name",
      "none",
    );

    await openParent(page);
    await page.locator("#time-override").selectOption("day");
    await page.locator("#weather-override").selectOption("snow");
    await page.locator(".parent-done-btn").click();
    await expect(page.locator(".passenger-mood--dozer")).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator(".passenger-mood--watcher")).toHaveCSS(
      "animation-name",
      "passenger-watch",
    );
  });
});

test.describe("parent pace", () => {
  test("every preset scales all phases by the same factor", () => {
    expect(PACE_PRESETS.length).toBeGreaterThanOrEqual(3);
    for (const preset of PACE_PRESETS) {
      for (const phase of Object.keys(
        PHASE_DURATION,
      ) as (keyof typeof PHASE_DURATION)[]) {
        expect(phaseDuration(phase, preset.value)).toBeCloseTo(
          PHASE_DURATION[phase] * preset.value,
          6,
        );
      }
    }
    // A nonsense pace falls back to the authored tempo instead of freezing.
    expect(phaseDuration("travelling", 0)).toBe(PHASE_DURATION.travelling);
    expect(phaseDuration("travelling", Number.NaN)).toBe(
      PHASE_DURATION.travelling,
    );
  });

  test("the pace setting changes real leg timing", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    await openParent(page);
    await page.locator("#pace").selectOption("0.8");
    await page.locator(".parent-done-btn").click();
    await page.keyboard.press("Enter");
    // At 0.8 pace the 2000 ms departure is only 1600 ms.
    await page.clock.runFor(1_610);
    await expect(page.locator("main")).toHaveAttribute(
      "data-phase",
      "travelling",
    );
    await page.clock.runFor(Math.round(2200 * 0.8) + 10);
    await expect(page.locator("main")).toHaveAttribute(
      "data-phase",
      "arriving",
    );
  });
});

test.describe("weather variety", () => {
  test("every weather still cycles through a full dynamic round", () => {
    for (const weather of WEATHER_TYPES) {
      const seen = new Set<string>();
      for (let step = 0; step <= 40; step++) {
        seen.add(sampleAtmosphere({ hour: 9, weather }, 0, step / 40).weather);
      }
      expect(seen.size).toBe(WEATHER_TYPES.length);
    }
  });
});

test.describe("the world moves with the train", () => {
  const LAYERS = [".foreground-meadow", ".parallax-trees", ".scenery-parallax"];

  test("sky phenomena stay put while the ground sweeps past", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    const owner = (selector: string) =>
      page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return "missing";
        for (const layer of [
          ".foreground-meadow",
          ".parallax-trees",
          ".celestial-sky",
        ]) {
          if (el.closest(layer)) return layer;
        }
        return "static";
      }, selector);

    // The sun, moon and stars are optically at infinity: they must never ride
    // a parallax layer, or the sky would visibly drag across the scene.
    for (const sel of [
      ".atmosphere-sun",
      ".atmosphere-moon",
      ".atmosphere-stars",
    ]) {
      expect(await owner(sel)).toBe(".celestial-sky");
    }
    for (const sel of [".foreground-meadow", ".parallax-trees"]) {
      expect(await owner(sel)).toBe(sel);
    }

    // And the ground really does sweep once the train is under way. (The sky
    // layer's own motion comes from the day/night arc, not from parallax, so it
    // is the structural check above that proves it is not dragged along.)
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toHaveAttribute(
      "data-phase",
      "departing",
    );
    await page.waitForTimeout(2_600);
    await expect(page.locator("main")).toHaveAttribute(
      "data-phase",
      "travelling",
    );
    const meadowBefore = await page
      .locator(".foreground-meadow")
      .first()
      .evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(1_200);
    expect(
      await page
        .locator(".foreground-meadow")
        .first()
        .evaluate((el) => getComputedStyle(el).transform),
    ).not.toBe(meadowBefore);
  });

  test("the parallax layers are frozen at rest and sweep at their own depths while travelling", async ({
    page,
  }) => {
    test.slow();
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    const transform = (sel: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => getComputedStyle(el).transform);
    const playState = (sel: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => getComputedStyle(el).animationPlayState);

    const atRest = Object.fromEntries(
      await Promise.all(LAYERS.map(async (l) => [l, await transform(l)])),
    );
    for (const layer of LAYERS) {
      expect(await playState(layer)).toBe("paused");
    }
    await page.waitForTimeout(2_500);
    for (const layer of LAYERS) {
      expect(await transform(layer)).toBe(atRest[layer]);
    }

    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toHaveAttribute(
      "data-phase",
      "departing",
    );
    await page.waitForTimeout(2_600);
    await expect(page.locator("main")).toHaveAttribute(
      "data-phase",
      "travelling",
    );
    for (const layer of LAYERS) {
      expect(await playState(layer)).toBe("running");
    }
    const moving = Object.fromEntries(
      await Promise.all(LAYERS.map(async (l) => [l, await transform(l)])),
    );
    await page.waitForTimeout(1_200);
    for (const layer of LAYERS) {
      expect(await transform(layer)).not.toBe(moving[layer]);
    }

    // Three distinct depths, measured over the same interval: the foreground
    // meadow rushes, the tree line sweeps, and the location itself barely
    // creeps. That ordering is what reads as distance rather than one sheet
    // of scenery sliding past.
    const tx = (m: string) => {
      const n = m.match(/-?[\d.]+/g);
      return n ? Number(n[4]) : 0;
    };
    const travelled: Record<string, number> = {};
    for (const layer of LAYERS) {
      travelled[layer] = Math.abs(
        tx(await transform(layer)) - tx(moving[layer]),
      );
    }
    expect(travelled[".foreground-meadow"]).toBeGreaterThan(
      travelled[".parallax-trees"],
    );
    expect(travelled[".parallax-trees"]).toBeGreaterThan(
      travelled[".scenery-parallax"],
    );
    // Slow, but genuinely perceptible rather than a rounding error.
    expect(travelled[".scenery-parallax"]).toBeGreaterThan(1);
  });

  test("the location drift never exposes a gap at either end of its sway", async ({
    page,
  }) => {
    test.slow();
    // A short wide viewport shows the whole 1600-wide viewBox, which is the
    // worst case for edge coverage.
    await page.setViewportSize({ width: 1920, height: 600 });
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");

    for (const drift of [0, 46]) {
      await page.addStyleTag({
        content: `.scenery-parallax{animation:none!important;transform:translateX(${drift}px)!important;}`,
      });
      const coverage = await page.evaluate(() => {
        const boxes = Array.from(
          document.querySelectorAll<SVGGraphicsElement>(".scenery"),
        ).map((el) => {
          const box = el.getBBox();
          const ctm = el.getCTM()!;
          const left = new DOMPoint(box.x, 0).matrixTransform(ctm);
          const right = new DOMPoint(box.x + box.width, 0).matrixTransform(ctm);
          return { minX: left.x, maxX: right.x };
        });
        return {
          leftmost: Math.max(...boxes.map((b) => b.minX)),
          rightmost: Math.min(...boxes.map((b) => b.maxX)),
          count: boxes.length,
        };
      });
      expect(coverage.count).toBeGreaterThan(0);
      // Artwork must still cover the full viewBox at both extremes of the sway.
      expect(coverage.leftmost).toBeLessThanOrEqual(0);
      expect(coverage.rightmost).toBeGreaterThanOrEqual(1600);
      await page.reload();
      await expect(page.locator("main")).toHaveAttribute(
        "data-phase",
        "waiting",
      );
    }
  });

  test("reduced motion holds the location at its authored position", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toHaveAttribute(
      "data-phase",
      "departing",
    );
    await page.waitForTimeout(2_600);
    await expect(page.locator(".scenery-parallax")).toHaveCSS(
      "animation-name",
      "none",
    );
    // Not left permanently offset the way a finished non-looping animation would.
    await expect(page.locator(".scenery-parallax")).toHaveCSS(
      "transform",
      "none",
    );
    await context.close();
  });
});
