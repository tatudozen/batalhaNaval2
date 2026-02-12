/**
 * Parser de comandos do WhatsApp para Batalha Naval
 */

class CommandParser {
  constructor() {
    this.commands = {
      // Criação de jogo (com ou sem /)
      CRIAR_JOGO: /^\/?(criar\s+jogo|criar|novo\s+jogo|começar|iniciar)/i,

      // Coordenada direta (A-P, 1-16) - 16 colunas
      COORD_DIRETA: /^([a-p])(\d{1,2})$/i,

      // Atirar com palavra (mantido para compatibilidade)
      ATIRAR: /^(atirar|tiro|disparar|atacar)\s+([a-p])(\d{1,2})$/i,

      // Status (com ou sem /)
      STATUS: /^\/?(status|estado|situação|situacao)/i,

      // Mapa/Tabuleiro (com ou sem /)
      MAPA: /^\/?(mapa|tabuleiro|ver|mostrar)/i,

      // Ajuda (com ou sem /)
      AJUDA: /^\/?(ajuda|help|comandos|\?)/i,

      // Confirmar posicionamento (via WhatsApp)
      CONFIRMAR: /^(confirmar|pronto|ok|sim)/i,

      // Cancelar/Sair (com ou sem /)
      SAIR: /^\/?(sair|cancelar|desistir|quit)/i
    };
  }

  /**
   * Parseia uma mensagem e retorna o comando identificado
   */
  parse(message) {
    const text = message.trim();

    // Coordenada direta (prioridade alta - A5, B10, etc)
    const coordMatch = text.match(this.commands.COORD_DIRETA);
    if (coordMatch) {
      const col = coordMatch[1].toUpperCase();
      const row = parseInt(coordMatch[2], 10);
      return {
        type: 'ATIRAR',
        coord: `${col}${row}`,
        col,
        row,
        raw: text
      };
    }

    // Criar jogo
    if (this.commands.CRIAR_JOGO.test(text)) {
      return {
        type: 'CRIAR_JOGO',
        raw: text
      };
    }

    // Atirar com palavra (mantido para compatibilidade)
    const atirarMatch = text.match(this.commands.ATIRAR);
    if (atirarMatch) {
      const col = atirarMatch[2].toUpperCase();
      const row = parseInt(atirarMatch[3], 10);
      return {
        type: 'ATIRAR',
        coord: `${col}${row}`,
        col,
        row,
        raw: text
      };
    }

    // Status
    if (this.commands.STATUS.test(text)) {
      return {
        type: 'STATUS',
        raw: text
      };
    }

    // Mapa
    if (this.commands.MAPA.test(text)) {
      return {
        type: 'MAPA',
        raw: text
      };
    }

    // Ajuda
    if (this.commands.AJUDA.test(text)) {
      return {
        type: 'AJUDA',
        raw: text
      };
    }

    // Confirmar
    if (this.commands.CONFIRMAR.test(text)) {
      return {
        type: 'CONFIRMAR',
        raw: text
      };
    }

    // Sair
    if (this.commands.SAIR.test(text)) {
      return {
        type: 'SAIR',
        raw: text
      };
    }

    // Comando não reconhecido
    return {
      type: 'DESCONHECIDO',
      raw: text
    };
  }

  /**
   * Retorna mensagem de ajuda
   */
  getHelpMessage() {
    return `🚢 *BATALHA NAVAL* 🚢

📋 *Comandos disponíveis:*

🆕 *Criar Jogo*
• \`/criar\` ou \`Criar jogo\` - Inicia nova partida

🎯 *Jogar*
• \`A5\` - Dispara na coordenada A5
• \`/status\` - Mostra situação da partida
• \`/mapa\` - Exibe seus tabuleiros

ℹ️ *Outros*
• \`/ajuda\` - Mostra esta mensagem
• \`/sair\` - Encerra a partida

📐 *Coordenadas*
• Colunas: A-P (16 colunas)
• Linhas: 1-16
• Exemplo: A1, B5, P16

⚓ *Esquadra (15 navios):*
• 1 Porta-aviões (5 células)
• 2 Cruzadores (4 células)
• 3 Destroyers (2 células)
• 4 Submarinos (1 célula)
• 5 Hidroaviões (3 células)

🎮 *Regras:*
• 1 tiro por turno
• Acertou? Ganha 3 tiros extras (salva)!
• Errou na salva? Turno encerra

Bom jogo! ⚓`;
  }

  /**
   * Valida coordenada
   */
  validateCoord(coord) {
    const match = coord.match(/^([A-P])(\d{1,2})$/i);
    if (!match) {
      return { valid: false, error: 'Coordenada inválida. Use formato: A1, B5, P16' };
    }

    const col = match[1].toUpperCase();
    const row = parseInt(match[2], 10);

    if (row < 1 || row > 16) {
      return { valid: false, error: 'Linha deve estar entre 1 e 16' };
    }

    return { valid: true, col, row };
  }
}

module.exports = CommandParser;
