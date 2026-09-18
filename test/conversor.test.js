const test = require("node:test");
const assert = require("node:assert/strict");

const {
    nextLetterGenerator,
    parseAtom,
    parseDisjunction,
    escapeHtml
} = require("../script.js");

test("gera letras válidas depois de Z e continua com sufixos", () => {
    const gerar = nextLetterGenerator();
    const resultado = Array.from({ length: 27 }, () => gerar());

    assert.deepEqual(
        resultado.slice(0, 26),
        "PQRSTUVWXYZABCDEFGHIJKLMNO".split("")
    );
    assert.equal(resultado[26], "P1");
});

test("mantém a precedência de conjunção sobre disjunção", () => {
    const mapping = {};
    const formula = parseDisjunction(
        "João estuda e Maria trabalha ou Pedro dorme",
        nextLetterGenerator(),
        mapping
    );

    assert.equal(formula, "((P ∧ Q) ∨ R)");
    assert.deepEqual(mapping, {
        P: "João estuda",
        Q: "Maria trabalha",
        R: "Pedro dorme"
    });
});

test("reutiliza a letra para proposições iguais ignorando maiúsculas", () => {
    const mapping = {};
    const formula = parseDisjunction(
        "João estuda e joão estuda",
        nextLetterGenerator(),
        mapping
    );

    assert.equal(formula, "(P ∧ P)");
    assert.deepEqual(mapping, { P: "João estuda" });
});

test("reconhece negação no início de uma proposição", () => {
    const mapping = {};
    const formula = parseAtom(
        "não está chovendo",
        nextLetterGenerator(),
        mapping
    );

    assert.equal(formula, "¬P");
    assert.deepEqual(mapping, { P: "está chovendo" });
});

test("escapa HTML fornecido pelo usuário", () => {
    assert.equal(
        escapeHtml('<img src=x onerror="alert(1)">'),
        "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
});
