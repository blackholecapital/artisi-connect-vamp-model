# FullBody | MobileV1 | WB | P2 — Constraint Pass Validation

**Stage:** `FullBody | MobileV1 | WB | P2`
**Branch:** `claude/validate-mobilev1-constraints-hC8ZV`
**Predecessor (expected):** `FullBody | MobileV1 | WA | P1` — MobileV1 constraint pass
**Frozen authority:** FullBody V2 (`xyz-factory-system/` + WA P1 / P1.1 / P3.0 landed profile layer)
**Worker isolation:** all output lives under `worker-wb/mobilev1-p2/` — no shared artifact mutated.

This is a **validation-only** pass. No constraint cell is populated, no profile
bucket is mutated, no authority file is touched.

---

## 1. WA P1 input inventory (expected vs. observed)

The instruction requires reviewing four WA P1 output artifacts. Expected
deliverables from a MobileV1 WA P1 constraint pass would be:

| Expected artifact | Observed in tree? | Location searched |
|---|---|---|
| `mobile_allowed` classification set | **NOT PRESENT** | `packages/contracts-core/src/profiles/compatibility-map.ts` — `MOBILE_OPTIMIZED_PROFILE.*.allowed` is `[]` in every bucket (shells, surfaces, routes, touchpoints, mounts) |
| `mobile_disabled` classification set | **NOT PRESENT** | same file — `MOBILE_OPTIMIZED_PROFILE.*.blocked` is `[]` in every bucket |
| `needs_foreman_review` list | **NOT PRESENT** | no `needs_foreman_review.md`, no `mobile_*` doc, no `WA-*` merge note under `packages/*`, `worker-*`, or `xyz-factory-system/` |
| files touched (WA P1 diff / merge notes) | **NOT PRESENT** | only `packages/contracts-core/WA-P1.1.merge-notes.md` exists — scope is the shared chassis *domain layer* (LIFECYCLE_STATES, SURFACE_IDS, …), explicitly **not** MobileV1 |

Search coverage:

- full-tree grep for `MobileV1 | mobile_v1 | mobile-v1 | Mobile V1` → 0 hits (case-insensitive)
- full-tree grep for `mobile_allowed | mobile_disabled | needs_foreman_review` → 0 hits
- git log on `claude/validate-mobilev1-constraints-hC8ZV` vs `main` → **no commits ahead**
  (single initial commit `6579318` on both branches; `git ls-remote origin` confirms `refs/heads/main` at the same SHA)

**Finding.** A MobileV1 `WA P1` constraint pass has not been delivered into
this tree. The landed MobileV1 scaffold is WA P3.0's empty-bucket placeholder
(`MOBILE_OPTIMIZED_PROFILE`, `chassis_profile_status: "derived"`,
`derivation_mode: "subset_of_full_body"`, every exposure bucket `[]`) —
explicitly documented in `packages/contracts-core/src/profiles/compatibility-map.ts:91-111`
as "no exposure decided" pending canonical authority.

---

## 2. Constraint-only validation (no redesign / no fork / no drift)

With no WA P1 outputs present, the constraint-only validation collapses to a
static-state audit against the frozen FullBody V2 authority.

| Check | Expected | Observed | Result |
|---|---|---|---|
| No redesign of chassis domain | `packages/contracts-core/src/chassis/domain.ts` untouched since WA P1.1 | unchanged | pass |
| No authority fork | `MOBILE_OPTIMIZED_PROFILE.chassis_profile_status === "derived"` | `"derived"` | pass |
| No lifecycle fork | `packages/lifecycle-chassis/src/*.lifecycle.ts` untouched | unchanged | pass |
| No install-path fork | `packages/validation-chassis/src/install-chain.validator.ts` untouched; `xyz-factory-system/stage-6-software/production/install/**` untouched | unchanged | pass |
| No schema/registry authority drift | `packages/schema-chassis/**`, `packages/registry-chassis/**`, `xyz-factory-system/invariants/chassis/schemas/**`, `xyz-factory-system/stage-6-software/registries/**` untouched | unchanged | pass |
| `derivation_mode === "subset_of_full_body"` | required for MobileV1 | `"subset_of_full_body"` | pass |
| No new `ProfileId` or `ChassisProfileStatus` invented | required | `PROFILE_IDS` = `{ FULL_BODY, MOBILE_OPTIMIZED, PC_OPTIMIZED }` — unchanged | pass |

