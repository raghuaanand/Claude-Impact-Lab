import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { presignMediaSchema } from "@/lib/validations/case";
import { buildS3Key, getPresignedUploadUrl, isS3Configured } from "@/lib/s3";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!isS3Configured()) {
    return NextResponse.json(
      { error: "S3 not configured. Set AWS_* and CLOUDFRONT_URL env vars." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const caseRecord = await prisma.case.findUnique({ where: { id } });
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = presignMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const folder = caseRecord.type === "MISSING" ? "missing" : "found";
  const s3Key = buildS3Key(folder, id, parsed.data.filename);
  const uploadUrl = await getPresignedUploadUrl(s3Key, parsed.data.contentType);

  return NextResponse.json({ uploadUrl, s3Key });
}
