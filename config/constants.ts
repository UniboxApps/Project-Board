export const ALWAYS_READ_TABS = ['List'] // Never toggled off — PM source

export const CACHE_REFRESH_MINUTES = 10

export const REDIS_KEYS = {
  dashboard: 'dashboard:cache',
  tabConfig:  'settings:selected-tabs',
} as const