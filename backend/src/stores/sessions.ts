import { Session } from '@prisma/client';
import { ParsedSessionRecord, EmailSession } from '../types';
import { prismaClient, SESSION_LOCK, getIntDate } from './store';

// because we want to minimize hits of the database, I set up a cache
// for user sessions. I've seen this done in production environments too,
// good way to reduce database calls.
const _userIdSessionCache: Record<string, ParsedSessionRecord> = {};
const _sidSessionCache: Record<string, ParsedSessionRecord> = {};

const addToCache = (session: ParsedSessionRecord) => {
    if (session.userId) {
        _userIdSessionCache[session.userId] = session;
    }
    _sidSessionCache[session.sid] = session;
};

const parseSession = (session: Session) => {
    return { ...session, parsedSession: JSON.parse(session.session) as EmailSession };
};

export const getSavedSessionByUser = async (userId: string): Promise<ParsedSessionRecord> => {
    if (_userIdSessionCache[userId] != null) {
        return _userIdSessionCache[userId];
    }

    const session = (
        await prismaClient(
            [SESSION_LOCK],
            'getSavedSessionByUser',
            async (prismaClient) => {
                return await prismaClient.session.findMany({
                    where: {
                        userId,
                    },
                    take: 1,
                });
            },
            true,
        )
    )[0];
    if (session == null) {
        return session;
    }
    const parsedSession = parseSession(session);
    addToCache(parsedSession);
    return parsedSession;
};

export const getSavedSession = async (sid: string): Promise<ParsedSessionRecord> => {
    if (_sidSessionCache[sid]) {
        return _sidSessionCache[sid];
    }
    const session = (
        await prismaClient(
            [SESSION_LOCK],
            'getSavedSession',
            async (prismaClient) => {
                return await prismaClient.session.findMany({
                    where: {
                        sid,
                    },
                    take: 1,
                });
            },
            true,
        )
    )[0];

    if (session == null) {
        return session;
    }

    const parsedSession = parseSession(session);
    addToCache(parsedSession);
    return parsedSession;
};

export const setSavedSession = async (sid: string, session: EmailSession, userId: string | null) => {
    const storageString = JSON.stringify(session);
    addToCache({ sid, userId, parsedSession: session, session: storageString, id: -1, createdAt: -1 });

    return await prismaClient(
        [SESSION_LOCK],
        'setSavedSession',
        async (prismaClient) => {
            const existingRecords = await prismaClient.session.findMany({
                where: { sid },
            });
            if (existingRecords.length > 0) {
                return await prismaClient.session.update({
                    where: { id: existingRecords[0].id },
                    data: {
                        session: storageString,
                        userId,
                    },
                });
            }
            return await prismaClient.session.create({
                data: {
                    sid,
                    session: storageString,
                    createdAt: getIntDate(),
                    userId,
                },
            });
        },
        true,
    );
};

export const destroySession = async (sid: string) => {
    const cachedSession = _sidSessionCache[sid];
    if (cachedSession) {
        delete _sidSessionCache[sid];
        if (cachedSession.userId) {
            delete _userIdSessionCache[cachedSession.userId];
        }
    }
    return await prismaClient(
        [SESSION_LOCK],
        'destroySession',
        async (prismaClient) => {
            return await prismaClient.session.deleteMany({
                where: {
                    sid,
                },
            });
        },
        true,
    );
};
