import { NextResponse } from 'next/server'

// Wraps a route handler so every API route shares the same error contract:
// on success the handler's value is returned as JSON; on failure the error is
// logged under `label` and returned as a 500 with a JSON `error` message.
export function jsonRoute<Args extends unknown[]>(
  label: string,
  handler: (...args: Args) => Promise<unknown>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      const result = await handler(...args)
      // A handler may return its own response (e.g. a 400) to short-circuit.
      if (result instanceof NextResponse) return result
      return NextResponse.json(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[${label}]`, message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
}
