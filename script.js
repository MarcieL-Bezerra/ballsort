const gameContainer = document.querySelector('.game-container');

// Remove tubos antigos (caso reinicie o script)
while (gameContainer.children.length > 0) {
  gameContainer.removeChild(gameContainer.firstChild);
}

// Adiciona 4 tubos (3 para bolas, 1 vazio)
const TOTAL_TUBOS = 4;
function adicionarTubosExtras(qtd) {
  for (let i = 0; i < qtd; i++) {
    const tuboExtra = document.createElement('div');
    tuboExtra.classList.add('tubo');
    gameContainer.appendChild(tuboExtra);
  }
}
adicionarTubosExtras(TOTAL_TUBOS);

let tubos = document.querySelectorAll('.tubo');
const cores = [
  'hsl(0, 100%, 50%)',    // Vermelho
  'hsl(40, 100%, 50%)',   // Laranja
  'hsl(200, 100%, 50%)',  // Azul
]; // 3 cores, cada uma terá 8 bolas

const BOLAS_POR_TUBO = 8;
const TUBOS_PREENCHIDOS = cores.length; // 3 tubos cheios
let bolas = [];
let selectedTubo = null;
let pontuacao = 0;

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
  // 8 bolas de cada cor
  for (let i = 0; i < cores.length; i++) {
    for (let j = 0; j < BOLAS_POR_TUBO; j++) {
      const bola = document.createElement('div');
      bola.classList.add('bola');
      bola.style.background = cores[i];
      bola.dataset.cor = cores[i];
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
  // Distribui as bolas nos 3 primeiros tubos, deixando o último vazio
  let idx = 0;
  for (let t = 0; t < TUBOS_PREENCHIDOS; t++) {
    for (let b = 0; b < BOLAS_POR_TUBO; b++) {
      tubos[t].appendChild(bolas[idx++]);
    }
  }
}

function tuboEstaCompleto(tubo) {
  if (tubo.children.length !== BOLAS_POR_TUBO) return false;
  const cor = tubo.children[0].dataset.cor;
  for (let i = 1; i < BOLAS_POR_TUBO; i++) {
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
  if (destino.children.length >= BOLAS_POR_TUBO) return false;
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

  if (completos === TUBOS_PREENCHIDOS) {
    setTimeout(() => {
      pontuacao++;
      atualizarPlacar();
      alert('Parabéns! Você completou o desafio!');
      // Reinicia mantendo a pontuação
      criarBolas();
      distribuirBolas();
      selectedTubo = null;
      desmarcarTubosCompletos();
      estadosAnteriores = [];
      repeticoes = 0;
    }, 400);
  } else if (!haMovimentosPossiveis() || repeticoes >= 2) {
    setTimeout(() => {
      alert('Game Over! Não há mais movimentos possíveis ou você repetiu os mesmos movimentos.');
      pontuacao = 0;
      resetGame();
    }, 400);
  }
}

function resetGame() {
  criarBolas();
  distribuirBolas();
  selectedTubo = null;
  desmarcarTubosCompletos();
  atualizarPlacar();
  tubos = document.querySelectorAll('.tubo');
  estadosAnteriores = [];
  repeticoes = 0;
}

// Remove event listeners antigos (caso reinicie o script)
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

document.getElementById('reset').addEventListener('click', () => {
  pontuacao = 0;
  resetGame();
});

// Inicializa o jogo
pontuacao = 0;
resetGame();