export type ParsedAgentSessionKey = {
    agentId: string;
    rest: string;
};
export type ParsedThreadSessionSuffix = {
    baseSessionKey: string | undefined;
    threadId: string | undefined;
};
export type ParsedSessionDeliveryRoute = {
    accountId?: string;
    channel: string;
    peerId: string;
    peerKind: "channel" | "direct" | "dm" | "group";
    threadId?: string;
};
export type RawSessionConversationRef = {
    channel: string;
    kind: "group" | "channel";
    rawId: string;
    prefix: string;
};
/** True when (channel, peerKind) owns a case-sensitive opaque peer ID. */
export declare function isCasePreservingPeer(channel: string | undefined | null, peerKind: string | undefined | null): boolean;
export declare function requiresFoldedSessionKeyAliasProof(sessionKey: string | undefined | null): boolean;
export declare function normalizeSessionPeerId(params: {
    channel: string | undefined | null;
    peerKind?: string | null;
    peerId?: string | null;
}): string;
export declare function normalizeSessionKeyPreservingOpaquePeerIds(sessionKey: string | undefined | null): string;
/**
 * Parse agent-scoped session keys in a canonical, case-insensitive way.
 * Returned values are canonicalized for stable comparisons/routing while
 * preserving provider-owned opaque peer IDs.
 */
export declare function parseAgentSessionKey(sessionKey: string | undefined | null): ParsedAgentSessionKey | null;
export declare function isCronRunSessionKey(sessionKey: string | undefined | null): boolean;
export declare function isCronSessionKey(sessionKey: string | undefined | null): boolean;
export declare function isSubagentSessionKey(sessionKey: string | undefined | null): boolean;
export declare function getSubagentDepth(sessionKey: string | undefined | null): number;
export declare function isAcpSessionKey(sessionKey: string | undefined | null): boolean;
export declare function parseThreadSessionSuffix(sessionKey: string | undefined | null): ParsedThreadSessionSuffix;
/** Parse only complete external delivery shapes; nested ownership stays opaque. */
export declare function parseSessionDeliveryRoute(sessionKey: string | undefined | null): ParsedSessionDeliveryRoute | null;
export declare function parseRawSessionConversationRef(sessionKey: string | undefined | null): RawSessionConversationRef | null;
