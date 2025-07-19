#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "fs";

const schemaPath = "prisma/schema.prisma";

// Helper functions
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toPascalCase(str: string): string {
  return str
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    .replace(/^([a-z])/, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

function isScalarField(
  fieldDefinition: string,
  modelNameMap: { [key: string]: string },
): boolean {
  const scalarTypes = [
    "String",
    "Int",
    "Float",
    "Boolean",
    "DateTime",
    "Json",
    "Bytes",
    "Decimal",
    "BigInt",
  ];
  const typeMatch = fieldDefinition.match(/^(\w+)/);
  if (!typeMatch) return false;

  const baseType = typeMatch[1];
  // It's a scalar if it's a built-in type or not a known model type.
  return (
    scalarTypes.includes(baseType) ||
    !Object.values(modelNameMap).includes(baseType)
  );
}

function isRelationField(
  fieldDefinition: string,
  modelNameMap: { [key: string]: string },
): boolean {
  // A field is a relation if it explicitly has an @relation attribute.
  if (fieldDefinition.includes("@relation")) {
    return true;
  }

  // Otherwise, a field is a relation if its type is another model.
  // We can determine this by checking if it's NOT a scalar type.
  return !isScalarField(fieldDefinition, modelNameMap);
}

function convertSchema(schema: string): string {
  let convertedSchema = schema;
  const lines = schema.split("\n");
  const convertedLines: string[] = [];

  // Track model names for type references
  const modelNameMap: { [key: string]: string } = {};

  // First pass: collect model names and convert to PascalCase
  for (const line of lines) {
    const modelMatch = line.match(/^model\s+(\w+)\s*{/);
    if (modelMatch) {
      const originalName = modelMatch[1];
      const pascalCaseName = toPascalCase(originalName);
      modelNameMap[originalName] = pascalCaseName;
    }
  }

  let insideModel = false;
  let currentModelHasMap = false;
  let currentModelOriginalName = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Handle model declarations
    const modelMatch = line.match(/^(\s*)model\s+(\w+)\s*{/);
    if (modelMatch) {
      insideModel = true;
      currentModelHasMap = false;
      const indent = modelMatch[1];
      const originalName = modelMatch[2];
      currentModelOriginalName = originalName;
      const pascalCaseName = toPascalCase(originalName);

      convertedLines.push(`${indent}model ${pascalCaseName} {`);
      continue;
    }

    // Handle end of model
    if (insideModel && trimmedLine === "}") {
      const pascalCaseModelName = modelNameMap[currentModelOriginalName];

      // Add @@map for converted model names unless it already exists
      if (
        !currentModelHasMap &&
        currentModelOriginalName !== pascalCaseModelName
      ) {
        const indent = line.match(/^(\s*)/)?.[1] || "  ";
        const snakeCaseName = toSnakeCase(currentModelOriginalName);
        // Insert before the closing brace
        convertedLines.push(`${indent}@@map("${snakeCaseName}")`);
      }
      convertedLines.push(line);
      insideModel = false;
      currentModelHasMap = false;
      currentModelOriginalName = "";
      continue;
    }

    // Skip non-model content
    if (!insideModel) {
      convertedLines.push(line);
      continue;
    }

    // Handle @@map annotations
    if (trimmedLine.startsWith("@@map(")) {
      currentModelHasMap = true;
      convertedLines.push(line);
      continue;
    }

    // Handle field lines
    const fieldMatch = line.match(/^(\s*)(\w+)\s+(.+)$/);
    if (fieldMatch) {
      const indent = fieldMatch[1];
      const fieldName = fieldMatch[2];
      const fieldDefinition = fieldMatch[3];

      // Skip if it's a prisma directive or comment
      if (fieldName.startsWith("@@") || fieldName.startsWith("//")) {
        convertedLines.push(line);
        continue;
      }

      const camelCaseFieldName = toCamelCase(fieldName);

      // Process the field definition to handle type references and relations
      let processedDefinition = processFieldDefinition(
        fieldDefinition,
        modelNameMap,
      );

      const isRelation = isRelationField(processedDefinition, modelNameMap);

      // Add @map annotation only for scalar fields that were renamed
      if (
        camelCaseFieldName !== fieldName &&
        !processedDefinition.includes("@map(") &&
        !isRelation
      ) {
        // Use the original field name for the map, as it corresponds to the database column
        processedDefinition =
          processedDefinition.trimEnd() + ` @map("${fieldName}")`;
      }

      convertedLines.push(
        `${indent}${camelCaseFieldName} ${processedDefinition}`,
      );
    } else {
      convertedLines.push(line);
    }
  }

  return convertedLines.join("\n");
}

function processFieldDefinition(
  definition: string,
  modelNameMap: { [key: string]: string },
): string {
  let processed = definition;

  // Handle type references (convert model names in types)
  for (const [originalName, pascalCaseName] of Object.entries(modelNameMap)) {
    if (originalName !== pascalCaseName) {
      // Replace type references - be careful with word boundaries
      processed = processed.replace(
        new RegExp(`\\b${originalName}\\b(?=\\s*[\\[\\]\\?]?)`, "g"),
        pascalCaseName,
      );
    }
  }

  // Handle @relation fields attribute - convert field names inside fields: []
  processed = processed.replace(
    /fields:\s*\[([^\]]+)\]/g,
    (match, fieldsList) => {
      const fields = fieldsList.split(",").map((field: string) => {
        const trimmedField = field.trim();
        return toCamelCase(trimmedField);
      });
      return `fields: [${fields.join(", ")}]`;
    },
  );

  // Handle @relation references attribute - convert field names inside references: []
  processed = processed.replace(
    /references:\s*\[([^\]]+)\]/g,
    (match, referencesList) => {
      const references = referencesList.split(",").map((ref: string) => {
        const trimmedRef = ref.trim();
        return toCamelCase(trimmedRef);
      });
      return `references: [${references.join(", ")}]`;
    },
  );

  return processed;
}

// Main execution
try {
  const schema = readFileSync(schemaPath, "utf8");
  const convertedSchema = convertSchema(schema);
  writeFileSync(schemaPath, convertedSchema, "utf8");

  console.log("✅ Schema converted to proper Prisma naming conventions:");
  console.log("  - Model names: PascalCase");
  console.log("  - Field names: camelCase");
  console.log("  - Database mapping: snake_case via @map and @@map");
} catch (error) {
  console.error("❌ Error processing schema:", error);
}
