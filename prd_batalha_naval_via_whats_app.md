# PRD – Jogo de Batalha Naval via WhatsApp

## 1. Visão Geral

Este projeto consiste em um **jogo de Batalha Naval online**, inspirado **diretamente nas regras clássicas jogadas em bloquinhos de papel**, sem mecânicas avançadas, camadas extras ou poderes especiais.

O jogo será **1x1**, por turnos, com regras simples e familiares:
- Um tiro por turno
- Ao acertar um navio, o jogador ganha direito a **uma salva de até 3 tiros adicionais**

Toda a interação de jogo acontece via **WhatsApp**, enquanto uma **web app simples** é usada apenas para o **posicionamento inicial da esquadra**.

Este PRD descreve o **MVP** do projeto, com foco em simplicidade, velocidade de implementação e clareza de regras.

---

## 2. Objetivos do Produto

### Objetivo Principal
Criar uma experiência de Batalha Naval:
- Assíncrona ou quase em tempo real
- Jogável inteiramente pelo WhatsApp
- Com uma etapa estratégica inicial rica e visual via web app

### Objetivos Secundários
- Reduzir fricção (sem necessidade de instalar app)
- Permitir partidas rápidas ou mais estratégicas
- Abrir espaço para monetização futura (torneios, skins, modos especiais)

---

## 3. Público-Alvo

- Jogadores casuais que usam WhatsApp diariamente
- Fãs de jogos de estratégia simples
- Comunidades, amigos e grupos
- Possível uso educacional ou corporativo (team building)

---

## 4. Plataformas

- **Interface principal:** WhatsApp (via bot / API oficial)
- **Interface secundária:** Web App responsiva (desktop e mobile)
- **Backend:** API própria (jogo, regras, estado da partida)

---

## 5. Fluxo Geral do Usuário

### 5.1 Criação da Partida
1. Usuário envia mensagem no WhatsApp: `Criar jogo`
2. Bot cria uma sala e retorna:
   - Código da partida
   - Link único para a web app de posicionamento

### 5.2 Posicionamento da Esquadra (Web App)
1. Usuário acessa o link
2. Autenticação automática via token único
3. Tela de posicionamento é exibida
4. Usuário posiciona sua esquadra
5. Usuário confirma e bloqueia o layout

### 5.3 Início da Batalha (WhatsApp)
1. Ambos os jogadores confirmam esquadra
2. Bot notifica: `A batalha começou`
3. Jogadores passam a enviar comandos de tiro via WhatsApp

---

## 6. Web App – Posicionamento da Esquadra (MVP)

A web app tem **um único objetivo**: permitir que o jogador posicione sua esquadra **exatamente como faria no papel**, de forma rápida e sem distrações.

Não há animações complexas, modos avançados ou camadas ocultas.


## 6.1 Campo de Batalha

- Grid (ex: 15x15, configurável)
- Coordenadas alfanuméricas (A1, B3, etc)
- Visualização clara de ocupação e áreas proibidas

### 6.2 Tipos de Unidades (Clássico)

A esquadra segue o **padrão tradicional do jogo Batalha Naval**:

- Porta-aviões – 5 células (1 unidade)
- Cruzadores – 4 células (2 unidade2)
- Destroyers – 2 células (3 unidades)
- Submarino – 1 célula (4 unidades)
- Hidroaviões - 3 células não lineares, em forma de triangulo (5 unidades)

Não existem submarinos ocultos, aeronaves ou habilidades especiais no MVP.

---

## 7. Modos de Posicionamento (MVP)

### 7.1 Posicionamento Automático

- Botão: `Distribuir automaticamente`
- Sistema posiciona todos os navios respeitando:
  - Limites do grid
  - Não sobreposição

### 7.2 Posicionamento Manual

- Clique/toque para selecionar um navio
- Clique/toque no grid para posicionar
- Alternar orientação (horizontal / vertical)
- Feedback visual imediato

Não existe modo híbrido no MVP.

---

## 8. Regras de Validação

- Nenhuma peça pode se sobrepor e nem tocar nas demais (nem pela borda)
- Respeitar limites do campo
- Quantidade fixa de unidades
- Distância mínima opcional entre navios (modo avançado)
- Submarinos podem ter regras especiais de visibilidade

---

## 9. Confirmação e Bloqueio

- Botão: `Confirmar esquadra`
- Após confirmação:
  - Layout é bloqueado
  - Hash do layout é salvo no backend
  - Usuário não pode mais alterar

---

## 10. Integração com WhatsApp (Regras Clássicas)

### 10.1 Comandos Básicos

- `Atirar A5`
- `Status`
- `Mapa`

### 10.2 Regras de Turno

- Cada jogador tem **1 tiro por turno**
- Ao **acertar um navio**, o jogador ganha direito a **mais 3 tiros consecutivos (salva)**
- Se errar durante a salva, o turno é encerrado

### 10.3 Feedback do Bot

- `Água`
- `Acertou`
- `Afundou`
- `Fim do turno`

---

## 11. Backend / Lógica do Jogo

- Gerenciamento de partidas
- Estado do tabuleiro de cada jogador
- Validação de tiros
- Controle de turnos
- Registro de histórico

---

## 12. Requisitos Não-Funcionais

- Segurança:
  - Tokens únicos por partida
  - Isolamento total entre jogadores

- Performance:
  - Baixa latência no WhatsApp
  - Web app leve

- Escalabilidade:
  - Suporte a múltiplas partidas simultâneas

---

## 13. Métricas de Sucesso

- Taxa de partidas iniciadas vs concluídas
- Tempo médio de posicionamento
- Engajamento por partida
- Retenção de jogadores

---

## 14. Fases Futuras (Fora do Escopo Inicial)

- Partidas em grupo (2x2)
- Ranking e ELO
- Modos especiais (neblina, minas, clima)
- Monetização (skins, torneios)

---

## 15. Riscos e Dependências

- Limitações da API do WhatsApp
- Latência em partidas síncronas
- UX da web app em telas pequenas

---

## 16. Premissas

- Usuário tem WhatsApp ativo
- Acesso à web permitido
- Jogo inicialmente 1x1

---

## 17. Próximos Passos

1. Finalizar definição do MVP do posicionamento da esquadra
2. Criar wireframe funcional da web app
3. Definir stack técnica mínima
4. Implementar lógica básica do tabuleiro
5. Integrar comandos simples no WhatsApp

