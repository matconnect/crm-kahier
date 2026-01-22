import { Router, type Router as ExpressRouter } from "express";
import * as controller from "../controllers/clients.controller";

const router: ExpressRouter = Router();

router.get("/", controller.list);
router.get("/summary", controller.summary);
router.post("/", controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", controller.update);
router.post("/:id/interactions", controller.logInteraction);
router.post("/:id/contacts", controller.addContact);
router.get("/:id/documents", controller.listDocuments);
router.post("/:id/documents/presign", controller.presignDocument);
router.post("/:id/documents", controller.createDocument);
router.get("/:id/documents/:documentId/download", controller.getDocumentDownload);
router.patch("/:id/interactions/:interactionId", controller.updateInteraction);
router.delete("/:id/interactions/:interactionId", controller.deleteInteraction);
router.delete("/:id/contacts/:contactId", controller.deleteContact);
router.delete("/:id", controller.remove);

export default router;
