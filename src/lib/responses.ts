export function jsonOk(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

export function jsonCreated(body: unknown, init: ResponseInit = {}): Response {
  return jsonOk(body, { status: 201, ...init })
}

export interface ErrorBody {
  error: string
  errors?: string[]
}

/** Error responses MUST NOT be cached per the CIMD spec — errors always carry no-store. */
export function jsonError(status: number, error: string, errors?: string[]): Response {
  const body: ErrorBody = errors ? { error, errors } : { error }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
