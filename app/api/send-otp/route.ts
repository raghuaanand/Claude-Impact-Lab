import { NextResponse } from "next/server";
import { createAndSendOtp } from "@/lib/otp";
import { isValidMobile } from "@/lib/mobile";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobile, purpose = "login" } = body;

    if (!mobile) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    if (!isValidMobile(mobile)) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    if (purpose !== "login" && purpose !== "signup") {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
    }

    if (purpose === "login") {
      const { normalizeMobile } = await import("@/lib/mobile");
      const normalizedMobile = normalizeMobile(mobile);
      const user = await prisma.user.findUnique({
        where: { mobile: normalizedMobile },
      });

      if (!user) {
        return NextResponse.json(
          {
            error:
              "No account found with this mobile number. Sign up first or check the number.",
          },
          { status: 400 }
        );
      }
    }

    if (purpose === "signup") {
      const { normalizeMobile } = await import("@/lib/mobile");
      const normalizedMobile = normalizeMobile(mobile);
      const existing = await prisma.user.findUnique({
        where: { mobile: normalizedMobile },
      });

      if (existing) {
        return NextResponse.json(
          { error: "An account with this mobile number already exists" },
          { status: 409 }
        );
      }
    }

    await createAndSendOtp(mobile, purpose);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
