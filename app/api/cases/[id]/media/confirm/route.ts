import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmMediaSchema } from "@/lib/validations/case";
import { getCdnUrl } from "@/lib/s3";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
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

  const parsed = confirmMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cdnUrl = getCdnUrl(parsed.data.s3Key);
  const media = await prisma.caseMedia.create({
    data: {
      caseId: id,
      s3Key: parsed.data.s3Key,
      cdnUrl,
      mimeType: parsed.data.mimeType,
      kind: parsed.data.kind ?? "PHOTO",
    },
  });

  return NextResponse.json({ media }, { status: 201 });
}
