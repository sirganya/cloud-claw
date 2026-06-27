import { i as OpenClawConfig } from "../../types.openclaw-DYWtNRsb.js";
import { U as ChannelLegacyStateMigrationPlan } from "../../types.core-BKrwnajs.js";
//#region extensions/imessage/src/state-migrations.d.ts
declare function detectIMessageLegacyStateMigrations(params: {
  cfg: OpenClawConfig;
  env: NodeJS.ProcessEnv;
  stateDir?: string;
}): Promise<ChannelLegacyStateMigrationPlan[]>;
//#endregion
export { detectIMessageLegacyStateMigrations };