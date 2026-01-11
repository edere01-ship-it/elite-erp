
import { EventEmitter } from "events";

export const eventStream = new EventEmitter();

export function emitEvent(event: string, data: any) {
    eventStream.emit(event, data);
}
