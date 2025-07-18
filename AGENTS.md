# Development Guidelines for Agentic Coding

## Project Setup
- Runtime: Node.js with TypeScript
- Package Manager: npm

## Build & Development Commands
- Build project: `npm run build`
- Start development server: `npm run dev`
- Start production server: `npm run start`
- Generate database types: `npm run db:generate`
- Generate all (db pull, generate, zod, routes): `npm run generate:all`

## Testing
- No explicit test command found. Recommend adding test scripts.

## Code Style Guidelines
- Language: TypeScript (strict mode)
- Formatting: 
  - Use 2-space indentation
  - No trailing whitespaces
  - Use camelCase for variables and functions
  - Use PascalCase for classes and interfaces
- Imports: 
  - Organize imports alphabetically
  - Group external libraries before local imports
- Type Checking:
  - Strict TypeScript configuration
  - Use explicit types
  - Avoid `any` type
- Error Handling:
  - Use Zod for runtime type validation
  - Prefer explicit error types
  - Handle potential errors with try/catch

## Database & API
- ORM: Prisma
- API Framework: Fastify
- Validation: Zod

## Recommended Tools
- VSCode with TypeScript and Prisma extensions
- ESLint for additional linting