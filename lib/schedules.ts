export type ScheduleArticle = {
  scheduleId: string
  keyword: string
  interval?: string
  status?: string
  article?: string
  faqs?: string
  metaTitle?: string
  metaDescription?: string
  generatedAt: string
  updatedAt: string
}

const schedules = new Map<string, ScheduleArticle>()

export function upsertScheduleArticle(data: ScheduleArticle) {
  schedules.set(data.scheduleId, data)
}

export function getScheduleArticles() {
  return Array.from(schedules.values()).sort((a, b) => {
    if (a.updatedAt === b.updatedAt) return 0
    return a.updatedAt > b.updatedAt ? -1 : 1
  })
}

export function getScheduleArticle(scheduleId: string) {
  return schedules.get(scheduleId) ?? null
}

export function deleteScheduleArticle(scheduleId: string) {
  schedules.delete(scheduleId)
}
