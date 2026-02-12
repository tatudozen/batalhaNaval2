const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class WhatsAppBot {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.messageHandlers = [];
  }

  async initialize() {
    console.log('🚀 Inicializando WhatsApp Bot...');

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'batalha-naval-bot'
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    // QR Code para autenticação
    this.client.on('qr', async (qr) => {
      console.log('\n📱 QR Code gerado!');
      qrcode.generate(qr, { small: true });

      // Salvar QR Code como imagem PNG
      const qrPath = path.join(__dirname, '..', 'whatsapp-qr.png');
      try {
        await QRCode.toFile(qrPath, qr, {
          width: 400,
          margin: 2
        });
        console.log(`\n✅ QR Code salvo em: ${qrPath}`);
        console.log(`🌐 Abra no navegador: http://localhost:3001/whatsapp-qr.png\n`);
      } catch (err) {
        console.error('Erro ao salvar QR Code:', err);
      }
    });

    // Quando estiver autenticado
    this.client.on('authenticated', () => {
      console.log('✅ WhatsApp autenticado com sucesso!');
    });

    // Quando estiver pronto
    this.client.on('ready', () => {
      console.log('✅ WhatsApp Bot está pronto!');
      this.isReady = true;
      const info = this.client.info;
      console.log(`📞 Conectado como: ${info.pushname} (${info.wid.user})`);
    });

    // Handler de mensagens recebidas
    this.client.on('message', async (message) => {
      if (message.from === 'status@broadcast') return; // Ignorar status

      console.log(`📨 Mensagem de ${message.from}: ${message.body}`);

      // Executar todos os handlers registrados
      for (const handler of this.messageHandlers) {
        try {
          await handler(message);
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      }
    });

    // Erro de desconexão
    this.client.on('disconnected', (reason) => {
      console.log('❌ WhatsApp desconectado:', reason);
      this.isReady = false;
    });

    // Inicializar cliente
    await this.client.initialize();
  }

  // Registrar handler de mensagem
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  // Enviar mensagem
  async sendMessage(to, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp Bot não está pronto');
    }

    // Formatar número para formato do WhatsApp
    const chatId = this.formatPhoneNumber(to);

    try {
      await this.client.sendMessage(chatId, message);
      console.log(`📤 Mensagem enviada para ${to}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Formatar número de telefone
  formatPhoneNumber(phone) {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Se começar com +, remove
    if (phone.startsWith('+')) {
      cleaned = phone.substring(1).replace(/\D/g, '');
    }

    // Adiciona @c.us se não tiver
    if (!cleaned.includes('@')) {
      cleaned = `${cleaned}@c.us`;
    }

    return cleaned;
  }

  // Verificar se está pronto
  isConnected() {
    return this.isReady;
  }

  // Obter informações do bot
  getInfo() {
    if (!this.isReady) {
      return null;
    }
    return this.client.info;
  }

  // Destruir cliente
  async destroy() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      console.log('🔴 WhatsApp Bot desligado');
    }
  }
}

// Singleton instance
let botInstance = null;

function getWhatsAppBot() {
  if (!botInstance) {
    botInstance = new WhatsAppBot();
  }
  return botInstance;
}

module.exports = { WhatsAppBot, getWhatsAppBot };
