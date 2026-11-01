import { memo, useEffect, useRef, useState } from "react";
import {
  ALL_ANIMALS,
  ALL_LOCATIONS,
  driverIsOutside,
  type JourneyState,
  type Landscape,
} from "../../game";
import { CelestialSky, WeatherEffects } from "../Atmosphere";
import { Cloud, Pine, Scenery, Tree } from "./Scenery";
import { Carriage, Locomotive } from "./Train";
import { LeavingDriver, Station } from "./Station";
import { MeadowDetails } from "./Meadow";

/**
 * Memoised because the playtime counter ticks once a second while the train is
 * parked. Without this, every tick would rebuild the whole SVG scene even
 * though nothing in it changed. Both props are stable between ticks, and the
 * atmosphere is painted through CSS variables rather than React, so the sky
 * keeps moving while the scene is skipped.
 */
export const Illustration = memo(function Illustration({
  journey,
  landscape,
}: {
  journey: JourneyState;
  landscape: Landscape;
}) {
  const currentSt = journey.plan.stops[journey.stop] ?? ALL_LOCATIONS.home;
  const driverAnimal = ALL_ANIMALS[journey.plan.driver];
  const previousLandscape = useRef(landscape);
  const [leavingLandscape, setLeavingLandscape] = useState<Landscape | null>(
    null,
  );

  useEffect(() => {
    if (previousLandscape.current === landscape) return;
    const oldLandscape = previousLandscape.current;
    previousLandscape.current = landscape;
    setLeavingLandscape(oldLandscape);
    const timeout = window.setTimeout(() => setLeavingLandscape(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [landscape]);

  return (
    <svg
      className="world-illustration"
      viewBox="0 0 1600 640"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-labelledby="scene-title scene-description sky-description"
    >
      <title id="scene-title">{`Mały pociąg Artura: ${currentSt.name}. Maszynista: ${driverAnimal.name}`}</title>
      <desc id="scene-description">
        Pastelowa lokomotywa prowadzona przez maszynistę {driverAnimal.name} i
        trzy kolorowe wagoniki. W podróży towarzyszą przyjaciele zwierzątka.
      </desc>
      <desc id="sky-description">
        Pogoda i pora dnia otulają spokojną podróż.
      </desc>
      <defs>
        <linearGradient id="ground-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d1d5b4" />
          <stop offset=".55" stopColor="#e5e5cd" />
          <stop offset="1" stopColor="var(--ground, #f6f3e8)" />
        </linearGradient>
        <clipPath id="scenery-clip">
          <path d="M-2000-800H3600V510H-2000Z" />
        </clipPath>
      </defs>
      <CelestialSky />
      <Cloud x={95} y={101} scale={0.95} delay="-8s" />
      <Cloud x={1019} y={79} scale={0.88} delay="-23s" />
      <Cloud x={1456} y={197} scale={0.72} delay="-14s" />
      <g clipPath="url(#scenery-clip)">
        {leavingLandscape && (
          <Scenery
            key={`leaving-${leavingLandscape}`}
            landscape={leavingLandscape}
            active={false}
            leaving
          />
        )}
        <Scenery key={`active-${landscape}`} landscape={landscape} active />
      </g>
      <path
        d="M-100 430c268-51 403-12 676-14s440-47 683-13 309 22 441-5v242H-100Z"
        fill="url(#ground-fade)"
      />
      <path
        d="M-100 469q222-35 449-11t470-8 881 10"
        stroke="#b8c3a0"
        strokeWidth="1.2"
        fill="none"
        opacity=".5"
      />
      <g className="parallax-trees">
        {[-1600, 0, 1600].map((offset) => (
          <g key={offset} transform={`translate(${offset} 0)`}>
            <Tree x={37} y={459} scale={0.96} color="#94aa83" />
            <Tree x={-31} y={471} scale={1.08} color="#7d9b77" variant={1} />
            <Pine x={1498} y={462} scale={1.11} color="#688a70" />
            <Pine x={1569} y={468} scale={1.42} color="#557c66" />
            <Pine x={1432} y={458} scale={0.73} color="#8ba27d" />
          </g>
        ))}
      </g>
      <Station journey={journey} />
      <g className="railway">
        <path
          d="M-20 508H1620"
          stroke="#bab49a"
          strokeWidth="20"
          opacity=".42"
        />
        <g className="rail-sleepers">
          {Array.from({ length: 44 }, (_, i) => (
            <path
              key={i}
              d={`M${i * 40 - 70} 501l13 17`}
              stroke="#a09b80"
              strokeWidth="8"
              strokeLinecap="round"
            />
          ))}
        </g>
        <path d="M-20 503H1620" stroke="#8e9680" strokeWidth="5" />
        <path d="M-20 501H1620" stroke="#d8d3b6" strokeWidth="2" />
        <path d="M-20 514H1620" stroke="#89937d" strokeWidth="4" />
        <path d="M-20 512H1620" stroke="#e4dfc5" strokeWidth="1.5" />
      </g>
      <ellipse cx="932" cy="505" rx="510" ry="9" fill="#53684d" opacity=".1" />
      <g className="train">
        {[2, 1, 0].map((index) => (
          <Carriage key={index} index={index} journey={journey} />
        ))}
        <Locomotive
          driver={journey.plan.driver}
          driverOutside={driverIsOutside(journey)}
        />
      </g>
      {/* In front of the locomotive, so the driver stepping down is not hidden
          by the boiler. The incoming driver on the platform is drawn by
          `Station`, behind the train, which is correct for a distant figure. */}
      <LeavingDriver journey={journey} />
      <MeadowDetails />
      <WeatherEffects />
      <path
        d="M-100 601q399-21 856 2t944-8v45H-100Z"
        fill="var(--ground, #f6f3e8)"
        opacity=".6"
      />
    </svg>
  );
});
