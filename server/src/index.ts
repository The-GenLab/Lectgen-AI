import { configDotenv } from "dotenv";
import express, { Request, Response } from "express";

configDotenv();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("fuck nguyen thanh binh");
});

app.listen(PORT, () => {
  console.log("ok dang nghe");
});
