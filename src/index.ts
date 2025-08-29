import express from 'express';
import '@/infrastructure/di/container';
import unitRouter from "@/modules/unit/presentation/unit.router";
import advertisingRouter from "@/modules/advertising/presentation/advertising.router";
import analyticsRouter from "@/modules/analytics/presentation/analytics.router";
import cors from "cors";
import { PORT, CORS_ORIGIN } from '@/config';
import errorHandler from "@/shared/middleware/errorHandler";
import { logger } from '@/shared/logger';
import '@/bot';
import '@/modules/advertising/infrastructure/advertising.cron';

const app = express();

app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));

app.use('/unit', unitRouter);
app.use('/ads', advertisingRouter);
app.use("/analytics", analyticsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🚀 Server is running at http://localhost:${PORT}`);
});
