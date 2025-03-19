# Supabase + Drizzle + Server Actions Blueprint

This blueprint provides a comprehensive guide for implementing a backend solution using Supabase as the database, Drizzle as the ORM, and Next.js Server Actions for API endpoints.

## Overview

This architecture is ideal for modern full-stack applications that require:
- Type-safe database operations
- Serverless functions for API endpoints
- Real-time data capabilities
- User authentication and authorization

## Technologies

- **Supabase**: PostgreSQL database with built-in authentication, real-time subscriptions, and more
- **Drizzle ORM**: Type-safe SQL query builder for TypeScript
- **Next.js Server Actions**: Server-side functions that can be called directly from client components

## Implementation Steps

Follow these steps to implement the architecture:

1. [Setup Supabase Project](./01-setup.md)
2. [Configure Drizzle ORM](./02-drizzle.md)
3. [Define Database Schema](./03-schema.md)
4. [Implement Server Actions](./04-server-actions.md)
5. [Add Authentication](./05-auth.md)
6. [Enable Real-time Subscriptions](./06-realtime.md)

## Example Implementation

See the [example implementation](./example/) for a complete working example of this architecture.

## Best Practices

- Keep database schema in a separate file for better organization
- Use zod for input validation in server actions
- Implement proper error handling and type safety
- Use environment variables for sensitive information
- Follow the repository pattern for data access

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/api-reference/functions/server-actions)