# Conversor NL → CPC  

[![Testes JavaScript](https://github.com/Juliarezende521/nl-cpc-conversor/actions/workflows/testes.yml/badge.svg)](https://github.com/Juliarezende521/nl-cpc-conversor/actions/workflows/testes.yml)

Conversor de frases em **Linguagem Natural (NL)** para **Cálculo Proposicional (CPC)** usando JavaScript.  
Projeto desenvolvido para a disciplina de Lógica Para Computação, seguindo os requisitos solicitados pelo professor.

---

## 🌐 Acesse o Conversor Online
A aplicação está disponível para uso direto no navegador, sem instalação:

🔗 **(https://juliarezende521.github.io/nl-cpc-conversor/)**

---

## 📌 Objetivo do Projeto
Criar um sistema capaz de:
- Receber uma frase em linguagem natural.
- Identificar proposições simples.
- Detectar conectivos lógicos (“e”, “ou”, “se”, “então”, “mas”, “não” etc.).
- Gerar automaticamente a **fórmula correspondente em Cálculo Proposicional (CPC)**.
- Mapear cada proposição atômica com uma letra proposicional (P, Q, R...).

---

## ✨ Funcionalidades
- Suporte a **todos os conectivos clássicos**:
  - Conjunção: **e**, **mas**
  - Disjunção: **ou**
  - Implicação: **se … então**
  - Bicondicional: **se e somente se**, **sse**
  - Negação: **não**
- Identificação automática de **várias proposições**, sem limite de quantidade.
- Agrupamento correto de blocos dentro de cada trecho da frase.
- Geração de:
  - Fórmula em CPC com parênteses
  - Tabela de mapeamento:  
    ```
    P = João estuda  
    Q = Maria trabalha
    ```
- Interface simples em HTML + JavaScript.

---

## 🧠 Como funciona a lógica
1. A frase é dividida conforme conectivos reconhecidos.  
2. Cada parte que representa uma proposição é associada a uma letra:  
   `P, Q, R, S, T…`  
3. Os conectivos são convertidos:  
   - **e / mas → ∧**  
   - **ou → ∨**  
   - **não → ¬**  
   - **se ... então → →**  
   - **se e somente se → ↔**  
4. A fórmula final é montada com parênteses garantindo a precedência.

---

## 🏗️ Arquitetura e funcionamento (resumo)
1. **Entrada (NL)** — string em português.  
2. **Pré-processamento** — normalização de vírgulas, remoção de pontuação irrelevante.  
3. **Parser baseado em regras**:
   - `parseDisjunction` (divide por "ou" — menor precedência);
   - `parseConjunction` (divide por "e", "mas" ou vírgulas);
   - `parseAtom` (detecta negações e cria letras proposicionais).  
4. **Mapeamento** — cada proposição única recebe uma letra: `P, Q, R, S...`.  
5. **Montagem da fórmula** — combina subfórmulas com operadores (∧, ∨, →, ↔) e negações (¬).  
6. **Saída (CPC)** — exibe fórmula + mapeamento.  
7. **CPC → NL** — substitui letras por significados (pedidos via `prompt`), insere "Se" quando houver implicação e tenta posicionar "não" antes do verbo (heurística).

> Observação: o parser é **baseado em regras (regex + divisão por conectivos)** — não usa análise sintática profunda (dependência). Isso torna o sistema rápido e interpretável, porém sujeito a ambiguidade em frases muito complexas.

---

## 📘 Estratégia de tradução (detalhes)
- **Regra de precedência:** `¬` > `∧` > `∨` ; implicação e bicondicional tratadas como operadores de nível superior em sentenças do tipo "Se ... então ...".  
- **Mapeamento reutilizável:** mesmos textos (ignorando diferença de caixa) mapeiam para a mesma letra.  
- **Negação:**
  - Se aparece no início de uma subfrase: aplica-se à subproposição inteira (ex.: "Não (A e B)" → `¬(P ∧ Q)`).
  - Se aparece dentro do átomo (ex.: "a grama não está molhada") é removida do texto salvo e a letra recebe `¬`.  
- **Heurística para CPC → NL:** tenta inserir "não" antes do verbo na definição da proposição (lista de sufixos/verbos comuns). Pode falhar em casos complexos — documentado em limitações.

---

## 🧪 Exemplos de input / output (para o relatório)

| # | Entrada (NL) | Resposta esperada (CPC) |
|---|----------------|-------------------------|
| 1 | João estuda e Maria trabalha | `P ∧ Q`<br>`P = João estuda`<br>`Q = Maria trabalha` |
| 2 | João estuda, Maria trabalha, Pedro dorme | `P ∧ Q ∧ R`<br>`P = João estuda`<br>`Q = Maria trabalha`<br>`R = Pedro dorme` |
| 3 | João estuda ou Maria trabalha | `P ∨ Q` |
| 4 | Se chover então a grama molha | `P → Q` |
| 5 | Se chover e fizer frio, então aula cancelada | `(P ∧ Q) → R` |
| 6 | Não está chovendo | `¬P` |
| 7 | João não estuda e Maria trabalha | `¬P ∧ Q` |
| 8 | Se João não estuda e Maria trabalha, então Pedro dorme | `(¬P ∧ Q) → R` |
| 9 | P ∧ Q → R (entrada CPC) | `Se P e Q, então R` (na conversão CPC→NL pedir significados) |
| 10 | Se e somente se: “A implica B e B implica A” | `P ↔ Q` |

> Para testes extremos: frases com mais de 4 proposições, negações internas + externas, e mistura "mas"/"e"/vírgula. Verifique o mapeamento para garantir que o parser separou corretamente.

---

## ⚠️ Limitações e Possibilidades de Melhoria

### 🔹 Limitações atuais
- **Parser baseado em regras simples:** frases com estrutura muito complexa, ambiguidade semântica ou múltiplos conectivos sobrepostos podem gerar interpretações incorretas.  
- **Dependência de conectivos explícitos:** sem conectivos como “e”, “ou” ou “se”, o sistema pode não separar corretamente as proposições.  
- **Negação limitada:** a heurística de detectar “não” pode falhar quando a frase é longa ou pouco estruturada.  
- **CPC → NL ainda é heurístico:** pode gerar frases que soam pouco naturais.  
- **Sem análise sintática real:** ausência de parsing profundo (ex.: dependência ou árvores sintáticas).

### 🔹 Possíveis melhorias futuras
- Implementar um **parser sintático completo** (Earley, CYK, dependência).  
- Usar uma **LLM auxiliar** para desambiguação e interpretação semântica.  
- Criar interface com **visualização de árvores lógicas**.  
- Adicionar suporte a novos conectivos (XOR, NAND etc.).  
- Permitir **correção manual da interpretação** pelo usuário.  
- Ampliar o **conjunto de testes automatizados** com novos casos de ambiguidade e precedência.

---

## 🎥 Vídeo de Demonstração
📹🔗 **https://drive.google.com/file/d/1VR3VlYhmYHna6-5diryKYD-V3zasM_jQ/view?usp=sharing**

---

## ✅ Melhorias desta versão

Este repositório é um fork do projeto acadêmico desenvolvido em dupla. Nesta versão, **Júlia Rezende** continuou a evolução técnica com:

- Correção do gerador de proposições após a letra Z
- Tratamento do cancelamento e de significados vazios na conversão CPC → NL
- Proteção da saída contra injeção de HTML
- Melhorias de acessibilidade e orientação na interface
- Cinco testes automatizados executados pelo GitHub Actions

Para executar os testes localmente:

```bash
npm test
```

---

## 👩‍💻 Autoras
- **Júlia Moreira** — Estudante de Sistemas de Informação
- **Júlia Rezende** — Estudante de Ciência da Computação  
