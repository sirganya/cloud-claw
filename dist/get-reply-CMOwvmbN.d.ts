import { i as OpenClawConfig } from "./types.openclaw-DYWtNRsb.js";
import { f as ReplyPayload, n as GetReplyOptions } from "./types-Nx264qtN.js";
import { i as MsgContext } from "./templating-KP3F3Rdx.js";

//#region src/auto-reply/reply/get-reply.d.ts
declare function getReplyFromConfig(ctx: MsgContext, opts?: GetReplyOptions, configOverride?: OpenClawConfig): Promise<ReplyPayload | ReplyPayload[] | undefined>;
//#endregion
export { getReplyFromConfig as t };