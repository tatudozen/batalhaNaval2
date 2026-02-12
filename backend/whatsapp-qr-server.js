const express = require('express');
const QRCode = require('qrcode');
const { getWhatsAppBot } = require('./whatsapp');

const app = express();
let currentQR = null;

// Capturar QR Code quando for gerado
function setupQRCapture() {
  const bot = getWhatsAppBot();

  // Hook no evento QR para capturar
  const originalInitialize = bot.initialize.bind(bot);
  bot.initialize = async function() {
    if (bot.client) {
      bot.client.removeAllListeners('qr');
      bot.client.on('qr', (qr) => {
        currentQR = qr;
        console.log('📱 QR Code capturado! Acesse http://localhost:3002/qr');
      });
    }
    return originalInitialize();
  };
}

// Rota para mostrar QR Code
app.get('/qr', async (req, res) => {
  if (!currentQR) {
    return res.send(`
      <html>
        <head>
          <title>WhatsApp QR Code</title>
          <meta http-equiv="refresh" content="2">
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⏳ Aguardando QR Code...</h1>
          <p>O servidor está inicializando. A página recarrega automaticamente.</p>
        </body>
      </html>
    `);
  }

  try {
    const qrImage = await QRCode.toDataURL(currentQR);
    res.send(`
      <html>
        <head>
          <title>WhatsApp QR Code - Batalha Naval</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin: 0;
            }
            .container {
              background: white;
              color: #333;
              border-radius: 20px;
              padding: 40px;
              max-width: 600px;
              margin: 0 auto;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            h1 { margin-top: 0; }
            img {
              border: 10px solid #667eea;
              border-radius: 10px;
              margin: 20px 0;
            }
            .steps {
              text-align: left;
              margin: 20px auto;
              max-width: 400px;
            }
            .steps li {
              margin: 10px 0;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚢 Batalha Naval - WhatsApp</h1>
            <h2>📱 Escaneie o QR Code</h2>
            <img src="${qrImage}" alt="QR Code" width="300" height="300">

            <div class="steps">
              <h3>Como conectar:</h3>
              <ol>
                <li>Abra o WhatsApp no celular <strong>5521971236887</strong></li>
                <li>Vá em <strong>Configurações ⚙️</strong></li>
                <li>Toque em <strong>Aparelhos Conectados</strong></li>
                <li>Toque em <strong>Conectar um aparelho</strong></li>
                <li>Escaneie o QR Code acima</li>
              </ol>
            </div>

            <p><small>QR Code expira em ~20 segundos. Recarregue a página se expirar.</small></p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Erro ao gerar QR Code: ' + error.message);
  }
});

app.get('/', (req, res) => {
  res.redirect('/qr');
});

module.exports = { app, setupQRCapture, setCurrentQR: (qr) => { currentQR = qr; } };
