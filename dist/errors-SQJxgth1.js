import { c as redactSensitiveText } from "./redact-CQ2tlRRk.js";
import { s as configureAcpErrorRedactor } from "./errors-DMfARQ5s.js";
import "./src-D7BKryyP.js";
//#region src/acp/runtime/errors.ts
/** ACP runtime error exports wired to OpenClaw secret redaction. */
configureAcpErrorRedactor(redactSensitiveText);
//#endregion
export {};
