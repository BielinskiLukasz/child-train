export type Landscape =
  | "home"
  | "forest"
  | "village"
  | "mountains"
  | "river"
  | "birch"
  | "snow_village"
  | "meadow"
  | "orchard"
  | "lake"
  | "lavender"
  | "bridge";

export type AnimalKind =
  | "rabbit"
  | "fox"
  | "bear"
  | "hedgehog"
  | "owl"
  | "squirrel"
  | "cat"
  | "dog"
  | "frog"
  | "badger"
  | "deer"
  | "mouse"
  | "duck"
  | "sheep"
  | "pig"
  | "turtle";

export type Phase =
  | "waiting"
  | "departing"
  | "travelling"
  | "arriving"
  | "boarding"
  | "touring"
  | "returning"
  | "unboarding";

export interface StopDefinition {
  name: string;
  landscape: Landscape;
  teaser: string;
}

export const DEFAULT_CHILD_NAME = "dziecka";

/**
 * Parent-provided Polish genitive form: "dziecka", "Artura", "Mai", etc.
 * Keep a short single line in case the value reaches a station sign or title.
 */
export function normalizeChildName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ").slice(0, 32).trim();
  return name || DEFAULT_CHILD_NAME;
}

export interface AnimalDefinition {
  kind: AnimalKind;
  name: string;
}

export const ALL_ANIMALS: Record<AnimalKind, AnimalDefinition> = {
  rabbit: {
    kind: "rabbit",
    name: "Króliczek",
  },
  fox: {
    kind: "fox",
    name: "Lisek",
  },
  bear: {
    kind: "bear",
    name: "Miś",
  },
  hedgehog: {
    kind: "hedgehog",
    name: "Jeżyk",
  },
  owl: {
    kind: "owl",
    name: "Sówka",
  },
  squirrel: {
    kind: "squirrel",
    name: "Wiewiórka",
  },
  cat: {
    kind: "cat",
    name: "Kotek",
  },
  dog: {
    kind: "dog",
    name: "Piesek",
  },
  frog: {
    kind: "frog",
    name: "Żabka",
  },
  badger: {
    kind: "badger",
    name: "Borsuk",
  },
  deer: {
    kind: "deer",
    name: "Jelonek",
  },
  mouse: {
    kind: "mouse",
    name: "Myszka",
  },
  duck: {
    kind: "duck",
    name: "Kaczuszka",
  },
  sheep: {
    kind: "sheep",
    name: "Owieczka",
  },
  pig: {
    kind: "pig",
    name: "Prosiaczek",
  },
  turtle: {
    kind: "turtle",
    name: "Żółwik",
  },
};

export const ANIMAL_KEYS: AnimalKind[] = Object.keys(
  ALL_ANIMALS,
) as AnimalKind[];

export const ALL_LOCATIONS: Record<Landscape, StopDefinition> = {
  home: {
    name: "Stacja dziecka",
    landscape: "home",
    teaser: "Wracamy do przytulnego domku",
  },
  forest: {
    name: "Leśna Polana",
    landscape: "forest",
    teaser: "Wśród zielonych sosen i dębów",
  },
  village: {
    name: "Słoneczna Wieś",
    landscape: "village",
    teaser: "Obok małych domków i płotków",
  },
  mountains: {
    name: "Górska Dolina",
    landscape: "mountains",
    teaser: "W cieniu wysokich, łagodnych szczytów",
  },
  river: {
    name: "Nadbrzeże Rzeki",
    landscape: "river",
    teaser: "Gdzie szumi woda i kołysze się mała łódka",
  },
  birch: {
    name: "Brzozowy Gaj",
    landscape: "birch",
    teaser: "Wśród białych drzew o złotych listkach",
  },
  snow_village: {
    name: "Śnieżna Polana",
    landscape: "snow_village",
    teaser: "Otulona puszystym, białym śniegiem",
  },
  meadow: {
    name: "Szepcząca Łąka",
    landscape: "meadow",
    teaser: "Pełna pachnących polnych kwiatków",
  },
  orchard: {
    name: "Stary Sad",
    landscape: "orchard",
    teaser: "Gdzie dojrzewają jabłka i gruszki",
  },
  lake: {
    name: "Ciche Jezioro",
    landscape: "lake",
    teaser: "Nad wodą, w której przegląda się niebo",
  },
  lavender: {
    name: "Lawendowe Pole",
    landscape: "lavender",
    teaser: "Fioletowe rzędy aż po horyzont",
  },
  bridge: {
    name: "Kamienny Most",
    landscape: "bridge",
    teaser: "Wysoko nad doliną, między łukami",
  },
};

