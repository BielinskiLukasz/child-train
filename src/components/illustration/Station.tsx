import {
  ALL_LOCATIONS,
  leavingDriver,
  waitingDriver,
  type JourneyState,
} from "../../game";
import { Animal } from "./Animal";

export function Station({ journey }: { journey: JourneyState }) {
  const { phase, stop } = journey;
  const waitingDriverKind = waitingDriver(journey);
  // The incoming driver is on the platform whenever the train is home and not
  // pulling out — including while it is still arriving.
  const incomingIsWaiting = stop === 0 && phase !== "departing";
  if (phase === "travelling" || phase === "touring") return null;

  const arriving = phase === "arriving" || phase === "returning";
  const departing = phase === "departing";

  const roofColors = ["#ad8065", "#7a9475", "#bc8b69", "#8e8470"];
  const wallColors = ["#e9d6b0", "#d8d7b5", "#e8cf9e", "#cbb995"];

  const roof = roofColors[stop % roofColors.length];
  const walls = wallColors[stop % wallColors.length];
  const stopInfo = journey.plan.stops[stop] ?? ALL_LOCATIONS.home;
  const waitingPassenger = stop > 0 ? journey.plan.passengers[stop - 1] : null;

  return (
    <g
      key={`${stop}-${departing ? "depart" : "current"}`}
      className={`station ${arriving ? "station--arriving" : ""} ${departing ? "station--departing" : ""}`}
    >
      <ellipse
        cx="275"
        cy="479"
        rx="190"
        ry="10"
        fill="#8d9c77"
        opacity=".15"
      />
      <rect x="120" y="466" width="311" height="14" rx="4" fill="#b9b79a" />
      <path d="M124 467h303" stroke="#e3ddba" strokeWidth="3" />
      <rect x="181" y="328" width="173" height="138" rx="3" fill={walls} />
      {Array.from({ length: 10 }, (_, i) => (
        <path
          key={i}
          d={`M${190 + i * 17} 337v125`}
          stroke="#baa883"
          strokeWidth="1"
          opacity=".3"
        />
      ))}
      <path d="M160 337 258 263q10-8 20 0l99 74Z" fill={roof} />
      <path
        d="m169 337 96-66q4-3 8 0l94 66"
        stroke="#f0dfb9"
        strokeWidth="3"
        fill="none"
        opacity=".55"
      />
      <path
        d="M162 337h212"
        stroke="#856e52"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M244 467v-66q0-22 22-22t22 22v66" fill="#859481" />
      <path d="M250 460v-58q0-17 16-17t16 17v58" fill="#718574" />
      <path d="M253 409v-8q0-14 13-14t13 14v8Z" fill="#d3d8b8" />
      <path d="M266 387v22m-14-9h28" stroke="#83917a" strokeWidth="2" />
      <circle cx="278" cy="435" r="2.5" fill="#dec78e" />
      {[207, 325].map((x) => (
        <g key={x}>
          <rect
            x={x - 15}
            y="379"
            width="31"
            height="40"
            rx="3"
            fill="#859481"
          />
          <rect
            x={x - 11}
            y="383"
            width="23"
            height="32"
            rx="1"
            fill="var(--window, #e5dfb4)"
          />
          <path d={`M${x} 383v32m-11-16h23`} stroke="#97a08a" strokeWidth="2" />
          <path
            d={`M${x - 19} 423h39`}
            stroke="#a99e77"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ))}
      <rect x="188" y="344" width="159" height="27" rx="4" fill="#607663" />
      <path
        d="M193 348h149v19H193Z"
        stroke="#b7c19b"
        strokeWidth=".8"
        fill="none"
        opacity=".65"
      />
      <text
        x="267.5"
        y="362"
        textAnchor="middle"
        fill="#f4edd5"
        fontFamily="DM Sans, sans-serif"
        fontSize="11.5"
        fontWeight="500"
        letterSpacing="1.1"
      >
        {stopInfo.name.toLocaleUpperCase("pl")}
      </text>
      <circle
        cx="267"
        cy="310"
        r="15"
        fill="#f4ebcf"
        stroke="#b39870"
        strokeWidth="2"
      />
      <circle
        cx="267"
        cy="310"
        r="11.5"
        fill="none"
        stroke="#d6c8a6"
        strokeWidth=".7"
      />
      {/* Hands follow the simulated hour (--day-hour), so the station clock
          always agrees with the sky. Nested groups keep the CSS rotation from
          replacing the SVG placement. */}
      <g className="clock-hand clock-hand--hour">
        <path
          d="M267 310v-8"
          stroke="#6d795f"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
      <g className="clock-hand clock-hand--minute">
        <path
          d="M267 310v-10.5"
          stroke="#6d795f"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
      <circle cx="267" cy="310" r="1.7" fill="#6d795f" />
      <path d="M143 464V345" stroke="#61705a" strokeWidth="5" />
      <path
        d="M135 343h17l-2-26h-13Z"
        fill="#e7d8ac"
        stroke="#61705a"
        strokeWidth="2.5"
      />
      <path d="m133 316 10-9 11 9Z" fill="#61705a" />
      <path
        d="M365 445h53m-48-12v28m42-28v28m-43-24h45"
        stroke="#8d8c68"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M157 467h17l3-24h-23Z" fill="#bd9370" />
      <path
        d="M165 446v-25m0 15q-17-1-14-12 14-1 14 12m0-7q12-1 12-11-11-1-12 11"
        fill="#8d9f78"
        stroke="#7e936a"
        strokeWidth="1.5"
      />
      {/* The incoming driver is already waiting here while the train pulls in,
          and only steps up into the cab on Enter. The outgoing driver is drawn
          separately, in front of the locomotive, by <LeavingDriver>. */}
      {stop === 0 && (
        <g transform="translate(398 424) scale(.5)">
          <g
            className={`platform-driver ${incomingIsWaiting ? "is-waiting" : ""}`}
          >
            <Animal kind={waitingDriverKind} conductor />
          </g>
        </g>
      )}
      {waitingPassenger && (phase === "arriving" || phase === "boarding") && (
        <g transform="translate(402 422) scale(.48)">
          <g
            className={
              phase === "boarding"
                ? "platform-friend platform-friend--boarding"
                : "platform-friend"
            }
          >
            {/* Waiting friends look eager; the wide eyes read as excitement. */}
            <Animal kind={waitingPassenger} mood="curious" />
          </g>
        </g>
      )}
      <g transform="translate(316 280)">
        <path d="M-8 2q2-12 12-9 8 1 6 10l8 3-10 1q-9 9-16-5Z" fill="#6f8b76" />
        <path d="m-7 1-8-3 5 7" fill="#6f8b76" />
        <circle cx="7" cy="-2" r="1.1" fill="#f6ebcd" />
      </g>
    </g>
  );
}

/**
 * The driver whose trip has just ended, stepping down out of the cab and
 * walking off towards the station. Rendered by `Illustration` **after** the
 * train, because `Station` is painted behind the locomotive and a figure at cab
 * height would otherwise be hidden by it.
 */
export function LeavingDriver({ journey }: { journey: JourneyState }) {
  const kind = leavingDriver(journey);
  if (!kind) return null;
  return (
    <g transform="translate(560 424) scale(.5)">
      <g className="leaving-driver">
        <Animal kind={kind} conductor />
      </g>
    </g>
  );
}
