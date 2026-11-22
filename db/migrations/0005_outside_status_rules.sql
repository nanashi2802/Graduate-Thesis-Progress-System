-- Rules for outside_status_event (ERD §6, AD-A-017).
-- INV-27: only a Coordinator writes it (FR-WFL-10, BR-14). The check constraint covers the value.
CREATE FUNCTION app.outside_status_event_role() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM app.require_role(NEW.set_by_user_id, 'coordinator', 'INV-27');
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER outside_status_event_role BEFORE INSERT ON app.outside_status_event
  FOR EACH ROW EXECUTE FUNCTION app.outside_status_event_role();
--> statement-breakpoint
-- INV-08: append-only (BR-19, NFR-03).
CREATE TRIGGER outside_status_event_append_only BEFORE UPDATE OR DELETE ON app.outside_status_event
  FOR EACH ROW EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER outside_status_event_no_truncate BEFORE TRUNCATE ON app.outside_status_event
  FOR EACH STATEMENT EXECUTE FUNCTION app.append_only();
