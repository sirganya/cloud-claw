import type { ExecHost } from "../infra/exec-approvals.js";
import type { BashSandboxConfig } from "./bash-tools.shared.js";
export type ExecWorkdirResolution = {
    kind: "local";
    hostCwd: string;
} | {
    kind: "sandbox";
    hostCwd: string;
    containerCwd: string;
    scriptPreflightCwd: string | null;
} | {
    kind: "node";
    remoteCwd?: string;
} | {
    kind: "unavailable";
    requestedCwd: string;
};
export declare function formatUnavailableWorkdirFailure(workdir: string): string;
export declare function resolveExecWorkdir(params: {
    host: ExecHost;
    workdir?: string;
    defaultCwd?: string;
    sandbox?: BashSandboxConfig;
}): Promise<ExecWorkdirResolution>;
