import { ForbiddenError } from 'apollo-server-express';

export function assertLoggedIn(auth: any): asserts auth {
    if (auth == null) {
        throw new ForbiddenError('User must be logged in to access this endpoint.');
    }
}
