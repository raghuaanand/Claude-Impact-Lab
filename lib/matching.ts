import type { Case } from "@/app/generated/prisma/client";

const AGE_BANDS = ["0-12", "13-17", "18-40", "41-60", "61-70", "71-80", "80+"];

export type MatchCandidate = {
  missingCaseId: string;
  foundCaseId: string;
  score: number;
};

function tokenize(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function tokenOverlap(a: string | null | undefined, b: string | null | undefined): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  for (const t of setA) {
    if (setB.has(t)) overlap++;
  }
  return overlap / Math.max(setA.size, setB.size);
}

function ageBandScore(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const idxA = AGE_BANDS.indexOf(a);
  const idxB = AGE_BANDS.indexOf(b);
  if (idxA === -1 || idxB === -1) return a === b ? 1 : 0;
  return Math.abs(idxA - idxB) <= 1 ? 0.7 : 0;
}

function recencyScore(reportedAt: Date | null | undefined): number {
  if (!reportedAt) return 0.5;
  const hours = (Date.now() - reportedAt.getTime()) / (1000 * 60 * 60);
  if (hours <= 6) return 1;
  if (hours <= 24) return 0.8;
  if (hours <= 72) return 0.5;
  return 0.2;
}

export function scoreMatch(missing: Case, found: Case): number {
  let score = 0;

  if (missing.zoneId && found.zoneId && missing.zoneId === found.zoneId) {
    score += 25;
  }

  if (missing.gender && found.gender && missing.gender === found.gender) {
    score += 20;
  }

  score += ageBandScore(missing.ageBand, found.ageBand) * 15;

  score += tokenOverlap(missing.physicalDescription, found.physicalDescription) * 25;

  if (missing.language && found.language && missing.language === found.language) {
    score += 5;
  }

  const recency = Math.max(
    recencyScore(missing.lastSeenAt ?? missing.reportedAt),
    recencyScore(found.reportedAt)
  );
  score += recency * 10;

  return Math.round(Math.min(100, score));
}

export function findMatches(
  missingCases: Case[],
  foundCase: Case,
  threshold = 60,
  limit = 5
): MatchCandidate[] {
  return missingCases
    .map((missing) => ({
      missingCaseId: missing.id,
      foundCaseId: foundCase.id,
      score: scoreMatch(missing, foundCase),
    }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function detectDuplicateFlags(
  newCase: Pick<
    Case,
    "personName" | "reporterPhone" | "ageBand" | "gender" | "physicalDescription" | "reportingCenter"
  >,
  existing: Case[]
): Case | null {
  const name = newCase.personName?.toLowerCase().trim();
  const phone = newCase.reporterPhone?.replace(/\D/g, "");

  for (const c of existing) {
    const existingPhone = c.reporterPhone?.replace(/\D/g, "");
    const existingName = c.personName?.toLowerCase().trim();

    if (phone && existingPhone && phone === existingPhone) {
      if (!name || !existingName || name === existingName || levenshteinSimilar(name, existingName) > 0.8) {
        return c;
      }
    }

    if (
      name &&
      existingName &&
      name === existingName &&
      newCase.ageBand === c.ageBand &&
      newCase.gender === c.gender &&
      newCase.reportingCenter !== c.reportingCenter
    ) {
      return c;
    }

    if (
      newCase.ageBand === c.ageBand &&
      newCase.gender === c.gender &&
      tokenOverlap(newCase.physicalDescription, c.physicalDescription) > 0.5 &&
      newCase.reportingCenter !== c.reportingCenter
    ) {
      return c;
    }
  }

  return null;
}

function levenshteinSimilar(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
    }
  }
  return matrix[b.length][a.length];
}
