import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import adminRouter from "./admin.js";
import eventsRouter from "./events.js";
import crisisSupportRouter from "./crisisSupport.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use(eventsRouter);
router.use(crisisSupportRouter);

export default router;
