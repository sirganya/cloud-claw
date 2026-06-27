import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-DW4mBlAt.js";
import "./agent-scope-ZuqArM9O.js";
import { c as parseAgentSessionKey } from "./session-key-utils-By9_yRpy.js";
import { d as normalizeMainKey, u as normalizeAgentId } from "./session-key-IUFoWh21.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-DtQ4nTRd.js";
//#region src/agents/session-agent-binding.ts
/**
* Session-to-agent binding resolver.
*
* Derives the trusted active agent from explicit agent ids, agent session keys, or configured main-session aliases.
*/
/**
* Resolve the trusted active agent bound to a host-owned session reference.
*/
function resolveBoundAgentIdForSession(params) {
	const explicitAgentId = normalizeOptionalString(params.agentId);
	if (explicitAgentId) return normalizeAgentId(explicitAgentId);
	const normalizedSessionKey = normalizeOptionalString(params.sessionKey);
	if (!normalizedSessionKey) return;
	const parsed = parseAgentSessionKey(normalizedSessionKey);
	if (parsed?.agentId) return normalizeAgentId(parsed.agentId);
	const loweredSessionKey = normalizeLowercaseStringOrEmpty(normalizedSessionKey);
	const mainKey = normalizeMainKey(params.config?.session?.mainKey);
	if (loweredSessionKey === "main" || loweredSessionKey === mainKey) return resolveDefaultAgentId(params.config ?? {});
}
//#endregion
export { resolveBoundAgentIdForSession as t };
