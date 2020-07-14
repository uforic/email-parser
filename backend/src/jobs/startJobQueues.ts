import { SYNC_MAILBOX_EXECUTOR } from './SyncMailbox';
import { DOWNLOAD_MESSAGE_EXECUTOR } from './DownloadMessage';
import { PROCESS_MESSAGE_EXECUTOR } from './ProcessMessage';

export default () => {
    SYNC_MAILBOX_EXECUTOR.start();
    DOWNLOAD_MESSAGE_EXECUTOR.start();
    PROCESS_MESSAGE_EXECUTOR.start();
};
