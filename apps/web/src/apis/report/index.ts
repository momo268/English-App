import { serverApi, type Response } from '..'
import type { WeeklyReport } from '@en/common/report'

export const getWeeklyReport = (weekStart?: string) => {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : ''
  return serverApi.get(`/report/weekly${query}`) as Promise<Response<WeeklyReport>>
}
