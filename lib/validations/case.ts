import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

export const createCaseSchema = z.object({
  type: z.enum(["MISSING", "FOUND"]),
  personName: optionalText,
  ageBand: z.string().min(1),
  gender: z.string().min(1),
  language: optionalText,
  state: optionalText,
  district: optionalText,
  physicalDescription: optionalText,
  lastSeenText: optionalText,
  lastSeenAt: z.string().datetime().optional(),
  reportingCenter: optionalText,
  reporterPhone: optionalText,
  zoneId: optionalText,
  remarks: optionalText,
});

export const updateCaseSchema = z.object({
  status: z
    .enum(["OPEN", "MATCH_PENDING", "RESOLVED", "TRANSFERRED", "UNRESOLVED", "DUPLICATE"])
    .optional(),
  duplicateOfId: z.string().optional(),
  remarks: z.string().optional(),
});

export const matchReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export const presignMediaSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  kind: z.enum(["PHOTO", "VIDEO", "AUDIO"]).optional(),
});

export const confirmMediaSchema = z.object({
  s3Key: z.string().min(1),
  mimeType: z.string().min(1),
  kind: z.enum(["PHOTO", "VIDEO", "AUDIO"]).optional(),
});
