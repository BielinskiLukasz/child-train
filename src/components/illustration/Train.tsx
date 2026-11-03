import type { CSSProperties } from "react";
import type { AnimalKind, JourneyState } from "../../game";
import { Animal } from "./Animal";

/**
 * How each carriage reacts to the sky. The first friend grows drowsy after
 * dark, the second presses closer to the glass in snow and fog, and the third
 * simply enjoys the ride. Driven purely by CSS from `data-time-of-day` and
 * `data-weather`, so it follows the atmosphere without any extra state.
 */
const PASSENGER_MOODS = ["dozer", "watcher", "rider"] as const;

function Wheel({
  x,
  y,
  radius = 25,
}: {
  x: number;
  y: number;
  radius?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="wheel-spin">
        <circle r={radius} fill="#3f5b4c" />
        <circle r={radius - 5} fill="#d8d2ae" />
        <circle r={radius - 10} fill="#71806a" />
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M0 0V-${radius - 6}`}
            transform={`rotate(${i * 45})`}
            stroke="#ded6b4"
            strokeWidth="3.5"
          />
        ))}
        <circle r="7" fill="#3f5b4c" />
        <circle r="3" fill="#c4bb95" />
      </g>
    </g>
  );
}

export function Carriage({
  index,
  journey,
}: {
  index: number;
  journey: JourneyState;
}) {
  const x = 766 + index * 226;
  const colors = [
    { body: "#dfbc70", shade: "#c5a45e", roof: "#5b7460" },
    { body: "#a5bbae", shade: "#829f8d", roof: "#526d5d" },
    { body: "#d4a38c", shade: "#b98672", roof: "#65765d" },
  ][index];

  const onboard = index < journey.passengersCount;
  const justBoarded =
    journey.phase === "boarding" && index === journey.passengersCount - 1;
  const passengerKind = journey.plan.passengers[index] ?? "rabbit";

  return (
    <g transform={`translate(${x} 0)`}>
      <defs>
        <clipPath id={`carriage-window-${index}`}>
          <rect x="23" y="354" width="154" height="81" rx="9" />
        </clipPath>
      </defs>
      <path
        d="M-17 465H9m183 0h35"
        stroke="#66705b"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="0" y="346" width="200" height="124" rx="9" fill={colors.body} />
      <path d="M0 351h200v11H0Z" fill="#f9f0d3" opacity=".32" />
      <rect x="21" y="356" width="158" height="79" rx="10" fill="#e4e6ce" />
      <rect x="26" y="361" width="148" height="69" rx="6" fill="#c8d7c5" />
      <path d="M30 423q48-32 87-14t57-1v23H30Z" fill="#b1c6ac" opacity=".8" />
      <g clipPath={`url(#carriage-window-${index})`}>
        {onboard && (
          <g transform="translate(78 397) scale(.71)">
            <g
              className={`passenger ${justBoarded ? "passenger--boarding" : ""} ${journey.phase === "unboarding" ? "passenger--leaving" : ""}`}
              style={
                {
                  "--passenger-delay": `${index * 0.28 * journey.settings.pace}s`,
                  "--disembark-duration": `${0.9 * journey.settings.pace}s`,
                } as CSSProperties
              }
            >
              {/* Nested so the mood transform never fights the boarding one.
                  Each carriage has its own way of noticing the weather. */}
              <g
                className={`passenger-mood passenger-mood--${PASSENGER_MOODS[index]}`}
              >
                <Animal kind={passengerKind} />
              </g>
            </g>
          </g>
        )}
        <path d="M157 360v71" stroke="#e7e7cb" strokeWidth="3" opacity=".7" />
      </g>
      <path d="M118 356v78" stroke={colors.body} strokeWidth="8" />
      <rect
        x="21"
        y="356"
        width="158"
        height="79"
        rx="10"
        fill="none"
        stroke={colors.shade}
        strokeWidth="2"
      />
      <path
        d="M10 444h180M10 451h180"
        stroke={colors.shade}
        strokeWidth="1"
        opacity=".65"
      />
      {[27, 59, 91, 123, 155, 183].map((px) => (
        <path
          key={px}
          d={`M${px} 446v17`}
          stroke={colors.shade}
          strokeWidth="1"
          opacity=".45"
        />
      ))}
      <path
        d="M8 466h184"
        stroke={colors.shade}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <rect
        x="-10"
        y="331"
        width="220"
        height="23"
        rx="11"
        fill={colors.roof}
      />
      <path
        d="M-1 338h201"
        stroke="#e3e2c8"
        strokeWidth="2"
        opacity=".28"
        strokeLinecap="round"
      />
      <Wheel x={43} y={481} radius={25} />
      <Wheel x={158} y={481} radius={25} />
      <path
        d="M30 448h13m128 0h8"
        stroke="#f4e6c2"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity=".7"
      />
    </g>
  );
}

export function Locomotive({
  driver,
  driverOutside = false,
}: {
  driver: AnimalKind;
  driverOutside?: boolean;
}) {
  return (
    <g className="locomotive">
      <g className="steam" fill="#fffcf3">
        <g className="steam-puff steam-puff--one">
          <circle cx="506" cy="294" r="16" />
          <circle cx="490" cy="286" r="13" />
          <circle cx="519" cy="281" r="13" />
        </g>
        <g className="steam-puff steam-puff--two">
          <circle cx="484" cy="254" r="23" />
          <circle cx="463" cy="247" r="18" />
          <circle cx="498" cy="240" r="18" />
        </g>
        <g className="steam-puff steam-puff--three">
          <circle cx="451" cy="207" r="27" />
          <circle cx="426" cy="200" r="20" />
          <circle cx="469" cy="188" r="23" />
        </g>
      </g>
      <path
        d="M731 463h40"
        stroke="#67745b"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="m450 447-25 36h58v-36Z" fill="#7b8870" />
      <path
        d="m440 461-10 16m20-16-8 16m18-16-7 16"
        stroke="#c5c6a2"
        strokeWidth="2"
      />
      <rect x="453" y="378" width="190" height="74" rx="29" fill="#b96f52" />
      <path d="M479 383h132q15 0 24 14H469q3-9 10-14Z" fill="#cc8d68" />
      <rect x="453" y="392" width="20" height="52" rx="7" fill="#4b6755" />
      <path d="M474 413h160" stroke="#e4b584" strokeWidth="4" />
      <path d="M482 422h147" stroke="#a86049" strokeWidth="2" />
      <path d="M491 379v-61h30v61" fill="#4e6754" />
      <path d="m489 324-8-16h50l-8 16Z" fill="#4a6251" />
      <path d="M491 322h30" stroke="#d2ac70" strokeWidth="4" />
      <path d="M563 382v-14q0-18 18-18t18 18v14" fill="#bb7856" />
      <path d="M562 373h38" stroke="#d8a773" strokeWidth="3" />
      <rect x="626" y="333" width="111" height="119" rx="7" fill="#ba7457" />
      <path d="M634 341h94v104h-94Z" fill="#c48260" />
      <rect x="646" y="346" width="66" height="77" rx="11" fill="#3e5b4d" />
      <rect x="651" y="350" width="56" height="68" rx="8" fill="#d4dec8" />
      <defs>
        <clipPath id="driver-window">
          <rect x="650" y="349" width="58" height="71" rx="8" />
        </clipPath>
      </defs>
      <g clipPath="url(#driver-window)">
        {/* Opacity only here: a CSS transform would replace the attribute transform. */}
        <g
          className={`cab-driver ${driverOutside ? "is-out" : ""}`}
          transform="translate(680 388) scale(.65)"
        >
          <Animal kind={driver} conductor waving={false} />
        </g>
      </g>
      <path
        d="M642 425h76"
        stroke="#dfa77a"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M618 328q58-13 124 0l8 10H613Z" fill="#405e4e" />
      <path
        d="M624 328q54-9 112 0"
        stroke="#80917a"
        strokeWidth="2"
        fill="none"
      />
      <rect x="452" y="447" width="291" height="22" rx="6" fill="#405d4b" />
      <path d="M459 450h274" stroke="#b9b58d" strokeWidth="3" />
      <rect x="438" y="430" width="20" height="12" rx="5" fill="#536c56" />
      <circle cx="450" cy="399" r="9" fill="#f5d49a" />
      <circle cx="450" cy="399" r="5" fill="#fff0c3" />
      <ellipse cx="550" cy="435" rx="17" ry="9" fill="#eed9ac" />
      <text
        x="550"
        y="439"
        textAnchor="middle"
        fill="#7b654d"
        fontFamily="Fraunces, serif"
        fontSize="13"
      >
        A
      </text>
      <Wheel x={494} y={479} radius={27} />
      <Wheel x={580} y={473} radius={34} />
      <Wheel x={689} y={476} radius={30} />
      <path
        className="piston"
        d="M493 478h197"
        stroke="#bdba95"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        className="piston"
        d="M493 477h197"
        stroke="#e1d6ad"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="494" cy="478" r="4" fill="#596952" />
      <circle cx="580" cy="478" r="4" fill="#596952" />
      <circle cx="689" cy="478" r="4" fill="#596952" />
      <path
        d="M725 448v27h25"
        stroke="#536950"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}
