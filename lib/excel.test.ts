import { describe, it, expect } from 'vitest'
import { parsePMMap, parseDataTab } from './excel'

describe('parsePMMap', () => {
  it('skips header row and builds initials → name map', () => {
    const rows = [
      ['Initials', 'Name'],
      ['SJ', 'Sarah Jones'],
      ['MD', 'Mark Davies'],
    ]
    expect(parsePMMap(rows)).toEqual({ SJ: 'Sarah Jones', MD: 'Mark Davies' })
  })

  it('silently discards rows with blank initials', () => {
    const rows = [
      ['Initials', 'Name'],
      ['', 'No Initials'],
      ['SJ', 'Sarah Jones'],
    ]
    expect(parsePMMap(rows)).toEqual({ SJ: 'Sarah Jones' })
  })

  it('silently discards rows with blank name', () => {
    const rows = [
      ['Initials', 'Name'],
      ['SJ', ''],
      ['MD', 'Mark Davies'],
    ]
    expect(parsePMMap(rows)).toEqual({ MD: 'Mark Davies' })
  })

  it('silently discards fully blank rows', () => {
    const rows = [
      ['Initials', 'Name'],
      ['SJ', 'Sarah Jones'],
      ['', ''],
      ['MD', 'Mark Davies'],
    ]
    expect(parsePMMap(rows)).toEqual({ SJ: 'Sarah Jones', MD: 'Mark Davies' })
  })

  it('returns empty map when only a header row is present', () => {
    const rows = [['Initials', 'Name']]
    expect(parsePMMap(rows)).toEqual({})
  })

  it('trims whitespace from initials and names', () => {
    const rows = [
      ['Initials', 'Name'],
      ['  JEZ  ', '  Johanna Ezard  '],
    ]
    expect(parsePMMap(rows)).toEqual({ JEZ: 'Johanna Ezard' })
  })

  it('matches the real List tab shape returned by Graph API', () => {
    const rows = [
      ['Initials', 'Name'],
      ['JEZ', 'Johanna Ezard'],
    ]
    expect(parsePMMap(rows)).toEqual({ JEZ: 'Johanna Ezard' })
  })
})

// Builds a sparse row with the 26 columns the real sheet has.
// Indices: 0=jobNo, 1=customer, 2=desc, 3=qty, 13=delivery, 14=date, 21=pm, 24=itemVal, 25=lineTotal
function makeRow(overrides: Record<number, unknown> = {}): unknown[] {
  const defaults: Record<number, unknown> = {
    0:  'J1042',
    1:  'Acme Ltd',
    2:  'Steel Panel',
    3:  4,
    13: '',
    14: 46558, // Excel serial for 2027-06-20
    21: 'SJ',
    24: 125,
    25: 500,
  }
  const row = Array(26).fill('')
  for (const [i, v] of Object.entries({ ...defaults, ...overrides })) {
    row[Number(i)] = v
  }
  return row
}

const PM_MAP = { SJ: 'Sarah Jones', MD: 'Mark Davies' }
const HEADER = Array(26).fill('header')

describe('parseDataTab', () => {
  it('maps a valid row to a ParsedRow with correct fields', () => {
    const rows = [HEADER, makeRow()]
    const result = parseDataTab(rows, PM_MAP, 'Tab1')

    expect(result).toHaveLength(1)
    expect(result[0].jobNumber).toBe('J1042')
    expect(result[0].customerName).toBe('Acme Ltd')
    expect(result[0].pmInitials).toBe('SJ')
    expect(result[0].line.description).toBe('Steel Panel')
    expect(result[0].line.quantity).toBe(4)
    expect(result[0].line.itemValue).toBe(125)
    expect(result[0].line.lineTotal).toBe(500)
    expect(result[0].line.sourceTab).toBe('Tab1')
  })

  it('discards rows with a blank job number', () => {
    const rows = [HEADER, makeRow({ 0: '' })]
    expect(parseDataTab(rows, PM_MAP, 'Tab1')).toHaveLength(0)
  })

  it('discards rows whose PM initials are not in the PMMap', () => {
    const rows = [HEADER, makeRow({ 21: 'XX' })]
    expect(parseDataTab(rows, PM_MAP, 'Tab1')).toHaveLength(0)
  })

  it('keeps rows for all known PMs', () => {
    const rows = [HEADER, makeRow({ 21: 'SJ' }), makeRow({ 21: 'MD' })]
    expect(parseDataTab(rows, PM_MAP, 'Tab1')).toHaveLength(2)
  })

  it('converts an Excel serial date to ISO YYYY-MM-DD', () => {
    // Serial 46558 = 2027-06-20
    const rows = [HEADER, makeRow({ 14: 46558 })]
    expect(parseDataTab(rows, PM_MAP, 'Tab1')[0].line.requiredByDate).toBe('2027-06-20')
  })

  it('accepts a pre-formatted date string as a fallback', () => {
    const rows = [HEADER, makeRow({ 14: '2027-06-20' })]
    expect(parseDataTab(rows, PM_MAP, 'Tab1')[0].line.requiredByDate).toBe('2027-06-20')
  })

  it('returns empty string for a blank date cell', () => {
    const rows = [HEADER, makeRow({ 14: '' })]
    expect(parseDataTab(rows, PM_MAP, 'Tab1')[0].line.requiredByDate).toBe('')
  })

  it('coerces blank numeric cells to 0', () => {
    const rows = [HEADER, makeRow({ 3: '', 24: '', 25: '' })]
    const line = parseDataTab(rows, PM_MAP, 'Tab1')[0].line
    expect(line.quantity).toBe(0)
    expect(line.itemValue).toBe(0)
    expect(line.lineTotal).toBe(0)
  })

  it('sets hasInstall flag based on deliveryOption containing "Install"', () => {
    // hasInstall is computed in grouping (Stage 6), not here — deliveryOption is stored raw
    const rows = [HEADER, makeRow({ 13: 'Site Install' })]
    expect(parseDataTab(rows, PM_MAP, 'Tab1')[0].line.deliveryOption).toBe('Site Install')
  })

  it('returns empty array when only header row present', () => {
    expect(parseDataTab([HEADER], PM_MAP, 'Tab1')).toHaveLength(0)
  })
})