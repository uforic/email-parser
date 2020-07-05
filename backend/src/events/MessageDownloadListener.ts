import { mailboxEmitter } from './EventEmitter';
import { parseEmail } from '../cmd/parse_message';
import { createContext } from '../context';
import { state, loadMessage } from '../store';

mailboxEmitter.onMessageDownloaded(async (messageId) => {
    const context = createContext();
    const message = loadMessage(context, messageId);
    const results = parseEmail(context, message);
    if (results.length > 0) {
        state.results.push({ messageId, results });
    }
});
