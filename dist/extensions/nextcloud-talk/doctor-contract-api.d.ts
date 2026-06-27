import { i as OpenClawConfig } from "../../types.openclaw-DYWtNRsb.js";
import { t as LegacyConfigRule } from "../../legacy.shared-CFJyEGh7.js";
import { C as ChannelDoctorConfigMutation } from "../../types.adapters-DKKcRwLj.js";
//#region extensions/nextcloud-talk/src/doctor-contract.d.ts
declare const legacyConfigRules: LegacyConfigRule[];
declare const normalizeCompatibilityConfig: (params: {
  cfg: OpenClawConfig;
}) => ChannelDoctorConfigMutation;
//#endregion
export { legacyConfigRules, normalizeCompatibilityConfig };