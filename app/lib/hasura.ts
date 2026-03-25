// All GraphQL calls go through this single function
export async function hasuraFetch({
  query,
  variables = {},
  hasuraToken,
}: {
  query: string;
  variables?: Record<string, any>;
  hasuraToken: string;
}) {
  const res = await fetch(
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${hasuraToken}`,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store", // always fresh data
    }
  );

  const json = await res.json();

  // Surface GraphQL errors clearly
  if (json.errors) {
    console.error("FULL ERROR:", JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors[0].message);
  }

  return json.data;
}