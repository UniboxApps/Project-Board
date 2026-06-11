export type PMMap = Record<string, string>

export type ProductLine = {
  description: string
  quantity: number
  deliveryOption: string
  requiredByDate: string
  itemValue: number
  lineTotal: number
  sourceTab: string
}

export type JobDateGroup = {
  jobNumber: string
  customerName: string
  requiredByDate: string
  totalValue: number
  hasInstall: boolean
  productLines: ProductLine[]
}

export type Job = {
  jobNumber: string
  customerName: string
  projectManager: string
  pmInitials: string
  dateGroups: JobDateGroup[]
}

export type PMBoard = {
  pmInitials: string
  projectManager: string
  totalProjects: number
  totalValue: number
  tableRows: JobDateGroup[]
}

export type CachedDashboard = {
  boards: PMBoard[]
  lastRefreshed: string
  tabsProcessed: string[]
}