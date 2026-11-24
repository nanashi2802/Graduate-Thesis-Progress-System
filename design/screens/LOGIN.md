# LOGIN · Sign in

**Route:** `/login` · **Role:** Public · **Density:** comfortable · **FRs:** FR-ACC-01, FR-ACC-08

## Job
Let a person sign in with the account the Coordinator made for them.

## Regions
| # | Region | Pattern | Content |
| :---- | :---- | :---- | :---- |
| 1 | Masthead | App shell (no sidebar) | The 3 px maroon rule and the text wordmark "PUP CpE Thesis Progress". No logo (F1). |
| 2 | Sign-in form | Form, one column, 400 px | Email, password, "Sign in" (maroon), "Forgot password" text link |
| 3 | Note | One line | "Accounts are made by the CpE Thesis Coordinator." |

## States
| State | What shows |
| :---- | :---- |
| Default | The form |
| Error | One inline error under the form. It names the fix. It does not say which field was wrong. |
| Access denied (redirect) | A banner on the target page, not here (SITEMAP §2 rule 1) |

## Rules
- No self sign-up. The Coordinator makes accounts (FR-ACC-04, FR-ACC-05).
- After sign-in, go to the role's landing route.
