import { apiFetch } from "../auth";
import type {
  JournalEntry,
  OasisLearnings,
  ProductFeedback,
} from "../types/journal";

export async function getJournalEntries(token: string) {
  return await apiFetch(token, "/tracking/history");
}

export async function getPendingFeedbacks(token: string) {
  return await apiFetch(token, "/feedback/pending");
}

export async function getLearnings(token: string) {
  return await apiFetch(token, "/feedback/learnings");
}