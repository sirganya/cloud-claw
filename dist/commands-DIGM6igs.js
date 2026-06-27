import { D as validateCommandsListParams, t as formatValidationErrors } from "./src-N96aCu-d.js";
import { mn as errorShape, pn as ErrorCodes } from "./schema-jcGFrVlP.js";
import { t as buildCommandsListResult } from "./commands-list-result-CzEqoIC9.js";
import { t as resolveAgentIdOrRespondError } from "./agent-id-shared-DkqScat0.js";
//#region src/gateway/server-methods/commands.ts
/** Gateway handler for enumerating available chat/native commands. */
const commandsHandlers = { "commands.list": ({ params, respond, context }) => {
	if (!validateCommandsListParams(params)) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid commands.list params: ${formatValidationErrors(validateCommandsListParams.errors)}`));
		return;
	}
	const resolved = resolveAgentIdOrRespondError({
		rawAgentId: params.agentId,
		respond,
		cfg: context.getRuntimeConfig(),
		normalize: (rawAgentId) => typeof rawAgentId === "string" ? rawAgentId.trim() : void 0
	});
	if (!resolved) return;
	respond(true, buildCommandsListResult({
		cfg: resolved.cfg,
		agentId: resolved.agentId,
		provider: params.provider,
		scope: params.scope,
		includeArgs: params.includeArgs
	}), void 0);
} };
//#endregion
export { buildCommandsListResult, commandsHandlers };
