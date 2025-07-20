#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

const schemaPath = "prisma/schema.prisma";
const zodSchemasPath = "src/generated/zod/**/*.ts"; // Adjust as needed

// A map of our annotation types to the Zod methods they correspond to.
const coercionMap: Record<string, string> = {
  date: "z.coerce.date()",
  number: "z.coerce.number()",
  boolean: "z.coerce.boolean()",
  // For JSON, we replace the type entirely with a custom transform.
  json: `z.string().transform((val, ctx) => {
    try {
      return JSON.parse(val);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid JSON",
      });
      return z.NEVER;
    }
  })`,
};

async function correctZodSchemas() {
  const schemaContent = readFileSync(schemaPath, "utf8");
  const schemaLines = schemaContent.split("\n");

  // { modelName: { fieldName: 'coercionType' } }
  const fieldsToCoerce: Record<string, Record<string, string>> = {};

  let currentModel = "";
  for (const line of schemaLines) {
    const modelMatch = line.match(/model\s+(\w+)/);
    if (modelMatch) {
      currentModel = modelMatch[1];
      fieldsToCoerce[currentModel] = {};
    }

    const coerceMatch = line.match(/\/\/\/\s*@zod-coerce\((\w+)\)/);
    if (coerceMatch && currentModel) {
      const fieldMatch = line.match(/\s*(\w+)\s+/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const coerceType = coerceMatch[1];
        if (coercionMap[coerceType]) {
          fieldsToCoerce[currentModel][fieldName] = coerceType;
        }
      }
    }
  }

  console.log("Found fields marked for coercion:", fieldsToCoerce);

  const files = await glob(zodSchemasPath);
  for (const file of files) {
    let fileContent = readFileSync(file, "utf8");
    let fileWasModified = false;

    for (const modelName in fieldsToCoerce) {
      const fields = fieldsToCoerce[modelName];
      if (!fileContent.includes(`export const ${modelName}Schema`)) continue;

      for (const fieldName in fields) {
        const coerceType = fields[fieldName];
        const zodMethod = coercionMap[coerceType];

        // Regex to find the field line and replace its Zod type.
        // It looks for `fieldName: z.anyType()` and replaces the `z.anyType()` part.
        const fieldRegex = new RegExp(
          `(${fieldName}:\\s*)(z\\.\\w+\\([^)]*\\))`,
          "g",
        );
        // A more general regex for a field definition, to handle more complex types
        const generalFieldRegex = new RegExp(
          `(${fieldName}:\\s*)([^,;\\n]+)`,
          "g",
        );

        if (generalFieldRegex.test(fileContent)) {
          fileContent = fileContent.replace(
            generalFieldRegex,
            `$1${zodMethod}`,
          );
          console.log(
            `- [Zod] Corrected ${modelName}.${fieldName} with '${coerceType}' coercion in ${file}`,
          );
          fileWasModified = true;
        }
      }
    }

    if (fileWasModified) {
      // We need to make sure `z` is imported if it isn't already.
      if (!fileContent.includes('import { z } from "zod";')) {
        fileContent = 'import { z } from "zod";\n' + fileContent;
      }
      writeFileSync(file, fileContent, "utf8");
    }
  }
}

console.log("Starting generalized Zod schema corrections...");
correctZodSchemas()
  .then(() => {
    console.log("✅ Generalized Zod schema corrections complete.");
  })
  .catch(console.error);
