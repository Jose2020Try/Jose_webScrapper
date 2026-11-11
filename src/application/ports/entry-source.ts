import type { Entry } from "@/domain/entry";

// interface segregation principle, dependency inversion principle
export interface EntrySource {
    getEntries(): Promise<Entry[]>;
}

// single responsibility principle
export class EntrySourceError extends Error {
    constructor(message:string, options?: ErrorOptions){
        super(message, options);
        this.name = "EntrySourceError";
    }
}
