import { listWorksheets, getWorksheetRange } from '@/lib/graph'
import { parsePMMap } from '@/lib/excel'
import { getSelectedTabs } from '@/lib/cache'
import TabSelector from '@/app/components/TabSelector'
import PMList from '@/app/components/PMList'

export default async function SettingsPage() {
  const [allTabs, listRows, selectedTabs] = await Promise.all([
    listWorksheets(),
    getWorksheetRange('List'),
    getSelectedTabs(),
  ])

  const pmMap = parsePMMap(listRows)

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-gray-800">Data Tabs</h2>
        <p className="text-sm text-gray-500">
          Select which worksheet tabs the worker should process on each refresh.
        </p>
        <TabSelector allTabs={allTabs} initialSelected={selectedTabs} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-gray-800">Project Managers</h2>
        <p className="text-sm text-gray-500">
          These are read live from the List tab in Excel. Edit the spreadsheet to update this list.
        </p>
        <PMList pmMap={pmMap} />
      </section>
    </main>
  )
}