#!/bin/sh
echo "Pushing database schema..."
npx drizzle-kit push --force
echo "Starting application..."
node dist/index.cjs
