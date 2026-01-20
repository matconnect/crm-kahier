import { Router, type Router as ExpressRouter } from "express";
import * as controller from "../controllers/kahier.controller";

const router: ExpressRouter = Router();

router.get("/zone/:zoneId", controller.getZone);
router.post("/tasks", controller.postTask);

export default router;
