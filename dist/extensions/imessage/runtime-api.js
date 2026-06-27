import { t as DEFAULT_ACCOUNT_ID } from "../../account-id-5IgE9UKY.js";
import { r as buildChannelConfigSchema } from "../../config-schema-CGbk6O9p.js";
import { p as formatTrimmedAllowFromEntries } from "../../channel-config-helpers-IR0aNLdV.js";
import { a as resolveChannelMediaMaxBytes } from "../../media-runtime-Bl6jdONS.js";
import { t as chunkTextForOutbound } from "../../text-chunking-TOrSHG9r.js";
import { c as getChatChannelMeta } from "../../core-CwHi9Jcf.js";
import { t as PAIRING_APPROVED_MESSAGE } from "../../pairing-message-DNhqI-OE.js";
import { c as collectStatusIssuesFromLastError, r as buildComputedAccountStatusSnapshot } from "../../status-helpers-D6tGGHDX.js";
import "../../channel-status-DaJjFFaU.js";
import { i as IMessageConfigSchema } from "../../bundled-channel-config-schema-BPBaLKNk.js";
import { a as resolveIMessageAccount } from "../../accounts-CmVVk045.js";
import { p as setIMessageRuntime } from "../../monitor-reply-cache-CAjPTIlY.js";
import { o as probeIMessage } from "../../sanitize-outbound-br_85Zpk.js";
import { n as resolveIMessageGroupToolPolicy, r as imessageMessageActions, t as resolveIMessageGroupRequireMention } from "../../group-policy-BP8othd6.js";
import { n as normalizeIMessageMessagingTarget, t as looksLikeIMessageTargetId } from "../../normalize-DSBIvU1H.js";
import "../../config-api-B8JI5jn1.js";
import { t as monitorIMessageProvider } from "../../monitor-HS5CMLQJ.js";
import { t as sendMessageIMessage } from "../../send-teq_U7M_.js";
//#region extensions/imessage/src/config-accessors.ts
function resolveIMessageConfigAllowFrom(params) {
	return (resolveIMessageAccount(params).config.allowFrom ?? []).map((entry) => String(entry));
}
function resolveIMessageConfigDefaultTo(params) {
	const defaultTo = resolveIMessageAccount(params).config.defaultTo;
	if (defaultTo == null) return;
	return defaultTo.trim() || void 0;
}
//#endregion
export { DEFAULT_ACCOUNT_ID, IMessageConfigSchema, PAIRING_APPROVED_MESSAGE, buildChannelConfigSchema, buildComputedAccountStatusSnapshot, chunkTextForOutbound, collectStatusIssuesFromLastError, formatTrimmedAllowFromEntries, getChatChannelMeta, imessageMessageActions, looksLikeIMessageTargetId, monitorIMessageProvider, normalizeIMessageMessagingTarget, probeIMessage, resolveChannelMediaMaxBytes, resolveIMessageConfigAllowFrom, resolveIMessageConfigDefaultTo, resolveIMessageGroupRequireMention, resolveIMessageGroupToolPolicy, sendMessageIMessage, setIMessageRuntime };
