CREATE TYPE "public"."batch_transactions_status_enum" AS ENUM('awaiting_ai_analysis', 'failed', 'finished', 'awaiting_manual_approve');--> statement-breakpoint
CREATE TABLE "batch_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"credit_card_id" text,
	"file_hash" text NOT NULL,
	"data" jsonb,
	"user_id" text,
	"status" "batch_transactions_status_enum" DEFAULT 'awaiting_ai_analysis' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batch_transactions" ADD CONSTRAINT "batch_transactions_credit_card_id_credit_cards_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_transactions" ADD CONSTRAINT "batch_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;