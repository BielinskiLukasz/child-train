import { expect, test, type Page } from "@playwright/test";
import {
  ANIMAL_KEYS,
  DESTINATION_LOCATIONS,
  PHASE_DURATION,
  createInitialJourney,
  defaultAllowedContent,
  defaultPlanner,
  defaultSettings,
  generateSessionPlan,
  journeyReducer,
  updateJourneySettings,
  type AllowedContent,
  type AnimalKind,
  type JourneyPlanner,
  type JourneyState,
} from "../src/game";
import {
  JOURNEY_PRESETS,
  presetConflicts,
  presetSettings,
} from "../src/journeyPresets";

const restricted: AllowedContent = {
  allowedAnimals: ["mouse", "duck", "sheep", "pig"],
  allowedDestinations: ["orchard", "lake", "bridge"],
};

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function assertRestricted(plan: ReturnType<typeof generateSessionPlan>) {
  expect(new Set([plan.driver, ...plan.passengers]).size).toBe(4);
  expect(new Set(plan.tour).size).toBe(3);
  for (const kind of [plan.driver, ...plan.passengers])
    expect(restricted.allowedAnimals).toContain(kind);
  for (const place of plan.tour)
    expect(restricted.allowedDestinations).toContain(place);
  expect(plan.stops[0].landscape).toBe("home");
}

test("restricted random plans never draw excluded or repeated choices", () => {
  const drivers = new Set<AnimalKind>();
  for (let seed = 1; seed <= 100; seed++) {
    const plan = generateSessionPlan(
      seeded(seed * 12345),
      defaultPlanner,
      "mouse",
      restricted,
    );
    assertRestricted(plan);
    expect(plan.driver).not.toBe("mouse");
    drivers.add(plan.driver);
  }
  expect(drivers.size).toBe(3);
});

test("random slots reserve allowed pinned choices and never bypass the minimum pool", () => {
  const planner: JourneyPlanner = {
    driver: "random",
    passengers: ["duck", "sheep", "pig"],
    stations: ["random", "lake", "bridge"],
  };
  const plan = generateSessionPlan(() => 0.5, planner, "mouse", restricted);
  assertRestricted(plan);
  // The last available driver is preferable to violating an exclusion or pin.
  expect(plan.driver).toBe("mouse");
  expect(plan.passengers).toEqual(planner.passengers);
  expect(plan.tour).toEqual(["orchard", "lake", "bridge"]);
});

test("excluded manual picks are treated as random, never re-enabled", () => {
  const planner: JourneyPlanner = {
    driver: "fox",
    passengers: ["bear", "random", "pig"],
    stations: ["forest", "lake", "river"],
  };
  const plan = generateSessionPlan(() => 0.2, planner, null, restricted);
  assertRestricted(plan);
  expect(plan.passengers[2]).toBe("pig");
  expect(plan.tour[1]).toBe("lake");
});

test("insufficient content cannot be saved or silently expanded by the generator", () => {
  const settings = updateJourneySettings(defaultSettings, restricted);
  const result = updateJourneySettings(settings, {
    allowedAnimals: ["mouse", "mouse", "duck"],
    allowedDestinations: ["lake", "lake"],
  });
  expect(result.allowedAnimals).toEqual(settings.allowedAnimals);
  expect(result.allowedDestinations).toEqual(settings.allowedDestinations);
  expect(() =>
    generateSessionPlan(Math.random, defaultPlanner, null, {
      allowedAnimals: ["mouse", "duck"],
      allowedDestinations: restricted.allowedDestinations,
    }),
  ).toThrow(RangeError);
});

