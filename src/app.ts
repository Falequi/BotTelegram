import { Telegraf, Context, Markup } from 'telegraf'; // Importa Context de telegraf
import axios from 'axios';
import { envs } from "./config/envs";
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { mostrarMenu, buscarIdTelegram, buscarJugador, registrarIdTelegram } from './functions';

interface Partido {
	id: number,
	fecha: string,
	lugar: string,
	hora: string
}

interface Jugador {
	id: number,
	nombres: string,
	apellidos: string,
	nombre_corto: string,
	cedula: string,
	RH: string,
	telefono: string,
	email: string,
	talla_camiseta: string,
	fecha_nacimiento: string,
	estado: Boolean,
	tipo: string,
	id_telegram: string
}

// Crea una nueva instancia de Telegraf
const bot = new Telegraf(envs.BOT_TOKEN);

/// capturas globales
let Idtelegram: number | null = null;
let jugador: Jugador | undefined = undefined;
let partidos: Partido[] | any = undefined;
let partido: Partido | any = undefined;

// Manejador de comandos al iniciar el bot
bot.command('start', async (ctx) => {

	// Variable para capturar el ID del usuario
	Idtelegram = ctx.from.id;

	jugador = await buscarIdTelegram(Idtelegram);

	if (jugador) {
		await ctx.reply(`Bienvenido ${jugador.nombre_corto}`);
		mostrarMenu(ctx, bot);
	}
	else {
		// Si el usuario no se encuentra, pide al usuario que ingrese su número de cédula
		await ctx.reply("Por favor, digita el número de tu cédula:");
	}

});

