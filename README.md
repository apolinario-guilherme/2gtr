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