export const DESTINATION_LOCATIONS: Landscape[] = [
  "forest",
  "village",
  "mountains",
  "river",
  "birch",
  "snow_village",
  "meadow",
  "orchard",
  "lake",
  "lavender",
  "bridge",
];

export const PHASE_DURATION: Record<Exclude<Phase, "waiting">, number> = {
  departing: 2000,
  travelling: 2200,
  arriving: 1800,
  boarding: 2000,
  touring: 5600,
  returning: 2600,
  unboarding: 2400,
};

/**
 * Parent pace multiplier. Every phase is scaled by the same factor, so the
 * *proportions* of a round never change — the atmosphere road-progress maths
 * stays valid at any pace.
 */
export const PACE_PRESETS = [
  { value: 1.45, label: "Bardzo spokojne (najwolniej)" },
  { value: 1.2, label: "Spokojne" },
  { value: 1, label: "Zwykłe (domyślnie)" },
  { value: 0.8, label: "Żywe" },
] as const;

export const DEFAULT_PACE = 1;

export function phaseDuration(
  phase: Exclude<Phase, "waiting">,
  pace: number = DEFAULT_PACE,
): number {
  const safe = Number.isFinite(pace) && pace > 0 ? pace : DEFAULT_PACE;
  return PHASE_DURATION[phase] * safe;
}

export interface SessionPlan {
  driver: AnimalKind;
  passengers: AnimalKind[];
  stops: StopDefinition[];
  tour: Landscape[];
}

export type PlannedPick<T> = T | "random";

/** A parent's plan for the next journey. "random" leaves a slot to chance. */
export interface JourneyPlanner {
  driver: PlannedPick<AnimalKind>;
  passengers: [
    PlannedPick<AnimalKind>,
    PlannedPick<AnimalKind>,
    PlannedPick<AnimalKind>,
  ];
  stations: [
    PlannedPick<Landscape>,
    PlannedPick<Landscape>,
    PlannedPick<Landscape>,
  ];
}

export const defaultPlanner: JourneyPlanner = {
  driver: "random",
  passengers: ["random", "random", "random"],
  stations: ["random", "random", "random"],
};

/**
 * Builds the next journey's plan. Explicit picks win; the remaining slots are
 * filled with random values that are guaranteed not to repeat an earlier slot
 * (defensively, an explicit pick that collides with an earlier slot is treated
 * as "random"). Pure given the same `random` and `planner`.
 */
export function generateSessionPlan(
  random = Math.random,
  planner: JourneyPlanner = defaultPlanner,
  excludeDriver?: AnimalKind | null,
): SessionPlan {
  /**
   * Assigns one distinct value per slot. Explicit picks win, in order. A
   * "random" slot is filled from the values that are (a) not already used and
   * (b) not still needed by a LATER explicit slot, so a random fill can never
   * steal a value a following pick was asking for. A pick that collides with an
   * earlier assignment is treated as "random".
   *
   * If `excludeDriver` is provided, the driver slot will avoid that animal so
   * the new driver waiting at Artur's station looks different from the one getting off.
   */
  const assign = <T>(
    picks: readonly PlannedPick<T>[],
    all: readonly T[],
    excludeFirst?: T | null,
  ): T[] => {
    const used = new Set<T>();
    const result: T[] = [];
    for (let i = 0; i < picks.length; i++) {
      const pick = picks[i];
      const reservedByLater = new Set(
        picks.slice(i + 1).filter((later) => {
          const laterPick = later as PlannedPick<T>;
          return laterPick !== "random" && !used.has(laterPick as T);
        }) as T[],
      );
      if (pick !== "random" && !used.has(pick as T)) {
        result.push(pick as T);
        used.add(pick as T);
        continue;
      }
      const pool = all.filter(
        (value) =>
          !used.has(value) &&
          !reservedByLater.has(value) &&
          (i !== 0 || !excludeFirst || value !== excludeFirst),
      );
      const choice = pool[Math.floor(random() * pool.length)];
      result.push(choice);
      used.add(choice);
    }
    return result;
  };

  const [driver, ...passengers] = assign<AnimalKind>(
    [planner.driver, ...planner.passengers],
    ANIMAL_KEYS,
    planner.driver === "random" ? excludeDriver : null,
  );
  const tour = assign<Landscape>(planner.stations, DESTINATION_LOCATIONS);

  const stops: StopDefinition[] = [
    ALL_LOCATIONS.home,
    ...tour.map((location) => ALL_LOCATIONS[location]),
  ];

  return { driver, passengers, stops, tour };
}

