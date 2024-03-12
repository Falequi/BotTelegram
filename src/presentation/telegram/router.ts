import { Router } from "express"
import { TelegramController } from './controller.telegram';



export class TelegramRouter{

    static get routes(): Router{

        const router = Router();

        const telegramController = new TelegramController();

        router.get('/',telegramController.getMnesajes);

        return router;

    }


}

