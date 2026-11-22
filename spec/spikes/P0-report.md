# P0 spike report (P0-E06-T03)

**Compliance standard:** ASD-STE100 at about 80%
**Date:** 22 Nov 2026 · **Author:** `agent-b` · **Reviewer:** `agent-a` (`spec/BUILD_PLAN.md` §8 Phase 0 step 4)
**Covers:** AS-11, AS-12, AS-13, R12, R13, NFR-10, NFR-12, NFR-13, PRD §11.4
**Status:** Answers for the Phase 1 gate (`spec/BUILD_PLAN.md` §1, gate P1). The owner accepts or rejects this report. AS-11 and AS-12 stay open for the owner (AGENTS.md §4). This report gives estimates only.
**Inputs:** `spec/spikes/P0-scan-sizes.md` (P0-E06-T01), `spec/spikes/transfer_test.mjs` (P0-E06-T02), `spec/BUILD_PLAN.md` §2.7 storage facts (P0-E04, `agent-a`), the production deploy and cron run (P0-E05-T05).

## 1. Answers

| Item | Question | Answer | Status |
| :---- | :---- | :---- | :---- |
| AS-11 | MB per page (manuscript and TDW forms). Is 50 MB a good file limit? | Fake scans: 0.13 MB per page (200 dpi gray) to 0.71 MB per page (phone photo). Fake manuscripts: 0.001 to 0.043 MB per page. The largest single file in the model is a 200-page signed copy as phone photos, about 142 MB. Every other file is 15 MB or less. So 50 MB is safe for all forms and manuscripts. It is too small only for a full signed copy made of phone photos. | **Open for the owner.** Real files are still needed (FR AS-11). |
| AS-12 | TDW page counts and commits per milestone | Page counts from the form text: 1 to 3 pages for each form (13 forms). Commits per milestone: no data. The model uses 4, 5 and 8. | **Open for the owner.** The printed forms and real practice decide it. |
| AS-13 | Does the file store work? Do downloads count against the 5 GB transfer limit? | The file store works for every rule that P0-E04 needs (§2). 100 MB of downloads did not add to the project transfer number (§3). | Store: **answered.** Transfer: **answered for the project number.** A separate Object Storage limit is open for the human (§3). |
| R12 | The file store is a new service | No blocking issue. Four issues to note (§2.2). | **Answered** |
| R13 | Downloads may count against the 5 GB transfer limit | Not against the project transfer number. The typical month is about 2.2 GB of downloads, under 5 GB in any case (§3). | **Answered**, with one check for the human |

## 2. File store (R12, AS-13)

### 2.1 What works (P0-E04, `agent-a`, and P0-E06-T02)

| Check | Result | Rule |
| :---- | :---- | :---- |
| Signed PUT with `If-None-Match: *` | A second write to the same key gets HTTP 412. | INV-09, BR-19 |
| Signed `x-amz-checksum-sha256` | Other bytes get HTTP 400 `BadDigest`. | NFR-02 |
| Signed `content-length` and `content-type` | Another size or type gets HTTP 403. | NFR-10 |
| HEAD with checksum mode | Returns the stored SHA-256. The server checks it after upload. | NFR-02, DFD T3 |
| Range GET | HTTP 206. The PDF viewer loads page ranges. | PRD §11.3 |
| CORS | GET, HEAD and PUT for the three app origins only. Another origin gets HTTP 403. No DELETE. | NFR-12 |
| Browser upload of a 5.3 MB, 100-page PDF | Passes the hash check. No app request carries 64 KB or more. | PRD §11.3, NFR-12 |
| 20 MB upload and 5 downloads from Manila (P0-E06-T02) | Upload 1.5 s. Downloads 1.3 s to 6.7 s each. | NFR-13 |

### 2.2 Issues to note

| # | Issue | Effect | What to do |
| :---- | :---- | :---- | :---- |
| 1 | Neon Object Storage is a new Neon product. Its limits and prices can change. | The 5 GB file limit is a pilot limit only (PRD §11.4). | Check the limits again before release (R9). |
| 2 | The AWS SDK v3 adds its own CRC checksums by default. | Without a change, the signed SHA-256 does not match. | `src/server/files/storage.ts` sets `requestChecksumCalculation: "WHEN_REQUIRED"`. Keep it. |
| 3 | Each download in the T02 loop took longer than the one before (1.3, 2.7, 4.0, 5.3, 6.7 s for 20 MB). The cause is not known. It can be throttling, or one reused connection in the script. | A large file can open slowly after many reads. The viewer uses range reads, so this matters less. | Measure again in P1-E06 with the real viewer. `[CONFIRM]` |
| 4 | Usage numbers can lag. The project API showed no change in `data_transfer_bytes` 20 s after the downloads. | The human cannot see transfer use at once. | See §3. |

## 3. Transfer limit (R13, AS-13)

