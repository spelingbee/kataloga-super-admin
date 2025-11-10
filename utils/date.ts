import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format)
}

export const formatRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow()
}

export const formatDateShort = (date: string | Date) => {
  return dayjs(date).format('MMM D, YYYY')
}

export const formatDateTime = (date: string | Date) => {
  return dayjs(date).format('MMM D, YYYY h:mm A')
}

export const isToday = (date: string | Date) => {
  return dayjs(date).isSame(dayjs(), 'day')
}

export const isThisWeek = (date: string | Date) => {
  return dayjs(date).isSame(dayjs(), 'week')
}

export const isThisMonth = (date: string | Date) => {
  return dayjs(date).isSame(dayjs(), 'month')
}
