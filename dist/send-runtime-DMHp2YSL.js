//#region extensions/telegram/src/send-runtime.ts
let telegramSendModulePromise;
async function loadTelegramSendModule() {
	telegramSendModulePromise ??= import("./send-D6D49ywk.js");
	return await telegramSendModulePromise;
}
//#endregion
export { loadTelegramSendModule as t };
