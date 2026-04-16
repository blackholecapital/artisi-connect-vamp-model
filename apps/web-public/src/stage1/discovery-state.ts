import type {
  CollabIntent,
  MusicianProfile,
  Stage1SeedBundle,
  SwipeCandidate,
} from "./domain-model";

export type DiscoveryInteraction = "pass" | "like";

export interface DiscoveryState {
  readonly actor_profile_id: string;
  readonly ordered_candidate_ids: readonly string[];
  readonly fallback_candidate_ids: readonly string[];
  readonly cursor: number;
  readonly decisions: Readonly<Record<string, DiscoveryInteraction>>;
  readonly liked_profile_ids: readonly string[];
  readonly passed_profile_ids: readonly string[];
}

export interface DiscoveryCard {
  readonly candidate: SwipeCandidate;
  readonly profile: MusicianProfile;
  readonly intent: CollabIntent;
}

export interface BrowseFallbackItem {
  readonly candidate_id: string;
  readonly decision: DiscoveryInteraction | "unseen";
  readonly profile: MusicianProfile;
  readonly intent: CollabIntent;
}

export interface DiscoveryTransition {
  readonly state: DiscoveryState;
  readonly active_card: DiscoveryCard | null;
  readonly deck_empty: boolean;
  readonly browse_fallback: readonly BrowseFallbackItem[];
}

function byDisplayName(a: DiscoveryCard, b: DiscoveryCard): number {
  return a.profile.display_name.localeCompare(b.profile.display_name) || a.candidate.candidate_id.localeCompare(b.candidate.candidate_id);
}

function buildCard(seed: Stage1SeedBundle, candidateId: string): DiscoveryCard {
  const candidate = seed.swipe_candidates.find((entry) => entry.candidate_id === candidateId);
  if (!candidate) throw new Error(`Unknown candidate_id: ${candidateId}`);

  const profile = seed.profiles.find((entry) => entry.profile_id === candidate.profile_id);
  if (!profile) throw new Error(`Unknown profile_id for candidate ${candidateId}: ${candidate.profile_id}`);

  const intent = seed.collab_intents.find((entry) => entry.intent_id === candidate.intent_id);
  if (!intent) throw new Error(`Unknown intent_id for candidate ${candidateId}: ${candidate.intent_id}`);

  return { candidate, profile, intent };
}

function nextCursor(state: DiscoveryState): number {
  let cursor = state.cursor;
  while (cursor < state.ordered_candidate_ids.length) {
    const candidateId = state.ordered_candidate_ids[cursor];
    if (!state.decisions[candidateId]) return cursor;
    cursor += 1;
  }
  return cursor;
}

export function createInitialDiscoveryState(seed: Stage1SeedBundle, actorProfileId: string): DiscoveryState {
  const orderedCandidateIds = seed.swipe_candidates.map((entry) => entry.candidate_id);
  const fallbackCandidateIds = orderedCandidateIds
    .map((candidateId) => buildCard(seed, candidateId))
    .sort(byDisplayName)
    .map((entry) => entry.candidate.candidate_id);

  return {
    actor_profile_id: actorProfileId,
    ordered_candidate_ids: orderedCandidateIds,
    fallback_candidate_ids: fallbackCandidateIds,
    cursor: 0,
    decisions: {},
    liked_profile_ids: [],
    passed_profile_ids: [],
  };
}

export function getActiveDiscoveryCard(seed: Stage1SeedBundle, state: DiscoveryState): DiscoveryCard | null {
  const cursor = nextCursor(state);
  const candidateId = state.ordered_candidate_ids[cursor];
  if (!candidateId) return null;
  return buildCard(seed, candidateId);
}

export function getBrowseFallback(seed: Stage1SeedBundle, state: DiscoveryState): readonly BrowseFallbackItem[] {
  return state.fallback_candidate_ids.map((candidateId) => {
    const card = buildCard(seed, candidateId);
    return {
      candidate_id: candidateId,
      decision: state.decisions[candidateId] ?? "unseen",
      profile: card.profile,
      intent: card.intent,
    };
  });
}

export function applyDiscoveryInteraction(
  seed: Stage1SeedBundle,
  state: DiscoveryState,
  interaction: DiscoveryInteraction,
): DiscoveryTransition {
  const active = getActiveDiscoveryCard(seed, state);
  if (!active) {
    const emptyState = { ...state, cursor: state.ordered_candidate_ids.length };
    return {
      state: emptyState,
      active_card: null,
      deck_empty: true,
      browse_fallback: getBrowseFallback(seed, emptyState),
    };
  }

  const candidateId = active.candidate.candidate_id;
  const existingDecision = state.decisions[candidateId];
  const decision = existingDecision ?? interaction;

  const likedProfileIds = decision === "like"
    ? Array.from(new Set([...state.liked_profile_ids, active.profile.profile_id]))
    : state.liked_profile_ids;

  const passedProfileIds = decision === "pass"
    ? Array.from(new Set([...state.passed_profile_ids, active.profile.profile_id]))
    : state.passed_profile_ids;

  const transitioned: DiscoveryState = {
    ...state,
    cursor: state.cursor + 1,
    decisions: {
      ...state.decisions,
      [candidateId]: decision,
    },
    liked_profile_ids: likedProfileIds,
    passed_profile_ids: passedProfileIds,
  };

  const settledState: DiscoveryState = {
    ...transitioned,
    cursor: nextCursor(transitioned),
  };

  const nextCard = getActiveDiscoveryCard(seed, settledState);
  const empty = nextCard === null;

  return {
    state: settledState,
    active_card: nextCard,
    deck_empty: empty,
    browse_fallback: empty ? getBrowseFallback(seed, settledState) : [],
  };
}
