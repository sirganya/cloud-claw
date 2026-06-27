import type { HealthFinding, HealthRepairEffect } from "../flows/health-checks.js";
type TranscriptRepairResult = {
    filePath: string;
    broken: boolean;
    repaired: boolean;
    originalEntries: number;
    activeEntries: number;
    legacyOpenAICodexEntries: number;
    backupPath?: string;
    reason?: string;
};
export type SessionTranscriptHealthIssue = TranscriptRepairResult & {
    broken: true;
};
/** Repairs one transcript file by keeping the active branch and backing up the original file. */
export declare function repairBrokenSessionTranscriptFile(params: {
    filePath: string;
    shouldRepair: boolean;
}): Promise<TranscriptRepairResult>;
export declare function detectSessionTranscriptHealthIssues(params?: {
    sessionDirs?: string[];
}): Promise<SessionTranscriptHealthIssue[]>;
export declare function sessionTranscriptIssueToHealthFinding(issue: SessionTranscriptHealthIssue): HealthFinding;
export declare function sessionTranscriptIssueToRepairEffect(issue: SessionTranscriptHealthIssue): HealthRepairEffect;
/** Scans session transcript files and reports or repairs legacy/broken transcript state. */
export declare function noteSessionTranscriptHealth(params?: {
    shouldRepair?: boolean;
    sessionDirs?: string[];
}): Promise<void>;
export {};
