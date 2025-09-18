import { AppError } from "@/utils/error/errors";
import { generateJwt } from "@/utils/jwt";
import { prisma } from "@/utils/prisma";

export async function loginService(email: string, password: string): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email, password }
  });

  if (!user) {
    throw new AppError("User not found", 400);
  }

  return generateJwt({ id: user.id, email: user.email });
}

export async function signupService(name: string, email: string, password: string): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError("User already exists", 400);
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password,
      role: 'STUDENT', // Default role for new signups
    }
  });
}