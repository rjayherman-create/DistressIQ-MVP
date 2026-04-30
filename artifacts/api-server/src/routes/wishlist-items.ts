import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  AddToWishlistBody,
  AddToWishlistResponse,
  GetWishlistParams,
  GetWishlistResponse,
  RemoveFromWishlistBody,
  RemoveFromWishlistItemResponse,
  UpdateWishlistItemBody,
  UpdateWishlistItemResponse,
} from "@workspace/api-zod";
import { db, wishlistTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// -----------------------------------------------------------------------
// POST /wishlist/add — add an item to a user's wishlist
// -----------------------------------------------------------------------

router.post("/wishlist/add", async (req, res) => {
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const { userId, itemId, itemType, notes } = parsed.data;

  try {
    await db.insert(wishlistTable).values({ userId, itemId, itemType, notes }).onConflictDoNothing();
    const result = AddToWishlistResponse.parse({ success: true });
    res.json(result);
  } catch (err) {
    logger.error({ err }, "wishlist: failed to add item");
    res.status(500).json({ error: "Failed to add item" });
  }
});

// -----------------------------------------------------------------------
// GET /wishlist/:userId — fetch all wishlist items for a user
// -----------------------------------------------------------------------

router.get("/wishlist/:userId", async (req, res) => {
  const parsed = GetWishlistParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing userId" });
    return;
  }

  const { userId } = parsed.data;

  try {
    const rows = await db
      .select()
      .from(wishlistTable)
      .where(eq(wishlistTable.userId, userId));

    const items = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    }));

    const result = GetWishlistResponse.parse(items);
    res.json(result);
  } catch (err) {
    logger.error({ err }, "wishlist: failed to fetch items");
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// -----------------------------------------------------------------------
// DELETE /wishlist/remove — remove an item from a user's wishlist
// -----------------------------------------------------------------------

router.delete("/wishlist/remove", async (req, res) => {
  const parsed = RemoveFromWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const { userId, itemId } = parsed.data;

  try {
    const deleted = await db
      .delete(wishlistTable)
      .where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.itemId, itemId)))
      .returning({ id: wishlistTable.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "Item not found in wishlist" });
      return;
    }

    const result = RemoveFromWishlistItemResponse.parse({ success: true });
    res.json(result);
  } catch (err) {
    logger.error({ err }, "wishlist: failed to remove item");
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// -----------------------------------------------------------------------
// PUT /wishlist/update — update notes on a wishlist item
// -----------------------------------------------------------------------

router.put("/wishlist/update", async (req, res) => {
  const parsed = UpdateWishlistItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const { userId, itemId, notes } = parsed.data;

  try {
    const updated = await db
      .update(wishlistTable)
      .set({ notes })
      .where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.itemId, itemId)))
      .returning({ id: wishlistTable.id });

    if (updated.length === 0) {
      res.status(404).json({ error: "Item not found in wishlist" });
      return;
    }

    const result = UpdateWishlistItemResponse.parse({ success: true });
    res.json(result);
  } catch (err) {
    logger.error({ err }, "wishlist: failed to update item");
    res.status(500).json({ error: "Failed to update item" });
  }
});

export default router;
