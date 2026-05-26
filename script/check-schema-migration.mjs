#!/usr/bin/env node
// CI guard: fail any PR that modifies shared/schema.ts without also
// adding a new migrations/*.sql file. Catches the exact class of incident
// that crashed the May 22 deploy (schema column added in TS but the
// matching SQL migration was never written, so drizzle-kit push silently
// no-oped on prod and the new code crashed on first query).
//
// Compares HEAD against $BASE_REF (default: origin/main) and inspects the
// changed-file list.
//
// Skip with: SKIP_SCHEMA_MIGRATION_CHECK=1
// (Use sparingly — e.g. renames-only commits, comment-only edits.)

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

if (process.env.SKIP_SCHEMA_MIGRATION_CHECK === "1") {
  console.log("[schema-migration-check] skipped via SKIP_SCHEMA_MIGRATION_CHECK=1");
  process.exit(0);
}

const baseRef = process.env.BASE_REF || "origin/main";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

// Make sure the base ref is fetched. In GitHub Actions with
// fetch-depth: 0 it already is; locally it may not be.
try {
  run(`git rev-parse --verify ${baseRef}`);
} catch {
  console.warn(`[schema-migration-check] base ref ${baseRef} not found locally; trying to fetch`);
  try {
    run(`git fetch origin main --depth=1`);
  } catch (err) {
    console.error(`[schema-migration-check] couldn't fetch ${baseRef}; aborting check`);
    console.error(err?.message || err);
    process.exit(0); // soft-skip rather than block when CI plumbing is wrong
  }
}

const changed = run(`git diff --name-only ${baseRef}...HEAD`).split("\n").filter(Boolean);

const schemaChanged = changed.includes("shared/schema.ts");
const newMigrations = changed.filter(
  (f) => f.startsWith("migrations/") && f.endsWith(".sql"),
);

const addedMigrations = newMigrations.filter((f) => {
  // Confirm it's an ADD, not a modification, by checking status.
  try {
    const status = run(`git diff --name-status ${baseRef}...HEAD -- "${f}"`);
    return status.startsWith("A");
  } catch {
    return false;
  }
});

if (!schemaChanged) {
  console.log("[schema-migration-check] shared/schema.ts unchanged — OK");
  process.exit(0);
}

if (addedMigrations.length === 0) {
  console.error("");
  console.error("❌ shared/schema.ts changed but no new migrations/*.sql file was added.");
  console.error("");
  console.error("   This is the failure mode that crashed the May 22 prod deploy:");
  console.error("   the Drizzle schema declared columns that didn't exist in the");
  console.error("   database, so every query against the affected tables crashed.");
  console.error("");
  console.error("   Fix one of:");
  console.error("     • Add a new migrations/####_*.sql file with the ALTER TABLE.");
  console.error("     • If this change really doesn't need a migration (e.g. a");
  console.error("       comment-only edit, or a TS-only rename), bypass with:");
  console.error("         SKIP_SCHEMA_MIGRATION_CHECK=1 git commit ...");
  console.error("");
  process.exit(1);
}

console.log("[schema-migration-check] shared/schema.ts changed; matching migration(s) present:");
for (const m of addedMigrations) console.log(`   + ${m}`);

// Also sanity-check: every migration file referenced in this PR actually
// exists on disk (catches accidental rename-without-content).
for (const m of addedMigrations) {
  if (!existsSync(m)) {
    console.error(`❌ ${m} is in the diff but doesn't exist on disk`);
    process.exit(1);
  }
}

console.log("[schema-migration-check] OK");
process.exit(0);
