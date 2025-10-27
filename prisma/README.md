# Prisma Database Setup

## Prerequisites

You need a PostgreSQL database. We recommend using [Supabase](https://supabase.com/) for easy setup.

## Setup Instructions

### 1. Get Your Database Connection String

If using Supabase:
1. Create a new project at https://supabase.com/
2. Go to Project Settings > Database
3. Copy the connection string (URI format)
4. Replace `[YOUR-PASSWORD]` with your database password

### 2. Update Environment Variables

Update the `DATABASE_URL` in your `.env` file with your actual database connection string:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 3. Run Database Migration

Once your database is configured, run:

```bash
npm run prisma:migrate
```

This will:
- Create all database tables (users, tasks, pomodoro_sessions, achievements, user_achievements)
- Apply all indexes and constraints
- Run the seed script to populate initial achievements

### 4. Verify Setup

You can verify the setup by running Prisma Studio:

```bash
npm run prisma:studio
```

This will open a browser interface where you can view your database tables and data.

## Available Scripts

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Database Schema

The database includes the following models:

- **User** - User accounts with authentication
- **Task** - Learning tasks created by users
- **PomodoroSession** - Timed focus sessions linked to tasks
- **Achievement** - Available achievement badges
- **UserAchievement** - Unlocked achievements for users

## Initial Achievements

The seed script creates three initial achievements:

1. **First Focus** - Complete your first Pomodoro session
2. **Week Warrior** - Maintain a 7-day learning streak
3. **Dedicated Learner** - Accumulate 25 hours of total focus time
