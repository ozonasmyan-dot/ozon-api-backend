export const toCsv = (rows: Record<string, unknown>[]): string => {
    if (rows.length === 0) {
        return '';
    }

    const headers = Object.keys(rows[0]);

    const escape = (val: unknown): string => {
        if (val === null || val === undefined) {
            return '';
        }

        const str = val instanceof Date ? val.toISOString() : String(val);
        const escaped = str.replace(/"/g, '""');
        return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    };

    const data = rows.map((row) => headers.map((h) => escape((row as any)[h])).join(','));
    return [headers.join(','), ...data].join('\n');
};

export default toCsv;
