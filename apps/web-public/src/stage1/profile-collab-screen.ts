import type { MusicianProfile, Stage1SeedBundle } from "./domain-model";
import type { DiscoveryState } from "./discovery-state";

export interface CollabPost {
  readonly post_id: string;
  readonly author_profile_id: string;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly created_at_iso: string;
}

export interface ProfileCollabViewModel {
  readonly actor_profile: MusicianProfile;
  readonly liked_profiles: readonly MusicianProfile[];
  readonly suggested_posts: readonly CollabPost[];
}

const COLLAB_POST_FIXTURES: readonly CollabPost[] = [
  {
    post_id: "post_miles_altpop_drop",
    author_profile_id: "prof_miles",
    title: "Need guitar textures for alt-pop drop",
    summary: "120 BPM, F# minor. Looking for 2 stem options by Friday.",
    tags: ["alt-pop", "remote", "stems"],
    created_at_iso: "2026-04-16T00:15:00.000Z",
  },
  {
    post_id: "post_zen_sessions",
    author_profile_id: "prof_zen",
    title: "Session guitar takes open this week",
    summary: "Clean + chorus pass for indie/pop hooks. 24h turnaround.",
    tags: ["session", "guitar", "fast-turn"],
    created_at_iso: "2026-04-16T00:25:00.000Z",
  },
];

function byDisplayName(a: MusicianProfile, b: MusicianProfile): number {
  return a.display_name.localeCompare(b.display_name) || a.profile_id.localeCompare(b.profile_id);
}

export function createProfileCollabViewModel(
  seed: Stage1SeedBundle,
  state: DiscoveryState,
): ProfileCollabViewModel {
  const actorProfile = seed.profiles.find((profile) => profile.profile_id === state.actor_profile_id);
  if (!actorProfile) {
    throw new Error(`Unknown actor profile_id: ${state.actor_profile_id}`);
  }

  const likedProfiles = seed.profiles
    .filter((profile) => state.liked_profile_ids.includes(profile.profile_id))
    .sort(byDisplayName);

  const suggestedPosts = COLLAB_POST_FIXTURES.filter((post) =>
    likedProfiles.some((profile) => profile.profile_id === post.author_profile_id),
  );

  return {
    actor_profile: actorProfile,
    liked_profiles: likedProfiles,
    suggested_posts: suggestedPosts,
  };
}

function renderProfileCard(profile: MusicianProfile): string {
  return `<article style="border-radius: 14px; padding: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03);">
    <header style="display:flex; justify-content: space-between; gap: 8px; align-items: center;">
      <strong style="font-size:15px;">${profile.display_name}</strong>
      <span style="border-radius:999px; padding:3px 8px; font-size:11px; background: rgba(113,86,255,0.3); text-transform:capitalize;">${profile.primary_role}</span>
    </header>
    <p style="margin:6px 0 0; font-size:12px; opacity:.75;">${profile.city}</p>
    <p style="margin:8px 0 0; font-size:12px; line-height:1.45;">${profile.bio}</p>
    <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
      ${profile.genres.map((genre) => `<span style="font-size:10px; border-radius:999px; padding:3px 7px; background: rgba(255,255,255,0.10);">${genre}</span>`).join("")}
    </div>
  </article>`;
}

function renderCollabPost(post: CollabPost, author: MusicianProfile): string {
  return `<article style="border-radius: 14px; padding: 12px; border: 1px solid rgba(116,224,178,0.35); background: rgba(116,224,178,0.09);">
    <p style="margin:0; font-size:11px; opacity:.8;">${author.display_name} • Collab Post</p>
    <h3 style="margin:6px 0 0; font-size:14px;">${post.title}</h3>
    <p style="margin:8px 0 0; font-size:12px; line-height:1.45;">${post.summary}</p>
    <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
      ${post.tags.map((tag) => `<span style="font-size:10px; border-radius:999px; padding:3px 7px; background: rgba(116,224,178,0.20);">#${tag}</span>`).join("")}
    </div>
  </article>`;
}

export function renderProfileScreen(model: ProfileCollabViewModel): string {
  const likedMarkup = model.liked_profiles.length > 0
    ? model.liked_profiles.map(renderProfileCard).join("")
    : `<p style="margin:0; font-size:12px; opacity:.8;">No matches yet. Swipe Like in Discover to unlock collaborator profiles.</p>`;

  return `<main style="min-height:100vh; max-width:420px; margin:0 auto; padding:16px; color:#fff; background: radial-gradient(circle at top, #253359, #0b0c16 62%); font-family: Inter, system-ui, sans-serif;">
    <header style="margin-bottom:12px;">
      <p style="margin:0; font-size:12px; text-transform:uppercase; opacity:.75;">Profile</p>
      <h1 style="margin:3px 0 0; font-size:24px;">${model.actor_profile.display_name}</h1>
      <p style="margin:6px 0 0; font-size:12px; opacity:.8;">Find musicians • Match fast • Start a collab</p>
    </header>

    <section style="display:grid; gap:10px;">
      ${renderProfileCard(model.actor_profile)}
    </section>

    <section style="margin-top:14px; display:grid; gap:10px;">
      <h2 style="margin:0; font-size:16px;">Matched Musicians</h2>
      ${likedMarkup}
    </section>
  </main>`;
}

export function renderCollabPostScreen(model: ProfileCollabViewModel, seed: Stage1SeedBundle): string {
  const profileById = new Map(seed.profiles.map((profile) => [profile.profile_id, profile]));
  const postsMarkup = model.suggested_posts.length > 0
    ? model.suggested_posts
      .map((post) => {
        const author = profileById.get(post.author_profile_id);
        if (!author) return "";
        return renderCollabPost(post, author);
      })
      .join("")
    : `<p style="margin:0; font-size:12px; opacity:.8;">No collab posts yet. Like a musician in Discover to seed this tab.</p>`;

  return `<main style="min-height:100vh; max-width:420px; margin:0 auto; padding:16px; color:#fff; background: radial-gradient(circle at top, #1f3a3b, #0b0c16 62%); font-family: Inter, system-ui, sans-serif;">
    <header style="margin-bottom:12px;">
      <p style="margin:0; font-size:12px; text-transform:uppercase; opacity:.75;">Collab</p>
      <h1 style="margin:3px 0 0; font-size:24px;">Start a collab</h1>
      <p style="margin:6px 0 0; font-size:12px; opacity:.8;">Simple post surface from matched profiles only.</p>
    </header>

    <section style="display:grid; gap:10px;">
      ${postsMarkup}
    </section>
  </main>`;
}
