import type {
  CollabIntent,
  MusicianProfile,
  Stage1SeedBundle,
  SwipeCandidate,
} from "./domain-model";

export type DiscoverySwipeDecision = "pass" | "like";

export interface DiscoveryCardViewModel {
  readonly card_id: string;
  readonly musician_id: string;
  readonly display_name: string;
  readonly role_chip: string;
  readonly genre_chips: readonly string[];
  readonly city: string;
  readonly bio: string;
  readonly collab_intent_preview: string;
  readonly collab_intent_tags: readonly string[];
}

export interface DiscoveryDeckState {
  readonly viewer_profile_id: string;
  readonly cards: readonly DiscoveryCardViewModel[];
  readonly cursor: number;
  readonly decisions: Readonly<Record<string, DiscoverySwipeDecision>>;
}

export type DiscoverySurfaceState = "ready" | "loading" | "error";

function toDiscoveryCard(
  candidate: SwipeCandidate,
  profile: MusicianProfile,
  collabIntent: CollabIntent,
): DiscoveryCardViewModel {
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
}

export function createDiscoveryDeckState(
  bundle: Stage1SeedBundle,
  viewer_profile_id: string,
): DiscoveryDeckState {
  const profileById = new Map(bundle.profiles.map((profile) => [profile.profile_id, profile]));
  const intentById = new Map(bundle.collab_intents.map((intent) => [intent.intent_id, intent]));

  const cards = bundle.swipe_candidates
    .map((candidate) => {
      const profile = profileById.get(candidate.profile_id);
      const collabIntent = intentById.get(candidate.intent_id);
      if (!profile || !collabIntent) {
        return null;
      }
      if (profile.profile_id === viewer_profile_id) {
        return null;
      }
      return toDiscoveryCard(candidate, profile, collabIntent);
    })
    .filter((card): card is DiscoveryCardViewModel => card !== null);

  return {
    viewer_profile_id,
    cards,
    cursor: 0,
    decisions: {},
  };
}

export function getActiveDiscoveryCard(state: DiscoveryDeckState): DiscoveryCardViewModel | null {
  return state.cards[state.cursor] ?? null;
}

export function applyDiscoverySwipe(
  state: DiscoveryDeckState,
  decision: DiscoverySwipeDecision,
): DiscoveryDeckState {
  const activeCard = getActiveDiscoveryCard(state);
  if (!activeCard) {
    return state;
  }

  return {
    ...state,
    cursor: state.cursor + 1,
    decisions: {
      ...state.decisions,
      [activeCard.card_id]: decision,
    },
  };
}

