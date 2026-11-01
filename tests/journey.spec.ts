import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import {
  createInitialJourney,
  generateSessionPlan,
  journeyReducer,
  PHASE_DURATION,
  type JourneyState,
} from "../src/game";

async function advance(page: Page, phase: keyof typeof PHASE_DURATION) {
  await expect(page.locator("main")).toHaveAttribute("data-phase", phase);
  await page.clock.runFor(PHASE_DURATION[phase] + 10);
}

async function collectFriend(page: Page, count: number) {
  await advance(page, "departing");
  await advance(page, "travelling");
  await advance(page, "arriving");
  await expect(page.locator("main")).toHaveAttribute(
    "data-passengers",
    String(count),
  );
  await advance(page, "boarding");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
}

async function unlockParentGate(page: Page) {
  const question = (await page
    .locator(".parent-gate-challenge span")
    .textContent())!;
  const [first, second] = question.match(/\d+/g)!.map(Number);
  await page.locator(".parent-gate-input").fill(String(first + second));
  await page.locator(".parent-gate-submit").click();
  await expect(page.locator(".parent-settings-content")).toBeVisible();
}

function advanceState(state: JourneyState, random = Math.random): JourneyState {
  return journeyReducer(
    state,
    state.phase === "unboarding"
      ? { type: "ADVANCE", nextPlan: generateSessionPlan(random) }
      : { type: "ADVANCE" },
  );
}

test("the state machine waits, collects three friends, tours and resets with fresh plan", () => {
  const initialPlan = generateSessionPlan(() => 0.42);
  let state: JourneyState = createInitialJourney(initialPlan);
  const initialDriver = state.plan.driver;
  const initialPassengers = state.plan.passengers;
  expect(state.plan.driver).toBeDefined();
  expect(state.plan.passengers.length).toBe(3);
  expect(state.plan.stops.length).toBe(4);
  expect(initialPassengers).not.toContain(initialDriver);
  expect(new Set(initialPassengers).size).toBe(initialPassengers.length);

  for (let passenger = 1; passenger <= 3; passenger++) {
    state = journeyReducer(state, { type: "ENTER" });
    expect(state.phase).toBe("departing");
    expect(journeyReducer(state, { type: "ENTER" })).toBe(state);
    for (let phase = 0; phase < 4; phase++)
      state = journeyReducer(state, { type: "ADVANCE" });
    expect(state.phase).toBe("waiting");
    expect(state.passengersCount).toBe(passenger);
    expect(state.stop).toBe(passenger);
  }

  state = journeyReducer(state, { type: "ENTER" });
  expect(state.isTour).toBe(true);
  state = journeyReducer(state, { type: "ADVANCE" });
  for (let scene = 0; scene < 3; scene++) {
    expect(state.phase).toBe("touring");
    expect(state.tourIndex).toBe(scene);
    state = journeyReducer(state, { type: "ADVANCE" });
  }
  expect(state.phase).toBe("returning");
  state = journeyReducer(state, { type: "ADVANCE" });
  expect(state.phase).toBe("unboarding");
  const nextPlan = generateSessionPlan(() => 0.2);
  state = journeyReducer(state, { type: "ADVANCE", nextPlan });

  // Finished 1 full journey
  expect(state.journeys).toBe(1);
  expect(state.passengersCount).toBe(0);
  expect(state.phase).toBe("waiting");
  expect(state.plan).toEqual(nextPlan);
  expect(state.plan).not.toEqual(initialPlan);
  expect(state.plan.passengers.length).toBe(3);
});

test("reducer transitions are deterministic and reset preserves settings and journey count", () => {
  const plan = generateSessionPlan(() => 0.42);
  const nextPlan = generateSessionPlan(() => 0.2);
  let state = createInitialJourney(plan);
  state = journeyReducer(state, {
    type: "UPDATE_SETTINGS",
    settings: {
      timeOverride: "night",
      weatherOverride: "snow",
      roundsBeforeRest: 2,
      playtimeLimitMinutes: 5,
    },
  });
  state = { ...state, journeys: 3, isResting: true, restReason: "parent" };

  const reset = journeyReducer(state, {
    type: "RESET_SESSION",
    plan: nextPlan,
  });
  expect(reset.settings).toEqual(state.settings);
  expect(reset.journeys).toBe(3);
  expect(reset.plan).toEqual(nextPlan);
  expect(reset.isResting).toBe(false);
  expect(reset.restReason).toBeNull();

  const ready = createInitialJourney(plan);
  const firstResult = advanceState(
    { ...ready, phase: "unboarding", isTour: true },
    () => 0.2,
  );
  const replayedResult = advanceState(
    { ...ready, phase: "unboarding", isTour: true },
    () => 0.2,
  );
  expect(firstResult).toEqual(replayedResult);
  expect(firstResult.plan).toEqual(generateSessionPlan(() => 0.2));
});

