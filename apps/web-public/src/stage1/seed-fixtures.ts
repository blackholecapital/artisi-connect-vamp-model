import {
  STAGE1_COLLAB_INTENT_TYPES,
  type Stage1SeedBundle,
} from "./domain-model";

export const STAGE1_SEED_FIXTURES: Stage1SeedBundle = {
  profiles: [
    {
      profile_id: "prof_ava",
      display_name: "Ava Knox",
      primary_role: "vocalist",
      genres: ["alt-pop", "rnb"],
      city: "Austin, TX",
      bio: "Topline vocalist looking for producers and guitar textures.",
    },
    {
      profile_id: "prof_miles",
      display_name: "Miles Rook",
      primary_role: "producer",
      genres: ["alt-pop", "house"],
      city: "Los Angeles, CA",
      bio: "Producer focused on vocal-led hooks and release-ready demos.",
    },
    {
      profile_id: "prof_zen",
      display_name: "Zen Harper",
      primary_role: "guitarist",
      genres: ["indie", "neo-soul"],
      city: "Nashville, TN",
      bio: "Session guitarist available for hooks, rhythm, and textures.",
    },
  ],
  collab_intents: [
    {
      intent_id: "intent_ava_hook",
      profile_id: "prof_ava",
      intent_type: STAGE1_COLLAB_INTENT_TYPES.SONGWRITING,
      summary: "Need a producer for a dark alt-pop topline idea.",
      tags: ["female-vocal", "hook-writing", "demo"],
    },
    {
      intent_id: "intent_miles_drop",
      profile_id: "prof_miles",
      intent_type: STAGE1_COLLAB_INTENT_TYPES.REMOTE_TRACKING,
      summary: "Looking for guitar stems for a high-energy drop section.",
      tags: ["stems", "drop", "remote"],
    },
    {
      intent_id: "intent_zen_live",
      profile_id: "prof_zen",
      intent_type: STAGE1_COLLAB_INTENT_TYPES.SESSION,
      summary: "Open to session work for pop and neo-soul artists.",
      tags: ["session", "guitar", "tour-prep"],
    },
  ],
  swipe_candidates: [
    { candidate_id: "cand_miles", profile_id: "prof_miles", intent_id: "intent_miles_drop" },
    { candidate_id: "cand_zen", profile_id: "prof_zen", intent_id: "intent_zen_live" },
  ],
  matches: [
    {
      match_id: "match_ava_miles",
      actor_profile_id: "prof_ava",
      peer_profile_id: "prof_miles",
      status: "matched",
      matched_at_iso: "2026-04-16T00:00:00.000Z",
    },
    {
      match_id: "match_ava_zen",
      actor_profile_id: "prof_ava",
      peer_profile_id: "prof_zen",
      status: "pending",
      matched_at_iso: null,
    },
  ],
  threads: [
    {
      thread_id: "thread_ava_miles",
      match_id: "match_ava_miles",
      participants: ["prof_ava", "prof_miles"],
      messages: [
        {
          message_id: "msg_001",
          from_profile_id: "prof_ava",
          body: "Love your drums on that reel. Want to co-write this week?",
          sent_at_iso: "2026-04-16T00:05:00.000Z",
        },
        {
          message_id: "msg_002",
          from_profile_id: "prof_miles",
          body: "Yes. Send BPM and key; I can start tonight.",
          sent_at_iso: "2026-04-16T00:09:00.000Z",
        },
      ],
    },
  ],
};
