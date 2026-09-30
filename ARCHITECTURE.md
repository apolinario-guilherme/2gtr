# 2gtr — Arquitetura Técnica (V2 auditada)

Adapter atual: `localStorage` (`juntos_db_v1`) + sessão (`juntos_session_v1`).
Camada financeira: `js/db.js` (`window.Juntos.DB`). UI nunca calcula regra
financeira: chama o adapter e apresenta. Produção: trocar o adapter por
Supabase/Firebase com RLS sem mudar as telas.

## 1. Entidades

| Tabela | Dono | Chave de isolamento |
|---|---|---|
| users | id, nome, email, salt+hash, avatar, created_at | — |
| couples | id, name, created_at | membros |
| couple_members (members) | id, couple_id, user_id, role, joined_at | couple_id (máx 2) |
| couple_invitations | id, couple_id, code JNT-XXXXXX, status, created/expires | couple_id |
| categories | id, couple_id, name, type, icon, active | couple_id |
| transactions | id, couple_id, created_by, type, description, amount>0, date, category_id, is_shared, payer_user_id, account_id?, credit_card_id?, invoice_id?, notes, timestamps, deleted_at? | couple_id |
| transaction_splits | id, transaction_id, couple_id, user_id, split_type, percentage?, fixed_amount?, calculated_amount | couple_id |
| settlements | id, couple_id, from/to, amount, date, notes | couple_id |
| budgets | id, couple_id, category_id, month, year, amount (único por tupla) | couple_id |
| goals / goal_events | id, couple_id, name, target, current, deadline, status | couple_id |
| recurring_transactions / recurring_occurrences | regra + eventos (pending/paid/skipped/cancelled + transaction_id?) | couple_id |
| accounts | id, couple_id, name, type, owner, initial_balance, active, created_by | couple_id |
| transfers | id, couple_id, from/to, amount, date, deleted_at? | couple_id |
| credit_cards | id, couple_id, name, brand, last4, owner, limit, closing/due, pay_account?, active | couple_id |
| installment_purchases / installments | compra + N parcelas (status, invoice_id?, transaction_id?) | couple_id |
| invoices / invoice_payments | período, total, pago, status + pagamentos (conta, valor, data) | couple_id |
| audit_logs | id, couple_id, user_id, entity, entity_id, action, metadata, created_at | couple_id |

Sem `current_balance` físico: saldo sempre derivado. Sem número de cartão,
CVV, senhas ou tokens em qualquer tabela.

## 2. Mapa do domínio

CASAL → membros, transações (+splits), contas, cartões → faturas → pagamentos,
parcelamentos → parcelas, transferências, orçamentos, metas, recorrentes →
ocorrências, acertos, convites, auditoria. Relatórios leem tudo via centrais.

## 3. Regras financeiras oficiais

- Receita aumenta resultado (+saldo da conta se vinculada). Despesa reduz.
- Transferência move entre contas (líquido zero no casal).
- Compra no cartão = despesa + compromisso de limite, sem mexer em conta.
- Parcela = parte temporal; soma exata (residual determinístico na última).
- Fatura = soma de compras + parcelas do período (nunca total + parcelas).
- Pagamento de fatura reduz conta e obrigação; nunca é despesa/transferência/settlement.
- Acerto = pago − deveria pagar − acertos; nunca despesa/receita.
- Orçamento = planejamento; meta = acompanhamento; projeção = estimativa.

## 4. Serviços centrais (js/db.js)

Resumo: `dashboardCalc` (=`calculateMonthlySummary`), `calculateCategoryExpenses`,
`calculateAvailableToSpend`, `monthSummary`. Contas: `calculateAccountBalance`,
`calculateAccountsSummary`, `calculateTransferImpact`, `cashFlowByAccount`.
Cartões: `calculateCardUsedLimit`, `calculateCardAvailableLimit`,
`calculateCardOutstandingCommitment`. Parcelas: `calculateInstallmentDates`,
`buildInstallmentAmounts`, `purchaseSummary` (=`calculateInstallmentPurchaseSummary`).
Faturas: `calculateInvoicePeriod`, `getOrCreateInvoiceForCardCharge`,
`calculateInvoiceTotal/Outstanding/Status`. Acertos: `calculateSettlementBalance`
(=`settle`). Outros: `budgetStatus` (=`calculateBudgetStatus`), `goalProgress`
(=`calculateGoalProgress`), `calculateProjectedBalance`. Exportação:
`buildCsv` (7 tipos, BOM). Diagnóstico: `diagnose()`. Trilha: `listAuditLogs()`.

## 5. Fluxos (todos atômicos em 1 escrita, com trava anti-duplo-clique na UI)

Compra cartão → vínculo à fatura aberta → fechar → pagar (conta −, fatura paga,
limite +). Parcelada → N parcelas → faturas → pagamentos. Recorrente →
ocorrência → pagar (cria tx; rollback compensatório se falhar). Transferência
troca termos derivados (sem acumular). Acertos abatem do líquido.

## 6. Segurança

Toda função deriva `couple_id` de `myCoupleId(userId)`; IDs da UI nunca viram
escopo. Exceção documentada: `userName()` (só nomes para exibição no casal).
Guards de rota + sessão. Auditoria cobre leitura/escrita/exclusão/cruzamentos.

## 7. Migrations (adapter local)

`blank()` = schema atual; `read()` completa chaves ausentes; `migrate()`
semeia defaults e faz backfill (ex: splits 50/50 legados). Regras: identificar,
idempotente, nunca destrutiva, nunca inventar vínculo financeiro (nulls
preservados: account_id/credit_card_id/invoice_id legados).

## 8. Backup (honesto)

Sem backup automático: dados vivem no `localStorage` do navegador. Recuperação:
exportar CSV por módulo + Backup JSON na tela de Transações; em outro
navegador, os dados começam vazios. Não prometer o que a plataforma não dá.

## 9. Testes

Harness em `test-eNN.html` (carrega `js/db.js` + `auth.js`, asserções no DOM):
`dump-dom` headless + grep PASS/FAIL. Cobertura: unidades das centrais,
integração dos 6 fluxos, E2E mensal, isolamento A×B, double-counting ×5,
bateria de erros, concorrência (2º comando bloqueia), diagnose planta/repara,
regressão. UI: probe `index.html` + fragmento seed, `dump-dom`/screenshot.

## 10. Performance

`dashboardCalc`/`cashFlowByAccount` em leitura única; `expenseCounts` agregada;
paginação (30) em listas; ocorrências sob demanda (mês+2); sem N+1 nos
relatórios (contagens em passada única). UI re-renderiza a rota atual após
operações (sem reload).

