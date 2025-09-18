import express from "express";
import cors from "cors";
import authRoutes from "@routes/auth.routes";
import userRoutes from "@routes/user.routes";
import courseRoutes from "@routes/course.routes";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/courses", courseRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});
