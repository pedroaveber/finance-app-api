ALTER TABLE "transactions" ADD COLUMN "amount_in_cents" integer;
ALTER TABLE "pending_invoice_transactions" ADD COLUMN "amount_in_cents" integer;

UPDATE "transactions" SET "amount_in_cents" = ("amount" * 100)::integer;
UPDATE "pending_invoice_transactions" SET "amount_in_cents" = ("amount" * 100)::integer;

ALTER TABLE "transactions" DROP COLUMN "amount";
ALTER TABLE "pending_invoice_transactions" DROP COLUMN "amount";
