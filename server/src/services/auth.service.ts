import { AppError } from "@/utils/error/errors";
import { generateJwt } from "@/utils/jwt";
import { prisma } from "@/utils/prisma";
import { UserRole } from "@prisma/client";

export async function loginService(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || user.password !== password) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateJwt({ id: user.id, email: user.email, role: user.role });

  return { token, user };
}

export async function signupService(name: string, email: string, password: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError("User already exists", 400);
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      role: UserRole.STUDENT,
    }
  });

  const token = generateJwt({ id: user.id, email: user.email, role: user.role });

  return { token, user };
}