test("the planner honours a parent's chosen conductor, passengers and stations", () => {
  const plan = generateSessionPlan(() => 0.42, {
    driver: "fox",
    passengers: ["bear", "random", "owl"],
    stations: ["mountains", "random", "river"],
  });

  // Chosen slots are honoured exactly.
  expect(plan.driver).toBe("fox");
  expect(plan.passengers[0]).toBe("bear");
  expect(plan.passengers[2]).toBe("owl");
  expect(plan.tour[0]).toBe("mountains");
  expect(plan.tour[2]).toBe("river");

  // "random" slots are filled but never repeat an earlier slot.
  const animals = [plan.driver, ...plan.passengers];
  expect(new Set(animals).size).toBe(animals.length);
  expect(new Set(plan.tour).size).toBe(plan.tour.length);
  expect(plan.tour).not.toContain("home");

  // The stop list follows the tour and always begins at home.
  expect(plan.stops[0].landscape).toBe("home");
  expect(plan.stops.slice(1).map((stop) => stop.landscape)).toEqual(plan.tour);
});

test("the planner never duplicates, even when explicit picks collide", () => {
  const plan = generateSessionPlan(() => 0.3, {
    driver: "fox",
    passengers: ["fox", "fox", "random"], // two collide with the driver
    stations: ["river", "river", "random"], // two collide with each other
  });
  const animals = [plan.driver, ...plan.passengers];
  expect(new Set(animals).size).toBe(4);
  expect(new Set(plan.tour).size).toBe(3);
});

test("Enter is the main input, held keys are ignored, and a full journey can be replayed", async ({
  page,
}) => {
  // Simulates a long journey under a fake clock, so allow extra wall time.
  test.slow();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto("/");
  const world = page.locator("main");
  await expect(page).toHaveTitle(/Artura/);

  // The Enter button is the prominent action key
  await expect(page.locator("button.enter-key")).toBeVisible();
  await page.mouse.click(720, 600);
  for (const key of ["Space", "ArrowRight", "a"])
    await page.keyboard.press(key);
  await page.clock.runFor(10000);
  await expect(world).toHaveAttribute("data-phase", "waiting");
  await expect(world).toHaveAttribute("data-passengers", "0");

  await page.keyboard.down("Enter");
  await collectFriend(page, 1);
  await page.keyboard.down("Enter");
  await page.clock.runFor(3000);
  await expect(world).toHaveAttribute("data-phase", "waiting");
  await page.keyboard.up("Enter");

  await page.keyboard.press("NumpadEnter");
  await page.keyboard.press("Enter");
  await collectFriend(page, 2);
  await page.clock.runFor(12000);
  await expect(world).toHaveAttribute("data-phase", "waiting");
  await expect(world).toHaveAttribute("data-passengers", "2");

  await page.keyboard.press("Enter");
  await collectFriend(page, 3);
  await expect(page.locator(".passenger")).toHaveCount(3);
  await page.keyboard.press("Enter");
  await advance(page, "departing");

  for (let s = 0; s < 3; s++) {
    await advance(page, "touring");
  }
  await advance(page, "returning");
  await advance(page, "unboarding");
  await expect(world).toHaveAttribute("data-phase", "waiting");
  await expect(world).toHaveAttribute("data-passengers", "0");
  await expect(world).toHaveAttribute("data-journeys", "1");
  await expect(world).toHaveAttribute("data-landscape", "home");

  await page.keyboard.press("Enter");
  await collectFriend(page, 1);
  expect(errors).toEqual([]);
});