test("pool changes clear excluded planner pins and cached next plans without changing this ride", () => {
  const current = generateSessionPlan(() => 0.1);
  const future = generateSessionPlan(() => 0.8);
  const state: JourneyState = {
    ...createInitialJourney(current),
    phase: "returning",
    isTour: true,
    passengersCount: 3,
    nextPlan: future,
    settings: {
      ...defaultSettings,
      childName: "Mai",
      planner: {
        driver: "fox",
        passengers: ["bear", "mouse", "pig"],
        stations: ["forest", "lake", "meadow"],
      },
    },
  };
  const next = journeyReducer(state, {
    type: "UPDATE_SETTINGS",
    settings: restricted,
  });
  expect(next.plan).toBe(current);
  expect(next.nextPlan).toBeNull();
  expect(next.settings.childName).toBe("Mai");
  expect(next.settings.planner).toEqual({
    driver: "random",
    passengers: ["random", "mouse", "pig"],
    stations: ["random", "lake", "random"],
  });
  expect(
    journeyReducer(state, { type: "UPDATE_SETTINGS", settings: restricted }),
  ).toEqual(next);
});

test("every built-in preset produces a valid plan and leaves privacy and rest settings alone", () => {
  const state = createInitialJourney(
    generateSessionPlan(seeded(1)),
    {
      ...defaultSettings,
      childName: "Zosi",
      playtimeLimitMinutes: 5,
      roundsBeforeRest: 2,
    },
    3,
  );
  for (const preset of JOURNEY_PRESETS) {
    expect(presetConflicts(preset, state.settings)).toEqual([]);
    const patch = presetSettings(preset, state.settings)!;
    expect(patch).not.toBeNull();
    const next = journeyReducer(state, {
      type: "UPDATE_SETTINGS",
      settings: patch,
    });
    const plan = generateSessionPlan(
      seeded(5),
      next.settings.planner,
      null,
      next.settings,
    );
    expect(new Set([plan.driver, ...plan.passengers]).size).toBe(4);
    expect(new Set(plan.tour).size).toBe(3);
    expect(next.journeys).toBe(3);
    expect(next.settings.childName).toBe("Zosi");
    expect(next.settings.playtimeLimitMinutes).toBe(5);
    expect(next.settings.roundsBeforeRest).toBe(2);
    expect(next.settings.allowedAnimals).toEqual(state.settings.allowedAnimals);
    expect(next.settings.allowedDestinations).toEqual(
      state.settings.allowedDestinations,
    );
  }
});

test("presets cannot override excluded choices; random preset works with any valid pools", () => {
  const winter = JOURNEY_PRESETS.find((preset) => preset.id === "winter")!;
  const random = JOURNEY_PRESETS.find((preset) => preset.id === "random")!;
  expect(presetConflicts(winter, restricted)).toContain("Miś");
  expect(presetSettings(winter, restricted)).toBeNull();
  expect(presetConflicts(random, restricted)).toEqual([]);
  const patch = presetSettings(random, restricted)!;
  assertRestricted(
    generateSessionPlan(seeded(3), patch.planner, null, restricted),
  );
  expect(defaultAllowedContent.allowedAnimals).toHaveLength(ANIMAL_KEYS.length);
});

test("the farewell keeps the returning passengers, not the next roster, until the train leaves", () => {
  const oldPlan = generateSessionPlan(seeded(1));
  const newPlan = generateSessionPlan(seeded(9));
  const returning: JourneyState = {
    ...createInitialJourney(oldPlan),
    phase: "returning",
    isTour: true,
    passengersCount: 3,
    nextPlan: newPlan,
  };
  const unloading = journeyReducer(returning, { type: "ADVANCE" });
  expect(unloading.farewellPassengers).toEqual(oldPlan.passengers);
  expect(unloading.plan).toBe(oldPlan);
  const waiting = journeyReducer(unloading, { type: "ADVANCE" });
  expect(waiting.plan).toBe(newPlan);
  expect(waiting.farewellPassengers).toEqual(oldPlan.passengers);
  expect(waiting.passengersCount).toBe(0);
  const departing = journeyReducer(waiting, { type: "ENTER" });
  expect(departing.farewellPassengers).toEqual(oldPlan.passengers);
  expect(
    journeyReducer(departing, { type: "ADVANCE" }).farewellPassengers,
  ).toEqual([]);
  expect(
    journeyReducer(waiting, { type: "RESET_SESSION", plan: newPlan })
      .farewellPassengers,
  ).toEqual([]);
});