**Constraint-only status:** derivative-safe *by absence*. Nothing in the tree
violates the WA P3.0 subset rule because nothing populates the MobileV1 buckets
at all. This is **not** the same as "MobileV1 constraint pass validated" — it
is "no constraint pass exists to violate the rule".

---

## 3. Disabled exposure point audit

Every disabled item must be (a) explicit, (b) profile/presentation level only,
(c) not silently deleted, and (d) not removed from canonical authority sources.

Observed disabled exposure points in `MOBILE_OPTIMIZED_PROFILE`:

| Bucket | `.blocked` contents | Explicit? | Presentation-level only? | Removed from canonical source? |
|---|---|---|---|---|
| `shells` | `[]` | n/a (empty) | n/a | no — `SHELL_OWNER_IDS.FACTORY` still declared in chassis domain |
| `surfaces` | `[]` | n/a | n/a | no — `SURFACE_IDS.CLI_FACTORY`, `SURFACE_IDS.API_FACTORY` still declared |
| `routes` | `[]` | n/a | n/a | no — `ROUTE_IDS.CHASSIS_{INSTALL,UPDATE,DISABLE,REMOVE}` still declared |
| `touchpoints` | `[]` | n/a | n/a | no — `TOUCHPOINT_IDS.{CLI_INSTALL,CLI_UPDATE,API_DISABLE,API_REMOVE}` still declared |
| `mounts` | `[]` | n/a | n/a | no — mount touchpoint ids still declared |

No disabled item exists to audit. Canonical authority sources for every id
kind remain intact in `packages/contracts-core/src/chassis/domain.ts`,
`packages/registry-chassis/src/*-registry.ts`,
`apps/core-runtime/src/routes/*.route.ts`,
`apps/core-runtime/src/touchpoints/*.touchpoint.ts`,
`apps/operator-shell/src/mounts/*.mount.ts`, and
`apps/web-public/src/mounts/*.mount.ts`.

---

## 4. Preserved-unchanged confirmation

| Domain | Files | Status |
|---|---|---|
| contracts | `packages/contracts-core/src/chassis/*.contract.ts` (7 files) | unchanged |
| schemas | `packages/schema-chassis/src/**`, `xyz-factory-system/invariants/chassis/schemas/*.schema.md` (8 files) | unchanged |
| registries | `packages/registry-chassis/src/*-registry.ts` (5 files), `xyz-factory-system/stage-6-software/registries/*.instance.md` (5 files), `xyz-factory-system/invariants/chassis/registry/*.md` (5 files) | unchanged |
| lifecycle / install chain | `packages/lifecycle-chassis/src/*.lifecycle.ts` (4 files), `xyz-factory-system/invariants/chassis/lifecycle/{install,update,disable,remove}.md`, `xyz-factory-system/stage-6-software/production/install/**`, `xyz-factory-system/stage-6-software/resolver/resolver-output-and-install-stamp.md`, `packages/validation-chassis/src/install-chain.validator.ts` | unchanged |
| typed domains (WA P1.1) | `packages/contracts-core/src/chassis/domain.ts`, `packages/contracts-core/src/chassis/index.ts`, `packages/contracts-core/src/index.ts` | unchanged |
| profile layer (WA P3.0) | `packages/contracts-core/src/profiles/profile-domain.ts`, `packages/contracts-core/src/profiles/compatibility-map.ts`, `packages/contracts-core/src/profiles/index.ts` | unchanged |
| compatibility validators (WB P3.1) | `packages/validation-chassis/src/{compatibility,shell-surface,shell-mount,mount-compatibility,profile-runtime-gate}.validator.ts`, `packages/validation-chassis/src/failure-codes.ts`, `packages/validation-chassis/src/index.ts` | unchanged |
| retained proof-path status | `packages/proof-chassis/**`, `apps/core-runtime/src/routes/proof.ts`, `apps/core-runtime/src/touchpoints/proof.ts`, `apps/operator-shell/src/app/layout/shell.layout.proof.ts`, `apps/operator-shell/src/mounts/proof.ts`, `apps/web-public/src/mounts/proof.ts`, `xyz-factory-system/stage-6-software/qc/*-proof.md` | unchanged |

