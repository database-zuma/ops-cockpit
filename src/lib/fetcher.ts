export class FetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new FetchError(
      `API error: ${res.status} ${res.statusText}`,
      res.status
    );
    throw error;
  }
  return res.json() as Promise<T>;
}
