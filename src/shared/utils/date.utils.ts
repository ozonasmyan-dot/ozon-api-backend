export const generateDatesFrom = (startDateStr: string) => {
    const result = [];
    const [year, month, day] = startDateStr.split('-').map(Number);

    // Москва — UTC+3, создаём дату как локальную
    let current = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const now = new Date();
    const moscowNow = new Date(now.getTime() + 3 * 60 * 60 * 1000); // прибавляем 3 часа

    current.setUTCHours(0, 0, 0, 0);
    moscowNow.setUTCHours(0, 0, 0, 0);

    while (current <= moscowNow) {
        // Преобразуем к московскому времени и берём YYYY-MM-DD
        const moscowDate = new Date(current.getTime() + 3 * 60 * 60 * 1000);
        const dateStr = moscowDate.toISOString().slice(0, 10);
        result.push(dateStr);
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return result;
}

export const get62DayRanges = (
    start: string,
    days = 50
): { from: string; to: string }[] => {
    const result: { from: string; to: string }[] = [];

    let from = new Date(start);
    const today = new Date();

    while (from <= today) {
        const to = new Date(from);
        to.setDate(to.getDate() + days);

        // если вылезли за сегодня — обрежем
        if (to > today) {
            result.push({
                from: formatDate(from),
                to: formatDate(today),
            });
            break;
        }

        result.push({
            from: formatDate(from),
            to: formatDate(to),
        });

        // следующий from = предыдущий to + 1 день
        from = new Date(to);
        from.setDate(from.getDate() + 1);
    }

    return result;

    function formatDate(d: Date): string {
        return d.toISOString().split("T")[0]; // YYYY-MM-DD
    }
};

