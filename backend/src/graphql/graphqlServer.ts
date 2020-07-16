import { ApolloServer } from 'apollo-server-express';
import { Request } from 'express';
import { resolvers } from './graphql';
import { readFileSync } from 'fs';

import { envVars } from '../helpers/env';
import { ApolloContext } from '../types';

export default (graphqlSchemaFile: string) =>
    new ApolloServer({
        typeDefs: readFileSync(graphqlSchemaFile, 'utf8').toString(),
        resolvers: {
            ...resolvers,
            AnalysisData: {
                __resolveType: (parent: any) => {
                    return parent.__typename;
                },
            },
        },
        context: (obj: { req: Request }): ApolloContext => {
            const { req } = obj;
            if (req?.session?.accessToken && req?.session?.userId) {
                return {
                    env: envVars,
                    gmailCredentials: {
                        accessToken: req?.session?.accessToken,
                        userId: req?.session?.userId,
                        refreshToken: req?.session?.refreshToken,
                    },
                };
            }
            return { env: envVars, gmailCredentials: undefined };
        },
        formatError: (error) => {
            console.error('GraphQL Error: ', error);
            return error;
        },
    });
