import express from 'express';
import '@/infrastructure/di/container';
import unitRouter from "@/modules/unit/route";
import advertisingRouter from "@/modules/advertising/route";
import analyticsRouter from "@/modules/analytics/route";
import cors from "cors";
import { PORT, CORS_ORIGIN } from '@/config';
import errorHandler from "@/shared/middleware/error.middleware";

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
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
