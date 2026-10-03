import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const graphqlUri = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

export function createApolloClient(): ApolloClient<unknown> {
  return new ApolloClient({
    link: new HttpLink({
      uri: graphqlUri,
      // Default fetch options
      fetchOptions: { cache: 'no-store' },
    }),
    cache: new InMemoryCache(),
  });
}
