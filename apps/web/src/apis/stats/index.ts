import { serverApi, type Response } from '..'
import type {
    HeatmapData,
    HomeSummary,
    MasteryBucket,
    RecentCourse,
    StatsOverview,
    TrendPoint,
    WeakWord,
} from '@en/common/stats'

export const getHomeSummary = () =>
    serverApi.get('/home/summary') as Promise<Response<HomeSummary>>

export const getStatsOverview = () =>
    serverApi.get('/stats/overview') as Promise<Response<StatsOverview>>

export const getStatsHeatmap = (weeks = 26) =>
    serverApi.get(`/stats/heatmap?weeks=${weeks}`) as Promise<Response<HeatmapData>>

export const getStatsTrend = (days = 30) =>
    serverApi.get(`/stats/trend?days=${days}`) as Promise<Response<TrendPoint[]>>

export const getStatsMastery = () =>
    serverApi.get('/stats/mastery') as Promise<Response<MasteryBucket[]>>

export const getStatsWeakWords = (limit = 8) =>
    serverApi.get(`/stats/weak-words?limit=${limit}`) as Promise<Response<WeakWord[]>>

export const getRecentCourses = () =>
    serverApi.get('/stats/recent-courses') as Promise<Response<RecentCourse[]>>