## 11. Automação V3 (infraestrutura, sem notificações/IA).

Tabelas `automation_rules` (trigger AND/OR, condições, ações, prioridade) e
`automation_rule_executions` (status/match/ação/antes/depois/erro/motivo).
Fluxo EVENTO → regras do trigger (prioridade) → condições → ações via centrais
→ histórico. Idempotência regra+evento+ação; loops barrados por origem e
profundidade (máx 2); conflitos resolvidos por prioridade; sem ping-pong.
Ações safe deste prompt: set_category, set_description, add_note,
create_alert_event, mark_for_review (flag `needs_review`), enable/disable_rule.
Futuras (create_transaction etc.) bloqueadas com mensagem. Regras disparam em
create/update de transação, create de transferência, pagamento/fechamento/
cancelamento de fatura, parceladas e recorrentes; resto via teste/simulação.
UI em Configurações: lista, wizard 5 etapas com preview, testar sem alterar,
sugestões inativas, histórico, duplicar (inativa), toggles. Pontos futuros:
`J.DB` já desacoplado de UI; eventos alimentam IA/notificações/WhatsApp.

## 12. Categorização Inteligente (sugestão, nunca alteração silenciosa).
Tabelas `category_suggestions` (pending/accepted/rejected/expired/dismissed +
score/fonte/motivo) e `category_feedback` (accepted/rejected/corrected/
manually_categorized + norm/merchant). Hierarquia: regra explícita (1.0) >
histórico exato > padrão merchant > similaridade (Jaccard ≥0.5) > heurística
salário (0.75). Confiança = top/total × min(1,peso/5); threshold central 0.70.
Pesos: transação 1 (1.5 se ≤90d); feedback accepted/corrected +2, manual +1,
rejected −1. Normalização só para comparar (original intacta). Transação em
"Outros" (equivalente documentado de "sem categoria") gera sugestão
automática; manual nunca é sobrescrito. Aceitar/corrigir/ignorar via updateTx
(gera feedback automaticamente); excluir expira. Sugestão de regra
(≥5 ocorrências, ≥80%) usa AutomationRuleService. Pontos p/ conciliação (P19)
e IA futura (ai_future reservado, sem chamada externa).

## 11. Automação V3 (infraestrutura, sem notificações/IA)

Tabelas `automation_jobs` (tipo/status/agendamento/tentativas/idempotência/
payload/resultado), `automation_executions` (trilha técnica) e
`financial_events` (dedupe por chave). Fluxo EVENTO → ENGINE → JOB → EXECUÇÃO.
Serviços: `emitEvent`/`pushEventInDb`, `routeEventInDb` (só occurrence.due gera
job de ação), `createJob` (idempotente), `runJob`/`runPendingJobs`/
`retryFailedJobs`/`cancelJob`, `runScheduledScan`, handlers por tipo
(`occurrence_processing` reutiliza `payOccurrence`; demais reutilizam
`ensureOccurrences`, refresh de faturas, `budgetSummary`+`budgetStatus`,
`goalProgress`, `diagnose`). Falha volta a pending até `max_attempts`;
stale-running e segundo processamento viram `skipped`. Diagnóstico em
Configurações. Fronteiras futuras (sem implementar): eventos alimentam IA/
notificações/WhatsApp; `J.DB` já é independente de UI (Web/automação/IA/
WhatsApp usam os mesmos serviços).

## 13. Conciliacao Interna + Importacao CSV/OFX (interpretar antes de criar).

Tabelas `import_batches` (uploaded/preview/ready/processing/completed/
partially_completed/failed/cancelled + contadores + file_hash + periodo),
`imported_transactions` (raw preservado + normalizado + status/match +
vinculos matched_transaction_id/matched_transfer_id/created_transaction_id
+ import_error), `import_mappings` (reuso por conta) e
`reconciliation_matches` (transaction/transfer/invoice_payment/invoice +
exact/strong/probable/weak/duplicate/transfer_pair + pending/accepted/
rejected/ignored). Auditoria reutiliza `audit_logs`. Fluxo: upload (so cria
lote) -> parsing -> normalizacao -> previa somente-leitura -> conciliacao ->
confirmacao -> importacao via centrais (createTx/createTransfer/payInvoice).
CSV: ,/;/tab, BOM, debito/credito separado ou valor unico, deteccao
automatica bidirecional com revisao obrigatoria. OFX: parser tolerante
(FITID/data/valor/memo/conta). Centavos; datas ISO com flag de ambiguidade.
Score central data 45% + valor 35% + descricao Jaccard 20%; thresholds
0.95/0.85/0.70/0.50. Transferencias: pares saida x entrada (+-3d, mesmo
valor) e lado de transferencia existente; fatura: pagamento existente ou
fatura em aberto (+-45d do vencimento, valor = pendente). Idempotencia por
created_transaction_id/status + re-finalizacao bloqueada + hash (aviso).
UI: #/imports e #/imports/:id (previa, conciliar manual top-5, criar
transferencia do par, pagar fatura, importar/ignorar/desfazer). Sem Open
Finance (V4).

## 14. Importacao de Fatura de Cartao (19.1, reusa o 19).

`import_batches.import_source_type` (bank_statement p/ lotes antigos via
backfill; credit_card_statement exige `credit_card_id` do casal, conta
opcional/nula) + `invoice_id`. Linhas ganham `credit_card_id`,
`card_item_type` (card_purchase/installment/payment/refund/fee),
`installment_number/total_installments`, `matched_installment_id`.
Mapeamento com coluna Parcela ("1/3", "2 de 12", "a vista") e modelos por
cartao (`credit_card_statement`). Conciliacao de fatura: parcelas
existentes (cartao+valor+±7d, bonus n/total, teto 0.95), lancamentos do
cartao, pagamentos (invoice_payments ou fatura em aberto do cartao);
transferencias NUNCA envolvem linhas de cartao. Pagamento/estorno nunca
viram duplicado automatico nem despesa (import bloqueado com orientacao).
Importar usa createTx com cartao (fatura via data, limite e total pelos
servicos centrais). `ensureBatchInvoice` localiza ou cria (so com
confirmacao) sem duplicar; `calculateImportedStatementTotal` x
`calculateInvoiceTotal` com alerta de divergencia.
`createInstallmentPurchaseFromRow` cria parcelada so com dados confirmados.

## 15. Motor de Analise Financeira (read-only, deterministico).

