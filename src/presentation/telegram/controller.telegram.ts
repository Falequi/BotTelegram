import { Request, Response } from "express";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { envs } from "../../config/envs";



export class TelegramController {

    bot = new Telegraf(envs.BOT_TOKEN)

    public getMnesajes = (mensaje:string) => {
        
        this.bot.command(mensaje,(ctx)=>{
            ctx.reply('Hola desde el bot');
        })
        this.bot.start((ctx) => ctx.reply('Welcome'))
        this.bot.help((ctx) => ctx.reply('Send me a sticker'))
        this.bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
        this.bot.hears('hi', (ctx) => ctx.reply('Hey there'))
        this.bot.launch()

        // Enable graceful stop
        process.once('SIGINT', () => this.bot.stop('SIGINT'))
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
    }

}