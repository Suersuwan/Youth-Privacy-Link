import { Router, type IRouter, Request, Response } from "express";
import { eq, lt } from "drizzle-orm";
import { db, anonIdsTable } from "@workspace/db";
import { adminAuth } from "../middlewares/adminAuth.js";

const router: IRouter = Router();

router.use(adminAuth);

/**
 * DELETE /api/admin/anon-ids/expired
 * Purges all mappings whose 24-hour TTL has elapsed.
 */
router.delete("/anon-ids/expired", async (req: Request, res: Response) => {
  try {
    const result = await db
      .delete(anonIdsTable)
      .where(lt(anonIdsTable.expiresAt, new Date()))
      .returning({ realId: anonIdsTable.realId });

    req.log.info({ purged: result.length }, "Purged expired anon ID mappings");
    res.json({ purged: result.length });
  } catch (err) {
    req.log.error({ err }, "Failed to purge expired anon IDs");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/admin/anon-ids/:realId
 * Purges the anonymization mapping for a specific real Discord user ID.
 * Use this for right-to-erasure / GDPR deletion requests.
 */
router.delete("/anon-ids/:realId", async (req: Request, res: Response) => {
  const rawId = req.params["realId"];
  const realId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!realId) {
    res.status(400).json({ error: "realId param is required" });
    return;
  }

  try {
    const result = await db
      .delete(anonIdsTable)
      .where(eq(anonIdsTable.realId, realId))
      .returning({ realId: anonIdsTable.realId });

    if (result.length === 0) {
      res.status(404).json({ error: "No mapping found for that ID" });
      return;
    }

    req.log.info("Purged anon ID mapping on request");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to purge anon ID");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
