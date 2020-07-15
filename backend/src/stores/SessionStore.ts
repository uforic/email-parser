import { MemoryStore } from 'express-session';
import { getSavedSession, destroySession, setSavedSession } from './sessions';
import { EmailSession } from '../types';

// this class exists for express-session, so that we can store user sessions to the database
export default class SessionStore extends MemoryStore {
    get = (sid: string, callback: (err: any, session?: Express.SessionData | null) => void) => {
        getSavedSession(sid)
            .then((result) => {
                callback(undefined, result ? result.parsedSession : null);
            })
            .catch((error) => callback && callback(error, undefined));
    };
    set = (sid: string, session: Express.SessionData, callback: ((err?: any) => void) | undefined) => {
        setSavedSession(sid, session as EmailSession, session.userId)
            .then(() => callback && callback())
            .catch((error: Error) => callback && callback(error));
    };
    destroy = async (sid: string, callback: ((err?: any) => void) | undefined) => {
        destroySession(sid)
            .then(() => callback && callback())
            .catch((error: Error) => callback && callback(error));
    };
}
