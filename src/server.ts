import express from "express";
import "./app";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("🤖 Bot de Telegram funcionando en Railway 🚀");
});

app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
