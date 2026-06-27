/** Slices a UTF-16 string without returning dangling surrogate halves at either edge. */
export declare function sliceUtf16Safe(input: string, start: number, end?: number): string;
/** Truncates a UTF-16 string without cutting a surrogate pair in half. */
export declare function truncateUtf16Safe(input: string, maxLen: number): string;
