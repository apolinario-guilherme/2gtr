# juntos-financas


## Marca 2gtr (só visual, zero logica)
- Telas, titulo, meta description e exports com 2gtr; identificadores internos intactos.
- Testes (22/22 PASS): marca nas telas publicas e principais, namespace preservado, regressao (acerto/dashboard/orcamento/export/diagnose/auth), OF off. Telas desktop/mobile. Console limpo.
## Visual novo OpenDesign (só aparência, zero logica)
- Tokens, fontes, botoes, lancamentos, hero verde, sidebar clara, marca bicolor.
- Testes (15/15 PASS): telas principais, hero verde via estilo computado, regressao (acerto/dashboard/diagnose), OF off. Telas desktop/mobile. Console limpo.
## Fidelidade ao exemplo (só visual, zero logica)
- Sidebar SVG + card do casal, topbar com casal, hero e donut no dashboard, tiles por categoria, bug mobile da sidebar corrigido.
- Testes (22/22 PASS): formato do exemplo, valores intactos (acerto/dashboard/agregacao), regressao, OF off, diagnose. Telas desktop/mobile. Console limpo.
## Logo oficial 2gtr (só visual, zero logica)
- SVG vetorial (fita verde/rosa + gtr) com variante invertida; sidebar, boot, auth e onboarding; favicon data URI.
- Testes (16/16 PASS): marca nas telas, valores intactos, regressao, OF off, diagnose. Telas desktop/mobile. Console limpo.
## Agenda (compromissos; sem nova logica financeira)
- Entidade propria + RLS, recorrencia com escopos, lembretes no NotificationEngine, calendario unificado, IA/WhatsApp, 6 visoes, dashboard por visao.
- Testes (98/98 PASS): CRUD+RLS, validacao, recorrencia (expansao/scopes/cancelamento), filtros/busca/stats/ano, notificacoes (4 tipos+scan+idempotencia+deeplink), calendario, IA (intents+confirmacao+ambiguidade), WhatsApp, auditoria, regressao financeira, 6 visoes, form/detalhe, dashboard/calendario/FAB/Mais/assistente, OF off, diagnose. Telas desktop/mobile. Console limpo.
## Habitos pessoais (rotina privada, sem logica financeira)
- Fonte propria + RLS por dono, recorrencia/streaks/consistencia, pausa/arquivo, lembretes no NotificationEngine, calendario unificado com toggle, PersonalAssistantService neutro.
- Testes (101/101 PASS): CRUD+privacidade, validacao, registros (parcial/duplicidade/correcao/desfazer), streaks, recorrencia, pausa/arquivo, calendario/evolucao/stats, notificacoes (3 tipos+scan+streak+deeplink), calendario unificado, PA service, regressao financeira, 6 telas + form + detalhe + dashboard + FAB + Mais + privacidade por URL, OF off, diagnose. Desktop/mobile. Console limpo.
## Visao Geral / Planner (camada de agregacao, sem fonte propria)
- OverviewAggregationService + /dashboard como planner (Dia/Semana/Mes, checklist de habitos, timeline, financas por periodo, respeito a SEPARATE/JOINT e privacidade). Dashboard financeiro antigo preservado sem rota.
- Testes (73/73 PASS): agregacao dia/semana/mes, upcoming, leitura nao cria tx, privacidade (servico + UI), checklist marcar/desmarcar, navegacao temporal, 10 rotas de regressao, JOINT/SEPARATE, OF off, diagnose. Desktop/mobile (DOM sem overflow; corte do screenshot e artefato da largura minima do headless). Console limpo.
## Home publica (apresentacao, sem dados reais)
- Rota publica landing como / (default), autenticado segue p/ app, login/cadastro intactos, guard impede dados privados, CTAs conectados, SEO basico, menu mobile, sem Open Finance/investimentos.
- Testes (57/57 PASS): todas as secoes, h1 unico, shell bare, CTAs register/login, scroll sem mudar hash, register+login funcionais, redirect autenticado, zero vazamento (tx/habito/nome/conta), guard, 9 rotas de regressao, OF off, diagnose, sem overflow no piso mensuravel (477<492; corte do screenshot e artefato da largura minima do headless; botoes com width:auto e grids 1col no mobile). Console limpo.
## Area de Membros (estrutura, sem regras novas)
- Publica x privada separadas; retorno pos-login; 404/403; robots dinamico; sidebar em grupos + colapso; bottomnav 5 itens SVG; hub Financas; menu do avatar; settings em grupos + preferencias + gestao do dinheiro; avatar validado; logout sem vazamento; offline; OF oculto.
- Testes (74/74 PASS): publicas, guard+pending, login valido/invalido, logout, IDOR (habito/agenda/fatura/tx/outro casal), owner x member, grupos/aria-current/bottomnav/hubs, menu, colapso, 404/403, settings+avatar+prefs, troca de usuario, regressao (acerto, fatura, orcamento, meta, agenda, habitos, notif, automacao, assistente), OF off, diagnose, sem overflow. Desktop/mobile. Console limpo.
## Assistente WhatsApp como interface do ecossistema (mesmo nucleo)
- Overview, agenda datada, habitos (safe-write + confirmacao), aporte em meta, planejamento, notificacoes, navegacao, modo do dinheiro e status WhatsApp via servicos oficiais; SEPARATE/JOINT respeitados; edicao de rascunho; expiracao; idempotencia; metricas; multimodal no mesmo pipeline.
- Testes (104/104 PASS): intents novos, fluxos web e WhatsApp (criar/editar/confirmar/cancelar), privacidade entre membros, financas e regressao, seguranca (unlinked/revogado/duplicata/expirado/injecao/IDOR/arquivo/tool negada), multimodal, coerencia web x canal, OF off, diagnose. Console limpo.
## Home v2 (estilo da referencia, conteudo honesto)
- Hero casal + mock Visao do casal, confianca, 3 cards com mocks CSS, Minha/Nossa vida, modos neutros, planner, passos, grade financeira, CTA escuro, footer real. Sem funcionalidades inventadas.
- Testes (43/43 PASS). Desktop/mobile (piso 492; corte do screenshot e artefato do headless). Console limpo.
## Login em painel duplo (estilo da referencia)
- Painel verde + formulario creme, olho de senha acessivel, mesmo fluxo e IDs. Ajuda aponta p/ inicio (sem pagina ficticia).
- Testes (21/21 PASS). Desktop/mobile. Console limpo.