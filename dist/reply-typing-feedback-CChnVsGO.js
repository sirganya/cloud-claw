import { t as createTypingCallbacks } from "./typing-By1cdYk1.js";
import "./channel-outbound-Dyq1Uye3.js";
import { r as logTypingFailure } from "./logging-gUWPKC5g.js";
import "./channel-feedback-BHEBo2DZ.js";
import { I as createDiscordRestClient } from "./send.shared-BTLV5Gmj.js";
import { t as sendTyping } from "./typing-BcXfGCOw.js";
function createDiscordReplyTypingFeedback(params) {
	let channelId = params.channelId;
	const rest = params.rest ?? createDiscordRestClient({
		cfg: params.cfg,
		token: params.token,
		accountId: params.accountId
	}).rest;
	const createCallbacks = () => createTypingCallbacks({
		start: () => sendTyping({
			rest,
			channelId
		}),
		onStartError: (err) => {
			logTypingFailure({
				log: params.log,
				channel: "discord",
				target: channelId,
				error: err
			});
		},
		keepaliveIntervalMs: params.keepaliveIntervalMs,
		maxDurationMs: params.maxDurationMs ?? 12e5
	});
	const updateChannelId = (nextChannelId) => {
		const trimmed = nextChannelId.trim();
		if (trimmed) channelId = trimmed;
	};
	let callbacks = createCallbacks();
	return {
		onReplyStart: () => callbacks.onReplyStart(),
		onIdle: () => callbacks.onIdle?.(),
		onCleanup: () => callbacks.onCleanup?.(),
		updateChannelId,
		restartForDispatch: (nextChannelId) => {
			updateChannelId(nextChannelId);
			callbacks.onCleanup?.();
			callbacks = createCallbacks();
		},
		getChannelId: () => channelId
	};
}
//#endregion
export { createDiscordReplyTypingFeedback as t };
