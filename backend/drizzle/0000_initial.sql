CREATE TABLE IF NOT EXISTS "rooms" (
  "code" text PRIMARY KEY NOT NULL,
  "state" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
