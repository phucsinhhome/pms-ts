export const formatVND = (amount: number) => {
    return amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })
}

export const lastDateOf = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export const lastDateOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export const beginOfDay = (date: Date) => {
    date.setHours(7, 0, 0, 0)
    return date
}

export const endOfDay = (date: Date) => {
    date.setHours(23)
    date.setMinutes(59)
    date.setSeconds(59)
    return date
}

export const addDays = (date: Date, numOfDays: number) => {
    return new Date(date.getTime() + numOfDays * 86400000)
}

export const adjustMonths = (date: Date, numOfMonths: number) => {
    return new Date(date.setMonth(date.getMonth() + numOfMonths))
}

export const beginOfMonth = (date: Date) => {
    date.setDate(1)
    beginOfDay(date)
    return date
}

export const formatShortDate = (date: Date) => {
    // Format: Jul 30, 2024
    return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
}

export const formatISODate = (date: Date) => {
    // Format: 2024-07-30
    // Input: Date('Tue Aug 27 2024 00:00:00 GMT+0700') => Output: 2024-08-26
    // Input: Date('2024-08-27') => Output: 2024-08-27
    // Note: this will convert the date time to UTC. So, add the zoned time, so it will keep the same date
    return date.toISOString().substring(0, 10)
}

export const formatISODateTime = (date: Date) => {
    // Format: 2024-07-30
    // Input: Date('Tue Aug 27 2024 00:00:00 GMT+0700') => Output: 2024-08-26T17:00:00
    // Input: Date('2024-08-27') => Output: 2024-08-27T00:00:00
    // Note: this will convert the date time to UTC. So, add the zoned time, so it will keep the same date
    return date.toISOString().substring(0, 19)
}

export const formatDatePartition = (date: Date) => {
    // Format: 2024/07/30
    var isoDateString = formatISODate(date)
    return isoDateString.replace("-", "/")
}

export const formatMonthPartition = (date: Date) => {
    // Format: 2024/07/30
    var isoDateString = formatISODate(date)
    var dateString = isoDateString.substring(0, "2024-07".length)
    return dateString.replace("-", "/")
}

export const format2DigitDate = (date: Date) => {
    // Format: 07/30/2024
    return date.toLocaleDateString("en-US", { year: 'numeric', month: '2-digit', day: 'numeric' })
}

export const formatDateMonthDate = (date: Date) => {
    // Format: Jul 30
    return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })
}

export const formatVNDateTime = (date: Date) => {
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

export const formatRooms = (rooms: string[]) => {
    return rooms ? rooms.join('.') : "[]"
}

export const formatLongDateTime = (date: Date) => {
    // Format: 20241218160422
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}