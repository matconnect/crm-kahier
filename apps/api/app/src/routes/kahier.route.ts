import { Router, type Router as ExpressRouter } from "express";
import * as controller from "../controllers/kahier.controller";

const router: ExpressRouter = Router();

router.get("/zone/:zoneId", controller.getZone);
router.get("/users", controller.getUsers);
router.get("/plannings", controller.getPlanningsController);
router.get("/plannings/:planningId/legends", controller.getPlanningLegendsController);
router.post("/tasks", controller.postTask);
router.post("/planning", controller.postPlanningEvent);

export default router;
