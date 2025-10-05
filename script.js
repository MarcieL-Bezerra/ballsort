const gameContainer = document.querySelector('.game-container');

// Som de moeda grátis
const audioMoeda = new Audio();
audioMoeda.src = "moeda.mp3";

// Função para gerar cores diferentes dinamicamente, incluindo preto
function gerarCores(qtd) {
  const cores = [];
  // Sempre inclui preto como uma das cores se houver espaço
  if (qtd > 0) cores.push('#111'); // Preto
  for (let i = 1; i < qtd; i++) {
    const h = Math.round((360 / (qtd - 1)) * (i - 1));
    cores.push(`hsl(${h}, 100%, 50%)`);
  }
  return cores;
}

// Função para gerar bordas únicas para cada cor
function gerarBordas(qtd, coresBase) {
  // Lista de cores de borda que não se repetem e não são iguais à cor da bola
  const bordasPossiveis = [
    '#1976d2', // Azul
    '#d32f2f', // Vermelho
    '#388e3c', // Verde
    '#fbc02d', // Amarelo
    '#7b1fa2', // Roxo
    '#f57c00', // Laranja
    '#c2185b', // Rosa
    '#0097a7', // Ciano
    '#5d4037', // Marrom
    '#fff',    // Branco
    '#000',    // Preto
  ];
  const bordas = [];
  let idx = 0;
  for (let i = 0; i < qtd; i++) {
    // Garante que a borda não seja igual à cor da bola
    while (
      idx < bordasPossiveis.length &&
      (bordasPossiveis[idx].toLowerCase() === coresBase[i].toLowerCase())
    ) {
      idx++;
    }
    bordas.push(bordasPossiveis[idx % bordasPossiveis.length]);
    idx++;
  }
  return bordas;
}

// Parâmetros do jogo
const BOLAS_POR_TUBO = 8; // Começa com 8, mas pode aumentar
const TURBOS_MAX = 10;    // Limite máximo de tubos

let totalTubos = 4; // Começa com 4 tubos (3 cheios + 1 vazio)
let bolasPorTubo = BOLAS_POR_TUBO;
let cores = gerarCores(totalTubos - 1);
let bordas = gerarBordas(totalTubos - 1, cores);

let bolas = [];
let selectedTubo = null;
let pontuacao = 0;

// Função para atualizar tubos na tela
function atualizarTubos() {
  // Remove tubos antigos
  while (gameContainer.children.length > 0) {
    gameContainer.removeChild(gameContainer.firstChild);
  }
  // Adiciona tubos novos
  for (let i = 0; i < totalTubos; i++) {
    const tuboExtra = document.createElement('div');
    tuboExtra.classList.add('tubo');
    gameContainer.appendChild(tuboExtra);
  }
  tubos = document.querySelectorAll('.tubo');
}

// Adiciona placar
let placar = document.getElementById('placar');
if (!placar) {
  placar = document.createElement('div');
  placar.id = 'placar';
  placar.style.marginBottom = '20px';
  placar.style.fontSize = '1.2rem';
  placar.style.fontWeight = 'bold';
  placar.style.letterSpacing = '1px';
  placar.style.color = '#ffeb3b';
  gameContainer.parentNode.insertBefore(placar, gameContainer);
}

function atualizarPlacar() {
  placar.textContent = `Pontuação: ${pontuacao}`;
}

function criarBolas() {
  bolas = [];
  // Gera cores e bordas suficientes para os tubos cheios
  cores = gerarCores(totalTubos - 1);
  bordas = gerarBordas(totalTubos - 1, cores);
  // Cria bolas para cada cor
  for (let i = 0; i < cores.length; i++) {
    for (let j = 0; j < bolasPorTubo; j++) {
      const bola = document.createElement('div');
      bola.classList.add('bola');
      bola.style.background = cores[i];
      bola.dataset.cor = cores[i];
      bola.style.border = `3px solid ${bordas[i]}`;
      bolas.push(bola);
    }
  }
  // Embaralha as bolas
  bolas = bolas.sort(() => Math.random() - 0.5);
}

function distribuirBolas() {
  tubos.forEach(tubo => {
    tubo.innerHTML = '';
    tubo.classList.remove('completo', 'inalteravel');
  });
  // Distribui as bolas nos tubos cheios, deixando o(s) último(s) vazio(s)
  let idx = 0;
  for (let t = 0; t < totalTubos - 1; t++) {
    for (let b = 0; b < bolasPorTubo; b++) {
      tubos[t].appendChild(bolas[idx++]);
    }
  }
}

function tuboEstaCompleto(tubo) {
  if (tubo.children.length !== bolasPorTubo) return false;
  const cor = tubo.children[0].dataset.cor;
  for (let i = 1; i < bolasPorTubo; i++) {
    if (tubo.children[i].dataset.cor !== cor) return false;
  }
  return true;
}

function marcarTuboCompleto(tubo) {
  tubo.classList.add('completo', 'inalteravel');
  tubo.style.borderColor = '#4caf50';
  tubo.style.background = '#222b';
}

function desmarcarTubosCompletos() {
  tubos.forEach(tubo => {
    tubo.classList.remove('completo', 'inalteravel');
    tubo.style.borderColor = '';
    tubo.style.background = '';
  });
}

