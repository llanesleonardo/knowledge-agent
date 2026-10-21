export function fail(error: unknown, status = 400) {
  console.error(error instanceof Error ? error.message : "Request failed");
  return Response.json(
    { error: error instanceof Error ? error.message : "Request failed." },
    { status },
  );
}
export async function safeJson(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 200000)
    throw new Error("Request is too large.");
  return request.json();
}
