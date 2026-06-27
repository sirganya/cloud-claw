import { f as MediaUnderstandingProvider, n as AudioTranscriptionResult, t as AudioTranscriptionRequest } from "../../types-tbsURQ_Q.js";
//#region extensions/openrouter/media-understanding-provider.d.ts
declare function transcribeOpenRouterAudio(params: AudioTranscriptionRequest): Promise<AudioTranscriptionResult>;
declare const openrouterMediaUnderstandingProvider: MediaUnderstandingProvider;
//#endregion
export { openrouterMediaUnderstandingProvider, transcribeOpenRouterAudio };