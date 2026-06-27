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
    <Card className="flex-1 p-5 border border-black/[0.03] bg-white">
      <p className="text-[10px] font-bold uppercase tracking-wider text-khummela-muted">
        {label}
      </p>
      <div className="mt-3 aspect-square overflow-hidden rounded-[20px] bg-black/[0.02] border border-black/[0.03]">
        {person.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl font-extrabold text-khummela-muted/40">
            {(person.personName?.[0] ?? "?").toUpperCase()}
          </div>
        )}
      </div>
      <div className="mt-4">
        <h4 className="text-lg font-bold tracking-tight text-khummela-text">{person.personName || "Unknown"}</h4>
        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-khummela-muted mt-0.5">{person.caseRef}</p>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-black/[0.03] pt-4 text-xs font-semibold text-khummela-muted">
        <div>
          <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">Age Band</span>
          <span className="text-khummela-text text-sm font-bold block mt-0.5">{person.ageBand || "—"}</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">Gender</span>
          <span className="text-khummela-text text-sm font-bold block mt-0.5">{person.gender || "—"}</span>
        </div>
      </div>

      {(person.zoneName || person.lastSeenText) && (
        <div className="mt-3 border-t border-black/[0.03] pt-3">
          <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">Last Seen</span>
          <p className="text-xs text-khummela-text font-semibold mt-0.5 leading-relaxed">
            {person.lastSeenText} {person.zoneName && `(${person.zoneName})`}
          </p>
        </div>
      )}

      {person.physicalDescription && (
        <div className="mt-3 border-t border-black/[0.03] pt-3">
          <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">Description</span>
          <p className="text-xs text-khummela-muted leading-relaxed font-medium mt-1">
            {person.physicalDescription}
          </p>
        </div>
      )}
    </Card>
  );
}

export function MatchCompare({ missing, found, score }: MatchCompareProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold tracking-tight text-khummela-text">Verify Potential Connection</h3>
        <Badge status="SUGGESTED" label={`${score}% match score`} className="text-xs" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <PersonPanel person={missing} label="Missing Person" />
        <PersonPanel person={found} label="Found Person" />
      </div>
    </div>
  );
}

