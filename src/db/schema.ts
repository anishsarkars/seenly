import { pgTable, uuid, varchar, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  username: varchar('username', { length: 30 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 120 }),
  avatar: text('avatar'),
  headline: varchar('headline', { length: 100 }),
  bio: varchar('bio', { length: 500 }),
  location: varchar('location', { length: 100 }),
  videoUrl: text('video_url'),
  thumbnailUrl: text('thumbnail_url'),
  resumeUrl: text('resume_url'),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const experiences = pgTable('experiences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  company: varchar('company', { length: 100 }).notNull(),
  role: varchar('role', { length: 100 }).notNull(),
  duration: varchar('duration', { length: 50 }).notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  website: text('website'),
  github: text('github'),
});

export const socials = pgTable('socials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  linkedin: text('linkedin'),
  github: text('github'),
  portfolio: text('portfolio'),
  twitter: text('twitter'),
  website: text('website'),
  email: text('email'),
  phone: varchar('phone', { length: 20 }),
});

export const analytics = pgTable('analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  views: integer('views').default(0).notNull(),
  plays: integer('plays').default(0).notNull(),
  downloads: integer('downloads').default(0).notNull(),
  country: varchar('country', { length: 100 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const profileViews = pgTable(
  'profile_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    country: varchar('country', { length: 100 }),
    device: varchar('device', { length: 50 }),
    browser: varchar('browser', { length: 50 }),
    referrer: text('referrer'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('profile_views_profile_id_idx').on(table.profileId),
    index('profile_views_created_at_idx').on(table.createdAt),
  ]
);

export type ProfileUser = typeof users.$inferSelect;
export type ProfileExperience = typeof experiences.$inferSelect;
export type ProfileProject = typeof projects.$inferSelect;
export type ProfileSocials = typeof socials.$inferSelect;
