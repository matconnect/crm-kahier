import { Router, type Router as ExpressRouter } from "express";
import * as controller from "../controllers/kahier-link.controller.js";

const router: ExpressRouter = Router();

router.get("/", controller.getStatus);
router.post("/code", controller.createCode);
router.post("/confirm", controller.confirmCode);
router.put("/api-key", controller.saveApiKey);
router.delete("/api-key", controller.deleteApiKey);

export default router;
