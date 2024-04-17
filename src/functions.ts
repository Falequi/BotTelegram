import axios from "axios";
import { Context, Telegraf } from "telegraf";
import { envs } from "./config/envs";

let usuario: any = undefined;

// Función para mostrar el menú principal
function mostrarMenu(ctx: Context, bot: Telegraf) {

	const tituloMenu = "Que desas hacer";
	const chatId = ctx.chat?.id;
	if (chatId) {

		bot.telegram.sendMessage(ctx.chat!.id, tituloMenu, {
			reply_markup: {
				inline_keyboard: [
					[
						{ text: "Ver partidos disponibles", callback_data: 'verPartidos' },
					],
					[
						{ text: "salir", callback_data: 'salir' }
					]
				]
			}
		})
	} else {
		console.error("No se pudo obtener el ID del chat.");
	}
}

// Función para buscar al usuario por su ID de Telegram
async function buscarIdTelegram(IdTelegram: number | null) {

	if (IdTelegram === null) {
		return null;
	}

	usuario = (await axios.get(`${envs.URL_API}/jugadores/jugadoridteletram/"${IdTelegram}"`)).data;
	return usuario;
}

// Función para buscar al usuario por su número de cédula
async function buscarJugador(cedula: string) {
	usuario = (await axios.get(`${envs.URL_API}/jugadores/jugadorporcedula/${cedula}`)).data;
	return usuario;
}

// Función para registrar el ID de Telegram del usuario
async function registrarIdTelegram(ctx: Context, usuario: any, Idtelegram: number | null) {

	await axios.put(`${envs.URL_API}/jugadores/${usuario.id}`, { "id_telegram": `"${ Idtelegram }"` })
	// Realiza la acción de registro aquí
	await ctx.reply(`Bienvenido ${usuario.nombre_corto}`);
	// Aquí puedes registrar el ID de Telegram del usuario si es necesario
}



export { mostrarMenu, buscarIdTelegram, buscarJugador, registrarIdTelegram }

