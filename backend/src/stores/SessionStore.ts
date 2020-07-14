import { MemoryStore } from 'express-session';
import { getSavedSession, destroySession, setSavedSession } from './store';

export default class SessionStore extends MemoryStore {
    // using a cache here because trying to minimize SQLite reads
    cache: { [sid: string]: {} } = {};
    get = (sid: string, callback: (err: any, session?: Express.SessionData | null) => void) => {
        return (
            this.cache[sid] ||
            getSavedSession(sid)
                .then((result) => {
                    callback(undefined, result ? JSON.parse(result.session) : null);
                })
                .catch((error) => callback && callback(error, undefined))
        );
    };
    set = (sid: string, session: {}, callback: ((err?: any) => void) | undefined) => {
        this.cache[sid] = session;
        // @ts-ignore
        return setSavedSession(sid, JSON.stringify(session), session.userId)
            .then(() => callback && callback())
            .catch((error: Error) => callback && callback(error));
    };
    destroy = async (sid: string, callback: ((err?: any) => void) | undefined) => {
        delete this.cache[sid];
        return destroySession(sid)
            .then(() => callback && callback())
            .catch((error: Error) => callback && callback(error));
    };
}
