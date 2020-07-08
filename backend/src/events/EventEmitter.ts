import { EventEmitter } from 'events';

const PAGE_DOWNLOADED = 'messagePageDownloaded';
const MESSAGE_DOWNLOADED = 'messageDownloaded';

class MailboxEmitter extends EventEmitter {
    messagePageDownloaded = (pageLength: number) => {
        this.emit(PAGE_DOWNLOADED, pageLength);
    };
    messageDownloaded = (userId: string, messageId: string) => {
        this.emit(MESSAGE_DOWNLOADED, userId, messageId);
    };

    onMessagePageDownloaded = (callback: (pageLength: number) => void) => {
        this.on(PAGE_DOWNLOADED, callback);
    };

    onMessageDownloaded = (callback: (userId: string, messageId: string) => void) => {
        this.on(MESSAGE_DOWNLOADED, callback);
    };
}

export const mailboxEmitter = new MailboxEmitter();
