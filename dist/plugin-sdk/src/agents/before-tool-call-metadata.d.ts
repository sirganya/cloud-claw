import type { AnyAgentTool } from "./tools/common.js";
export type BeforeToolCallDiagnosticOptions = {
    emitDiagnostics: boolean;
};
export declare const BEFORE_TOOL_CALL_WRAPPED: unique symbol;
export declare const BEFORE_TOOL_CALL_DIAGNOSTIC_OPTIONS: unique symbol;
export declare const BEFORE_TOOL_CALL_SOURCE_TOOL: unique symbol;
export declare const BEFORE_TOOL_CALL_HOOK_CONTEXT: unique symbol;
/** Return true when a tool already carries the before_tool_call wrapper marker. */
export declare function isToolWrappedWithBeforeToolCallHook(tool: AnyAgentTool): boolean;
/** Toggle diagnostic event emission on an existing before_tool_call wrapper. */
export declare function setBeforeToolCallDiagnosticsEnabled(tool: AnyAgentTool, enabled: boolean): void;
/** Copy before_tool_call marker metadata when another wrapper replaces a tool. */
export declare function copyBeforeToolCallHookMarker(source: AnyAgentTool, target: AnyAgentTool): void;
