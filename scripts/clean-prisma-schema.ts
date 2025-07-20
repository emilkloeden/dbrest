#!/usr/bin/env tsx
import { copyFileSync } from "fs";

const baseFilePath = "prisma/base.prisma";
const schemaFilePath = "prisma/schema.prisma";

copyFileSync(baseFilePath, schemaFilePath);