test.describe("on a touch phone without a keyboard", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });

  test("the visible Enter button runs the whole journey by finger", async ({
    page,
  }) => {
    // A whole round by finger under a fake clock; allow extra wall time.
    test.slow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install();
    await page.goto("/");
    const world = page.locator("main");
    const enterKey = page.locator(".enter-key");

    await expect(enterKey).toBeInViewport();
    await expect(enterKey).toContainText("Enter");
    await expect(page.locator(".invitation-prefix--touch")).toBeVisible();
    await expect(page.locator(".invitation-prefix--key")).toBeHidden();
    const initialKey = (await enterKey.boundingBox())!;
    expect(initialKey.width).toBeGreaterThanOrEqual(44);
    expect(initialKey.height).toBeGreaterThanOrEqual(44);
    const tapKey = async () => {
      const currentKey = (await page.locator(".enter-key").boundingBox())!;
      await page.touchscreen.tap(
        currentKey.x + currentKey.width / 2,
        currentKey.y + currentKey.height / 2,
      );
    };

    // Touching scenery does not advance journey
    const scene = (await page.locator(".landscape").boundingBox())!;
    await page.touchscreen.tap(scene.x + scene.width / 2, scene.y + 60);
    const title = (await page.locator("h1").boundingBox())!;
    await page.touchscreen.tap(title.x + title.width / 2, title.y + 20);
    await page.clock.runFor(8000);
    await expect(world).toHaveAttribute("data-phase", "waiting");

    for (let friend = 1; friend <= 3; friend++) {
      await tapKey();
      await collectFriend(page, friend);
    }
    await expect(page.locator(".passenger")).toHaveCount(3);

    await tapKey();
    await advance(page, "departing");
    for (let s = 0; s < 3; s++) {
      await advance(page, "touring");
    }
    await advance(page, "returning");
    await advance(page, "unboarding");
    await expect(world).toHaveAttribute("data-journeys", "1");
    await expect(world).toHaveAttribute("data-passengers", "0");
    expect(errors).toEqual([]);
  });

  test("repeated taps and a long press never queue extra journeys", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    const world = page.locator("main");
    const key = (await page.locator(".enter-key").boundingBox())!;
    const centre = { x: key.x + key.width / 2, y: key.y + key.height / 2 };

    for (let tap = 0; tap < 5; tap++)
      await page.touchscreen.tap(centre.x, centre.y);
    await advance(page, "departing");
    await advance(page, "travelling");
    await advance(page, "arriving");
    await advance(page, "boarding");
    await expect(world).toHaveAttribute("data-phase", "waiting");
    await expect(world).toHaveAttribute("data-passengers", "1");

    await page.touchscreen.tap(centre.x, centre.y);
    await expect(world).toHaveAttribute("data-phase", "departing");
    await page.clock.runFor(1000);
    await page.touchscreen.tap(centre.x, centre.y);
    await page.clock.runFor(1010);
    await expect(world).toHaveAttribute("data-phase", "travelling");
    await page.clock.runFor(60000);
    await expect(world).toHaveAttribute("data-phase", "waiting");
    await expect(world).toHaveAttribute("data-passengers", "2");
  });
});

