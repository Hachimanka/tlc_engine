import { redirect } from "next/navigation";

type TenantLoginRedirectProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TenantLoginRedirect({
  searchParams,
}: TenantLoginRedirectProps) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
      continue;
    }

    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  redirect(queryString ? `/login?${queryString}` : "/login");
}
