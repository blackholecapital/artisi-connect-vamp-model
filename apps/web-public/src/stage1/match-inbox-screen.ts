import type { MessageThread, Stage1SeedBundle } from "./domain-model";
import type { DiscoveryState } from "./discovery-state";

export interface DerivedMatchRecord {
  readonly match_id: string;
  readonly source_card_id: string;
  readonly peer_musician_id: string;
  readonly match_state: "pending" | "matched";
  readonly matched_at_iso: string | null;
}

export interface InboxThreadListItem {
  readonly thread_id: string;
  readonly match_id: string;
  readonly participant_ids: readonly [string, string];
  readonly peer_musician_id: string;
  readonly last_message_at: string;
  readonly last_message_preview: string;
}

export interface ConversationMessage {
  readonly message_id: string;
  readonly thread_id: string;
  readonly sender_id: string;
  readonly body: string;
  readonly sent_at: string;
}

function getCandidateById(seed: Stage1SeedBundle, candidateId: string) {
  return seed.swipe_candidates.find((candidate) => candidate.candidate_id === candidateId);
}

function getLastMessage(thread: MessageThread) {
  return [...thread.messages].sort((a, b) => a.sent_at_iso.localeCompare(b.sent_at_iso)).at(-1) ?? null;
}

export function deriveMatchesFromDiscovery(seed: Stage1SeedBundle, discovery: DiscoveryState): readonly DerivedMatchRecord[] {
  const linkedFromDiscovery: DerivedMatchRecord[] = discovery.liked_profile_ids
    .map((likedProfileId) => {
      const sourceCandidateId = discovery.ordered_candidate_ids.find((candidateId) => {
        const candidate = getCandidateById(seed, candidateId);
        return candidate?.profile_id === likedProfileId;
      });

      if (!sourceCandidateId) {
        return null;
      }

      const seedMatch = seed.matches.find(
        (match) =>
          match.actor_profile_id === discovery.actor_profile_id &&
          match.peer_profile_id === likedProfileId,
      );

      return {
        match_id: seedMatch?.match_id ?? `match_${discovery.actor_profile_id}_${likedProfileId}`,
        source_card_id: sourceCandidateId,
        peer_musician_id: likedProfileId,
        match_state: seedMatch?.status ?? "matched",
        matched_at_iso: seedMatch?.matched_at_iso ?? "2026-04-16T00:00:00.000Z",
      };
    })
    .filter((entry): entry is DerivedMatchRecord => entry !== null);

  return linkedFromDiscovery.sort((a, b) => a.match_id.localeCompare(b.match_id));
}

export function buildInboxThreadList(seed: Stage1SeedBundle, matches: readonly DerivedMatchRecord[]): readonly InboxThreadListItem[] {
  return matches
    .map((match) => {
      const thread = seed.threads.find((entry) => entry.match_id === match.match_id);
      if (!thread) {
        return null;
      }

      const lastMessage = getLastMessage(thread);
      return {
        thread_id: thread.thread_id,
        match_id: match.match_id,
        participant_ids: thread.participants,
        peer_musician_id: match.peer_musician_id,
        last_message_at: lastMessage?.sent_at_iso ?? "",
        last_message_preview: lastMessage?.body ?? "No messages yet",
      };
    })
    .filter((entry): entry is InboxThreadListItem => entry !== null)
    .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
}

export function buildConversationView(seed: Stage1SeedBundle, threadId: string): readonly ConversationMessage[] {
  const thread = seed.threads.find((entry) => entry.thread_id === threadId);
  if (!thread) {
    return [];
  }

  return [...thread.messages]
    .sort((a, b) => a.sent_at_iso.localeCompare(b.sent_at_iso))
    .map((message) => ({
      message_id: message.message_id,
      thread_id: thread.thread_id,
      sender_id: message.from_profile_id,
      body: message.body,
      sent_at: message.sent_at_iso,
    }));
}

function resolveDisplayName(seed: Stage1SeedBundle, profileId: string): string {
  return seed.profiles.find((profile) => profile.profile_id === profileId)?.display_name ?? profileId;
}

export function renderMatchesScreen(seed: Stage1SeedBundle, matches: readonly DerivedMatchRecord[]): string {
  const rows = matches
    .map((match) => {
      const name = resolveDisplayName(seed, match.peer_musician_id);
      return `<article data-match-id="${match.match_id}" style="border-radius: 14px; padding: 12px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04);">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
          <strong>${name}</strong>
          <span style="font-size:11px;border-radius:999px;padding:3px 8px;background:rgba(113,86,255,0.28);text-transform:uppercase;">${match.match_state}</span>
        </div>
        <p style="margin:8px 0 0; font-size:12px; opacity:.7;">Linked from discovery card: ${match.source_card_id}</p>
      </article>`;
    })
    .join("");

  return `<main style="min-height:100vh;max-width:420px;margin:0 auto;padding:16px;color:#fff;background:#0d1022;font-family:Inter,system-ui,sans-serif;">
    <h1 style="margin:0 0 12px;">Matches</h1>
    <section style="display:grid;gap:10px;">${rows || '<p style="opacity:.75;">No matches yet. Like a profile in Discover to create one.</p>'}</section>
  </main>`;
}

export function renderInboxThreadList(seed: Stage1SeedBundle, threads: readonly InboxThreadListItem[]): string {
  const rows = threads
    .map((thread) => {
      const name = resolveDisplayName(seed, thread.peer_musician_id);
      return `<article data-thread-id="${thread.thread_id}" style="border-radius:14px;padding:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);">
        <strong>${name}</strong>
        <p style="margin:6px 0 0;font-size:13px;opacity:.82;">${thread.last_message_preview}</p>
        <p style="margin:6px 0 0;font-size:11px;opacity:.6;">${thread.last_message_at}</p>
      </article>`;
    })
    .join("");

  return `<main style="min-height:100vh;max-width:420px;margin:0 auto;padding:16px;color:#fff;background:#0d1022;font-family:Inter,system-ui,sans-serif;">
    <h1 style="margin:0 0 12px;">Inbox</h1>
    <section style="display:grid;gap:10px;">${rows || '<p style="opacity:.75;">No conversation threads yet.</p>'}</section>
  </main>`;
}

export function renderConversationScreen(seed: Stage1SeedBundle, threadId: string): string {
  const messages = buildConversationView(seed, threadId);
  const thread = seed.threads.find((entry) => entry.thread_id === threadId);
  const peerId = thread?.participants.find((id) => id !== "prof_ava") ?? "";
  const peerName = resolveDisplayName(seed, peerId);

  const rows = messages
    .map((message) => {
      const mine = message.sender_id === "prof_ava";
      return `<article data-message-id="${message.message_id}" style="margin-left:${mine ? "40px" : "0"};margin-right:${mine ? "0" : "40px"};border-radius:12px;padding:10px;background:${mine ? "rgba(113,86,255,.32)" : "rgba(255,255,255,.08)"};">
        <p style="margin:0;font-size:13px;">${message.body}</p>
        <p style="margin:6px 0 0;font-size:10px;opacity:.65;">${message.sent_at}</p>
      </article>`;
    })
    .join("");

  return `<main style="min-height:100vh;max-width:420px;margin:0 auto;padding:16px;color:#fff;background:#0d1022;font-family:Inter,system-ui,sans-serif;">
    <h1 style="margin:0;">${peerName || "Conversation"}</h1>
    <p style="margin:4px 0 12px;opacity:.7;font-size:12px;">Thread: ${threadId}</p>
    <section style="display:grid;gap:10px;">${rows || '<p style="opacity:.75;">No messages in this thread.</p>'}</section>
  </main>`;
}