test.describe("parent controls and escape hatch", () => {
  test("the brand mark opens the parent gate only after a full three-second hold", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    const mark = page.locator(".world-brand-icon");
    await mark.hover();
    await page.mouse.down();
    await page.clock.runFor(2999);
    await expect(page.locator(".parent-modal-backdrop")).toHaveCount(0);
    await page.clock.runFor(20);
    await expect(page.locator(".parent-modal-backdrop")).toBeVisible();
    await page.mouse.up();
    await expect(page.locator(".parent-gate-input")).toBeFocused();
  });

  test("Escape key toggles parent modal with secure gate", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Escape");
    await expect(page.locator(".parent-modal-card")).toBeVisible();
    await expect(page.locator("h2#parent-modal-title")).toContainText(
      "Strefa Rodzica",
    );

    const question = (await page
      .locator(".parent-gate-challenge span")
      .textContent())!;
    const [first, second] = question.match(/\d+/g)!.map(Number);
    const answer = first + second;
    await page.locator(".parent-gate-input").fill(String(answer + 1));
    await page.locator(".parent-gate-submit").click();
    await expect(page.locator(".parent-gate-error")).toBeVisible();
    await expect(page.locator(".parent-gate-error")).not.toContainText(
      String(answer),
    );
    await page.locator(".parent-gate-input").fill(String(answer));
    await page.locator(".parent-gate-submit").click();
    await expect(page.locator(".parent-settings-content")).toBeVisible();
    await expect(page.locator("text=Pogoda i pora dnia")).toBeVisible();

    await page.locator(".parent-done-btn").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator(".parent-modal-close")).toBeFocused();

    // Close modal
    await page.locator(".parent-done-btn").click();
    await expect(page.locator(".parent-modal-card")).toBeHidden();
    await expect(page.locator(".enter-key")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.locator(".parent-modal-card")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".parent-modal-card")).toBeHidden();
  });

  test("settings survive a parent reset and rest dismissal remains parent-gated", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    await page.keyboard.press("Escape");
    await unlockParentGate(page);
    await page.locator("#time-override").selectOption("night");
    await page.locator("#weather-override").selectOption("snow");
    await page.locator("#rounds-rest").selectOption("2");
    await page.locator("#playtime-limit").selectOption("5");
    await page
      .locator(".parent-action-btn")
      .filter({ hasText: "Nowa podróż" })
      .click();
    await expect(page.locator("main")).toHaveAttribute("data-passengers", "0");

    await page.keyboard.press("Escape");
    await unlockParentGate(page);
    await expect(page.locator("#time-override")).toHaveValue("night");
    await expect(page.locator("#weather-override")).toHaveValue("snow");
    await expect(page.locator("#rounds-rest")).toHaveValue("2");
    await expect(page.locator("#playtime-limit")).toHaveValue("5");
    await page.locator(".parent-done-btn").click();

    await page.keyboard.press("Escape");
    await unlockParentGate(page);
    await page
      .locator(".parent-action-btn")
      .filter({ hasText: "Pora na odpoczynek" })
      .click();
    await expect(page.locator(".rest-screen-overlay")).toBeVisible();
    await expect(page.locator(".rest-parent-access")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".rest-screen-overlay")).toBeVisible();
    await page.locator(".rest-parent-access").click();
    await unlockParentGate(page);
    await page
      .locator(".parent-action-btn")
      .filter({ hasText: "Wznów podróż" })
      .click();
    await expect(page.locator(".rest-screen-overlay")).toHaveCount(0);
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
  });

  test("active playtime limit opens a rest screen; parent can approve one continuation", async ({
    page,
  }) => {
    // Simulates ~2 minutes of playtime under a fake clock, so allow extra wall time.
    test.slow();
    await page.clock.install();
    await page.goto("/");
    await page.keyboard.press("Escape");
    await unlockParentGate(page);
    await page.locator("#playtime-limit").selectOption("1");
    await page.locator(".parent-done-btn").click();
    await page.clock.runFor(60_500);
    await expect(page.locator(".rest-screen-overlay")).toBeVisible();
    await page.locator(".rest-parent-access").click();
    await unlockParentGate(page);
    await page
      .locator(".parent-action-btn")
      .filter({ hasText: "Wznów na kolejne 1 min" })
      .click();
    await expect(page.locator(".rest-screen-overlay")).toHaveCount(0);
    await page.clock.runFor(59_000);
    await expect(page.locator(".rest-screen-overlay")).toHaveCount(0);
    await page.clock.runFor(2_000);
    await expect(page.locator(".rest-screen-overlay")).toBeVisible();
  });

  test("a planned conductor, passenger and station drive the next journey", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    const world = page.locator("main");
    await expect(world).toHaveAttribute("data-phase", "waiting");

    await page.keyboard.press("Escape");
    await unlockParentGate(page);
    await page.locator("#planner-driver").selectOption("fox");
    await page.locator("#planner-passenger-0").selectOption("bear");
    await page.locator("#planner-station-0").selectOption("mountains");

    // A value already chosen elsewhere is offered disabled, so it can't be
    // booked twice.
    await expect(
      page.locator("#planner-passenger-0 option[value=fox]"),
    ).toBeDisabled();
    await expect(
      page.locator("#planner-station-1 option[value=mountains]"),
    ).toBeDisabled();

    // "Nowa podróż" restarts the journey with the planned roster and stops.
    await page
      .locator(".parent-action-btn")
      .filter({ hasText: "Nowa podróż" })
      .click();
    await expect(page.locator(".intro-subtitle")).toContainText("Lisek");

    // The first stop is the planned Górska Dolina (mountains), where Miś waits.
    await page.keyboard.press("Enter");
    await advance(page, "departing");
    await advance(page, "travelling");
    await expect(world).toHaveAttribute("data-landscape", "mountains");
    await advance(page, "arriving");
    await expect(page.locator(".journey-message")).toContainText("Miś");
    await advance(page, "boarding");
  });
});

