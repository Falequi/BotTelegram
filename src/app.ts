import { Telegraf, Context, Markup } from 'telegraf'; // Importa Context de telegraf
import axios from 'axios';
import { envs } from "./config/envs";
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

interface Partidos {
	id: number,
	fecha: string,
	lugar: string,
	hora: string
}

// Crea una nueva instancia de Telegraf
const bot = new Telegraf(envs.BOT_TOKEN);

// para capturar el id del usuario
let Idtelegram: number | null = null;
let usuarioConIdIdentificado = undefined;
let usuario = undefined;

// Manejador de comandos al iniciar el bot
bot.command('start', async (ctx) => {

	// Variable para capturar el ID del usuario
	Idtelegram = ctx.from.id;

	usuarioConIdIdentificado = await buscarIdTelegram(Idtelegram);

	if (usuarioConIdIdentificado) {
		await ctx.reply(`Bienvenido ${usuarioConIdIdentificado.nombre_corto}`);
		mostrarMenu(ctx);
	}
	else {
		// Si el usuario no se encuentra, pide al usuario que ingrese su número de cédula
		await ctx.reply("Por favor, digita el número de tu cédula:");
	}

});

if (!usuarioConIdIdentificado) {
	// Manejador de eventos de texto
	bot.on('text', async (ctx) => {

		if (Idtelegram === null) {
			// Si el ID de Telegram no se ha capturado, salir
			return;
		}

		const cedula = ctx.message.text;

		try {
			// Buscar al usuario por su número de cédula
			usuario = await buscarJugador(cedula);

			if (usuario) {
				// Si se encuentra al usuario, registrar su ID de Telegram y dar la bienvenida
				await registrarIdTelegram(ctx, usuario);
				mostrarMenu(ctx);
			} else {
				// Si el usuario no se encuentra, informar al usuario
				await ctx.reply("El número de cédula no coincide con ningún usuario. Por favor, comunícate con el administrador.");
			}
		} catch (error) {
			// Manejar el error
			await ctx.reply('Ocurrió un error al buscar el usuario por número de cédula. Por favor, comunícate con el administrador.');
		}
	});
}


// Función para buscar al usuario por su ID de Telegram
async function buscarIdTelegram(IdTelegram: number | null) {

	if (IdTelegram === null) {
		return null;
	}

	const usuario = (await axios.get(`${envs.URL_API}/jugadores/jugadoridteletram/"${IdTelegram}"`)).data;
	return usuario;
}

// Función para buscar al usuario por su número de cédula
async function buscarJugador(cedula: string) {
	usuario = (await axios.get(`${envs.URL_API}/jugadores/jugadorporcedula/${cedula}`)).data;
	return usuario;
}

// Función para registrar el ID de Telegram del usuario
async function registrarIdTelegram(ctx: Context, usuario: any) {

	await axios.put(`${envs.URL_API}/jugadores/${usuario.id}`, { "id_telegram": `"${Idtelegram}"` })
	// Realiza la acción de registro aquí
	await ctx.reply(`Bienvenido ${usuario.nombre_corto}`);
	// Aquí puedes registrar el ID de Telegram del usuario si es necesario
}

