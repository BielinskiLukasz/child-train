import {
  ALL_ANIMALS,
  ALL_LOCATIONS,
  defaultPlanner,
  type AllowedContent,
  type JourneySettings,
} from "./game";

export type PresetSettings = Pick<
  JourneySettings,
  "planner" | "pace" | "weatherOverride" | "timeOverride"
>;

export interface JourneyPreset {
  id: string;
  name: string;
  description: string;
  settings: PresetSettings;
}

export const JOURNEY_PRESETS: readonly JourneyPreset[] = [
  {
    id: "forest-orchard",
    name: "Przez las i sad",
    description:
      "Lisek prowadzi pociąg z Jeżykiem, Wiewiórką i Myszką. Słoneczny dzień, las, sad i łąka; zwykłe tempo.",
    settings: {
      planner: {
        driver: "fox",
        passengers: ["hedgehog", "squirrel", "mouse"],
        stations: ["forest", "orchard", "meadow"],
      },
      pace: 1,
      weatherOverride: "clear",
      timeOverride: "day",
    },
  },
  {
    id: "winter",
    name: "Zimowa podróż",
    description:
      "Miś zabiera Króliczka, Jelonka i Owieczkę na śnieżną polanę, w góry i do brzozowego gaju. Dzień, cichy śnieg i spokojne tempo.",
    settings: {
      planner: {
        driver: "bear",
        passengers: ["rabbit", "deer", "sheep"],
        stations: ["snow_village", "mountains", "birch"],
      },
      pace: 1.2,
      weatherOverride: "snow",
      timeOverride: "day",
    },
  },
  {
    id: "evening",
    name: "Spokojny wieczór",
    description:
      "Sówka, Miś, Króliczek i Żółwik podróżują nad jezioro, przez lawendowe pole i wieś. Czyste nocne niebo i bardzo spokojne tempo.",
    settings: {
      planner: {
        driver: "owl",
        passengers: ["bear", "rabbit", "turtle"],
        stations: ["lake", "lavender", "village"],
      },
      pace: 1.45,
      weatherOverride: "clear",
      timeOverride: "night",
    },
  },
  {
    id: "random",
    name: "Losowa podróż",
    description:
      "Losowe zwierzątka i stacje wyłącznie z dozwolonych list, zmienna pogoda i pora dnia, zwykłe tempo.",
    settings: {
      planner: defaultPlanner,
      pace: 1,
      weatherOverride: "auto",
      timeOverride: "auto",
    },
  },
];

/** Presets never silently re-enable excluded friends or destinations. */
export function presetConflicts(
  preset: JourneyPreset,
  content: AllowedContent,
): string[] {
  const { planner } = preset.settings;
  return [
    ...[planner.driver, ...planner.passengers]
      .filter(
        (kind) => kind !== "random" && !content.allowedAnimals.includes(kind),
      )
      .map((kind) => (kind === "random" ? "" : ALL_ANIMALS[kind].name)),
    ...planner.stations
      .filter(
        (place) =>
          place !== "random" &&
          !content.allowedDestinations.some((allowed) => allowed === place),
      )
      .map((place) => (place === "random" ? "" : ALL_LOCATIONS[place].name)),
  ];
}

export function presetSettings(
  preset: JourneyPreset,
  content: AllowedContent,
): PresetSettings | null {
  if (presetConflicts(preset, content).length > 0) return null;
  return {
    ...preset.settings,
    planner: {
      driver: preset.settings.planner.driver,
      passengers: [...preset.settings.planner.passengers],
      stations: [...preset.settings.planner.stations],
    },
  };
}
