ALTER TABLE "notifications" ADD COLUMN "cursor_id" integer;

CREATE SEQUENCE "notifications_cursor_id_seq";

UPDATE "notifications"
SET "cursor_id" = subq.new_id
FROM (
  SELECT "id", row_number() OVER (ORDER BY "created_at") AS new_id
  FROM "notifications"
) AS subq
WHERE "notifications"."id" = subq."id";

SELECT setval('notifications_cursor_id_seq', COALESCE(max("cursor_id"), 1))
FROM "notifications";

ALTER TABLE "notifications" ALTER COLUMN "cursor_id" SET NOT NULL;
ALTER TABLE "notifications" ALTER COLUMN "cursor_id" SET DEFAULT nextval('notifications_cursor_id_seq');
ALTER SEQUENCE "notifications_cursor_id_seq" OWNED BY "notifications"."cursor_id";
