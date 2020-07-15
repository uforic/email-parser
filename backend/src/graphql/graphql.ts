import { Mutations } from './mutations';
import { Queries } from './queries';

export const resolvers = {
    Mutation: {
        mailbox: () => {
            return Object.fromEntries(
                Object.keys(Mutations).map((key) => {
                    const resolver = Mutations[key];
                    return [key, async (args: any, context: any) => await resolver({}, args, context)];
                }),
            );
        },
    },
    Query: Queries,
};
