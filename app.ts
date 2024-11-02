// app.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { logger } from "https://deno.land/x/hono@v3.11.7/middleware.ts";
import { BuyTree, SellTree, Trades } from './context.ts';
import { processOrder } from './me.ts';
import {Order, Side, OrderStatus} from './types.ts';

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
    buyOrders: [...BuyTree.rnlValues()],
    sellOrders: [...SellTree.rnlValues()],
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

  // Validate required fields
  if (!body.side || !body.price || !body.quantity) {
    return c.json({ error: "Missing required fields: side, price, quantity" }, 400);
  }

  // Validate side
  if (![Side.BUY, Side.SELL].includes(body.side)) {
    return c.json({ error: "Invalid side. Must be 'BUY' or 'SELL'" }, 400);
  }

  // Create new order
  const order: Order = {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    side: body.side,
    price: body.price,
    quantity: body.quantity,
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