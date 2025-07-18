import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// This script generates additional Zod schemas for API operations
const generateZodSchemas = () => {
  const schemasDir = join(__dirname, "../src/generated/schemas");

  try {
    mkdirSync(schemasDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }

  const content = `
// This file is auto-generated. Do not edit manually.
import { z } from 'zod';

export const PaginationSchema = z.object({
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(100).default(10),
});

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  pagination: z.object({
    skip: z.number(),
    take: z.number(),
    total: z.number(),
  }).optional(),
});

export const IdParamSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) throw new Error('Invalid ID');
    return num;
  }),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data?: T };
export type IdParam = z.infer<typeof IdParamSchema>;
`;

  writeFileSync(join(schemasDir, "common.ts"), content);
  console.log("✅ Generated common Zod schemas");
};

generateZodSchemas();
