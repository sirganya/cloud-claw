import { type SessionLockInspection, type SessionLockOwnerProcessArgsReader, type SessionWriteLockAcquireTimeoutConfig } from "../agents/session-write-lock.js";
import type { HealthFinding, HealthRepairEffect } from "../flows/health-checks.js";
export declare function detectStaleSessionLocks(params?: {
    config?: SessionWriteLockAcquireTimeoutConfig;
    env?: NodeJS.ProcessEnv;
    staleMs?: number;
    readOwnerProcessArgs?: SessionLockOwnerProcessArgsReader;
}): Promise<readonly SessionLockInspection[]>;
export declare function sessionLockToHealthFinding(lock: SessionLockInspection): HealthFinding;
export declare function sessionLockToRepairEffect(lock: SessionLockInspection): HealthRepairEffect;
/** Reports session write locks and removes stale locks when doctor repair is enabled. */
export declare function noteSessionLockHealth(params?: {
    shouldRepair?: boolean;
    config?: SessionWriteLockAcquireTimeoutConfig;
    env?: NodeJS.ProcessEnv;
    staleMs?: number;
    readOwnerProcessArgs?: SessionLockOwnerProcessArgsReader;
}): Promise<void>;