`git diff main..HEAD` on branch `claude/validate-mobilev1-constraints-hC8ZV`
returns an empty set (apart from this validation-report doc). **No canonical
authority file is mutated by this P2 validation pass, and no upstream MobileV1
change exists anywhere in the tree to mutate one.**

---

## 5. Findings tables

### 5.1 `approved_mobile_constraints`

| Profile | Bucket | Id | Action (allowed/optional) | Derivation source | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | **EMPTY.** No MobileV1 constraint was produced by WA P1; nothing is available to approve. |

### 5.2 `blocked_mobile_constraints`

| Profile | Bucket | Id | Reason | Upstream rule violated | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | **EMPTY.** No MobileV1 constraint was produced by WA P1; nothing is available to block. |

### 5.3 `needs_foreman_review`

| # | Item | Severity | Reason | Required foreman action |
|---|---|---|---|---|
| FR-1 | Absence of any `FullBody \| MobileV1 \| WA \| P1` deliverable in tree | **blocking** | WB P2 cannot validate a constraint pass that was never landed. `MOBILE_OPTIMIZED_PROFILE` still carries the WA P3.0 empty-bucket scaffold with no `allowed` / `blocked` / `optional` cells populated. | Confirm WA P1 scope, re-run or merge the WA P1 pass, then re-enter WB P2 for validation. |
| FR-2 | Stage-tag mismatch between task (`FullBody \| MobileV1 \| WB \| P2`) and tree state (still at WA P3.0 scaffold + WB P3.1 validators) | medium | The next stage in the validation chain presupposes a MobileV1 constraint delivery that is not visible to this worker. | Foreman decides whether WB P2 should (a) wait, (b) be retried after WA P1 lands, or (c) be re-scoped as a WB-side constraint draft under a new WB instruction. |
| FR-3 | Provisional MobileV1 heuristics held in `worker-wb/p3-prep/compatibility-prep.md` §3 (`pc-compatible` / `shared` columns) | informational | These heuristics were explicitly marked `unresolved` pending WA, and have not been promoted. WB P2 must not promote them without WA authority. | Confirm that no downstream stage is treating the provisional columns as authoritative. |

---

## 6. Files touched by this stage

| File | Kind | Purpose |
|---|---|---|
| `worker-wb/mobilev1-p2/validation-report.md` | new, worker-isolated | this document |

No other file is created, edited, or deleted. No `apps/*`, no `packages/*`, no
`xyz-factory-system/*`, no `worker-wb/p{2,2.1,3,3.1,4,4.2,4.4,4.6,4.7}*` file
is touched. The branch diff against `origin/main` consists of this single new
worker-isolated document.

---

## 7. Flag scan (instruction §7 — fail-fast triggers)

| Trigger | Observed? | Detail |
|---|---|---|
| FullBody authority file mutation | **NO** | `xyz-factory-system/**` and `packages/contracts-core/src/chassis/**` unchanged |
| install-chain mutation | **NO** | install/resolver/stamped artifacts unchanged; `install-chain.validator.ts` unchanged |
| lifecycle mutation | **NO** | `packages/lifecycle-chassis/src/*.lifecycle.ts` and `xyz-factory-system/invariants/chassis/lifecycle/*.md` unchanged |
| hidden removal | **NO** | no `allowed`/`blocked`/`optional` cell was removed because none existed to remove; FullBody `allowed` sets are byte-identical to WA P3.0 landing |
| Mobile-specific structural invention | **NO** | no new `ProfileId`, `ChassisProfileStatus`, `DerivationMode`, or chassis id was added for MobileV1 |
| PC/mobile mixed exposure left unresolved | **YES (pre-existing)** | both derived profiles still carry the fully-empty WA P3.0 scaffold; neither is mixed, both are unresolved. Flagged under FR-1 / FR-2, not introduced by this stage. |

No fail-fast trigger is attributable to this P2 stage. The single flagged
condition (`PC/mobile mixed exposure left unresolved`) is inherited from the
WA P3.0 state and is surfaced to foreman review rather than silently absorbed.

---

## 8. Operator verification checklist

