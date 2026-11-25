-- D-28 (FR-DOC-02, FR-DOC-06, FR-DOC-07, BR-12): Verify or Return only.
-- Old history rows keep `physical_received` and `mismatch` (INV-08). Live rows move, and
-- one new event explains each move. The actor is the actor of the newest event of the record.
INSERT INTO app.document_event (document_record_id, from_state, to_state, reason, actor_user_id)
SELECT r.id, r.state,
  CASE r.state WHEN 'mismatch' THEN 'returned'::app.document_state ELSE 'locked_as_submitted'::app.document_state END,
  CASE r.state WHEN 'mismatch' THEN 'A paper mismatch is now a Return (D-28).' ELSE 'The Physical received state is removed (D-28).' END,
  (SELECT e.actor_user_id FROM app.document_event e WHERE e.document_record_id = r.id ORDER BY e.id DESC LIMIT 1)
FROM app.document_record r
WHERE r.state IN ('mismatch', 'physical_received')
ORDER BY r.id;
--> statement-breakpoint
UPDATE app.document_record SET state = 'returned' WHERE state = 'mismatch';
--> statement-breakpoint
UPDATE app.document_record SET state = 'locked_as_submitted' WHERE state = 'physical_received';
--> statement-breakpoint
ALTER TABLE "app"."document_event" DROP CONSTRAINT "document_event_reason";--> statement-breakpoint
ALTER TABLE "app"."document_event" ADD CONSTRAINT "document_event_reason" CHECK ("app"."document_event"."to_state" <> 'returned' or length(trim(coalesce("app"."document_event"."reason", ''))) > 0);--> statement-breakpoint
ALTER TABLE "app"."document_record" ADD CONSTRAINT "document_record_live_state" CHECK ("app"."document_record"."state" not in ('physical_received', 'mismatch'));
--> statement-breakpoint
-- D-28: no new event goes into a removed state. Old rows stay (INV-08).
CREATE FUNCTION app.document_event_live_state() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.to_state IN ('physical_received', 'mismatch') THEN
    RAISE EXCEPTION 'D-28: the document state % is removed', NEW.to_state USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER document_event_live_state BEFORE INSERT ON app.document_event
  FOR EACH ROW EXECUTE FUNCTION app.document_event_live_state();
