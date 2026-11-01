import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import {
  ALL_ANIMALS,
  ALL_LOCATIONS,
  ANIMAL_KEYS,
  DESTINATION_LOCATIONS,
  PACE_PRESETS,
  defaultPlanner,
  type AnimalKind,
  normalizeChildName,
  type JourneyPlanner,
  type JourneySettings,
  type JourneyState,
  type Landscape,
  type PlannedPick,
} from "../game";
import { useModalFocus } from "../hooks/useModalFocus";

function makeParentQuestion() {
  const first = 2 + Math.floor(Math.random() * 8);
  const second = 1 + Math.floor(Math.random() * 8);
  return { first, second, answer: first + second };
}

export function ParentModal({
  isOpen,
  onClose,
  onResetSession,
  onTriggerRest,
  isResting,
  restReason,
  onContinueAfterRest,
  settings,
  onUpdateSettings,
}: {
  isOpen: boolean;
  onClose: () => void;
  onResetSession: () => void;
  onTriggerRest: () => void;
  isResting: boolean;
  restReason: JourneyState["restReason"];
  onContinueAfterRest: () => void;
  settings: JourneySettings;
  onUpdateSettings: (settings: Partial<JourneySettings>) => void;
}) {
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [gateAnswer, setGateAnswer] = useState("");
  const [gateError, setGateError] = useState(false);
  const [question, setQuestion] = useState(makeParentQuestion);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleVerifyGate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (Number(gateAnswer) === question.answer) {
      setGateUnlocked(true);
      setGateError(false);
    } else {
      setGateError(true);
    }
  };

  const handleClose = () => {
    setGateUnlocked(false);
    setGateAnswer("");
    setGateError(false);
    setQuestion(makeParentQuestion());
    onClose();
  };

  useModalFocus(
    dialogRef,
    isOpen,
    gateUnlocked ? ".parent-done-btn" : ".parent-gate-input",
    handleClose,
  );

  useLayoutEffect(() => {
    if (!isOpen || !gateUnlocked) return;
    dialogRef.current
      ?.querySelector<HTMLElement>(".parent-done-btn")
      ?.focus({ preventScroll: true });
  }, [gateUnlocked, isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="parent-modal-backdrop"
      aria-modal="true"
      aria-labelledby="parent-modal-title"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="parent-modal-card">
        <div className="parent-modal-header flex items-center justify-between">
          <h2 id="parent-modal-title" className="parent-modal-heading">
            Strefa Rodzica
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="parent-modal-close"
            aria-label="Zamknij panel rodzica"
          >
            ✕
          </button>
        </div>

        {!gateUnlocked ? (
          <form onSubmit={handleVerifyGate} className="parent-gate-form">
            <p className="parent-gate-desc">
              Zabezpieczenie przed przypadkowym dotknięciem przez dziecko.
              Rozwiąż proste zadanie:
            </p>
            <div className="parent-gate-challenge flex items-center justify-center gap-3">
              <span>
                {question.first} + {question.second} =
              </span>
              <input
                type="number"
                value={gateAnswer}
                onChange={(e) => setGateAnswer(e.target.value)}
                className="parent-gate-input"
                placeholder="?"
                aria-label="Wynik dodawania"
              />
              <button type="submit" className="parent-gate-submit">
                Odblokuj
              </button>
            </div>
            {gateError && (
              <p className="parent-gate-error">
                Wynik się nie zgadza. Spróbuj ponownie.
              </p>
            )}
          </form>
        ) : (
          <div className="parent-settings-content space-y-5">
            <PlannerSection
              planner={settings.planner}
              onPlannerChange={(planner) => onUpdateSettings({ planner })}
            />
            <section className="parent-section">
              <h3 className="parent-section-title">Imię dziecka</h3>
              <label className="parent-label" htmlFor="child-name">
                Imię w dopełniaczu — tak będzie brzmieć tytuł i nazwa stacji:
              </label>
              <input
                id="child-name"
                type="text"
                autoComplete="off"
                maxLength={32}
                value={settings.childName}
                onChange={(event) =>
                  onUpdateSettings({
                    childName: normalizeChildName(event.target.value),
                  })
                }
                className="parent-select"
                aria-describedby="child-name-hint"
              />
              <p id="child-name-hint" className="parent-label mt-2">
                Na przykład: „Mai”, „Artura”. Domyślnie: „dziecka”.
              </p>
            </section>
            <section className="parent-section">
              <h3 className="parent-section-title">Szybkie działania</h3>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onResetSession();
                    handleClose();
                  }}
                  className="parent-action-btn"
                >
                  Nowa podróż (nowe zwierzątka i stacje)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTriggerRest();
                    handleClose();
                  }}
                  className="parent-action-btn"
                >
                  Pora na odpoczynek (ekran snu)
                </button>
                {isResting && (
                  <button
                    type="button"
                    onClick={() => {
                      onContinueAfterRest();
                      handleClose();
                    }}
                    className="parent-action-btn"
                  >
                    {restReason === "playtime"
                      ? `Wznów na kolejne ${settings.playtimeLimitMinutes} min`
                      : "Wznów podróż"}
                  </button>
                )}
              </div>
            </section>

            <section className="parent-section">
              <h3 className="parent-section-title">Limit czasu zabawy</h3>
              <label className="parent-label" htmlFor="playtime-limit">
                Aktywny czas tej karty:
              </label>
              <select
                id="playtime-limit"
                value={settings.playtimeLimitMinutes}
                onChange={(e) =>
                  onUpdateSettings({
                    playtimeLimitMinutes: Number(e.target.value),
                  })
                }
                className="parent-select"
              >
                <option value={1}>1 minuta</option>
                <option value={5}>5 minut</option>
                <option value={10}>10 minut</option>
                <option value={20}>20 minut (domyślnie)</option>
                <option value={30}>30 minut</option>
                <option value={0}>Bez limitu</option>
              </select>
              <p className="parent-label mt-2">
                Czas liczy się, gdy ta karta jest widoczna. Postój pociągu
                również wlicza się do czasu zabawy.
              </p>
            </section>

            <section className="parent-section">
              <h3 className="parent-section-title">Tempo podróży</h3>
              <label className="parent-label" htmlFor="pace">
                Jak szybko jedzie pociąg:
              </label>
              <select
                id="pace"
                value={settings.pace}
                onChange={(e) =>
                  onUpdateSettings({ pace: Number(e.target.value) })
                }
                className="parent-select"
              >
                {PACE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <p className="parent-label mt-2">
                Zmiana działa od razu i obejmuje całą podróż: przejazdy,
                wsiadanie i krajobrazy. Pociąg nadal czeka na stacji tak długo,
                jak trzeba.
              </p>
            </section>

            <section className="parent-section">
              <h3 className="parent-section-title">Pogoda i pora dnia</h3>
              <div className="parent-override-grid">
                <div>
                  <label className="parent-label" htmlFor="time-override">
                    Pora dnia:
                  </label>
                  <select
                    id="time-override"
                    value={settings.timeOverride}
                    onChange={(e) =>
                      onUpdateSettings({
                        timeOverride: e.target
                          .value as JourneySettings["timeOverride"],
                      })
                    }
                    className="parent-select"
                  >
                    <option value="auto">Zmienna (w rytmie podróży)</option>
                    <option value="day">Zawsze dzień</option>
                    <option value="night">Zawsze noc</option>
                    <option value="dawn">Zawsze świt</option>
                    <option value="dusk">Zawsze zachód słońca</option>
                  </select>
                </div>
                <div>
                  <label className="parent-label" htmlFor="weather-override">
                    Pogoda:
                  </label>
                  <select
                    id="weather-override"
                    value={settings.weatherOverride}
                    onChange={(e) =>
                      onUpdateSettings({
                        weatherOverride: e.target
                          .value as JourneySettings["weatherOverride"],
                      })
                    }
                    className="parent-select"
                  >
                    <option value="auto">Zmienna (w rytmie podróży)</option>
                    <option value="clear">Czyste niebo</option>
                    <option value="rain">Spokojny deszcz</option>
                    <option value="snow">Cichy śnieg</option>
                    <option value="fog">Lekka mgła</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="parent-section">
              <h3 className="parent-section-title">Odpoczynek po rundach</h3>
              <label className="parent-label" htmlFor="rounds-rest">
                Pokaż ekran wyciszenia po:
              </label>
              <select
                id="rounds-rest"
                value={settings.roundsBeforeRest}
                onChange={(e) =>
                  onUpdateSettings({
                    roundsBeforeRest: parseInt(e.target.value, 10),
                  })
                }
                className="parent-select"
              >
                <option value={2}>Po 2 pełnych podróżach</option>
                <option value={4}>Po 4 pełnych podróżach (domyślnie)</option>
                <option value={6}>Po 6 pełnych podróżach</option>
                <option value={0}>Bez automatycznego odpoczynku</option>
              </select>
            </section>

            <section className="parent-trust-box">
              <h4 className="parent-trust-heading">
                O Małym pociągu {normalizeChildName(settings.childName)}
              </h4>
              <p className="parent-trust-desc">
                Aplikacja została zaprojektowana dla małych dzieci z myślą o
                wyciszeniu i łagodnej stymulacji. Działa całkowicie lokalnie w
                pamięci urządzenia: brak połączeń sieciowych, brak reklam, brak
                zbierania danych i zero dźwięków.
              </p>
            </section>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="parent-done-btn"
              >
                Wróć do zabawy
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

/**
 * Lets a parent choose, for the NEXT journey, which animal drives and rides
 * each carriage and which three stations the train visits. "random" leaves a
 * slot to chance; values already chosen in another slot are offered disabled so
 * the same friend or stop can never be booked twice.
 */
function PlannerSection({
  planner,
  onPlannerChange,
}: {
  planner: JourneyPlanner;
  onPlannerChange: (planner: JourneyPlanner) => void;
}) {
  const setDriver = (value: PlannedPick<AnimalKind>) =>
    onPlannerChange({ ...planner, driver: value });
  const setPassenger = (index: 0 | 1 | 2, value: PlannedPick<AnimalKind>) => {
    const passengers = [...planner.passengers] as typeof planner.passengers;
    passengers[index] = value;
    onPlannerChange({ ...planner, passengers });
  };
  const setStation = (index: 0 | 1 | 2, value: PlannedPick<Landscape>) => {
    const stations = [...planner.stations] as typeof planner.stations;
    stations[index] = value;
    onPlannerChange({ ...planner, stations });
  };

  // A value is "taken" when some OTHER slot already uses it.
  const animalTakenBy =
    (selfIndex: number) => (value: PlannedPick<AnimalKind>) => {
      if (value === "random") return false;
      const slots = [planner.driver, ...planner.passengers];
      return slots.some((slot, i) => i !== selfIndex && slot === value);
    };
  const stationTakenBy =
    (selfIndex: number) => (value: PlannedPick<Landscape>) => {
      if (value === "random") return false;
      return planner.stations.some(
        (slot, i) => i !== selfIndex && slot === value,
      );
    };

  return (
    <section className="parent-section">
      <h3 className="parent-section-title">Plan podróży</h3>
      <p className="parent-label mb-2">
        Wybierz, kto poprowadzie pociąg i kto pojedzie, oraz do jakich trzech
        stacji zajedzie. Wybory zadziałają od kolejnej podróży (po powrocie do
        domu lub po „Nowa podróż”).
      </p>

      <label className="parent-label" htmlFor="planner-driver">
        Maszynista
      </label>
      <select
        id="planner-driver"
        className="parent-select"
        value={planner.driver}
        onChange={(e) => setDriver(e.target.value as PlannedPick<AnimalKind>)}
      >
        <option value="random">Losowo</option>
        {ANIMAL_KEYS.map((kind) => (
          <option key={kind} value={kind} disabled={animalTakenBy(0)(kind)}>
            {ALL_ANIMALS[kind].name}
          </option>
        ))}
      </select>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {planner.passengers.map((pick, index) => (
          <div key={index}>
            <label
              className="parent-label"
              htmlFor={`planner-passenger-${index}`}
            >
              Pasażer {index + 1}
            </label>
            <select
              id={`planner-passenger-${index}`}
              className="parent-select"
              value={pick}
              onChange={(e) =>
                setPassenger(
                  index as 0 | 1 | 2,
                  e.target.value as PlannedPick<AnimalKind>,
                )
              }
            >
              <option value="random">Losowo</option>
              {ANIMAL_KEYS.map((kind) => (
                <option
                  key={kind}
                  value={kind}
                  disabled={animalTakenBy(index + 1)(kind)}
                >
                  {ALL_ANIMALS[kind].name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {planner.stations.map((pick, index) => (
          <div key={index}>
            <label
              className="parent-label"
              htmlFor={`planner-station-${index}`}
            >
              Stacja {index + 1}
            </label>
            <select
              id={`planner-station-${index}`}
              className="parent-select"
              value={pick}
              onChange={(e) =>
                setStation(
                  index as 0 | 1 | 2,
                  e.target.value as PlannedPick<Landscape>,
                )
              }
            >
              <option value="random">Losowo</option>
              {DESTINATION_LOCATIONS.map((location) => (
                <option
                  key={location}
                  value={location}
                  disabled={stationTakenBy(index)(location)}
                >
                  {ALL_LOCATIONS[location].name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="parent-action-btn mt-3"
        onClick={() => onPlannerChange(defaultPlanner)}
      >
        Wszystko losowo
      </button>
    </section>
  );
}
