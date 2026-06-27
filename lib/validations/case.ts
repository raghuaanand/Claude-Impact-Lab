import { z } from "zod";

export const createCaseSchema = z.object({
  type: z.enum(["MISSING", "FOUND"]),
  personName: z.string().optional(),
  ageBand: z.string().min(1),
  gender: z.string().min(1),
  language: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  physicalDescription: z.string().optional(),
  lastSeenText: z.string().optional(),
  lastSeenAt: z.string().datetime().optional(),
  reportingCenter: z.string().optional(),
  reporterPhone: z.string().optional(),
  zoneId: z.string().optional(),
  remarks: z.string().optional(),
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
