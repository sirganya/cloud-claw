import { r as AnyAgentTool } from "../common-DDc8qh0a.js";

//#region src/mcp/openclaw-tools-serve.d.ts
declare const OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV = "OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY";
declare function resolveOpenClawToolsMcpAgentSessionKey(env?: NodeJS.ProcessEnv): string | undefined;
declare function resolveOpenClawToolsForMcp(params?: {
  agentSessionKey?: string;
}): AnyAgentTool[];
//#endregion
export { OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV, resolveOpenClawToolsForMcp, resolveOpenClawToolsMcpAgentSessionKey };