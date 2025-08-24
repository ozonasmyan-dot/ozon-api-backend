import express from 'express';
import unitRouter from "@/modules/unit/unit.route";
import advertisingRouter from "@/modules/advertising/advertising.route";
import analyticsRouter from "@/modules/analytics/analytics.route";
import cors from "cors";
import { PORT, CORS_ORIGIN } from '@/config';

const app = express();

app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));

app.use('/unit', unitRouter);
app.use('/ads', advertisingRouter);
app.use("/analytics", analyticsRouter);

app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