export interface JourneySettings {
  /** Child's name in Polish genitive form, e.g. "dziecka", "Mai", "Artura". */
  childName: string;
  weatherOverride: "auto" | "clear" | "rain" | "snow" | "fog";
  timeOverride: "auto" | "day" | "night" | "dawn" | "dusk";
  roundsBeforeRest: number; // e.g. 4 rounds before rest screen, 0 = infinite
  playtimeLimitMinutes: number; // 0 = no limit
  /** Scales every phase duration; 1 is the authored tempo. */
  pace: number;
  /** Who and where for the NEXT journey; changes apply from its start. */
  planner: JourneyPlanner;
}

export const defaultSettings: JourneySettings = {
  childName: DEFAULT_CHILD_NAME,
  weatherOverride: "auto",
  timeOverride: "auto",
  roundsBeforeRest: 4,
  playtimeLimitMinutes: 20,
  pace: DEFAULT_PACE,
  planner: defaultPlanner,
};

export interface JourneyState {
  phase: Phase;
  stop: number;
  passengersCount: number;
  tourIndex: number;
  isTour: boolean;
  journeys: number;
  plan: SessionPlan;
  nextPlan: SessionPlan | null;
  returningDriver: AnimalKind | null;
  isResting: boolean;
  restReason: "rounds" | "playtime" | "parent" | null;
  settings: JourneySettings;
}

export function createInitialJourney(
  plan: SessionPlan,
  settings: JourneySettings = defaultSettings,
  journeys = 0,
): JourneyState {
  return {
    phase: "waiting",
    stop: 0,
    passengersCount: 0,
    tourIndex: 0,
    isTour: false,
    journeys,
    plan,
    nextPlan: null,
    returningDriver: null,
    isResting: false,
    restReason: null,
    settings: { ...settings },
  };
}

export type JourneyAction =
  | { type: "ENTER" }
  | { type: "ADVANCE"; nextPlan?: SessionPlan }
  | { type: "RESET_SESSION"; plan: SessionPlan }
  | { type: "UPDATE_SETTINGS"; settings: Partial<JourneySettings> }
  | {
      type: "SET_REST";
      isResting: boolean;
      reason?: JourneyState["restReason"];
    };

export function journeyReducer(
  state: JourneyState,
  action: JourneyAction,
): JourneyState {
  switch (action.type) {
    case "ENTER": {
      if (state.phase !== "waiting" || state.isResting) return state;
      const isTour = state.passengersCount === state.plan.passengers.length;
      return {
        ...state,
        phase: "departing",
        isTour,
        returningDriver: null,
      };
    }
    case "ADVANCE": {
      switch (state.phase) {
        case "departing":
          return state.isTour
            ? { ...state, phase: "touring", tourIndex: 0 }
            : {
                ...state,
                phase: "travelling",
                stop: state.passengersCount + 1,
              };
        case "travelling":
          return { ...state, phase: "arriving" };
        case "arriving":
          return {
            ...state,
            phase: "boarding",
            passengersCount: state.passengersCount + 1,
          };
        case "boarding":
          return { ...state, phase: "waiting" };
        case "touring":
          return state.tourIndex < state.plan.tour.length - 1
            ? { ...state, tourIndex: state.tourIndex + 1 }
            : {
                ...state,
                phase: "returning",
                stop: 0,
                returningDriver: state.plan.driver,
                nextPlan: action.nextPlan ?? state.nextPlan ?? null,
              };
        case "returning":
          return {
            ...state,
            phase: "unboarding",
            returningDriver: state.returningDriver ?? state.plan.driver,
            nextPlan: action.nextPlan ?? state.nextPlan ?? null,
          };
        case "unboarding": {
          const nextPlan = action.nextPlan ?? state.nextPlan ?? state.plan;
          const nextJourneys = state.journeys + 1;
          const shouldRest =
            state.settings.roundsBeforeRest > 0 &&
            nextJourneys % state.settings.roundsBeforeRest === 0;

          return {
            ...state,
            phase: "waiting",
            stop: 0,
            passengersCount: 0,
            tourIndex: 0,
            isTour: false,
            journeys: nextJourneys,
            plan: nextPlan,
            nextPlan: null,
            returningDriver: null,
            isResting: shouldRest,
            restReason: shouldRest ? "rounds" : null,
          };
        }
        default:
          return state;
      }
    }
    case "RESET_SESSION": {
      return createInitialJourney(action.plan, state.settings, state.journeys);
    }
    case "UPDATE_SETTINGS": {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings,
        },
      };
    }
    case "SET_REST": {
      return {
        ...state,
        isResting: action.isResting,
        restReason: action.isResting ? (action.reason ?? "parent") : null,
      };
    }
    default:
      return state;
  }
}