| Gate | Required | Status |
|---|---|---|
| MobileV1 remains a constrained derivative of FullBody V2 | `chassis_profile_status=derived`, `derivation_mode=subset_of_full_body`, and no id outside FullBody's `allowed` set | **pass (trivially)** — structure intact, but constraint set is empty |
| Disabled items are explicit and reversible | every `.blocked` entry names an existing FullBody id and can be moved back to `.allowed` | **vacuously pass** — no `.blocked` entries exist |
| No canonical authority drift occurred | every file under §4 unchanged | **pass** |
| Unresolved conflicts are surfaced clearly | each unresolved item carries an FR-* row in §5.3 | **pass** |

Because the `MobileV1 constraint pass is validated as derivative-safe` pass
condition requires an actual WA P1 constraint pass to validate, and none
exists, the overall stage cannot be marked `pass`. The individual operator
gates are either trivially satisfied or flagged for foreman review.

**Recommended operator disposition:** hold at `needs_foreman_review` per FR-1.
Do NOT advance to `FullBody | MobileV1 | FM | V1.freeze-prep` until WA P1
MobileV1 outputs land and this P2 validation is re-run against a real
constraint set.

---

## 9. Validation notes on files touched

No files were touched by any WA P1 MobileV1 pass (because no such pass exists
in this tree). The only file touched by WB P2 is this report. Consequences:

- `git diff main..HEAD` = `worker-wb/mobilev1-p2/validation-report.md` only
- Zero risk of merge conflict against any peer worker branch
- Zero risk of drift against `xyz-factory-system/` frozen authority
- Zero risk of regression in `packages/validation-chassis/**` WB P3.1 validators
- The WB P3.1 `validateProfile*` family will continue to emit `skipped` with
  `failure_code_if_resolved=profile_<kind>_unresolved` for any MobileV1
  membership query, which is the correct post-WA-P3.0 behavior until WA P1
  MobileV1 lands

---

## 10. Canonical authority unchanged — confirmation

Confirmed. The following frozen authority paths are byte-identical to
`origin/main`:

- `xyz-factory-system/invariants/chassis/types/*.contract.md` (8 files)
- `xyz-factory-system/invariants/chassis/schemas/*.schema.md` (8 files)
- `xyz-factory-system/invariants/chassis/lifecycle/{install,update,disable,remove}.md`
- `xyz-factory-system/invariants/chassis/registry/*.md` (5 files)
- `xyz-factory-system/invariants/policies/*.md` (4 files)
- `xyz-factory-system/stage-6-software/**` (manifests, registries, bindings, resolver, production install, qc)
- `packages/contracts-core/src/chassis/**`
- `packages/contracts-core/src/profiles/**`
- `packages/{schema,registry,lifecycle,runtime-bridge,session-transport,policy,proof}-chassis/**`
- `packages/validation-chassis/src/{install-chain,mount,route-surface,touchpoint-surface,touchpoint-event,trigger-event,lifecycle-transition,schema,id-domain}.validator.ts`
- `packages/validation-chassis/src/{compatibility,shell-surface,shell-mount,mount-compatibility,profile-runtime-gate}.validator.ts`
- `apps/{core-runtime,operator-shell,web-public,local-host}/src/**`

---

## 11. Tag packet

```yaml
expected_tag: "FullBody | MobileV1 | WB | P2"
actual_tag:   "FullBody | MobileV1 | WB | P2"
result:       needs_foreman_review
failure_code: wa_p1_mobilev1_outputs_missing
retryable:    true
next_stage:   "FullBody | MobileV1 | WA | P1"   # re-run / deliver WA P1 before returning to WB P2
```

**Pass condition NOT met.** The mobile constraint pass cannot be validated as
derivative-safe because no WA P1 MobileV1 constraint pass exists in this tree
to validate. Canonical authority is intact, no drift or fork was introduced,
and the single blocking issue (FR-1) is surfaced explicitly for foreman
disposition. Once WA P1 MobileV1 lands, this stage is retryable without
rework: re-run WB P2 against the new `MOBILE_OPTIMIZED_PROFILE` buckets and
reclassify into the `approved_mobile_constraints` / `blocked_mobile_constraints`
tables above.

On successful retry, the intended next stage is
`FullBody | MobileV1 | FM | V1.freeze-prep`.