`FinancialAnalyticsService.analyze` = `DB.analyzeFinancialPeriod(userId,
{periodStart, periodEnd, preset, view, filters})` (versao 1.0.0).
Presets: mes atual/anterior, ultimos 3/6/12 meses, personalizado (max 36).
Visoes couple/me/partner (nunca mistura silenciosa). Varredura unica em
centavos (sem N+1) com semantica do dashboardCalc; comparacao com periodo
anterior de mesma duracao (meses cheios alinham no calendario);
tendencia por minimos quadrados (>5% = direcao, senao estavel, <3 pts =
insufficient_data). Reusa dashboardCalc/settle/budgetSummary/goalProgress/
accountsSummary/availableToSpend/expenseCounts; projecoes via
listOccurrences+nextDueFor (nunca gera ocorrencias). Matriz: transferencia
e pagamento de fatura nao sao receita/despesa; parcela/fatura aberta =
compromisso (realizado x comprometido x projetado separados). Cache em
memoria com fingerprint (contagens + updated_at); sem score proprietario;
sem rotulos; sem escrita (teste prova localStorage intacto).

## 16. Insight Engine (deterministico, sem IA, sem julgamento).

`FinancialInsightService.generateInsights` consome `FinancialAnalysisSummary`
(+ baseline de 3 meses) e avalia o catalogo `INSIGHT_RULES` (19 regras:
gastos/categoria +/- 15-20%, unusual, orcamento 80/100, fatura a vencer 7d/
vencida, cartao 70/90, parcelas 30d, recorrentes 7d, metas prazo/valor,
acerto >= R$10, fluxo (+-10% da receita), receita (+-15%), conciliacao
pendente >= 5, compromissos 15d). `financial_insights` (tipo/categoria/
severidade info-attention-important/status/evidence/fingerprint/entidade/
metricas) + `financial_insight_preferences` (silenciar por tipo, casal ou
pessoal). Idempotencia por fingerprint (atualiza evidencias, nunca duplica);
dispensado/arquivado/acionado nunca ressuscita; cooldown por regra na
recriacao pos-expiracao; expiracao (prazo, fatura paga, mes encerrado,
meta concluida, condicao atualizada; historico preservado). Regras de
dados do casal com fingerprint/escopo unicos (sem triplicar por visao);
visoes me/partner com user_id e privacidade (parceiro nao ve o do outro).
Integracao com AutomationEngine via `generateInsightsForEvent` (por evento
ou job, barato via cache; sem auto-hook nas mutacoes por decisao de
debounce). Auditoria insight.created/updated/expired/read/dismissed/
acted_on (sem valores). UI `#/insights` (filtros, contadores, cards com
evidencias/porque/acao, ler/dispensar). Sem score, sem ranking do casal,
sem prescricao ("vale revisar", nunca "pare de gastar").

## 11. Pontos de extensão V3 (fronteiras, sem implementar)

- Open Finance: adaptadores `ExternalAccount/Transaction/Provider/SyncStatus`
  alimentariam `transactions`/`accounts` via validadores existentes — nunca um
  segundo razão financeiro.
- Notificações: derivar eventos (`invoice_due/overdue`, `recurring_due`,
  `budget_exceeded`, `goal_completed`, `settlement_pending`) dos estados já
  calculados; sem acoplamento com componentes.
- IA/análises: consumir apenas as centrais do item 4 + `diagnose()`.
- Investimentos: novo `account.type` + rentabilidade como leitura, sem tocar
  no razão.

## 17. Assistente Financeiro (conversa; IA nunca calcula sozinha).

Tabelas ai_conversations (active/archived/deleted; excluir nunca apaga financas), ai_messages (user/assistant/system/tool + intent/tool I/O), ai_actions (pending_confirmation/confirmed/executing/completed/failed/cancelled/expired + idempotency_key).
Pipeline: mensagem -> rate/size -> NLU deterministica pt-BR (intents READ/WRITE, periodo, categoria/conta/cartao reais, valor) -> tools oficiais (allowlist READ/WRITE; sem SQL) -> provider local plugavel (AIProvider; fallback estruturado) -> validador (todo R$ precisa existir nos fatos).
Escrita SOMENTE com confirmacao explicita da mesma acao (sim/nao; pedido novo cancela pendente); validacao de schema no backend; execucao via servicos oficiais; re-confirmar retorna resultado (idempotente); auditoria ai.* completa. Injection neutralizado por arquitetura (regras/confirmacao inegociaveis). Privacidade: contexto minimo, so ultimos 4 digitos, visoes casal/eu/parceiro. UI #/assistant (conversas, sugestoes, cartao de confirmacao) + atalho no dashboard. WhatsApp futuro reusa intents/tools/confirmacao.


## 18. WhatsApp (canal; sem financas proprias).

Tabelas whatsapp_connections (pending/active/revoked/blocked; so hash + mascara, nunca numero cru), whatsapp_link_codes (uso unico, 10min), whatsapp_messages (inbound/outbound, received/processing/processed/failed/ignored + external_message_id), whatsapp_preferences (proativas off, quiet hours), whatsapp_message_failures (dead letter). ai_conversations/messages/actions ganham channel (+external ids) e confirmation_expires_at (30min no WhatsApp).
Fluxo: webhook (assinatura meta, replay 5min, rate, idempotencia por external id) -> identidade por hash -> conversa whatsapp (reusa ai_conversations) -> FinancialAIAssistantService -> resposta curta ou confirmacao interativa (Confirmar/Editar/Cancelar + fallback 1/2/3). Editar rascunho ('confirmar, mas...'), duplicidade semantica (pergunta antes), 'sim' sem pendencia, midia recusada, atalhos /resumo etc. Provider local-sim com outbox (meta sem chamadas externas); segredos nunca no frontend. Retry idempotente. Revogar preserva historico. UI em Ajustes (status, mascara, codigo, desvincular, prefs). Pronto p/ NotificationService futuro.


## 19. Notification Engine (entrega operacional, sem IA).

Tabelas notifications (pending/scheduled/processing/sent/delivered/read/dismissed/failed/expired/cancelled + idempotency_key + event_id + payload minimo), notification_preferences (por usuario/casal/canal/tipo + quiet hours + frequencia/digest) e notification_deliveries (por canal, tentativas, erro, provider ids).
Fluxo: FinancialEventService (notifProcessEvent) ou notifScan deterministico (fatura/orcamento 80-90-100/recorrencia/parcela/meta/acerto/conciliacao/import/automacao) -> decisao (prefs, cooldown por tipo+entidade, idempotencia, quiet com reagendamento; important atravessa) -> deliveries (in_app imediato; whatsapp via adapter P23 com outbox; email/push sem provider = erro explicito) -> retry com backoff e max_attempts -> expiracao (tempo + condicao: fatura paga etc.). Insights NAO viram notificacao (Prompt 25).
UI #/notifications (filtros, ler/dispensar, deep links validados), badge global com contagem eficiente, prefs em Ajustes. Auditoria notification_* completa; sem secrets em payload/logs.


