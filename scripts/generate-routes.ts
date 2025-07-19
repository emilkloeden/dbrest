import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { camelCase, pascalCase, snakeCase, kebabCase } from "change-case";
const generateRoutes = () => {
  const routesDir = join(__dirname, "../src/generated/routes");

  try {
    mkdirSync(routesDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }

  // Read the Prisma schema to extract model names
  const schemaPath = join(__dirname, "../prisma/schema.prisma");
  let models: string[] = [];

  try {
    const schemaContent = readFileSync(schemaPath, "utf-8");
    const modelMatches = schemaContent.match(/model\s+(\w+)\s*{/g);
    if (modelMatches) {
      models = modelMatches.map((match) =>
        match.replace(/model\s+(\w+)\s*{/, "$1"),
      );
    }
  } catch (error) {
    console.log(
      '⚠️  Could not read Prisma schema. Run "prisma db pull" first.',
    );
    return;
  }

  models.forEach((model) => {
    // Convert snake_case to camelCase
    const modelCamel = camelCase(model);

    // Convert camelCase to kebab-case for routes
    const modelKebab = kebabCase(model);
    const modelSnake = snakeCase(model);
    const modelPascal = pascalCase(model);
    const routeContent = `
// This file is auto-g.withTypeProvider<ZodTypeProvider>()enerated. Do not edit manually.
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ${modelPascal}Schema } from '../zod';
import {
  PaginationSchema,
  ApiResponseSchema,
  IdParamSchema,
  parseIdParam,
} from "../schemas/common";
import { z } from 'zod';
import { ZodTypeProvider } from "fastify-type-provider-zod";

const ${modelPascal}CreateSchema = ${modelPascal}Schema.omit({ id: true }).partial();
const ${modelPascal}UpdateSchema = ${modelPascal}CreateSchema;

export async function ${modelCamel}Routes(fastify: FastifyInstance, options: { prisma: PrismaClient }) {
  const { prisma } = options;

  // GET /${modelKebab} - List all ${model}
  fastify.withTypeProvider<ZodTypeProvider>().get('/${modelKebab}', {
    schema: {
      querystring: PaginationSchema,
      response: {
        200: ApiResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { skip, take } = request.query as z.infer<typeof PaginationSchema>;

      const [items, total] = await Promise.all([
        prisma.${modelCamel}.findMany({
          skip,
          take,
          orderBy: { id: 'desc' },
        }),
        prisma.${modelCamel}.count(),
      ]);

      return {
        success: true,
        data: items,
        pagination: { skip, take, total },
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /${modelKebab}/:id - Get single ${model}
  fastify.withTypeProvider<ZodTypeProvider>().get('/${modelKebab}/:id', {
    schema: {
      params: IdParamSchema,
      response: {
        200: ApiResponseSchema,
        404: ApiResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { id: idString } = request.params as z.infer<
        typeof IdParamSchema
      >;
      const id = parseIdParam(idString);

      const item = await prisma.${modelCamel}.findUnique({
        where: { id },
      });

      if (!item) {
        return reply.status(404).send({
          success: false,
          error: '${model} not found',
        });
      }

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // POST /${modelKebab} - Create new ${model}
  fastify.withTypeProvider<ZodTypeProvider>().post('/${modelKebab}', {
    schema: {
      body: ${modelPascal}CreateSchema,
      response: {
        201: ApiResponseSchema,
        400: ApiResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const data = request.body as z.infer<typeof ${modelPascal}CreateSchema>;

      const item = await prisma.${modelCamel}.create({
        data,
      });

      return reply.status(201).send({
        success: true,
        data: item,
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid data',
      });
    }
  });

  // PUT /${modelKebab}/:id - Update ${model}
  fastify.withTypeProvider<ZodTypeProvider>().put('/${modelKebab}/:id', {
    schema: {
      params: IdParamSchema,
      body: ${modelPascal}UpdateSchema,
      response: {
        200: ApiResponseSchema,
        404: ApiResponseSchema,
        400: ApiResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { id: idString } = request.params as z.infer<
        typeof IdParamSchema
      >;
      const id = parseIdParam(idString);
      const data = request.body as z.infer<typeof ${modelPascal}UpdateSchema>;

      const item = await prisma.${modelCamel}.update({
        where: { id },
        data,
      });

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return reply.status(404).send({
          success: false,
          error: '${model} not found',
        });
      }

      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid data',
      });
    }
  });

  // DELETE /${modelKebab}/:id - Delete ${model}
  fastify.withTypeProvider<ZodTypeProvider>().delete('/${modelKebab}/:id', {
    schema: {
      params: IdParamSchema,
      response: {
        200: ApiResponseSchema,
        404: ApiResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { id: idString } = request.params as z.infer<
        typeof IdParamSchema
      >;
      const id = parseIdParam(idString);

      await prisma.${modelCamel}.delete({
        where: { id },
      });

      return {
        success: true,
        data: { message: '${model} deleted successfully' },
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return reply.status(404).send({
          success: false,
          error: '${model} not found',
        });
      }

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
`;

    const routeFilePath = join(routesDir, `${modelKebab}.ts`);
    writeFileSync(routeFilePath, routeContent);
  });

  // Generate route index file
  const indexContent = `
// This file is auto-generated. Do not edit manually.
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
${models
  .map((model) => {
    const modelCamel = camelCase(model);
    const modelKebab = kebabCase(model);
    return `import { ${modelCamel}Routes } from './${modelKebab}';`;
  })
  .join("\n")}

export async function registerRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
${models
  .map((model) => {
    const modelCamel = camelCase(model);
    const modelKebab = kebabCase(model);
    return `  await fastify.register(${modelCamel}Routes, { prisma });`;
  })
  .join("\n")}
}

export const availableModels = ${JSON.stringify(models, null, 2)};
`;

  writeFileSync(join(routesDir, "index.ts"), indexContent);
  console.log(`✅ Generated routes for models: ${models.join(", ")}`);
};

generateRoutes();
