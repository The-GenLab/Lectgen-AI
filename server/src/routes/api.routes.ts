import { Router } from "express";
import { generateController } from "../controllers/genController";

const router = Router();

router.post("/generate", generateController);

export default router;