## 20. Notificacoes Inteligentes (decisao deterministica, sem IA).

Tabelas notification_decisions (trilha de auditoria das decisoes) e notification_digests (via notifications tipo daily/weekly_digest). Notifications ganham origin (operational/intelligent). Novos tipos: category/spending_change, unusual_spending, upcoming_commitments, insight/daily/weekly_digest.
Camada: analytics+insights -> candidatos com evidencia -> relevancia 0..1 (magnitude 45% + urgencia 30% + valor 15% + contexto 10% - repeticao/cooldown) e urgencia por prazo -> politicas centrais (thresholds, cooldown, frequencia, digest, canais) -> cooldown contextual com MUDANCA MATERIAL (>=10% re-notifica; baseado em notificacoes, nunca em avaliacao) -> agrupamento por grupo (chave = composicao) -> digest (so modo digest, nunca duplica individual) -> NotificationEngine entrega -> resolucao (acao resolve causa; periodo novo expira).
Sem score/ranking/julgamento; relevancia interna nunca exibida. Jobs evaluate/generate_digest/expire no AutomationEngine (idempotentes). Metricas tecnicas em intelMetrics. UI com selo discreto + filtro origem. Preparado p/ Prompt 26 (planejamento consome compromissos).

## 21. Planejamento Financeiro (P26: simulacao deterministica, sem IA).

Tabelas financial_plans (draft/active/archived/completed + periodo/base/moeda), financial_plan_items (income/expense/saving/goal_contribution/commitment/adjustment + once/monthly/yearly + source_type/source_id + soft delete), financial_plan_scenarios (baseline/conservative/custom; baseline unico ativo, auto-criado) e financial_plan_scenario_items (none/fixed/percentage + extras avulsos).
Camada: FinancialPlanningService (CRUD + generateBaselinePlan de recorrencias/metas/acerto; orcamentos so como referencia) -> CashFlowProjectionService (saldo inicial das contas + itens -> mensal, cumulativo em centavos) -> variancia (realizado via dashboardCalc; pct nulo sem planejado) -> safe amount (considerado − saidas − faturas − parcelas; projecao explicita).
Regras anti-duplicacao: parcela 1x por vencimento; fatura so o descoberto (outstanding − vinculadas); pagamento nunca e despesa; transferencia/acerto neutros; limite fora do caixa. Visoes couple/me/partner (itens household + foco). Cenários isolados (nunca tocam o real); compare retorna deltas B−A sem ranking. Scan emite eventos plan.* + notificacoes P24 (5 tipos, rota planning, idempotentes); jobs calculate_planning_projection/calculate_plan_variance/refresh_active_plans/detect_planning_variance/expire_old_plans no AutomationEngine. Auditoria plan*/plan_item*/plan_scenario*. UI #/planning + #/planning/:id + bloco no dashboard com visao. Sem score, sem "melhor plano", sem prescricao.

## 22. Calendário Financeiro 2.0 (P27: visualização temporal, sem IA).

Sem tabela nova: CalendarEvent normalizado e gerado dinamicamente (1 leitura + centrais) — getCalendarEvents/getEventsForDay/Week/Month, getUpcomingEvents, getOverdueEvents, getEventDetails, groupEventsByDate, filterEvents, calculateDaySummary, calculatePeriodSummary, calendarCashflow, calendarExportCsv. Fontes: transactions (realizado 1x), transfers (neutras), invoices (fechamento=info + vencimento com outstanding), invoice_payments (saída de caixa, nunca despesa), installments (1x/vencimento, nunca o total), recurring_occurrences materializadas (sem criar nada), goals (prazo/conclusão/aportes; sem alterar current_amount), budgets (marco mensal; teto, nunca transação), settlements (realizado + pendente; nunca despesa), plan_items P26 (planejado; cenário só quando visualizado), insights (contexto).
Filtros validados no serviço (ownership por couple_id; ids de outro casal lançam erro): visão, tipos, estados, conta(s), cartão(ões), categoria, pessoa, busca, plano. Datas YYYY-MM-DD sem conversão de timezone; clamp de parcelas/recorrências reutiliza regras P11/P6. Resumo separa realizado/compromissos/planejado; fluxo de caixa só move conta (cartão entra na fatura). UI #/calendar (mês/semana/lista/próximos/atrasados, drawer do dia, modal do evento com ações contextuais via rotas existentes, CSV, empty states, aria-labels) + dashboard "Próximos compromissos" com planejado. Pronto p/ IA/WhatsApp consumirem o mesmo serviço.

## 23. Dashboard V3 (P28: agregação e apresentação, sem IA).

DashboardAggregationService (DASH_PRESETS: month/prev/next30/next3/last3/last6/last12/custom): dashValidateFilters (visão + ownership de conta/cartão/categoria; presets resolvem p/ YM + flag future) -> getDashboardSummary coordenado (1 fingerprint = analytics + plans/items/insights/notifications/settlements/goals; falha isolada por seção em meta.errors; cache em _dcache; dashInvalidate p/ refresh) -> 14 getters finos (getCashPosition via calculateAccountsSummary/visionAccounts; getFinancialResult via dashboardCalc + saveRate nulo sem receita; getDashboardMetrics via analyzeFinancialPeriod; getUpcomingCommitments via calculateFutureCommitments + getUpcomingEvents; getCardSummary via visionCards; getInvoiceSummary via outstanding; getBudgetSummary por mês; getGoalSummary com planejado separado do acumulado; getSettlementSummary; getPlanningSummary com variância; getCalendarSummary 7d; getInsightSummary top 3; getNotificationSummary unread).
Conceitos nunca misturados: dinheiro (contas) ≠ resultado (receitas−despesas) ≠ limite (crédito) ≠ fatura (obrigação) ≠ planejado ≠ projetado. Conta/cartão/categoria filtram o que é compatível; dinheiro e projetado ignoram período (estado atual). Filtros globais persistidos em juntos_dash_v3 (user+couple p/ recolhidos). UI: saudação contextual, refresh, atalhos, fluxo de caixa (realizado vs projeção rotulada), planejado x realizado factual, agenda 7d, insights/notificações como resumo, cards recolhíveis, tooltip do disponível, blk() isola erro por seção. Sem score/ranking/julgamento; sem números fictícios.

