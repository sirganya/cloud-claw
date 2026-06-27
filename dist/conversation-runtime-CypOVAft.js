import "./session-binding-service-C_p_HhOv.js";
import "./thread-bindings-policy-Z3x3Qtt5.js";
import "./channel-access-compat-BzFQGg4g.js";
import "./conversation-binding-DMayRthc.js";
import "./binding-registry-Cz9ImrTO.js";
import "./session-CK5222qg.js";
import "./pairing-store-Dy90rjlt.js";
import "./binding-targets-oWC06SsN.js";
import "./binding-routing-BIKe2Mcf.js";
import "./pairing-labels-DobEEWhI.js";
//#region src/channels/session-meta.ts
let inboundSessionRuntimePromise = null;
function loadInboundSessionRuntime() {
	inboundSessionRuntimePromise ??= import("./inbound.runtime.js");
	return inboundSessionRuntimePromise;
}
/**
* Best-effort inbound session metadata recorder for channel plugin command handlers.
*/
async function recordInboundSessionMetaSafe(params) {
	const runtime = await loadInboundSessionRuntime();
	const storePath = runtime.resolveStorePath(params.cfg.session?.store, { agentId: params.agentId });
	try {
		await runtime.recordSessionMetaFromInbound({
			storePath,
			sessionKey: params.sessionKey,
			ctx: params.ctx
		});
	} catch (err) {
		params.onError?.(err);
	}
}
//#endregion
export { recordInboundSessionMetaSafe as t };
