/* ============================================================
 * ZONA DE CALIBRAÇÃO — SOMENTE ESTA FUNÇÃO DEVE SER ALTERADA
 * ============================================================
 * calcularVV(psi, celsius)
 *
 * Reproduz exatamente o calculo da planilha
 * "Tabela de Carbonatacao.xls" usada na fabrica:
 *
 *   1. Em cada coluna de pressao da tabela, interpola
 *      linearmente na temperatura.
 *   2. Interpola linearmente entre as duas colunas de pressao
 *      que cercam a pressao informada.
 *
 * Os dados vem de tabela.js. Fora da faixa da tabela
 * (0 a 100 PSI / 0 a 37,8 °C) devolve null, e o app mostra
 * "Fora da tabela" — a planilha original responde
 * "FORA DO LIMITE DA TABELA" nesse mesmo caso.
 *
 * Qualquer ajuste de calibracao deve ser feito SOMENTE aqui
 * ou em tabela.js, mantendo a assinatura calcularVV(psi, celsius).
 * ============================================================ */
function calcularVV(psi, celsius) {
  const temperaturas = TABELA_CARBONATACAO.temperaturasC;
  const pressoes = TABELA_CARBONATACAO.pressoesPsi;
  const grade = TABELA_CARBONATACAO.vv;

  const iTemp = temperaturas.findIndex((t) => celsius < t);
  const iPress = pressoes.findIndex((p) => psi < p);
  if (iTemp <= 0 || iPress <= 0) return null;

  const tempInf = temperaturas[iTemp - 1];
  const tempSup = temperaturas[iTemp];

  function vvNaPressao(indicePressao) {
    const vInf = grade[indicePressao][iTemp - 1];
    const vSup = grade[indicePressao][iTemp];
    return vInf - ((vInf - vSup) / (tempSup - tempInf)) * (celsius - tempInf);
  }

  const pressInf = pressoes[iPress - 1];
  const pressSup = pressoes[iPress];
  const vvInf = vvNaPressao(iPress - 1);
  const vvSup = vvNaPressao(iPress);

  return vvInf + ((vvSup - vvInf) / (pressSup - pressInf)) * (psi - pressInf);
}

/* Conversao de pressao, igual a da planilha (celula F7: =D7/14,22) */
function psiParaKgf(psi) {
  return psi / 14.22;
}
/* ============================================================
 * FIM DA ZONA DE CALIBRAÇÃO
 * ============================================================ */

const psiInput = document.getElementById('psi');
const celsiusInput = document.getElementById('celsius');
const outKgf = document.getElementById('out-kgf');
const outF = document.getElementById('out-f');
const outVV = document.getElementById('out-vv');
const vvAviso = document.getElementById('vv-aviso');
const clearBtn = document.getElementById('clear-btn');

function parseNumeroBR(valor) {
  if (typeof valor !== 'string') return NaN;
  const limpo = valor.trim().replace(',', '.');
  if (limpo === '' || limpo === '-' || limpo === '.') return NaN;
  if (!/^-?\d*\.?\d*$/.test(limpo)) return NaN;
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : NaN;
}

function formatarBR(numero, casasDecimais) {
  if (!Number.isFinite(numero)) return '—';
  return numero.toFixed(casasDecimais).replace('.', ',');
}

function sanitizarEntrada(valor) {
  return valor.replace(/[^0-9,.\-]/g, '');
}

function recalcular() {
  const psi = parseNumeroBR(psiInput.value);
  const celsius = parseNumeroBR(celsiusInput.value);

  outKgf.textContent = Number.isFinite(psi) ? formatarBR(psiParaKgf(psi), 1) : '—';
  outF.textContent = Number.isFinite(celsius) ? formatarBR((celsius * 9 / 5) + 32, 1) : '—';

  if (!Number.isFinite(psi) || !Number.isFinite(celsius)) {
    outVV.textContent = '—';
    outVV.classList.remove('fora-da-tabela');
    vvAviso.hidden = true;
    return;
  }

  const vv = calcularVV(psi, celsius);
  if (vv === null) {
    outVV.textContent = 'Fora da tabela';
    outVV.classList.add('fora-da-tabela');
    vvAviso.hidden = false;
  } else {
    outVV.textContent = formatarBR(vv, 2);
    outVV.classList.remove('fora-da-tabela');
    vvAviso.hidden = true;
  }
}

function aoDigitar(event) {
  const cursorNoFinal = event.target.selectionStart === event.target.value.length;
  event.target.value = sanitizarEntrada(event.target.value);
  if (cursorNoFinal) {
    event.target.selectionStart = event.target.selectionEnd = event.target.value.length;
  }
  recalcular();
}

psiInput.addEventListener('input', aoDigitar);
celsiusInput.addEventListener('input', aoDigitar);

clearBtn.addEventListener('click', () => {
  psiInput.value = '';
  celsiusInput.value = '';
  recalcular();
  psiInput.focus();
});

recalcular();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* sem service worker o app ainda funciona enquanto estiver aberto */
    });
  });
}
