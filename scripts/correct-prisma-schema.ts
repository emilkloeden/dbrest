#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "fs";
// Correctly import the builder from the library you provided
import { createPrismaSchemaBuilder, Datasource } from "@mrleebo/prisma-ast";

const schemaPath = "prisma/schema.prisma";

/**
 * Uses the @mrleebo/prisma-ast builder pattern to reliably get the
 * provider from the datasource block.
 * @returns The provider name (e.g., "sqlite") or null if not found.
 */
function getDatasourceProvider(schemaContent: string): string | null {
  // 1. Create the builder instance from the schema source
  const builder = createPrismaSchemaBuilder(schemaContent);

  // 2. Find the datasource block. A schema has only one, so we don't need a name.
  const datasource: Datasource | null = builder.findByType("datasource", {
    name: "db",
  });
  if (!datasource) {
    console.warn("AST parser could not find a datasource block.");
    return null;
  }

  // 3. Find the 'provider' assignment WITHIN the datasource's properties
  const providerProperty = builder.findByType("assignment", {
    name: "provider",
    within: datasource.assignments,
  });

  if (!providerProperty) {
    console.warn(
      "Could not find a 'provider' assignment in the datasource block.",
    );
    return null;
  }

  // 4. The value is a string literal, e.g., '"sqlite"'. We need to remove the quotes.
  if (typeof providerProperty.value === "string") {
    return providerProperty.value.replace(/"/g, "");
  }

  return null;
}

function main() {
  const schemaContent = readFileSync(schemaPath, "utf8");
  const provider = getDatasourceProvider(schemaContent);

  if (provider !== "sqlite") {
    console.log(
      `Provider is "${provider || "not found"}", not "sqlite". No automatic corrections needed.`,
    );
    return;
  }

  console.log(
    "Provider is 'sqlite'. Checking for DateTime fields to correct...",
  );

  const lines = schemaContent.split("\n");
  let fileWasModified = false;

  const newLines = lines.map((line) => {
    // This logic remains the same: it modifies lines containing DateTime
    // that don't already have a coercion comment.
    if (line.includes("DateTime") && !line.includes("@zod-coerce")) {
      fileWasModified = true;
      console.log(`- Correcting line: ${line.trim()}`);
      return line.replace("DateTime", "String") + " /// @zod-coerce(date)";
    }
    return line;
  });

  if (fileWasModified) {
    writeFileSync(schemaPath, newLines.join("\n"), "utf8");
    console.log("✅ Schema corrections for SQLite applied.");
  } else {
    console.log("✅ No applicable DateTime fields found to correct.");
  }
}

console.log(
  "Starting AST-based Prisma schema correction using '@mrleebo/prisma-ast'...",
);
main();
