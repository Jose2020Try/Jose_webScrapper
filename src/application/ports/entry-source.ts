import type { Entry } from "@/domain/entry";

export interface EntrySource {
    getEntries(): Promise<Entry[]>;
}

export class EntrySourceError extends Error {
    constructor(message:string, options?: ErrorOptions){
        super(message, options);
        this.name = "EntrySourceError";
    }
}