import { Router, type RequestHandler, type Router as ExpressRouter } from "express";

export type InvoiceRouteHandlers = {
    list: RequestHandler;
    summary: RequestHandler;
    create: RequestHandler;
    getById: RequestHandler;
    update: RequestHandler;
    validate: RequestHandler;
    updateStatus: RequestHandler;
    remove: RequestHandler;
    downloadPdf: RequestHandler;
};

export function createInvoicesRouter(controller: InvoiceRouteHandlers): ExpressRouter {
    const router = Router();

    router.get("/", controller.list);
    router.get("/summary", controller.summary);
    router.post("/", controller.create);
    router.get("/:id/pdf", controller.downloadPdf);
    router.get("/:id", controller.getById);
    router.post("/:id/validate", controller.validate);
    router.patch("/:id/status", controller.updateStatus);
    router.patch("/:id", controller.update);
    router.delete("/:id", controller.remove);

    return router;
}
