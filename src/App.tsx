import {
  useCallback,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Illustration } from "./components/illustration/Illustration";
import { ParentValueStrip } from "./components/ParentValueStrip";
import { ParentModal } from "./components/ParentModal";
import { RestScreen } from "./components/RestScreen";
import { useJourneyClock } from "./hooks/useJourneyClock";
import { useAtmosphere } from "./hooks/useAtmosphere";
import { useActivePlaytime } from "./hooks/useActivePlaytime";
import {
  createInitialJourney,
  currentLandscape,
  currentStop,
  driverIsOutside,
  generateSessionPlan,
  journeyMessage,
  journeyReducer,
  nextStopTeaser,
  journeyAriaAnnouncement,
  ALL_ANIMALS,
  normalizeChildName,
  type JourneySettings,
} from "./game";

function SunMark({
  productName,
  onLongPressTrigger,
}: {
  productName: string;
  onLongPressTrigger?: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onLongPressTrigger?.();
    }, 3000);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <button
      type="button"
      className="world-brand-icon cursor-pointer select-none"
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onPointerLeave={cancelPress}
      onClick={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={`${productName}. Przytrzymaj 3 sekundy, aby otworzyć ustawienia rodzica.`}
      title="Przytrzymaj 3 sekundy, aby otworzyć panel rodzica"
    >
      <svg
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
        className="w-11 h-11"
      >
        <path
          d="m22 3 4 5 6-1 1 6 5 3-3 6 3 6-5 3-1 6-6-1-4 5-4-5-6 1-1-6-5-3 3-6-3-6 5-3 1-6 6 1Z"
          fill="#e9c57e"
        />
        <circle cx="22" cy="22" r="10" stroke="#59705b" strokeWidth="1.5" />
        <path
          d="M17.5 23.5q4.5 5 9 0"
          stroke="#59705b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="18.5" cy="19.5" r="1" fill="#59705b" />
        <circle cx="25.5" cy="19.5" r="1" fill="#59705b" />
      </svg>
    </button>
  );
}

function QuietMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m11 5-5 4H3v6h3l5 4V5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="m16 9 5 6m0-6-5 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function App() {
  const [journey, dispatch] = useReducer(journeyReducer, undefined, () =>
    createInitialJourney(generateSessionPlan()),
  );
  const [visible, setVisible] = useState(!document.hidden);
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [playtimeExtensionMs, setPlaytimeExtensionMs] = useState(0);
  const enterHeld = useRef(false);

  const waiting = journey.phase === "waiting" && !journey.isResting;
  const landscape = currentLandscape(journey);
  const currentSt = currentStop(journey);
  const childName = normalizeChildName(journey.settings.childName);
  const productName = `Mały pociąg ${childName}`;
  const activeDriverKind =
    journey.phase === "unboarding" && journey.returningDriver
      ? journey.returningDriver
      : journey.plan.driver;
  const driverAnimal = ALL_ANIMALS[activeDriverKind];
  const teaser = nextStopTeaser(journey);

  useLayoutEffect(() => {
    document.title = productName;
  }, [productName]);

  // Keyboard navigation. Native dialogs own Escape while they are open.
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (parentModalOpen || journey.isResting) return;
        event.preventDefault();
        setParentModalOpen(true);
        return;
      }

      if (event.key !== "Enter" || event.isComposing) return;
      if (parentModalOpen || journey.isResting) return;
      const target = event.target;
      if (
        target instanceof Element &&
        !target.closest(".enter-key") &&
        target.closest(
          "button, input, select, textarea, [contenteditable='true']",
        )
      ) {
        return;
      }
      event.preventDefault();
      if (event.repeat || enterHeld.current) return;
      enterHeld.current = true;
      dispatch({ type: "ENTER" });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Enter") enterHeld.current = false;
    };

    const onBlur = () => {
      enterHeld.current = false;
    };

    const onVisibility = () => setVisible(!document.hidden);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [parentModalOpen, journey.isResting]);

  const world = useRef<HTMLElement | null>(null);
  const advancePhase = useCallback(() => {
    const isTourEnd =
      journey.phase === "touring" &&
      journey.tourIndex === journey.plan.tour.length - 1;
    const isEnding =
      isTourEnd ||
      journey.phase === "returning" ||
      journey.phase === "unboarding";

    const nextPlan = isEnding
      ? (journey.nextPlan ??
        generateSessionPlan(
          Math.random,
          journey.settings.planner,
          journey.plan.driver,
        ))
      : undefined;

    dispatch({
      type: "ADVANCE",
      nextPlan,
    });
  }, [
    journey.phase,
    journey.tourIndex,
    journey.plan.tour.length,
    journey.plan.driver,
    journey.nextPlan,
    journey.settings.planner,
  ]);
  const clock = useJourneyClock(journey, advancePhase);
  const initialConditions = useAtmosphere(journey, clock, world);
  const activePlaytimeMs = useActivePlaytime(visible && !journey.isResting);
  const configuredLimitMs = journey.settings.playtimeLimitMinutes * 60_000;
  const playtimeLimitMs = configuredLimitMs + playtimeExtensionMs;
  const playtimeRatio =
    configuredLimitMs > 0 ? Math.min(1, activePlaytimeMs / playtimeLimitMs) : 0;

  useLayoutEffect(() => {
    if (
      !journey.isResting &&
      configuredLimitMs > 0 &&
      activePlaytimeMs >= playtimeLimitMs
    ) {
      dispatch({ type: "SET_REST", isResting: true, reason: "playtime" });
    }
  }, [activePlaytimeMs, configuredLimitMs, journey.isResting, playtimeLimitMs]);

  const moving = [
    "departing",
    "travelling",
    "arriving",
    "touring",
    "returning",
  ].includes(journey.phase);

  const onKeyTap = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) return;
    dispatch({ type: "ENTER" });
  };

  const onKeyRelease = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse") event.currentTarget.blur();
  };

  const handleResetSession = () => {
    dispatch({
      type: "RESET_SESSION",
      plan: generateSessionPlan(Math.random, journey.settings.planner),
    });
  };

  const handleUpdateSettings = (newSettings: Partial<JourneySettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", settings: newSettings });
  };

  const handleTriggerRest = () => {
    dispatch({ type: "SET_REST", isResting: true, reason: "parent" });
  };

  const handleDismissRest = () => {
    if (journey.restReason === "playtime" && configuredLimitMs > 0) {
      // A parent-approved continuation grants one more configured time window.
      setPlaytimeExtensionMs((current) => current + configuredLimitMs);
    }
    dispatch({ type: "SET_REST", isResting: false });
  };

  return (
    <main
      ref={world}
      className={`little-world relative isolate overflow-hidden ${moving ? "is-moving" : ""} ${!visible ? "is-paused" : ""} ${playtimeRatio >= 0.8 && !journey.isResting ? "time-near-limit" : ""}`}
      data-phase={journey.phase}
      data-passengers={journey.passengersCount}
      data-landscape={landscape}
      data-journeys={journey.journeys}
      data-initial-weather={initialConditions.weather}
      data-initial-hour={initialConditions.hour.toFixed(4)}
      data-initial-moon-phase={(initialConditions.moonPhase ?? 0).toFixed(4)}
      data-driver={driverIsOutside(journey) ? "outside" : "cab"}
      aria-label={`${productName}. Spokojna zabawa sterowana klawiszem Enter lub przyciskiem na ekranie.`}
    >
      {/* Screen Reader Live Region for Accessibility */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {journeyAriaAnnouncement(journey)}
      </div>

      <ParentValueStrip onOpenParentMenu={() => setParentModalOpen(true)} />

      <header className="site-header flex items-center justify-between">
        {/* The hero heading carries the name, so the mark stays wordless here. */}
        <SunMark
          productName={productName}
          onLongPressTrigger={() => setParentModalOpen(true)}
        />
        <div className="flex items-center gap-4">
          <div className="quiet-note flex items-center gap-2">
            {configuredLimitMs > 0 && (
              <span
                className="playtime-hourglass"
                role="img"
                aria-label="Rodzic ustawił limit aktywnego czasu zabawy"
                title="Czas zabawy ograniczony przez rodzica"
              >
                <svg
                  width="15"
                  height="18"
                  viewBox="0 0 16 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 1h10M3 19h10M4 2c0 4 1 5 4 8-3 3-4 4-4 8m8-16c0 4-1 5-4 8 3 3 4 4 4 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5.5 4h5M5.5 16h5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            )}
            <QuietMark />
            <span className="text-xs">Zawsze bez dźwięku</span>
          </div>
          <button
            type="button"
            onClick={() => setParentModalOpen(true)}
            className="parent-gear-btn"
            aria-label="Ustawienia dla rodzica"
            title="Ustawienia dla rodzica"
          >
            ⚙
          </button>
        </div>
      </header>

      <section
        className="introduction text-center"
        aria-labelledby="page-title"
      >
        <div
          className="intro-flourish flex items-center justify-center gap-3"
          aria-hidden="true"
        >
          <span />
          <svg width="27" height="17" viewBox="0 0 27 17" fill="none">
            <path
              d="M13.5 15V4M13.5 11C6 12 4 8 4 4c6 0 9 3 9.5 7ZM13.5 8C19 9 23 5 23 1c-6 0-9 3-9.5 7Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
          <span />
        </div>
        <h1 id="page-title">
          Mały pociąg <em>{childName}</em>
        </h1>
        <p className="intro-subtitle">
          Maszynista: <strong>{driverAnimal.name}</strong> · Stacja:{" "}
          <strong>{currentSt.name}</strong>
        </p>
      </section>

      <div className="landscape">
        <Illustration journey={journey} landscape={landscape} />
      </div>

      <section
        className={`journey-invitation text-center ${waiting ? "is-ready" : "is-travelling"}`}
        aria-label="Podróż"
      >
        <p className="journey-message">
          <span key={journeyMessage(journey)}>{journeyMessage(journey)}</span>
        </p>

        {teaser && waiting && (
          <p className="journey-teaser text-xs font-sans tracking-wide">
            {teaser}
          </p>
        )}

        <div className="keyboard-invitation flex items-center justify-center">
          <span className="invitation-prefix invitation-prefix--key">
            Naciśnij
          </span>
          <span className="invitation-prefix invitation-prefix--touch">
            Dotknij
          </span>
          <button
            type="button"
            className="enter-key flex items-center justify-center gap-4"
            aria-label={
              waiting
                ? "Enter. Ruszamy w drogę!"
                : "Pociąg w drodze. Przycisk chwilowo nieaktywny."
            }
            aria-disabled={!waiting}
            onClick={onKeyTap}
            onPointerUp={onKeyRelease}
            onContextMenu={(event) => event.preventDefault()}
          >
            Enter
            <svg
              width="21"
              height="18"
              viewBox="0 0 24 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 3v9H4m0 0 5-5m-5 5 5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="invitation-suffix">i ruszajmy w drogę</span>
        </div>

        <p className="patient-note">
          {waiting
            ? "Pociąg poczeka. Mamy czas."
            : "Teraz po prostu patrz. Pociąg sam zatrzyma się na stacji."}
        </p>
      </section>

      <footer className="page-footer flex items-center justify-between">
        <span className="footer-left">
          <span className="little-leaf" aria-hidden="true" />
          Małe chwile. Wielkie odkrycia.
        </span>
        <span className="footer-right">
          Z myślą o Arturze{" "}
          <span className="footer-heart" aria-hidden="true">
            ♡
          </span>
        </span>
      </footer>

      {/* Rest Screen Overlay */}
      {journey.isResting && (
        <RestScreen onOpenParent={() => setParentModalOpen(true)} />
      )}

      {/* Parent Modal & Gate */}
      <ParentModal
        isOpen={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onResetSession={handleResetSession}
        onTriggerRest={handleTriggerRest}
        isResting={journey.isResting}
        restReason={journey.restReason}
        onContinueAfterRest={handleDismissRest}
        settings={journey.settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </main>
  );
}