**Method (P0-E06-T02):** At 02:15 UTC on 22 Nov 2026, `spec/spikes/transfer_test.mjs` uploaded 20 MB of random bytes to `thesis-files/agent-b/spike/` and downloaded the file 5 times: 104,857,600 bytes in total. The Neon project field `data_transfer_bytes` (CLI `neon projects get`) was read before and after.

| Time (UTC) | `data_transfer_bytes` | Note |
| :---- | ----: | :---- |
| 02:14 | 556,083 | Before the test |
| 02:15 (downloads end, 02:15:13) | 556,083 | The project record shows `updated_at` 02:08:46 |
| 02:19 | 556,083 | The project record refreshed at 02:18:31, after the downloads. No change. |

**Answer:** The 100 MB of file downloads did **not** add to the project `data_transfer_bytes` field after the next refresh. That field counts Postgres compute transfer. So file downloads from Neon Object Storage do not use the Postgres 5 GB public transfer allowance, as far as the project API shows.

**Not answered:** The Neon project API shows no separate transfer number for Object Storage. The Neon plan can still limit or bill storage egress on its own, now or later (the product is new, §2.2 issue 1). The human must check the Usage page of the Neon console for an Object Storage transfer line. That page needs the owner's sign-in, so this spike cannot read it (AGENTS.md §13.5).

**Why it matters:** Downloads can be larger than the storage. A rough typical month for 20 active Students: each commit (5.5 MB) is read in full by the Adviser and 3 Panel Members, at 5 commits for each milestone, which is about 110 MB for each Student and milestone, or about 2.2 GB a month. That fits in 5 GB. The range viewer reads less than the full file. If storage egress is ever limited to 5 GB, the limit is about 45 Student-milestones a month.

## 4. Capacity estimate (PRD §11.4, updated)

The PRD estimate used 0.10 to 0.25 MB per page for every page. T01 shows that this is the size of a scan, not of a manuscript. A manuscript exported from Word or LaTeX is 10 to 100 times smaller. The large files are the scans: the TDW forms and the signed final copy (INV-22, INV-34). The new model splits the two.

| Input | Low | Typical | High |
| :---- | ----: | ----: | ----: |
| Manuscript pages | 100 | 120 | 200 |
| Manuscript MB per page (T01, plus 0.3 to 1 MB fonts for each file) | 0.013 | 0.043 | 0.043 |
| MB per commit | 1.6 | 5.5 | 9.6 |
| Commits per milestone (AS-12) | 4 | 5 | 8 |
| Commits in 3 milestones | 12 | 15 | 24 |
| Scanned form pages in the lifecycle (13 forms, NDAs and sheets for each member, ORs) | 40 | 40 | 50 |
| Scan MB per page (T01 profile) | 0.13 (200 dpi gray) | 0.24 (300 dpi gray) | 0.71 (phone photo) |
| Signed final copy | signature pages only, 1 MB | full scan, 120 pages | full scan, 200 pages |

| Case | Manuscripts | Forms | Signed final copy | Storage per Student | Full lifecycles in 5 GB |
| :---- | ----: | ----: | ----: | ----: | ----: |
| Low | 19 MB | 5 MB | 1 MB | about 25 MB | about 200 |
| Typical | 83 MB | 10 MB | 29 MB | about 120 MB | about 40 |
| High | 230 MB | 36 MB | 142 MB | about 410 MB | about 12 |

The old PRD typical case was about 315 MB for each Student (15 lifecycles). The new typical case is about 120 MB (40 lifecycles). The answer depends most on two choices for the owner:

1. **How the signed final copy is stored.** A full scan of 120 to 200 pages is 25% to 35% of the total. If only the signed pages are scanned and the text is the last commit, the storage falls by that amount.
2. **The scan guide.** A guide that asks for "scanner app, gray, 200 to 300 dpi" makes form scans 3 to 5 times smaller than phone photos.

The database (1 GB) is not a limit at this scale. Rows are small, and files are not in the database.

## 5. Open points for the owner

| # | Point | Default until the owner decides |
| :---- | :---- | :---- |
| 1 | AS-11: upload real sample files (one manuscript export, a few signed form scans) to confirm MB per page. | The T01 numbers |
| 2 | AS-12: confirm page counts of the printed forms and the usual commits per milestone. | 1 to 3 pages for each form, 5 commits per milestone |
| 3 | NFR-10: keep 50 MB as the file limit? It refuses a full signed copy made of phone photos (about 142 MB). | Keep 50 MB, and tell the Student to use a scanner app. |
| 4 | Signed final copy: full scan, or signed pages only? | Full scan (the safer record) |
| 5 | A scan guide for Students (profile and dpi) | A suggestion only, not a rule |
| 6 | Transfer limit (§3): check the Neon console Usage page for an Object Storage transfer line, and note its limit. | Assume file downloads do not use the 5 GB Postgres transfer allowance (§3). |
