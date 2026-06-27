import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { normalizeMobile } from "@/lib/mobile";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS_PER_HOUR = 5;

function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const code = Math.floor(Math.random() * max)
    .toString()
    .padStart(OTP_LENGTH, "0");
  return code;
}

export async function createAndSendOtp(
  mobile: string,
  purpose: "login" | "signup" = "login"
): Promise<void> {
  const normalizedMobile = normalizeMobile(mobile);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.otpCode.count({
    where: {
      mobile: normalizedMobile,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentCount >= MAX_OTP_ATTEMPTS_PER_HOUR) {
    throw new Error("Too many OTP requests. Please try again later.");
  }

  await prisma.otpCode.deleteMany({
    where: { mobile: normalizedMobile, purpose },
  });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: {
      mobile: normalizedMobile,
      code,
      purpose,
      expiresAt,
    },
  });

  const message = `Your KHUMMELA verification code is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
  await sendSms(normalizedMobile, message);
}

export async function verifyOtp(
  mobile: string,
  code: string,
  purpose: "login" | "signup" = "login"
): Promise<boolean> {
  const normalizedMobile = normalizeMobile(mobile);

  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      mobile: normalizedMobile,
      purpose,
      code,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return false;
  }

  await prisma.otpCode.delete({ where: { id: otpRecord.id } });
  return true;
}
