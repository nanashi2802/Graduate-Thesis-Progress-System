-- Rules for clearance_item (ERD §6, AD-A-029).
-- Only a Coordinator verifies an item (BR-02, FR-CLR-02).
CREATE FUNCTION app.clearance_item_role() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM app.require_role(NEW.verified_by_user_id, 'coordinator', 'BR-02');
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER clearance_item_role BEFORE INSERT ON app.clearance_item
  FOR EACH ROW EXECUTE FUNCTION app.clearance_item_role();
--> statement-breakpoint
-- Only Milestone 3 has a clearance checklist.
CREATE FUNCTION app.clearance_item_milestone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app.milestone_instance WHERE id = NEW.milestone_instance_id AND milestone_code = 'final') THEN
    RAISE EXCEPTION 'clearance items belong to Milestone 3 only' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER clearance_item_milestone BEFORE INSERT ON app.clearance_item
  FOR EACH ROW EXECUTE FUNCTION app.clearance_item_milestone();
--> statement-breakpoint
-- INV-08: append-only (BR-19).
CREATE TRIGGER clearance_item_append_only BEFORE UPDATE OR DELETE ON app.clearance_item
  FOR EACH ROW EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER clearance_item_no_truncate BEFORE TRUNCATE ON app.clearance_item
  FOR EACH STATEMENT EXECUTE FUNCTION app.append_only();
