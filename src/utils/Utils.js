
// write a method to return only first 10 words from a string
export const truncateString = (str, wordCount) => {
    if (!str) return ""
    const words = str.split(" ");

    const truncatedWords = words.slice(0, wordCount).join(" ") + "...";

    // make sure the truncated words is not longer than 20 words
    if (truncatedWords.length > wordCount) {
        // return first 20 characters
        return str.substring(0, wordCount) + "...";
    }

    if (words.length <= wordCount) {
        return str;
    }

    return truncatedWords
}
export function formatTime(time) {
    if (!time) return null;

    const date = new Date(time);
    const now = new Date();

    if (isSameDay(date, now)) {
        return formatHourMinute(date);
    } else if (isYesterday(date, now)) {
        return `Yesterday ${formatHourMinute(date)}`;
    } else if (isSameWeek(date, now)) {
        return formatDayOfWeekHourMinute(date);
    } else if (isSameYear(date, now)) {
        return formatMonthDayHourMinute(date);
    } else {
        return formatYearMonthDayHourMinute(date);
    }
}


function isSameDay(date1, date2) {

    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDay() === date2.getDay()
    );
}

function isYesterday(date1, date2) {
    const yesterday = new Date(date2);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(date1, yesterday);
}

function getWeek(date) {
    const janFirst = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date.getTime() - janFirst.getTime()) / 86400000) + janFirst.getDay() + 1) / 7);
}

function isSameWeek(dateA, dateB) {
    return getWeek(dateA) === getWeek(dateB);
}


function isSameYear(date1, date2) {
    return date1.getFullYear() === date2.getFullYear();
}

function formatHourMinute(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
}

function formatDayOfWeekHourMinute(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    return `${dayOfWeek} ${formatHourMinute(date)}`;
}

function formatMonthDayHourMinute(date) {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${day} ${month} ${formatHourMinute(date)}`;
}

function formatYearMonthDayHourMinute(date) {
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${year} ${day} ${month} ${formatHourMinute(date)}`;
}

