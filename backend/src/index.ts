import { configDotenv } from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import apiRoutes from "./routes/api.routes";

configDotenv();

const app = express();
const PORT = process.env.PORT || 5000;

// Using middleware cors to connect Back - Front
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api", apiRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("fuck nguyen thanh binh");
});

app.listen(PORT, () => {
  console.log("ok dang nghe");
});
