# Workspace Rules

## Iron Rule: Lock Project State (宮廟管理v10)
- **STRICT CONSTRAINT**: The user has explicitly requested to "鎖住整個桌面的宮廟管理V10" (Lock the entire Desktop 宮廟管理v10).
- **ACTION**: From this point forward, DO NOT make any arbitrary or unprompted changes to the architecture, logic, or styling of this project.
- **BEHAVIOR**: Any future modifications must strictly adhere to the logic and structure established up to this date (2026-07-07). Before making any changes, you MUST explicitly ask for the user's permission, referencing this rule. Treat the current state as the absolute ground truth.

## PROJECT CONTRACT (Always Follow)
This project is a long-term migration from an in-memory SaaS application to PostgreSQL + Prisma.
These rules apply to ALL future tasks unless explicitly overridden.

### Database
- PostgreSQL is the only production database.
- Prisma version is fixed at 6.19.0.
- Do NOT upgrade Prisma.
- Do NOT recreate existing tables.
- Always generate incremental migrations.
- Existing database already contains the initial tables.
- Never use migrations generated from an empty database against the existing production database.

### Schema
- Every new module must be reflected in schema.prisma.
- Reuse existing models whenever possible.
- Do not duplicate entities.
- Use explicit column types for searchable fields.
- Use Json only for genuinely dynamic/nested data.
- Add foreign keys only when relationships are certain.
- Add indexes for commonly queried fields.

### Business Logic
- Never change business behavior unless explicitly requested.
- Preserve all API signatures.
- Preserve UI behavior.
- Preserve returned object shapes.
- Existing functionality must continue to work.

### Migration Strategy
Phase 1: Update schema.prisma -> Generate migration -> Validate schema -> Generate Prisma Client.
Phase 2: Convert one module from in-memory arrays to Prisma. Never convert the whole project at once.
Phase 3: Seed/import existing data. Preserve IDs whenever possible. Use upsert where appropriate.

### Safety
Before every database change: Validate schema, Review migration, Never drop tables, Never rename columns without approval, Never delete data without approval.

### Deliverables
Every task must include: Files modified, Schema changes, Migration summary, Indexes added, Foreign keys added, Validation results, Build status.
