import { i as formatErrorMessage } from "../errors-DCRXIYSQ.js";
import { t as createCronTool } from "../cron-tool-DBPzlZnO.js";
import { n as createToolsMcpServer, t as connectToolsMcpServerToStdio } from "../tools-stdio-server-ChKVFS3K.js";
import { pathToFileURL } from "node:url";
import "@modelcontextprotocol/sdk/server/index.js";
//#region src/mcp/openclaw-tools-serve.ts
/**
* Standalone MCP server for selected built-in OpenClaw tools.
*
* Run via: node --import tsx src/mcp/openclaw-tools-serve.ts
* Or: bun src/mcp/openclaw-tools-serve.ts
*/
const OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV = "OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY";
function resolveOpenClawToolsMcpAgentSessionKey(env = process.env) {
	return env["OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY"]?.trim() || void 0;
}
function resolveOpenClawToolsForMcp(params = {}) {
	const agentSessionKey = (params.agentSessionKey ?? resolveOpenClawToolsMcpAgentSessionKey())?.trim();
	if (!agentSessionKey) throw new Error(`${OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV} is required`);
	return [createCronTool({
		agentSessionKey,
		creatorToolAllowlist: [{ name: "cron" }]
	})];
}
function createOpenClawToolsMcpServer(params = {}) {
	return createToolsMcpServer({
		name: "openclaw-tools",
		tools: params.tools ?? resolveOpenClawToolsForMcp()
	});
}
async function serveOpenClawToolsMcp() {
	await connectToolsMcpServerToStdio(createOpenClawToolsMcpServer());
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) serveOpenClawToolsMcp().catch((err) => {
	process.stderr.write(`openclaw-tools-serve: ${formatErrorMessage(err)}\n`);
	process.exit(1);
});
//#endregion
export { OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV, resolveOpenClawToolsForMcp, resolveOpenClawToolsMcpAgentSessionKey };
