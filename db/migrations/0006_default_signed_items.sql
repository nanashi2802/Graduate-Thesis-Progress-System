-- The signed-paper items of version 1 (FR-WFL-06, INV-34, AD-A-023).
-- CERTIFICATION: one paper signed by the committee, at the Proposal.
-- SIGNED_FINAL_MANUSCRIPT: the signed final manuscript, at the Final.
-- The Student uploads it. It is not needed to confirm the defense date. Version 1 only, and only
-- where the item is missing, so a database that already has the item keeps its row.
INSERT INTO app.template_required_item (template_version_id, form_code, label, paper_signers, uploader_role, needed_for_date_confirmation)
SELECT tv.id, i.form_code::app.form_code, i.label, i.signers, 'student'::app.user_role, false
FROM app.template_version tv
JOIN app.milestone_template t ON t.id = tv.milestone_template_id AND tv.version_no = 1
JOIN (VALUES
  ('proposal', 'CERTIFICATION', 'Certification of Proposal Approval', 'Every committee member'),
  ('final', 'SIGNED_FINAL_MANUSCRIPT', 'Signed final manuscript', 'Panel Members, Adviser, Program Chair and Dean')
) AS i(code, form_code, label, signers) ON i.code = t.code::text
WHERE NOT EXISTS (
  SELECT 1 FROM app.template_required_item x
  WHERE x.template_version_id = tv.id AND x.form_code = i.form_code::app.form_code
);
