// Upstream authority: xyz-factory-system (Full Body as authority-rich superset)
// DOWNSTREAM STATUS: non-authoritative — profile constraint layer only.
//
// WA P3.0 — canonical compatibility map (scaffold).
// WA P1    — MobileV1 first constrained derivation pass (this commit).
//
// Three profiles are scaffolded:
//
//   FULL_BODY_PROFILE        — authority-rich superset; allows every
//                              chassis id currently registered.
//   MOBILE_OPTIMIZED_PROFILE — derived; WA P1 constrained derivation
//                              applied against FULL_BODY superset.
//   PC_OPTIMIZED_PROFILE     — derived; constraint set unresolved.
//
// WA P1 derivation rules (MobileV1 only):
//   * MobileV1 is CONSTRAINED from FULL_BODY — it is not redesigned.
//   * Every id listed in Mobile buckets already exists in FULL_BODY
//     `allowed`. No new ids are invented.
//   * No canonical authority, lifecycle, install-law, schema, registry,
//     typed domain, or proof-path file is modified by this pass.
//   * Non-mobile exposure (CLI surface, CLI touchpoints, CLI mounts,
//     CLI-surface-bound routes) is placed in `blocked` (mobile_disabled)
//     — never silently removed.
//   * Any exposure whose mobile status cannot be decided without new
//     shell/presentation authority is placed in `optional`
//     (needs_foreman_review). This is explicit, not hidden drift.
//
// PC_OPTIMIZED_PROFILE remains empty. WA P1 is scoped to MobileV1 only.

import {
  SURFACE_IDS,
  ROUTE_IDS,
  TOUCHPOINT_IDS,
  SHELL_OWNER_IDS,
} from "../chassis/domain.js";
import {
  PROFILE_IDS,
  CHASSIS_PROFILE_STATUSES,
  DERIVATION_MODES,
  type ProfileConstraint,
  type ProfileId,
} from "./profile-domain.js";

// =============================================================================
// FULL BODY — authority-rich superset
// =============================================================================
// Every chassis id known to the registries lives in `allowed`. The
// `blocked` and `optional` buckets are empty by definition: Full Body is
// the source from which derived profiles subtract.
//
// Maintenance rule: when a new id lands in
// packages/contracts-core/src/chassis/domain.ts, it must also be added
// to the corresponding `allowed` bucket here in the SAME commit.
export const FULL_BODY_PROFILE: ProfileConstraint = {
  profile_id: PROFILE_IDS.FULL_BODY,
  chassis_profile_status: CHASSIS_PROFILE_STATUSES.AUTHORITY_RICH,
  derivation_mode: DERIVATION_MODES.NONE,
  shells: {
    allowed: [SHELL_OWNER_IDS.FACTORY],
    blocked: [],
    optional: [],
  },
  surfaces: {
    allowed: [SURFACE_IDS.CLI_FACTORY, SURFACE_IDS.API_FACTORY],
    blocked: [],
    optional: [],
  },
  routes: {
    allowed: [
      ROUTE_IDS.CHASSIS_INSTALL,
      ROUTE_IDS.CHASSIS_UPDATE,
      ROUTE_IDS.CHASSIS_DISABLE,
      ROUTE_IDS.CHASSIS_REMOVE,
    ],
    blocked: [],
    optional: [],
  },
  touchpoints: {
    allowed: [
      TOUCHPOINT_IDS.CLI_INSTALL,
      TOUCHPOINT_IDS.CLI_UPDATE,
      TOUCHPOINT_IDS.API_DISABLE,
      TOUCHPOINT_IDS.API_REMOVE,
    ],
    blocked: [],
    optional: [],
  },
  mounts: {
    allowed: [
      TOUCHPOINT_IDS.CLI_INSTALL,
      TOUCHPOINT_IDS.CLI_UPDATE,
      TOUCHPOINT_IDS.API_DISABLE,
      TOUCHPOINT_IDS.API_REMOVE,
    ],
    blocked: [],
    optional: [],
  },
};

