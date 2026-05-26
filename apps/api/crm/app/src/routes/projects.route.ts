import { Router, type Router as ExpressRouter } from "express";
import * as controller from "../controllers/projects.controller.js";

const router: ExpressRouter = Router();

router.get("/", controller.list);
router.get("/summary", controller.summary);
router.post("/", controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
