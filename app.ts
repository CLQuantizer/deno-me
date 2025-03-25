// app.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { logger } from "https://deno.land/x/hono@v3.11.7/middleware.ts";
import { BuyTree, SellTree, Trades } from './context.ts';
import { processOrder } from './me.ts';
import {Order, Side, OrderStatus, NewOrderSchema} from './types.ts';

// Initialize Hono
const app = new Hono();

// Middleware for logging
app.use("*", logger());

// Basic error handling middleware
app.use("*", async (c, next) => {
  try {
    await next();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Routes
app.get("/", (c) => c.json({ message: "Welcome to Deno + Hono API!" }));

app.get("/health", (c) => c.json({ status: "Oj8K" }));

// Get order books state
app.get("/books", (c) => {
  const formattedResponse = {
    buys: [...BuyTree.rnlValues()],
    sells: [...SellTree.rnlValues()],
    timestamp: new Date().toISOString(),
    summary: {
      totalBuyOrders: BuyTree.size,
      totalSellOrders: SellTree.size,
    }
  };

  return c.json(formattedResponse);
});
// Get trades history
app.get("/trades", (c) => {
  return c.json(Trades);
});

// Place new order
app.post("/place", async (c) => {
  const body = await c.req.json();

  const result = NewOrderSchema.safeParse({
    ...body,
    userId: crypto.randomUUID(), // Generate userId here since it's required by schema
    timestamp: Date.now() // Add timestamp since it's required by schema
  });

  if (!result.success) {
    return c.json({
      error: "Validation failed",
      details: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    }, 400);
  }
  const newOrder = result.data;
  // Create new order
  const order: Order = {
    ...newOrder,
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    status: OrderStatus.OPEN,
    filledQuantity: 0,
    timestamp: Date.now()
  };

  // Process the order
  processOrder(order);

  return c.json({
    message: "Order processed successfully",
    orderId: order.id,
    status: order.status,
    filledQuantity: order.filledQuantity
  });
});

// Start the server
const port = 8000;
console.log(`Server running on port ${port}`);

// Deno.cron("sample cron", "0 0 * * *", () => {
//   console.log("cron job executed every day");
// });

serve(app.fetch, { port });