// =============================================================================
// MOBILE OPTIMIZED — derived (WA P1 constrained pass)
// =============================================================================
// First constrained derivation of MobileV1 from frozen FULL_BODY V2.
//
// Bucket semantics for this pass:
//   allowed  → mobile_allowed          (exposed on MobileV1)
//   blocked  → mobile_disabled         (explicitly removed at profile /
//                                       presentation level — not silently)
//   optional → needs_foreman_review    (unresolved conflict; foreman must
//                                       decide before a later stage can
//                                       promote to allowed or blocked)
//
// Rationale (see WA P1 survey):
//
//   * sf.cli.factory — a CLI surface cannot be presented on a mobile
//     client. Disabled. All touchpoints/routes/mounts bound to this
//     surface are disabled alongside it.
//
//   * sf.api.factory — a factory API surface is reachable from a mobile
//     client in principle, but in FULL_BODY it is bound to shell.factory
//     via desktop shell implementations (operator-shell, web-public).
//     MobileV1 has no shell authority of its own, and WA P1 is forbidden
//     from inventing one. Surface routed to foreman review.
//
//   * shell.factory — the only shell owner in the canonical registry.
//     Its current mounts all live under desktop shells. WA P1 cannot
//     decide whether shell.factory is permitted to carry a MobileV1
//     presentation or whether a new (forbidden in P1) mobile shell owner
//     must later be authorized. Routed to foreman review.
//
//   * rt.chassis.disable / rt.chassis.remove — bound to sf.api.factory,
//     whose MobileV1 status is unresolved. Inherited foreman review.
//
//   * tp.api.disable / tp.api.remove — same unresolved-surface inheritance.
//     Destructive semantics compound the need for explicit foreman sign-off
//     before any mobile exposure.
//
//   * Mounts bound to CLI touchpoints follow the CLI surface into
//     `blocked`. Mounts bound to API touchpoints follow the API surface
//     into foreman review.
//
// Every id listed below already exists in FULL_BODY_PROFILE.allowed — no
// new ids are invented. No lifecycle path, install-law path, or runtime
// authority has been forked. No canonical authority file was modified.
export const MOBILE_OPTIMIZED_PROFILE: ProfileConstraint = {
  profile_id: PROFILE_IDS.MOBILE_OPTIMIZED,
  chassis_profile_status: CHASSIS_PROFILE_STATUSES.DERIVED,
  derivation_mode: DERIVATION_MODES.SUBSET_OF_FULL_BODY,
  shells: {
    allowed: [],
    blocked: [],
    // shell.factory: only shell owner in FULL_BODY. No mobile shell
    // authority exists. Foreman must decide whether shell.factory may
    // carry MobileV1 presentation before any surface can move to
    // `allowed`. WA P1 is forbidden from inventing new shell owners.
    optional: [SHELL_OWNER_IDS.FACTORY],
  },
  surfaces: {
    allowed: [],
    // sf.cli.factory: CLI surface cannot exist on a mobile client.
    blocked: [SURFACE_IDS.CLI_FACTORY],
    // sf.api.factory: reachable from mobile in principle, but bound to
    // shell.factory which is itself unresolved for MobileV1.
    optional: [SURFACE_IDS.API_FACTORY],
  },
  routes: {
    allowed: [],
    // rt.chassis.install, rt.chassis.update: consumed through the CLI
    // factory surface (see apps/core-runtime/src/routes/install.route.ts,
    // update.route.ts). With sf.cli.factory blocked, these routes have
    // no mobile exposure path.
    blocked: [ROUTE_IDS.CHASSIS_INSTALL, ROUTE_IDS.CHASSIS_UPDATE],
    // rt.chassis.disable, rt.chassis.remove: bound to sf.api.factory,
    // whose MobileV1 status is unresolved. Inherit foreman review.
    optional: [ROUTE_IDS.CHASSIS_DISABLE, ROUTE_IDS.CHASSIS_REMOVE],
  },
  touchpoints: {
    allowed: [],
    // tp.cli.install, tp.cli.update: CLI-surface touchpoints, disabled
    // in lockstep with sf.cli.factory.
    blocked: [TOUCHPOINT_IDS.CLI_INSTALL, TOUCHPOINT_IDS.CLI_UPDATE],
    // tp.api.disable, tp.api.remove: API-surface touchpoints inherit
    // foreman review from sf.api.factory. Destructive semantics make
    // explicit foreman sign-off mandatory.
    optional: [TOUCHPOINT_IDS.API_DISABLE, TOUCHPOINT_IDS.API_REMOVE],
  },
  mounts: {
    allowed: [],
    // CLI-surface mounts (apps/operator-shell/src/mounts/install.mount.ts,
    // update.mount.ts) are disabled alongside the CLI surface.
    blocked: [TOUCHPOINT_IDS.CLI_INSTALL, TOUCHPOINT_IDS.CLI_UPDATE],
    // API-surface mounts (apps/web-public/src/mounts/disable.mount.ts,
    // remove.mount.ts) inherit unresolved shell/surface status.
    optional: [TOUCHPOINT_IDS.API_DISABLE, TOUCHPOINT_IDS.API_REMOVE],
  },
};

