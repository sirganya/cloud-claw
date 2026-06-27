import type { HealthCheckInput, RegisteredHealthCheck, SplitHealthCheckInput } from "./health-check-runner-types.js";
/** Wraps a detect/repair health check in the runnable health-check contract. */
export declare function defineSplitHealthCheck(check: SplitHealthCheckInput): RegisteredHealthCheck;
/** Normalizes any supported health-check shape before lint/fix execution. */
export declare function normalizeHealthCheck(check: HealthCheckInput): RegisteredHealthCheck;
