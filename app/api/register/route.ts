import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { isValidMobile, normalizeMobile } from "@/lib/mobile";
import { verifyOtp } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, email, password, name, mobile, otp } = body;

    if (type === "email") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);

      await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: name?.trim() || null,
          emailVerified: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (type === "mobile") {
      if (!mobile || !password || !otp) {
        return NextResponse.json(
          { error: "Mobile, password, and OTP are required" },
          { status: 400 }
        );
      }

      if (!isValidMobile(mobile)) {
        return NextResponse.json(
          { error: "Invalid mobile number" },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const normalizedMobile = normalizeMobile(mobile);

      const otpValid = await verifyOtp(normalizedMobile, otp, "signup");
      if (!otpValid) {
        return NextResponse.json(
          { error: "Invalid or expired OTP" },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({
        where: { mobile: normalizedMobile },
      });

      if (existing) {
        return NextResponse.json(
          { error: "An account with this mobile number already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);

      await prisma.user.create({
        data: {
          mobile: normalizedMobile,
          password: hashedPassword,
          name: name?.trim() || null,
          mobileVerified: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid registration type" }, { status: 400 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
