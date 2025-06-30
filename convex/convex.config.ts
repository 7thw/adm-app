import r2 from "@convex-dev/r2/convex.config";
import resend from "@convex-dev/resend/convex.config";
import { defineApp } from "convex/server";


const app = defineApp();
app.use(r2);
app.use(resend);

export default app;
