import type { ConfigFileSnapshot } from "../../../config/types.js";
import type { OpenClawConfig } from "../../../config/types.openclaw.js";
export type StateMigrationConfigInput = {
    cfg?: OpenClawConfig;
    pluginDoctorConfig?: OpenClawConfig;
};
export declare function resolveStateMigrationConfigInput(params: {
    snapshot: ConfigFileSnapshot;
    baseConfig: OpenClawConfig;
}): StateMigrationConfigInput | null;
