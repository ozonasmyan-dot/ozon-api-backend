import dayjs, {Dayjs} from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

export const generateDatesFrom = (startDate: Dayjs): Dayjs[] => {
    const result: Dayjs[] = [];

    // Приводим вход к Dayjs UTC
    let current = dayjs.isDayjs(startDate)
        ? startDate.utc().startOf("day")
        : dayjs.utc(startDate, "YYYY-MM-DD").startOf("day");

    const now = dayjs.utc().startOf("day");

    while (current.isSameOrBefore(now)) {
        result.push(current); // ✅ возвращаем Dayjs
        current = current.add(1, "day");
    }

    return result;
};

export const get62DayRanges = (
    start: Dayjs,
    days = 50
): { from: Dayjs; to: Dayjs }[] => {
    const result: { from: Dayjs; to: Dayjs }[] = [];

    let from = dayjs().startOf('day');
    const today = dayjs.utc().startOf("day");

    while (from.isSameOrBefore(today)) {
        let to = from.add(days, "day");

        if (to.isAfter(today)) {
            result.push({from, to});
            break;
        }

        result.push({from, to});

        from = to.add(1, "day");
    }

    return result;
};

export const parseYerevanWithCurrentTime = (dateStr: Dayjs): Dayjs => {
    // исходная дата в Ереване
    const yerevan = dayjs.tz(dateStr, "DD.MM.YYYY", "Asia/Yerevan");

    // приводим к UTC
    const baseUtc = dayjs.utc(yerevan.format("YYYY-MM-DDTHH:mm:ss.SSS"));

    // подставляем текущее время
    const now = dayjs();
    return baseUtc
        .hour(now.hour())
        .minute(now.minute())
        .second(now.second())
        .millisecond(now.millisecond());
};