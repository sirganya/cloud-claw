import { t as getLoadedChannelPluginForRead } from "./registry-loaded-read-kWBL-Dpo.js";
import { r as resolveOutboundChannelPlugin } from "./channel-resolution-CW2W1nEI.js";
import { m as mapAllowFromEntries } from "./channel-config-helpers-IR0aNLdV.js";
import { n as resolveOutboundSessionRoute } from "./outbound-session-BM7dyhlU.js";
import { i as resolveChannelTarget } from "./target-resolver-CF3-_AJQ.js";
import { t as resolveFirstBoundAccountId } from "./bound-account-read-CDlARaoV.js";
//#region src/cron/isolated-agent/delivery-target.runtime.ts
/** Resolves a cron delivery target through channel plugins with bootstrap allowed. */
async function resolveChannelTargetForDelivery(params) {
	resolveOutboundChannelPlugin({
		channel: params.channel,
		cfg: params.cfg,
		allowBootstrap: true
	});
	try {
		return await resolveChannelTarget({
			cfg: params.cfg,
			channel: params.channel,
			input: params.input,
			accountId: params.accountId,
			unknownTargetMode: "normalized"
		});
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err : new Error(String(err))
		};
	}
}
/** Resolves the outbound session route used for cron delivery threading and mirrors. */
async function resolveOutboundSessionRouteForDelivery(params) {
	resolveOutboundChannelPlugin({
		channel: params.channel,
		cfg: params.cfg,
		allowBootstrap: true
	});
	return await resolveOutboundSessionRoute(params);
}
/** Returns whether a channel can canonicalize outbound cron delivery sessions. */
function channelCanResolveOutboundSessionRoute(params) {
	return Boolean(resolveOutboundChannelPlugin({
		channel: params.channel,
		cfg: params.cfg,
		allowBootstrap: true
	})?.messaging?.resolveOutboundSessionRoute);
}
//#endregion
export { channelCanResolveOutboundSessionRoute, getLoadedChannelPluginForRead, mapAllowFromEntries, resolveChannelTargetForDelivery, resolveFirstBoundAccountId, resolveOutboundSessionRouteForDelivery };
