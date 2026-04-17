import { renderDiscoveryScreen } from "./discovery-screen";
import {
  applyDiscoveryInteraction,
  createInitialDiscoveryState,
  type DiscoveryInteraction,
  type DiscoveryState,
} from "./discovery-state";
import {
  buildInboxThreadList,
  deriveMatchesFromDiscovery,
  renderInboxThreadList,
  renderMatchesScreen,
} from "./match-inbox-screen";
import { renderCollabPostScreen, renderProfileScreen, createProfileCollabViewModel } from "./profile-collab-screen";
import type { Stage1SeedBundle } from "./domain-model";

export const STAGE1_NAV_ROUTES = {
  ROOT: "/",
  DISCOVER: "/discover",
  COLLABS: "/collabs",
  MATCHES: "/matches",
  INBOX: "/inbox",
  PROFILE: "/profile",
} as const;

export type Stage1RoutePath = (typeof STAGE1_NAV_ROUTES)[keyof typeof STAGE1_NAV_ROUTES];

export interface Stage1MobileAppState {
  readonly current_route: Stage1RoutePath;
  readonly discovery_state: DiscoveryState;
}

export interface Stage1NavItem {
  readonly label: "Discover" | "Collabs" | "Matches" | "Inbox" | "Profile";
  readonly route: Stage1RoutePath;
}

export const STAGE1_DECLARED_ROUTES: readonly Stage1RoutePath[] = [
  STAGE1_NAV_ROUTES.ROOT,
  STAGE1_NAV_ROUTES.DISCOVER,
  STAGE1_NAV_ROUTES.COLLABS,
  STAGE1_NAV_ROUTES.MATCHES,
  STAGE1_NAV_ROUTES.INBOX,
  STAGE1_NAV_ROUTES.PROFILE,
] as const;

export const STAGE1_BOTTOM_NAV_ITEMS: readonly Stage1NavItem[] = [
  { label: "Discover", route: STAGE1_NAV_ROUTES.DISCOVER },
  { label: "Collabs", route: STAGE1_NAV_ROUTES.COLLABS },
  { label: "Matches", route: STAGE1_NAV_ROUTES.MATCHES },
  { label: "Inbox", route: STAGE1_NAV_ROUTES.INBOX },
  { label: "Profile", route: STAGE1_NAV_ROUTES.PROFILE },
] as const;

export function resolveStage1Route(pathname: string): Stage1RoutePath {
  switch (pathname) {
    case STAGE1_NAV_ROUTES.ROOT:
      return STAGE1_NAV_ROUTES.DISCOVER;
    case STAGE1_NAV_ROUTES.DISCOVER:
    case STAGE1_NAV_ROUTES.COLLABS:
    case STAGE1_NAV_ROUTES.MATCHES:
    case STAGE1_NAV_ROUTES.INBOX:
    case STAGE1_NAV_ROUTES.PROFILE:
      return pathname;
    default:
      return STAGE1_NAV_ROUTES.DISCOVER;
  }
}

export function createStage1MobileAppState(seed: Stage1SeedBundle, initialPath = STAGE1_NAV_ROUTES.ROOT): Stage1MobileAppState {
  return {
    current_route: resolveStage1Route(initialPath),
    discovery_state: createInitialDiscoveryState(seed, "prof_ava"),
  };
}

export function navigateStage1App(state: Stage1MobileAppState, pathname: string): Stage1MobileAppState {
  return {
    ...state,
    current_route: resolveStage1Route(pathname),
  };
}

export function applyStage1DiscoverAction(
  seed: Stage1SeedBundle,
  state: Stage1MobileAppState,
  action: DiscoveryInteraction,
): Stage1MobileAppState {
  return {
    ...state,
    discovery_state: applyDiscoveryInteraction(seed, state.discovery_state, action).state,
  };
}

function renderActiveRoute(seed: Stage1SeedBundle, state: Stage1MobileAppState): string {
  if (state.current_route === STAGE1_NAV_ROUTES.DISCOVER) {
    const deckState = {
      viewer_profile_id: state.discovery_state.actor_profile_id,
      cards: state.discovery_state.ordered_candidate_ids
        .map((candidateId) => {
          const candidate = seed.swipe_candidates.find((entry) => entry.candidate_id === candidateId);
          if (!candidate) return null;
          const profile = seed.profiles.find((entry) => entry.profile_id === candidate.profile_id);
          const collabIntent = seed.collab_intents.find((entry) => entry.intent_id === candidate.intent_id);
          if (!profile || !collabIntent) return null;
          return {
            card_id: candidate.candidate_id,
            musician_id: profile.profile_id,
            display_name: profile.display_name,
            role_chip: profile.primary_role,
            genre_chips: profile.genres,
            city: profile.city,
            bio: profile.bio,
            collab_intent_preview: collabIntent.summary,
            collab_intent_tags: collabIntent.tags,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
      cursor: state.discovery_state.cursor,
      decisions: state.discovery_state.decisions,
    };

    return renderDiscoveryScreen(deckState);
  }

  const matches = deriveMatchesFromDiscovery(seed, state.discovery_state);

  if (state.current_route === STAGE1_NAV_ROUTES.MATCHES) {
    return renderMatchesScreen(seed, matches);
  }

  if (state.current_route === STAGE1_NAV_ROUTES.INBOX) {
    const threads = buildInboxThreadList(seed, matches);
    return renderInboxThreadList(seed, threads);
  }

  const profileModel = createProfileCollabViewModel(seed, state.discovery_state);
  if (state.current_route === STAGE1_NAV_ROUTES.COLLABS) {
    return renderCollabPostScreen(profileModel, seed);
  }

  return renderProfileScreen(profileModel);
}

export function renderStage1MobileShell(seed: Stage1SeedBundle, state: Stage1MobileAppState): string {
  const activeScreen = renderActiveRoute(seed, state);

  const nav = STAGE1_BOTTOM_NAV_ITEMS.map((item) => {
    const active = item.route === state.current_route;
    return `<a href="${item.route}" data-stage1-route="${item.route}" style="display:grid;gap:4px;justify-items:center;text-decoration:none;color:${active ? "#fff" : "rgba(255,255,255,.65)"};font-size:11px;font-weight:${active ? "700" : "500"};">${item.label}</a>`;
  }).join("");

  return `<div data-stage1-mobile-shell="true" style="min-height:100vh;background:#090b17;">
    <section style="padding-bottom:78px;">${activeScreen}</section>
    <nav aria-label="Stage1 mobile navigation" style="position:fixed;left:0;right:0;bottom:0;margin:0 auto;max-width:420px;border-top:1px solid rgba(255,255,255,.14);background:rgba(9,11,23,.96);backdrop-filter:blur(6px);padding:10px 14px calc(10px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">${nav}</nav>
  </div>`;
}
