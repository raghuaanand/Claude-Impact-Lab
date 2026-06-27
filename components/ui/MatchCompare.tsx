import { Card } from "./Card";
import { Badge } from "./Badge";

type PersonSide = {
  caseRef: string;
  personName: string | null;
  ageBand: string | null;
  gender: string | null;
  physicalDescription: string | null;
  lastSeenText: string | null;
  zoneName: string | null;
  imageUrl?: string | null;
};

type MatchCompareProps = {
  missing: PersonSide;
  found: PersonSide;
  score: number;
};

function PersonPanel({ person, label }: { person: PersonSide; label: string }) {
  return (
    <Card className="flex-1 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-khummela-muted">
        {label}
      </p>
      <div className="mt-3 aspect-square overflow-hidden rounded-xl bg-khummela-surface">
        {person.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-semibold text-khummela-muted">
            {(person.personName?.[0] ?? "?").toUpperCase()}
          </div>
        )}
      </div>
      <p className="mt-3 font-semibold">{person.personName || "Unknown"}</p>
      <p className="font-mono text-xs text-khummela-muted">{person.caseRef}</p>
      <p className="mt-2 text-sm text-khummela-muted">
        {person.ageBand} · {person.gender}
      </p>
      {person.zoneName && <p className="text-sm text-khummela-accent">{person.zoneName}</p>}
      {person.physicalDescription && (
        <p className="mt-2 text-sm leading-relaxed">{person.physicalDescription}</p>
      )}
      {person.lastSeenText && (
        <p className="mt-1 text-xs text-khummela-muted">Last seen: {person.lastSeenText}</p>
      )}
    </Card>
  );
}

export function MatchCompare({ missing, found, score }: MatchCompareProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-khummela-text">Match review</h3>
        <Badge status="SUGGESTED" label={`${score}% confidence`} />
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <PersonPanel person={missing} label="Missing" />
        <PersonPanel person={found} label="Found" />
      </div>
    </div>
  );
}
