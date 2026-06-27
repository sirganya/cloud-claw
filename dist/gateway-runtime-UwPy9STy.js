import "./net-DQvRbvSK.js";
import "./auth-D7IeGKi5.js";
import "./client-DPphzG7M.js";
import "./src-N96aCu-d.js";
import "./operator-approvals-client-DfAOe2xl.js";
import "./gateway-rpc-DuX34Vp5.js";
import "./hosted-plugin-surface-url-DIYZ_g74.js";
import "./plugin-node-capability-CQtFV9Fn.js";
import "./node-command-policy-DCrs6sOj.js";
import "./nodes.helpers-Byr-_PEv.js";
import "./startup-auth-C4VIuyeA.js";
//#region src/gateway/channel-status-patches.ts
/** Creates a connected-channel status patch with matching connection/event timestamps. */
function createConnectedChannelStatusPatch(at = Date.now()) {
	return {
		connected: true,
		lastConnectedAt: at,
		lastEventAt: at
	};
}
/** Creates a transport-activity patch for health/activity monitors. */
function createTransportActivityStatusPatch(at = Date.now()) {
	return { lastTransportActivityAt: at };
}
//#endregion
export { createTransportActivityStatusPatch as n, createConnectedChannelStatusPatch as t };