// Función para mostrar el menú principal
function mostrarMenu(ctx: Context) {

	const tituloMenu = "Que desas hacer";
	const chatId = ctx.chat?.id;
	if (chatId) {
		bot.telegram.sendMessage(ctx.chat.id, tituloMenu, {
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

bot.action('verPartidos', async ctx => {

	const currentDate = new Date();
	const partidos: Partidos[] = (await axios.get(`${envs.URL_API}/partidos`)).data;

	// Filtrar los partidos cuya fecha sea mayor que la fecha actual
	const partidosFuturos = partidos.filter(partido => new Date(partido.fecha) > currentDate);

	if (partidosFuturos.length === 0) {
		ctx.reply('No hay partidos disponibles.');
		return;
	}

	const inlineKeyboard = Markup.inlineKeyboard(
		partidosFuturos.map(partido => {
			const { id, fecha, lugar, hora } = partido;
			const fechaPartido = new Date(fecha);
			const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
			const dia = fechaPartido.getDate();
			const diaNombre = diaSemana[fechaPartido.getDay()];
			return [
				Markup.button.callback(
					`Fecha: ${diaNombre} ${dia} Lugar: ${lugar} Hora: ${hora}`,
					`partido_${id}`
				)
			];
		})
	);
	ctx.reply('Selecciona en que partido deseas inscribirte:', inlineKeyboard);
});

bot.action(/^partido_(\d+)$/, async (ctx) => {
	const partidoId = ctx.match![1];

	// Aquí puedes utilizar el id del partido para realizar alguna acción
	// Por ejemplo, buscar más detalles del partido en tu base de datos
	const partido = (await axios.get(`${envs.URL_API}/partidos/${partidoId}`)).data;

	// Crear un teclado inline con las opciones "Registrarse" y "Cancelar"
	const inlineKeyboard: InlineKeyboardMarkup = {
		inline_keyboard: [
			[{ text: "Registrarse", callback_data: `registrarse_${ctx.from!.id}_${partidoId}` }],
			[{ text: "Cancelar Asistencia", callback_data: `cancelar_${ctx.from!.id}_${partidoId}` }],
			[{ text: "Ver Lista Jugadores", callback_data: `lista_${ctx.from!.id}_${partidoId}` }]
		]
	};

	// Respondemos al usuario con los detalles del partido seleccionado y el teclado inline
	await ctx.reply(`Has seleccionado el partido:
        Fecha: ${partido.fecha}
        Lugar: ${partido.lugar}
        Hora: ${partido.hora}`, { reply_markup: inlineKeyboard });
});


bot.action(/^registrarse_(\d+)_(\d+)$/, async (ctx: any) => {

	const currenDate = new Date();
	const jugadorIdTelegram = ctx.match[1];
	const partidoId = ctx.match[2];
	const partido = (await axios.get(`${envs.URL_API}/partidos/${partidoId}`)).data;
	const listadoJugadores = (await axios.get(`${envs.URL_API}/partido_jugadores/partidojugadores_idpartido/${partidoId}`)).data;
	const { id, nombre_corto } = (await axios.get(`${envs.URL_API}/jugadores/jugadoridteletram/"${jugadorIdTelegram}"`)).data;

	try {
		await axios.get(`${envs.URL_API}/partido_jugadores/partidojugadore_idjugador_idpartido/${id}/${partidoId}`)
		await ctx.reply("ya esta registrado");
	} catch (error) {
		if (new Date(partido.fecha) > currenDate) {
			await axios.post(`${envs.URL_API}/partido_jugadores/create_idjugador_idpartido`, {
				"id_jugador": parseInt(id),
				"id_partido": parseInt(partidoId),
				"equipo": "",
			});
			(listadoJugadores.length < 27)
				? await ctx.reply("Ha sido registrado con exito")
				: await ctx.reply(`Ha sido registrado en *reserva*, Ya que estan registrados ${listadoJugadores.length} Jugadores`);

			// Notificar al usuario con ID 646386747 sobre el nuevo registro
			const mensajeNotificacion = `¡Nueva inscripción en el partido!\nPartido ID: ${partidoId}\nJugador: ${nombre_corto}`;
			await bot.telegram.sendMessage("646386747", mensajeNotificacion);
		} else {
			await ctx.reply(`Este partido ya paso, por favor vuelve a digitar /start y revisa los partidos disponibles`);
		}
	}

});

bot.action(/^cancelar_(\d+)_(\d+)$/, async (ctx: any) => {

	const jugadorIdTelegram = ctx.match[1];
	const partidoId = ctx.match[2];
	const { id, nombre_corto } = (await axios.get(`${envs.URL_API}/jugadores/jugadoridteletram/"${jugadorIdTelegram}"`)).data;

	const { numero_registros } = (await axios.delete(`${envs.URL_API}/partido_jugadores/delete_id_jugador_id_partido/${id}/${partidoId}`)).data;

	numero_registros > 0 ? ctx.reply("Asistencia Cancelada") : ctx.reply("No esta registrado en este partido");

	// Notificar al usuario con ID 646386747 sobre el nuevo registro
	const mensajeNotificacion = `¡Nueva Cancelacion en el partido!\nPartido ID: ${partidoId}\nJugador: ${nombre_corto}`;
	await bot.telegram.sendMessage("646386747", mensajeNotificacion);

});

bot.action(/^lista_(\d+)_(\d+)$/, async (ctx: any) => {

	const partidoId = ctx.match[2];
	const partido = (await axios.get(`${envs.URL_API}/partidos/${partidoId}`)).data;
	const listadoJugadores = (await axios.get(`${envs.URL_API}/partido_jugadores/partidojugadores_idpartido/${partidoId}`)).data;

	// Crear un mensaje con los nombres de los jugadores
	let mensaje = `*Listado de jugadores Partido:*
	*Fecha: ${partido.fecha}*
	*Lugar ${partido.lugar}*
	*Lugar ${partido.hora}*
	------------------------\n`;
	listadoJugadores.forEach((jugador: any, i: number) => {
		(i < 27)
		? mensaje += `${i + 1}. ${jugador.nombre_corto} ${ jugador.socio || jugador.estado_pago ? '*X*': '*Debe*'}  \n`
			: mensaje += `------------------------
		*reserva*
		${i + 1}. ${jugador.nombre_corto}\n`;
	});

	// Enviar el mensaje como respuesta
	await ctx.replyWithMarkdown(mensaje);

});

bot.action('salir', ctx => {
	ctx.reply('Hasta luego!', Markup.removeKeyboard());
});



// Manejador de errores
bot.catch((err: unknown, ctx: Context) => {
	console.log(`Ocurrió un error en el chat ${ctx.updateType}`, err);
});

// Iniciar el bot
bot.launch();

// Habilitar detención grácil
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));