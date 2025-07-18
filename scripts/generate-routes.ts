import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

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
    const modelLower = model.toLowerCase();
    const routeContent = `
// This file is auto-generated. Do not edit manually.
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ${model}Schema } from '../zod';
import { PaginationSchema, ApiResponseSchema, IdParamSchema } from '../schemas/common';
import { z } from 'zod';

const ${model}CreateSchema = ${model}Schema.omit({ id: true, createdAt: true, updatedAt: true });
const ${model}UpdateSchema = ${model}CreateSchema.partial();

export async function ${modelLower}Routes(fastify: FastifyInstance, options: { prisma: PrismaClient }) {
  const { prisma } = options;

  // GET /${modelLower}s - List all ${model}s
  fastify.get('/${modelLower}s', {
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
        prisma.${modelLower}.findMany({
          skip,
          take,
          orderBy: { id: 'desc' },
        }),
        prisma.${modelLower}.count(),
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

  // GET /${modelLower}s/:id - Get single ${model}
  fastify.get('/${modelLower}s/:id', {
    schema: {
      params: IdParamSchema,
      response: {
        200: ApiResponseSchema,
        404: ApiResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as z.infer<typeof IdParamSchema>;

      const item = await prisma.${modelLower}.findUnique({
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

  // POST /${modelLower}s - Create new ${model}
  fastify.post('/${modelLower}s', {
    schema: {
      body: ${model}CreateSchema,
      response: {
        201: ApiResponseSchema,
        400: ApiResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const data = request.body as z.infer<typeof ${model}CreateSchema>;

      const item = await prisma.${modelLower}.create({
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

  // PUT /${modelLower}s/:id - Update ${model}
  fastify.put('/${modelLower}s/:id', {
    schema: {
      params: IdParamSchema,
      body: ${model}UpdateSchema,
      response: {
        200: ApiResponseSchema,
        404: ApiResponseSchema,
        400: ApiResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as z.infer<typeof IdParamSchema>;
      const data = request.body as z.infer<typeof ${model}UpdateSchema>;

      const item = await prisma.${modelLower}.update({
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

  // DELETE /${modelLower}s/:id - Delete ${model}
  fastify.delete('/${modelLower}s/:id', {
    schema: {
      params: IdParamSchema,
      response: {
        200: ApiResponseSchema,
        404: ApiResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as z.infer<typeof IdParamSchema>;

      await prisma.${modelLower}.delete({
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

    writeFileSync(join(routesDir, `${modelLower}.ts`), routeContent);
  });

  // Generate route index file
  const indexContent = `
// This file is auto-generated. Do not edit manually.
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
${models.map((model) => `import { ${model.toLowerCase()}Routes } from './${model.toLowerCase()}';`).join("\n")}

export async function registerRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
${models.map((model) => `  await fastify.register(${model.toLowerCase()}Routes, { prisma });`).join("\n")}
}

export const availableModels = ${JSON.stringify(models, null, 2)};
`;

  writeFileSync(join(routesDir, "index.ts"), indexContent);
  console.log(`✅ Generated routes for models: \${models.join(', ')}`);
};

generateRoutes();
