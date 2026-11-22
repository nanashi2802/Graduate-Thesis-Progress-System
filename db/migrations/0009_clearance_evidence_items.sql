-- Evidence items of the Final template (FR-CLR-02, AD-A-030). The Student uploads one scan for each.
-- Version 1 only, and only where the item is missing. Not needed to confirm the defense date.
INSERT INTO app.template_required_item (template_version_id, form_code, label, paper_signers, uploader_role, needed_for_date_confirmation)
SELECT tv.id, i.form_code::app.form_code, i.label, NULL, 'student'::app.user_role, false
FROM app.template_version tv
JOIN app.milestone_template t ON t.id = tv.milestone_template_id AND tv.version_no = 1 AND t.code::text = 'final'
CROSS JOIN (VALUES
  ('FINAL_COPY', 'Final copy for the library'),
  ('CONFERENCE_CERT', 'Conference presentation certification'),
  ('JOURNAL_PUB', 'Journal publication copy or acceptance')
) AS i(form_code, label)
WHERE NOT EXISTS (
  SELECT 1 FROM app.template_required_item x
  WHERE x.template_version_id = tv.id AND x.form_code = i.form_code::app.form_code
);
