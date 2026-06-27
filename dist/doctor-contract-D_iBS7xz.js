import { r as createLegacyPrivateNetworkDoctorContract } from "./ssrf-policy-B35YwKq4.js";
import "./ssrf-runtime-DlPnh6ZA.js";
//#region extensions/tlon/src/doctor-contract.ts
const contract = createLegacyPrivateNetworkDoctorContract({ channelKey: "tlon" });
const legacyConfigRules = contract.legacyConfigRules;
const normalizeCompatibilityConfig = contract.normalizeCompatibilityConfig;
//#endregion
export { normalizeCompatibilityConfig as n, legacyConfigRules as t };
