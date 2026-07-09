---
title: Code Review Checklist
platform: all
load_when: "Reviewing a change (PR or agent output) — the adversarial stance, per-facet checklist, severity rubric, and the done/not-done gate."
updated: 2026-07
---

# Code Review Checklist

Review adversarially: **verify claims against reality, doubt everything until proven.** "Tests pass" is a claim until you see them; "AC implemented" is a claim until you read the lines that implement it. The goal is specific, actionable findings — not a rubber stamp.

## Verify claims against reality

- **MUST** cross-check the actual diff against what the change *claims* to touch. A file changed but undocumented is a finding; a file claimed but unchanged is a higher-severity finding.
- **MUST** read the exact lines that implement each acceptance criterion. An item marked done (`[x]`) with no corresponding code is a **Critical** finding.
- **MUST** confirm tests exist and actually exercise the change — not that a report says so.

## Review by facet

| Facet | Look for |
|---|---|
| **Security** | Injection (SQL/command), XSS, hardcoded secrets, missing authorization/ownership checks, vulnerable dependencies. See [`security-quality-rules.md`](security-quality-rules.md). |
| **Correctness** | Off-by-one, null/empty/boundary handling, wrong operator, unhandled error paths, race conditions. |
| **Performance** | N+1 queries, work inside loops that belongs outside, unbounded result sets, missing pagination, needless allocations. |
| **Error handling** | Empty/`catch (Exception)` swallows, generic messages, errors logged without context, expected flows thrown as exceptions. |
| **Maintainability** | Magic numbers, unclear naming, over-long/complex functions, duplicated logic, dead or commented-out code. |
| **Test quality** | Assertions that can't fail (`expect(true).toBe(true)`), placeholders instead of real assertions, missing negative/edge cases, tests that don't touch the changed code. |

## Severity rubric

| Severity | Triggers |
|---|---|
| **Critical** | Task/AC marked done but code missing; security hole; data loss/corruption; build or suite broken. |
| **High** | An acceptance criterion not implemented; a real bug on a common path; a false claim about the change. |
| **Medium** | Bug on an edge path; missing test for new logic; undocumented change; notable smell. |
| **Low** | Style, naming, minor duplication, non-blocking nits. |

## Outcome gate

- **MUST** resolve every **Critical** and **High** finding (fix it, or convert it to a tracked action item) before the change is "done".
- **MUST** treat the change as **not done** while any acceptance criterion is unmet or the suite is red — regardless of how much code was written.
- **SHOULD** re-run the full suite and the quality gate after applying fixes, not just the changed tests.

> Before committing the reviewed change: use [Conventional Commits](https://www.conventionalcommits.org/), never commit straight to a protected branch, and commit only once the change is done per the gate above.
