import { AppError } from "@/utils/error/errors";
import { prisma } from "@/utils/prisma";

export const userService = {
  getUserById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  },
  getUserProfile: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                thumbnailUrl: true,
                level: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
};
