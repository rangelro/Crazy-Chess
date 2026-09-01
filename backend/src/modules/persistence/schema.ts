import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
export const rooms = pgTable('rooms', { code: text('code').primaryKey(), state: text('state').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow() });
