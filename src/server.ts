import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { registerRoutes, availableModels } from "./generated/routes";

const fastify = Fastify({
  logger: true,
});

const prisma = new PrismaClient();

// Register plugins
fastify.register(require("@fastify/cors"), {
  origin: true,
});

fastify.register(require("@fastify/swagger"), {
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

fastify.register(require("@fastify/swagger-ui"), {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
});

// Root endpoint
fastify.get("/", async (request, reply) => {
  return {
    message: "Auto-Generated Fastify API",
    documentation: "/docs",
    availableModels,
    endpoints: availableModels.map((model) => ({
      model,
      endpoints: [
        `GET /${model.toLowerCase()}s`,
        `GET /${model.toLowerCase()}s/:id`,
        `POST /${model.toLowerCase()}s`,
        `PUT /${model.toLowerCase()}s/:id`,
        `DELETE /${model.toLowerCase()}s/:id`,
      ],
    })),
  };
});

// Register auto-generated routes
registerRoutes(fastify, prisma);

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
