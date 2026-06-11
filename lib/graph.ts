const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

// Uses app-only client credentials — runs server-side in worker and API routes
async function getGraphToken(): Promise<string> {
  const url = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      scope:         'https://graph.microsoft.com/.default',
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Graph token request failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.access_token as string
}

// Returns all worksheet names in the workbook
export async function listWorksheets(): Promise<string[]> {
  const token = await getGraphToken()
  const url = `${GRAPH_BASE}${process.env.SHAREPOINT_FILE_PATH}/workbook/worksheets`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`listWorksheets failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return (data.value as { name: string }[]).map((ws) => ws.name)
}

// Returns the full usedRange values matrix for a given sheet (row 0 = header)
export async function getWorksheetRange(sheetName: string): Promise<unknown[][]> {
  const token = await getGraphToken()
  const name = encodeURIComponent(sheetName)
  const url = `${GRAPH_BASE}${process.env.SHAREPOINT_FILE_PATH}/workbook/worksheets/${name}/usedRange?$select=values`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`getWorksheetRange("${sheetName}") failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.values as unknown[][]
}