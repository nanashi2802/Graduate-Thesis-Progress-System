# P0 spike — fake scan and manuscript sizes (P0-E06-T01)

**Compliance standard:** ASD-STE100 at about 80%
**Date:** 22 Nov 2026 · **Author:** `agent-b` · **Covers:** AS-11, AS-12, NFR-10, PRD §11.4
**Status:** Input to the spike report (`spec/spikes/P0-report.md`, P0-E06-T03). It decides nothing. AS-11 and AS-12 stay with the human.

## How the numbers were made

- `spec/spikes/fake_scans.py` draws the text of each TDW form (`docs/reference/tdw-forms/text/`) on a Letter page. It adds fake ink marks, a small tilt, blur and paper grain.
- It saves each page as JPEG and puts the JPEG pages into a PDF with no new encoding, as scanner software does.
- All data is fake. No real form, signature or name is used. The generated files are not committed. Run the script to make them again.
- Page counts are estimates from the text length (100 columns, 66 lines on each page). The real printed forms can have a different count (AS-12).

## Limits of this method

- A synthetic page has less texture than a real scan (paper fibers, stamps, folds, shadows). Real scans can be larger. Treat the numbers as a low estimate.
- PyMuPDF writes the fake manuscripts with no embedded fonts. A Word or LaTeX export embeds fonts and adds about 0.2 to 1 MB to each file. The manuscript MB per page is a low estimate too.
- The real answer for AS-11 needs the real files that the owner uploads (Functional Requirements AS-11).

## Results