// Identificando al usuario por primera vez
if (!jugador) {
	
	// Manejador de eventos de texto
	bot.on('text', async (ctx) => {

		if (Idtelegram === null) {
			// Si el ID de Telegram no se ha capturado, salir
			return;
		}

		const cedula = ctx.message.text;

		try {
			// Buscar al usuario por su número de cédula
			jugador = await buscarJugador(cedula);

			if (jugador) {
				// Si se encuentra al usuario, registrar su ID de Telegram y dar la bienvenida
				await registrarIdTelegram(ctx, jugador, Idtelegram);
				mostrarMenu(ctx, bot);
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

//Ver Partidos
bot.action('verPartidos', async ctx => {

	const currentDate = new Date();
	partidos = (await axios.get(`${envs.URL_API}/partidos`)).data;

	// Filtrar los partidos cuya fecha sea mayor que la fecha actual
	const partidosFuturos: Partido[] = partidos.filter((partido: Partido) => new Date(partido.fecha) > currentDate);

	if (partidosFuturos.length === 0) {
		ctx.reply('No hay partidos disponibles.');
		return;
	}

	const inlineKeyboard = Markup.inlineKeyboard(
		partidosFuturos.map((partido: Partido) => {
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

//Opciones del partido seleccionado
bot.action(/^partido_(\d+)$/, async (ctx) => {

	const partidoId = ctx.match![1];
	let inlineKeyboard: InlineKeyboardMarkup;

	// Aquí puedes utilizar el id del partido para realizar alguna acción
	// Por ejemplo, buscar más detalles del partido en tu base de datos
	partido = (await axios.get(`${envs.URL_API}/partidos/${partidoId}`)).data;

	if (Idtelegram != 646386747) {
		// Crear un teclado inline con las opciones "Registrarse" y "Cancelar"
		inlineKeyboard = {
			inline_keyboard: [
				[{ text: "Registrarse", callback_data: `registrarse_${ctx.from!.id}_${partidoId}` }],
				[{ text: "Cancelar Asistencia", callback_data: `cancelar_${ctx.from!.id}_${partidoId}` }],
				[{ text: "Ver Lista Jugadores", callback_data: `lista_${ctx.from!.id}_${partidoId}` }]
			]
		};
	} else {
		// Crear un teclado inline con las opciones "Registrarse" y "Cancelar"
		inlineKeyboard = {
			inline_keyboard: [
				[{ text: "Registrarse", callback_data: `registrarse_${ctx.from!.id}_${partidoId}` }],
				[{ text: "Cancelar Asistencia", callback_data: `cancelar_${ctx.from!.id}_${partidoId}` }],
				[{ text: "Ver Lista Jugadores", callback_data: `lista_${ctx.from!.id}_${partidoId}` }],
				[{ text: "Registrar Pago Jugador", callback_data: `registro_pago_${ctx.from!.id}_${partidoId}` }],
			]
		};
	}


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
			? mensaje += `${i + 1}. ${jugador.nombre_corto} ${jugador.socio || jugador.estado_pago ? '*X*' : '*-->Debe<--*'}  \n`
			: mensaje += `------------------------
		*reserva*
		${i + 1}. ${jugador.nombre_corto}\n`;
	});

	mensaje += `------------------------\n
	🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴\nSe debe cancelar $15.000. Plazo para el pago hasta el Miercoles a las 8 pm \n🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴\nBancolombia\n*Número de Cuenta\n75687416244\nAhorros\nFabio Alejandro Quintero\nCédula 4.375.857*\n*Nequi*\nPSE Nequi: https://recarga.nequi.com.co\nTeléfono: 3188216823
	---------------------------`

	// Enviar el mensaje como respuesta
	await ctx.replyWithMarkdown(mensaje);

});

bot.action(/^registro_pago_(\d+)_(\d+)$/, async (ctx: any) => {

	const partidoId = ctx.match[2];

	const listadoJugadores = (await axios.get(`${envs.URL_API}/partido_jugadores/partidojugadores_idpartido/${partidoId}`)).data;

	const inlineKeyboard = {
		inline_keyboard: listadoJugadores
			.filter((jugador: any) => jugador.socio === false && jugador.estado_pago === false)
			.map((jugador: any) => [
				{
					text: `${jugador.nombre_corto}`,
					callback_data: `gestion_pago_${jugador.id}_${partidoId}`
				}
			])
	};

	const menu = JSON.stringify(inlineKeyboard);
	// const menujson = JSON.parse(menu)
	//Crear un teclado inline con las opciones "Registrarse" y "Cancelar"

	await ctx.reply(`Selecciona el Jugador:`, { reply_markup: menu });
});

bot.action(/^gestion_pago_(\d+)_(\d+)$/, async (ctx: any) => {

	const partidoId = ctx.match[2];
	const jugadorId = ctx.match[1];

	// Crear un teclado inline con las opciones "Registrarse" y "Cancelar"
	const inlineKeyboard = {
		inline_keyboard: [
			[{ text: "Registrar Pago", callback_data: `registrar_pago_${jugadorId}_${partidoId}` }],
			[{ text: "Cancelar Pago", callback_data: `cancelar_pago_${jugadorId}_${partidoId}` }],
		]
	};

	await ctx.reply(`Seleccion la accion:`, { reply_markup: inlineKeyboard });

});

bot.action(/^registrar_pago_(\d+)_(\d+)$/, async (ctx: any) => {

	const partidoId = ctx.match[2];
	const jugadorId = ctx.match[1];

	const { id } = (await axios.get(`${envs.URL_API}/partido_jugadores/partidojugadore_idjugador_idpartido/${jugadorId}/${partidoId}`)).data

	try {
		await axios.put(`${envs.URL_API}/partido_jugadores/${id}`, { "estado_pago": true })
		ctx.reply("El pago ha sido registrado con exito")
	} catch (error) {
		await ctx.reply("Hubo un error al registrar el pago")
	}

});

bot.action(/^cancelar_pago_(\d+)_(\d+)$/, async (ctx: any) => {

	const partidoId = ctx.match[2];
	const jugadorId = ctx.match[1];

	const { id } = (await axios.get(`${envs.URL_API}/partido_jugadores/partidojugadore_idjugador_idpartido/${jugadorId}/${partidoId}`)).data

	try {
		await axios.put(`${envs.URL_API}/partido_jugadores/${id}`, { "estado_pago": false })
		ctx.reply("El pago ha sido cancelado con exito")
	} catch (error) {
		await ctx.reply("Hubo un error al cancelar el pago")
	}

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