import { Request, Response, Router } from "express";
import { TelegramRouter } from "./telegram/router";



export class AppRoutes {
    static get routes(): Router{
        const router = Router();

        router.use('/telegram',TelegramRouter.routes);

        return router;
    }
}