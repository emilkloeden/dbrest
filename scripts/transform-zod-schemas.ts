#!/usr/bin/env tsx
import { Project, SyntaxKind } from 'ts-morph';
import { readFileSync } from 'fs';
import { glob } from 'glob';

// Parse Prisma schema to identify base models and coercion annotations
function parsePrismaSchema(schemaPath: string) {
  const schemaContent = readFileSync(schemaPath, 'utf8');
  
  const baseModelNames: string[] = [];
  const coercionAnnotations: Record<string, string[]> = {};

  // Use regex to find models and their annotations
  const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;

  let modelMatch;
  while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
    const modelName = modelMatch[1];
    const modelContent = modelMatch[2];
    baseModelNames.push(modelName);

    // Find coercion annotations within this model
    const modelAnnotations: string[] = [];
    const localAnnotationRegex = /\/\/\/\s*@zod-coerce\((\w+)\)\s*(\w+)/g;
    let annotationMatch;
    while ((annotationMatch = localAnnotationRegex.exec(modelContent)) !== null) {
      modelAnnotations.push(annotationMatch[2]);
    }

    if (modelAnnotations.length > 0) {
      coercionAnnotations[modelName] = modelAnnotations;
    }
  }

  return { baseModelNames, coercionAnnotations };
}

// Determine if a field should be coerced
function shouldCoerceField(
  modelName: string, 
  fieldName: string, 
  currentType: string,
  baseModelNames: string[],
  coercionAnnotations: Record<string, string[]>
): boolean {
  // Check if model is a base model
  const isBaseModel = baseModelNames.includes(modelName);
  
  // Check for explicit coercion annotation
  const hasCoercionAnnotation = 
    coercionAnnotations[modelName]?.includes(fieldName) || false;
  
  // Determine if coercion is appropriate
  return (isBaseModel || hasCoercionAnnotation) && 
    ['z.string()', 'z.string().optional()'].includes(currentType);
}

// Transform Zod schemas
async function transformZodSchemas() {
  const schemaPath = 'prisma/schema.prisma';
  const zodSchemasPath = 'src/generated/zod/**/*.ts';

  // Parse Prisma schema
  const { baseModelNames, coercionAnnotations } = parsePrismaSchema(schemaPath);

  // Create a TypeScript project
  const project = new Project({
    compilerOptions: {
      strict: true
    }
  });

  // Find all Zod schema files
  const files = await glob(zodSchemasPath);

  for (const file of files) {
    const sourceFile = project.addSourceFileAtPath(file);
    let fileModified = false;

    // Find all model schemas
    sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(declaration => {
      const name = declaration.getName();
      
      // Check if this is a model schema
      if (name.endsWith('Schema')) {
        const modelName = name.replace('Schema', '');

        // Modify the schema
        declaration.getDescendantsOfKind(SyntaxKind.PropertySignature).forEach(prop => {
          const propName = prop.getName();
          const currentType = prop.getTypeNode()?.getText();

          if (currentType && shouldCoerceField(
            modelName, 
            propName, 
            currentType, 
            baseModelNames, 
            coercionAnnotations
          )) {
            // Replace the type with coerced version
            const coerceType = currentType.includes('optional()') 
              ? 'z.coerce.date().optional()' 
              : 'z.coerce.date()';
            
            prop.setType(coerceType);
            fileModified = true;
          }
        });
      }
    });

    // Save modified file
    if (fileModified) {
      console.log(`Modified Zod schema: ${file}`);
      sourceFile.saveSync();
    }
  }
}

console.log("Starting Zod schema transformation...");
transformZodSchemas()
  .then(() => {
    console.log("✅ Zod schema transformation complete.");
  })
  .catch(console.error);