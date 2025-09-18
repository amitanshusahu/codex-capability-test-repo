import { loginService, signupService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { LoginRequest, SignupRequest } from "@/types/zod";
import { errorHandler } from "@/utils/error";
import { Request, Response } from "express";

export async function loginController(req: Request, res: Response): Promise<Response> {
  try {
    const { email, password } = LoginRequest.parse(req.body);
    const { token, user } = await loginService(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, user }
    });
  } catch (err) {
    return errorHandler(err, "Error in loginController", res);
  }
}

export async function signupController(req: Request, res: Response): Promise<Response> {
  try {
    const { name, email, password } = SignupRequest.parse(req.body);
    const { token, user } = await signupService(name, email, password);

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      data: { token, user }
    });
  } catch (error) {
    return errorHandler(error, "Error in signupController", res);
  }
}

export async function me(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await userService.getUserProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: { user }
    });
  } catch (error) {
    return errorHandler(error, "Error in me controller", res);
  }
}