async function openSettings(page: Page) {
  await expect(page.locator("main")).toHaveAttribute("data-phase");
  await page.locator(".parent-gear-btn").click();
  const question = await page
    .locator(".parent-gate-challenge span")
    .textContent();
  const [a, b] = question!.match(/\d+/g)!.map(Number);
  await page.locator(".parent-gate-input").fill(String(a + b));
  await page.locator(".parent-gate-submit").click();
  await expect(page.locator(".parent-settings-content")).toBeVisible();
}

async function runPhase(
  page: Page,
  phase: keyof typeof PHASE_DURATION,
  pace = 1,
) {
  await expect(page.locator("main")).toHaveAttribute("data-phase", phase);
  await page.clock.runFor(PHASE_DURATION[phase] * pace + 10);
}

async function boardFriends(page: Page, pace = 1) {
  const names: string[] = [];
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Enter");
    for (const phase of [
      "departing",
      "travelling",
      "arriving",
      "boarding",
    ] as const)
      await runPhase(page, phase, pace);
    const animals = await page
      .locator(".passenger .animal")
      .evaluateAll((items) =>
        items.map(
          (item) => item.getAttribute("class")!.match(/animal--([\w]+)/)![1],
        ),
      );
    names.push(...animals.filter((animal) => !names.includes(animal)));
  }
  return names;
}

