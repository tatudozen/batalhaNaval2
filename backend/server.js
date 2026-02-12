const express = require('express');
const cors = require('cors');
const path = require('path');
const gameRoutes = require('./routes');
const { getWhatsAppBot } = require('./whatsapp');
const WhatsAppController = require('./whatsappController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api', gameRoutes);

// WhatsApp Bot
let whatsappController = null;

async function initializeWhatsApp() {
  try {
    console.log('\n🚀 Iniciando integração WhatsApp...\n');
    const bot = getWhatsAppBot();
    await bot.initialize();

    // Criar controller
    whatsappController = new WhatsAppController(bot);

    console.log('\n✅ WhatsApp integrado com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao inicializar WhatsApp:', error);
    console.log('\n⚠️ Servidor continuará sem WhatsApp. Use o chat.html para testes.\n');
  }
}

// Start
app.listen(PORT, async () => {
  console.log(`\n🚢 Batalha Naval backend rodando em http://localhost:${PORT}`);
  console.log(`📱 Chat simulado: http://localhost:${PORT}/chat.html`);
  console.log(`⚓ Posicionamento: http://localhost:${PORT}/posicionamento.html\n`);

  // Inicializar WhatsApp
  await initializeWhatsApp();
});

// Exportar controller para uso em routes
module.exports = { app, getWhatsAppController: () => whatsappController };