/**
 * The driver stays in the cab everywhere except Artur's own station, where
 * they step out onto the platform while the train is parked (before the first
 * journey, and again when everyone says goodbye). Pure: derived from state only.
 */
export function driverIsOutside(state: JourneyState): boolean {
  return (
    state.stop === 0 &&
    (state.phase === "waiting" || state.phase === "unboarding")
  );
}

export function currentLandscape(state: JourneyState): Landscape {
  if (state.phase === "touring") {
    return state.plan.tour[state.tourIndex] ?? "forest";
  }
  return state.plan.stops[state.stop]?.landscape ?? "home";
}

export function currentStop(state: JourneyState): StopDefinition {
  if (state.stop === 0) {
    return {
      ...ALL_LOCATIONS.home,
      name: `Stacja ${normalizeChildName(state.settings.childName)}`,
    };
  }
  return state.plan.stops[state.stop] ?? ALL_LOCATIONS.home;
}

export function nextStopTeaser(state: JourneyState): string | null {
  if (state.phase === "waiting") {
    if (state.passengersCount < state.plan.passengers.length) {
      const nextStop = state.plan.stops[state.passengersCount + 1];
      const nextPassenger =
        ALL_ANIMALS[state.plan.passengers[state.passengersCount]];
      if (nextStop && nextPassenger) {
        return `Następna stacja: ${nextStop.name}. Czeka ${nextPassenger.name}.`;
      }
    } else {
      return "Przed nami wielka podróż przez wszystkie krainy!";
    }
  }
  return null;
}

export function journeyMessage(state: JourneyState): string {
  const driver = ALL_ANIMALS[state.plan.driver];
  const passengers = state.plan.passengers;

  switch (state.phase) {
    case "waiting":
      if (state.passengersCount === 0) {
        return state.journeys > 0
          ? `Maszynista ${driver.name} czeka na stacji. Ruszamy w kolejną podróż?`
          : `Maszynista ${driver.name} zaprasza do pociągu. Ruszamy w podróż?`;
      }
      if (state.passengersCount === passengers.length) {
        return "Wszyscy przyjaciele są na pokładzie. Ruszajmy w świat!";
      }
      {
        const currentPassenger =
          ALL_ANIMALS[passengers[state.passengersCount - 1]];
        return `${currentPassenger.name} już wygodnie siedzi. Jedziemy dalej?`;
      }
    case "boarding": {
      const boarded = ALL_ANIMALS[passengers[state.passengersCount - 1]];
      return `${boarded.name} wsiada do wagonika i macha do Ciebie!`;
    }
    case "arriving": {
      const stop = state.plan.stops[state.stop];
      const waitingFriend =
        state.stop > 0 ? ALL_ANIMALS[passengers[state.stop - 1]] : null;
      return waitingFriend
        ? `${stop.name}. ${waitingFriend.name} już na nas czeka!`
        : `${stop.name}.`;
    }
    case "touring": {
      const loc = ALL_LOCATIONS[state.plan.tour[state.tourIndex]];
      return loc
        ? `${loc.name} – ${loc.teaser.toLowerCase()}...`
        : "Podróżujemy przez piękny krajobraz...";
    }
    case "returning":
      return `Wracamy do ${currentStop(state).name}. Dobrze było być razem.`;
    case "unboarding":
      return "Do zobaczenia, kochani przyjaciele!";
    default:
      return state.isTour
        ? "Koła się toczą. Wszyscy razem podziwiamy świat."
        : "Koła się toczą. Kolejny przyjaciel już wypatruje pociągu.";
  }
}

// ARIA announcement for screen readers giving calm situational awareness
export function journeyAriaAnnouncement(state: JourneyState): string {
  if (state.isResting) {
    return "Pora na odpoczynek. Pociąg śpi pod gwiazdami.";
  }
  const message = journeyMessage(state);
  const teaser = nextStopTeaser(state);
  if (state.phase === "waiting") {
    return `${message} ${teaser ? teaser : ""} Naciśnij Enter lub dotknij przycisku, aby ruszyć.`;
  }
  return `Pociąg w drodze. ${message} Przycisk chwilowo odpoczywa.`;
}
