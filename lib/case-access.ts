import type { Case, CaseMedia, Role, Zone } from "@/app/generated/prisma/client";
import { canSeePii } from "@/lib/roles";

export type CaseWithRelations = Case & {
  zone?: Zone | null;
  media?: CaseMedia[];
};

export type SafeCase = {
  id: string;
  caseRef: string;
  type: Case["type"];
  status: Case["status"];
  zoneId: string | null;
  zoneName: string | null;
  personName: string | null;
  ageBand: string | null;
  gender: string | null;
  language: string | null;
  state: string | null;
  district: string | null;
  physicalDescription: string | null;
  lastSeenText: string | null;
  lastSeenAt: Date | null;
  reportingCenter: string | null;
  reporterPhone: string | null;
  isDuplicate: boolean;
  duplicateOfId: string | null;
  resolutionHours: number | null;
  remarks: string | null;
  reportedAt: Date;
  media: { id: string; cdnUrl: string; mimeType: string; kind: string }[];
};

export function redactCase(caseRecord: CaseWithRelations, role: Role): SafeCase {
  const showPii = canSeePii(role);

  return {
    id: caseRecord.id,
    caseRef: caseRecord.caseRef,
    type: caseRecord.type,
    status: caseRecord.status,
    zoneId: caseRecord.zoneId,
    zoneName: caseRecord.zone?.name ?? null,
    personName: caseRecord.personName,
    ageBand: caseRecord.ageBand,
    gender: caseRecord.gender,
    language: caseRecord.language,
    state: caseRecord.state,
    district: caseRecord.district,
    physicalDescription: caseRecord.physicalDescription,
    lastSeenText: caseRecord.lastSeenText,
    lastSeenAt: caseRecord.lastSeenAt,
    reportingCenter: caseRecord.reportingCenter,
    reporterPhone: showPii ? caseRecord.reporterPhone : null,
    isDuplicate: caseRecord.isDuplicate,
    duplicateOfId: caseRecord.duplicateOfId,
    resolutionHours: caseRecord.resolutionHours,
    remarks: showPii ? caseRecord.remarks : null,
    reportedAt: caseRecord.reportedAt,
    media: (caseRecord.media ?? []).map((m) => ({
      id: m.id,
      cdnUrl: m.cdnUrl,
      mimeType: m.mimeType,
      kind: m.kind,
    })),
  };
}
