// app.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { logger } from "https://deno.land/x/hono@v3.11.7/middleware.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

// Start the server
const port = 8000;
console.log(`Server running on port ${port}`);

Deno.cron("sample cron", "0 0 * * *", () => {
  console.log("cron job executed every day");
});

serve(app.fetch, { port });