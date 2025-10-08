import express from "express";
import { env } from "./config/env";
import healthRouter from "./routes/health";

const app = express();

app.use(express.json());
app.use("/api/health", healthRouter);

const port = Number(env.PORT);
app.listen(port, () => console.log(`✅ FitVibe Backend running on port ${port}`));
