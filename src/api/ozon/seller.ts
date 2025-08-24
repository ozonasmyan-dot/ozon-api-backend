import axios from 'axios';

export const sellerClient = axios.create({
    baseURL: 'https://api-seller.ozon.ru',
    headers: {
        'Content-Type': 'application/json',
        'Client-Id': '2313514',
        'Api-Key': '6dbd1f5d-8825-45fd-b786-9a0f0f94d3b7',
    }
});