test("parents can filter random plans, cannot remove the last required choices, and see only allowed manual options", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#allowed-animal-fox")).toHaveCount(0);
  await openSettings(page);
  await page.locator("#planner-driver").selectOption("fox");
  await page.locator(".allowed-content-section summary").click();
  await page.locator("#allowed-animal-fox").uncheck();
  await expect(page.locator("#planner-driver")).toHaveValue("random");
  await expect(
    page.locator("#planner-driver option[value='fox']"),
  ).toBeDisabled();
  for (const kind of ANIMAL_KEYS) {
    if (kind !== "fox" && !restricted.allowedAnimals.includes(kind))
      await page.locator(`#allowed-animal-${kind}`).uncheck();
  }
  for (const place of DESTINATION_LOCATIONS) {
    if (!restricted.allowedDestinations.includes(place))
      await page.locator(`#allowed-destination-${place}`).uncheck();
  }
  await expect(page.locator("[id^='allowed-animal-']:checked")).toHaveCount(4);
  await expect(
    page.locator("[id^='allowed-destination-']:checked"),
  ).toHaveCount(3);
  for (const kind of restricted.allowedAnimals)
    await expect(page.locator(`#allowed-animal-${kind}`)).toBeDisabled();
  for (const place of restricted.allowedDestinations)
    await expect(page.locator(`#allowed-destination-${place}`)).toBeDisabled();

  await page
    .getByRole("button", {
      name: "Nowa podróż (nowe zwierzątka i stacje)",
      exact: true,
    })
    .click();
  const driver = await page
    .locator(".cab-driver .animal")
    .getAttribute("class");
  expect(restricted.allowedAnimals).toContain(
    driver!.match(/animal--([\w]+)/)![1],
  );
  await openSettings(page);
  await page.locator(".allowed-content-section summary").click();
  await expect(page.locator("[id^='allowed-animal-']:checked")).toHaveCount(4);
  await expect(
    page.locator("[id^='allowed-destination-']:checked"),
  ).toHaveCount(3);
  await page
    .getByRole("button", { name: "Włącz wszystkie zwierzątka", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Włącz wszystkie miejsca", exact: true })
    .click();
  await expect(page.locator("[id^='allowed-animal-']:checked")).toHaveCount(
    ANIMAL_KEYS.length,
  );
  await expect(
    page.locator("[id^='allowed-destination-']:checked"),
  ).toHaveCount(DESTINATION_LOCATIONS.length);
});

test("a preset sets the whole story, preserves personal and safety settings, and respects exclusions", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await openSettings(page);
  await page.locator("#child-name").fill("Mai");
  await page.locator("#playtime-limit").selectOption("5");
  await page.locator("#rounds-rest").selectOption("2");
  await page.locator("#journey-preset").selectOption("winter");
  await page.getByRole("button", { name: "Użyj zestawu", exact: true }).click();
  await expect(page.locator("#planner-driver")).toHaveValue("bear");
  await expect(page.locator("#planner-passenger-0")).toHaveValue("rabbit");
  await expect(page.locator("#planner-station-0")).toHaveValue("snow_village");
  await expect(page.locator("#pace")).toHaveValue("1.2");
  await expect(page.locator("#weather-override")).toHaveValue("snow");
  await expect(page.locator("#time-override")).toHaveValue("day");
  await expect(page.locator("#child-name")).toHaveValue("Mai");
  await expect(page.locator("#playtime-limit")).toHaveValue("5");
  await expect(page.locator("#rounds-rest")).toHaveValue("2");
  await page.locator(".parent-done-btn").click();
  await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
  await expect(page.locator(".intro-subtitle")).toContainText("Miś");
  await page.locator(".enter-key").focus();
  await page.keyboard.press("Enter");
  for (const phase of [
    "departing",
    "travelling",
    "arriving",
    "boarding",
  ] as const)
    await runPhase(page, phase, 1.2);
  await expect(page.locator("main")).toHaveAttribute(
    "data-landscape",
    "snow_village",
  );
  await expect(page.locator(".passenger .animal--rabbit")).toHaveCount(1);

  await openSettings(page);
  await page.locator("#journey-preset").selectOption("winter");
  await page.locator(".allowed-content-section summary").click();
  await page.locator("#allowed-animal-bear").uncheck();
  await expect(
    page.getByRole("button", { name: "Użyj zestawu", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".parent-preset-conflict")).toContainText("Miś");
  await page.locator("#journey-preset").selectOption("random");
  await page.getByRole("button", { name: "Użyj zestawu", exact: true }).click();
  await expect(page.locator("#allowed-animal-bear")).not.toBeChecked();
  await expect(page.locator("#planner-driver")).toHaveValue("random");
});

test("editing allowed choices during travel does not replace the current cast or rewind its clock", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.2;
  });
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
  const driver = await page
    .locator(".cab-driver .animal")
    .getAttribute("class");
  await page.keyboard.press("Enter");
  await page.clock.runFor(900);
  await openSettings(page);
  await page.locator(".allowed-content-section summary").click();
  const before = await page
    .locator("main")
    .evaluate((el) =>
      Number((el as HTMLElement).style.getPropertyValue("--day-hour")),
    );
  await page.locator("#allowed-animal-owl").uncheck();
  const after = await page
    .locator("main")
    .evaluate((el) =>
      Number((el as HTMLElement).style.getPropertyValue("--day-hour")),
    );
  expect(after).toBeGreaterThanOrEqual(before);
  await expect(page.locator(".cab-driver .animal")).toHaveAttribute(
    "class",
    driver!,
  );
  await page.locator(".parent-done-btn").click();
  await page.clock.runFor(8500);
  await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
  await expect(page.locator("main")).toHaveAttribute("data-passengers", "1");
});

test("touch parents can select a preset and change pools without horizontal overflow", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 740 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:5173/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
  await page.locator(".parent-gear-btn").tap();
  const question = await page
    .locator(".parent-gate-challenge span")
    .textContent();
  const [a, b] = question!.match(/\d+/g)!.map(Number);
  await page.locator(".parent-gate-input").fill(String(a + b));
  await page.locator(".parent-gate-submit").tap();
  await page.locator("#journey-preset").selectOption("evening");
  await page.getByRole("button", { name: "Użyj zestawu", exact: true }).tap();
  await expect(page.locator("#planner-driver")).toHaveValue("owl");
  await page.locator(".allowed-content-section summary").tap();
  await page.locator("#allowed-animal-mouse").tap();
  await expect(page.locator("#allowed-animal-mouse")).not.toBeChecked();
  expect(
    await page
      .locator(".parent-modal-card")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await context.close();
});

