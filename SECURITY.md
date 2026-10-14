# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Report it privately through GitHub: **Security → Report a vulnerability** on this repository
(GitHub private vulnerability reporting). Include what is affected, steps to reproduce and the
impact you expect. You will get an acknowledgement within 7 days; please allow a reasonable delay
for a fix before any public disclosure.

## Scope

In scope: the game page (`dist/era-xv.html`, `dist/era-xv.standalone.html`), challenge-link
verification, live-room presence handling and the analytics wrapper. Out of scope: the hosting
platform itself, and issues in third-party dependencies already tracked upstream.

## What is already in place

- No server and no account: everything a player owns stays in the browser's local storage.
- Challenge links and live-room presence are treated as untrusted input: shapes are validated,
  scores are recomputed from the picks, names are stripped of control and bidi characters.
- React is loaded from cdnjs with Subresource Integrity; the standalone build carries a CSP that
  forbids network access.
- Analytics carry enumerated ids and numbers only, never names, links or free text.
- Dependencies are watched by Dependabot and `npm audit` runs in CI.
