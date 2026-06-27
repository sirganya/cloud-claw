import { i as MsgContext } from "./templating-C_Ul0-nu.js";
import { n as GroupKeyResolution } from "./types-POq6F2Ee.js";
import { t as InboundLastRouteUpdate } from "./session.types-eypNkUOS.js";

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