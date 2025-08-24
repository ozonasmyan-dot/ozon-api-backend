import {Telegraf, Markup} from 'telegraf';
import {BOT_TOKEN} from '@/config';
import container from "@/infrastructure/di/container";
import {AnalyticsService} from "@/modules/analytics/service/service";
import dayjs from "dayjs"; // или process.env.BOT_TOKEN

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN не задан');
}

function formatDrrMessage(data: any) {
    const {products, totals} = data;

    let text = '📊 Отчёт по DRR\n\n';

    // по каждому товару
    products.forEach((p: any) => {
        text += `👜 SKU: ${p.sku}\n`;
        text += `   • Заказы: ${p.orders.count} шт. на ${p.orders.money} ₽\n`;
        text += `   • Реклама: ${p.ads.totals} ₽\n`;

        // по типам рекламы
        p.ads.items.forEach((item: any) => {
            text += `      - ${item.type}: ${item.money} ₽\n`;
        });

        text += `   • DRR: ${p.drr}%\n\n`;
    });

    // блок тоталов
    text += `💡 Итого по всем товарам:\n`;
    text += `   • Заказы: ${totals.orders.count} шт. на ${totals.orders.money} ₽\n`;
    text += `   • Реклама: ${totals.ads.totals} ₽\n`;
    text += `   • DRR: ${totals.drr}%`;

    return text;
}

const analyticsService = container.resolve(AnalyticsService);

const bot = new Telegraf(BOT_TOKEN);

const mainKb = Markup.keyboard([
    ['📊 Получить DRR сумок', '📊 Получить DRR шапок']
]).resize();

bot.start(async (ctx) => {
    await ctx.reply('Привет! Нажми нужную кнопку ниже:', mainKb);
});

bot.hears('📊 Получить DRR сумок', async (ctx) => {
    const result = await analyticsService.getDrr({
        date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
        sku: ['1828048543', '1828048513', '1828048540'],
    });

    const msg = formatDrrMessage(result);

    await ctx.reply(msg);
});

bot.hears('📊 Получить DRR шапок', async (ctx) => {
    const result = await analyticsService.getDrr({
        date: dayjs().format('YYYY-MM-DD'),
        sku: ['2586085325', '2586059276', '1763835247'],
    });

    const msg = formatDrrMessage(result);

    await ctx.reply(msg);
});

bot.launch().then(() => console.log('Bot started'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
