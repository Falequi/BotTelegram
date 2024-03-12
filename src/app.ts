import { envs } from "../src/config/envs"
import { Telegraf } from "telegraf"
import { message } from "telegraf/filters"


const bot = new Telegraf(envs.BOT_TOKEN);

bot.on(message("text"), async ctx => {
	await ctx.sendMessage("Hello!");
});



// Launch bot
bot.launch();













// bot.command('hola', (ctx) => {
//     const { first_name, last_name } = ctx.update.message.from;
//     ctx.reply(`Hola ${ first_name }`);
// })
// bot.launch();