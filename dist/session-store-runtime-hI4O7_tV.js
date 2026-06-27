import { U as normalizeResolvedMaintenanceConfigInput, x as loadSessionStore$1 } from "./store-D6cDx2Ll.js";
import { d as resolveStorePath } from "./paths-fL1rzuvE.js";
import { D as replaceSessionEntry, E as readSessionUpdatedAt$1, R as updateSessionEntry, _ as patchSessionEntry$1, h as loadSessionEntry, l as cleanupSessionLifecycleArtifacts$1, p as listSessionEntries$1 } from "./session-accessor-A6bnwctt.js";
import "./reset-DoKeEuh7.js";
import "./session-key-Bkq4rbuh.js";
import "./transcript-DKhA9wLS.js";
import "./send-policy-BmfJNS2d.js";
//#region src/plugin-sdk/session-store-runtime.ts
function toSessionAccessScope(params) {
	return {
		sessionKey: params.sessionKey,
		...params.agentId !== void 0 ? { agentId: params.agentId } : {},
		...params.env !== void 0 ? { env: params.env } : {},
		...params.hydrateSkillPromptRefs !== void 0 ? { hydrateSkillPromptRefs: params.hydrateSkillPromptRefs } : {},
		...params.readConsistency !== void 0 ? { readConsistency: params.readConsistency } : {},
		...params.storePath !== void 0 ? { storePath: params.storePath } : {}
	};
}
/**
* @deprecated Use getSessionEntry/listSessionEntries for reads and
* patchSessionEntry/upsertSessionEntry for writes. This whole-store helper is
* kept only during the transition before SQLite migration. Callers must
* migrate away from reading sessions.json directly.
*/
const loadSessionStore = loadSessionStore$1;
/** Loads one session entry by agent/session identity. */
function getSessionEntry(params) {
	return loadSessionEntry(toSessionAccessScope(params));
}
/** Lists session entries for one agent. */
function listSessionEntries(params = {}) {
	return listSessionEntries$1({
		...params.agentId !== void 0 ? { agentId: params.agentId } : {},
		...params.env !== void 0 ? { env: params.env } : {},
		...params.hydrateSkillPromptRefs !== void 0 ? { hydrateSkillPromptRefs: params.hydrateSkillPromptRefs } : {},
		...params.storePath !== void 0 ? { storePath: params.storePath } : {}
	});
}
/** Patches one session entry by agent/session identity. */
async function patchSessionEntry(params) {
	return await patchSessionEntry$1(toSessionAccessScope(params), params.update, {
		fallbackEntry: params.fallbackEntry,
		maintenanceConfig: params.maintenanceConfig !== void 0 ? normalizeResolvedMaintenanceConfigInput(params.maintenanceConfig) : void 0,
		preserveActivity: params.preserveActivity,
		replaceEntry: params.replaceEntry
	});
}
/** Reads the last activity timestamp for one session entry. */
function readSessionUpdatedAt(params) {
	return readSessionUpdatedAt$1(toSessionAccessScope(params));
}
/** Updates an existing session entry by store path and session key. */
async function updateSessionStoreEntry(params) {
	return await updateSessionEntry({
		sessionKey: params.sessionKey,
		storePath: params.storePath
	}, params.update, {
		skipMaintenance: params.skipMaintenance,
		takeCacheOwnership: params.takeCacheOwnership,
		requireWriteSuccess: params.requireWriteSuccess
	});
}
/** Replaces or creates one session entry by agent/session identity. */
async function upsertSessionEntry(params) {
	await replaceSessionEntry(toSessionAccessScope(params), params.entry);
}
/** Cleans stale lifecycle-owned session entries and orphan transcripts for one agent store. */
async function cleanupSessionLifecycleArtifacts(params) {
	return await cleanupSessionLifecycleArtifacts$1({
		storePath: params.storePath ?? resolveStorePath(params.sessionStore, {
			agentId: params.agentId,
			env: params.env
		}),
		archiveRemovedEntryTranscripts: params.archiveRemovedEntryTranscripts,
		sessionKeySegmentPrefix: params.sessionKeySegmentPrefix,
		transcriptContentMarker: params.transcriptContentMarker,
		orphanTranscriptMinAgeMs: params.orphanTranscriptMinAgeMs,
		nowMs: params.nowMs
	});
}
//#endregion
export { patchSessionEntry as a, upsertSessionEntry as c, loadSessionStore as i, getSessionEntry as n, readSessionUpdatedAt as o, listSessionEntries as r, updateSessionStoreEntry as s, cleanupSessionLifecycleArtifacts as t };
