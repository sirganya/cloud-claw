import type { AnyAgentTool } from "./common.js";
export type GatewayToolCallerIdentity = {
    agentId: string;
    sessionKey: string;
};
export declare function getGatewayToolCallerIdentity(): GatewayToolCallerIdentity | undefined;
export declare function withGatewayToolCallerIdentity<T>(identity: GatewayToolCallerIdentity | undefined, run: () => Promise<T> | T): Promise<T>;
export declare function wrapToolWithGatewayCallerIdentity(tool: AnyAgentTool, identity: GatewayToolCallerIdentity | undefined): AnyAgentTool;
