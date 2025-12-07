import { Router } from "express";
import { generateLecture } from "../controllers/lecture.controller";

const router = Router();

router.post("/generate", generateLecture);

export default router;
