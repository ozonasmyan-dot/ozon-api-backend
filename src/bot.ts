import {Telegraf, Markup, Context} from 'telegraf';
import {BOT_TOKEN} from '@/config';
import {AnalyticsService} from '@/modules/analytics/application/analytics.service';
import {DrrProductDto, DrrResponseDto} from '@/modules/analytics/application/dto/drr.dto';
import dayjs from 'dayjs';

import {UnitService} from '@/modules/unit/application/unit.service';
import {AdvertisingService} from '@/modules/advertising/application/advertising.service';
import container from "@/infrastructure/di/container";

const unitService = container.resolve(UnitService);
const advertisingService = container.resolve(AdvertisingService);
const analyticsService = container.resolve(AnalyticsService);

type AdType =
    | 'PLACEMENT_TOP_PROMOTION'
    | 'CPO'
    | 'PLACEMENT_SEARCH_AND_CATEGORY';

const adsTypes: Record<AdType, string> = {
    'PLACEMENT_TOP_PROMOTION': 'Вывод в топ',
    'CPO': 'Оплата за заказ',
    'PLACEMENT_SEARCH_AND_CATEGORY': 'Трафареты',
};

const productsSku: Record<string, string> = {
    '2586085325': 'Шапка беж',
    '2586059276': 'Шапка хаки',
    '1763835247': 'Шапка черная',
    '1828048543': 'Сумка черная',
    '1828048513': 'Сумка серая',
    '1828048540': 'Сумка бордовая',
};

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN не задан');
}

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(value);

function formatDrrMessage({products, totals}: DrrResponseDto): string {
    let text = '📊 Отчёт по DRR\n\n';

    products.forEach((p: DrrProductDto) => {
        text += `👜 SKU: ${productsSku[p.sku] ?? p.sku}\n`;
        text += `   • Заказы: ${p.orders.count} шт. на ${formatCurrency(p.orders.money)}\n`;
        text += `   • Реклама: ${formatCurrency(p.ads.totals)}\n`;

        p.ads.items.forEach((item) => {
            const label = item.type in adsTypes ? adsTypes[item.type as AdType] : item.type;
            text += `      - ${label}: ${formatCurrency(item.money)}\n`;
        });

        text += `   • DRR: ${p.drr}%\n\n`;
    });

    text += `💡 Итого по всем товарам:\n`;
    text += `   • Заказы: ${totals.orders.count} шт. на ${formatCurrency(totals.orders.money)}\n`;
    text += `   • Реклама: ${formatCurrency(totals.ads.totals)}\n`;
    text += `   • DRR: ${totals.drr}%`;

    return text;
}

/**
 * Универсальный помощник: показывает «загрузку», держит typing и редактирует итоги.
 * @param ctx Telegraf Context
 * @param work функция, которая должна вернуть текст для отправки
 * @param loadingText настраиваемый текст загрузки
 */
async function withLoading(
    ctx: Context,
    work: () => Promise<string>,
    loadingText = '⏳ Загружаю данные, подождите...'
): Promise<void> {
    // Сообщение «загрузка»
    const loadingMsg = await ctx.reply(loadingText);

    // Периодически отправляем "typing", чтобы пользователь видел активность
    const typingTimer = setInterval(() => {
        // безопасно игнорируем ошибки (например, если чат/сообщение недоступно)
        void ctx.sendChatAction('typing').catch(() => {});
    }, 4000);

    try {
        const text = await work();

        await ctx.telegram.editMessageText(
            ctx.chat!.id,
            loadingMsg.message_id,
            undefined,
            text
        );
    } catch (err) {
        await ctx.telegram.editMessageText(
            ctx.chat!.id,
            loadingMsg.message_id,
            undefined,
            '⚠️ Произошла ошибка при получении данных'
        );
        console.error('[withLoading] Ошибка:', err);
    } finally {
        clearInterval(typingTimer);
    }
}

const bot = new Telegraf(BOT_TOKEN);

const mainKb = Markup.keyboard([
    ['📊 Получить DRR сумок'],
    ['📊 Получить DRR шапок'],
    ['📊 Получить DRR общий']
]).resize();

bot.start(async (ctx: Context) => {
    await ctx.reply('Привет! Нажми нужную кнопку ниже:', mainKb);
});

bot.hears('📊 Получить DRR общий', async (ctx: Context) => {
    await withLoading(ctx, async () => {
        await Promise.all([
            unitService.sync(),
            advertisingService.sync(),
        ]);

        const result = await analyticsService.getDrr({
            date: dayjs().format('YYYY-MM-DD')
        });

        return formatDrrMessage(result);
    });
});

bot.hears('📊 Получить DRR сумок', async (ctx: Context) => {
    await withLoading(ctx, async () => {
        await Promise.all([
            unitService.sync(),
            advertisingService.sync(),
        ]);

        const result = await analyticsService.getDrr({
            date: dayjs().format('YYYY-MM-DD'),
            sku: ['1828048543', '1828048513', '1828048540'],
        });

        return formatDrrMessage(result);
    });
});

bot.hears('📊 Получить DRR шапок', async (ctx: Context) => {
    await withLoading(ctx, async () => {
        await Promise.all([
            unitService.sync(),
            advertisingService.sync(),
        ]);

        const result = await analyticsService.getDrr({
            date: dayjs().format('YYYY-MM-DD'),
            sku: ['2586085325', '2586059276', '1763835247'],
        });

        return formatDrrMessage(result);
    });
});

bot
    .launch()
    .then(() => console.log('Bot started'))
    .catch((err: unknown) => console.error('Bot launch failed', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
