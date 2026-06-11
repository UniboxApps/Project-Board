import { describe, it, expect } from 'vitest'
import { parsePMMap } from './excel'

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