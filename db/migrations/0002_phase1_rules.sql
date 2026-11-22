-- Phase 1 rules that need a trigger (ERD §6, AD-A-012). Each error starts with the INV ID.

-- INV-02, INV-03: a user column points to a user with the right role (BR-03, FR-ACC-06, FR-ACC-07).
CREATE FUNCTION app.require_role(p_user uuid, p_role app.user_role, p_rule text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_user IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app.app_user WHERE id = p_user AND role = p_role) THEN
    RAISE EXCEPTION '%: user % must have the role %', p_rule, p_user, p_role USING ERRCODE = 'check_violation';
  END IF;
END $$;
--> statement-breakpoint
CREATE FUNCTION app.thesis_instance_roles() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM app.require_role(NEW.student_user_id, 'student', 'INV-02');
  PERFORM app.require_role(NEW.adviser_user_id, 'adviser', 'INV-02');
  PERFORM app.require_role(NEW.created_by_user_id, 'coordinator', 'INV-02');
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER thesis_instance_roles BEFORE INSERT OR UPDATE ON app.thesis_instance
  FOR EACH ROW EXECUTE FUNCTION app.thesis_instance_roles();
--> statement-breakpoint
CREATE FUNCTION app.committee_member_role() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM app.require_role(NEW.member_user_id, 'panel_member', 'INV-03');
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER committee_member_role BEFORE INSERT OR UPDATE ON app.committee_member
  FOR EACH ROW EXECUTE FUNCTION app.committee_member_role();
--> statement-breakpoint
CREATE FUNCTION app.defense_substitute_role() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM app.require_role(NEW.substitute_user_id, 'panel_member', 'INV-03');
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER defense_substitute_role BEFORE INSERT OR UPDATE ON app.defense_substitute
  FOR EACH ROW EXECUTE FUNCTION app.defense_substitute_role();
--> statement-breakpoint

-- INV-05: no new commit while the Submission PR is locked (BR-07, FR-REV-02).
CREATE FUNCTION app.manuscript_commit_unlocked() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM app.submission_pr WHERE id = NEW.submission_pr_id AND locked_at IS NOT NULL) THEN
    RAISE EXCEPTION 'INV-05: the manuscript is locked' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER manuscript_commit_unlocked BEFORE INSERT ON app.manuscript_commit
  FOR EACH ROW EXECUTE FUNCTION app.manuscript_commit_unlocked();
--> statement-breakpoint

-- INV-08: append-only tables accept INSERT only (BR-19, NFR-03).
CREATE FUNCTION app.append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'INV-08: % is append-only (% refused)', TG_TABLE_NAME, TG_OP USING ERRCODE = 'insufficient_privilege';
END $$;
--> statement-breakpoint
CREATE TRIGGER manuscript_commit_append_only BEFORE UPDATE OR DELETE ON app.manuscript_commit
  FOR EACH ROW EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER manuscript_commit_no_truncate BEFORE TRUNCATE ON app.manuscript_commit
  FOR EACH STATEMENT EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER document_file_append_only BEFORE UPDATE OR DELETE ON app.document_file
  FOR EACH ROW EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER document_file_no_truncate BEFORE TRUNCATE ON app.document_file
  FOR EACH STATEMENT EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER document_event_append_only BEFORE UPDATE OR DELETE ON app.document_event
  FOR EACH ROW EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER document_event_no_truncate BEFORE TRUNCATE ON app.document_event
  FOR EACH STATEMENT EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER gate_action_append_only BEFORE UPDATE OR DELETE ON app.gate_action
  FOR EACH ROW EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER gate_action_no_truncate BEFORE TRUNCATE ON app.gate_action
  FOR EACH STATEMENT EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER audit_record_append_only BEFORE UPDATE OR DELETE ON app.audit_record
  FOR EACH ROW EXECUTE FUNCTION app.append_only();
--> statement-breakpoint
CREATE TRIGGER audit_record_no_truncate BEFORE TRUNCATE ON app.audit_record
  FOR EACH STATEMENT EXECUTE FUNCTION app.append_only();
--> statement-breakpoint

-- INV-26: a running milestone keeps its template version (FR-TPL-04).
CREATE FUNCTION app.milestone_template_frozen() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.template_version_id IS DISTINCT FROM OLD.template_version_id THEN
    RAISE EXCEPTION 'INV-26: the template version of a milestone never changes' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER milestone_template_frozen BEFORE UPDATE ON app.milestone_instance
  FOR EACH ROW EXECUTE FUNCTION app.milestone_template_frozen();
--> statement-breakpoint

-- INV-34: a linked commit belongs to the same milestone (Guidelines B.17, C.23).
CREATE FUNCTION app.document_record_commit_milestone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.linked_commit_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM app.manuscript_commit c JOIN app.submission_pr p ON p.id = c.submission_pr_id
    WHERE c.id = NEW.linked_commit_id AND p.milestone_instance_id = NEW.milestone_instance_id
  ) THEN
    RAISE EXCEPTION 'INV-34: the linked commit is not in the same milestone' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER document_record_commit_milestone BEFORE INSERT OR UPDATE ON app.document_record
  FOR EACH ROW EXECUTE FUNCTION app.document_record_commit_milestone();
