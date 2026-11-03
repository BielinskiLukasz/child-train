import { memo, type CSSProperties } from "react";
import { ALL_ANIMALS, type AnimalKind } from "../../game";
import { Animal } from "./Animal";

export const PlatformFarewell = memo(function PlatformFarewell({
  passengers,
  arriving,
  pace,
}: {
  passengers: readonly AnimalKind[];
  arriving: boolean;
  pace: number;
}) {
  if (passengers.length === 0) return null;

  return (
    <g
      className="platform-farewell"
      role="group"
      aria-label="Przyjaciele machają na pożegnanie"
    >
      {passengers.map((kind, index) => (
        <g
          key={kind}
          transform={`translate(${225 + index * 56} 432) scale(.43)`}
        >
          <g
            className={`platform-farewell-friend${arriving ? " platform-farewell-friend--arriving" : ""}`}
            data-animal={kind}
            style={
              {
                "--farewell-delay": `${(0.95 + index * 0.28) * pace}s`,
                "--farewell-duration": `${0.8 * pace}s`,
              } as CSSProperties
            }
          >
            <title>{ALL_ANIMALS[kind].name} macha z peronu</title>
            <Animal kind={kind} waving mood="cheerful" />
          </g>
        </g>
      ))}
    </g>
  );
});
