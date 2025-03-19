# Setting Up Supabase Project

This guide walks you through setting up a Supabase project for your application.

## Create a Supabase Project

1. Sign up or log in to [Supabase](https://supabase.com)
2. Click "New Project" and fill in the required information:
   - Name: Your project name
   - Database Password: Create a secure password
   - Region: Choose the region closest to your users
3. Click "Create new project" and wait for the project to be created

## Set Up Local Environment

1. Install the Supabase CLI:

```bash
# Using npm
npm install -g supabase

# Using Yarn
yarn global add supabase

# Using pnpm
pnpm add -g supabase
```

2. Initialize Supabase in your project:

```bash
supabase init
```

3. Start the local Supabase instance:

```bash
supabase start
```

## Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

Replace the values with your actual Supabase project URL and keys, which you can find in the Supabase dashboard under Project Settings > API.

## Install Required Dependencies

```bash
# Using npm
npm install @supabase/supabase-js

# Using Yarn
yarn add @supabase/supabase-js

# Using pnpm
pnpm add @supabase/supabase-js
```

## Create Supabase Client

Create a file at `src/lib/supabase.ts` with the following content:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations that require admin privileges
export const supabaseAdmin = process.env.SUPABASE_SERVICE_KEY ? 
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY) : 
  supabase;
```

## Next Steps

Now that you have set up your Supabase project, you can proceed to [configuring Drizzle ORM](./02-drizzle.md).