test("the actual three passengers wave on the home platform and stay until departure", async ({
  page,
}) => {
  test.slow();
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
  await expect(page.locator(".platform-farewell-friend")).toHaveCount(0);
  await openSettings(page);
  await page.locator(".allowed-content-section summary").click();
  for (const kind of ANIMAL_KEYS) {
    if (!restricted.allowedAnimals.includes(kind))
      await page.locator(`#allowed-animal-${kind}`).uncheck();
  }
  for (const place of DESTINATION_LOCATIONS) {
    if (!restricted.allowedDestinations.includes(place))
      await page.locator(`#allowed-destination-${place}`).uncheck();
  }
  await page.locator(".parent-done-btn").click();
  await page.locator(".enter-key").focus();
  const passengers = await boardFriends(page);
  expect(passengers).toHaveLength(3);
  for (const kind of passengers)
    expect(restricted.allowedAnimals).toContain(kind);
  await expect(page.locator(".platform-farewell-friend")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await runPhase(page, "departing");
  for (let i = 0; i < 3; i++) await runPhase(page, "touring");
  await runPhase(page, "returning");
  await expect(page.locator("main")).toHaveAttribute(
    "data-phase",
    "unboarding",
  );
  await expect(page.locator(".platform-farewell-friend")).toHaveCount(3);
  const farewell = page.locator(".platform-farewell-friend");
  expect(
    (
      await farewell.evaluateAll((items) =>
        items.map((item) => item.getAttribute("data-animal")),
      )
    ).sort(),
  ).toEqual([...passengers].sort());
  await expect(page.locator(".platform-new-driver-waiting")).toHaveCount(1);
  await expect(page.locator(".platform-driver-leaving")).toHaveCount(1);
  await expect(
    page.locator(".platform-farewell-friend .waving-paw"),
  ).toHaveCount(3);
  await runPhase(page, "unboarding");
  await expect(page.locator(".passenger")).toHaveCount(0);
  const nextDriver = (await page
    .locator(".cab-driver .animal")
    .getAttribute("class"))!.match(/animal--([\w]+)/)![1];
  expect(restricted.allowedAnimals).toContain(nextDriver);
  await expect(farewell).toHaveCount(3);
  await expect(farewell.first()).toHaveCSS("opacity", "1");
  await page.clock.runFor(8000);
  expect(
    (
      await farewell.evaluateAll((items) =>
        items.map((item) => item.getAttribute("data-animal")),
      )
    ).sort(),
  ).toEqual([...passengers].sort());
  await page.keyboard.press("Enter");
  await expect(
    page.locator(".station--departing .platform-farewell-friend"),
  ).toHaveCount(3);
  await runPhase(page, "departing");
  await expect(farewell).toHaveCount(0);
  expect(restricted.allowedDestinations).toContain(
    await page.locator("main").getAttribute("data-landscape"),
  );
});

test("farewell remains visible with reduced motion and does not create more child controls", async ({
  page,
}) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "waiting");
  await boardFriends(page);
  await page.keyboard.press("Enter");
  await runPhase(page, "departing");
  for (let i = 0; i < 3; i++) await runPhase(page, "touring");
  await runPhase(page, "returning");
  await expect(page.locator(".platform-farewell-friend")).toHaveCount(3);
  await expect(page.locator(".platform-farewell-friend").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".platform-farewell-friend").first()).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(
    page.locator(
      ".world-illustration button, .world-illustration [role='button']",
    ),
  ).toHaveCount(0);
});
