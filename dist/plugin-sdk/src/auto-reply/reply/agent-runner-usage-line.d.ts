import { type NormalizedUsage } from "../../agents/usage.js";
import type { OpenClawConfig } from "../../config/config.js";
import type { PluginHookReplyUsageState } from "../../plugins/hook-types.js";
import { type ModelCostConfig } from "../../utils/usage-format.js";
import type { ReplyPayload } from "../types.js";
export declare const formatResponseUsageLine: (params: {
    usage?: {
        input?: number;
        output?: number;
        cacheRead?: number;
        cacheWrite?: number;
    };
    showCost: boolean;
    costConfig?: ModelCostConfig;
}) => string | null;
export declare const resolveResponseUsageLine: (params: {
    config: OpenClawConfig;
    sessionRaw?: string | null;
    channel?: string;
    usage?: NormalizedUsage;
    provider?: string;
    model?: string;
    preserveUserFacingSessionState?: boolean;
    replyUsageState?: PluginHookReplyUsageState;
}) => string | undefined;
export declare const appendUsageLine: (payloads: ReplyPayload[], line: string) => ReplyPayload[];
