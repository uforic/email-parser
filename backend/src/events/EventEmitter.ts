import { EventEmitter } from 'events';

const PAGE_DOWNLOADED = 'messagePageDownloaded';
const MESSAGE_DOWNLOADED = 'messageDownloaded';
const SYNC_COMPLETED = 'syncCompleted';

class MailboxEmitter extends EventEmitter {
    messagePageDownloaded = (pageLength: number) => {
        this.emit(PAGE_DOWNLOADED, pageLength);
    };
    messageDownloaded = (id: string) => {
        this.emit(MESSAGE_DOWNLOADED, id);
    };
    syncCompleted = () => {
        this.emit(SYNC_COMPLETED);
    };

    onMessagePageDownloaded = (callback: (pageLength: number) => void) => {
        this.on(PAGE_DOWNLOADED, callback);
    };

    onMessageDownloaded = (callback: (id: string) => void) => {
        this.on(MESSAGE_DOWNLOADED, callback);
    };

    onSyncCompleted = (callback: () => void) => {
        this.on(SYNC_COMPLETED, callback);
    };
}

export const mailboxEmitter = new MailboxEmitter();
