import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { registerRoutes, availableModels } from "./generated/routes";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  IdParamSchema,
  PaginationSchema,
  ApiResponseSchema,
} from "./generated/schemas/common";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
const fastify = Fastify({
  logger: {
    level: "trace",
  },
});

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Debug each of your schemas
const schemas = {
  PaginationSchema,
  ApiResponseSchema,
  IdParamSchema,
};

const prisma = new PrismaClient();

// Root endpoint
fastify.get("/", async (request, reply) => {
  return {
    message: "Auto-Generated Fastify API",
    documentation: "/docs",
    availableModels,
    endpoints: availableModels.map((model) => {
      const modelLower = model.toLowerCase().replace(/_/g, "");
      return {
        model,
        endpoints: [
          `GET /${modelLower}`,
          `GET /${modelLower}/:id`,
          `POST /${modelLower}`,
          `PUT /${modelLower}/:id`,
          `DELETE /${modelLower}/:id`,
        ],
      };
    }),
  };
});

// Graceful shutdown
const gracefulShutdown = async () => {
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start server
const start = async () => {
  try {
    // Register plugins
    await fastify.register(import("@fastify/cors"), {
      origin: true,
    });

    await fastify.register(import("@fastify/swagger"), {
      openapi: {
        info: {
          title: "Auto-Generated API",
          description: "REST API generated from SQL Server database",
          version: "1.0.0",
        },
        servers: [
          {
            url: "http://localhost:3000",
            description: "Development server",
          },
        ],
      },
    });

    await fastify.register(import("@fastify/swagger-ui"), {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "full",
        deepLinking: false,
      },
    });

    // Register auto-generated routes
    registerRoutes(fastify, prisma);

    const port = parseInt(process.env.PORT || "3000", 10);
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 Documentation available at http://localhost:${port}/docs`);
    console.log(`📊 Available models: ${availableModels.join(", ")}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
