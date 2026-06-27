import { Router, type Router as ExpressRouter } from "express";
import * as controller from "../controllers/kahier.controller.js";

const router: ExpressRouter = Router();

router.get("/zone/:zoneId", controller.getZone);
router.get("/scopes", controller.getScopes);
router.get("/users", controller.getUsers);
router.get("/plannings", controller.getPlanningsController);
router.get("/plannings/:planningId/legends", controller.getPlanningLegendsController);
router.get("/categories/:categoryId/tasks", controller.getCategoryTasksController);
router.patch("/tasks/:taskId/completion", controller.patchTaskCompletion);
router.post("/planning/legend", controller.postPlanningLegend);
router.post("/tasks", controller.postTask);
router.post("/tabs", controller.postPeriodeTab);
router.post("/categories", controller.postCategory);
router.patch("/categories/:categoryId", controller.patchCategory);
router.post("/planning", controller.postPlanningEvent);

export default router;
