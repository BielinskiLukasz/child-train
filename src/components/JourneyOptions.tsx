import { useState } from "react";
import {
  ALL_ANIMALS,
  ALL_LOCATIONS,
  ANIMAL_KEYS,
  DESTINATION_LOCATIONS,
  MIN_ALLOWED_ANIMALS,
  MIN_ALLOWED_DESTINATIONS,
  type JourneySettings,
} from "../game";
import {
  JOURNEY_PRESETS,
  presetConflicts,
  presetSettings,
} from "../journeyPresets";

interface OptionsProps {
  settings: JourneySettings;
  onUpdateSettings: (patch: Partial<JourneySettings>) => void;
}

export function JourneyPresets({ settings, onUpdateSettings }: OptionsProps) {
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const preset = JOURNEY_PRESETS.find((item) => item.id === selected);
  const conflicts = preset ? presetConflicts(preset, settings) : [];

  return (
    <section className="parent-section" aria-labelledby="journey-presets-title">
      <h3 id="journey-presets-title" className="parent-section-title">
        Gotowe podróże
      </h3>
      <p className="parent-help">
        Gotowy plan, tempo i atmosfera. Imię dziecka, limity zabawy i dozwolone
        listy pozostają bez zmian.
      </p>
      <label className="parent-label" htmlFor="journey-preset">
        Wybierz zestaw
      </label>
      <select
        id="journey-preset"
        className="parent-select"
        value={selected}
        onChange={(event) => {
          setSelected(event.target.value);
          setNotice("");
        }}
        aria-describedby="journey-preset-description"
      >
        <option value="">Wybierz spokojną podróż...</option>
        {JOURNEY_PRESETS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <p id="journey-preset-description" className="parent-help">
        {preset?.description ??
          "Każdy zestaw jest dostępny offline. Żaden nie włącza wykluczonych zwierzątek ani miejsc."}
      </p>
      {conflicts.length > 0 && (
        <p className="parent-preset-conflict" role="status">
          Ten zestaw wymaga wykluczonych wyborów: {conflicts.join(", ")}. Zmień
          dozwolone listy albo wybierz inny zestaw.
        </p>
      )}
      <button
        type="button"
        className="parent-action-btn"
        disabled={!preset || conflicts.length > 0}
        onClick={() => {
          if (!preset) return;
          const patch = presetSettings(preset, settings);
          if (!patch) return;
          onUpdateSettings(patch);
          setNotice(
            `Wybrano: ${preset.name}. Plan jest gotowy na najbliższą nową rundę. „Nowa podróż” zaczyna ją od razu.`,
          );
        }}
      >
        Użyj zestawu
      </button>
      <p className="parent-help parent-preset-status" role="status">
        {notice}
      </p>
    </section>
  );
}

export function AllowedContentSettings({
  settings,
  onUpdateSettings,
}: OptionsProps) {
  const animalMinimum = settings.allowedAnimals.length <= MIN_ALLOWED_ANIMALS;
  const destinationMinimum =
    settings.allowedDestinations.length <= MIN_ALLOWED_DESTINATIONS;

  return (
    <details className="parent-section allowed-content-section">
      <summary className="parent-section-title">
        Dozwolone zwierzątka i miejsca
      </summary>
      <p className="parent-help">
        Wykluczone wybory nie pojawią się w nowych planach. Ręcznie przypisany,
        wykluczony wybór wróci do „Losowo”. Trwająca podróż pozostaje bez zmian.
      </p>
      <fieldset
        className="allowed-content-fieldset"
        aria-describedby="allowed-animals-hint"
      >
        <legend className="parent-label">Zwierzątka</legend>
        <p id="allowed-animals-hint" className="parent-help">
          Zostaw co najmniej 4: maszynistę i trzech różnych pasażerów.
        </p>
        <div className="allowed-content-grid">
          {ANIMAL_KEYS.map((kind) => {
            const checked = settings.allowedAnimals.includes(kind);
            return (
              <label key={kind} className="allowed-content-choice">
                <input
                  type="checkbox"
                  id={`allowed-animal-${kind}`}
                  checked={checked}
                  disabled={checked && animalMinimum}
                  onChange={() =>
                    onUpdateSettings({
                      allowedAnimals: checked
                        ? settings.allowedAnimals.filter(
                            (item) => item !== kind,
                          )
                        : [...settings.allowedAnimals, kind],
                    })
                  }
                />
                <span>{ALL_ANIMALS[kind].name}</span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          className="parent-action-btn"
          onClick={() => onUpdateSettings({ allowedAnimals: [...ANIMAL_KEYS] })}
        >
          Włącz wszystkie zwierzątka
        </button>
      </fieldset>
      <fieldset
        className="allowed-content-fieldset"
        aria-describedby="allowed-destinations-hint"
      >
        <legend className="parent-label">Miejsca</legend>
        <p id="allowed-destinations-hint" className="parent-help">
          Zostaw co najmniej 3 różne miejsca. Stacja początkowa zawsze zostaje.
        </p>
        <div className="allowed-content-grid">
          {DESTINATION_LOCATIONS.map((place) => {
            const checked = settings.allowedDestinations.includes(place);
            return (
              <label key={place} className="allowed-content-choice">
                <input
                  type="checkbox"
                  id={`allowed-destination-${place}`}
                  checked={checked}
                  disabled={checked && destinationMinimum}
                  onChange={() =>
                    onUpdateSettings({
                      allowedDestinations: checked
                        ? settings.allowedDestinations.filter(
                            (item) => item !== place,
                          )
                        : [...settings.allowedDestinations, place],
                    })
                  }
                />
                <span>{ALL_LOCATIONS[place].name}</span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          className="parent-action-btn"
          onClick={() =>
            onUpdateSettings({
              allowedDestinations: [...DESTINATION_LOCATIONS],
            })
          }
        >
          Włącz wszystkie miejsca
        </button>
      </fieldset>
    </details>
  );
}