test.describe("a phone held sideways", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 863, height: 360 },
  });

  test("fits the short screen, so a child never has to scroll", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".enter-key")).toBeInViewport({ ratio: 1 });
    const layout = await page.evaluate(() => ({
      scrolls: document.documentElement.scrollHeight > window.innerHeight + 1,
      wide: document.documentElement.scrollWidth > window.innerWidth + 1,
      trainBottom: document.querySelector(".train")!.getBoundingClientRect()
        .bottom,
      messageTop: document
        .querySelector(".journey-message")!
        .getBoundingClientRect().top,
    }));
    expect(layout.scrolls).toBe(false);
    expect(layout.wide).toBe(false);
    expect(layout.messageTop).toBeGreaterThan(layout.trainBottom);
  });
});

test("the story pauses when hidden and resumes with its remaining time", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "departing");
  await page.clock.runFor(1000);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("main")).toHaveClass(/is-paused/);
  await page.clock.runFor(20000);
  await expect(page.locator("main")).toHaveAttribute("data-phase", "departing");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(1100);
  await expect(page.locator("main")).toHaveAttribute(
    "data-phase",
    "travelling",
  );
});

test("the SVG mounts only the active scene and at most one crossfade scene", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const scenes = page.locator(".scenery");
  await expect(scenes).toHaveCount(1);
  await page.keyboard.press("Enter");
  await page.clock.runFor(PHASE_DURATION.departing + 10);
  await expect(page.locator("main")).toHaveAttribute(
    "data-phase",
    "travelling",
  );
  await expect(scenes).toHaveCount(2);
  await page.clock.runFor(1900);
  await expect(scenes).toHaveCount(1);
  await expect(scenes.first()).toHaveClass(/scenery--active/);
});

test("the single HTML file works offline without any remote requests", async ({
  browser,
}) => {
  const context = await browser.newContext({ offline: true });
  const page = await context.newPage();
  const remoteRequests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) remoteRequests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto(`file://${resolve("dist/index.html")}`);
  await expect(page.locator("h1")).toContainText("Artura");
  await page.keyboard.press("Enter");
  await collectFriend(page, 1);
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
  await context.close();
});

