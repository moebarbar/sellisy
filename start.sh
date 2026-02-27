#!/bin/sh
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Pushing database schema..."
  npx drizzle-kit push
  echo "Schema push complete."
else
  echo "Skipping schema push (set RUN_MIGRATIONS=true to run)."
fi
echo "Starting application..."
node dist/index.cjs
