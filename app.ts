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

// Define a schema for user data
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Routes
app.get("/", (c) => c.json({ message: "Welcome to Deno + Hono API!" }));

app.get("/health", (c) => c.json({ status: "OK" }));

// Example protected route with schema validation
app.post("/users", async (c) => {
  const body = await c.req.json();
  
  try {
    const validatedData = userSchema.parse(body);
    // Here you would typically save to a database
    return c.json({ 
      message: "User created successfully",
      user: validatedData 
    }, 201);
  } catch (error) {
    return c.json({ error: error.errors }, 400);
  }
});

// Example route with URL parameters
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ message: `Fetching user ${id}` });
});

// Start the server
const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`Server running on port ${port}`);

serve(app.fetch, { port });