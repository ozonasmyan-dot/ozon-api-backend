export const toNumber = (value: string): number => {
    return parseFloat(value.replace(/\s/g, '').replace(',', '.')) || 0;
}
