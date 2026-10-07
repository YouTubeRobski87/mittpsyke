// Typer för QA-serverns requestkontext (tmp/qa/qa-server.mjs).
import type { QaClient, QaMode } from './synthetic-supabase.mjs';

export declare const QA_MODE_PARAM: string;
export declare const QA_MODE_COOKIE: string;
export declare function readQaMode(url: URL, cookieValue: string | undefined, envDefault: string | undefined): QaMode;
export declare function runWithQaContext<T>(context: { mode: QaMode; guest: boolean }, callback: () => T): T;
export declare function createQaServerClient(): QaClient;
