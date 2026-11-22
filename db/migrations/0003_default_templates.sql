-- The three default Milestone Templates, version 1 (FR-TPL-02, AD-A-015).
-- Values from the Unified Thesis Process §2.1, §2.5 and the TDW 08 and TDW 13 rubric.
INSERT INTO app.milestone_template (code, name) VALUES
  ('proposal', 'Proposal Defense'),
  ('pre_final', 'Pre-Final Defense'),
  ('final', 'Final Defense and Clearance')
ON CONFLICT (code) DO NOTHING;
--> statement-breakpoint
INSERT INTO app.template_version
  (milestone_template_id, version_no, panel_size_masters, panel_size_doctoral, printed_copies_masters, printed_copies_doctoral, change_note)
SELECT t.id, 1, v.pm, v.pd, 5, 6, 'Default template (FR-TPL-02)'
FROM app.milestone_template t
JOIN (VALUES ('proposal', 2, 3), ('pre_final', 2, 3), ('final', 3, 4)) AS v(code, pm, pd) ON v.code = t.code::text
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO app.template_required_item (template_version_id, form_code, label, paper_signers, uploader_role, needed_for_date_confirmation)
SELECT tv.id, i.form_code::app.form_code, i.label, i.signers, i.uploader::app.user_role, i.needed
FROM app.template_version tv
JOIN app.milestone_template t ON t.id = tv.milestone_template_id AND tv.version_no = 1
JOIN (VALUES
  ('proposal', 'TDW_03', 'Consultation and Monitoring Form', 'Adviser signs each row', 'adviser', true),
  ('proposal', 'TDW_05', 'Confidentiality and Non-Disclosure Agreement', 'Member and University representative', 'coordinator', true),
  ('proposal', 'TDW_06', 'Committee Appointment and Acceptance Form', 'Adviser and Panel Members accept. Program Chair recommends. Dean approves.', 'coordinator', true),
  ('proposal', 'TDW_07', 'Proposal Defense Endorsement Form', 'Adviser and Panel Members. Program Chair noted. Dean approved.', 'student', true),
  ('proposal', 'OR', 'Official Receipt', NULL, 'student', true),
  ('proposal', 'TDW_08', 'Proposal Evaluation Sheet', 'One sheet for each committee member', 'coordinator', false),
  ('pre_final', 'TDW_03', 'Consultation and Monitoring Form', 'Adviser signs each row', 'adviser', true),
  ('pre_final', 'TDW_09', 'Pre-Final Defense Endorsement Form', 'Adviser and Panel Members. Program Chair noted. Dean approved.', 'student', true),
  ('pre_final', 'OR', 'Official Receipt', NULL, 'student', true),
  ('pre_final', 'TDW_10', 'Pre-Final Defense Evaluation Sheet', 'One sheet for each committee member', 'coordinator', false),
  ('final', 'TDW_03', 'Consultation and Monitoring Form', 'Adviser signs each row', 'adviser', true),
  ('final', 'TDW_05', 'Confidentiality and Non-Disclosure Agreement', 'Member and University representative', 'coordinator', true),
  ('final', 'TDW_11', 'Panel on Oral Defense Appointment and Acceptance Form', 'Chair and Members accept. Program Chair recommends. Dean approves.', 'coordinator', true),
  ('final', 'TDW_12', 'Final Defense Endorsement Form', 'Adviser and Panel Members. Program Chair noted. Dean approved.', 'student', true),
  ('final', 'OR', 'Official Receipt', NULL, 'student', true),
  ('final', 'TDW_13', 'Final Defense Evaluation Sheet', 'One sheet for each Final Panel member', 'coordinator', false)
) AS i(code, form_code, label, signers, uploader, needed) ON i.code = t.code::text
WHERE NOT EXISTS (SELECT 1 FROM app.template_required_item x WHERE x.template_version_id = tv.id);
--> statement-breakpoint
INSERT INTO app.rubric_indicator (template_version_id, code, label, weight_pct)
SELECT tv.id, r.code, r.label, r.weight
FROM app.template_version tv
JOIN app.milestone_template t ON t.id = tv.milestone_template_id AND tv.version_no = 1 AND t.code IN ('proposal', 'final')
CROSS JOIN (VALUES
  ('A1', 'Contribution to the field', 10),
  ('A2', 'Substance and content', 20),
  ('A3', 'Methodology', 20),
  ('A4', 'Form and writing style', 10),
  ('B1', 'Organization', 10),
  ('B2', 'Delivery and oral articulation', 10),
  ('B3', 'Mastery of the topic', 20)
) AS r(code, label, weight)
ON CONFLICT DO NOTHING;
