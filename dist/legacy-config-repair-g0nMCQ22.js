import { c as isRecord } from "./utils-D2Wwrmfu.js";
import { E as validateConfigObjectWithPlugins, u as readConfigFileSnapshot } from "./io-BRLT3T3n.js";
import "./includes-DhTP1HNl.js";
import { r as replaceConfigFile } from "./config-xg-N7tXV.js";
import { t as migrateLegacyConfig } from "./legacy-config-migrate-BUsGM899.js";
//#region src/commands/doctor/legacy-config-repair.ts
/** Return true when a config tree uses authored includes that doctor must not flatten. */
function containsAuthoredInclude(value) {
	if (!isRecord(value)) return false;
	if (Object.hasOwn(value, "$include")) return true;
	return Object.values(value).some((entry) => containsAuthoredInclude(entry));
}
/** Migrate a legacy config snapshot during update, unless includes or validation block it. */
async function repairLegacyConfigForUpdateChannel(params) {
	if (containsAuthoredInclude(params.configSnapshot.parsed)) return {
		snapshot: params.configSnapshot,
		repaired: false
	};
	const migrated = migrateLegacyConfig(params.configSnapshot.parsed);
	if (!migrated.config) return {
		snapshot: params.configSnapshot,
		repaired: false
	};
	const validated = validateConfigObjectWithPlugins(migrated.config);
	if (!validated.ok) return {
		snapshot: params.configSnapshot,
		repaired: false
	};
	await replaceConfigFile({
		nextConfig: validated.config,
		baseHash: params.configSnapshot.hash,
		writeOptions: {
			allowConfigSizeDrop: true,
			skipOutputLogs: params.jsonMode
		}
	});
	const snapshot = await readConfigFileSnapshot();
	return {
		snapshot,
		repaired: snapshot.valid
	};
}
//#endregion
export { repairLegacyConfigForUpdateChannel };
