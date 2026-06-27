import { t as BaseProbeResult } from "./types.core-BKrwnajs.js";
import { t as ChannelPlugin } from "./types.plugin-AW8hosZI.js";
import { t as ResolvedMatrixAccount } from "./accounts-FMEsvmA8.js";
//#region extensions/matrix/src/matrix/probe.d.ts
type MatrixProbe = BaseProbeResult & {
  status?: number | null;
  elapsedMs: number;
  userId?: string | null;
};
//#endregion
//#region extensions/matrix/src/channel.d.ts
declare const matrixPlugin: ChannelPlugin<ResolvedMatrixAccount, MatrixProbe>;
//#endregion
export { matrixPlugin as t };