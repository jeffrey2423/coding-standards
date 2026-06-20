---
title: Testing Strategy
platform: all
load_when: "Always. Defines test types, the pyramid, and coverage expectations."
updated: 2026-06
---

# Testing Strategy

Test-Driven Development is the default: write tests **before or alongside** implementation. A task is not done until its tests exist and pass 100%.

## The pyramid

```
        ╱ E2E ╲          few — critical user journeys only
      ╱ Integration ╲    some — features, repos, API contracts
    ╱   Unit tests    ╲  many — use cases, domain rules, components
```

- **MUST** cover every domain invariant and business rule with a unit test, including the violation case.
- **MUST** cover every use case (command/query handler) with a unit test.
- **MUST** keep ≥ 80% line coverage on Domain + Application layers.
- **SHOULD** test features end-to-end at the integration level (real DB via containers where applicable).
- **SHOULD** reserve E2E for critical paths (login, checkout, the few flows that must never break).

## By platform

| Platform | Unit | Component / Integration | Mocking |
|---|---|---|---|
| Backend (.NET) | xUnit | Integration tests with **Testcontainers** (real PostgreSQL); EF Core InMemory only for fast pure-unit cases | substitute ports/interfaces |
| Web (React) | Vitest | React Testing Library | **MSW** for API mocking |
| Flutter | `flutter_test` | widget + integration tests | `mocktail` |
| React Native | Jest / Vitest | RN Testing Library | MSW |

## Rules

- **MUST NOT** claim a test exists or passes unless it actually does. Never fabricate test results.
- **MUST** make tests deterministic — no reliance on wall-clock time, network, or ordering. Inject clocks and randomness.
- **MUST** run the full suite after each task; never proceed on a red suite.
- **SHOULD** name tests by behavior: `Confirm_WithNoLines_Throws`.
- **SHOULD** prefer real implementations over mocks for value objects and pure domain logic; mock only at architectural boundaries (ports).
- **SHOULD** add a regression test for every bug fixed.

## What good coverage looks like

Coverage percentage is a floor, not a goal. A meaningful suite proves: every business rule holds, every invariant rejects illegal input, and every critical user journey works against real infrastructure.
