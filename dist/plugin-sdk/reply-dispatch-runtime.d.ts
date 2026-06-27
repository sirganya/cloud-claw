import { o as CommandTurnContext } from "./templating-C_Ul0-nu.js";
import { v as resolveChunkMode } from "./outbound.types-CR5iyL_G.js";
import { Gr as DispatchReplyWithDispatcher, Hr as finalizeInboundContext, Wr as DispatchReplyWithBufferedBlockDispatcher } from "./types-DK2b65UA.js";
import { r as ReplyPayload } from "./reply-payload-CPBuPnai.js";
import { n as generateConversationLabel } from "./conversation-label-generator-CjUjVl4L.js";

//#region src/plugin-sdk/reply-dispatch-runtime.d.ts
/** Dispatches a reply with buffered block support after lazy-loading the runtime dispatcher. */
declare const dispatchReplyWithBufferedBlockDispatcher: DispatchReplyWithBufferedBlockDispatcher;
/** Dispatches a reply through the provider dispatcher after lazy-loading runtime code. */
declare const dispatchReplyWithDispatcher: DispatchReplyWithDispatcher;
//#endregion
export { type CommandTurnContext, type DispatchReplyWithBufferedBlockDispatcher, type DispatchReplyWithDispatcher, type ReplyPayload, dispatchReplyWithBufferedBlockDispatcher, dispatchReplyWithDispatcher, finalizeInboundContext, generateConversationLabel, resolveChunkMode };