## 24. Relatórios V3 (P29: análise em profundidade, sem IA).

FinancialReportingService (REPORT_TYPES com 20 tipos): repValidateFilters (month/prev/last3/last6/last12/year/prevYear/custom + visão + ownership de categoria/conta/cartão + tipo) -> 20 geradores finos sobre oficiais (resumo via dashboard+analytics; receitas/despesas com monthly rotulado history/projected; categorias com contagem/média + largest/frequency/merchants; fluxo via cashFlowByAccount; contas; cartões com utilização; faturas com total/pago/aberto/status + pagamentos; parcelas com pago/pendente/restante; orçamento por mês; metas com planejado vs realizado no período; planejamento com months + variância; settlements com histórico; recorrências configurada vs paga; tendências com history/projected; participação via analytics; compromissos via calculateFutureCommitments agrupado; reconciliação com batches+counts P19/19.1; insights; notificações operacionais; comparação via analyticsDiff; cenários com diferenças objetivas) -> exportReport (CSV por relatório, respeita filtros/casal) + saved_reports (id/couple_id/user_id/name/report_type/filters + RLS; runSavedReport; nunca persiste valores). Cache em _rcache por dashFingerprint.
UI /reports preservada e estendida: presets ano atual/anterior, 13 abas (tudo/resumo/fluxo/categorias/contas/cartões/compromissos/orçamento/metas/planejamento/casal/reconciliação/insights), tipos estendidos, novas seções (comparação, análise de gastos, recorrências, compromissos futuros, planejamento, cenários, reconciliação, insights, notificações), export CSV V3 por relatório, impressão limpa (.print-only + .no-print; PDF via diálogo de impressão), relatórios salvos (salvar/carregar). Sem score/ranking/"melhor"; sem números fictícios; falha isolada por seção (rsec).

## 25. Segurança + Auditoria V3 (P30: hardening transversal, sem IA nova).

Camadas: UI/IA/WhatsApp → contexto autenticado (Auth + sessão local; rate limit login 10/min, reset 5/min) → AuthorizationService (authzContext/canAccessCouple/can*/requireAuthz; owner=member financeiramente) → InputValidationService (valString/valText/valMoney/valPercent/valDate/valEnum/valPagination/valUploadMeta 5MB + extensões + path; texto sempre DADO, nunca instrução; aiSanitize sinaliza jailbreak) → serviço financeiro oficial → persistência (migrations idempotentes; blank()+migrate p/ security_audit_logs/financial_integrity_checks) → auditoria dupla (audit_logs financeira + security_audit_logs sem segredos, IP/UA hasheados, cap 2000).
Isolamento: todas as leituras/escritas filtram couple_id do membership; ids de outro casal lançam erro genérico (sem revelar existência); convites JNT-XXXXXX (31^6, únicos, 7 dias, uso único, máx 2 membros, aceite atômico em JS single-thread). Idempotência: financial_events/automation_jobs/ai_actions/notifications/webhooks por chave; pagamento/settlement/convite duplos rejeitados. Integridade: FinancialIntegrityService valida saldo das contas (inicial+receitas−despesas−/+transfers−pagamentos), soma de parcelas, overpaid, dup pagamento, splits em centavos, plan sem transaction_id; runDiagnostics persiste open/resolve por fingerprint (sem correção destrutiva automática); systemDiagnostics só leitura. IA: só tools allowlisted (15 read + 6 write), schema backend, confirmação + expiração + idempotência, execução via serviços oficiais, rate limit, dados mínimos (view/período). WhatsApp: assinatura HMAC, replay por external_message_id, rate limit, vínculo por código (nunca couple_id por mensagem), confirmação p/ ações financeiras, revogação, phone só hash/mascarado. Cartões: só últimos 4 dígitos. Observabilidade: systemDiagnostics (jobs/imports/reconciliação/faturas/notificações/IA/cache). Recuperação: backup via infraestrutura; pontos críticos = audit_logs + security_audit_logs + integrity checks. Sem áudio/OCR/Open Finance (P31+ seguem Intent→allowlist→authz→confirmação→serviço oficial).

## 26. Entrada por Áudio (P31: só entrada, sem STT externo).

Fluxo: áudio → FinancialAudioService (AUDIO_CONFIG central: provider client-side, 10MB, 120s, mimes, pt-BR, retenção 24h, TTL confirmação 30min, rates 10/20min) → receive (authz+rate+validação; audio_messages com transcript_status/processing_status) → transcribe (providers client-side/local-sim com transcrição explícita; STT nunca inventa; falha = failed sem efeito) → normalize (AudioTranscriptNormalizer: ruído/espaços + palavras-número pt-BR 0-1000 determinísticas; datas/nomes/valores preservados; flag uncertain sem bloquear) → aiProcessMessage idêntico ao texto (message_type audio + audio_message_id; contexto userId/coupleId/view/locale/moeda da sessão) → intent/authz/validação/preview/confirmação via ações IA (idempotência por action_id; duplicada retorna status) → serviço oficial → audit (sem áudio/transcrição em logs; métricas só técnicas). Retenção: audioCleanup expira referência de arquivo, mantém transcrição. WhatsApp: whatsappAudioInbound/whatsapProcessInboundAudio (sem transcrição orienta texto; com transcrição mesma verdade do web). UI /assistant: mic 🎙️ (MediaRecorder + Web Speech pt-BR quando há; upload fallback), permissão só no clique, transcrição visível editável, envio explícito, fallback textual, cartões de confirmação existentes. Correção real aplicada: write com snapshot obsoleto apagava o áudio (releitura antes de marcar processed).

## 27. Entrada por Imagem (P32: só entrada/evidência, sem OCR externo).

Fluxo: imagem → FinancialImageService (IMAGE_CONFIG: provider client-side, 10MB, 4096px, jpeg/png/webp/heic, retenção 24h, TTL 30min, rates 10/15min; tipos receipt/invoice/proof_of_payment/bill/bank_statement/card_statement/transfer_proof/screenshot/unknown) → receive (authz+rate+validação MIME×extensão+tamanho+resolução+assinatura; image_messages com processing/extraction_status) → process (VisionProvider client-side/local-sim com extração explícita; STT/visão nunca inventa; no_data/partial/failed sem efeito) → normalize (ImageExtractionNormalizer: BRL "1.234,56"→1234.56, datas DD/MM/AAAA e "15 de outubro", merchant; PAN→**** **** **** + last4, CPF/CVV redigidos; ausente continua ausente) → aiProcessMessage idêntico ao texto (message_type image + image_message_id; contexto da sessão) → duplicadas (centavos + ±3 dias + merchant normalizado; sugere reconciliar, não duplica) → comparação documento × sistema factual (divergência sugere revisar, não altera) → preview/confirmação via ações IA (idempotência por action_id) → serviço oficial → audit (sem imagem/PAN em logs; métricas técnicas). Boleto/fatura/parcela: só sugestão, nunca pagamento/criação automática. Retenção: imageCleanup expira arquivo, mantém extração. WhatsApp: whatsappImageInbound (mesma verdade; sem extração orienta texto). UI /assistant: 🖼️ (câmera/upload/paste), miniatura, extração visível editável, interpretar → confirmação existente. Correções reais: nome padrão sem extensão quebrava validação no WhatsApp; write obsoleto (lição do P31) evitado com releitura.

