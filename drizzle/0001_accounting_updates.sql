CREATE TYPE "public"."commission_basis" AS ENUM('CONTRACT_PRICE', 'AMOUNT_COLLECTED');--> statement-breakpoint
CREATE TYPE "public"."commission_trigger" AS ENUM('ON_RESERVATION', 'ON_DOWN_PAYMENT', 'ON_PERCENT_PAID', 'ON_FULL_PAYMENT');--> statement-breakpoint
CREATE TYPE "public"."tax_party" AS ENUM('SELLER', 'BUYER', 'SHARED');--> statement-breakpoint
CREATE TYPE "public"."title_transfer_status" AS ENUM('NOT_STARTED', 'DEED_SIGNED', 'TAXES_PAID', 'SUBMITTED_TO_REGISTRY', 'TRANSFERRED');--> statement-breakpoint
ALTER TYPE "public"."commission_status" ADD VALUE 'ELIGIBLE' BEFORE 'PAID';--> statement-breakpoint
CREATE TABLE "commission_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"basis" "commission_basis" DEFAULT 'CONTRACT_PRICE' NOT NULL,
	"trigger" "commission_trigger" DEFAULT 'ON_DOWN_PAYMENT' NOT NULL,
	"trigger_percent" numeric(5, 2),
	"is_default" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_rules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "agents" ALTER COLUMN "commission_rate" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "agents" ALTER COLUMN "commission_rate" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "rule_id" text;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "rate" numeric(5, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "basis" "commission_basis" NOT NULL;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "eligible_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "payment_reference" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "reservation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "cgt_paid_by" "tax_party";--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "dst_paid_by" "tax_party";--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "transfer_tax_paid_by" "tax_party";--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "registration_fees_paid_by" "tax_party";--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "title_transfer_status" "title_transfer_status" DEFAULT 'NOT_STARTED' NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "deed_signed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "title_transferred_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "new_title_no" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "cancelled_by_id" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "refund_amount" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "title_no" text;--> statement-breakpoint
ALTER TABLE "lots" ADD COLUMN "tax_declaration_no" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "recorded_by_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "verified_by_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "voided_by_id" text;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_rule_id_commission_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."commission_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_one_open_per_lot" ON "contracts" USING btree ("lot_id") WHERE "contracts"."status" <> 'CANCELLED';