// =============================================================================
// PC OPTIMIZED — derived (UNRESOLVED)
// =============================================================================
// Canonical PC derivation has not been published. WA P3.0 does NOT
// invent values. Every bucket is empty.
//
// Same derivation rule as Mobile: subset of Full Body, no invention,
// no rewrite of chassis structure.
export const PC_OPTIMIZED_PROFILE: ProfileConstraint = {
  profile_id: PROFILE_IDS.PC_OPTIMIZED,
  chassis_profile_status: CHASSIS_PROFILE_STATUSES.DERIVED,
  derivation_mode: DERIVATION_MODES.SUBSET_OF_FULL_BODY,
  shells: { allowed: [], blocked: [], optional: [] },
  surfaces: { allowed: [], blocked: [], optional: [] },
  routes: { allowed: [], blocked: [], optional: [] },
  touchpoints: { allowed: [], blocked: [], optional: [] },
  mounts: { allowed: [], blocked: [], optional: [] },
};

// =============================================================================
// PROFILE COMPATIBILITY MAP — central registry
// =============================================================================
// Single lookup point for every known profile constraint. Keyed by
// ProfileId so that runtime / future tooling can resolve a profile
// without importing each constant individually.
export const PROFILE_COMPATIBILITY_MAP: {
  readonly [K in ProfileId]: ProfileConstraint;
} = {
  [PROFILE_IDS.FULL_BODY]: FULL_BODY_PROFILE,
  [PROFILE_IDS.MOBILE_OPTIMIZED]: MOBILE_OPTIMIZED_PROFILE,
  [PROFILE_IDS.PC_OPTIMIZED]: PC_OPTIMIZED_PROFILE,
};

export function lookupProfile(profile_id: ProfileId): ProfileConstraint {
  return PROFILE_COMPATIBILITY_MAP[profile_id];
}

export function listProfiles(): readonly ProfileConstraint[] {
  return [
    FULL_BODY_PROFILE,
    MOBILE_OPTIMIZED_PROFILE,
    PC_OPTIMIZED_PROFILE,
  ];
}

// =============================================================================
// DERIVATION CONSTRAINTS (operator-facing reference)
// =============================================================================
// These are the rules a future stage must respect when populating Mobile
// or PC profiles. They are documentation, not runtime checks.
//
// ALLOWED operations on a derived profile:
//   * move an id from FULL_BODY allowed → derived allowed
//   * move an id from FULL_BODY allowed → derived blocked
//   * move an id from FULL_BODY allowed → derived optional
//
// BLOCKED operations on a derived profile (refuse and escalate):
//   * introduce an id that does not exist in FULL_BODY allowed
//   * fork a lifecycle path for the derived profile
//   * fork install-law / install-stamp behavior for the derived profile
//   * shift runtime authority into the derived profile
//   * narrow chassis contract types based on derived profile membership
//   * invent a new chassis_profile_status beyond authority_rich / derived
//   * invent a new derivation_mode beyond none / subset_of_full_body
//
// OPTIONAL items (allowed later, not now):
//   * additional shell owners (none planned in WA P3.0)
//   * additional surfaces beyond sf.cli.factory / sf.api.factory
//   * profile-specific touchpoint variants (only via constraint, never
//     via id rename)
//   * profile-level capability flags (must layer above this file, never
//     inside it, and never inside chassis/domain.ts)
