import axios from 'axios';

const token = process.env.BOT_TOKEN!;
const apiUrl = `https://api.telegram.org/bot${token}`;

let offset = 0;

async function poll() {
    try {
        const { data } = await axios.get(`${apiUrl}/getUpdates`, {
            params: { timeout: 30, offset }
        });

        for (const update of data.result) {
            offset = update.update_id + 1;
            const message = update.message;
            if (!message) continue;

            const chatId = message.chat.id;
            const text = message.text;

            if (text === '/start') {
                await axios.post(`${apiUrl}/sendMessage`, {
                    chat_id: chatId,
                    text: 'Нажмите кнопку, чтобы получить дрр',
                    reply_markup: {
                        keyboard: [[{ text: 'Получить дрр' }]],
                        resize_keyboard: true
                    }
                });
            } else if (text === 'Получить дрр') {
                await axios.post(`${apiUrl}/sendMessage`, {
                    chat_id: chatId,
                    text: 'дрр'
                });
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        setTimeout(poll, 1000);
    }
}

poll();