## 29. Open Finance (P34: fonte externa somente-leitura, sem pagamentos).

Fluxo: connect (authz + RLS; local-sim conecta na hora; belvo/pluggy retornam erro explícito sem config — sem credencial falsa) → syncAccounts/syncTransactions (upsert idempotente por connection_id+external_id; inválidos pulados e contados; rate 5/min; saldos/valores com sinal bancário preservados) → linkBankAccount (ownership dos dois lados) → importToReconciliation (lote file_type 'openfinance' no formato exato das linhas CSV + analyzeBatch existente; reimport retorna o mesmo lote; vínculo exigido) → preview → confirmAllNew → finalizeBatch → canonical. Sync nunca cria transação; match exato = duplicate (não reimporta). Sem pagamentos/investimentos; sem segredos (credentials_ref sempre nulo; auditoria sem conteúdo sensível). UI em Ajustes (conectar/sincronizar/vincular via prompt/conciliar→detalhe do lote/desconectar com confirmação). Pronto p/ OpenFinanceProvider real sem mudar a verdade interna.

## 31. Open Finance desativado (flag central, reversível, sem provedor).

`OF_FEATURE_ENABLED=false` em `js/db.js` (só código; reativação = trocar p/ true + provedor). Camadas: visibilidade (sem link/card/CTA/texto) → rota (qualquer `/openfinance*` cai no dashboard) → backend (`ofAssertEnabled` em connect/disconnect/sync/import/link/match/resolve/schedule/resync/cursor) → automação (job `skipped/feature_disabled`, sem falso erro) → IA/WhatsApp (resposta simples de indisponibilidade, tools bloqueadas, sem invenção) → notificações (impossíveis sem execução). Tabelas, migrations, RLS, serviços, adapters e testes preservados; CSV/OFX/manual intactos. Correção real no caminho: strings com `í` em Latin-1 no meio do UTF-8 (mojibake visível) normalizadas; varredura de bytes inválidos zerada.

## 32. UX financeira do casal (P37: só apresentação, zero cálculo novo).

Componentes (app.js + css, sem tocar db.js): `coupleMoneySection` (Nosso mês/Seu mês/Mês do parceiro + Quem pagou no período + Responsabilidade acumulada + Divisão em tabela pago/responsabilidade/saldo + Acerto pendente com direção e avatares), `settleDirectionHtml` (avatar→avatar com aria-label textual), `glossaryHtml` (details discreto), `splitBar` (só escala visual). Valores: dashboardCalc.perPerson (período) + settle.people/debt (acumulado), sempre rotulados. /settlements redesenhado (pendente → direção → Registrar acerto → despesas que geraram → histórico com data + Pago; estorno com confirmação não-alarmista); detalhe da despesa com total + pagador + %/fixo. Microcopy colaborativa (Quem pagou/Responsabilidade/Acerto; sem julgamento). Barras e tabelas com roles/aria; CSS responsivo (couple-grid empilha no mobile).

## 33. Gestão do dinheiro (P38: SEPARATE|JOINT, só interpretação, sem reescrever história).

`couples.money_management_mode` (default SEPARATE + backfill p/ existentes; validação backend ∈ {SEPARATE,JOINT}; owner-only; auditoria `money_management_mode_changed` com previous/new). Nenhum cálculo tocado: `settle/dashboardCalc/splits` intactos; `settlementView()` suprime o débito p/ apresentação no JOINT. Gates: insights (sem `settlement_pending`), notifScan (idem), calendário (sem `set:pending`; realizados ficam), tool `settlement_status` + resposta IA/WhatsApp (explicam o conjunto, sem inventar dívida), `getSettlementSummary.mode`. UI: `MoneyManagementModeSelector` em /couple (cards + confirmação + salvando/salvo/erro), `jointMoneySection` no dashboard (totais oficiais + por pessoa como histórico, sem "você deve"), /settlements só-histórico sem CTA, nova despesa JOINT = casal 50/50 com pagador preservado (edição mantém divisão original), detalhe com nota "faz parte do dinheiro do casal". Concorrência = last-write determinístico + auditoria por escrita.

## 30. Open Finance avançado (P35: sync contínua + conciliação, sem pagamentos).

Orquestrador ofSyncNow (lock persistido com expiração e roubo de lock obsoleto; janela lookback 90d; paginação cursor com guardas; resyncPeriod idempotente; rebuildCursor): contas → saldos (snapshots, poda 30) → transações (upsert por connection+external_id; versões em created/updated/posted/cancelled; pending→posted atualiza mesma entidade; posted com valor alterado e vínculo = exceção, sem sobrescrever; cancelled com vínculo = exceção, canônico preservado) → auto-match (score oficial; ≥0.98 + mesma data/conta + sem 2º candidato = link aceito sem criar nada; forte = sugestão; múltiplos/fracos = exceção) → transferências internas detectadas (par ±3d entre contas, nunca receita/despesa) → run registrado → exceções/eventos/notificações APÓS o write (nunca sobrescritos). Erro parcial = completed_with_warnings; fatal = failed + notificação (sem lock preso). calculateBalanceDifference compara externo × interna vinculada (divergência = exceção info, nunca ajuste). Health factual (healthy/attention/reauth/error/revoked). reconciliation_matches estendido (source_type/source_record_id/match_method/auto_reconciled). Central /openfinance com filtros e ações confirmadas; responsabilidade/categoria/splits nunca alterados por match. Correção real: writes intermediários clobberavam exceções/eventos/notificações (flush pós-write).

## 28. Multimodalidade + Documentos (P33: camada única, sem provider externo).

