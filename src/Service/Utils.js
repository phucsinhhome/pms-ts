export const formatVND = (amount) => {
    return amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })
}

export const lastDateOf = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export const lastDateOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export const beginOfDay = (date) => {
    date.setHours(7, 0, 0, 0)
    return date
}

export const endOfDay = (date) => {
    date.setHours(23)
    date.setMinutes(59)
    date.setSeconds(59)
    return date
}

export const addDays = (date, numOfDays) => {
    return new Date(date.getTime() + numOfDays * 86400000)
}

export const adjustMonths = (date, numOfMonths) => {
    return new Date(date.setMonth(date.getMonth() + numOfMonths))
}

export const beginOfMonth = (date) => {
    date.setDate(1)
    beginOfDay(date)
    return date
}

const dateShortOptions = { year: 'numeric', month: 'short', day: 'numeric' }
export const formatShortDate = (date) => {
    // Format: Jul 30, 2024
    return date.toLocaleDateString("en-US", dateShortOptions)
}

export const formatISODate = (date) => {
    // Format: 2024-07-30
    // Input: Date('Tue Aug 27 2024 00:00:00 GMT+0700') => Output: 2024-08-26
    // Input: Date('2024-08-27') => Output: 2024-08-27
    // Note: this will convert the date time to UTC. So, add the zoned time, so it will keep the same date
    return date.toISOString().substring(0, 10)
}

export const formatISODateTime = (date) => {
    // Format: 2024-07-30
    // Input: Date('Tue Aug 27 2024 00:00:00 GMT+0700') => Output: 2024-08-26T17:00:00
    // Input: Date('2024-08-27') => Output: 2024-08-27T00:00:00
    // Note: this will convert the date time to UTC. So, add the zoned time, so it will keep the same date
    return date.toISOString().substring(0, 19)
}

export const formatDatePartition = (date) => {
    // Format: 2024/07/30
    var isoDateString = formatISODate(date)
    return isoDateString.replaceAll("-", "/")
}

export const formatMonthPartition = (date) => {
    // Format: 2024/07/30
    var isoDateString = formatISODate(date)
    var dateString = isoDateString.substring(0, "2024-07".length)
    return dateString.replaceAll("-", "/")
}

const date2DigitOptions = { year: 'numeric', month: '2-digit', day: 'numeric' }
export const format2DigitDate = (date) => {
    // Format: 07/30/2024
    return date.toLocaleDateString("en-US", date2DigitOptions)
}

const dateMonthOptions = { month: 'short', day: 'numeric' }
export const formatDateMonthDate = (date) => {
    // Format: Jul 30
    return date.toLocaleDateString("en-US", dateMonthOptions)
}

export const formatVNDateTime = (date) => {
    // Format: 07/30/2024
    return date.toLocaleDateString("en-GB", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
}

export const formatRooms = (rooms) => {
    return rooms ? rooms.join('.') : "[]"
}

export const formatLongDateTime = (date) => {
    // Format: 20241218160422
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}