| Form | Scan profile | Pages (estimate) | JPEG MB (all pages) | PDF MB | PDF MB per page |
| :---- | :---- | ----: | ----: | ----: | ----: |
| TDW 01 | Scanner 200 dpi gray | 1 | 0.11 | 0.12 | 0.12 |
| TDW 01 | Scanner 300 dpi gray | 1 | 0.20 | 0.21 | 0.21 |
| TDW 01 | Scanner 300 dpi color | 1 | 0.24 | 0.24 | 0.24 |
| TDW 01 | Phone photo 12 MP color | 1 | 0.66 | 0.66 | 0.66 |
| TDW 02 | Scanner 200 dpi gray | 2 | 0.43 | 0.43 | 0.22 |
| TDW 02 | Scanner 300 dpi gray | 2 | 0.75 | 0.75 | 0.37 |
| TDW 02 | Scanner 300 dpi color | 2 | 0.86 | 0.86 | 0.43 |
| TDW 02 | Phone photo 12 MP color | 2 | 1.84 | 1.84 | 0.92 |
| TDW 03 | Scanner 200 dpi gray | 1 | 0.10 | 0.10 | 0.10 |
| TDW 03 | Scanner 300 dpi gray | 1 | 0.18 | 0.18 | 0.18 |
| TDW 03 | Scanner 300 dpi color | 1 | 0.21 | 0.21 | 0.21 |
| TDW 03 | Phone photo 12 MP color | 1 | 0.62 | 0.62 | 0.62 |
| TDW 04 | Scanner 200 dpi gray | 1 | 0.16 | 0.16 | 0.16 |
| TDW 04 | Scanner 300 dpi gray | 1 | 0.28 | 0.28 | 0.28 |
| TDW 04 | Scanner 300 dpi color | 1 | 0.31 | 0.32 | 0.32 |
| TDW 04 | Phone photo 12 MP color | 1 | 0.77 | 0.77 | 0.77 |
| TDW 05 | Scanner 200 dpi gray | 3 | 0.69 | 0.70 | 0.23 |
| TDW 05 | Scanner 300 dpi gray | 3 | 1.19 | 1.20 | 0.40 |
| TDW 05 | Scanner 300 dpi color | 3 | 1.37 | 1.37 | 0.46 |
| TDW 05 | Phone photo 12 MP color | 3 | 2.88 | 2.88 | 0.96 |
| TDW 06 | Scanner 200 dpi gray | 1 | 0.10 | 0.11 | 0.11 |
| TDW 06 | Scanner 300 dpi gray | 1 | 0.19 | 0.20 | 0.20 |
| TDW 06 | Scanner 300 dpi color | 1 | 0.22 | 0.23 | 0.23 |
| TDW 06 | Phone photo 12 MP color | 1 | 0.64 | 0.64 | 0.64 |
| TDW 07 | Scanner 200 dpi gray | 1 | 0.12 | 0.12 | 0.12 |
| TDW 07 | Scanner 300 dpi gray | 1 | 0.21 | 0.21 | 0.21 |
| TDW 07 | Scanner 300 dpi color | 1 | 0.25 | 0.25 | 0.25 |
| TDW 07 | Phone photo 12 MP color | 1 | 0.67 | 0.68 | 0.68 |
| TDW 08 | Scanner 200 dpi gray | 2 | 0.26 | 0.26 | 0.13 |
| TDW 08 | Scanner 300 dpi gray | 2 | 0.45 | 0.45 | 0.23 |
| TDW 08 | Scanner 300 dpi color | 2 | 0.52 | 0.53 | 0.26 |
| TDW 08 | Phone photo 12 MP color | 2 | 1.38 | 1.39 | 0.69 |
| TDW 09 | Scanner 200 dpi gray | 1 | 0.12 | 0.12 | 0.12 |
| TDW 09 | Scanner 300 dpi gray | 1 | 0.21 | 0.21 | 0.21 |
| TDW 09 | Scanner 300 dpi color | 1 | 0.24 | 0.25 | 0.25 |
| TDW 09 | Phone photo 12 MP color | 1 | 0.67 | 0.67 | 0.67 |
| TDW 10 | Scanner 200 dpi gray | 2 | 0.17 | 0.17 | 0.09 |
| TDW 10 | Scanner 300 dpi gray | 2 | 0.31 | 0.31 | 0.16 |
| TDW 10 | Scanner 300 dpi color | 2 | 0.37 | 0.37 | 0.18 |
| TDW 10 | Phone photo 12 MP color | 2 | 1.16 | 1.17 | 0.58 |
| TDW 11 | Scanner 200 dpi gray | 1 | 0.11 | 0.11 | 0.11 |
| TDW 11 | Scanner 300 dpi gray | 1 | 0.20 | 0.20 | 0.20 |
| TDW 11 | Scanner 300 dpi color | 1 | 0.23 | 0.24 | 0.24 |
| TDW 11 | Phone photo 12 MP color | 1 | 0.65 | 0.65 | 0.65 |
| TDW 12 | Scanner 200 dpi gray | 1 | 0.11 | 0.11 | 0.11 |
| TDW 12 | Scanner 300 dpi gray | 1 | 0.20 | 0.20 | 0.20 |
| TDW 12 | Scanner 300 dpi color | 1 | 0.23 | 0.24 | 0.24 |
| TDW 12 | Phone photo 12 MP color | 1 | 0.66 | 0.66 | 0.66 |
| TDW 13 | Scanner 200 dpi gray | 2 | 0.25 | 0.26 | 0.13 |
| TDW 13 | Scanner 300 dpi gray | 2 | 0.45 | 0.46 | 0.23 |
| TDW 13 | Scanner 300 dpi color | 2 | 0.52 | 0.52 | 0.26 |
| TDW 13 | Phone photo 12 MP color | 2 | 1.38 | 1.39 | 0.69 |

| Profile | Mean PDF MB per page | Max PDF MB per page |
| :---- | ----: | ----: |
| Scanner 200 dpi gray | 0.13 | 0.23 |
| Scanner 300 dpi gray | 0.24 | 0.40 |
| Scanner 300 dpi color | 0.27 | 0.46 |
| Phone photo 12 MP color | 0.71 | 0.96 |

| Fake manuscript (100 pages) | PDF MB | MB per page |
| :---- | ----: | ----: |
| Text only | 0.14 | 0.001 |
| One figure every 10 pages | 1.33 | 0.013 |
| One figure every 3 pages | 4.31 | 0.043 |

## First findings

- One TDW form scan is 0.1 to 1.2 MB as a scanner PDF. The 50 MB limit (NFR-10) is far above every case.
- A phone photo is about 3 times larger than a 300 dpi gray scan. A guide that asks for "scanner app, gray, 200 to 300 dpi" keeps the store small. This is a suggestion for the human, not a rule.
- The PRD §11.4 inputs (0.10 to 0.25 MB per page) match scans, not text manuscripts. A text manuscript with some figures is about 0.01 to 0.05 MB per page. The scanned signed copies (Gate 2, INV-22) are the large files. P0-E06-T03 updates the capacity estimate with this split.