function podeMover(origem, destino) {
  if (origem.classList.contains('inalteravel')) return false;
  if (destino.classList.contains('inalteravel')) return false;
  if (origem === destino) return false;
  if (origem.children.length === 0) return false;
  if (destino.children.length >= bolasPorTubo) return false;
  // Agora permite mover para qualquer tubo, mesmo de cor diferente
  return true;
}

// Armazena os estados anteriores para detectar repetição de movimentos
let estadosAnteriores = [];
let repeticoes = 0;

// Função para serializar o estado atual dos tubos
function serializarEstado() {
  return Array.from(tubos).map(tubo =>
    Array.from(tubo.children).map(bola => bola.dataset.cor).join(',')
  ).join('|');
}

// Função para verificar se há movimentos possíveis
function haMovimentosPossiveis() {
  for (let i = 0; i < tubos.length; i++) {
    for (let j = 0; j < tubos.length; j++) {
      if (i !== j && podeMover(tubos[i], tubos[j])) {
        return true;
      }
    }
  }
  return false;
}

// Função para aumentar dificuldade a cada ponto
function proximaFase() {
  if (totalTubos < TURBOS_MAX) {
    totalTubos++;
    bolasPorTubo++;
  } else {
    // Reinicia tudo ao atingir o máximo
    totalTubos = 4;
    bolasPorTubo = BOLAS_POR_TUBO;
    pontuacao = 0;
  }
  atualizarTubos();
  criarBolas();
  distribuirBolas();
  selectedTubo = null;
  desmarcarTubosCompletos();
  estadosAnteriores = [];
  repeticoes = 0;
  atualizarPlacar();
  adicionarListeners();
}

// Modifique a função checarVitoria para incluir o game over por repetição de estado
function checarVitoria() {
  let completos = 0;
  tubos.forEach(tubo => {
    if (tuboEstaCompleto(tubo)) {
      marcarTuboCompleto(tubo);
      completos++;
    }
  });

  // Serializa o estado atual
  const estadoAtual = serializarEstado();
  if (estadosAnteriores.length > 0 && estadosAnteriores[estadosAnteriores.length - 1] === estadoAtual) {
    repeticoes++;
  } else {
    repeticoes = 0;
  }
  estadosAnteriores.push(estadoAtual);
  if (estadosAnteriores.length > 10) estadosAnteriores.shift(); // Limita histórico

  if (completos === totalTubos - 1) {
    setTimeout(() => {
      // TOCA O SOM DE MOEDA
      audioMoeda.currentTime = 0;
      audioMoeda.play();
      pontuacao++;
      atualizarPlacar();
      alert('Parabéns! Você completou o desafio!');
      proximaFase();
    }, 400);
  } else if (!haMovimentosPossiveis() || repeticoes >= 2) {
    setTimeout(() => {
      alert('Game Over! Não há mais movimentos possíveis ou você repetiu os mesmos movimentos.');
      pontuacao = 0;
      totalTubos = 4;
      bolasPorTubo = BOLAS_POR_TUBO;
      atualizarTubos();
      criarBolas();
      distribuirBolas();
      selectedTubo = null;
      desmarcarTubosCompletos();
      estadosAnteriores = [];
      repeticoes = 0;
      atualizarPlacar();
      adicionarListeners();
    }, 400);
  }
}

function resetGame() {
  totalTubos = 4;
  bolasPorTubo = BOLAS_POR_TUBO;
  pontuacao = 0;
  atualizarTubos();
  criarBolas();
  distribuirBolas();
  selectedTubo = null;
  desmarcarTubosCompletos();
  atualizarPlacar();
  estadosAnteriores = [];
  repeticoes = 0;
  adicionarListeners();
}

// Remove event listeners antigos e adiciona novos
function adicionarListeners() {
  tubos = document.querySelectorAll('.tubo');
  tubos.forEach((tubo) => {
    const novoTubo = tubo.cloneNode(true);
    tubo.parentNode.replaceChild(novoTubo, tubo);
  });
  tubos = document.querySelectorAll('.tubo');
  tubos.forEach((tubo) => {
    tubo.addEventListener('click', () => {
      if (tubo.classList.contains('inalteravel')) return;
      if (selectedTubo === null) {
        // Seleciona tubo de origem
        if (tubo.children.length === 0) return;
        if (tubo.classList.contains('inalteravel')) return;
        selectedTubo = tubo;
        tubo.classList.add('selected');
      } else if (selectedTubo === tubo) {
        // Desseleciona se clicar no mesmo
        tubo.classList.remove('selected');
        selectedTubo = null;
      } else {
        // Move bola do topo se permitido
        if (podeMover(selectedTubo, tubo)) {
          const bola = selectedTubo.querySelector('.bola:last-child');
          if (bola) {
            tubo.appendChild(bola);
          }
          selectedTubo.classList.remove('selected');
          selectedTubo = null;
          // Checa se tubo ficou completo
          tubos.forEach(t => {
            if (tuboEstaCompleto(t)) marcarTuboCompleto(t);
          });
          checarVitoria();
        } else {
          selectedTubo.classList.remove('selected');
          selectedTubo = null;
        }
      }
    });
  });
}

document.getElementById('reset').addEventListener('click', () => {
  resetGame();
});

// Inicializa o jogo
resetGame();