import express from "express";
import type { Request, Response } from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Roboticela DevKit");
});

app.get("/test", (req: Request, res: Response) => {
  res.json({ ok: true, message: "Test route works", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});