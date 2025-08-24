import express from 'express';
import unitRouter from "@/modules/unit/unit.route";
import advertisingRouter from "@/modules/advertising/advertising.route";
import analyticsRouter from "@/modules/analytics/analytics.route";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors({
    origin: "http://localhost:8080",
    credentials: true
}));

app.use('/unit', unitRouter);
app.use('/ads', advertisingRouter);
app.use("/analytics", analyticsRouter);

app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});