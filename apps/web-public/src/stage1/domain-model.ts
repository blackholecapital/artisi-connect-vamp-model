export const STAGE1_COLLAB_INTENT_TYPES = {
  JAM: "jam",
  SESSION: "session",
  SONGWRITING: "songwriting",
  LIVE_SHOW: "live_show",
  REMOTE_TRACKING: "remote_tracking",
} as const;

export type Stage1CollabIntentType =
  (typeof STAGE1_COLLAB_INTENT_TYPES)[keyof typeof STAGE1_COLLAB_INTENT_TYPES];

export interface MusicianProfile {
  readonly profile_id: string;
  readonly display_name: string;
  readonly primary_role: "vocalist" | "guitarist" | "producer" | "drummer" | "bassist" | "keys";
  readonly genres: readonly string[];
  readonly city: string;
  readonly bio: string;
}

export interface CollabIntent {
  readonly intent_id: string;
  readonly profile_id: string;
  readonly intent_type: Stage1CollabIntentType;
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface SwipeCandidate {
  readonly candidate_id: string;
  readonly profile_id: string;
  readonly intent_id: string;
}

export interface MatchState {
  readonly match_id: string;
  readonly actor_profile_id: string;
  readonly peer_profile_id: string;
  readonly status: "pending" | "matched";
  readonly matched_at_iso: string | null;
}

export interface MessageThread {
  readonly thread_id: string;
  readonly match_id: string;
  readonly participants: readonly [string, string];
  readonly messages: readonly ThreadMessage[];
}

export interface ThreadMessage {
  readonly message_id: string;
  readonly from_profile_id: string;
  readonly body: string;
  readonly sent_at_iso: string;
}

export interface Stage1SeedBundle {
  readonly profiles: readonly MusicianProfile[];
  readonly collab_intents: readonly CollabIntent[];
  readonly swipe_candidates: readonly SwipeCandidate[];
  readonly matches: readonly MatchState[];
  readonly threads: readonly MessageThread[];
}
