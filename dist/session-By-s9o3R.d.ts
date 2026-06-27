import { i as MsgContext } from "./templating-KP3F3Rdx.js";
import { n as GroupKeyResolution } from "./types-BFuGFtDX.js";
import { t as InboundLastRouteUpdate } from "./session.types-DeNkLD_0.js";

//#region src/channels/session.d.ts
declare function recordInboundSession(params: {
  storePath: string;
  sessionKey: string;
  ctx: MsgContext;
  groupResolution?: GroupKeyResolution | null;
  createIfMissing?: boolean;
  updateLastRoute?: InboundLastRouteUpdate;
  onRecordError: (err: unknown) => void;
  trackSessionMetaTask?: (task: Promise<unknown>) => void;
}): Promise<void>;
//#endregion
export { recordInboundSession as t };