test.describe("the driver at Artur's station", () => {
  test("steps out onto the platform and back into the cab", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install();
    await page.goto("/");
    const world = page.locator("main");
    const platform = page.locator(".platform-driver");
    const cab = page.locator(".cab-driver");

    // Before the first journey the driver waits on the platform, cab empty.
    await expect(world).toHaveAttribute("data-driver", "outside");
    await expect(platform).toHaveCount(1);
    await expect(platform).toHaveCSS("opacity", "1");
    await expect(cab).toHaveCSS("opacity", "0");

    // Leaving: the driver climbs back into the cab.
    await page.keyboard.press("Enter");
    await expect(world).toHaveAttribute("data-driver", "cab");
    await expect(cab).toHaveCSS("opacity", "1");
    await expect(platform).toHaveCSS("opacity", "0");
    // The platform figure is gone with the station while under way.
    await advance(page, "travelling");
    await expect(platform).toHaveCount(0);
    await expect(cab).toHaveCSS("opacity", "1");
    expect(errors).toEqual([]);
  });

  test("stays in the cab at every stop that is not Artur's station", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    // Wait for the first render so the key listener is attached.
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    const world = page.locator("main");

    for (let friend = 1; friend <= 3; friend++) {
      await page.keyboard.press("Enter");
      await collectFriend(page, friend);
      // Parked at a destination station: still driving, no one steps out.
      await expect(world).toHaveAttribute("data-driver", "cab");
      await expect(page.locator(".platform-driver")).toHaveCount(0);
      await expect(page.locator(".cab-driver")).toHaveCSS("opacity", "1");
    }
  });

  test("steps out again when the journey returns home", async ({ page }) => {
    // A whole round under a fake clock; allow extra wall time.
    test.slow();
    await page.clock.install();
    await page.goto("/");
    // Wait for the first render so the key listener is attached.
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    const world = page.locator("main");
    const platform = page.locator(".platform-driver");
    const cab = page.locator(".cab-driver");

    for (let friend = 1; friend <= 3; friend++) {
      await page.keyboard.press("Enter");
      await collectFriend(page, friend);
    }
    await page.keyboard.press("Enter");
    await advance(page, "departing");
    // On the scenic tour the driver stays in the cab the whole way.
    for (let scene = 0; scene < 3; scene++) {
      await advance(page, "touring");
      await expect(world).toHaveAttribute("data-driver", "cab");
    }
    await advance(page, "returning");
    await advance(page, "unboarding");
    // Home: everyone gets off, driver included.
    await expect(world).toHaveAttribute("data-driver", "outside");
    await expect(platform).toHaveCSS("opacity", "1");
    await expect(cab).toHaveCSS("opacity", "0");
  });

  test("still changes place with reduced motion, just without the climb", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.clock.install();
    await page.goto("/");
    // Wait for the first render so the key listener is attached.
    await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
    const world = page.locator("main");
    await expect(world).toHaveAttribute("data-driver", "outside");
    await expect(page.locator(".platform-driver")).toHaveCSS("opacity", "1");
    // The climb is dropped, so the swap is effectively instant.
    const climb = await page
      .locator(".platform-driver")
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(climb)).toBeLessThan(0.01);
    await page.keyboard.press("Enter");
    await expect(world).toHaveAttribute("data-driver", "cab");
    await expect(page.locator(".cab-driver")).toHaveCSS("opacity", "1");
    await context.close();
  });

  test("hands over: the old driver leaves and a different one is already waiting", async ({
    page,
  }) => {
    test.slow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install();
    await page.goto("/");
    const world = page.locator("main");
    await expect(world).toHaveAttribute("data-phase", "waiting");

    const kindOf = (selector: string) =>
      page.evaluate((sel) => {
        const host = document.querySelector(sel);
        const animal = host?.querySelector('[class*="animal--"]');
        if (!animal) return null;
        const cls = animal.getAttribute("class") ?? "";
        return (
          (cls.match(/animal--[a-z]+/) ?? [])[0]?.replace("animal--", "") ??
          null
        );
      }, selector);

    for (let friend = 1; friend <= 3; friend++) {
      await page.keyboard.press("Enter");
      await collectFriend(page, friend);
    }
    await page.keyboard.press("Enter");
    await advance(page, "departing");
    for (let scene = 0; scene < 3; scene++) await advance(page, "touring");

    // Heading home: the current driver still has the controls, and the next
    // driver is already standing on the platform.
    await expect(world).toHaveAttribute("data-phase", "returning");
    const outgoing = await kindOf(".cab-driver");
    const incoming = await kindOf(".platform-driver");
    expect(outgoing).not.toBeNull();
    expect(incoming).not.toBeNull();
    expect(incoming).not.toBe(outgoing);
    await expect(world).toHaveAttribute("data-driver-next", incoming!);
    // Nobody has stepped off yet.
    await expect(page.locator(".leaving-driver")).toHaveCount(0);
    await page.clock.runFor(PHASE_DURATION.returning + 10);

    // The goodbye: the old driver is the one stepping down and walking off,
    // and the waiting driver is unchanged — no silent swap on the platform.
    await expect(world).toHaveAttribute("data-phase", "unboarding");
    await expect(page.locator(".leaving-driver")).toHaveCount(1);
    expect(await kindOf(".leaving-driver")).toBe(outgoing);
    expect(await kindOf(".platform-driver")).toBe(incoming);
    await expect(world).toHaveAttribute("data-driver-leaving", outgoing!);

    // The outgoing figure is painted after the train, so the locomotive cannot
    // hide it while it walks across.
    const paintedAfterTrain = await page.evaluate(() => {
      const train = document.querySelector(".train")!;
      const leaving = document.querySelector(".leaving-driver")!;
      return Boolean(
        train.compareDocumentPosition(leaving) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(paintedAfterTrain).toBe(true);

    // The two figures never overlap while the old driver walks away.
    await page.waitForTimeout(900);
    const gap = await page.evaluate(() => {
      const leaving = document
        .querySelector(".leaving-driver")!
        .getBoundingClientRect();
      const waiting = document
        .querySelector(".platform-driver")!
        .getBoundingClientRect();
      // The incoming driver waits to the left and the outgoing one walks
      // further left, so the gap is measured from the right-hand figure.
      return leaving.x - waiting.right;
    });
    expect(gap).toBeGreaterThan(0);

    // Settled at home: only the incoming driver remains, and Enter boards them.
    await page.clock.runFor(PHASE_DURATION.unboarding + 10);
    await expect(world).toHaveAttribute("data-phase", "waiting");
    await expect(world).toHaveAttribute("data-driver-leaving", "");
    await expect(page.locator(".leaving-driver")).toHaveCount(0);
    expect(await kindOf(".platform-driver")).toBe(incoming);
    await page.keyboard.press("Enter");
    await expect(world).toHaveAttribute("data-phase", "departing");
    expect(await kindOf(".cab-driver")).toBe(incoming);
    expect(errors).toEqual([]);
  });
});
