import { f as MediaUnderstandingProvider, n as AudioTranscriptionResult, t as AudioTranscriptionRequest } from "./types-tbsURQ_Q.js";
//#region extensions/openai/media-understanding-provider.d.ts
declare function transcribeOpenAiAudio(params: AudioTranscriptionRequest): Promise<AudioTranscriptionResult>;
declare const openaiMediaUnderstandingProvider: MediaUnderstandingProvider;
//#endregion
export { transcribeOpenAiAudio as n, openaiMediaUnderstandingProvider as t };