# Simula Contábil

Quero um sistema web para um escritório de contabilidade (Martins & Ferri) fazer simulações e comparativos de carga tributária entre Simples Nacional e Lucro Presumido para múltiplos clientes (empresas), mês a mês.

## Modelo de dados (entidades principais)

1. **empresas**: nome, cnpj (opcional), atividade/descrição, anexo predominante do Simples.

2. **parametros_empresa** (1 por empresa, editável): percentual ISS no Presumido, percentual de tributação de serviços no Presumido (base de presunção IRPJ/CSLL para serviços, ex 32%), percentual de tributação de comércio no Presumido (base de presunção, ex 8%/12%), percentual de ICMS no Presumido, percentual de IPI no Presumido, percentual INSS sobre pró-labore, percentual de encargo patronal presumido, valor de pró-labore padrão mensal.

3. **tabela_simples_nacional** (dados de referência, versionados por ano de vigência — vou popular eu mesmo os valores oficiais depois, não precisa inventar números): 5 anexos (I Comércio, II Indústria, III Serviços com Fator R, IV Serviços, V Serviços), cada um com 6 faixas de receita bruta em 12 meses, contendo: alíquota nominal, valor a deduzir, e percentual de repartição dos tributos (IRPJ, CSLL, COFINS, PIS/Pasep, CPP, ICMS/ISS/IPI conforme o anexo). Anexos III e IV têm uma regra especial na 5ª faixa: quando a alíquota efetiva ultrapassa um limite (14,92537% no Anexo III, 12,5% no Anexo IV), o ISS fica fixado em 5% e o excedente é redistribuído proporcionalmente entre os tributos federais usando pesos fixos específicos — isso precisa ser um campo/flag na tabela (limite + pesos de redistribuição), não pode ficar hardcoded no código.

4. **tabela_icms_reducao_pr** (dados de referência, versionados): tabela de redução de ICMS do Simples Nacional específica do estado do Paraná, por faixa de receita bruta em 12 meses, separada para comércio e indústria.

5. **apuracoes**: representa o início de uma simulação para uma empresa a partir de uma competência (mês/ano) inicial. Contém, como "semente" lançada UMA ÚNICA VEZ: os 12 meses de receita bruta total (RBT) e folha de pagamento IMEDIATAMENTE ANTERIORES à competência inicial da apuração (ano, mês, RBT do mês, folha do mês — 12 linhas). Isso serve só para o sistema conseguir calcular o RBT12 (receita últimos 12 meses) e o Fator R já no primeiro mês lançado de verdade.

6. **lancamentos_mensais**: por apuração, competência (mês/ano), e SOMENTE estes campos editáveis pelo usuário: faturamento do Anexo I (comércio), faturamento do Anexo II (indústria), faturamento do Anexo III (serviço com fator R), faturamento do Anexo IV (serviço), faturamento do Anexo V (serviço), folha de pagamento do mês. O faturamento total é sempre a soma desses 5 campos (nunca digitado separadamente).

## Regras de cálculo (lógica de backend, não no frontend)

Para cada lançamento mensal, calcular automaticamente (via função de backend/edge function, não em fórmula de planilha):
- RBT12 = soma rolante dos últimos 12 meses de faturamento total, usando a semente da apuração + os lançamentos mensais acumulados (janela móvel real, sem precisar redigitar nada).
- Folha12 = soma rolante dos últimos 12 meses de folha, mesma lógica.
- Fator R = Folha12 / RBT12. Se Fator R >= 28%, a receita do "Anexo V" é tributada pelas alíquotas do Anexo III em vez do Anexo V (regra do Fator R do Simples Nacional).
- Para cada anexo com faturamento > 0 no mês: identificar a faixa pelo RBT12, calcular a alíquota efetiva = ((RBT12 × alíquota nominal da faixa) − valor a deduzir) / RBT12, aplicar o percentual de repartição de tributos (com a regra especial da 5ª faixa dos Anexos III/IV quando aplicável) para obter o valor de cada tributo (IRPJ, CSLL, COFINS, PIS, CPP, ICMS/ISS/IPI conforme o anexo), multiplicando pelo faturamento do mês daquele anexo.
- Para o Anexo I (comércio) e Anexo II (indústria): aplicar a redução de ICMS do Paraná (tabela tabela_icms_reducao_pr) sobre a alíquota efetiva de ICMS calculada.
- Somar os tributos de todos os anexos ativos no mês = total do Simples Nacional do mês.
- Calcular também o Lucro Presumido do mês usando os parâmetros da empresa (parametros_empresa): IRPJ 15% sobre base presumida (+ adicional de 10% sobre o que exceder R$ 20.000/mês de base), CSLL 9% sobre base presumida, COFINS 3% cumulativo, PIS 0,65% cumulativo (sobre o faturamento não isento), ISS conforme parâmetro, tudo sobre a base de presunção configurada por tipo de receita (comércio vs serviço).
- Gerar o comparativo: total Simples Nacional x total Lucro Presumido x alíquota efetiva de cada um, por mês e acumulado.

## Telas

1. Cadastro de empresa + parâmetros (formulário simples, uma vez por cliente).
2. "Iniciar apuração": escolher empresa e competência inicial, preencher a tabela de 12 meses anteriores (RBT + folha) — semente, uma vez só por apuração.
3. Lançamento mensal: tela enxuta, só pede faturamento por anexo (5 campos) + folha do mês. Mostra o RBT12 e Fator R calculados na hora, para conferência visual.
4. Dashboard/relatório da apuração: tabela mês a mês com faturamento, Simples Nacional, Lucro Presumido, alíquotas efetivas, e gráfico comparativo da carga tributária ao longo dos 12 meses — similar a um relatório de fechamento para apresentar ao cliente.

Use Lovable Cloud (Supabase) para o backend e banco de dados. Interface em português do Brasil, visual profissional/sério (escritório de contabilidade), não precisa ser colorido ou "fun". Pode começar pela estrutura de banco de dados e telas de cadastro/lançamento primeiro; os valores oficiais da tabela_simples_nacional e tabela_icms_reducao_pr eu mesmo vou popular depois via SQL.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tributo-simples-comparativo.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c6018e57-d6a8-4921-9b43-8ab6bdff9383).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
