import { type SessionEntry } from "../../config/sessions.js";
import type { OpenClawConfig } from "../../config/types.openclaw.js";
export type ResolvedStatusSessionEntry = {
    entry: SessionEntry;
    key: string;
    persisted: boolean;
};
/** Resolves one status lookup against ordered tool-local session key candidates. */
export declare function resolveSessionStatusEntry(params: {
    agentId: string;
    alias: string;
    cfg: OpenClawConfig;
    includeAliasFallback?: boolean;
    keyRaw: string;
    mainKey: string;
    requesterInternalKey?: string;
}): ResolvedStatusSessionEntry | null;
/** Maps requester keys into the currently selected agent store's legacy main key shape. */
export declare function resolveStoreScopedRequesterKey(params: {
    agentId: string;
    mainKey: string;
    requesterKey: string;
}): string;
/** Returns a synthesized current-session entry without writing it to storage. */
export declare function resolveImplicitCurrentSessionFallback(params: {
    agentId: string;
    allowFallback: boolean;
    cfg: OpenClawConfig;
    fallbackKey: string;
}): ResolvedStatusSessionEntry | null;
/** Lists policy-key fallbacks for implicit default-account direct status lookups. */
export declare function listImplicitDefaultDirectFallbackKeys(params: {
    keyRaw: string;
    mainKey: string;
}): string[];
