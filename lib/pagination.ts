export type CursorPayload = { id: string; v: string };
export type CursorFieldType = "date" | "number" | "string";

export function encodeCursor(id: string, sortValue: unknown): string {
  const v =
    sortValue instanceof Date
      ? sortValue.toISOString()
      : sortValue === null || sortValue === undefined
      ? ""
      : String(sortValue);
  return Buffer.from(JSON.stringify({ id, v })).toString("base64url");
}

export function decodeCursor(raw: string): CursorPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString());
    if (typeof parsed.id === "string" && typeof parsed.v === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

// Builds a Prisma-compatible WHERE clause that pages past the cursor item.
// The cursor uniquely identifies a row by (sortField, id).
// We add id as tiebreaker so equal sort values don't cause gaps or duplicates.
export function buildCursorWhere(
  cursor: CursorPayload,
  sortBy: string,
  sortOrder: "asc" | "desc",
  fieldType: CursorFieldType
): Record<string, unknown> {
  const { id, v } = cursor;
  const op = sortOrder === "desc" ? "lt" : "gt";

  if (v === "") {
    // Cursor item had a null sort value.
    // Prisma sorts nulls last for desc, nulls first for asc.
    if (sortOrder === "desc") {
      // We're already in the null block — only remaining nulls with smaller id.
      return { AND: [{ [sortBy]: null }, { id: { [op]: id } }] };
    }
    // asc nulls-first: either more nulls with larger id, or any non-null item.
    return {
      OR: [
        { AND: [{ [sortBy]: null }, { id: { [op]: id } }] },
        { [sortBy]: { not: null } },
      ],
    };
  }

  const val: unknown =
    fieldType === "date"
      ? new Date(v)
      : fieldType === "number"
      ? Number(v)
      : v;

  return {
    OR: [
      { [sortBy]: { [op]: val } },
      { AND: [{ [sortBy]: val }, { id: { [op]: id } }] },
    ],
  };
}
