FROM denoland/deno:1.39.4

WORKDIR /app

# Copy dependency files
COPY app.ts .
COPY deno.json .

# Cache the dependencies
RUN deno cache app.ts

ENV PORT=8000
EXPOSE 8000

# Grant required permissions
# --allow-net: Required for HTTP server
# --allow-env: Required for environment variables
CMD ["deno", "run", "--allow-net", "--allow-env", "app.ts"]