Pipeline: texto/áudio/imagem/documento → FinancialInputOrchestrator (INPUT_CONFIG central; NormalizedInput persistido com idempotency_key por hash de conteúdo; status received→…→completed/failed/cancelled/expired) → validação/extração/normalização por modalidade (DocumentProcessingService p/ PDF: magia 25504446, páginas≤20, sem macros/scripts/links; classificação pelo CONTEÚDO: invoice/bank_statement/bill/payment_proof/receipt/budget/financial_report/unknown) → InputNormalizationService (BRL/datas/merchant; PAN redigido) → MultimodalContextService (merge campo a campo; conflito com values/sources/resolution explícita, nunca silencioso; confiança = min técnico, nunca score) → mmInterpret (texto NLU-compatível dos campos resolvidos; pergunta quando ambíguo) → assistant → authz → preview unificado (origens 📷🎤📄 + evidências) → confirmação → serviço oficial → audit. DocumentComparisonService: match/possible_match/difference/missing_in_system (fatura: doc × outstanding; extrato: linhas × duplicadas). Extrato bancário vira linhas normalizadas p/ reconciliação existente (sem auto-import). Boleto/fatura: só consulta/comparação, nunca pagamento. Áudio p/ campos exige pista monetária ("cada um"/"50%" não é valor). Retenção: cleanup de áudio/imagens/docs/contextos/inputs. WhatsApp doc/imagem/áudio/texto na mesma arquitetura. 20 princípios documentados no código e nos testes.


## 34. Configuracoes como area central (navegacao/UX; zero logica financeira).

Sidebar sem "Casal" (Principal: visao geral/movimentacoes/contas/cartoes/faturas/orcamento/metas; Planejamento: planejamento/calendario/relatorios/insights/notificacoes; Operacional: acertos/recorrentes; Mais: mais/configuracoes). Bottomnav: Inicio, Movimentacoes, +, Contas, Plano, Mais. /settings = hub com 9 secoes (SETTING_SECTIONS) e resumo "Gestao atual" no card Casal. /couple, /profile e /invite redirecionam p/ /settings/couple|profile (padrao openfinance, sem paginas duplicadas); links internos, Mais e avatar atualizados; breadcrumb "Configuracoes > Secao". Subpaginas: pSettingsProfile (Auth.updateProfile + logout + senha via Auth.forgot/reset), pSettingsCouple (info/participantes/rename + convites inline + MoneyManagementModeSelector P38 intacto), pSettingsFinancial (toggles reais via setInsightPreference/INSIGHT_TYPES; sem moeda ficticia), pSettingsAutomation (status+jobs+regras P17 intactos), pSettingsNotifPrefs (prefs por tipo/canal + silencio; /notifications operacional separada), pSettingsWhatsapp (adapter existente), pSettingsAssistant (gerencia conversas ai*; /assistant operacional separado), pSettingsData (ultimos lotes listImportBatches + link /imports), pSettingsPrivacy (senha + listSecurityEvents/listAuditLogs sem segredos + wipe demo). Open Finance: sem link/card/texto em Configuracoes; flag off; tabelas preservadas.
## 35. Subcategorias financeiras (2 niveis; zero logica financeira nova).

Modelo: categories.parent_category_id (NULL = principal). Validacao central (validateCategoryHierarchy/Type): mesmo casal, mesmo tipo, pai ativo e principal, sem ciclo/auto-ref, max 2 niveis, nomes unicos por nivel (normalizeDescription), 2..60 chars. Servicos: create/update/delete/archive (+Sub variants), getCategoryTree/getSubcategories/catParent/catDisplayPath/catTxCount/catGet/findAnalysisEntry. Seeds padrao por pai (Moradia/Alimentacao/Transporte/Saude/Lazer/Casa/Educacao/Pets/Assinaturas/Compras/Salario/Rendimentos) p/ casais novos e backfill idempotente p/ antigos; migrate preenche null. Exclusao segura: com dependencias (tx/orcamento/recorrencia/regras) arquiva em cascata; sem, remove. Transacao usa category_id (pai ou sub). Filtros (listTx/dashboard/analyticsScanTx/calendario/parcelas) incluem filhas do pai; busca casa nomes de categoria/sub. Orcamento: pai soma filhas, sub soma si; totais só de principais (sem dupla contagem); unbudgeted respeita hierarquia. dashboardCalc/byCat/incomeByCat e categoryAnalysis/incomeAnalysis agregam no pai com children p/ drill-down; reports com contagens agregadas e evolucao por sub; export com contexto do pai. Insights: regras de categoria avaliam filhas (titulo "Pai -> Filha"). Learning/regras/imports/IA/WhatsApp herdam subs (suggestCategory, set_category, categoryHint); IA pergunta sub em ambiguidade ("só <pai>" confirma) e usa fronteira de palavra no matching. UI: selects hierarquicos (optgroup), lancamento com Categoria+Subcategoria dependentes, detalhe mostra Categoria/Subcategoria, drill-down no dashboard/relatorios, filtros dependentes (movimentacoes/relatorios/calendario), /settings/categories (arvore, criar/editar/arquivar/excluir/mover, contagens). diagnose com checagens de hierarquia. Open Finance segue invisivel e desativado.
## 36. Marca 2gtr (só apresentação; arquitetura intacta).

Nome exibido: 2gtr (title, meta description, boot, sidebar, onboarding, fallback de rota, document.title "Secao | 2gtr", nomes de CSV exportados). Preservados: namespace window.Juntos, chaves juntos_*, filenames internos, JNT-XXXXXX, rotas/IDs/servicos, textos comuns ("juntos" como palavra). Sem manifest/PWA no projeto (nada a atualizar alem do title/meta). Open Finance segue invisivel e desativado.
## 37. Visual OpenDesign (só CSS + fontes; zero logica).

