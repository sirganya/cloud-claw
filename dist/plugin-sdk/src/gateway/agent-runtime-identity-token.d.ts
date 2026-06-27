export type AgentRuntimeIdentity = {
    kind: "agentRuntime";
    agentId: string;
    sessionKey: string;
};
/** Mint an opaque token that lets trusted local agent-tool clients identify their agent. */
export declare function mintAgentRuntimeIdentityToken(params: {
    agentId: string;
    sessionKey: string;
}): string;
/** Validate a presented agent runtime token and return the internal caller identity. */
export declare function verifyAgentRuntimeIdentityToken(value: string | null | undefined): AgentRuntimeIdentity | undefined;
