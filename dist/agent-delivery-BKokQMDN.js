import { c as normalizeOptionalString } from "./string-coerce-DW4mBlAt.js";
import { c as normalizeAccountId } from "./delivery-context.shared-L5Nf9_cX.js";
import { t as INTERNAL_MESSAGE_CHANNEL } from "./message-channel-constants-Z0pS5ykd.js";
import { i as normalizeMessageChannel, n as isGatewayMessageChannel, t as isDeliverableMessageChannel } from "./message-channel-normalize-B9681m8k.js";
import "./message-channel-BQz_u-nh.js";
import { r as resolveOutboundChannelPlugin } from "./channel-resolution-CW2W1nEI.js";
import { n as resolveOutboundSessionRoute } from "./outbound-session-BM7dyhlU.js";
import { n as isReservedTargetLiteralError } from "./target-errors-CZ0A80hz.js";
import { i as resolveChannelTarget } from "./target-resolver-CF3-_AJQ.js";
import { t as resolveSessionDeliveryTarget } from "./targets-session-B0BmXVap.js";
import { i as resolveOutboundTarget } from "./targets-Bn3FM-as.js";
//#region src/infra/outbound/agent-delivery.ts
function resolveAgentDeliveryPlan(params) {
	const requestedRaw = normalizeOptionalString(params.requestedChannel) ?? "";
	const requestedChannel = (requestedRaw ? normalizeMessageChannel(requestedRaw) : void 0) || "last";
	const explicitTo = normalizeOptionalString(params.explicitTo) ?? void 0;
	const normalizedTurnSource = params.turnSourceChannel ? normalizeMessageChannel(params.turnSourceChannel) : void 0;
	const turnSourceChannel = normalizedTurnSource && isDeliverableMessageChannel(normalizedTurnSource) ? normalizedTurnSource : void 0;
	const turnSourceTo = normalizeOptionalString(params.turnSourceTo) ?? void 0;
	const turnSourceAccountId = normalizeAccountId(params.turnSourceAccountId);
	const turnSourceThreadId = params.turnSourceThreadId != null && params.turnSourceThreadId !== "" ? params.turnSourceThreadId : void 0;
	const baseDelivery = resolveSessionDeliveryTarget({
		entry: params.sessionEntry,
		requestedChannel: requestedChannel === "webchat" ? "last" : requestedChannel,
		explicitTo,
		explicitThreadId: params.explicitThreadId,
		turnSourceChannel,
		turnSourceTo,
		turnSourceAccountId,
		turnSourceThreadId
	});
	const resolvedChannel = (() => {
		if (requestedChannel === "webchat") return INTERNAL_MESSAGE_CHANNEL;
		if (requestedChannel === "last") {
			if (baseDelivery.channel && baseDelivery.channel !== "webchat") return baseDelivery.channel;
			return INTERNAL_MESSAGE_CHANNEL;
		}
		if (isGatewayMessageChannel(requestedChannel)) return requestedChannel;
		if (baseDelivery.channel && baseDelivery.channel !== "webchat") return baseDelivery.channel;
		return INTERNAL_MESSAGE_CHANNEL;
	})();
	const deliveryTargetMode = explicitTo ? "explicit" : isDeliverableMessageChannel(resolvedChannel) ? "implicit" : void 0;
	const resolvedAccountId = normalizeAccountId(params.accountId) ?? (deliveryTargetMode === "implicit" ? baseDelivery.accountId : void 0);
	let resolvedTo = explicitTo;
	if (!resolvedTo && isDeliverableMessageChannel(resolvedChannel) && resolvedChannel === baseDelivery.lastChannel) resolvedTo = baseDelivery.lastTo;
	return {
		baseDelivery,
		resolvedChannel,
		resolvedTo,
		resolvedAccountId,
		resolvedThreadId: baseDelivery.threadId,
		deliveryTargetMode
	};
}
async function resolveAgentDeliveryPlanWithSessionRoute(params) {
	const plan = resolveAgentDeliveryPlan(params);
	const { resolvedChannel, resolvedTo } = plan;
	if (!params.wantsDelivery || !resolvedTo || !isDeliverableMessageChannel(resolvedChannel)) return plan;
	const plugin = resolveOutboundChannelPlugin({
		channel: resolvedChannel,
		cfg: params.cfg,
		allowBootstrap: true
	});
	if (!plugin?.messaging?.resolveOutboundSessionRoute) return plan;
	const normalizedTarget = resolveOutboundTarget({
		channel: resolvedChannel,
		to: resolvedTo,
		cfg: params.cfg,
		accountId: plan.resolvedAccountId,
		mode: plan.deliveryTargetMode ?? "explicit"
	});
	let sessionRouteTarget;
	let resolvedSessionRouteTarget;
	if (normalizedTarget.ok) sessionRouteTarget = normalizedTarget.to;
	else {
		if (!isReservedTargetLiteralError(normalizedTarget.error)) return {
			...plan,
			targetResolutionError: normalizedTarget.error
		};
		const resolvedTarget = await resolveChannelTarget({
			cfg: params.cfg,
			channel: resolvedChannel,
			input: resolvedTo,
			accountId: plan.resolvedAccountId,
			unknownTargetMode: "normalized",
			plugin
		});
		if (!resolvedTarget.ok) return {
			...plan,
			targetResolutionError: resolvedTarget.error
		};
		sessionRouteTarget = resolvedTarget.target.to;
		resolvedSessionRouteTarget = resolvedTarget.target;
	}
	const explicitThreadId = params.explicitThreadId != null && params.explicitThreadId !== "" ? params.explicitThreadId : void 0;
	const route = await (async () => {
		try {
			return await resolveOutboundSessionRoute({
				cfg: params.cfg,
				channel: resolvedChannel,
				agentId: params.agentId,
				accountId: plan.resolvedAccountId,
				target: sessionRouteTarget,
				...resolvedSessionRouteTarget ? { resolvedTarget: resolvedSessionRouteTarget } : {},
				currentSessionKey: params.currentSessionKey,
				threadId: plan.deliveryTargetMode === "explicit" ? explicitThreadId : plan.resolvedThreadId
			});
		} catch {
			return null;
		}
	})();
	if (!route) {
		if (resolvedSessionRouteTarget) return {
			...plan,
			resolvedTo: resolvedSessionRouteTarget.to,
			resolvedThreadId: plan.deliveryTargetMode === "explicit" ? explicitThreadId : plan.resolvedThreadId
		};
		return plan;
	}
	return {
		...plan,
		resolvedTo: route.to,
		resolvedThreadId: route.threadId ?? (plan.deliveryTargetMode === "explicit" ? explicitThreadId : plan.resolvedThreadId)
	};
}
function resolveAgentOutboundTarget(params) {
	const targetMode = params.targetMode ?? params.plan.deliveryTargetMode ?? (params.plan.resolvedTo ? "explicit" : "implicit");
	if (params.plan.targetResolutionError) return {
		resolvedTarget: {
			ok: false,
			error: params.plan.targetResolutionError
		},
		resolvedTo: void 0,
		targetMode
	};
	if (!isDeliverableMessageChannel(params.plan.resolvedChannel)) return {
		resolvedTarget: null,
		resolvedTo: params.plan.resolvedTo,
		targetMode
	};
	if (params.validateExplicitTarget !== true && params.plan.resolvedTo) return {
		resolvedTarget: null,
		resolvedTo: params.plan.resolvedTo,
		targetMode
	};
	const resolvedTarget = resolveOutboundTarget({
		channel: params.plan.resolvedChannel,
		to: params.plan.resolvedTo,
		cfg: params.cfg,
		accountId: params.plan.resolvedAccountId,
		mode: targetMode
	});
	return {
		resolvedTarget,
		resolvedTo: resolvedTarget.ok ? resolvedTarget.to : params.plan.resolvedTo,
		targetMode
	};
}
//#endregion
export { resolveAgentDeliveryPlanWithSessionRoute as n, resolveAgentOutboundTarget as r, resolveAgentDeliveryPlan as t };
