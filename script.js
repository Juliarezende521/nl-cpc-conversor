// --- Inserção de símbolos no campo de texto ---
function inserirSimbolo(simbolo) {
    const textarea = document.getElementById("entrada");
    const pos = textarea.selectionStart;
    const textoAntes = textarea.value.substring(0, pos);
    const textoDepois = textarea.value.substring(pos);
    textarea.value = textoAntes + simbolo + textoDepois;
    textarea.focus();
}

// ---------- UTIL: gera P, Q, R... Z, A... O, P1... ----------
function nextLetterGenerator() {
    const letras = "PQRSTUVWXYZABCDEFGHIJKLMNO";
    let index = 0;

    return function () {
        const letra = letras[index % letras.length];
        const ciclo = Math.floor(index / letras.length);
        index++;
        return ciclo === 0 ? letra : `${letra}${ciclo}`;
    };
}

function escapeHtml(valor) {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ---------- Parser NL -> árvore lógica simples ----------
// Nota: esta função assume que 'se ... então ...' e 'se e somente se' já foram extraídos
// Ela transforma uma string (ex.: "João não estuda e Maria trabalha ou Pedro dorme")
// em uma fórmula de letras (ex.: "(¬P ∧ Q) ∨ R") e popular mapping {P: "João estuda", ...}

// divide por "ou" (menor precedência) --> chama parseConjunction para cada parte
function parseDisjunction(text, letterGen, mapping) {
    // mantém vírgulas internas para conjunções; split somente por " ou " (com espaço)
    if (/\b ou \b/i.test(text)) {
        const parts = text.split(/\s+\bou\b\s+/i).map(s => s.trim()).filter(Boolean);
        const sub = parts.map(p => parseConjunction(p, letterGen, mapping));
        return sub.length === 1 ? sub[0] : `(${sub.join(' ∨ ')})`;
    } else {
        return parseConjunction(text, letterGen, mapping);
    }
}

// divide por "e" / "mas" / vírgula -> chama parseAtom para cada parte
function parseConjunction(text, letterGen, mapping) {
    // split por " e ", " mas " ou vírgulas que separam itens listados
    const splitRegex = /\s+\be\b\s+|\s+\bmas\b\s+|,\s*/i;
    if (splitRegex.test(text)) {
        const parts = text.split(splitRegex).map(s => s.trim()).filter(Boolean);
        const subs = parts.map(p => parseAtom(p, letterGen, mapping));
        return subs.length === 1 ? subs[0] : `(${subs.join(' ∧ ')})`;
    } else {
        return parseAtom(text, letterGen, mapping);
    }
}

// átomo: detecta negação no início ou interna (aplica ¬ apenas ao átomo)
// retorna letra (ou ¬letra) e garante mapping[letra] = texto-limpo (sem 'não' inicial)
function parseAtom(text, letterGen, mapping) {
    let t = text.trim();
    t = t.replace(/[,.!?]+$/, '').trim();

    // detecta negação no início: "não X" / "nao X" ou símbolo ¬
    let neg = false;
    const inicioNao = t.match(/^\s*(¬|\b(não|nao)\b)\s+(.*)$/i);
    if (inicioNao) {
        neg = true;
        t = inicioNao[3].trim();
    }

    // também detecta "não" dentro do átomo (ex.: "a grama não está molhada")
    // se achar, remove o "não" e marca negação do átomo
    if (/\b(não|nao)\b/i.test(t)) {
        neg = true;
        t = t.replace(/\b(não|nao)\b\s*/gi, '').trim();
    }

    // reaproveita letra se o texto já estiver mapeado
    const existente = Object.entries(mapping).find(([letr, txt]) => txt.toLowerCase() === t.toLowerCase());
    let letra;
    if (existente) {
        letra = existente[0];
    } else {
        letra = letterGen();
        mapping[letra] = t;
    }

    return neg ? `¬${letra}` : letra;
}




// --- Divide por conectivo principal para N proposições (corrigida) ---
function splitByTopLevelConnective(text) {
    const t = text.trim();

    // Se houver "ou" na frase (priorizamos "ou" como operador)
    if (/\b ou \b/i.test(t)) {
        // divide tanto por vírgulas quanto pelo "ou"
        const parts = t.split(/,\s*|\s+\bou\b\s+/i).map(s => s.trim()).filter(Boolean);
        return { operator: '∨', parts };
    }

    // Se houver "e" ou "mas" (conjunção)
    if (/\b e \b/i.test(t) || /\b mas \b/i.test(t)) {
        const parts = t.split(/,\s*|\s+\be\b\s+|\s+\bmas\b\s+/i).map(s => s.trim()).filter(Boolean);
        return { operator: '∧', parts };
    }

    // Se houver apenas vírgulas (sem 'e'/'ou' explícito) — tratamos como conjunção
    if (/,/.test(t)) {
        const parts = t.split(/\s*,\s*/).map(s => s.trim()).filter(Boolean);
        return { operator: '∧', parts };
    }

    // nenhum conectivo encontrado -> proposição única
    return { operator: null, parts: [t] };
}


// --- Cria subfórmula de uma parte e atualiza o mapeamento (VERSÃO CORRIGIDA) ---
function buildSubformulaFromPart(part, letterGen, mapping) {
    let inicioNaoDetectado = false; // se havia "não" no início do part
    let core = part.trim();

    // Detecta "não" ou "nao" no início (ex: "não X e Y")
    const inicioNao = core.match(/^\s*(¬|\b(não|nao)\b)\s+(.*)$/i);
    if (inicioNao) {
        inicioNaoDetectado = true;
        core = inicioNao[3].trim();
    }

    // Remove pontuação final
    core = core.replace(/[,.!?]+$/, '').trim();

    // Divide por conectivo principal
    const splitInfo = splitByTopLevelConnective(core);

    const letras = splitInfo.parts.map((p, idx) => {
        let negLocal = false;
        let textoLimpo = p.trim();

        // Se o "não" estiver dentro da subparte (ex: "não está frio"), aplica só nela
        if (/\b(não|nao)\b/i.test(textoLimpo)) {
            negLocal = true;
            textoLimpo = textoLimpo.replace(/\b(não|nao)\b\s*/gi, '').trim();
        }

        // Se havia "não" no início da parte e esta é a primeira subparte,
        // marcamos essa primeira como negada (aplica ¬ ao primeiro elemento apenas)
        if (inicioNaoDetectado && idx === 0) {
            negLocal = true;
            // caso o texto já tivesse "não", já removemos acima; aqui garantimos que textoLimpo esteja limpo
            textoLimpo = textoLimpo.replace(/\b(não|nao)\b\s*/gi, '').trim();
        }

        // Reaproveita letra se já existir mapeamento idêntico
        const existente = Object.entries(mapping).find(([letra, texto]) => texto === textoLimpo);
        let letra;
        if (existente) {
            letra = existente[0];
        } else {
            letra = letterGen();
            mapping[letra] = textoLimpo;
        }

        // Retorna a letra com ¬ se a subparte for negada localmente
        return negLocal ? `¬${letra}` : letra;
    });

    // Monta subfórmula (mantém operador caso haja mais de 1 parte)
    let sub = (letras.length === 1) ? letras[0] : `(${letras.join(` ${splitInfo.operator} `)})`;

    return sub;
}

// ---------- Função principal NL -> CPC (usar parse acima) ----------
function converterParaCPC() {
    const raw = document.getElementById("entrada").value.trim();
    const saida = document.getElementById("saida");

    if (!raw) {
        alert("Digite uma frase em português para converter.");
        return;
    }

    const entrada = raw.trim();
    const lower = entrada.toLowerCase();

    const letterGen = nextLetterGenerator();
    const mapping = {};
    let formula = null;

    // Bicondicional (se e somente se)
    if (/\bse e somente se\b/i.test(lower)) {
        const parts = entrada.split(/se e somente se/i);
        const left = parts[0].trim();
        const right = parts.slice(1).join('se e somente se').trim();
        const leftF = parseDisjunction(left, letterGen, mapping);
        const rightF = parseDisjunction(right, letterGen, mapping);
        formula = `${leftF} ↔ ${rightF}`;
    }
    // Implicação "Se ... então ..."
    else if (/\bse\b/i.test(lower) && /\bentão\b/i.test(lower)) {
        const m = entrada.match(/se\s+(.+?)\s+ent(ã|a)o\s+(.+)/i);
        if (m) {
            const antecedenteText = m[1].trim();
            const consequenteText = m[3].trim();
            const antecedenteF = parseDisjunction(antecedenteText, letterGen, mapping);
            const consequenteF = parseDisjunction(consequenteText, letterGen, mapping);
            formula = `${antecedenteF} → ${consequenteF}`;
        }
    } else {
        // Frase sem "se...então" nem "se e somente se"
        formula = parseDisjunction(entrada, letterGen, mapping);
    }

    if (!formula) {
        saida.textContent = "⚠️ Não foi possível converter. Use frases como 'Se X então Y', 'X e Y', 'X ou Y', 'não X' ou 'X ↔ Y'.";
        return;
    }

    // Exibe
    const mappingLines = Object.entries(mapping)
        .map(([letra, texto]) => `${escapeHtml(letra)} = ${escapeHtml(texto)}`)
        .join("<br>");
    saida.innerHTML = `
        <b>Fórmula em Cálculo Proposicional:</b> ${escapeHtml(formula)}<br><br>
        <b>Mapeamento:</b><br>${mappingLines}
    `;
    if (window.MathJax) MathJax.typeset();
}

// --- Converte de CPC → Linguagem Natural ---
let formulaPendente = "";

function extrairProposicoes(formula) {
    return [...new Set(formula.match(/\b[A-Z](?:\d+)?\b/g) || [])];
}

function escapeRegExp(valor) {
    return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inserirNegacaoNoTexto(texto) {
    const partes = texto.split(/\s+/);
    let posVerbo = partes.findIndex(parte =>
        /ar$|er$|ir$|rá$|está|esta|é|foi|vai|fica|ficará|molhada|chove|chover|fazer|fará|trabalha|estuda|corre|salta|colhe|será|terá|serão|terão/i.test(parte)
    );

    if (posVerbo === -1) posVerbo = Math.max(partes.length - 1, 0);
    partes.splice(posVerbo, 0, "não");
    return partes.join(" ");
}

function traduzirFormulaParaNL(formula, mapping) {
    let frase = formula
        .replace(/[()]/g, "")
        .replace(/↔/g, " se e somente se ")
        .replace(/→/g, " então ")
        .replace(/∧/g, " e ")
        .replace(/∨/g, " ou ");

    if (frase.includes(" então ")) {
        frase = frase.replace(/^(.*?) então /i, "Se $1, então ");
    }

    Object.entries(mapping)
        .sort(([letraA], [letraB]) => letraB.length - letraA.length)
        .forEach(([letra, texto]) => {
            const letraSegura = escapeRegExp(letra);
            const regexNeg = new RegExp(`¬\\s*${letraSegura}\\b`, "g");
            const regexNorm = new RegExp(`\\b${letraSegura}\\b`, "g");

            frase = frase.replace(regexNeg, () => inserirNegacaoNoTexto(texto));
            frase = frase.replace(regexNorm, texto);
        });

    return frase.replace(/\s+/g, " ").trim();
}

function converterParaNL() {
    const formula = document.getElementById("entrada").value.trim();
    const saida = document.getElementById("saida");

    if (!formula) {
        saida.textContent = "Digite uma fórmula em Cálculo Proposicional para converter.";
        return;
    }

    const letras = extrairProposicoes(formula);
    if (letras.length === 0) {
        saida.textContent = "Nenhuma proposição foi encontrada. Use letras maiúsculas como P, Q e R.";
        return;
    }

    formulaPendente = formula;
    const painel = document.getElementById("mapeamento-cpc");
    const campos = document.getElementById("campos-mapeamento");
    const erro = document.getElementById("erro-mapeamento");

    campos.replaceChildren();
    erro.textContent = "";

    letras.forEach((letra, indice) => {
        const grupo = document.createElement("div");
        grupo.className = "mapping-field";

        const label = document.createElement("label");
        label.htmlFor = `significado-${indice}`;
        label.textContent = letra;

        const input = document.createElement("input");
        input.id = `significado-${indice}`;
        input.name = `significado-${indice}`;
        input.type = "text";
        input.placeholder = `O que ${letra} significa?`;
        input.autocomplete = "off";
        input.dataset.letra = letra;
        input.required = true;

        grupo.append(label, input);
        campos.appendChild(grupo);
    });

    painel.hidden = false;
    painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    campos.querySelector("input").focus();
}

function finalizarConversaoParaNL(event) {
    event.preventDefault();

    const campos = [...document.querySelectorAll("#campos-mapeamento input")];
    const mapping = {};
    const erro = document.getElementById("erro-mapeamento");

    for (const campo of campos) {
        const texto = campo.value.trim();
        if (!texto) {
            erro.textContent = `Informe um significado para a proposição ${campo.dataset.letra}.`;
            campo.focus();
            return;
        }
        mapping[campo.dataset.letra] = texto;
    }

    const frase = traduzirFormulaParaNL(formulaPendente, mapping);
    const mappingLines = Object.entries(mapping)
        .map(([letra, texto]) => `${escapeHtml(letra)} = ${escapeHtml(texto)}`)
        .join("<br>");

    document.getElementById("saida").innerHTML =
        `<strong>Frase em Linguagem Natural:</strong><br>${escapeHtml(frase)}<br><br>` +
        `<strong>Mapeamento:</strong><br>${mappingLines}`;

    cancelarMapeamento();
}

function cancelarMapeamento() {
    formulaPendente = "";
    document.getElementById("mapeamento-cpc").hidden = true;
    document.getElementById("erro-mapeamento").textContent = "";
}

// --- Limpa tudo ---
function limparTudo() {
    document.getElementById("entrada").value = "";
    document.getElementById("saida").innerHTML =
        '<p class="empty-state">Preencha o campo acima e escolha uma das conversões.</p>';
    cancelarMapeamento();
    document.getElementById("entrada").focus();
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        nextLetterGenerator,
        parseAtom,
        parseConjunction,
        parseDisjunction,
        escapeHtml,
        extrairProposicoes,
        traduzirFormulaParaNL
    };
}
