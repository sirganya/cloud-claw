import { n as zalouserSetupAdapter } from "./setup-core-B5OvKYBR.js";
import { t as createZalouserPluginBase } from "./shared-D-3I3oJP.js";
import { t as zalouserSetupWizard } from "./setup-surface-BuT7Vuly.js";
//#region extensions/zalouser/src/channel.setup.ts
const zalouserSetupPlugin = { ...createZalouserPluginBase({
	setupWizard: zalouserSetupWizard,
	setup: zalouserSetupAdapter
}) };
//#endregion
export { zalouserSetupPlugin as t };
