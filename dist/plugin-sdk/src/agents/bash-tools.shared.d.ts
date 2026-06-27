import type { SandboxBackendExecSpec, SandboxBackendWorkdirValidation, SandboxBackendWorkdirValidator } from "./sandbox/backend-handle.types.js";
/** Sandbox metadata needed to map host workspaces into container exec calls. */
export type BashSandboxConfig = {
    containerName: string;
    workspaceDir: string;
    containerWorkdir: string;
    workdirValidation?: SandboxBackendWorkdirValidation;
    validateWorkdir?: SandboxBackendWorkdirValidator;
    discardPreparedWorkdir?: (workdir: string) => void;
    workdirRoots?: readonly string[];
    env?: Record<string, string>;
    buildExecSpec?: (params: {
        command: string;
        workdir?: string;
        env: Record<string, string>;
        usePty: boolean;
    }) => Promise<SandboxBackendExecSpec>;
    finalizeExec?: (params: {
        status: "completed" | "failed";
        exitCode: number | null;
        timedOut: boolean;
        token?: unknown;
    }) => Promise<void>;
};
/** Builds the environment passed into sandboxed exec calls. */
export declare function buildSandboxEnv(params: {
    defaultPath: string;
    paramsEnv?: Record<string, string>;
    sandboxEnv?: Record<string, string>;
    containerWorkdir: string;
}): Record<string, string>;
/** Coerces process/env-like records to string-only environment variables. */
export declare function coerceEnv(env?: NodeJS.ProcessEnv | Record<string, string>): Record<string, string>;
/** Builds `docker exec` arguments while preserving container PATH behavior. */
export declare function buildDockerExecArgs(params: {
    containerName: string;
    command: string;
    workdir?: string;
    env: Record<string, string>;
    tty: boolean;
}): string[];
/**
 * Clamp a number within min/max bounds, using defaultValue if undefined or NaN.
 */
export declare function clampWithDefault(value: number | undefined, defaultValue: number, min: number, max: number): number;
/** Reads a strict integer from the preferred env var or one legacy alias. */
export declare function readEnvInt(key: string, legacyKey?: string): number | undefined;
/** Splits large output into fixed-size UTF-16 chunks for transport. */
export declare function chunkString(input: string, limit?: number): string[];
/** Truncates long labels in the middle while preserving UTF-16 boundaries. */
export declare function truncateMiddle(str: string, max: number): string;
/** Returns a line-based log slice plus original line/character counts. */
export declare function sliceLogLines(text: string, offset?: number, limit?: number): {
    slice: string;
    totalLines: number;
    totalChars: number;
};
/** Derives a compact human label from a shell command. */
export declare function deriveSessionName(command: string): string | undefined;
/** Right-pads a string for aligned plain-text process output. */
export declare function pad(str: string, width: number): string;
