import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@/utils/prisma";
import { config } from "@/config";
import { AuthenticatedUser, UserJwtPayload } from "@/types";
import { UserRole } from "@prisma/client";

const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token missing" });
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as UserJwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    req.user = authUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles: UserRole[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    next();
  };
};
