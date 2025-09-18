import { loginController, me, signupController } from "@/controllers/auth.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/login", loginController);
router.post("/signup", signupController);
router.get("/me", requireAuth, me);

export default router;