Transplante do sistema visual do prototipo OpenDesign (C:\Users\Guilherme\Desktop\2gtr\index.html, preservado fora do repo): tokens (verde #0E8F5B/#0A6E46, rosa 2gtr, fundo #F4F7F5, raio 20px, sombras suaves), fontes Inter + Plus Jakarta Sans (com fallbacks), botoes/inputs 12px, linhas de lancamento sem borda com tile, hero verde-escuro (Resultado + Quanto podemos gastar), sidebar clara, bottomnav com pill ativa, FAB com borda, toast pill, marca bicolor 2g/tres + dot rosa. Nenhum HTML gerado pelo app.js foi alterado; nenhuma regra/calculo/banco; Open Finance segue invisivel e desativado.
## 38. Fidelidade ao exemplo (só apresentação; zero logica).

Sidebar com icones SVG de linha + card "Espaco do casal" (paintShell preenche nomes via myCouple); topbar com eyebrow do casal; hero "Saldo de <mes>" + split Receitas/Despesas; donut SVG + legenda (top 6 + Outras) no dashboard; tiles de lancamento com cor deterministica por categoria (catColor); "Ultimos lancamentos / Ver tudo". Correcao real: sidebar aparecia no mobile (faltava display:none base). Nenhum calculo/banco/rota alterado; Open Finance segue invisivel e desativado.
## 39. Logo oficial 2gtr (só apresentação; zero logica).

Marca "2" em fita verde/rosa + "gtr" como SVG vetorial inline (logoMark/brandLockup em app.js, ids de gradiente unicos). Variantes: claro (fundo claro), inv/branco (boot em fundo verde-escuro). Aplicada em: sidebar (icone app + gtr), boot escuro, login, cadastro, recuperacao de senha, onboarding (com tagline "Juntos nas suas finanças."). Favicon via data URI (quadrado verde + "2"). Nenhum calculo/banco/rota alterado; Open Finance segue invisivel e desativado.
## 40. Agenda (compromissos pessoais + casal; zero logica financeira nova).

Entidade agenda_events (couple_id, created_by, owner_user_id, title, description, event_type, visibility, status, start_at/end_at locais, all_day, location, color, category, recurrence_rule, recurrence_end_at, recurrence_parent_id/date, exceptions, timezone, reminder_*). Tipos PERSONAL/COUPLE/REMINDER/APPOINTMENT/COMMITMENT/OTHER; visibilidade PRIVATE/COUPLE com RLS no backend (dono ou casal; outro casal negado). Recorrencia como regra (daily/weekly/biweekly/monthly/yearly/custom + interval + byweekday/bymonthday + end); ocorrencias geradas por janela com caps; escopos single (override/excecao), following (split preservando fim original) e all; cancelamento em cascata. Lembretes via NotificationEngine (tipos agenda_event_created/updated/reminder/cancelled, rota agenda, idempotencia, quiet hours, expiracao). Calendario unificado: fonte agenda dentro de getCalendarEvents (event_type agenda, amount 0, sem somar) + CALENDAR_TYPES + detalhes ag:. IA: intents agenda_query/create/update/cancel_agenda_event, tool agenda_events, parser deterministico de data/hora (ambiguidade de dia-da-semana vira pergunta), preview+confirmacao via ai_actions; WhatsApp herda pipeline. UI: rota /agenda (dia/semana/mes/lista/timeline/ano), form unico reutilizado (dashboard/calendario/FAB), detalhe com escopos, card dashboard por visao, badges com icone+texto (sem cor exclusiva). Auditoria via SecurityAuditService (tipo agenda). Open Finance segue invisivel e desativado.
## 41. Habitos pessoais (rotina privada; zero logica financeira nova).

Entidades habits + habit_completions (dono = autenticado; couple_id so isola). Frequencias daily/weekly/monthly/yearly/specific_days; unidades BOOLEAN/COUNT/AMOUNT/DURATION; categorias pessoais (Financas aqui nao toca dinheiro); sugestoes so preenchem. Recorrencia HabitRecurrenceService (dias previstos, pausas, clamp de mes); streaks sobre ocorrencias previstas (atual/melhor); consistencia expected/completed/pct; conclusao parcial (value>=target) guarda valor real; duplicidade bloqueada por habit+data. Pausa (sem falhas/lembretes, sequencia preservada), arquivo (historico mantido), COMPLETED derivado. Lembretes no NotificationEngine (habit_reminder/due/streak, tom factual, idempotencia, quiet hours). Calendario unificado getUnifiedCalendar (financas+agenda+habitos, amount 0) com toggle no /calendar; /calendar financeiro puro intacto. PersonalAssistantService neutro so-leitura (sem intents). UI: /habits (hoje/semana/evolucao/todos, busca/filtros), /habits/:id (stats, calendario mensal, historico paginado, evoluir), modais (form+sugestoes, registro por unidade, correcao, pausa), mini-card no dashboard, nav Minha vida. Auditoria via SecurityAuditService (tipo habit). Open Finance segue invisivel e desativado.
## 42. Visao Geral / Planner (camada de agregacao; sem fonte propria).

OverviewAggregationService (getOverviewDay/Week/Month, getUpcomingOverview, getOverviewSummary): consome AgendaService + HabitService + servicos financeiros oficiais (listTx p/ dia/semana em escopo do casal, dashboardCalc+visao p/ mes, getCalendarEvents p/ compromissos, moneyMode p/ rotulo). Uma chamada por render, sem cache persistente, sem recalculos entre cards; leitura nunca cria tx. /dashboard vira planner (pDash delega p/ pOverview; dashboard financeiro antigo preservado como pDashLegacy, sem rota). UI: header com saudacao + navegacao temporal (Dia/Semana/Mes, prev/next) + visao (Casal/Eu/Parceiro) + acoes rapidas oficiais; cards Hoje, Proximo compromisso, Compromissos (badges Pessoal/Casal), Habitos checklist (booleano marca direto via recordCompletion/removeCompletion; quantitativo abre modal oficial), Financas do dia/semana/mes (expansivel via details), Compromissos financeiros, Recentes, Timeline; semana com 7 dias clicaveis; mes com evolucao de habitos. Privacidade via servicos (parceiro nao ve PRIVATE nem habitos alheios). CSS: .ov-grid (1col mobile, 2col desktop), .chk, .ov-tl; fix .qa-grid min-width:0.
## 43. Home publica (apresentacao; zero dados reais, zero logica financeira).

Rota publica landing (router PUBLIC+bare, default sem hash, autenticado redireciona p/ app via go; boot cai em #/landing; document.title dedicado). pLanding em app.js: HTML 100% estatico, sem chamadas a servicos, mockups com valores ilustrativos fixos; navegacao por ancora via scrollIntoView (nunca hash, p/ nao acionar o guard) com reduced-motion; menu mobile toggle; CTAs p/ #/register e #/login; juridico como estrutura honesta (em breve, sem paginas inventadas). Secoes: header sticky, hero + mock planner, faixa Organize/Planeje/Cuide, 6 cards, Minha+Nossa vida, SEPARATE/JOINT neutros, Visao Geral planner, 3 passos, grade financeira (12 itens, sem Open Finance/investimentos/integracoes), diferenciais, 4 telas, CTA final, footer. SEO em index.html (title, description, OG; favicon 2gtr mantido). CSS .lp-* (1col mobile, 2/3/4col progressivo; rosa so em detalhes; fix .btn width:100% no header/cta-row; .lp-mock.wide 1col no mobile).