export function renderDiscoveryScreen(
  state: DiscoveryDeckState,
  surfaceState: DiscoverySurfaceState = "ready",
): string {
  if (surfaceState === "loading") {
    return `<main style="min-height: 100vh; max-width: 420px; margin: 0 auto; padding: 16px; color: #ffffff; background: radial-gradient(circle at top, #23254d, #0b0c16 60%); font-family: Inter, system-ui, sans-serif;">
      <h1 style="margin: 0;">Discover</h1>
      <section style="margin-top: 12px; border-radius: 18px; border: 1px dashed rgba(255,255,255,0.35); padding: 20px;">
        <p style="margin: 0; opacity: .85;">Loading discovery cards…</p>
      </section>
    </main>`;
  }

  if (surfaceState === "error") {
    return `<main style="min-height: 100vh; max-width: 420px; margin: 0 auto; padding: 16px; color: #ffffff; background: radial-gradient(circle at top, #23254d, #0b0c16 60%); font-family: Inter, system-ui, sans-serif;">
      <h1 style="margin: 0;">Discover</h1>
      <section style="margin-top: 12px; border-radius: 18px; border: 1px solid rgba(255,105,125,0.45); background: rgba(255,105,125,0.12); padding: 20px;">
        <p style="margin: 0;">Discovery is temporarily unavailable. Pull to retry demo state.</p>
      </section>
    </main>`;
  }

  const deckSlice = state.cards.slice(state.cursor, state.cursor + 3);

  const stackMarkup = deckSlice
    .map((card, index) => {
      const depth = index + 1;
      return `<article data-card-id="${card.card_id}" style="
        position: absolute;
        inset: 0;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.24);
        background: linear-gradient(180deg, rgba(28,30,55,0.96), rgba(17,18,33,0.98));
        padding: 16px;
        transform: translateY(${index * 10}px) scale(${1 - index * 0.03});
        opacity: ${1 - index * 0.18};
      ">
        <header style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
          <strong style="font-size: 18px;">${card.display_name}</strong>
          <span style="border-radius: 999px; padding: 4px 10px; background: rgba(113,86,255,0.25); font-size: 12px; text-transform: capitalize;">${card.role_chip}</span>
        </header>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.75); font-size: 13px;">${card.city}</p>
        <p style="margin: 10px 0 0; font-size: 13px; line-height: 1.4;">${card.bio}</p>
        <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px;">
          ${card.genre_chips
            .map(
              (chip) =>
                `<span style="border-radius: 999px; background: rgba(255,255,255,0.12); padding: 4px 9px; font-size: 11px;">${chip}</span>`,
            )
            .join("")}
        </div>
        <section style="margin-top: 14px; border-radius: 12px; background: rgba(116,224,178,0.12); border: 1px solid rgba(116,224,178,0.38); padding: 10px;">
          <p style="margin: 0; font-size: 11px; color: rgba(189,255,230,0.9); text-transform: uppercase; letter-spacing: .07em;">Collab intent</p>
          <p style="margin: 6px 0 0; font-size: 13px;">${card.collab_intent_preview}</p>
          <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
            ${card.collab_intent_tags
              .map(
                (tag) =>
                  `<span style="border-radius: 999px; background: rgba(116,224,178,0.22); padding: 3px 8px; font-size: 10px;">#${tag}</span>`,
              )
              .join("")}
          </div>
        </section>
        <p style="margin: 12px 0 0; font-size: 11px; color: rgba(255,255,255,0.55);">Card ${state.cursor + depth} / ${state.cards.length}</p>
      </article>`;
    })
    .join("");

  const emptyMarkup = `<section style="border-radius: 18px; border: 1px dashed rgba(255,255,255,0.35); padding: 20px; text-align: center;">
      <h3 style="margin: 0;">${state.cards.length === 0 ? "No discovery cards" : "Deck complete"}</h3>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.72);">${state.cards.length === 0 ? "Seed fixture returned no candidates. Keep shell visible with this empty state." : "All seeded musicians were reviewed. Reload fixture state to demo again."}</p>
    </section>`;

  const passCount = Object.values(state.decisions).filter((v) => v === "pass").length;
  const likeCount = Object.values(state.decisions).filter((v) => v === "like").length;

  return `<main style="min-height: 100vh; max-width: 420px; margin: 0 auto; padding: 16px; color: #ffffff; background: radial-gradient(circle at top, #23254d, #0b0c16 60%); font-family: Inter, system-ui, sans-serif;">
    <header style="display: flex; justify-content: space-between; align-items: end; margin-bottom: 12px;">
      <div>
        <p style="margin: 0; opacity: .7; font-size: 12px; letter-spacing: .04em; text-transform: uppercase;">Discover</p>
        <h1 style="margin: 2px 0 0; font-size: 24px;">Swipe musicians</h1>
      </div>
      <div style="text-align: right; font-size: 12px; opacity: .8;">
        <div>Likes: ${likeCount}</div>
        <div>Passes: ${passCount}</div>
      </div>
    </header>

    <section style="position: relative; height: 430px;">
      ${stackMarkup || emptyMarkup}
    </section>

    <footer style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px;">
      <button type="button" data-action="pass" style="height: 50px; border: none; border-radius: 14px; background: rgba(255,105,125,0.22); color: #ffd2d9; font-size: 16px; font-weight: 600;">Pass</button>
      <button type="button" data-action="like" style="height: 50px; border: none; border-radius: 14px; background: rgba(113,86,255,0.35); color: #efe8ff; font-size: 16px; font-weight: 600;">Like</button>
    </footer>
  </main>`;
}
