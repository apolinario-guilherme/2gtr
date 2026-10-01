/* 2gtr — telas.
   Etapas 1–3 preservadas. Etapa 4: dashboard central (só leitura de dados reais). */
(function (J) {
  var ob = { step: 1, choice: null };
  var txF = { search: '', month: '', from: '', to: '', type: '', category_id: '', payer_user_id: '', shared: '', account_id: '' };
  var txShown = 30;
  var editingId = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, act) {
    var t = document.createElement('div'); t.className = 'toast';
    t.textContent = m; document.getElementById('toasts').appendChild(t);
    if (act && act.label && act.fn) {
      var b = document.createElement('button'); b.className = 'link'; b.style.color = '#fff'; b.textContent = act.label;
      b.onclick = function () { try { act.fn(); } catch (e) {} t.remove(); };
      t.appendChild(document.createTextNode(' ')); t.appendChild(b);
    }
    setTimeout(function () { t.remove(); }, act ? 6000 : 3200);
  }
  function err(e) { return '<div class="alert">' + esc(e.message || 'Algo não saiu como esperado. Tente de novo.') + '</div>'; }
  function BRL(v) { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function dmy(iso) { var s = String(iso || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split('-').reverse().join('/') : s; }
  function lock(btn) { if (btn) btn.disabled = true; }
  function unlock(btn) { if (btn) btn.disabled = false; }
  function today() { return new Date().toISOString().slice(0, 10); }
  function thisMonth() { return new Date().toISOString().slice(0, 7); }
  function here() { return (location.hash.replace('#/', '') || 'dashboard').split('?')[0]; }
  function goAndOpen(me, hash, route, fn) {
    if (here() === route) { render(route); fn(); }
    else { location.hash = hash; setTimeout(fn, 80); }
  }
  function ph(icon, titulo, texto) {
    return '<div class="card empty"><div class="ico">' + icon + '</div><h2>' + titulo + '</h2><p class="muted">' + texto + '</p><p><span class="pill">Disponível na próxima etapa</span></p><a class="btn ghost" href="#/dashboard" style="text-decoration:none;text-align:center">Voltar ao início</a></div>';
  }

  /* Marca 2gtr (só apresentação): fita "2" verde/rosa + "gtr". Variantes:
     claro (fundo claro), inv (fundo escuro). Ids de gradiente únicos. */
  var __logoN = 0;
  function logoMark(size, icon) {
    __logoN++;
    var g = 'lg' + __logoN;
    var bg = icon ? '<rect x="2" y="2" width="60" height="60" rx="16" fill="#FFFFFF"/>' : '';
    return '<svg class="appicon" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14A86F"/><stop offset="1" stop-color="#0A6E46"/></linearGradient></defs>' + bg +
      '<path d="M20 21 C20 14 27 10 34 10 C42 10 47 15 47 22 C47 30 34 36 26 44 L46 44" fill="none" stroke="url(#' + g + ')" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M36 29 L27 39" fill="none" stroke="#ffffff" stroke-width="12.5" stroke-linecap="round"/>' +
      '<path d="M36 29 L27 39" fill="none" stroke="#E85D9A" stroke-width="9" stroke-linecap="round"/></svg>';
  }
  function brandLockup(o) {
    o = o || {};
    var inv = !!o.inv;
    return '<div class="brandlock' + (inv ? ' inv' : '') + '">' + logoMark(o.size || 56, true) +
      '<div class="bw">gtr</div>' + (o.tag === false ? '' : '<div class="tag">Juntos nas suas finanças.</div>') + '</div>';
  }
  function render(route) {
    var v = document.getElementById('view');
    var me = J.Auth.current();
    document.getElementById('shell').classList.remove('hidden');
    closeModal();
    var parts = String(route || 'dashboard').split('/');
    var fn = { landing: pLanding, privacy: pPrivacy, terms: pTerms, finance: pFinanceHub, forbidden: pForbidden, notfound: pNotFound, login: pLogin, register: pRegister, 'forgot-password': pForgot, auth: (parts[1] === 'callback' ? pAuthCallback : pNotFound), onboarding: pOnboarding, dashboard: pDash, transactions: pTrans, accounts: (parts[1] ? function (vv, mm) { pAccountDetail(vv, mm, parts[1]); } : pAccounts), cards: (parts[1] ? function (vv, mm) { pCardDetail(vv, mm, parts[1]); } : pCards), installments: pInstallments, invoices: (parts[1] ? function (vv, mm) { pInvoiceDetail(vv, mm, parts[1]); } : pInvoices), imports: (parts[1] ? function (vv, mm) { pImportDetail(vv, mm, parts[1]); } : pImports), insights: pInsights, assistant: pAssistant, notifications: pNotifications, planning: (parts[1] ? function (vv, mm) { pPlanningDetail(vv, mm, parts[1]); } : pPlanning), agenda: pAgenda, tasks: pTasks, lists: (parts[1] ? function (vv, mm) { pListDetail(vv, mm, parts[1]); } : pLists), routines: (parts[1] ? function (vv, mm) { pRoutineDetail(vv, mm, parts[1]); } : pRoutines), projects: (parts[1] ? function (vv, mm) { pProjectDetail(vv, mm, parts[1]); } : pProjects), habits: (parts[1] ? function (vv, mm) { pHabitDetail(vv, mm, parts[1]); } : pHabits), budget: pBudget, goals: pGoals, settlements: pSettle, recurring: pRecurring, calendar: pCalendar, reports: pReports, more: pMore, inbox: pInbox, week: pWeek, 'monthly-review': function (vv, mm) { return pMonthlyReview(vv, mm, parts[1], parts[2]); }, settings: (parts[1] ? function (vv, mm) { pSettingsSub(vv, mm, parts[1]); } : pSettings), profile: function (vv, mm) { location.hash = '#/settings/profile'; return pSettingsProfile(vv, mm); }, couple: function (vv, mm) { location.hash = '#/settings/couple'; return pSettingsCouple(vv, mm); }, invite: function (vv, mm) { location.hash = '#/settings/couple'; return pSettingsCouple(vv, mm); }, openfinance: function (vv, mm) { location.hash = '#/dashboard'; return pDash(vv, mm); } }[parts[0]] || pNotFound;
    try { fn(v, me); } catch (e) {
      if (/acesso negado/i.test(e.message || '')) { pForbidden(v); return; }
      v.innerHTML = err(e) + '<button class="btn" id="retry">Tentar novamente</button>';
      document.getElementById('retry').onclick = function () { render(route); };
    }
    try {
      var bell = document.getElementById('notif-bell'), cnt = document.getElementById('notif-count');
      if (bell && me) {
        var n = J.DB.notifUnreadCount(me.id);
        bell.style.display = '';
        cnt.textContent = n ? ' ' + n : '';
      } else if (bell) bell.style.display = 'none';
    } catch (e2) { /* badge nunca quebra a página */ }
    try { paintShell(me); } catch (e3) { /* shell nunca quebra a página */ }
    try {
      var ibl = document.querySelector('#side-nav a[data-r="inbox"] .nl');
      if (ibl && me) {
        var ibq = 0;
        try { ibq = J.DB.getInboxSummary(me.id).pending || 0; } catch (eix) {}
        ibl.textContent = 'Inbox' + (ibq > 0 ? ' ' + ibq : '');
      }
    } catch (e4) { /* badge nunca quebra a página */ }
    window.scrollTo(0, 0);
  }
  /* Moldura estática = MemberLayout (só apresentação: nomes vindos dos serviços). */
  function avatarHtml(me, size) {
    if (me && me.avatar) return '<img class="avatar-img" src="' + me.avatar + '" alt="" style="width:' + size + 'px;height:' + size + 'px">';
    return esc(((me && me.nome) || '?').charAt(0).toUpperCase());
  }
  function paintShell(me) {
    var eb = document.getElementById('couple-eyebrow');
    var cn = document.getElementById('couple-card-name');
    var cm = document.getElementById('couple-card-members');
    var mn = document.getElementById('me-card-name');
    var mm = document.getElementById('me-card-mail');
    var ma = document.getElementById('me-card-av');
    var ab = document.getElementById('avatar-btn');
    if (!me) { if (eb) eb.textContent = ''; return; }
    var ctx = J.DB.myCouple(me.id);
    var cname = (ctx.couple && ctx.couple.name) || '';
    if (eb) eb.textContent = cname;
    if (cn) cn.textContent = cname || 'Seu casal';
    if (cm) cm.textContent = ctx.users.map(function (u) { return u.nome.split(' ')[0]; }).join(' & ');
    if (mn) mn.textContent = me.nome.split(' ')[0];
    if (mm) mm.textContent = me.email;
    if (ma) { ma.innerHTML = avatarHtml(me, 28); ma.setAttribute('aria-label', me.nome); }
    if (ab) { ab.innerHTML = avatarHtml(me, 34); ab.setAttribute('aria-label', 'Menu de ' + me.nome); }
    try {
      var sbe = document.getElementById('sidebar');
      if (sbe) {
        var col = localStorage.getItem('juntos_sb_v1') === '1';
        sbe.classList.toggle('collapsed', col);
        var tg = document.getElementById('sb-toggle');
        if (tg) { tg.textContent = col ? '›' : '‹'; tg.setAttribute('aria-expanded', col ? 'false' : 'true'); tg.setAttribute('aria-label', col ? 'Expandir menu' : 'Recolher menu'); }
        document.querySelectorAll('#side-nav a').forEach(function (a) {
          var lbl = a.querySelector('.nl');
          a.setAttribute('title', lbl ? lbl.textContent : '');
        });
      }
    } catch (e) {}
  }
  function bindUserMenu() {
    var ab = document.getElementById('avatar-btn');
    if (!ab || ab.dataset.um) return;
    ab.dataset.um = '1';
    ab.setAttribute('aria-haspopup', 'menu');
    ab.setAttribute('aria-expanded', 'false');
    ab.onclick = function () {
      var me = J.Auth.current();
      if (!me) { location.hash = '#/login'; return; }
      var old = document.getElementById('user-menu');
      if (old) { old.remove(); ab.setAttribute('aria-expanded', 'false'); return; }
      var ctx = J.Ctx.get();
      var m = document.createElement('div');
      m.id = 'user-menu'; m.setAttribute('role', 'menu');
      m.innerHTML = '<div class="um-head"><b>' + esc(me.nome) + '</b><br><span class="muted">' + esc(me.email) + '</span>' +
        (ctx.couple ? '<br><span class="muted">Casal: ' + esc(ctx.couple.name) + '</span>' : '') + '</div>' +
        '<a href="#/settings/profile" role="menuitem">👤 Meu perfil</a>' +
        '<a href="#/settings" role="menuitem">⚙️ Configurações</a>' +
        '<button id="um-out" role="menuitem">Sair</button>';
      document.getElementById('shell').appendChild(m);
      ab.setAttribute('aria-expanded', 'true');
      m.querySelectorAll('a').forEach(function (a) { a.onclick = function () { m.remove(); ab.setAttribute('aria-expanded', 'false'); ab.focus(); }; });
      m.querySelector('#um-out').onclick = function () { m.remove(); J.Auth.logout(); };
      document.addEventListener('keydown', function esc2(e) {
        if (e.key === 'Escape' && document.getElementById('user-menu')) { document.getElementById('user-menu').remove(); ab.setAttribute('aria-expanded', 'false'); ab.focus(); document.removeEventListener('keydown', esc2); }
      });
    };
  }

  /* ============ HOME PÚBLICA (só apresentação; zero dados reais) ============
     Página institucional em HTML estático: nenhum serviço, nenhuma leitura
     de dados do usuário. Mockups com valores ilustrativos fixos. */
  function pLanding(v) {
    var rm = false;
    try { rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    v.innerHTML =
    '<div class="lp2">' +
    '<header class="lp2-head"><div class="lp-wrap lp2-head-in">' +
      '<a class="lp-brand" href="#/landing" aria-label="2gtr — início">' + logoMark(30) + '<strong>2gtr</strong></a>' +
      '<nav class="lp-nav" id="lp-nav" aria-label="Navegação da página"><button data-ls="como-funciona">Como funciona</button><button data-ls="funcionalidades">Recursos</button><button data-ls="para-quem">Para quem é</button></nav>' +
      '<div class="lp-head-cta"><button class="btn sm lp2-btn-dark" data-lgo="#/login">Entrar</button>' +
      '<button class="lp-burger" id="lp-burger" aria-label="Abrir menu" aria-expanded="false" aria-controls="lp-nav">☰</button></div>' +
    '</div></header>' +
    '<main>' +
    '<section class="lp2-hero" aria-labelledby="lp-h1"><div class="lp-wrap lp2-hero-in">' +
      '<div><p class="lp2-eyebrow">Dinheiro e rotina, juntos</p>' +
      '<h1 id="lp-h1">Mais parceria.<br><span class="tx-terra">Menos coisas para lembrar.</span></h1>' +
      '<p class="lp-lead">Organizem as finanças e os combinados da vida a dois em um só lugar.</p>' +
      '<div class="lp-cta-row"><button class="btn lp2-btn-dark" data-lgo="#/register">Começar agora <span aria-hidden="true">→</span></button><button class="btn ghost lp2-btn-play" data-ls="como-funciona"><span aria-hidden="true">▷</span> Veja como funciona</button></div>' +
      '<p class="lp2-script" aria-hidden="true">Vida a dois funciona melhor juntando. ♡</p></div>' +
      '<div class="lp2-dash" role="img" aria-label="Exemplo da Visão do casal no 2gtr com saldo do mês, gastos e tarefas compartilhadas. Dados demonstrativos.">' +
        '<div class="lp2-dash-top"><span></span><span></span><span></span><em>Dados demonstrativos</em></div>' +
        '<div class="lp2-dash-body">' +
        '<div class="lp2-dash-side"><b>2gtr</b><span class="on">Início</span><span>Finanças</span><span>Rotina</span><span>Objetivos</span><small>❤️ Vocês</small></div>' +
        '<div class="lp2-dash-main"><div class="lp2-dash-head"><b>Visão do casal</b><span class="lp2-month">‹ Este mês ›</span></div>' +
        '<p class="muted">Saldo do mês</p><h3>R$ 3.240</h3><p class="pos">↑ 12% em relação ao mês anterior</p>' +
        '<div class="lp2-io"><span>↑ Entradas<br><b>R$ 7.200</b></span><span>↓ Saídas<br><b>R$ 3.960</b></span></div>' +
        '<div class="lp2-cols"><div><b>Gastos do mês</b><div class="lp2-bars" aria-hidden="true"><i style="height:38%"></i><i style="height:62%"></i><i style="height:88%" class="t"></i><i style="height:45%"></i><i style="height:30%"></i></div></div>' +
        '<div><b>Tarefas compartilhadas</b><p>☑ Pagar o aluguel <small>Hoje</small></p><p>☑ Comprar mercado <small>Hoje</small></p><p>☐ Lavar a roupa <small>Amanhã</small></p></div></div>' +
        '</div></div>' +
      '</div>' +
    '</div></section>' +
    '<section class="lp2-trust" aria-label="Diferenciais"><div class="lp-wrap lp2-trust-in">' +
      '<div><b>✔ Clareza nas finanças</b><p>Saibam para onde o dinheiro vai.</p></div>' +
      '<div><b>✔ Combinados à vista</b><p>Menos dúvidas, mais tranquilidade.</p></div>' +
      '<div><b>✔ Objetivos compartilhados</b><p>Alinhem o hoje e o que vem depois.</p></div>' +
    '</div></section>' +
    '<section class="lp2-feats" id="funcionalidades" aria-labelledby="lp-f"><div class="lp-wrap">' +
      '<h2 id="lp-f">Um espaço para o que vocês <span class="tx-terra">constroem juntos.</span></h2>' +
      '<p class="lp-sub">Finanças, rotina e objetivos, tudo em sintonia para uma vida a dois mais leve.</p>' +
      '<div class="lp2-cards">' +
      '<article class="lp2-fcard"><div class="lp2-shot fin" role="img" aria-label="Exemplo de resumo financeiro com entradas, saídas e gastos por categoria. Dados demonstrativos.">' +
        '<b>Resumo financeiro <span>Este mês</span></b><div class="lp2-io"><span>↑ Entradas<br><b>R$ 7.200</b></span><span>↓ Saídas<br><b>R$ 3.960</b></span></div>' +
        '<div class="lp2-donut" aria-hidden="true"></div><ul><li>Moradia 38%</li><li>Alimentação 24%</li><li>Transporte 16%</li><li>Lazer 12%</li><li>Outros 10%</li></ul></div>' +
        '<h3>Finanças</h3><p>Acompanhem receitas, despesas e dividam contas de forma simples e transparente.</p></article>' +
      '<article class="lp2-fcard"><div class="lp2-shot rot" role="img" aria-label="Exemplo da rotina compartilhada com tarefas de cada um. Dados demonstrativos.">' +
        '<b>Nossa rotina <span>+</span></b><div class="lp2-tabs" aria-hidden="true"><span class="on">Todas</span><span>Minhas</span><span>Do meu par</span></div>' +
        '<p>☑ Comprar mercado <small>Hoje</small></p><p>☐ Lavar a roupa <small>Amanhã</small></p><p>☐ Levar o pet ao veterinário <small>Sáb, 17/08</small></p><p>☐ Limpar a casa <small>Dom, 18/08</small></p></div>' +
        '<h3>Rotina</h3><p>Organizem as tarefas do dia a dia e mantenham os combinados sempre à vista.</p></article>' +
      '<article class="lp2-fcard"><div class="lp2-shot obj" role="img" aria-label="Exemplo de objetivos com progresso. Dados demonstrativos.">' +
        '<b>Nossos objetivos <span>+</span></b>' +
        '<p><i class="th g1"></i>Viagem dos sonhos<br><small>R$ 6.800 de R$ 10.000</small></p><div class="bar"><div style="width:68%"></div></div>' +
        '<p><i class="th g2"></i>Entrada do apê<br><small>R$ 25.000 de R$ 60.000</small></p><div class="bar"><div style="width:42%"></div></div>' +
        '<p><i class="th g3"></i>Reserva de emergência<br><small>R$ 5.400 de R$ 20.000</small></p><div class="bar"><div style="width:27%"></div></div></div>' +
        '<h3>Objetivos</h3><p>Planejem conquistas a curto e longo prazo e acompanhem a evolução lado a lado.</p></article>' +
      '</div></div></section>' +
    '<section class="lp-sec alt" id="para-quem" aria-labelledby="lp-pq"><div class="lp-wrap">' +
      '<h2 id="lp-pq">Sua vida. Seu relacionamento. Suas finanças.</h2>' +
      '<p class="lp-sub">O 2gtr foi pensado para acompanhar tanto o que é seu quanto o que vocês constroem juntos.</p>' +
      '<div class="lp-duo"><article class="lp-card"><h3>👤 Minha vida</h3><ul><li>Agenda pessoal</li><li>Hábitos</li><li>Metas pessoais</li><li>Organização pessoal</li><li>Minhas movimentações</li></ul></article>' +
      '<article class="lp-card"><h3>❤️ Nossa vida</h3><ul><li>Finanças do casal</li><li>Compromissos compartilhados</li><li>Metas do casal</li><li>Despesas compartilhadas</li><li>Planejamento conjunto</li></ul></article></div>' +
      '<p class="lp-note">As duas áreas convivem no mesmo aplicativo — e informações pessoais permanecem visíveis só para você.</p>' +
    '</div></section>' +
    '<section class="lp-sec" aria-labelledby="lp-mm"><div class="lp-wrap">' +
      '<h2 id="lp-mm">Cada casal funciona de um jeito.</h2>' +
      '<p class="lp-sub">Por isso, o 2gtr permite organizar o dinheiro de acordo com a realidade de vocês.</p>' +
      '<div class="lp-duo"><article class="lp-card"><h3>💑 Dinheiro separado</h3><p>Cada um mantém seu dinheiro e vocês fazem acertos quando necessário.</p></article>' +
      '<article class="lp-card"><h3>💚 Tudo junto</h3><p>As receitas e despesas dos dois fazem parte do dinheiro do casal, sem acertos internos por quem pagou.</p></article></div>' +
    '</div></section>' +
    '<section class="lp-sec alt" aria-labelledby="lp-dia"><div class="lp-wrap">' +
      '<h2 id="lp-dia">Comece o dia sabendo o que importa.</h2>' +
      '<p class="lp-sub">Uma visão simples do seu dia, da sua semana e do seu mês — sem transformar sua rotina em uma tela cheia de informações.</p>' +
      '<div class="lp-mock wide" role="img" aria-label="Exemplo da Visão Geral com cards de hoje, compromissos, hábitos e finanças">' +
        '<div class="lp-mock-card"><b>Hoje</b><p>3 compromissos • 4 hábitos • 2 movimentações</p></div>' +
        '<div class="lp-mock-card"><b>📅 Próximos</b><p>19:30 Jantar ❤️</p></div>' +
        '<div class="lp-mock-card"><b>🌱 Hábitos 3/5</b><div class="bar"><div style="width:60%"></div></div></div>' +
        '<div class="lp-mock-card"><b>💰 Hoje</b><p>+ R$ 500 • − R$ 120</p></div>' +
      '</div>' +
    '</div></section>' +
    '<section class="lp2-steps" id="como-funciona" aria-labelledby="lp-cf"><div class="lp-wrap lp2-steps-in">' +
      '<div class="lp2-art" role="img" aria-label="Ilustração de um casal organizando a vida juntos"></div>' +
      '<div><h2 id="lp-cf">Começar juntos é <span class="tx-terra">simples.</span></h2>' +
      '<p class="lp-sub">Em poucos passos, vocês já organizam o que realmente importa.</p>' +
      '<div class="lp2-step-row">' +
      '<div><span class="lp2-num" aria-hidden="true">1</span><h3>Crie sua conta</h3><p>É rápido e seguro.</p></div><span class="lp2-chev" aria-hidden="true">›</span>' +
      '<div><span class="lp2-num" aria-hidden="true">2</span><h3>Convide seu par</h3><p>Mandem o convite e conectem suas contas.</p></div><span class="lp2-chev" aria-hidden="true">›</span>' +
      '<div><span class="lp2-num" aria-hidden="true">3</span><h3>Organizem juntos</h3><p>Personalizem, adicionem combinados e comecem a usar.</p></div>' +
      '</div></div></div></section>' +
    '<section class="lp-sec alt" aria-labelledby="lp-fin"><div class="lp-wrap">' +
      '<h2 id="lp-fin">Tudo o que você precisa para cuidar do seu dinheiro.</h2>' +
      '<ul class="lp-tags"><li>Movimentações</li><li>Contas</li><li>Cartões</li><li>Faturas</li><li>Compras parceladas</li><li>Orçamento</li><li>Metas</li><li>Planejamento</li><li>Acertos</li><li>Relatórios</li><li>Insights</li><li>Conciliação</li></ul>' +
    '</div></section>' +
    '<section class="lp-sec" aria-labelledby="lp-dif"><div class="lp-wrap">' +
      '<h2 id="lp-dif">Por que o 2gtr?</h2><div class="lp-grid">' +
      '<article class="lp-card"><h3>🧩 Um só lugar</h3><p>Menos aplicativos para controlar diferentes partes da sua vida.</p></article>' +
      '<article class="lp-card"><h3>❤️ Feito para duas pessoas</h3><p>Organize o que é seu e o que é de vocês.</p></article>' +
      '<article class="lp-card"><h3>✨ Visão simples</h3><p>Informação suficiente para ajudar, sem poluir sua rotina.</p></article>' +
      '<article class="lp-card"><h3>🔮 Planejamento real</h3><p>Veja o que aconteceu, o que está acontecendo e o que está por vir.</p></article>' +
      '<article class="lp-card"><h3>🔒 Privacidade</h3><p>Cada informação disponível somente para quem tem permissão.</p></article>' +
      '<article class="lp-card"><h3>🌱 Evolução contínua</h3><p>Estruturado para crescer junto com as suas necessidades.</p></article>' +
      '</div></div></section>' +
    '<section class="lp2-cta" aria-labelledby="lp-cta"><div class="lp-wrap">' +
      '<p class="lp2-eyebrow light">Dinheiro e rotina, juntos</p>' +
      '<h2 id="lp-cta">Mais espaço para o que importa.</h2>' +
      '<p class="lp-sub">Menos preocupações no dia a dia e mais tempo para viver o que vocês constroem juntos.</p>' +
      '<button class="btn lp2-btn-white" data-lgo="#/register">Começar agora <span aria-hidden="true">→</span></button>' +
      '<p><a href="#/login">Já tem uma conta? Entrar</a></p>' +
    '</div></section>' +
    '</main>' +
    '<footer class="lp2-foot"><div class="lp-wrap lp2-foot-in">' +
      '<a class="lp-brand" href="#/landing" aria-label="2gtr — início">' + logoMark(26) + '<strong>2gtr</strong></a>' +
      '<nav aria-label="Links"><button data-ls="funcionalidades">Recursos</button><a href="#/privacy">Privacidade</a><a href="#/terms">Termos</a><a href="#/login">Entrar</a></nav>' +
    '</div><p class="lp-copy">© 2gtr</p></footer>' +
    '</div>';
    Array.prototype.forEach.call(v.querySelectorAll('[data-ls]'), function (b) {
      b.onclick = function () {
        var el = document.getElementById(b.getAttribute('data-ls'));
        if (el) el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' });
        var nav = document.getElementById('lp-nav');
        if (nav) nav.classList.remove('open');
        var bg = document.getElementById('lp-burger');
        if (bg) bg.setAttribute('aria-expanded', 'false');
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-lgo]'), function (b) {
      b.onclick = function () { location.hash = b.getAttribute('data-lgo'); };
    });
    var burger = document.getElementById('lp-burger');
    if (burger) burger.onclick = function () {
      var nav = document.getElementById('lp-nav');
      var open = nav && nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
  }
  /* ============ ÁREA DE MEMBROS: estados, públicas legais, hub e erros ============
     emptyState/Skeleton/ErrorState reutilizáveis; privacidade/termos sem
     juridiquês inventado; hub Finanças só organiza links existentes. */
  function emptyState(icon, title, desc, ctaHtml) {
    return '<div class="card empty"><div class="ico" aria-hidden="true">' + icon + '</div><h2>' + title + '</h2><p class="muted">' + desc + '</p>' + (ctaHtml || '') + '</div>';
  }
  function pNotFound(v) {
    v.innerHTML = emptyState('🔍', 'Não encontramos esta página.', 'O endereço pode ter mudado ou não existe.', '<p><a class="btn" href="#/dashboard" style="text-decoration:none;text-align:center">Ir para a Visão Geral</a></p><p class="center"><a href="#/landing">Voltar para o início</a></p>');
  }
  function pForbidden(v) {
    v.innerHTML = emptyState('🔒', 'Você não tem acesso a esta página.', 'Fale com quem criou o casal se precisar de outra permissão.', '<p><a class="btn" href="#/dashboard" style="text-decoration:none;text-align:center">Voltar para a Visão Geral</a></p>');
  }
  function pPrivacy(v) {
    v.innerHTML = '<div class="lp"><header class="lp-head"><div class="lp-wrap lp-head-in"><a class="lp-brand" href="#/landing" aria-label="2gtr — início">' + logoMark(30) + '<strong>2gtr</strong></a><div class="lp-head-cta"><a class="link" href="#/login">Entrar</a><button class="btn sm lp-btn" data-lgo="#/register">Começar agora</button></div></div></header>' +
      '<main><section class="lp-sec"><div class="lp-wrap"><h1>Privacidade</h1><p class="lp-sub">Resumo de como o 2gtr trata seus dados nesta etapa do produto.</p>' +
      '<div class="card"><b>Seus dados</b><p class="muted">Conta (nome e e-mail), dados financeiros que você registra, agenda, hábitos e preferências. Usamos o mínimo necessário para o app funcionar.</p></div>' +
      '<div class="card"><b>O que é seu e o que é do casal</b><p class="muted">Hábitos e compromissos pessoais ficam visíveis só para você. Informações do casal (despesas compartilhadas, compromissos do casal, metas conjuntas) são visíveis para os dois membros.</p></div>' +
      '<div class="card"><b>Onde ficam</b><p class="muted">Nesta etapa de demonstração, os dados ficam salvos neste navegador. Nada é exibido publicamente e nenhuma informação privada aparece na Home.</p></div>' +
      '<p class="muted">Documento completo em breve.</p><p><a class="btn ghost" href="#/landing" style="text-decoration:none;text-align:center">Voltar para o início</a></p>' +
      '</div></section></main><footer class="lp-foot"><p class="lp-copy">© 2gtr</p></footer></div>';
    bindPublicCtas(v);
  }
  function pTerms(v) {
    v.innerHTML = '<div class="lp"><header class="lp-head"><div class="lp-wrap lp-head-in"><a class="lp-brand" href="#/landing" aria-label="2gtr — início">' + logoMark(30) + '<strong>2gtr</strong></a><div class="lp-head-cta"><a class="link" href="#/login">Entrar</a><button class="btn sm lp-btn" data-lgo="#/register">Começar agora</button></div></div></header>' +
      '<main><section class="lp-sec"><div class="lp-wrap"><h1>Termos de uso</h1><p class="lp-sub">Regras básicas para usar o 2gtr.</p>' +
      '<div class="card"><b>Uso pessoal</b><p class="muted">Use sua conta com responsabilidade e mantenha sua senha em segurança. O 2gtr organiza informações — não presta consultoria financeira, médica ou jurídica.</p></div>' +
      '<div class="card"><b>Seus registros</b><p class="muted">Você é responsável pelos dados que cadastra. Confira valores importantes antes de tomar decisões.</p></div>' +
      '<p class="muted">Documento completo em breve.</p><p><a class="btn ghost" href="#/landing" style="text-decoration:none;text-align:center">Voltar para o início</a></p>' +
      '</div></section></main><footer class="lp-foot"><p class="lp-copy">© 2gtr</p></footer></div>';
    bindPublicCtas(v);
  }
  function bindPublicCtas(v) {
    Array.prototype.forEach.call(v.querySelectorAll('[data-lgo]'), function (b) {
      b.onclick = function () { location.hash = b.getAttribute('data-lgo'); };
    });
  }
  function pFinanceHub(v, me) {
    var items = [
      ['transactions', '💸', 'Movimentações', 'Receitas e despesas'],
      ['accounts', '🏦', 'Contas', 'Saldos e saldos por pessoa'],
      ['cards', '💳', 'Cartões', 'Limites e uso'],
      ['invoices', '🧾', 'Faturas', 'Vencimentos e pagamentos'],
      ['installments', '🗓️', 'Parceladas', 'Compras em parcelas'],
      ['budget', '📊', 'Orçamento', 'Limites por categoria'],
      ['goals', '🎯', 'Metas', 'Objetivos e progresso'],
      ['planning', '🗺️', 'Planejamento', 'Planejado x realizado'],
      ['settlements', '⚖️', 'Acertos', 'Compensações do casal'],
      ['recurring', '🔁', 'Recorrentes', 'Contas que se repetem'],
      ['reports', '📈', 'Relatórios', 'Análises do período']
    ];
    v.innerHTML = '<div class="card"><h1>Finanças</h1><p class="muted">Tudo do dinheiro em um só lugar.</p></div>' +
      '<div class="menu">' + items.map(function (x) {
        return '<a href="#/' + x[0] + '">' + x[1] + ' ' + x[2] + ' <span>›</span></a>';
      }).join('') + '</div>';
  }
  /* ---------- AUTH (etapa 1, preservado) ---------- */
  /* ---------- AUTH: login em painel duplo (só apresentação; mesmo fluxo) ---------- */
  function pLogin(v) {
    v.innerHTML = '<div class="lg">' +
      '<section class="lg-art" aria-label="A vida a dois, mais organizada">' +
        '<div class="lg-art-in"><a class="lg-brand" href="#/landing" aria-label="2gtr — início">' + logoMark(34) + '<strong>2gtr</strong></a>' +
        '<h1>A vida <span class="tx-terra">a dois,</span><br>mais organizada.</h1>' +
        '<p>Um espaço para cuidar das finanças e dos planos que vocês constroem juntos.</p>' +
        '<figure class="lg-frame" aria-hidden="true"><span>Juntos hoje,<br>sempre mais longe</span><b>♥</b></figure></div>' +
      '</section>' +
      '<section class="lg-form" aria-labelledby="lg-h1">' +
        '<p class="lg-back"><a href="#/landing">← Voltar ao início</a></p>' +
        '<h1 id="lg-h1">Bom ter você de volta.</h1>' +
        '<p class="muted">Entre para acessar seu espaço no 2gtr.</p>' +
        '<div id="e"></div>' +
        '<label for="f-em">E-mail</label><input id="f-em" type="email" autocomplete="email" placeholder="voce@exemplo.com">' +
        '<label for="f-pw">Senha</label><div class="lg-pw"><input id="f-pw" type="password" autocomplete="current-password"><button type="button" id="pw-eye" aria-label="Mostrar senha" aria-pressed="false">👁</button></div>' +
        '<p class="lg-forgot"><a href="#/forgot-password">Esqueci minha senha</a></p>' +
        '<button class="btn lg-enter" id="go">Entrar</button>' +
        '<div id="soc-zone"></div>' +
        '<p class="center muted">Ainda não tem uma conta? <a href="#/register"><b>Criar conta</b></a></p>' +
        '<p class="lg-legal"><a href="#/privacy">Privacidade</a> • <a href="#/terms">Termos</a> • <a href="#/landing">Ajuda</a></p>' +
      '</section>' +
    '</div>';
    document.getElementById('go').onclick = function () {
      try { var me = J.Auth.login(document.getElementById('f-em').value, document.getElementById('f-pw').value); J.Router.go(me); toast('Bem-vindo de volta!'); }
      catch (e) { document.getElementById('e').innerHTML = err(e); }
    };
    var eye = document.getElementById('pw-eye');
    eye.onclick = function () {
      var pw = document.getElementById('f-pw');
      var show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      eye.textContent = show ? '🙈' : '👁';
      eye.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
      eye.setAttribute('aria-pressed', show ? 'true' : 'false');
      pw.focus();
    };
    socRender(document.getElementById('soc-zone'));
  }
  /* ---------- LOGIN SOCIAL (botões + consentimento + callback) ---------- */
  function socIcon(p) {
    if (p === 'google') return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.5h6c-.3 1.4-1.2 2.5-2.4 3.2v2.7h3.9c2.3-2.1 3.1-5 3.1-8.1z"/><path fill="#34A853" d="M12 23c3.2 0 5.9-1.1 7.9-2.9l-3.9-2.7c-1.1.7-2.5 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v2.8C3.4 20.5 7.4 23 12 23z"/><path fill="#FBBC05" d="M5.4 13.6c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.2H1.4C.5 7.6 0 9.3 0 11.3s.5 3.7 1.4 5.1l4-2.8z"/><path fill="#EA4335" d="M12 5.5c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 2.1 15.2 1 12 1 7.4 1 3.4 3.5 1.4 7.4l4 2.8c.9-2.7 3.5-4.7 6.6-4.7z"/></svg>';
    if (p === 'facebook') return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 1-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z"/></svg>';
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M17.1 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.3-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.8-1.5 0-2.9.9-3.6 2.2-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-0.7s2.3.7 3 0c-1-1.6-1.6-3.8-1.6-3.9 0-.1 2-1.2 2.7-3.1zM14.2 5.4c.6-.7 1-1.7.9-2.7-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.8 1 .1 2.2-.6 2.9-1.5z"/></svg>';
  }
  function socRender(zone) {
    if (!zone) return;
    var provs;
    try { provs = J.Auth.socialProviders(); }
    catch (e) { provs = []; }
    if (!provs.length) return;
    zone.innerHTML = '<div class="soc-div" aria-hidden="true"><span>ou</span></div>' +
      provs.map(function (p) {
        return '<button class="btn soc' + (p.enabled ? '' : ' off') + '" data-soc="' + p.id + '" style="max-width:100%"' + (p.enabled ? '' : ' title="Disponível após configuração (js/config.js)"') + '>' + socIcon(p.id) + '<span>' + p.label + '</span></button>';
      }).join('');
    Array.prototype.forEach.call(zone.querySelectorAll('[data-soc]'), function (b) {
      b.onclick = function () { doSocial(b.dataset.soc, b); };
    });
  }
  function doSocial(provider, btn) {
    var errBox = document.getElementById('e');
    function fail(msg) { if (errBox) errBox.innerHTML = '<div class="alert">' + esc(msg) + '</div>'; else toast(msg); }
    lock(btn);
    var fn = provider === 'google' ? J.Auth.socialGoogle : provider === 'facebook' ? J.Auth.socialFacebook : J.Auth.socialApple;
    fn().then(function (profile) {
      var r = J.Auth.socialLogin(profile);
      if (r.status === 'ok') {
        if (r.isNew) { location.hash = '#/onboarding'; toast('Conta criada com ' + (provider === 'google' ? 'Google' : provider === 'facebook' ? 'Facebook' : 'Apple') + '! Vamos configurar.'); }
        else { J.Router.go(r.user); toast('Bem-vindo de volta!'); }
      } else {
        openSocialLink(r);
      }
      unlock(btn);
    }).catch(function (e) {
      unlock(btn);
      var msg = J.Auth.socialErrorMessage(provider, e);
      fail(msg);
    });
  }
  function openSocialLink(r) {
    var pname = r.profile.provider === 'google' ? 'Google' : r.profile.provider === 'facebook' ? 'Facebook' : 'Apple';
    var h = '<h2>Vincular conta</h2><div id="me"></div>' +
      '<p>Encontramos sua conta <b>' + esc(r.user.nome) + '</b> (' + esc(r.user.email) + ').</p>' +
      '<p class="muted">Quer vincular este login ' + esc(pname) + ' a ela? Depois disso você entra com qualquer um dos dois.</p>';
    if (r.needsPassword) h += '<label for="f-lpw">Senha atual (confirma que a conta é sua)</label><input id="f-lpw" type="password" autocomplete="current-password">';
    h += '<div class="row"><button class="btn" id="sv">Vincular e entrar</button><button class="btn ghost" id="cl">Voltar</button></div>';
    modalShell(h);
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var pw = r.needsPassword ? (document.getElementById('f-lpw') || {}).value : null;
        var u = J.Auth.socialLinkConfirm(r.user.id, r.profile, pw);
        closeModal(); J.Router.go(u); toast('Conta vinculada! Bem-vindo de volta!');
      } catch (e2) {
        document.getElementById('me').innerHTML = err(e2); unlock(btn);
      }
    };
  }
  function pAuthCallback(v) {
    var h = String(location.hash || '');
    var q = h.indexOf('?') >= 0 ? h.slice(h.indexOf('?') + 1) : '';
    var params = {};
    q.split('&').forEach(function (kv) {
      var ix = kv.indexOf('=');
      if (ix > 0) params[decodeURIComponent(kv.slice(0, ix))] = decodeURIComponent(kv.slice(ix + 1).replace(/\+/g, ' '));
    });
    var msg = null;
    if (params.error === 'access_denied' || params.error === 'user_cancelled_authorize' || params.error === 'user_cancelled_login') msg = 'Login cancelado. Tente novamente quando quiser.';
    else if (params.error) msg = 'Autorização negada pelo provedor (' + params.error + '). Tente novamente ou use outro método.';
    v.innerHTML = '<div class="card center" style="padding:40px 24px"><h1>Login social</h1>' +
      (msg ? '<div class="alert">' + esc(msg) + '</div>' : '<p class="muted">Retorno inválido. Volte ao login e tente novamente.</p>') +
      '<p><a class="btn" href="#/login" style="max-width:240px">Voltar ao login</a></p></div>';
  }
  function pRegister(v) {
    v.innerHTML = '<div class="card">' + brandLockup({ size: 56 }) + '<h1>Criar conta ❤️</h1><p class="muted">Leva menos de 1 minuto.</p><div id="e"></div><label>Seu nome</label><input id="f-nm"><label>E-mail</label><input id="f-em" type="email"><label>Senha (6+ caracteres)</label><input id="f-pw" type="password"><button class="btn" id="go">Criar conta</button><p class="center"><a href="#/login">Já tenho conta</a></p></div>';
    document.getElementById('go').onclick = function () {
      try { var me = J.Auth.register(document.getElementById('f-nm').value, document.getElementById('f-em').value, document.getElementById('f-pw').value); location.hash = '#/onboarding'; toast('Conta criada! Vamos configurar.'); }
      catch (e) { document.getElementById('e').innerHTML = err(e); }
    };
  }
  function pForgot(v) {
    v.innerHTML = '<div class="card">' + brandLockup({ size: 48 }) + '<h1>Recuperar senha</h1><p class="muted">Geramos um código de 6 dígitos (nesta etapa, sem e-mail — anote o código).</p><div id="e"></div><div id="s1"><label>E-mail</label><input id="f-em" type="email"><button class="btn" id="g1">Gerar código</button></div><div id="s2" class="hidden"><div class="code" id="code"></div><label>Código</label><input id="f-cd" inputmode="numeric"><label>Nova senha</label><input id="f-np" type="password"><button class="btn" id="g2">Definir nova senha</button></div><p class="center"><a href="#/login">Voltar</a></p></div>';
    var email = '';
    document.getElementById('g1').onclick = function () {
      try { email = document.getElementById('f-em').value; var c = J.Auth.forgot(email); document.getElementById('s1').classList.add('hidden'); document.getElementById('s2').classList.remove('hidden'); document.getElementById('code').textContent = c; toast('Código gerado. Anote com carinho.'); }
      catch (e) { document.getElementById('e').innerHTML = err(e); }
    };
    document.getElementById('g2').onclick = function () {
      try { var me = J.Auth.reset(email, document.getElementById('f-cd').value, document.getElementById('f-np').value); J.Router.go(me); toast('Senha atualizada!'); }
      catch (e) { document.getElementById('e').innerHTML = err(e); }
    };
  }

  /* ---------- ONBOARDING (etapa 1, preservado) ---------- */
  function pOnboarding(v, me) {
    if (ob.step === 1) {
      v.innerHTML = '<div class="card center" style="padding:40px 24px">' + brandLockup({ size: 72 }) + '<h1>Bem-vindo ao 2gtr</h1><p class="muted">Organize as finanças de vocês de forma simples e transparente.</p><button class="btn" id="go">Começar</button></div>';
      document.getElementById('go').onclick = function () { ob.step = 2; render('onboarding'); };
    } else if (!ob.choice) {
      v.innerHTML = '<div class="card"><h1>Como você quer começar?</h1><div id="e"></div><button class="opt" id="c1">🏠 <b>Sou o primeiro do casal</b><br><span class="muted">Criar o espaço do casal e convidar depois</span></button><button class="opt" id="c2">✉️ <b>Tenho um convite</b><br><span class="muted">Entrar com o código JNT-XXXXXX</span></button></div>';
      document.getElementById('c1').onclick = function () { ob.choice = 'first'; render('onboarding'); };
      document.getElementById('c2').onclick = function () { ob.choice = 'invite'; render('onboarding'); };
    } else if (ob.choice === 'first') {
      v.innerHTML = '<div class="card"><h1>Seu espaço do casal</h1><div id="e"></div><label>Nome do casal</label><input id="f-cp" placeholder="Ex: Ana & Bruno"><label>Nome do parceiro (opcional)</label><input id="f-pt" placeholder="Ex: Bruno"><button class="btn" id="go">Criar nosso espaço</button><button class="btn ghost" id="bk">Voltar</button></div>';
      document.getElementById('bk').onclick = function () { ob.choice = null; render('onboarding'); };
      document.getElementById('go').onclick = function () {
        try {
          var n = document.getElementById('f-cp').value.trim() || (me.nome + ' & Parceiro');
          J.DB.createCouple(me.id, n); ob = { step: 1, choice: null }; location.hash = '#/dashboard'; toast('Espaço criado! Convide seu amor. 💌');
        } catch (e) { document.getElementById('e').innerHTML = err(e); }
      };
    } else {
      v.innerHTML = '<div class="card"><h1>Entrar com convite</h1><p class="muted">Peça o código para quem criou o espaço.</p><div id="e"></div><label>Código do convite</label><input id="f-cd" placeholder="JNT-XXXXXX" style="text-transform:uppercase"><button class="btn" id="go">Entrar no casal</button><button class="btn ghost" id="bk">Voltar</button></div>';
      document.getElementById('bk').onclick = function () { ob.choice = null; render('onboarding'); };
      document.getElementById('go').onclick = function () {
        try { J.DB.acceptInvite(me.id, document.getElementById('f-cd').value); ob = { step: 1, choice: null }; location.hash = '#/dashboard'; toast('Vocês estão juntos! ❤️'); }
        catch (e) { document.getElementById('e').innerHTML = err(e); }
      };
    }
  }

  /* ---------- DASHBOARD ---------- */
  /* ============ ETAPA 4: DASHBOARD ============ */
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var dash = { preset: 'month', month: '', cFrom: '', cTo: '', vision: 'couple', account: '', card: '', category: '', updatedAt: null, col: {} };
  try {
    var _dp = JSON.parse(localStorage.getItem('juntos_dash_v3') || '{}');
    ['preset', 'vision', 'account', 'card', 'category'].forEach(function (k) { if (_dp[k] != null) dash[k] = _dp[k]; });
    if (_dp.col) dash.col = _dp.col;
  } catch (e) {}
  function dashPersist() {
    try { localStorage.setItem('juntos_dash_v3', JSON.stringify({ preset: dash.preset, vision: dash.vision, account: dash.account, card: dash.card, category: dash.category, col: dash.col })); } catch (e) {}
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function monthLabel(ym) { return cap(MESES[parseInt(ym.slice(5, 7), 10) - 1]) + ' ' + ym.slice(0, 4); }
  function monthShort(ym) { return ym.slice(5, 7) + '/' + ym.slice(2, 4); }
  function dashRange() {
    if (!dash.month) dash.month = thisMonth();
    var sh = J.DB.shiftMonth;
    if (dash.preset === 'prev') { var p = sh(dash.month, -1); return { from: p, to: p, single: true }; }
    if (dash.preset === 'next30') { var c0 = thisMonth(); return { from: c0, to: sh(c0, 1), single: false, future: true }; }
    if (dash.preset === 'next3') { var c1 = thisMonth(); return { from: c1, to: sh(c1, 2), single: false, future: true }; }
    if (dash.preset === 'last3') return { from: sh(dash.month, -2), to: dash.month, single: false };
    if (dash.preset === 'last6') return { from: sh(dash.month, -5), to: dash.month, single: false };
    if (dash.preset === 'last12') return { from: sh(dash.month, -11), to: dash.month, single: false };
    if (dash.preset === 'custom' && dash.cFrom && dash.cTo) {
      var a = dash.cFrom < dash.cTo ? dash.cFrom : dash.cTo, b = dash.cFrom < dash.cTo ? dash.cTo : dash.cFrom;
      return { from: a, to: b, single: a === b };
    }
    return { from: dash.month, to: dash.month, single: true };
  }
  function rangeLabel(r) { return r.single ? monthLabel(r.from) : monthLabel(r.from) + ' – ' + monthLabel(r.to); }
  function dashFilterOpt() {
    return { vision: dash.vision, preset: dash.preset, month: dash.month, cFrom: dash.cFrom, cTo: dash.cTo, account_id: dash.account || undefined, credit_card_id: dash.card || undefined, category_id: dash.category || undefined };
  }
  function fmtPct(v) { return (v > 0 ? '+' : '') + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'; }
  function firstShort(me, uid) { return J.DB.userName(me.id, uid).replace(' (você)', '').split(' ')[0]; }
  function goTx(f) {
    var r = dashRange();
    txF.search = ''; txF.type = (f && f.type) || ''; txF.category_id = ''; txF.payer_user_id = (f && f.payer) || ''; txF.shared = ''; txF.account_id = (f && f.account) || '';
    if (r.single) { txF.month = r.from; txF.from = ''; txF.to = ''; }
    else { txF.month = ''; txF.from = r.from; txF.to = r.to; }
    location.hash = '#/transactions';
  }
  function txRow(me, t) {
    var pal = t.type === 'expense' ? catColor(t.category_id) : null;
    var tile = pal ? ' style="background:' + pal[0] + ';color:' + pal[1] + '"' : '';
    return '<button class="tx" data-id="' + t.id + '"><span class="tx-ic"' + tile + '>' + (t.type === 'income' ? '💰' : esc((J.DB.all().categories.find(function (c) { return c.id === t.category_id; }) || { icon: '🧾' }).icon)) + '</span>' +
      '<span class="tx-mid"><b>' + esc(t.description) + '</b><small>' + esc(t.date.split('-').reverse().join('/')) + ' • ' + esc(J.DB.catName(me.id, t.category_id)) + ' • ' + esc(J.DB.userName(me.id, t.payer_user_id)) + (t.is_shared ? ' • 🤝' : ' • 👤') + (t.credit_card_id ? ' • 💳' : '') + (t.needs_review ? ' • 👀 revisar' : '') + '</small></span>' +
      '<b class="' + (t.type === 'income' ? 'pos' : 'neg') + '">' + (t.type === 'income' ? '+' : '−') + ' ' + BRL(t.amount) + '</b></button>';
  }
  function txNoun(n) { return n + (n === 1 ? ' transação' : ' transações'); }
  function accDinheiroCard(me, accS) {
    if (!accS.activeAccounts) return '';
    return '<div class="card"><b>🏦 Dinheiro nas contas</b><h2>' + BRL(accS.totalBalance) + '</h2><p class="muted">' +
      J.DB.memberIds(me.id).map(function (u) { return esc(firstShort(me, u)) + ' ' + BRL(accS.individual[u] || 0); }).join(' • ') +
      ' • Casal ' + BRL(accS.jointBalance) + '<br>Dinheiro registrado nas contas. Não é quanto podem gastar.</p><p><a href="#/accounts">Ver contas ›</a> • <a href="#/accounts" id="d-tr">Transferir ›</a></p></div>';
  }
  function spendCard(avail) {
    return '<button class="card hero spend" id="d-spend"><span class="muted">Quanto podemos gastar?</span><h1>' + BRL(avail.available) + '</h1><span class="muted">Toque para ver como calculamos ›</span></button>';
  }
  function bindSpend(v, avail) {
    var b = v.querySelector ? v.querySelector('#d-spend') : document.getElementById('d-spend');
    if (!b) return;
    b.onclick = function () {
      modalShell('<h2>Como calculamos?</h2><p>Receitas do período<br><b class="pos">' + BRL(avail.income) + '</b></p><p>Despesas realizadas<br><b class="neg">' + BRL(avail.expense) + '</b></p><p>Disponível<br><h1>' + BRL(avail.available) + '</h1></p><p class="muted">Este valor representa o saldo disponível com base nas receitas e despesas registradas no período. Não representa dinheiro em conta, pois o app não tem integração bancária.</p><button class="btn" id="cl">Entendi</button>');
      document.getElementById('cl').onclick = closeModal;
    };
  }
  function diffBlock(label, cur, prev) {
    var diff = Math.round((cur - prev) * 100) / 100;
    var pct = prev ? (diff / prev * 100) : null;
    var txt = diff === 0 ? 'Igual ao mês anterior.' : BRL(Math.abs(diff)) + (diff < 0 ? ' a menos' : ' a mais') + ' que no mês anterior.';
    return '<div class="card"><b>' + label + '</b><p class="muted">Este mês: <b>' + BRL(cur) + '</b> • Anterior: ' + BRL(prev) + '</p><p>Diferença: <b class="' + (diff > 0 ? 'pos' : diff < 0 ? 'neg' : '') + '">' + BRL(diff) + '</b>' + (pct == null ? '' : ' (' + fmtPct(Math.round(pct * 100) / 100) + ')') + '<br><span class="muted">' + txt + '</span></p></div>';
  }

  /* ============ PROMPT 37: UX FINANCEIRA DO CASAL ============
     Só apresentação. Todos os valores vêm dos serviços oficiais
     (dashboardCalc, settle, getSplits); o frontend nunca recalcula.
     Escopos rotulados: "no período" (dashboardCalc) vs "acumulado das
     compartilhadas" (settle). Barras são escala visual, não cálculo. */
  function personName(me, uid) { return uid === me.id ? 'Você' : firstShort(me, uid); }
  function personAvatar(uid, name) {
    return '<span class="avatar-sm" role="img" aria-label="' + esc(name) + '">' + esc(String(name || '?').charAt(0).toUpperCase()) + '</span>';
  }
  function paidOf(pp) { return Math.round(((pp.indivPaid || 0) + (pp.sharedPaid || 0)) * 100) / 100; }
  /* ============ PROMPT 38: TUDO JUNTO (só apresentação) ============
     Agregados oficiais (dashboardCalc + available); sem responsabilidade
     individual, sem acerto, sem "quem deve". Quem pagou/recebeu é histórico. */
  function jointMoneySection(me, r, d, eng, title) {
    var av = { available: 0 };
    try { av = J.DB.calculateAvailableToSpend(me.id, { from: r.from, to: r.to, vision: dash.vision }); } catch (e) {}
    var s = '<div class="card"><b>💑 ' + esc(dash.vision === 'couple' ? 'Dinheiro do casal' : title) + '</b><p class="muted">Receitas e despesas dos dois • ' + esc(rangeLabel(r)) + '</p>';
    s += '<p>Receitas <b class="pos">' + BRL(d.income) + '</b> • Despesas <b class="neg">' + BRL(d.expense) + '</b><br>Resultado <b>' + BRL(d.balance) + '</b> • Disponível <b>' + BRL(av.available) + '</b></p></div>';
    s += '<div class="card"><b>Receitas do casal</b>' + d.perPerson.map(function (p) {
      return '<p>' + personAvatar(p.user_id, personName(me, p.user_id)) + ' ' + esc(personName(me, p.user_id)) + ' — <b>' + BRL(p.recv || 0) + '</b></p>';
    }).join('') + '<p>Total: <b class="pos">' + BRL(d.income) + '</b></p></div>';
    s += '<div class="card"><b>Despesas do casal</b>' + d.perPerson.map(function (p) {
      return '<p>' + personAvatar(p.user_id, personName(me, p.user_id)) + ' ' + esc(personName(me, p.user_id)) + ' — <b>' + BRL(paidOf(p)) + '</b> <span class="muted">• pago por ' + esc(personName(me, p.user_id)) + '</span></p>';
    }).join('') + '<p>Total: <b class="neg">' + BRL(d.expense) + '</b></p>' +
      '<p class="muted">Quem pagou continua registrado no histórico. No modo Tudo junto, a diferença entre vocês não gera acerto.</p></div>';
    s += '<div class="card"><b>⚖️ Acertos</b><p class="muted">No modo Tudo junto, novas despesas não geram acertos entre vocês.' +
      (J.DB.listSettlements(me.id).length ? ' Acertos anteriores continuam no histórico.' : '') + '</p><p><a href="#/settlements">Ver acertos ›</a></p></div>';
    return s;
  }
  function coupleSplitRows(me, d, eng) {
    var byUid = {};
    eng.people.forEach(function (p) { byUid[p.user_id] = p; });
    return d.perPerson.map(function (pp) {
      var o = byUid[pp.user_id] || { paid: 0, owed: 0, net: 0 };
      return { user_id: pp.user_id, name: personName(me, pp.user_id), paidPeriod: paidOf(pp), paidShared: o.paid, owed: o.owed, net: o.net };
    });
  }
  function splitBar(val, max, label) {
    var w = max > 0 ? Math.max(2, Math.round(val / max * 100)) : 0;
    return '<div class="hbar" role="img" aria-label="' + esc(label + ': ' + val) + '"><span class="hl">' + esc(label) + '</span><div class="ht"><div style="width:' + w + '%"></div></div><span class="hv">' + BRL(val) + '</span></div>';
  }
  function settleDirectionHtml(me, debt) {
    var fn = personName(me, debt.from), tn = personName(me, debt.to);
    return '<p class="settle-dir" aria-label="' + esc(fn + ' repassa ' + BRL(debt.amount) + ' para ' + tn) + '">' +
      personAvatar(debt.from, fn) + ' <span aria-hidden="true">→</span> ' + personAvatar(debt.to, tn) +
      '<br><b>' + esc(fn) + ' → ' + esc(tn) + '</b><br><strong>' + BRL(debt.amount) + '</strong></p>';
  }
  function glossaryHtml() {
    return '<details class="muted"><summary>Quem pagou, responsabilidade e acerto?</summary>' +
      '<p><b>Quem pagou</b>: quanto cada pessoa desembolsou.<br><b>Responsabilidade</b>: quanto cabia a cada pessoa nas despesas compartilhadas.<br><b>Acerto</b>: diferença que ainda precisa ser compensada entre vocês.</p></details>';
  }
  function coupleMoneySection(me, r, d, eng) {
    var names = { couple: 'Nosso mês', me: 'Seu mês', partner: 'Mês do parceiro' };
    var title = dash.vision === 'me' ? names.me : dash.vision === 'partner' ? names.partner : names.couple;
    if (J.DB.moneyMode(me.id) === 'JOINT') return jointMoneySection(me, r, d, eng, title);
    var rows = coupleSplitRows(me, d, eng);
    var s = '<div class="card"><b>💑 ' + title + '</b><p class="muted">Como estão divididas as despesas entre vocês • ' + esc(rangeLabel(r)) + '</p>';
    s += '<p>Entradas <b class="pos">' + BRL(d.income) + '</b> • Despesas <b class="neg">' + BRL(d.expense) + '</b> • Resultado <b>' + BRL(d.balance) + '</b><br>Despesas compartilhadas (acumulado): <b>' + BRL(eng.sharedTotal) + '</b> em ' + eng.sharedCount + (eng.sharedCount === 1 ? ' despesa' : ' despesas') + '</p></div>';
    if (!eng.sharedCount) {
      return s + '<div class="card empty"><div class="ico">🤝</div><h2>Nenhuma despesa compartilhada</h2><p class="muted">As despesas do casal aparecerão aqui quando vocês registrarem gastos compartilhados.</p><button class="btn" data-qa="tx">Adicionar despesa</button></div>';
    }
    var maxPaid = Math.max.apply(null, rows.map(function (x) { return x.paidPeriod; }).concat([0.01]));
    var maxOwed = Math.max.apply(null, rows.map(function (x) { return x.owed; }).concat([0.01]));
    s += '<div class="card"><b>Quem pagou</b> <span class="muted">• no período</span>' +
      rows.map(function (x) { return splitBar(x.paidPeriod, maxPaid, x.name); }).join('') +
      '<p class="muted">Quanto cada pessoa desembolsou. Quem pagou mais não necessariamente deve receber — veja a responsabilidade.</p></div>';
    s += '<div class="card"><b>Responsabilidade</b> <span class="muted">• quanto cabia a cada um (acumulado)</span>' +
      rows.map(function (x) { return splitBar(x.owed, maxOwed, x.name); }).join('') + '</div>';
    s += '<div class="card"><b>Divisão do casal</b><div class="couple-grid" role="table" aria-label="Divisão das despesas">' +
      '<div class="cg-head" role="row"><span></span><span><b>Pagou</b> <span class="muted">(período)</span></span><span><b>Responsabilidade</b> <span class="muted">(acumulado)</span></span><span><b>Saldo</b></span></div>' +
      rows.map(function (x) {
        return '<div class="cg-row" role="row"><span>' + personAvatar(x.user_id, x.name) + ' <b>' + esc(x.name) + '</b></span><span>' + BRL(x.paidPeriod) + '</span><span>' + BRL(x.owed) + '</span><span><b class="' + (x.net > 0 ? 'pos' : x.net < 0 ? 'neg' : '') + '">' + BRL(x.net) + '</b></span></div>';
      }).join('') + '</div>' + glossaryHtml() + '</div>';
    if (eng.debt) {
      s += '<div class="card"><b>⚖️ Acerto pendente</b>' + settleDirectionHtml(me, eng.debt) +
        '<p><a href="#/settlements">Ver acertos ›</a></p></div>';
    } else {
      s += '<div class="card"><b>⚖️ Acertos</b><p class="muted">Tudo certo por aqui. Não há acertos pendentes entre vocês neste período.</p><p><a href="#/settlements">Ver acertos ›</a></p></div>';
    }
    return s;
  }
  function pDash(v, me) { return pOverview(v, me); }
  function pDashLegacy(v, me) {
    var ctx = J.DB.myCouple(me.id);
    var solo = ctx.members.length < 2;
    var names = ctx.users.map(function (u) { return esc(u.nome); }).join(' & ') || esc(ctx.couple && ctx.couple.name);
    var partnerId = J.DB.memberIds(me.id).filter(function (x) { return x !== me.id; })[0] || null;
    var r = dashRange();
    var vMe = esc(me.nome.split(' ')[0]), vPa = partnerId ? esc(firstShort(me, partnerId)) : 'Parceiro';

    var hour = new Date().getHours();
    var greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    var accs = J.DB.listAccounts(me.id, 'all'), cards = J.DB.listCards(me.id, 'all'), cats = J.DB.myCategories(me.id, '');
    var unread = 0;
    try { unread = J.DB.notifUnreadCount(me.id); } catch (e) {}
    var html = '<div class="card"><p class="muted" style="margin:0">' + greet + ', ' + esc(names) + ' 👋</p>';
    html += '<div class="per-row">';
    if (dash.preset !== 'custom') html += '<button class="pnav" id="p-prev" aria-label="Período anterior">‹</button>';
    html += '<strong id="p-label">' + esc(rangeLabel(r)) + '</strong>';
    if (dash.preset !== 'custom') html += '<button class="pnav" id="p-next" aria-label="Próximo período">›</button>';
    html += '</div><div class="row"><select id="p-preset" aria-label="Período"><option value="month"' + (dash.preset === 'month' ? ' selected' : '') + '>Este mês</option><option value="prev"' + (dash.preset === 'prev' ? ' selected' : '') + '>Mês anterior</option><option value="next30"' + (dash.preset === 'next30' ? ' selected' : '') + '>Próximos 30 dias</option><option value="next3"' + (dash.preset === 'next3' ? ' selected' : '') + '>Próximos 3 meses</option><option value="last3"' + (dash.preset === 'last3' ? ' selected' : '') + '>Últimos 3 meses</option><option value="last6"' + (dash.preset === 'last6' ? ' selected' : '') + '>Últimos 6 meses</option><option value="last12"' + (dash.preset === 'last12' ? ' selected' : '') + '>Últimos 12 meses</option><option value="custom"' + (dash.preset === 'custom' ? ' selected' : '') + '>Personalizado</option></select>';
    html += '<button class="btn ghost" id="d-refresh">Atualizar</button></div>';
    if (dash.preset === 'custom') html += '<div class="row"><input type="month" id="p-cf" value="' + esc(dash.cFrom) + '" aria-label="De"><input type="month" id="p-ct" value="' + esc(dash.cTo) + '" aria-label="Até"></div>';
    html += '<div class="row"><select id="p-acc" aria-label="Conta"><option value="">Todas as contas</option>' + accs.map(function (a) { return '<option value="' + a.id + '"' + (dash.account === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select>';
    html += '<select id="p-card" aria-label="Cartão"><option value="">Todos os cartões</option>' + cards.map(function (a) { return '<option value="' + a.id + '"' + (dash.card === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></div>';
    html += '<div class="row"><select id="p-cat" aria-label="Categoria"><option value="">Todas as categorias</option>' + cats.map(function (a) { return '<option value="' + a.id + '"' + (dash.category === a.id ? ' selected' : '') + '>' + esc(a.icon + ' ' + a.name) + '</option>'; }).join('') + '</select></div>';
    html += '<div class="seg" role="group" aria-label="Visão"><button data-vv="couple" class="' + (dash.vision === 'couple' ? 'on' : '') + '">Casal</button><button data-vv="me" class="' + (dash.vision === 'me' ? 'on' : '') + '">' + vMe + '</button><button data-vv="partner" class="' + (dash.vision === 'partner' ? 'on' : '') + '">' + vPa + '</button></div>';
    html += '<p class="muted"><a href="#/notifications">🔔 Notificações' + (unread ? ' (' + unread + ' não lidas)' : '') + ' ›</a> • <a href="#/calendar">📅 Calendário ›</a> • <a href="#/planning">🗺️ Planejamento ›</a> • <a href="#/reports">📈 Relatórios ›</a>' + (dash.updatedAt ? '<br>Atualizado ' + esc(dash.updatedAt) : '') + '</p>';
    if (solo) html += '<div class="alert">Falta 1 pessoa aqui. <a href="#/settings/couple">Convidar parceiro</a></div>';
    html += '</div>';

    if (dash.vision === 'partner' && !partnerId) {
      v.innerHTML = html + '<div class="card empty"><div class="ico">👤</div><h2>Visão do parceiro</h2><p class="muted">Seu amor ainda não entrou no casal.</p><a class="btn" href="#/settings/couple" style="text-decoration:none;text-align:center">Convidar</a></div>';
      bindDashChrome(v, me); return;
    }

    var d = J.DB.dashboardCalc(me.id, { from: r.from, to: r.to, vision: dash.vision, account_id: dash.account || undefined, credit_card_id: dash.card || undefined, category_id: dash.category || undefined });
    var avail = J.DB.calculateAvailableToSpend(me.id, { from: r.from, to: r.to, vision: dash.vision });
    var eng = J.DB.calculateSettlementBalance(me.id);
    var accS = J.DB.calculateAccountsSummary(me.id);
    var cardS = J.DB.cardsSummary(me.id);
    var anyTx = J.DB.listTx(me.id, {}).length > 0;

    // onboarding: casal recém-criado sem nada
    if (!anyTx && !accS.activeAccounts && !cardS.activeCards) {
      v.innerHTML = html + '<div class="card empty"><div class="ico">🌱</div><h2>Vamos organizar as finanças de vocês?</h2>' +
        '<p class="muted">1. Cadastre uma conta<br>2. Registre receitas e despesas<br>3. Crie um cartão para acompanhar faturas<br>4. Defina orçamento e metas</p>' +
        '<button class="btn" id="ob-acc">Adicionar conta</button><div class="row"><button class="btn ghost" id="ob-tx">Nova transação</button><button class="btn ghost" id="ob-cc">Novo cartão</button></div></div>';
      bindDashChrome(v, me);
      document.getElementById('ob-acc').onclick = function () { openAccountModal(me, null); };
      document.getElementById('ob-tx').onclick = function () { openTxModal(me, null); };
      document.getElementById('ob-cc').onclick = function () { openCardModal(me, null); };
      return;
    }
    if (!d.totalTx && !accS.activeAccounts && !cardS.activeCards) {
      v.innerHTML = html + '<div class="card empty"><div class="ico">🌱</div><h2>Nada por aqui neste período</h2><p class="muted">Tente outro mês ou ajuste o período.</p><button class="btn ghost" id="d-reset">Ver este mês</button></div>' + spendCard(avail);
      bindDashChrome(v, me); bindSpend(v, avail);
      var ra = document.getElementById('d-reset'); if (ra) ra.onclick = function () { dash.preset = 'month'; dash.month = thisMonth(); render('dashboard'); };
      return;
    }

    // ações rápidas (abrem os fluxos existentes)
    html += '<div class="card"><b>Ações rápidas</b><div class="qa-grid">' +
      '<button data-qa="tx">+ Transação</button><button data-qa="tr">⇄ Transferir</button><button data-qa="ac">🏦 Conta</button>' +
      '<button data-qa="cc">💳 No cartão</button><button data-qa="ip">🗓️ Parcelada</button><button data-qa="pay">🧾 Pagar fatura</button></div>' +
      '<p><a href="#/assistant">🤖 Perguntar ao assistente ›</a></p></div>';

    // 1. dinheiro nas contas (visão respeita proprietário)
    html += blk('Dinheiro nas contas', function () {
      var va = J.DB.visionAccounts(me.id, dash.vision);
      var s = '<div class="card"><b>🏦 Dinheiro nas contas</b><h1>' + BRL(va.total) + '</h1>';
      if (va.list.length) s += va.list.slice(0, 5).map(function (x) {
        return '<p>' + esc(x.account.name) + ' <span class="muted">• ' + esc(J.DB.accountTypeLabel(x.account.type)) + ' • ' + esc(x.account.owner_type === 'joint' ? 'Casal' : firstShort(me, x.account.owner_user_id)) + '</span><br><b>' + BRL(x.balance) + '</b></p>';
      }).join('');
      else s += '<p class="muted">Nenhuma conta nesta visão.</p>';
      if (va.note) s += '<p class="muted">' + esc(va.note) + '</p>';
      return s + '<p class="muted">Dinheiro em contas. Limite de cartão não entra aqui.</p><p><a href="#/accounts">Ver contas ›</a> • <a href="#/accounts" id="d-tr">Transferir ›</a></p></div>';
    });
    // 2. resultado do período (hero no formato do exemplo: saldo + receitas/despesas)
    html += blk('Resultado', function () {
      var s = '<div class="card hero"><span class="muted">Saldo de ' + esc(monthLabel(r.single ? r.from : r.to).toLowerCase().replace(' ', ' de ')) + '</span><h1>' + BRL(d.balance) + '</h1>' +
        '<div class="hero-split"><div class="cell"><span class="k">↑ Receitas</span><span class="v">' + BRL(d.income) + '</span></div>' +
        '<div class="cell"><span class="k">↓ Despesas</span><span class="v">' + BRL(d.expense) + '</span></div></div>';
      if (d.balance < 0) s += '<div class="alert">Vocês gastaram mais do que receberam neste período.</div>';
      s += '</div>' + spendCard(avail);
      s += '<div class="dash-2col"><a class="card center dash-link" href="#/transactions" id="d-rec">💰<br><b>Receitas</b><br><strong class="pos">' + BRL(d.income) + '</strong><br><span class="muted">' + (d.incomeCount ? txNoun(d.incomeCount) : 'Você ainda não registrou receitas neste período.') + '</span></a>';
      s += '<a class="card center dash-link" href="#/transactions" id="d-exp">💸<br><b>Despesas</b><br><strong class="neg">' + BRL(d.expense) + '</strong><br><span class="muted">' + (d.expenseCount ? txNoun(d.expenseCount) : 'Você ainda não registrou despesas neste período.') + '</span></a></div>';
      s += '<div class="dash-2col"><div class="card"><b>Taxa de poupança</b><h2>' + (d.saveRate == null ? '—' : fmtPct(d.saveRate)) + '</h2><p class="muted">' + (d.saveRate == null ? 'Não há receitas suficientes no período para calcular.' : 'Equivale a ' + BRL(d.balance) + ' no período.') + '</p></div>';
      s += '<div class="card"><b>Resultado ' + (r.single ? 'do mês' : 'do período') + '</b><h2 class="' + (d.balance > 0 ? 'pos' : d.balance < 0 ? 'neg' : '') + '">' + BRL(d.balance) + '</h2><p class="muted">' + (d.balance > 0 ? 'Saldo positivo' : d.balance < 0 ? 'Saldo negativo' : 'Saldo zerado') + '</p></div></div>';
      return s;
    });
    // 2b. Nosso dinheiro — UX do casal (só apresentação de valores oficiais)
    html += blk('Nosso dinheiro', function () { return coupleMoneySection(me, r, d, eng); });
    // 3. faturas
    html += blk('Faturas', function () { return dashInvoices(me); });
    // 4. cartões (visão respeita proprietário)
    html += blk('Cartões', function () {
      var vc = J.DB.visionCards(me.id, dash.vision);
      if (!vc.list.length) return '<div class="card"><b>💳 Cartões</b><p class="muted">Nenhum cartão nesta visão. <a href="#/cards">Ver cartões ›</a></p></div>';
      var s = '<div class="card"><b>💳 Cartões</b>' + vc.list.map(function (x) {
        return '<p><b>' + esc(x.card.name) + '</b> <span class="muted">• ' + esc(x.card.owner_type === 'joint' ? 'Casal' : firstShort(me, x.card.owner_user_id)) + '</span><br>Limite ' + BRL(x.card.credit_limit) + ' • Usado <b>' + BRL(x.used) + '</b> • Disponível <b>' + BRL(x.available) + '</b>' + (x.exceeded ? ' <span class="pill over">🚨 Limite excedido</span>' : '') + '</p>';
      }).join('') + '<p class="muted">Total: ' + BRL(vc.totalLimit) + ' • Usado ' + BRL(vc.totalUsed) + ' • Disponível ' + BRL(vc.totalAvailable) + '<br>Limite não é dinheiro em conta.</p>';
      if (vc.note) s += '<p class="muted">' + esc(vc.note) + '</p>';
      return s + '<p><a href="#/cards">Ver cartões ›</a></p></div>';
    });
    // 5. orçamento (sempre do casal)
    html += blk('Orçamento', function () {
      var bYMd = r.single ? r.from : thisMonth();
      var bs = J.DB.budgetSummary(me.id, bYMd);
      var bTag = dash.vision === 'couple' ? '' : ' <span class="muted">• Orçamento do casal</span>';
      return '<div class="card"><b>📊 Orçamento</b> <span class="muted">' + esc(monthLabel(bYMd)) + '</span>' + bTag +
        (bs.items.length
          ? '<h2>' + BRL(bs.spent) + ' <span class="muted">/ ' + BRL(bs.total) + '</span></h2><div class="bar"><div style="width:' + Math.min(100, bs.pct) + '%"></div></div><p class="muted">' + String(bs.pct).replace('.', ',') + '% utilizado • ' + BRL(bs.remaining) + ' restantes</p>'
          : '<p class="muted">Defina limites para começar a acompanhar seus gastos.</p>') +
        '<p><a href="#/budget">Ver orçamento ›</a></p></div>';
    });
    // 5b. planejamento do mês (somente leitura; número projetado ≠ saldo)
    html += blk('Planejamento', function () {
      var ym = r.single ? r.from : thisMonth();
      var plans = J.DB.listPlans(me.id, { status: 'active' }).filter(function (p) { return p.period_start.slice(0, 7) <= ym && p.period_end.slice(0, 7) >= ym; });
      if (!plans.length) return '';
      var c;
      try { c = J.DB.calculatePlan(me.id, plans[0].id, { vision: dash.vision }); } catch (e) { return ''; }
      var m = c.months.filter(function (x) { return x.ym === ym; })[0];
      if (!m) return '';
      var tag = dash.vision === 'couple' ? '' : ' <span class="muted">• sua visão</span>';
      return '<div class="card"><b>🗺️ Planejamento</b> <span class="muted">' + esc(plans[0].name) + '</span>' + tag +
        '<p class="muted">Entradas planejadas: <b class="pos">' + BRL(m.income) + '</b> • Saídas planejadas: <b class="neg">' + BRL(m.expenses + m.savings + m.goalContributions) + '</b><br>Saldo final projetado: <b>' + BRL(m.ending) + '</b> • Realizado no mês: <b>' + BRL(m.realized.income - m.realized.expense) + '</b></p>' +
        '<p class="muted">Projetado com base nos dados atuais. Não é saldo em conta.</p><p><a href="#/planning/' + plans[0].id + '">Ver planejamento ›</a></p></div>';
    });
    // 6. compromissos unificados (30 dias, por origem, sem duplicar)
    html += blk('Compromissos', function () { return dashCommitments(me); });
    // 6b. fluxo de caixa do período (realizado; futuro = projeção)
    html += blk('Fluxo de caixa', function () {
      var s;
      try { s = J.DB.getDashboardSummary(me.id, dashFilterOpt()).analytics; } catch (e) { return ''; }
      if (!s || !s.data || !s.data.cashFlow) return '';
      var cf = s.data.cashFlow;
      var isF = !!r.future;
      return colCard(me, 'cashflow', '💧 Fluxo de caixa ' + (isF ? '<span class="muted">(projeção)</span>' : '<span class="muted">(realizado)</span>'),
        '<p class="muted">Saldo em contas: <b>' + BRL(cf.accounts.total) + '</b> • Entradas: <b class="pos">' + BRL(cf.inflow) + '</b> • Saídas: <b class="neg">' + BRL(cf.outflow) + '</b> • Resultado: <b>' + BRL(cf.net) + '</b>' +
        (cf.invoicePayments.count ? '<br>Pagamentos de fatura (saída de conta, não despesa): <b>' + BRL(cf.invoicePayments.total) + '</b>' : '') +
        (cf.internal.count ? '<br>Movimentações internas (não alteram resultado): ' + BRL(cf.internal.total) : '') + '</p>' +
        '<div role="img" aria-label="Fluxo de caixa: entradas ' + BRL(cf.inflow) + ', saídas ' + BRL(cf.outflow) + '"><div class="hbar"><span class="hl">Entradas</span><div class="ht"><div style="width:' + (cf.inflow + cf.outflow ? Math.round(cf.inflow / (cf.inflow + cf.outflow) * 100) : 0) + '%"></div></div><span class="hv">' + BRL(cf.inflow) + '</span></div>' +
        '<div class="hbar"><span class="hl">Saídas</span><div class="ht"><div style="width:' + (cf.inflow + cf.outflow ? Math.round(cf.outflow / (cf.inflow + cf.outflow) * 100) : 0) + '%"></div></div><span class="hv">' + BRL(cf.outflow) + '</span></div></div>' +
        (isF ? '<p class="muted">Projeção com base nos dados atuais. Não é saldo em conta.</p>' : ''));
    });
    // 6c. planejado x realizado (factual, sem julgamento)
    html += blk('Planejado x realizado', function () {
      var p;
      try { p = J.DB.getPlanningSummary(me.id, dashFilterOpt()); } catch (e) { return ''; }
      if (!p || !p.hasPlan) return '<div class="card"><b>⚖️ Planejado x realizado</b><p class="muted">Nenhum planejamento ativo.</p><p><a href="#/planning">Ver planejamento ›</a></p></div>';
      return '<div class="card"><b>⚖️ Planejado x realizado</b> <span class="muted">' + esc(p.name) + '</span>' +
        '<p class="muted">Entradas planejadas: <b>' + BRL(p.income) + '</b> • Saídas planejadas: <b>' + BRL(p.outflows) + '</b> • Realizado: <b>' + BRL(p.realized) + '</b><br>Diferença entradas: <b>' + BRL(p.varianceIncome) + '</b> • Diferença saídas: <b>' + BRL(p.varianceExpense) + '</b> • Saldo projetado: <b>' + BRL(p.ending) + '</b></p>' +
        '<p><a href="#/planning/' + p.id + '">Ver variações ›</a></p></div>';
    });
    // 7. metas (sempre do casal)
    html += blk('Metas', function () {
      var gs = J.DB.listGoals(me.id, false).filter(function (g) { return g.status === 'active'; }).slice(0, 3);
      var gTag = dash.vision === 'couple' ? '' : ' <span class="muted">• do casal</span>';
      if (!gs.length) return '<div class="card"><b>🎯 Metas</b>' + gTag + '<p class="muted">Crie uma meta para acompanhar um objetivo financeiro. <a href="#/goals">Ver metas ›</a></p></div>';
      return '<div class="card"><b>🎯 Metas</b>' + gTag + gs.map(function (g) {
        var pr = J.DB.goalProgress(g);
        return '<p><b>' + esc(g.name) + '</b><br><span class="muted">' + BRL(g.current_amount) + ' de ' + BRL(g.target_amount) + ' (' + String(pr.pct).replace('.', ',') + '%) • Prazo: ' + esc(cap(goalDeadFmt(g.deadline))) + '</span></p><div class="bar"><div style="width:' + pr.pct + '%"></div></div>';
      }).join('') + '<p class="muted">Aportes são acompanhamento, não movimentação bancária.</p><p><a href="#/goals">Ver todas as metas ›</a></p></div>';
    });
    // 8. acertos (motor central; direção oficial, sem cobrança; JOINT = só histórico)
    html += blk('Acertos', function () {
      if (J.DB.moneyMode(me.id) === 'JOINT') return '<div class="card"><b>⚖️ Acertos</b><p class="muted">Vocês administram o dinheiro em conjunto — novas despesas não geram acertos.' + (J.DB.listSettlements(me.id).length ? ' Acertos anteriores continuam no histórico.' : '') + '</p><p><a href="#/settlements">Ver acertos ›</a></p></div>';
      if (!eng.sharedCount) return '<div class="card"><b>⚖️ Acertos</b><p class="muted">Nenhuma despesa compartilhada — nada a acertar.</p><p><a href="#/settlements">Ver acertos ›</a></p></div>';
      if (!eng.debt) return '<div class="card"><b>⚖️ Acertos</b><p class="muted">Tudo certo por aqui. Não há acertos pendentes entre vocês neste período.</p><p><a href="#/settlements">Ver acertos ›</a></p></div>';
      return '<div class="card"><b>⚖️ Acerto pendente</b>' + settleDirectionHtml(me, eng.debt) + '<p><a href="#/settlements">Ver acertos ›</a></p></div>';
    });
    // 8b. agenda resumida — próximos 7 dias via calendário (sem eventos fictícios)
    html += blk('Agenda', function () {
      var cal;
      try { cal = J.DB.getCalendarSummary(me.id, dashFilterOpt()); } catch (e) { return ''; }
      if (!cal.agenda.length && !cal.overdue) return '<div class="card"><b>🗓️ Próximos dias</b><p class="muted">Não há compromissos futuros cadastrados.</p><p><a href="#/calendar">Ver calendário ›</a></p></div>';
      var s = '<div class="card"><b>🗓️ Próximos dias</b>' + cal.agenda.slice(0, 5).map(function (e) {
        return '<p>' + dueLabel(e.event_date) + ' — <b>' + esc(e.title) + '</b> ' + BRL(e.amount) + ' <span class="muted">• ' + esc(e.status) + '</span></p>';
      }).join('');
      if (cal.overdue) s += '<p class="muted">' + cal.overdue + (cal.overdue === 1 ? ' evento atrasado.' : ' eventos atrasados.') + '</p>';
      return s + '<p><a href="#/calendar">Ver calendário ›</a> • <a href="#/calendar">Ver compromissos ›</a></p></div>';
    });
    // 8b2. próximos compromissos da agenda (respeita visão; nunca vaza PRIVATE)
    html += blk('Próximos compromissos', function () {
      var up = [];
      try { up = J.DB.agendaUpcoming(me.id, { limit: 4, days: 60, vision: dash.vision }); } catch (e) { return ''; }
      var head = dash.vision === 'couple' ? 'Próximos compromissos do casal' : dash.vision === 'me' ? 'Seus próximos compromissos' : 'Compromissos visíveis';
      var s = '<div class="card"><div class="row between"><b>📅 ' + head + '</b><button class="btn ghost sm" id="d-agnew" style="max-width:200px">+ Novo compromisso</button></div>';
      if (!up.length) s += '<p class="muted">Nada marcado por aqui.</p>';
      else s += up.map(function (o) {
        return '<p><b>' + esc(dueLabel(o.date)) + '</b> ' + esc(agWhen(o)) + ' — <b>' + esc(o.title) + '</b> <span class="muted">• ' + (o.visibility === 'COUPLE' ? '❤️ Casal' : '👤 Só eu') + '</span></p>';
      }).join('');
      return s + '<p><a href="#/agenda">Ver agenda ›</a></p></div>';
    });
    // 8b3. hábitos de hoje (mini-card pessoal; sem números financeiros)
    html += blk('Seus hábitos', function () {
      var st;
      try { st = J.DB.habitTodayStatus(me.id); } catch (e) { return ''; }
      if (!st.total && !J.DB.getHabits(me.id, {}).length) return '';
      return '<div class="card"><b>🌱 Seus hábitos</b><p class="muted">Hoje</p><h2>' + st.done + ' de ' + st.total + ' concluídos</h2><p><a href="#/habits">Ver hábitos ›</a></p></div>';
    });
    // 8c. insights + notificações (resumos, sem segunda camada de prioridade)
    html += blk('Insights', function () {
      var ins;
      try { ins = J.DB.getInsightSummary(me.id); } catch (e) { return ''; }
      if (!ins.total) return colCard(me, 'insights', '💡 Insights financeiros', '<p class="muted">Nenhum insight relevante no momento.</p><p><a href="#/insights">Ver insights ›</a></p>');
      var sev = { info: 'ℹ️', attention: '⚠️', important: '🚨' };
      return colCard(me, 'insights', '💡 Insights financeiros',
        ins.top.map(function (x) { return '<p>' + (sev[x.severity] || 'ℹ️') + ' <b>' + esc(x.title) + '</b> <span class="muted">• ' + esc(x.severity) + '</span></p>'; }).join('') +
        '<p><a href="#/insights">Ver insights ›</a></p>');
    });
    html += blk('Notificações', function () {
      var n;
      try { n = J.DB.getNotificationSummary(me.id); } catch (e) { return ''; }
      if (!n.unread) return '<div class="card"><b>🔔 Notificações</b><p class="muted">Nada novo por aqui.</p><p><a href="#/notifications">Abrir central ›</a></p></div>';
      return '<div class="card"><b>🔔 Notificações</b><p>' + n.unread + (n.unread === 1 ? ' não lida' : ' não lidas') + '</p>' +
        n.top.map(function (x) { return '<p>• <b>' + esc(x.title) + '</b></p>'; }).join('') +
        '<p><a href="#/notifications">Abrir central ›</a></p></div>';
    });
    // 9. gastos por categoria (donut + barras com drill-down)
    html += blk('Gastos', function () {
      return donutBlock(d.byCat, d.expense) + '<div class="card"><b>Gastos por categoria</b>' + (d.byCat.length ? catChart(d) + '<p class="muted">Maior categoria de despesas no período: <b>' + esc(d.topCat.icon + ' ' + d.topCat.name) + '</b> ' + BRL(d.topCat.value) + ' (' + String(d.topCat.pct).replace('.', ',') + '%)</p>' : '<p class="muted">Sem despesas neste período.</p>') + '</div>';
    });
    // 10. gráficos + evolução (resultado mensal explícito)
    html += blk('Gráficos', function () {
      var s = '<div class="card"><b>' + (r.single ? 'Receitas x despesas' : 'Evolução no período') + '</b>' + rdChart(me, r, d) + '</div>';
      if (d.evolution.length) {
        s += '<div class="card"><b>Evolução financeira</b><p class="muted">Resultado mensal (receitas − despesas) dos últimos meses com dados.</p>' + d.evolution.map(function (e) {
          return '<p>' + esc(monthLabel(e.month)) + '<br><span class="muted">+' + BRL(e.income) + ' −' + BRL(e.expense) + ' = </span><b>' + BRL(e.balance) + '</b></p>';
        }).join('') + '</div>';
      } else {
        s += '<div class="card"><b>Evolução financeira</b><p class="muted">Ainda há poucos dados para mostrar uma evolução significativa.</p></div>';
      }
      return s;
    });
    // participação + comparação
    html += blk('Participação', function () {
      if (J.DB.moneyMode(me.id) === 'JOINT') {
        var sj = '<div class="card"><b>Movimentações no período</b><span class="muted"> • filtro de histórico</span>' + d.perPerson.map(function (p) {
          return '<p>👤 <b>' + esc(J.DB.userName(me.id, p.user_id)) + '</b><br><span class="muted">Receitas recebidas ' + BRL(p.recv || 0) + ' • Despesas realizadas ' + BRL(p.indivPaid + p.sharedPaid) + '</span></p>';
        }).join('') + '<p><a href="#/transactions" id="d-paid">Ver detalhes ›</a></p></div>';
        return sj;
      }
      var s = '<div class="card"><b>Participação no período</b>' + d.perPerson.map(function (p) {
        return '<p>👤 <b>' + esc(J.DB.userName(me.id, p.user_id)) + '</b><br><span class="muted">Pagou ' + BRL(p.indivPaid + p.sharedPaid) + ' • Deveria assumir ' + BRL(respOfPeriod(me, p.user_id, r)) + '</span></p>';
      }).join('') + '<p><a href="#/transactions" id="d-paid">Ver detalhes ›</a></p></div>';
      if (r.single && d.prev) s += diffBlock('Despesas', d.expense, d.prev.expense) + diffBlock('Receitas', d.income, d.prev.income);
      var mc0 = J.DB.monthCommitments(me.id, r.single ? r.from : thisMonth());
      var proj = J.DB.calculateProjectedBalance(me.id, r.single ? r.from : thisMonth());
      s += '<div class="card"><b>Saldo projetado</b><h2>' + BRL(proj.projected) + '</h2><p class="muted">Estimativa baseada no saldo realizado e nos compromissos futuros conhecidos. Não é saldo disponível.</p></div>';
      return s;
    });
    // 11. movimentações recentes (tx + transferências + pagamentos)
    html += blk('Recentes', function () { return dashRecent(me, r); });
    // avisos factuais
    html += blk('Avisos', function () { return dashTips(me, r); });

    v.innerHTML = html;
    bindDashChrome(v, me);
    bindLink(v, 'd-rec', function () { goTx({ type: 'income' }); });
    bindLink(v, 'd-exp', function () { goTx({ type: 'expense' }); });
    bindLink(v, 'd-paid', function () { goTx({}); });
    bindLink(v, 'd-all', function () { goTx({}); });
    bindLink(v, 'd-tr', function () { goAndOpen(me, '#/accounts', 'accounts', function () { openTransferModal(me, null, null); }); });
    var agb = v.querySelector('#d-agnew'); if (agb) agb.onclick = function () { openAgendaModal(me, null, null); };
    bindSpend(v, avail);
    Array.prototype.forEach.call(v.querySelectorAll('[data-qa]'), function (b) {
      b.onclick = function () {
        var k = b.dataset.qa;
        if (k === 'tx') openTxModal(me, null, 'expense');
        else if (k === 'tr') openTransferModal(me, null, null);
        else if (k === 'ac') openAccountModal(me, null);
        else if (k === 'cc') openTxModal(me, null, 'expense', 'card');
        else if (k === 'ip') openInstallmentModal(me, null, null);
        else if (k === 'pay') location.hash = '#/invoices';
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-retry]'), function (b) { b.onclick = function () { render('dashboard'); }; });
    Array.prototype.forEach.call(v.querySelectorAll('.tx[data-id]'), function (b) { b.onclick = function () { openTxDetail(me, b.dataset.id); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-trid]'), function (b) { b.onclick = function () { openTransferDetail(me, b.dataset.trid); }; });
  }
  /* ============ VISÃO GERAL / PLANNER (camada de agregação) ============
     Consome OverviewAggregationService + serviços oficiais. Nenhum cálculo
     próprio, nenhuma escrita além de HabitService.recordCompletion /
     removeCompletion (checklist) e fluxos oficiais (modais/links). */
  var ov = { mode: 'day', date: '', vision: 'couple' };
  try {
    var _ovp = JSON.parse(localStorage.getItem('juntos_ov_v1') || '{}');
    ['mode', 'date', 'vision'].forEach(function (k) { if (_ovp[k] != null) ov[k] = _ovp[k]; });
    if (['day', 'week', 'month'].indexOf(ov.mode) < 0) ov.mode = 'day';
    if (['couple', 'me', 'partner'].indexOf(ov.vision) < 0) ov.vision = 'couple';
  } catch (e) {}
  function ovPersist() { try { localStorage.setItem('juntos_ov_v1', JSON.stringify(ov)); } catch (e) {} }
  function ovDate() {
    if (!ov.date || !J.DB.agendaParseDay(ov.date)) ov.date = todayISO();
    return ov.date;
  }
  function ovGreet() { var h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
  function ovDayTitle(d) {
    var t = todayISO();
    if (d === t) return 'Hoje';
    if (d === J.DB.agendaAddDays(t, 1)) return 'Amanhã';
    if (d === J.DB.agendaAddDays(t, -1)) return 'Ontem';
    return agDayLabel(d);
  }
  function ovWhoBadge(vis) {
    return vis === 'COUPLE' ? '<span class="pill">❤️ Casal</span>' : '<span class="pill">👤 Pessoal</span>';
  }
  function ovModeLabel() { return ov.mode === 'day' ? 'Dia' : ov.mode === 'week' ? 'Semana' : 'Mês'; }
  function pOverview(v, me) {
    var ctx = null, solo = false, partnerId = null, vMe = esc(me.nome.split(' ')[0]), vPa = 'Parceiro';
    try {
      ctx = J.DB.myCouple(me.id);
      solo = ctx.members.length < 2;
      partnerId = J.DB.memberIds(me.id).filter(function (x) { return x !== me.id; })[0] || null;
      if (partnerId) vPa = esc(firstShort(me, partnerId));
    } catch (e) {
      v.innerHTML = '<div class="card"><h1>Visão Geral</h1><p class="muted">Crie ou entre em um casal para começar. <a href="#/settings/couple">Convidar parceiro ›</a></p></div>';
      return;
    }
    var d = ovDate();
    var day = null, week = null, mon = null, loadErr = null;
    try {
      day = J.DB.getOverviewDay(me.id, d, 'couple');
      if (ov.mode === 'week') week = J.DB.getOverviewWeek(me.id, d, ov.vision);
      if (ov.mode === 'month') mon = J.DB.getOverviewMonth(me.id, d.slice(0, 7), ov.vision);
    } catch (e2) { loadErr = e2; }
    var html = '<div class="card"><p class="muted" style="margin:0">' + ovGreet() + ', ' + vMe + ' 👋</p><h1 style="margin:4px 0">Visão Geral</h1>' +
      '<p class="muted" style="margin:0">Seu dia, seus hábitos, seus compromissos e suas finanças.</p>' +
      '<div class="per-row"><button class="pnav" id="ov-prev" aria-label="Período anterior">‹</button><strong id="ov-label">' +
      esc(ov.mode === 'day' ? ovDayTitle(d) + ' • ' + dueLabel(d) : ov.mode === 'week' && week ? 'Semana ' + dueLabel(week.from) + ' – ' + dueLabel(week.to) : monthLabel(d.slice(0, 7))) +
      '</strong><button class="pnav" id="ov-next" aria-label="Próximo período">›</button></div>' +
      '<div class="seg" role="group" aria-label="Alcance"><button data-ovm="day" class="' + (ov.mode === 'day' ? 'on' : '') + '">Dia</button><button data-ovm="week" class="' + (ov.mode === 'week' ? 'on' : '') + '">Semana</button><button data-ovm="month" class="' + (ov.mode === 'month' ? 'on' : '') + '">Mês</button></div>' +
      '<div class="seg" role="group" aria-label="Visão"><button data-ovv="couple" class="' + (ov.vision === 'couple' ? 'on' : '') + '">Casal</button><button data-ovv="me" class="' + (ov.vision === 'me' ? 'on' : '') + '">' + vMe + '</button><button data-ovv="partner" class="' + (ov.vision === 'partner' ? 'on' : '') + '">' + vPa + '</button></div>' +
      '<div class="qa-grid" role="group" aria-label="Ações rápidas"><button data-ovqa="ag">+ Compromisso</button><button data-ovqa="hb">✓ Hábito</button><button data-ovqa="tx">+ Movimentação</button><button data-ovqa="cap">+ Capturar</button></div>' +
      (solo ? '<p class="muted">Falta 1 pessoa aqui. <a href="#/settings/couple">Convidar parceiro ›</a></p>' : '') + '</div>';
    if (loadErr || !day) {
      v.innerHTML = html + '<div class="card"><b>Visão Geral</b><div class="alert">Não foi possível carregar sua visão geral. Tente novamente.</div><button class="btn ghost" data-ovretry>Tentar novamente</button></div>';
      bindOverview(v, me);
      return;
    }
    if (ov.mode === 'day') html += ovDayHtml(me, day);
    else if (ov.mode === 'week') html += ovWeekHtml(me, day, week);
    else html += ovMonthHtml(me, day, mon);
    v.innerHTML = html;
    bindOverview(v, me);
  }
  function ovDayHtml(me, day) {
    var s = '';
    // Hoje (resumo rápido)
    s += blk('Hoje', function () {
      var nx = day.next ? '<br>Próximo: <b>' + esc((day.next.start || '') + (day.next.start ? ' • ' : '') + day.next.title) + '</b>' : '<br><span class="muted">Sem próximos compromissos.</span>';
      return '<div class="card"><b>Hoje</b><p><b>' + day.agenda.length + '</b> compromissos • <b>' + day.tasks.total + '</b> tarefas • <b>' + ((day.routines || []).length) + '</b> rotinas • <b>' + ((day.inbox && day.inbox.pending) || 0) + '</b> na Inbox • <b>' + day.habits.done + '/' + day.habits.total + '</b> hábitos • <b>' + day.finance.count + '</b> movimentações' + nx + '</p></div>';
    });
    // Próximo compromisso (destaque)
    s += blk('Próximo', function () {
      if (!day.next) return '<div class="card"><b>Próximo compromisso</b><p class="muted">Seu dia está livre.</p><button class="btn ghost sm" data-ovqa="ag" style="max-width:230px">Adicionar compromisso</button></div>';
      var n = day.next;
      return '<div class="card"><b>Próximo compromisso</b><h2>' + esc((n.start || '') + (n.start ? ' • ' : '') + n.title) + '</h2>' +
        '<p class="muted">' + esc(ovDayTitle(n.date) + ' • ' + dueLabel(n.date)) + (n.location ? ' • 📍 ' + esc(n.location) : '') + ' • ' + (n.visibility === 'COUPLE' ? '❤️ Casal' : '👤 Pessoal') + '</p><p><a href="#/agenda">Ver agenda ›</a></p></div>';
    });
    var pair = '';
    pair += blk('Compromissos', function () { return ovAgendaCard(day); });
    pair += blk('Hábitos', function () { return ovHabitsCard(day); });
    s += '<div class="ov-grid">' + pair + '</div>';
    s += blk('Tarefas', function () { return ovTasksCard(me, day); });
    s += blk('Listas', function () { return ovListsCard(me, day); });
    s += blk('Rotinas', function () { return ovRoutinesCard(me, day); });
    s += blk('Projetos', function () { return ovProjectsCard(me, day); });
    s += blk('Minha Semana', function () { return ovWeekCard(me, day); });
    s += blk('Fechamento Mensal', function () { return ovMonthlyReviewCard(me, day); });
    s += blk('Inbox', function () { return ovInboxCard(me, day); });
    s += blk('Finanças', function () { return ovFinDayCard(day); });
    var pair2 = '';
    pair2 += blk('Timeline', function () { return ovTimelineCard(day); });
    pair2 += blk('Compromissos financeiros', function () { return ovCommitCard(day); });
    s += '<div class="ov-grid">' + pair2 + '</div>';
    s += blk('Recentes', function () { return ovRecentCard(me, day); });
    return s;
  }
  function ovAgendaCard(day) {
    var s = '<div class="card"><div class="row between"><b>Compromissos</b><a href="#/agenda">Ver tudo ›</a></div>';
    if (!day.agenda.length) return s + '<p class="muted">Agenda livre — sem compromissos neste dia.</p><button class="btn ghost sm" data-ovqa="ag" style="max-width:230px">+ Adicionar compromisso</button></div>';
    s += day.agenda.slice(0, 5).map(function (o) {
      return '<p><b>' + esc(o.start || '––:––') + '</b> ' + esc(o.title) + '<br><span class="muted">' + esc(o.all_day ? 'Dia inteiro' : (o.start || '') + (o.end && o.end !== o.start ? ' — ' + o.end : '')) + '</span> ' + ovWhoBadge(o.visibility) + '</p>';
    }).join('');
    if (day.agenda.length > 5) s += '<p class="muted">+' + (day.agenda.length - 5) + ' outros. <a href="#/agenda">Ver tudo ›</a></p>';
    return s + '</div>';
  }
  function ovHabitsCard(day) {
    var done = day.habits.done, total = day.habits.total;
    var pct = total ? Math.round(done / total * 100) : 0;
    var s = '<div class="card"><div class="row between"><b>Hábitos de hoje</b><span class="muted">' + done + '/' + total + '</span></div>';
    if (!total) return s + '<p class="muted">Nenhum hábito para hoje.</p><p><a href="#/habits">+ Criar hábito ›</a></p></div>';
    s += '<div class="bar" role="img" aria-label="' + done + ' de ' + total + ' hábitos concluídos"><div style="width:' + pct + '%"></div></div>';
    s += day.habits.items.map(function (i) {
      var lbl = (i.done ? '✓ ' : '○ ') + i.name + (i.target ? ' • ' + i.target : '');
      if (i.unit === 'BOOLEAN') {
        return '<div class="ov-row"><button class="chk' + (i.done ? ' done' : '') + '" data-ovhb="' + i.id + '" aria-pressed="' + !!i.done + '" aria-label="' + esc((i.done ? 'Desmarcar ' : 'Concluir ') + i.name) + '">' + (i.done ? '✓' : '') + '</button><span>' + esc(lbl) + '</span></div>';
      }
      return '<div class="ov-row"><button class="chk' + (i.done ? ' done' : '') + '" data-ovhbq="' + i.id + '" aria-label="' + esc('Registrar ' + i.name) + '">' + (i.done ? '✓' : '○') + '</button><span>' + esc(lbl) + (i.value != null && !i.done ? ' • atual: ' + esc(String(i.value)) : '') + '</span></div>';
    }).join('');
    return s + '<p><a href="#/habits">Ver hábitos ›</a></p></div>';
  }
  function ovTasksCard(me, day) {
    var t = day.tasks || { total: 0, done: 0, items: [] };
    var s = '<div class="card"><div class="row between"><b>Tarefas</b><span class="muted">' + t.total + ' pendentes hoje</span></div>';
    if (!t.total) return s + '<p class="muted">Nenhuma tarefa para hoje.</p><p><a href="#/tasks">Ver todas ›</a></p></div>';
    s += t.items.slice(0, 4).map(function (i) {
      var lbl = '○ ' + i.title + (i.due_time ? ' • ' + i.due_time : '') + (i.overdue ? ' • <b>Atrasada</b>' : '');
      return '<div class="ov-row"><button class="chk" data-ovtk="' + esc(i.key) + '" aria-label="' + esc('Concluir ' + i.title) + '"></button><span>' + lbl + '</span></div>';
    }).join('');
    return s + '<p><a href="#/tasks">Ver todas ›</a></p></div>';
  }
  function ovFinDayCard(day) {
    var f = day.finance;
    var s = '<div class="card"><div class="row between"><b>Finanças de hoje</b><a href="#/transactions">Ver movimentações ›</a></div>' +
      '<p>Receitas <b class="pos">' + BRL(f.income) + '</b> • Despesas <b class="neg">' + BRL(f.expense) + '</b><br>Resultado <b>' + BRL(f.result) + '</b> <span class="muted">• ' + f.count + (f.count === 1 ? ' movimentação' : ' movimentações') + ' do casal</span></p>';
    if (f.byCat.length) {
      s += '<details><summary>Ver detalhes</summary><p class="muted">Despesas por categoria hoje:</p>' +
        f.byCat.slice(0, 5).map(function (c) { return '<p>' + esc(c.name) + ' — <b>' + BRL(c.value) + '</b></p>'; }).join('') + '</details>';
    } else if (!f.count) s += '<p class="muted">Nenhuma movimentação neste dia.</p>';
    return s + '</div>';
  }
  function ovCommitCard(day) {
    var s = '<div class="card"><div class="row between"><b>Compromissos financeiros</b><a href="#/calendar">Ver calendário ›</a></div>';
    if (!day.commitments.length) return s + '<p class="muted">Nenhum compromisso financeiro próximo.</p></div>';
    s += day.commitments.map(function (c) {
      return '<p><b>' + esc(dueLabel(c.date)) + '</b> ' + esc(c.title) + '<br><b>' + BRL(c.amount) + '</b> <span class="muted">• ' + esc(c.status) + '</span></p>';
    }).join('');
    return s + '</div>';
  }
  function ovRecentCard(me, day) {
    var s = '<div class="card"><div class="row between"><b>Movimentações recentes</b><a href="#/transactions">Ver todas ›</a></div>';
    if (!day.recent.length) return s + '<p class="muted">Nenhuma movimentação recente.</p></div>';
    s += day.recent.map(function (t) {
      var ic = t.type === 'income' ? '💰' : '🧾';
      var nm = '';
      try { nm = J.DB.catName(me.id, t.category_id); } catch (e) { nm = ''; }
      return '<p><span aria-hidden="true">' + ic + '</span> <b>' + esc(t.description) + '</b> <span class="muted">• ' + esc(dueLabel(t.date)) + (nm ? ' • ' + esc(nm) : '') + '</span><br><b class="' + (t.type === 'income' ? 'pos' : 'neg') + '">' + (t.type === 'income' ? '+' : '−') + ' ' + BRL(t.amount) + '</b></p>';
    }).join('');
    return s + '</div>';
  }
  function ovTimelineCard(day) {
    var evs = [];
    day.agenda.forEach(function (o) { evs.push({ t: o.start || null, k: 'age', title: o.title, who: o.visibility === 'COUPLE' ? 'Casal' : 'Pessoal', ico: '📅' }); });
    day.habits.items.forEach(function (i) { evs.push({ t: null, k: 'hab', title: (i.done ? '✓ ' : '○ ') + i.name, who: 'Hábito', ico: '🌱' }); });
    day.commitments.slice(0, 3).forEach(function (c) { evs.push({ t: null, k: 'fin', title: c.title + ' • ' + BRL(c.amount), who: 'Financeiro', ico: '💳' }); });
    if (!evs.length) return '<div class="card"><b>Hoje</b><p class="muted">Nada por aqui — dia livre.</p></div>';
    evs.sort(function (a, b) { return (a.t || '99:99').localeCompare(b.t || '99:99'); });
    return '<div class="card"><b>Linha do tempo</b><ul class="ov-tl">' + evs.slice(0, 9).map(function (e) {
      return '<li><span class="ov-t">' + esc(e.t || '··:··') + '</span><span><span aria-hidden="true">' + e.ico + '</span> ' + esc(e.title) + '<br><span class="muted">' + esc(e.who) + '</span></span></li>';
    }).join('') + '</ul></div>';
  }
  function ovWeekHtml(me, day, week) {
    var s = blk('Semana', function () {
      return '<div class="card"><b>Esta semana</b><p class="muted">' + esc(dueLabel(week.from) + ' – ' + dueLabel(week.to)) + '</p>' +
        week.days.map(function (dd) {
          var sel = dd.date === ov.date ? ' <span class="pill ok">ver</span>' : '';
          return '<button class="tx" data-ovday="' + dd.date + '" aria-label="Ver ' + esc(dueLabel(dd.date)) + '"><span class="tx-mid"><b>' + esc(ovDayTitle(dd.date)) + '</b><small>' + dd.agenda + (dd.agenda === 1 ? ' evento' : ' eventos') + ' • ' + dd.habits_done + '/' + dd.habits_total + ' hábitos</small></span><b>' + BRL(dd.income - dd.expense) + '</b>' + sel + '</button>';
        }).join('') + '</div>';
    });
    s += blk('Finanças da semana', function () {
      var f = week.finance;
      var b = '<div class="card"><b>Finanças da semana</b><p>Receitas <b class="pos">' + BRL(f.income) + '</b> • Despesas <b class="neg">' + BRL(f.expense) + '</b><br>Resultado <b>' + BRL(f.result) + '</b> <span class="muted">• do casal</span></p>';
      if (f.biggest) b += '<p class="muted">Maior despesa: <b>' + esc(f.biggest.description) + '</b> ' + BRL(f.biggest.amount) + '</p>';
      return b + '<p><a href="#/reports">Ver detalhes ›</a></p></div>';
    });
    var pair = '';
    pair += blk('Hábitos', function () { return ovHabitsCard(day); });
    pair += blk('Próximo', function () {
      if (!week.upcoming.length) return '<div class="card"><b>Próximos eventos</b><p class="muted">Nada marcado por aqui.</p></div>';
      return '<div class="card"><b>Próximos eventos</b>' + week.upcoming.map(function (e) {
        return '<p><b>' + esc(dueLabel(e.date)) + '</b> ' + esc(e.time || '') + ' ' + esc(e.title) + ' <span class="muted">• ' + esc(e.who) + '</span></p>';
      }).join('') + '<p><a href="#/calendar">Ver calendário ›</a></p></div>';
    });
    s += '<div class="ov-grid">' + pair + '</div>';
    return s;
  }
  function ovMonthHtml(me, day, mon) {
    var mode = '';
    try { mode = J.DB.moneyMode(me.id); } catch (e) { mode = 'SEPARATE'; }
    var s = blk('Mês', function () {
      return '<div class="card"><b>' + esc(monthLabel(mon.month)) + '</b><p><b>' + mon.agenda.total + '</b> compromissos (' + mon.agenda.couple + ' do casal) • <b>' +
        (mon.habits.consistency == null ? '—' : String(mon.habits.consistency).replace('.', ',') + '%') + '</b> hábitos • <b>' + BRL(mon.finance.expense) + '</b> despesas</p></div>';
    });
    s += blk('Finanças do mês', function () {
      var f = mon.finance;
      var tag = mode === 'JOINT' ? 'do casal' : '• ' + esc(ovModeVisionLabel(me));
      var b = '<div class="card"><b>Finanças de ' + esc(monthLabel(mon.month).split(' ')[0].toLowerCase()) + '</b> <span class="muted">' + tag + '</span>' +
        '<p>Receitas <b class="pos">' + BRL(f.income) + '</b> • Despesas <b class="neg">' + BRL(f.expense) + '</b><br>Resultado <b>' + BRL(f.result) + '</b> • Disponível <b>' + BRL(f.available) + '</b></p>';
      if (mode === 'SEPARATE') b += '<p class="muted">Acertos entre vocês: <a href="#/settlements">ver acertos ›</a></p>';
      return b + '<p><a href="#/reports">Ver finanças ›</a></p></div>';
    });
    var pair = '';
    pair += blk('Hábitos no mês', function () {
      if (!mon.habits.items.length) return '<div class="card"><b>Evolução dos hábitos</b><p class="muted">Sem hábitos ativos. <a href="#/habits">Criar hábito ›</a></p></div>';
      return '<div class="card"><b>Evolução dos hábitos</b>' + mon.habits.items.map(function (h) {
        return '<p>' + esc(h.name) + ' — <b>' + (h.pct == null ? '—' : String(h.pct).replace('.', ',') + '%') + '</b></p><div class="bar" role="img" aria-label="' + esc(h.name + ': ' + (h.pct == null ? 'sem dados' : h.pct + '%')) + '"><div style="width:' + Math.min(100, h.pct || 0) + '%"></div></div>';
      }).join('') + '<p><a href="#/habits">Ver hábitos ›</a></p></div>';
    });
    pair += blk('Compromissos financeiros', function () { return ovCommitCard({ commitments: mon.commitments }); });
    s += '<div class="ov-grid">' + pair + '</div>';
    return s;
  }
  function ovModeVisionLabel(me) {
    if (ov.vision === 'me') return 'sua visão';
    if (ov.vision === 'partner') return 'visão do parceiro';
    return 'do casal';
  }
  function bindOverview(v, me) {
    var pv = document.getElementById('ov-prev');
    if (pv) pv.onclick = function () {
      if (ov.mode === 'day') ov.date = J.DB.agendaAddDays(ovDate(), -1);
      else if (ov.mode === 'week') ov.date = J.DB.agendaAddDays(ovDate(), -7);
      else ov.date = J.DB.shiftMonth(ovDate().slice(0, 7), -1) + '-01';
      ovPersist(); render('dashboard');
    };
    var nx = document.getElementById('ov-next');
    if (nx) nx.onclick = function () {
      if (ov.mode === 'day') ov.date = J.DB.agendaAddDays(ovDate(), 1);
      else if (ov.mode === 'week') ov.date = J.DB.agendaAddDays(ovDate(), 7);
      else ov.date = J.DB.shiftMonth(ovDate().slice(0, 7), 1) + '-01';
      ovPersist(); render('dashboard');
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-ovm]'), function (b) {
      b.onclick = function () { ov.mode = b.dataset.ovm; ovPersist(); render('dashboard'); };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ovv]'), function (b) {
      b.onclick = function () { ov.vision = b.dataset.ovv; ovPersist(); render('dashboard'); };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ovqa]'), function (b) {
      b.onclick = function () {
        var k = b.dataset.ovqa;
        if (k === 'ag') openAgendaModal(me, null, null);
        else if (k === 'hb') location.hash = '#/habits';
        else if (k === 'tx') openTxModal(me, null, 'expense');
        else if (k === 'cap') openQuickCapture(me);
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ovhb]'), function (b) {
      b.onclick = function () {
        var id = b.dataset.ovhb, d = ovDate();
        try {
          var st = J.DB.habitOccurrenceStatus(me.id, id, d);
          if (st.done && st.completion_id) { J.DB.removeCompletion(me.id, st.completion_id); toast('Hábito desmarcado.'); }
          else { J.DB.recordCompletion(me.id, id, { completion_date: d }); toast('Hábito concluído! 🌱'); }
          render('dashboard');
        } catch (e) { toast('Não foi possível registrar.'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ovhbq]'), function (b) {
      b.onclick = function () { openHabitRecord(me, b.dataset.ovhbq, ovDate()); };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ovtk]'), function (b) {
      b.onclick = function () { tkToggle(me, b.dataset.ovtk); };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ovday]'), function (b) {
      b.onclick = function () { ov.date = b.dataset.ovday; ov.mode = 'day'; ovPersist(); render('dashboard'); };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ovretry]'), function (b) { b.onclick = function () { render('dashboard'); }; });
  }
  function blk(label, fn) {
    try { return fn(); }
    catch (e) { return '<div class="card"><b>' + esc(label) + '</b><div class="alert">Não foi possível carregar este bloco. Tente novamente.</div><button class="btn ghost" data-retry>Tentar novamente</button></div>'; }
  }
  function colCard(me, key, title, inner) {
    var closed = !!(dash.col[me.id + ':' + key]);
    return '<div class="card"><div class="row between"><b>' + title + '</b><button class="btn ghost" data-col="' + key + '" aria-label="' + (closed ? 'Expandir' : 'Recolher') + ' ' + esc(title) + '">' + (closed ? '+' : '−') + '</button></div>' + (closed ? '<p class="muted">Seção recolhida.</p>' : inner) + '</div>';
  }
  function dashInvoices(me) {
    var invs = J.DB.listInvoices(me.id, {}).filter(function (i) { return i.status !== 'cancelled' && i.status !== 'paid'; });
    var pend = 0, next = null, over = [];
    var today = todayISO();
    invs.forEach(function (i) {
      var o = J.DB.calculateInvoiceOutstanding(me.id, i.id);
      if (o > 0) {
        pend += o;
        if (!next || i.due_date < next.due_date) next = i;
        if (i.status === 'overdue') over.push({ inv: i, out: o, days: Math.round((Date.UTC(parseInt(today.slice(0, 4), 10), parseInt(today.slice(5, 7), 10) - 1, parseInt(today.slice(8, 10), 10)) - Date.UTC(parseInt(i.due_date.slice(0, 4), 10), parseInt(i.due_date.slice(5, 7), 10) - 1, parseInt(i.due_date.slice(8, 10), 10))) / 864e5) });
      }
    });
    pend = Math.round(pend * 100) / 100;
    var tag = dash.vision === 'couple' ? '' : ' <span class="muted">• do casal</span>';
    var s = '<div class="card"><b>🧾 Faturas</b>' + tag;
    if (!pend) return s + '<p class="muted">Nenhuma fatura pendente.</p><p><a href="#/invoices">Ver faturas ›</a></p></div>';
    s += '<p>Total pendente: <b>' + BRL(pend) + '</b><br><span class="muted">Próximo vencimento: ' + esc(J.DB.cardName(me.id, next.credit_card_id)) + ' ' + BRL(J.DB.calculateInvoiceOutstanding(me.id, next.id)) + ' vence ' + dueLabel(next.due_date) + '</span></p>';
    if (over.length) s += over.slice(0, 3).map(function (x) {
      return '<p>⚠️ <b>' + esc(J.DB.cardName(me.id, x.inv.credit_card_id)) + '</b> ' + BRL(x.out) + ' <span class="muted">vencida em ' + dueLabel(x.inv.due_date) + ' (' + x.days + (x.days === 1 ? ' dia' : ' dias') + ')</span> <a href="#/invoices/' + x.inv.id + '">abrir ›</a></p>';
    }).join('');
    return s + '<p><a href="#/invoices">Ver faturas ›</a></p></div>';
  }
  function dashCommitments(me) {
    var t0 = todayISO();
    var t1 = J.DB.dateAddDays(t0, 30);
    var rec = J.DB.listOccurrences(me.id, t0, t1, true).slice(0, 3);
    var parc = J.DB.upcomingInstallments(me.id, t0, t1).slice(0, 3);
    var invs = J.DB.listInvoices(me.id, {}).filter(function (i) { return i.status !== 'cancelled' && i.status !== 'paid' && i.due_date >= t0 && i.due_date <= t1; }).slice(0, 3);
    var plan = [];
    try { plan = J.DB.getUpcomingEvents(me.id, { limit: 3, to: J.DB.dateAddDays(t0, 7) }).filter(function (e) { return e.is_planned; }); } catch (e) {}
    if (!rec.length && !parc.length && !invs.length && !plan.length) return '<div class="card"><b>📅 Próximos compromissos</b><p class="muted">Não há compromissos futuros cadastrados. <a href="#/calendar">Ver calendário ›</a></p></div>';
    var s = '<div class="card"><b>📅 Próximos compromissos</b>';
    if (rec.length) s += '<p class="muted">RECORRENTES</p>' + rec.map(function (o) {
      return '<p>' + occIcon(o) + ' <b>' + esc(o.rec ? o.rec.description : 'Conta') + '</b><br><span class="muted">' + dueLabel(o.due_date) + ' • ' + BRL(o.amount) + ' • recorrente</span></p>';
    }).join('');
    if (parc.length) s += '<p class="muted">PARCELAS</p>' + parc.map(function (r) {
      return '<p>🗓️ <b>' + esc(r.purchase_name) + ' ' + r.installment_number + '/' + r.total_installments + '</b><br><span class="muted">' + dueLabel(r.due_date) + ' • ' + BRL(r.amount) + ' • parcela</span></p>';
    }).join('');
    if (invs.length) s += '<p class="muted">FATURAS</p>' + invs.map(function (i) {
      return '<p>🧾 <b>' + esc(J.DB.cardName(me.id, i.credit_card_id)) + '</b><br><span class="muted">vence ' + dueLabel(i.due_date) + ' • ' + BRL(J.DB.calculateInvoiceOutstanding(me.id, i.id)) + ' • fatura</span></p>';
    }).join('');
    if (plan.length) s += '<p class="muted">PLANEJADO</p>' + plan.map(function (e) {
      return '<p>✎ <b>' + esc(e.title) + '</b><br><span class="muted">' + dueLabel(e.event_date) + ' • ' + BRL(e.amount) + ' • planejado</span></p>';
    }).join('');
    return s + '<p><a href="#/calendar">Ver calendário completo ›</a></p></div>';
  }
  function dashRecent(me, r) {
    var from = r.from + '-01', to = r.to + '-31';
    var items = [];
    J.DB.listTx(me.id, { from: r.from, to: r.to }).forEach(function (t) { items.push({ d: t.date + (t.created_at || ''), k: 'tx', o: t }); });
    J.DB.listTransfers(me.id).forEach(function (t) {
      if (t.date >= from && t.date <= to) items.push({ d: t.date + (t.created_at || ''), k: 'tr', o: t });
    });
    J.DB.listInvoicePayments(me.id, {}).forEach(function (p) {
      if (p.payment_date >= from && p.payment_date <= to) items.push({ d: p.payment_date + (p.created_at || ''), k: 'pay', o: p });
    });
    items.sort(function (a, b) { return b.d.localeCompare(a.d); });
    var rows = items.slice(0, 8).map(function (it) {
      if (it.k === 'tx') return txRow(me, it.o);
      if (it.k === 'tr') {
        var t = it.o;
        return '<button class="tx" data-trid="' + t.id + '"><span class="tx-ic">⇄</span><span class="tx-mid"><b>Transferência</b><small>' + dueLabel(t.date) + ' • ' + esc(J.DB.accountName(me.id, t.from_account_id)) + ' → ' + esc(J.DB.accountName(me.id, t.to_account_id)) + '</small></span><b>' + BRL(t.amount) + '</b></button>';
      }
      var p = it.o, cn = '';
      try { cn = J.DB.cardName(me.id, J.DB.getInvoiceRaw(me.id, p.invoice_id).credit_card_id); } catch (e) { cn = 'Cartão'; }
      return '<div class="tx"><span class="tx-ic">🧾</span><span class="tx-mid"><b>Pagamento de fatura</b><small>' + dueLabel(p.payment_date) + ' • ' + esc(cn) + ' • ' + esc(J.DB.accountName(me.id, p.payment_account_id)) + '</small></span><b class="neg">− ' + BRL(p.amount) + '</b></div>';
    }).join('');
    return '<div class="card"><div class="row between"><b>Últimos lançamentos</b><a href="#/transactions" id="d-all">Ver tudo ›</a></div><div>' + (rows || '<p class="muted">Sem movimentações no período.</p>') + '</div></div>';
  }
  function dashTips(me, r) {
    var tips = [];
    var fYM = r.single ? r.from : thisMonth();
    var bsc = J.DB.budgetSummary(me.id, fYM);
    bsc.items.forEach(function (it) {
      if (it.status.key === 'over') tips.push('🚨 Orçamento de ' + it.name + ' excedido (' + BRL(it.spent) + ' de ' + BRL(it.limit) + ').');
      else if (it.status.key === 'warn') tips.push('⚠️ Orçamento de ' + it.name + ' atingiu ' + String(it.pct).replace('.', ',') + '%.');
    });
    var t0 = todayISO(), t3 = J.DB.dateAddDays(t0, 3), t7 = J.DB.dateAddDays(t0, 7);
    J.DB.listInvoices(me.id, {}).forEach(function (i) {
      if (i.status === 'cancelled' || i.status === 'paid') return;
      var o = J.DB.calculateInvoiceOutstanding(me.id, i.id);
      if (o <= 0) return;
      if (i.status === 'overdue') tips.push('⚠️ Existe uma fatura vencida de ' + BRL(o) + ' (' + J.DB.cardName(me.id, i.credit_card_id) + ').');
      else if (i.due_date >= t0 && i.due_date <= t3) tips.push('🧾 Fatura de ' + BRL(o) + ' vence em ' + dueLabel(i.due_date) + '.');
    });
    var n7 = J.DB.listOccurrences(me.id, t0, t7, true).length;
    if (n7) tips.push('📅 ' + n7 + (n7 === 1 ? ' compromisso pendente' : ' compromissos pendentes') + ' nos próximos 7 dias.');
    var ina = J.DB.listAccounts(me.id, 'inactive').length;
    if (ina) tips.push('🏦 ' + ina + (ina === 1 ? ' conta inativa.' : ' contas inativas.'));
    if (!tips.length) return '';
    return '<div class="card"><b>📌 Atenção</b>' + tips.slice(0, 4).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>';
  }
  function respOfPeriod(me, uid, r) {
    var txs = J.DB.listTx(me.id, { from: r.from, to: r.to, type: 'expense' }).filter(function (t) { return t.is_shared; });
    var s = 0;
    txs.forEach(function (t) {
      try {
        var ss = J.DB.getSplits(me.id, t.id);
        var f = ss.find(function (x) { return x.user_id === uid; });
        if (f) s += f.calculated_amount;
      } catch (e) { /* fora do casal: ignora */ }
    });
    return Math.round(s * 100) / 100;
  }
  function bindLink(v, id, fn) { var el = v.querySelector('#' + id); if (el) el.addEventListener('click', fn); }
  function bindDashChrome(v, me) {
    var pv = document.getElementById('p-prev'); if (pv) pv.onclick = function () { dash.month = J.DB.shiftMonth(dashRange().to, -1); if (dash.preset === 'prev') dash.preset = 'month'; dashPersist(); render('dashboard'); };
    var nx = document.getElementById('p-next'); if (nx) nx.onclick = function () { dash.month = J.DB.shiftMonth(dashRange().to, 1); if (dash.preset === 'prev') dash.preset = 'month'; dashPersist(); render('dashboard'); };
    var ps = document.getElementById('p-preset'); if (ps) ps.onchange = function () { dash.preset = ps.value; if (ps.value === 'month') dash.month = thisMonth(); dashPersist(); render('dashboard'); };
    var cf = document.getElementById('p-cf'); if (cf) cf.onchange = function () { dash.cFrom = cf.value; if (dash.cFrom && dash.cTo) { dashPersist(); render('dashboard'); } };
    var ct = document.getElementById('p-ct'); if (ct) ct.onchange = function () { dash.cTo = ct.value; if (dash.cFrom && dash.cTo) { dashPersist(); render('dashboard'); } };
    var pa = document.getElementById('p-acc'); if (pa) pa.onchange = function () { dash.account = pa.value; dashPersist(); render('dashboard'); };
    var pc = document.getElementById('p-card'); if (pc) pc.onchange = function () { dash.card = pc.value; dashPersist(); render('dashboard'); };
    var pk = document.getElementById('p-cat'); if (pk) pk.onchange = function () { dash.category = pk.value; dashPersist(); render('dashboard'); };
    var rf = document.getElementById('d-refresh'); if (rf) rf.onclick = function () { J.DB.dashInvalidate(); dash.updatedAt = 'agora'; render('dashboard'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-vv]'), function (b) { b.onclick = function () { dash.vision = b.dataset.vv; dashPersist(); render('dashboard'); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-col]'), function (b) {
      b.onclick = function () {
        var k = b.dataset.col;
        dash.col[me.id + ':' + k] = !dash.col[me.id + ':' + k];
        dashPersist(); render('dashboard');
      };
    });
    bindCatExp(v);
  }
  function rdChart(me, r, d) {
    var items = r.single
      ? [{ l: 'Receitas', v: d.income, c: 'var(--green)' }, { l: 'Despesas', v: d.expense, c: 'var(--primary-d)' }]
      : d.evolution.filter(function (e) { return e.month >= r.from && e.month <= r.to; }).map(function (e) { return { l: monthShort(e.month), v: e.income, v2: e.expense }; });
    if (r.single) {
      var max = Math.max(d.income, d.expense, 0.01);
      return '<div class="vbars" role="img" aria-label="Receitas ' + BRL(d.income) + ', despesas ' + BRL(d.expense) + '">' + items.map(function (it) {
        return '<div class="vbar"><span>' + BRL(it.v) + '</span><div style="height:' + Math.max(4, Math.round(it.v / max * 120)) + 'px;background:' + it.c + '"></div><small>' + it.l + '</small></div>';
      }).join('') + '</div>';
    }
    if (!items.length) return '<p class="muted">Sem dados no período.</p>';
    var spanMonths = (parseInt(r.to.slice(0, 4), 10) - parseInt(r.from.slice(0, 4), 10)) * 12 + (parseInt(r.to.slice(5, 7), 10) - parseInt(r.from.slice(5, 7), 10)) + 1;
    var max2 = 0.01;
    items.forEach(function (it) { max2 = Math.max(max2, it.v, it.v2); });
    return '<div class="vbars" role="img" aria-label="Evolução mensal de receitas e despesas">' + items.map(function (it) {
      return '<div class="vbar"><span>' + BRL(it.v) + '</span><div style="height:' + Math.max(4, Math.round(it.v / max2 * 100)) + 'px;background:var(--green)"></div><div style="height:' + Math.max(4, Math.round(it.v2 / max2 * 100)) + 'px;background:var(--primary-d)"></div><small>' + it.l + '<br>' + BRL(it.v2) + '</small></div>';
    }).join('') + '</div><p class="muted">Verde = receitas • vermelho = despesas.' + (spanMonths > 6 ? ' Mostrando os últimos 6 meses do período.' : '') + '</p>';
  }
  var catExp = {};
  /* Paleta determinística por categoria (só apresentação: tiles e donut). */
  var CATPAL = [['#E3EDFD', '#2F6FED'], ['#FBE7F0', '#A63C6E'], ['#E7F4EE', '#0A6E46'], ['#ECE7FB', '#6A4FD0'], ['#FBF3E3', '#A9721B'], ['#E0F2F1', '#0F766E'], ['#EDE9FE', '#7C5CD6'], ['#F5E6DC', '#A35C2E']];
  function catColor(id) { var h = 0, s = String(id || ''); for (var i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0; return CATPAL[h % CATPAL.length]; }
  function donutBlock(byCat, total) {
    if (!byCat.length || !(total > 0)) return '';
    var top = byCat.slice(0, 6);
    var restV = byCat.slice(6).reduce(function (a, c) { return a + c.value; }, 0);
    var items = top.map(function (c) { return { name: c.name, value: c.value, pct: c.pct, col: catColor(c.id)[1] }; });
    if (restV > 0.005) items.push({ name: 'Outras categorias', value: Math.round(restV * 100) / 100, pct: Math.round(restV / total * 1000) / 10, col: '#C26D8C' });
    var R = 70, C = 2 * Math.PI * R, off = 0, segs = '';
    items.forEach(function (it) {
      var len = Math.max(0, it.value / total * C);
      if (len <= 0) return;
      segs += '<circle cx="84" cy="84" r="' + R + '" fill="none" stroke="' + it.col + '" stroke-width="26" stroke-dasharray="' + len.toFixed(1) + ' ' + C.toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 84 84)"/>';
      off += len;
    });
    var svg = '<svg class="donut" viewBox="0 0 168 168" role="img" aria-label="Gastos do mês por categoria"><circle cx="84" cy="84" r="' + R + '" fill="none" stroke="var(--surface-2)" stroke-width="26"/>' + segs +
      '<text x="84" y="80" text-anchor="middle" class="dc-k">Gastos do mês</text><text x="84" y="102" text-anchor="middle" class="dc-v">' + esc(BRL(total)) + '</text></svg>';
    var leg = '<ul class="legend">' + items.map(function (it) {
      return '<li><span class="dot" style="background:' + it.col + '"></span><span class="lg-name">' + esc(it.name) + '<span class="lg-sub">' + String(it.pct).replace('.', ',') + '% do mês</span></span><span class="lg-val">' + BRL(it.value) + '</span></li>';
    }).join('') + '</ul>';
    return '<div class="card"><div class="donut-wrap">' + svg + leg + '</div></div>';
  }
  function catChart(d, scope) {
    scope = scope || 'dash';
    var max = Math.max.apply(null, d.byCat.map(function (c) { return c.value; }).concat([0.01]));
    return '<div role="img" aria-label="Gastos por categoria">' + d.byCat.map(function (c) {
      var open = !!catExp[scope + ':' + c.id];
      var kids = (c.children && c.children.length && open) ? c.children.map(function (k) {
        return '<div class="hbar sub"><span class="hl">└ ' + esc(k.icon + ' ' + k.name) + '</span><div class="ht"><div style="width:' + Math.max(2, Math.round(k.value / max * 100)) + '%"></div></div><span class="hv">' + BRL(k.value) + ' • ' + String(k.pct).replace('.', ',') + '%</span></div>';
      }).join('') : '';
      var toggle = (c.children && c.children.length)
        ? '<button class="link" data-catexp="' + scope + ':' + c.id + '" aria-expanded="' + open + '" aria-label="' + (open ? 'Recolher' : 'Expandir') + ' ' + esc(c.name) + '">' + (open ? '▾' : '▸') + '</button>'
        : '';
      return '<div class="hbar"><span class="hl">' + toggle + esc(c.icon + ' ' + c.name) + '</span><div class="ht"><div style="width:' + Math.max(2, Math.round(c.value / max * 100)) + '%"></div></div><span class="hv">' + BRL(c.value) + ' • ' + String(c.pct).replace('.', ',') + '%</span></div>' + kids;
    }).join('') + '</div>';
  }
  function bindCatExp(v) {
    Array.prototype.forEach.call(v.querySelectorAll('[data-catexp]'), function (b) {
      b.onclick = function () {
        catExp[b.dataset.catexp] = !catExp[b.dataset.catexp];
        render(here());
      };
    });
  }

  /* ============ ETAPA 2: TRANSAÇÕES ============ */
  /* ============ SUBCATEGORIAS (2 níveis): selects hierárquicos ============ */
  function catOptions(me, type, selected) {
    return J.DB.getCategoryTree(me.id, type || '', false).map(function (p) {
      var self = '<option value="' + p.id + '"' + (p.id === selected ? ' selected' : '') + '>' + esc(p.icon + ' ' + p.name) + '</option>';
      if (!p.children.length) return self;
      return '<optgroup label="' + esc(p.icon + ' ' + p.name) + '">' + self +
        p.children.map(function (k) {
          return '<option value="' + k.id + '"' + (k.id === selected ? ' selected' : '') + '>' + esc(k.icon + ' ' + k.name) + '</option>';
        }).join('') + '</optgroup>';
    }).join('');
  }
  function topCatOptions(me, type, selected) {
    return J.DB.getCategoryTree(me.id, type || '', false).map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === selected ? ' selected' : '') + '>' + esc(p.icon + ' ' + p.name) + '</option>';
    }).join('');
  }
  function subCatOptions(me, parentId, selected) {
    if (!parentId) return '<option value="">Selecione a categoria</option>';
    var kids = J.DB.getSubcategories(me.id, parentId);
    if (!kids.length) return '<option value="">Sem subcategoria</option>';
    return '<option value="">Sem subcategoria</option>' + kids.map(function (k) {
      return '<option value="' + k.id + '"' + (k.id === selected ? ' selected' : '') + '>' + esc(k.icon + ' ' + k.name) + '</option>';
    }).join('');
  }
  function splitCatSelection(me, catId) {
    if (!catId) return { parent: '', sub: '' };
    var all = J.DB.myCategories(me.id, '', true);
    var c = all.find(function (x) { return x.id === catId; });
    if (!c) return { parent: '', sub: '' };
    if (c.parent_category_id) return { parent: c.parent_category_id, sub: c.id };
    return { parent: c.id, sub: '' };
  }
  function txFParent(me) {
    if (!txF.category_id) return '';
    var s = splitCatSelection(me, txF.category_id);
    return s.parent || '';
  }
  function txFSub(me) {
    if (!txF.category_id) return '';
    return splitCatSelection(me, txF.category_id).sub;
  }
  function payerOptions(me, selected) {
    return J.DB.myCouple(me.id).users.map(function (u) {
      return '<option value="' + u.id + '"' + (u.id === (selected || me.id) ? ' selected' : '') + '>' + esc(u.nome) + '</option>';
    }).join('');
  }

  function pTrans(v, me) {
    if (!txF.month && !txF.from && !txF.to) txF.month = thisMonth();
    var rows = J.DB.listTx(me.id, txF);
    var sI = 0, sE = 0;
    rows.forEach(function (t) { t.type === 'income' ? sI += t.amount : sE += t.amount; });
    var cats = J.DB.myCategories(me.id, '');
    var html = '<div class="card sum"><div><span>Receitas</span><strong class="pos">+' + BRL(sI) + '</strong></div><div><span>Despesas</span><strong class="neg">−' + BRL(sE) + '</strong></div><div><span>Saldo</span><strong>' + BRL(Math.round((sI - sE) * 100) / 100) + '</strong></div></div>';
    if (txF.from || txF.to) html += '<div class="card"><p style="margin:0">📅 Período: <b>' + esc(txF.from || '…') + ' – ' + esc(txF.to || '…') + '</b> <button class="link" id="clr-r">voltar p/ este mês</button></p></div>';
    html += '<div class="row"><a class="btn ghost" style="text-decoration:none;text-align:center" href="#/recurring">🔁 Contas recorrentes</a><a class="btn ghost" style="text-decoration:none;text-align:center" href="#/calendar">📅 Calendário</a></div>';
    html += reviewSuggestionsHtml(me);
    html += '<div class="card"><div class="row"><input id="q" placeholder="🔍 Pesquisar…" value="' + esc(txF.search) + '"><input id="m" type="month" value="' + esc(txF.month) + '" title="Mês"></div>';
    html += '<div class="row"><select id="t"><option value="">Receitas + despesas</option><option value="income"' + (txF.type === 'income' ? ' selected' : '') + '>Só receitas</option><option value="expense"' + (txF.type === 'expense' ? ' selected' : '') + '>Só despesas</option></select>';
    html += '<select id="c"><option value="">Todas categorias</option>' + J.DB.getCategoryTree(me.id, '', false).map(function (p) {
      var sel = txF.category_id === p.id;
      return '<option value="' + p.id + '"' + (sel ? ' selected' : '') + '>' + esc(p.icon + ' ' + p.name) + (p.children.length ? ' (' + p.children.length + ')' : '') + '</option>';
    }).join('') + '</select><select id="cs" aria-label="Subcategoria"><option value="">Todas subcategorias</option>' + subCatOptions(me, txFParent(me), txFSub(me)) + '</select></div>';
    html += '<div class="row"><select id="p"><option value="">Quem pagou (todos)</option>' + J.DB.myCouple(me.id).users.map(function (u) { return '<option value="' + u.id + '"' + (txF.payer_user_id === u.id ? ' selected' : '') + '>' + esc(u.nome) + '</option>'; }).join('') + '</select>';
    html += '<select id="sh"><option value="">Tudo</option><option value="shared"' + (txF.shared === 'shared' ? ' selected' : '') + '>🤝 Compartilhadas</option><option value="individual"' + (txF.shared === 'individual' ? ' selected' : '') + '>👤 Individuais</option></select>';
    html += '<select id="a"><option value="">Todas as contas</option>' + J.DB.listAccounts(me.id, 'all').map(function (a) { return '<option value="' + a.id + '"' + (txF.account_id === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></div>';
    html += '<div class="row"><button class="btn" id="nw">+ À vista</button><button class="btn ghost" id="nw-parc">💳 Parcelada</button><a class="btn ghost" style="text-decoration:none;text-align:center" href="#/imports">📥 Importar</a></div></div>';
    html += '<div id="e"></div><div id="list">';
    if (!rows.length) {
      html += '<div class="card empty"><div class="ico">💸</div><h2>' + (J.DB.listTx(me.id, {}).length ? 'Nada por aqui' : 'Nenhum lançamento ainda') + '</h2><p class="muted">' + (J.DB.listTx(me.id, {}).length ? 'Ajuste os filtros ou o mês.' : 'Registre a primeira receita ou despesa do casal.') + '</p></div>';
    } else {
      html += rows.slice(0, txShown).map(function (t) {
        var pal2 = t.type === 'expense' ? catColor(t.category_id) : null;
        var tile2 = pal2 ? ' style="background:' + pal2[0] + ';color:' + pal2[1] + '"' : '';
        return '<button class="tx" data-id="' + t.id + '"><span class="tx-ic"' + tile2 + '>' + (t.type === 'income' ? '💰' : esc((J.DB.all().categories.find(function (c) { return c.id === t.category_id; }) || { icon: '🧾' }).icon)) + '</span>' +
          '<span class="tx-mid"><b>' + esc(t.description) + '</b><small>' + esc(t.date.split('-').reverse().join('/')) + ' • ' + esc(J.DB.catName(me.id, t.category_id)) + ' • ' + esc(J.DB.userName(me.id, t.payer_user_id)) + (t.is_shared ? ' • 🤝' : ' • 👤') + (t.credit_card_id ? ' • 💳' : '') + (t.needs_review ? ' • 👀 revisar' : '') + '</small></span>' +
          '<b class="' + (t.type === 'income' ? 'pos' : 'neg') + '">' + (t.type === 'income' ? '+' : '−') + ' ' + BRL(t.amount) + '</b></button>';
      }).join('');
      if (rows.length > txShown) html += '<button class="btn ghost" id="tx-more">Mostrar mais (' + (rows.length - txShown) + ' restantes)</button>';
    }
    html += '</div>';
    html += '<details class="card"><summary><b>🏷️ Categorias do casal (' + cats.length + ')</b></summary><div id="cats">' + J.DB.getCategoryTree(me.id, '', false).map(function (p) {
      var row = function (c, indent) {
        return '<p>' + (indent ? '└ ' : '') + esc(c.icon + ' ' + c.name) + ' <span class="pill">' + (c.type === 'income' ? 'receita' : c.type === 'expense' ? 'despesa' : 'ambos') + '</span> <span class="muted">' + J.DB.catTxCount(me.id, c.id) + '</span> <button class="link danger" data-cat="' + c.id + '">desativar</button></p>';
      };
      return row(p, false) + p.children.map(function (k) { return row(k, true); }).join('');
    }).join('') + '</div><div class="row"><input id="nc-n" placeholder="Nova categoria (ex: Farmácia)"><select id="nc-t" style="max-width:150px"><option value="expense">Despesa</option><option value="income">Receita</option><option value="both">Ambos</option></select><button class="btn" id="nc-go" style="max-width:120px">Criar</button></div><p class="muted"><a href="#/settings/categories">Gerenciar categorias e subcategorias ›</a></p><div id="ec"></div></details>';
    v.innerHTML = html;

    document.getElementById('q').oninput = function (e) { txF.search = e.target.value; txShown = 30; refreshList(me); };
    document.getElementById('m').onchange = function (e) { txF.month = e.target.value; txF.from = ''; txF.to = ''; txShown = 30; render('transactions'); };
    var clr = document.getElementById('clr-r'); if (clr) clr.onclick = function () { txF.from = ''; txF.to = ''; txF.month = thisMonth(); txShown = 30; render('transactions'); };
    var more = document.getElementById('tx-more'); if (more) more.onclick = function () { txShown += 30; render('transactions'); };
    document.getElementById('t').onchange = function (e) { txF.type = e.target.value; txShown = 30; render('transactions'); };
    document.getElementById('c').onchange = function (e) { txF.category_id = e.target.value; txShown = 30; render('transactions'); };
    var csEl = document.getElementById('cs');
    if (csEl) csEl.onchange = function (e) { txF.category_id = e.target.value || document.getElementById('c').value; txShown = 30; render('transactions'); };
    document.getElementById('p').onchange = function (e) { txF.payer_user_id = e.target.value; txShown = 30; render('transactions'); };
    document.getElementById('sh').onchange = function (e) { txF.shared = e.target.value; txShown = 30; render('transactions'); };
    document.getElementById('a').onchange = function (e) { txF.account_id = e.target.value; txShown = 30; render('transactions'); };
    document.getElementById('nw').onclick = function () { openTxModal(me, null); };
    var nwp = document.getElementById('nw-parc'); if (nwp) nwp.onclick = function () { location.hash = '#/installments'; };
    bindReviewSuggestions(v, me);
    Array.prototype.forEach.call(v.querySelectorAll('.tx'), function (b) { b.onclick = function () { openTxDetail(me, b.dataset.id); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-cat]'), function (b) {
      b.onclick = function () {
        try { J.DB.deactivateCategory(me.id, b.dataset.cat); toast('Categoria desativada.'); render('transactions'); }
        catch (e2) { document.getElementById('ec').innerHTML = err(e2); }
      };
    });
    document.getElementById('nc-go').onclick = function () {
      try { J.DB.createCategory(me.id, { name: document.getElementById('nc-n').value, type: document.getElementById('nc-t').value }); toast('Categoria criada!'); render('transactions'); }
      catch (e2) { document.getElementById('ec').innerHTML = err(e2); }
    };
  }
  function refreshList(me) {
    // re-render só da lista para não perder o foco da busca
    var rows = J.DB.listTx(me.id, txF);
    var el = document.getElementById('list');
    if (!rows.length) { el.innerHTML = '<div class="card empty"><div class="ico">🔍</div><h2>Nada por aqui</h2><p class="muted">Ajuste a busca ou os filtros.</p></div>'; return; }
    el.innerHTML = rows.slice(0, txShown).map(function (t) {
      return '<button class="tx" data-id="' + t.id + '"><span class="tx-ic">' + (t.type === 'income' ? '💰' : esc((J.DB.all().categories.find(function (c) { return c.id === t.category_id; }) || { icon: '🧾' }).icon)) + '</span>' +
        '<span class="tx-mid"><b>' + esc(t.description) + '</b><small>' + esc(t.date.split('-').reverse().join('/')) + ' • ' + esc(J.DB.catName(me.id, t.category_id)) + ' • ' + esc(J.DB.userName(me.id, t.payer_user_id)) + (t.is_shared ? ' • 🤝' : ' • 👤') + (t.credit_card_id ? ' • 💳' : '') + (t.needs_review ? ' • 👀 revisar' : '') + '</small></span>' +
        '<b class="' + (t.type === 'income' ? 'pos' : 'neg') + '">' + (t.type === 'income' ? '+' : '−') + ' ' + BRL(t.amount) + '</b></button>';
    }).join('') + (rows.length > txShown ? '<button class="btn ghost" id="tx-more-s">Mostrar mais (' + (rows.length - txShown) + ' restantes)</button>' : '');
    Array.prototype.forEach.call(el.querySelectorAll('.tx'), function (b) { b.onclick = function () { openTxDetail(me, b.dataset.id); }; });
    var m2 = document.getElementById('tx-more-s'); if (m2) m2.onclick = function () { txShown += 30; refreshList(me); };
  }

  /* ---------- modal (bottom-sheet no mobile) ---------- */
  var _lastFocus = null;
  function modalShell(inner) {
    try { _lastFocus = document.activeElement; } catch (e) { _lastFocus = null; }
    var r = document.getElementById('modal-root');
    r.innerHTML = '<div class="sheet-bg" id="mbg"><div class="sheet" role="dialog" aria-modal="true">' + inner + '</div></div>';
    document.getElementById('mbg').onclick = function (e) { if (e.target.id === 'mbg') closeModal(); };
    document.onkeydown = function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && document.getElementById('mbg')) { closeModal(); }
    };
    try {
      var sheet = r.querySelector('.sheet');
      var h = sheet.querySelector('h1,h2');
      if (h) { if (!h.id) h.id = 'modal-title'; sheet.setAttribute('aria-labelledby', 'modal-title'); }
      var f = sheet.querySelector('input,select,textarea,button');
      if (f) f.focus();
    } catch (e2) {}
  }
  function closeModal() {
    var r = document.getElementById('modal-root'); if (r) r.innerHTML = ''; editingId = null;
    document.onkeydown = null;
    try { if (_lastFocus && _lastFocus.focus) _lastFocus.focus(); } catch (e) {}
    _lastFocus = null;
  }

  /* Pessoas do casal em ordem determinística (p/ divisão e arredondamento). */
  function couplePeople(me) {
    return J.DB.memberIds(me.id).map(function (uid) {
      var u = J.DB.all().users.find(function (x) { return x.id === uid; });
      return { id: uid, nome: u ? u.nome : '—' };
    });
  }
  function splitModeOf(splits) {
    if (!splits.length) return '5050';
    var k = splits[0].split_type;
    if (k !== '5050' && k !== 'percentage' && k !== 'fixed') return '5050';
    return splits.every(function (s) { return s.split_type === k; }) ? (k === 'percentage' ? 'percent' : k) : 'percent';
  }

  function openTxModal(me, txId, preset, payPreset) {
    var t = txId ? J.DB.getTx(me.id, txId) : null;
    editingId = txId || null;
    var type = t ? t.type : (preset || 'expense');
    var existing = txId ? J.DB.getSplits(me.id, txId) : [];
    var spMode = t && t.is_shared ? splitModeOf(existing) : '5050';
    var people = couplePeople(me);
    var selCat = t ? splitCatSelection(me, t.category_id) : { parent: '', sub: '' };
    modalShell('<h2>' + (t ? 'Editar lançamento' : 'Novo lançamento') + '</h2><div id="me"></div>' +
      '<div class="seg"><button id="ty-e" class="' + (type === 'expense' ? 'on' : '') + '">− Despesa</button><button id="ty-i" class="' + (type === 'income' ? 'on' : '') + '">+ Receita</button></div>' +
      '<label>Descrição *</label><input id="f-d" maxlength="120" value="' + esc(t ? t.description : '') + '" placeholder="Ex: Mercado da semana">' +
      '<div class="row"><div><label>Valor (R$) *</label><input id="f-v" inputmode="decimal" placeholder="150,00" value="' + (t ? String(t.amount).replace('.', ',') : '') + '"></div><div><label>Data *</label><input id="f-dt" type="date" value="' + esc(t ? t.date : today()) + '"></div></div>' +
      '<label>Categoria *</label><div class="row"><select id="f-c">' + topCatOptions(me, type, selCat.parent) + '</select><button class="btn ghost" id="f-nc" style="max-width:64px" title="Nova categoria">+</button></div>' +
      '<div id="sub-row"><label>Subcategoria <span class="muted">(opcional)</span></label><select id="f-cs">' + subCatOptions(me, selCat.parent, selCat.sub) + '</select></div><div id="nc-box"></div><div id="sg-box"></div>' +
      '<label>Quem pagou / recebeu? *</label><select id="f-p">' + payerOptions(me, t ? t.payer_user_id : me.id) + '</select>' +
      '<div id="pay-toggle"><label>Pagar com</label><div class="seg" id="pay-seg"><button data-p="account">Conta</button><button data-p="card">Cartão</button></div></div>' +
      '<div id="pay-acc"><label>Conta</label><select id="f-a">' + accountOptions(me, t ? (t.account_id || null) : null, t ? (t.account_id || null) : null) + '</select></div>' +
      '<div id="pay-card"><label>Cartão de crédito</label><select id="f-cc">' + cardOptions(me, t ? (t.credit_card_id || null) : null, t ? (t.credit_card_id || null) : null) + '</select><p class="muted">Compra no cartão compromete o limite; a conta só mexe no pagamento da fatura.</p></div>' +
      '<label class="check"><input type="checkbox" id="f-s"' + (!t || t.is_shared ? ' checked' : '') + '> 🤝 Dividir com o casal <small>(desmarcado = individual)</small></label>' +
      '<div id="split-box"><label>Como dividir?</label>' +
      '<div class="seg" id="sp-seg"><button data-m="5050">50/50</button><button data-m="percent">%</button><button data-m="fixed">R$</button></div>' +
      '<div id="sp-body"></div><div id="sp-prev" class="muted"></div></div>' +
      '<label>Observações</label><input id="f-n" maxlength="500" value="' + esc(t ? t.notes : '') + '" placeholder="Opcional">' +
      '<button class="btn" id="sv">' + (t ? 'Salvar alterações' : 'Adicionar') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    var cur = type;
    var payVia = (t && t.credit_card_id) ? 'card' : (payPreset || 'account');
    var joint38 = J.DB.moneyMode(me.id) === 'JOINT'; // P38: simplifica divisão; modelo preservado
    function paintPay() {
      var useCard = (payVia === 'card' && cur === 'expense');
      document.getElementById('pay-toggle').style.display = cur === 'expense' ? '' : 'none';
      document.getElementById('pay-acc').style.display = useCard ? 'none' : '';
      document.getElementById('pay-card').style.display = useCard ? '' : 'none';
      Array.prototype.forEach.call(document.querySelectorAll('#pay-seg button'), function (b) { b.className = b.dataset.p === payVia ? 'on' : ''; });
    }
    function showSplit() { return cur === 'expense' && document.getElementById('f-s').checked; }
    function collectSplit() {
      return {
        mode: spMode,
        entries: people.map(function (p) {
          var el = document.getElementById('sp-' + p.id);
          var raw = el ? el.value : '';
          return spMode === 'fixed' ? { user_id: p.id, amount: raw } : { user_id: p.id, pct: raw };
        })
      };
    }
    function paintSplit() {
      var cb0 = document.getElementById('f-s');
      if (joint38 && cur === 'expense' && !t) { // tudo junto, novo: despesa do casal, sem configurar divisão
        document.getElementById('split-box').style.display = 'none';
        if (cb0 && cb0.parentElement) cb0.parentElement.style.display = 'none';
        return;
      }
      if (cb0 && cb0.parentElement && cur === 'expense') cb0.parentElement.style.display = '';
      document.getElementById('split-box').style.display = showSplit() ? '' : 'none';
      if (!showSplit()) return;
      var btns = document.querySelectorAll('#sp-seg button');
      Array.prototype.forEach.call(btns, function (b) { b.className = b.dataset.m === spMode ? 'on' : ''; });
      var body = '';
      if (spMode === '5050') {
        body = '<p class="muted">Metade para cada um, calculado na hora.</p>';
      } else {
        body = people.map(function (p) {
          var prev = existing.find(function (s) { return s.user_id === p.id; }) || {};
          var val = '';
          if (t && t.is_shared) {
            if (spMode === 'percent') val = (prev.percentage != null ? String(prev.percentage).replace('.', ',') : (prev.calculated_amount != null && t.amount ? String(Math.round(prev.calculated_amount / t.amount * 10000) / 100).replace('.', ',') : ''));
            else val = (prev.fixed_amount != null ? String(prev.fixed_amount).replace('.', ',') : '');
          } else {
            val = spMode === 'percent' ? (people.length > 1 ? '50' : '100') : '';
          }
          return '<div class="split-row"><span>' + esc(p.nome.split(' ')[0]) + '</span><input id="sp-' + p.id + '" value="' + esc(val) + '" inputmode="decimal" placeholder="' + (spMode === 'percent' ? '% (ex: 60)' : 'R$ (ex: 600)') + '"></div>';
        }).join('');
      }
      document.getElementById('sp-body').innerHTML = body;
      Array.prototype.forEach.call(document.querySelectorAll('#sp-body input'), function (inp) { inp.oninput = paintPreview; });
      paintPreview();
    }
    function paintPreview() {
      var el = document.getElementById('sp-prev');
      if (spMode === '5050') {
        try {
          var r = J.DB.buildSplits(me.id, J.DB.parseAmount(document.getElementById('f-v').value || '0'), { mode: '5050', entries: [] });
          el.innerHTML = r.rows.map(function (s) { return esc(firstName(me, s.user_id)) + ': <b>' + BRL(s.calculated_amount) + '</b>'; }).join(' • ');
        } catch (e2) { el.textContent = 'Informe o valor para ver a divisão.'; }
        return;
      }
      try {
        var amt = J.DB.parseAmount(document.getElementById('f-v').value || '0');
        var r2 = J.DB.buildSplits(me.id, amt, collectSplit());
        el.innerHTML = r2.rows.map(function (s) {
          var tag = s.split_type === 'percentage' ? s.percentage.toString().replace('.', ',') + '%' : '';
          return esc(firstName(me, s.user_id)) + ': <b>' + BRL(s.calculated_amount) + '</b>' + (tag ? ' (' + tag + ')' : '');
        }).join(' • ');
      } catch (e3) { el.innerHTML = '<span style="color:var(--primary-d)">' + esc(e3.message) + '</span>'; }
    }
    function firstName(me_, uid) { return J.DB.userName(me_, uid).replace(' (você)', ''); }
    function paintCats(nt, keepParent, keepSub) {
      var fc = document.getElementById('f-c'), fs = document.getElementById('f-cs');
      fc.innerHTML = topCatOptions(me, nt || cur, keepParent || '');
      var pid = fc.value;
      fs.innerHTML = subCatOptions(me, pid, keepSub || '');
    }
    function paintSuggestion() {
      var box = document.getElementById('sg-box');
      if (!box) return;
      try {
        var cid = document.getElementById('f-c').value;
        var cat = J.DB.myCategories(me.id, '').find(function (c) { return c.id === cid; });
        if (!cat || cat.parent_category_id || J.DB.normalizeDescription(cat.name) !== 'outros') { box.innerHTML = ''; return; }
        var hit = J.DB.suggestCategory(me.id, {
          description: document.getElementById('f-d').value, type: cur,
          payer_user_id: document.getElementById('f-p').value, date: document.getElementById('f-dt').value
        });
        if (!hit) { box.innerHTML = ''; return; }
        var pct = Math.round(hit.confidence * 100);
        box.innerHTML = '<div class="card" style="margin:8px 0"><b>💡 Categoria sugerida: ' + esc(J.DB.catDisplayName(me.id, hit.category_id)) + ' (' + pct + '%)</b><p class="muted">' + esc(hit.reason) + '</p><button class="btn ghost" id="sg-use">Usar sugestão</button></div>';
        document.getElementById('sg-use').onclick = function () {
          var sp = splitCatSelection(me, hit.category_id);
          document.getElementById('f-c').value = sp.parent || document.getElementById('f-c').value;
          document.getElementById('f-cs').innerHTML = subCatOptions(me, document.getElementById('f-c').value, sp.sub);
          box.innerHTML = '';
          toast('Categoria aplicada. Salve para confirmar.');
        };
      } catch (e) { box.innerHTML = ''; }
    }
    function setType(nt) {
      cur = nt;
      document.getElementById('ty-e').className = nt === 'expense' ? 'on' : '';
      document.getElementById('ty-i').className = nt === 'income' ? 'on' : '';
      paintCats(nt, '', '');
      paintSplit(); paintPay();
    };
    document.getElementById('ty-e').onclick = function () { setType('expense'); paintSuggestion(); };
    document.getElementById('ty-i').onclick = function () { setType('income'); paintSuggestion(); };
    document.getElementById('f-s').onchange = paintSplit;
    document.getElementById('f-v').oninput = paintPreview;
    document.getElementById('f-d').onchange = paintSuggestion;
    document.getElementById('f-c').onchange = function () {
      document.getElementById('f-cs').innerHTML = subCatOptions(me, document.getElementById('f-c').value, '');
      paintSuggestion();
    };
    Array.prototype.forEach.call(document.querySelectorAll('#sp-seg button'), function (b) { b.onclick = function () { spMode = b.dataset.m; paintSplit(); }; });
    Array.prototype.forEach.call(document.querySelectorAll('#pay-seg button'), function (b) { b.onclick = function () { payVia = b.dataset.p; paintPay(); }; });
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('f-nc').onclick = function () {
      document.getElementById('nc-box').innerHTML = '<div class="row"><input id="nn" placeholder="Nome da categoria"><button class="btn" id="ng" style="max-width:110px">Criar</button></div>';
      document.getElementById('ng').onclick = function () {
        try { var c = J.DB.createCategory(me.id, { name: document.getElementById('nn').value, type: cur }); paintCats(cur, c.id, ''); document.getElementById('nc-box').innerHTML = ''; toast('Categoria criada!'); }
        catch (e2) { document.getElementById('me').innerHTML = err(e2); }
      };
    };
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var useCard = (payVia === 'card' && cur === 'expense');
        var catFinal = document.getElementById('f-cs').value || document.getElementById('f-c').value;
        var data = { type: cur, description: document.getElementById('f-d').value, amount: document.getElementById('f-v').value, date: document.getElementById('f-dt').value, category_id: catFinal, payer_user_id: document.getElementById('f-p').value, account_id: useCard ? '' : document.getElementById('f-a').value, credit_card_id: useCard ? document.getElementById('f-cc').value : '', is_shared: (joint38 && cur === 'expense' && !t) ? true : document.getElementById('f-s').checked, notes: document.getElementById('f-n').value };
        if (data.type === 'expense' && data.is_shared) data.split = (joint38 && cur === 'expense' && !t) ? { mode: '5050', entries: [] } : collectSplit();
        if (editingId) { J.DB.updateTx(me.id, editingId, data); toast('Alterações salvas!'); }
        else { J.DB.createTx(me.id, data); toast(cur === 'income' ? 'Receita adicionada! 💰' : 'Despesa adicionada!'); }
        var back = here(); closeModal(); render(back);
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
    paintSplit(); paintPay(); paintSuggestion();
    if (joint38) { var cbx = document.getElementById('f-s'); if (cbx && cbx.parentElement && !document.getElementById('joint-note')) { var jn = document.createElement('p'); jn.className = 'muted'; jn.id = 'joint-note'; jn.textContent = 'No modo Tudo junto, novas despesas entram no dinheiro do casal. Quem pagou fica registrado.'; cbx.parentElement.parentElement.insertBefore(jn, cbx.parentElement); } }
  }

  function openTxDetail(me, txId) {
    var t;
    try { t = J.DB.getTx(me.id, txId); } catch (e) { toast('Transação não encontrada.'); return; }
    var creator = J.DB.userName(me.id, t.created_by);
    var origin = J.DB.txOrigin(me.id, txId);
    var originHtml = origin ? '<br>🔁 Origem: Conta recorrente <b>' + esc(origin.recurring.description) + '</b> • vencimento ' + dueLabel(origin.occurrence.due_date) : '';
    var splitHtml = '';
    var joint38 = J.DB.moneyMode(me.id) === 'JOINT';
    var catParent = J.DB.catParent(me.id, t.category_id);
    var catSelf = J.DB.catGet(me.id, t.category_id);
    var catLine = (catParent && catSelf)
      ? '<p>Categoria: <b>' + esc(catParent.name) + '</b><br>Subcategoria: <b>' + esc(catSelf.icon + ' ' + catSelf.name) + '</b></p>'
      : '<p>Categoria: <b>' + esc(J.DB.catDisplayPath(me.id, t.category_id)) + '</b></p>';
    if (joint38 && t.type === 'expense') {
      splitHtml = '<div class="card" style="margin:12px 0"><b>Despesa do casal</b><p class="muted">Essa despesa faz parte do dinheiro do casal. Pago por <b>' + esc(personName(me, t.payer_user_id)) + '</b> — registrado para histórico e transparência.</p></div>';
    }
    if (t.type === 'expense' && t.is_shared && !joint38) {
      var ss = J.DB.getSplits(me.id, txId);
      splitHtml = '<div class="card" style="margin:12px 0"><b>Divisão da despesa</b><p class="muted">Valor total: <b>' + BRL(t.amount) + '</b> • Quem pagou: <b>' + esc(personName(me, t.payer_user_id)) + '</b></p>' + ss.map(function (s) {
        var tag = s.split_type === 'percentage' ? ' (' + String(s.percentage).replace('.', ',') + '%)' : (s.split_type === '5050' ? ' (50/50)' : ' (fixo)');
        return '<p>' + personAvatar(s.user_id, personName(me, s.user_id)) + ' ' + esc(personName(me, s.user_id)) + ' assume: <b>' + BRL(s.calculated_amount) + '</b><span class="muted">' + tag + '</span></p>';
      }).join('') + '</div>';
    }
    modalShell('<span class="pill ' + (t.type === 'income' ? 'ok' : '') + '">' + (t.type === 'income' ? 'Receita' : 'Despesa') + (t.is_shared ? ' • 🤝 compartilhada' : ' • 👤 individual') + '</span>' +
      '<h1>' + (t.type === 'income' ? '+' : '−') + ' ' + BRL(t.amount) + '</h1><h2>' + esc(t.description) + '</h2>' +
      '<p class="muted">' + esc(t.date.split('-').reverse().join('/')) + ' • ' + esc(J.DB.catName(me.id, t.category_id)) + '</p>' + catLine +
      '<p>Pagou/recebeu: <b>' + esc(J.DB.userName(me.id, t.payer_user_id)) + '</b><br>' + (t.credit_card_id ? 'Cartão: <b>💳 ' + esc(J.DB.cardName(me.id, t.credit_card_id)) + '</b>' : 'Conta: <b>' + esc(J.DB.accountName(me.id, t.account_id)) + '</b>') + (t.needs_review ? '<br>👀 <b>Marcada para revisão por regra automática</b>' : '') + '<br>Lançado por: ' + esc(creator) + (t.notes ? '<br>📝 ' + esc(t.notes) : '') + originHtml + '</p>' + splitHtml +
      '<div class="row"><button class="btn ghost" id="ed">Editar</button><button class="btn ghost" id="del" style="color:var(--primary-d)">Excluir</button></div><button class="btn" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('ed').onclick = function () { openTxModal(me, txId); };
    document.getElementById('del').onclick = function () {
      if (!confirm('Excluir este lançamento?')) return;
      try { J.DB.deleteTx(me.id, txId); closeModal(); toast('Transação excluída.'); render('transactions'); }
      catch (e2) { toast('Não foi possível excluir. Tente de novo.'); }
    };
  }

  /* ============ ETAPA 3: ACERTOS ============ */
  /* P38: /settlements no Tudo junto — histórico preservado, sem nova obrigação. */
  function pSettleJoint(v, me, eng) {
    var hist0 = J.DB.listSettlements(me.id);
    var head = '<div class="card center"><h1>⚖️ Acertos</h1>' +
      '<p class="muted">Vocês administram o dinheiro em conjunto. No modo "Tudo junto", novas despesas não geram acertos entre vocês.</p>' +
      '<details class="muted"><summary>Acertos anteriores</summary><p>Os acertos registrados antes da mudança continuam no histórico. Nada foi apagado ou alterado.</p></details></div>';
    var people = eng.people.map(function (p) {
      var nm = personName(me, p.user_id);
      return '<div class="card"><div class="row between"><span>' + personAvatar(p.user_id, nm) + ' <b>' + esc(nm) + '</b></span><b>' + BRL(p.paid) + '</b></div>' +
        '<p class="muted">Pagou em despesas compartilhadas (histórico preservado).</p></div>';
    }).join('');
    var rows = J.DB.listTx(me.id, { type: 'expense' }).filter(function (t) { return t.is_shared; });
    var list = rows.length ? rows.map(function (t) {
      return '<button class="tx" data-id="' + t.id + '" aria-label="' + esc(t.description + ', ' + BRL(t.amount) + ', pago por ' + personName(me, t.payer_user_id)) + '"><span class="tx-mid"><b>' + esc(t.description) + '</b><small>' + esc(t.date.split('-').reverse().join('/')) + ' • Pago por ' + esc(personName(me, t.payer_user_id)) + ' • Despesa do casal</small></span><b class="neg">− ' + BRL(t.amount) + '</b></button>';
    }).join('') : '';
    v.innerHTML = head + people + (list ? '<h2>Despesas do casal</h2>' + list : '');
    Array.prototype.forEach.call(v.querySelectorAll('.tx'), function (b) { b.onclick = function () { openTxDetail(me, b.dataset.id); }; });
    if (hist0.length) {
      var hd = document.createElement('div');
      hd.className = 'card';
      hd.innerHTML = '<b>Histórico</b>' + hist0.map(function (s) {
        return '<p>' + esc(dueLabel(s.date)) + '<br>' + esc(personName(me, s.from_user_id)) + ' → ' + esc(personName(me, s.to_user_id)) + ' <b>' + BRL(s.amount) + '</b> <span class="pill ok">Pago</span> <button class="link danger" data-stdel="' + s.id + '">estornar</button></p>';
      }).join('');
      v.appendChild(hd);
      Array.prototype.forEach.call(hd.querySelectorAll('[data-stdel]'), function (b) {
        b.onclick = function () {
          if (!confirm('Excluir este acerto? Essa ação removerá o registro do acerto.')) return;
          try { J.DB.deleteSettlement(me.id, b.dataset.stdel); toast('Acerto estornado.'); render('settlements'); }
          catch (e2) { toast('Não foi possível estornar. Tente de novo.'); }
        };
      });
    }
  }
  function pSettle(v, me) {
    var eng = J.DB.settle(me.id);
    if (J.DB.moneyMode(me.id) === 'JOINT') { pSettleJoint(v, me, eng); return; }
    var head;
    if (eng.sharedCount === 0) {
      head = '<div class="card empty"><div class="ico">⚖️</div><h2>Nenhuma despesa compartilhada</h2><p class="muted">Quando vocês dividirem uma despesa, o acerto aparece aqui.</p></div>';
    } else {
      head = '<div class="card center"><p class="muted">' + eng.sharedCount + ' despesas compartilhadas • total ' + BRL(eng.sharedTotal) + '</p>';
      if (eng.debt) {
        var iAmFrom = eng.debt.from === me.id, iAmTo = eng.debt.to === me.id;
        head += '<p class="muted">Pendente</p><h1>' + BRL(eng.debt.amount) + '</h1>' + settleDirectionHtml(me, eng.debt) +
          '<p class="muted">' + (iAmFrom ? 'Você precisa repassar esse valor.' : iAmTo ? 'Esse valor precisa ser repassado para você.' : 'Acerto pendente entre vocês.') + '</p>' +
          '<details class="muted"><summary>Por que existe esse acerto?</summary><p>Alguém pagou mais do que sua responsabilidade nas despesas compartilhadas. Os valores vêm da divisão oficial de cada despesa.</p></details>';
      } else {
        head += '<h1>Tudo certo ✅</h1><p class="muted">Ninguém deve nada a ninguém.</p>';
      }
      head += '</div>';
    }
    var people = eng.people.map(function (p) {
      var cls = p.net > 0 ? 'pos' : (p.net < 0 ? 'neg' : '');
      var nm = personName(me, p.user_id);
      return '<div class="card"><div class="row between"><span>' + personAvatar(p.user_id, nm) + ' <b>' + esc(nm) + '</b></span><b class="' + cls + '">' + BRL(p.net) + '</b></div>' +
        '<p class="muted">Pagou ' + BRL(p.paid) + ' • Responsabilidade ' + BRL(p.owed) + '</p></div>';
    }).join('');
    var rows = J.DB.listTx(me.id, { type: 'expense' }).filter(function (t) { return t.is_shared; });
    var list = rows.length ? rows.map(function (t) {
      var ss = J.DB.getSplits(me.id, t.id);
      var det = ss.map(function (s) { return esc(personName(me, s.user_id)) + ' assume ' + BRL(s.calculated_amount); }).join(' • ');
      return '<button class="tx" data-id="' + t.id + '" aria-label="' + esc(t.description + ', ' + BRL(t.amount) + ', pago por ' + personName(me, t.payer_user_id)) + '"><span class="tx-mid"><b>' + esc(t.description) + '</b><small>' + esc(t.date.split('-').reverse().join('/')) + ' • Pago por ' + esc(personName(me, t.payer_user_id)) + '<br>' + det + '</small></span><b class="neg">− ' + BRL(t.amount) + '</b></button>';
    }).join('') : '';
    v.innerHTML = head + people + (list ? '<h2>Despesas que geraram o acerto</h2>' + list : '');
    Array.prototype.forEach.call(v.querySelectorAll('.tx'), function (b) { b.onclick = function () { openTxDetail(me, b.dataset.id); }; });
    if (eng.debt) {
      var reg = document.createElement('button');
      reg.className = 'btn'; reg.id = 'st-new'; reg.textContent = 'Registrar acerto (' + BRL(eng.debt.amount) + ')';
      v.appendChild(reg);
      reg.onclick = function () { openSettlementModal(me); };
    }
    var hist = J.DB.listSettlements(me.id);
    if (hist.length) {
      var hd = document.createElement('div');
      hd.className = 'card';
      hd.innerHTML = '<b>Histórico</b>' + hist.map(function (s) {
        return '<p>' + esc(dueLabel(s.date)) + '<br>' + esc(personName(me, s.from_user_id)) + ' → ' + esc(personName(me, s.to_user_id)) + ' <b>' + BRL(s.amount) + '</b> <span class="pill ok">Pago</span> <button class="link danger" data-stdel="' + s.id + '">estornar</button></p>';
      }).join('');
      v.appendChild(hd);
      Array.prototype.forEach.call(hd.querySelectorAll('[data-stdel]'), function (b) {
        b.onclick = function () {
          if (!confirm('Excluir este acerto? Essa ação removerá o registro do acerto.')) return;
          try { J.DB.deleteSettlement(me.id, b.dataset.stdel); toast('Acerto estornado.'); render('settlements'); }
          catch (e2) { toast('Não foi possível estornar. Tente de novo.'); }
        };
      });
    }
  }
  function openSettlementModal(me) {
    if (J.DB.moneyMode(me.id) === 'JOINT') { toast('No modo Tudo junto, novas despesas não geram acertos.'); return; }
    var eng = J.DB.calculateSettlementBalance(me.id);
    if (!eng.debt) { toast('Não há acerto pendente.'); return; }
    modalShell('<h2>Registrar acerto</h2><div id="me"></div>' +
      '<p>' + esc(J.DB.userName(me.id, eng.debt.from)) + ' deve <b>' + BRL(eng.debt.amount) + '</b> para ' + esc(J.DB.userName(me.id, eng.debt.to)) + '</p>' +
      '<label>Valor pago (R$) *</label><input id="f-sv" inputmode="decimal" value="' + String(eng.debt.amount).replace('.', ',') + '">' +
      '<div class="row"><div><label>Data *</label><input id="f-sd" type="date" value="' + today() + '"></div></div>' +
      '<label>Observação</label><input id="f-sn" maxlength="300" placeholder="Opcional (ex: PIX)">' +
      '<button class="btn" id="sv">Confirmar acerto</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; btn.disabled = true;
      try {
        J.DB.createSettlement(me.id, { amount: document.getElementById('f-sv').value, date: document.getElementById('f-sd').value, notes: document.getElementById('f-sn').value });
        closeModal(); toast('Acerto registrado! ✅'); render('settlements');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); btn.disabled = false; }
    };
  }

  /* ============ ETAPA 5: ORÇAMENTO ============ */
  var bYM = '';
  var editingBudget = null;
  function expCats(me) { return J.DB.myCategories(me.id, 'expense'); }
  function statusPill(st) {
    var cls = st.key === 'over' ? 'over' : st.key === 'warn' ? 'warn' : 'ok';
    return '<span class="pill ' + cls + '">' + st.icon + ' ' + st.label + '</span>';
  }
  function pBudget(v, me) {
    if (!bYM) bYM = thisMonth();
    var s = J.DB.budgetSummary(me.id, bYM);
    var html = '<div class="card"><h1>Orçamento</h1><p class="muted">Planeje quanto vocês pretendem gastar neste mês.</p>' +
      '<div class="per-row"><button class="pnav" id="b-prev" aria-label="Mês anterior">‹</button><strong>' + esc(monthLabel(bYM)) + '</strong><button class="pnav" id="b-next" aria-label="Próximo mês">›</button></div>' +
      '<div class="row"><input type="month" id="b-m" value="' + esc(bYM) + '" aria-label="Mês e ano"><button class="btn ghost" id="b-now">Este mês</button></div></div>';
    if (!s.items.length && !s.unbudgeted.length) {
      html += '<div class="card empty"><div class="ico">📊</div><h2>Ainda não há orçamento definido.</h2><p class="muted">Nenhum orçamento definido para este mês.</p><button class="btn" id="b-add0">Criar primeiro orçamento</button></div>';
    } else {
      html += '<div class="card"><b>Orçamento total: ' + BRL(s.total) + '</b><p>Gasto: <b class="neg">' + BRL(s.spent) + '</b> • Restante: <b>' + BRL(s.remaining) + '</b></p>' +
        (s.pct == null ? '<p class="muted">Nenhum orçamento definido para este mês.</p>' : '<div class="bar"><div style="width:' + Math.min(100, s.pct) + '%"></div></div><p class="muted">' + String(s.pct).replace('.', ',') + '% utilizado</p>') + '</div>';
      html += s.items.map(function (it) {
        var sub = it.is_subcategory ? ' style="margin-left:16px"' : '';
        var ctx = it.is_subcategory ? '<br><span class="muted">' + esc(it.parent_name) + ' → aqui</span>' : '';
        return '<div class="card"' + sub + '><b>' + (it.is_subcategory ? '└ ' : '') + esc(it.icon + ' ' + it.name) + '</b> ' + statusPill(it.status) + ctx +
          '<p class="muted">Orçamento: ' + BRL(it.limit) + ' • Gasto: ' + BRL(it.spent) + ' • Restante: ' + BRL(it.remaining) + '</p>' +
          '<div class="bar"><div style="width:' + Math.min(100, it.pct) + '%"></div></div><p class="muted">Utilizado: ' + String(it.pct).replace('.', ',') + '%</p>' +
          '<div class="row"><button class="btn ghost" data-bed="' + it.id + '">Editar</button><button class="btn ghost" data-bdel="' + it.id + '" style="color:var(--primary-d)">Remover</button></div></div>';
      }).join('');
      if (s.unbudgeted.length) {
        html += '<div class="card"><b>Despesas sem orçamento</b><p class="muted">Gastos em categorias sem limite — não entram no total do orçamento.</p>' +
          s.unbudgeted.map(function (u) { return '<p>' + esc(u.icon + ' ' + u.name) + ' — <b>' + BRL(u.spent) + '</b></p>'; }).join('') + '</div>';
      }
      html += '<button class="btn" id="b-add">+ Adicionar orçamento</button>';
    }
    html += '<div id="e"></div>';
    v.innerHTML = html;
    document.getElementById('b-prev').onclick = function () { bYM = J.DB.shiftMonth(bYM, -1); render('budget'); };
    document.getElementById('b-next').onclick = function () { bYM = J.DB.shiftMonth(bYM, 1); render('budget'); };
    document.getElementById('b-m').onchange = function (e) { if (e.target.value) { bYM = e.target.value; render('budget'); } };
    document.getElementById('b-now').onclick = function () { bYM = thisMonth(); render('budget'); };
    var a0 = document.getElementById('b-add0'); if (a0) a0.onclick = function () { openBudgetModal(me, null); };
    var a1 = document.getElementById('b-add'); if (a1) a1.onclick = function () { openBudgetModal(me, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-bed]'), function (b) { b.onclick = function () { openBudgetModal(me, b.dataset.bed); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-bdel]'), function (b) {
      b.onclick = function () {
        if (!confirm('Remover este orçamento? Os lançamentos e a categoria serão mantidos.')) return;
        try { J.DB.deleteBudget(me.id, b.dataset.bdel); toast('Orçamento removido.'); render('budget'); }
        catch (e2) { document.getElementById('e').innerHTML = err(e2); }
      };
    });
  }
  function openBudgetModal(me, bid) {
    var b = null, list = J.DB.listBudgets(me.id, bYM);
    if (bid) { b = list.find(function (x) { return x.id === bid; }); if (!b) { toast('Orçamento não encontrado.'); return; } }
    var tree = J.DB.getCategoryTree(me.id, 'expense', false);
    var flat = [];
    tree.forEach(function (p) { flat.push(p); p.children.forEach(function (k) { flat.push(k); }); });
    var cats = flat.filter(function (c) { return !b || c.id === b.category_id || !list.some(function (x) { return x.category_id === c.id; }); });
    var catName = b ? J.DB.catName(me.id, b.category_id) : '';
    modalShell('<h2>' + (b ? 'Editar orçamento' : 'Novo orçamento') + '</h2><div id="me"></div>' +
      (b ? '<p><b>' + esc(catName) + '</b> • ' + esc(monthLabel(bYM)) + '</p>'
        : '<label>Categoria *</label><select id="f-bc">' + tree.map(function (p) {
          var self = (!list.some(function (x) { return x.category_id === p.id; })) ? '<option value="' + p.id + '">' + esc(p.icon + ' ' + p.name) + '</option>' : '';
          var kids = p.children.filter(function (k) { return !list.some(function (x) { return x.category_id === k.id; }); });
          var grp = kids.length ? '<optgroup label="' + esc(p.icon + ' ' + p.name) + '">' + kids.map(function (k) { return '<option value="' + k.id + '">' + esc(k.icon + ' ' + k.name) + '</option>'; }).join('') + '</optgroup>' : '';
          return self + grp;
        }).join('') + '</select><p class="muted">Dica: orçar a principal já cobre as filhas; orçar uma filha detalha sem duplicar o total.</p>') +
      '<label>Valor limite (R$) *</label><input id="f-bv" inputmode="decimal" placeholder="1.000,00" value="' + (b ? String(b.amount).replace('.', ',') : '') + '">' +
      '<label>Mês *</label><input id="f-bm" type="month" value="' + esc(bYM) + '">' +
      '<button class="btn" id="sv">' + (b ? 'Salvar' : 'Adicionar') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var ym = document.getElementById('f-bm').value || bYM;
        if (b) J.DB.updateBudget(me.id, bid, { amount: document.getElementById('f-bv').value, month: ym.slice(5, 7), year: ym.slice(0, 4) });
        else J.DB.createBudget(me.id, { category_id: document.getElementById('f-bc').value, amount: document.getElementById('f-bv').value, month: ym.slice(5, 7), year: ym.slice(0, 4) });
        closeModal(); bYM = ym; toast(b ? 'Orçamento atualizado!' : 'Orçamento criado!'); render('budget');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }

  /* ============ ETAPA 5: METAS ============ */
  function goalDeadFmt(dl) {
    if (!dl) return 'Sem prazo';
    return MESES[parseInt(dl.slice(5, 7), 10) - 1] + ' de ' + dl.slice(0, 4);
  }
  function goalStatusPill(g) {
    if (g.status === 'completed') return '<span class="pill ok">🎉 Meta concluída</span>';
    if (g.status === 'archived') return '<span class="pill">Arquivada</span>';
    return '<span class="pill">Ativa</span>';
  }
  function goalSuggestion(g) {
    if (!g.deadline || g.status !== 'active') return '';
    var ref = thisMonth();
    var left = (parseInt(g.deadline.slice(0, 4), 10) - parseInt(ref.slice(0, 4), 10)) * 12 + (parseInt(g.deadline.slice(5, 7), 10) - parseInt(ref.slice(5, 7), 10));
    if (left <= 0) return '<p class="muted">Prazo encerrado</p>';
    var pr = J.DB.goalProgress(g);
    return '<p class="muted">Sugestão de contribuição mensal: <b>' + BRL(Math.round(pr.remaining / left * 100) / 100) + '</b></p>';
  }
  function pGoals(v, me) {
    var all = J.DB.listGoals(me.id, true);
    var open = all.filter(function (g) { return g.status !== 'archived'; });
    var arch = all.filter(function (g) { return g.status === 'archived'; });
    var html = '<div class="card"><h1>Metas</h1><p class="muted">Transformem seus planos em objetivos financeiros.</p><button class="btn" id="g-new">+ Nova meta</button></div><div id="e"></div>';
    if (!open.length) {
      html += '<div class="card empty"><div class="ico">🎯</div><h2>Nenhuma meta ainda</h2><p class="muted">Crie a primeira meta do casal.</p></div>';
    } else {
      html += open.map(function (g) { return goalCard(me, g); }).join('');
    }
    if (arch.length) {
      html += '<details class="card"><summary><b>Arquivadas (' + arch.length + ')</b></summary>' + arch.map(function (g) {
        return '<p><b>' + esc(g.name) + '</b> <span class="muted">' + BRL(g.current_amount) + ' de ' + BRL(g.target_amount) + '</span> <button class="link" data-gre="' + g.id + '">reativar</button> <button class="link" data-gdet="' + g.id + '">detalhes</button></p>';
      }).join('') + '</details>';
    }
    v.innerHTML = html;
    document.getElementById('g-new').onclick = function () { openGoalModal(me, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-gdet]'), function (b) { b.onclick = function () { openGoalDetail(me, b.dataset.gdet, false); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-gre]'), function (b) {
      b.onclick = function () { try { J.DB.reactivateGoal(me.id, b.dataset.gre); toast('Meta reativada!'); render('goals'); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    });
  }
  function goalCard(me, g) {
    var pr = J.DB.goalProgress(g);
    return '<div class="card"><div class="row between"><b>' + esc(g.name) + '</b>' + goalStatusPill(g) + '</div>' +
      (g.description ? '<p class="muted">' + esc(g.description) + '</p>' : '') +
      '<p>' + BRL(g.current_amount) + ' de ' + BRL(g.target_amount) + ' • <b>' + String(pr.pct).replace('.', ',') + '% concluído</b><br><span class="muted">Faltam ' + BRL(pr.remaining) + ' • Prazo: ' + esc(cap(goalDeadFmt(g.deadline))) + '</span></p>' +
      '<div class="bar"><div style="width:' + pr.pct + '%"></div></div>' + goalSuggestion(g) +
      '<div class="row"><button class="btn ghost" data-gdet="' + g.id + '">Detalhes e valores</button></div></div>';
  }
  function openGoalModal(me, gid) {
    var g = gid ? J.DB.getGoal(me.id, gid) : null;
    modalShell('<h2>' + (g ? 'Editar meta' : 'Nova meta') + '</h2><div id="me"></div>' +
      '<label>Nome *</label><input id="f-gn" maxlength="80" value="' + esc(g ? g.name : '') + '" placeholder="Ex: Viagem">' +
      '<label>Descrição</label><input id="f-gd" maxlength="500" value="' + esc(g ? g.description : '') + '" placeholder="Opcional">' +
      '<div class="row"><div><label>Objetivo (R$) *</label><input id="f-gt" inputmode="decimal" value="' + (g ? String(g.target_amount).replace('.', ',') : '') + '"></div>' +
      '<div><label>Já guardado (R$)</label><input id="f-gc" inputmode="decimal" value="' + (g ? String(g.current_amount).replace('.', ',') : '') + '"></div></div>' +
      '<label>Prazo</label><input id="f-gp" type="date" value="' + esc(g ? g.deadline : '') + '">' +
      '<button class="btn" id="sv">' + (g ? 'Salvar' : 'Criar meta') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var data = { name: document.getElementById('f-gn').value, description: document.getElementById('f-gd').value, target_amount: document.getElementById('f-gt').value, current_amount: document.getElementById('f-gc').value, deadline: document.getElementById('f-gp').value };
        if (g) J.DB.updateGoal(me.id, gid, data); else J.DB.createGoal(me.id, data);
        closeModal(); toast(g ? 'Meta atualizada!' : 'Meta criada! 🎯'); render('goals');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openGoalDetail(me, gid, focusAporte) {
    var g;
    try { g = J.DB.getGoal(me.id, gid); } catch (e) { toast('Meta não encontrada.'); return; }
    var pr = J.DB.goalProgress(g);
    var evs = J.DB.listGoalEvents(me.id, gid);
    modalShell('<div class="row between"><b>' + esc(g.name) + '</b>' + goalStatusPill(g) + '</div>' +
      (g.description ? '<p class="muted">' + esc(g.description) + '</p>' : '') +
      '<h1>' + BRL(g.current_amount) + '</h1><p class="muted">de ' + BRL(g.target_amount) + ' • ' + String(pr.pct).replace('.', ',') + '% • faltam ' + BRL(pr.remaining) + '<br>Prazo: ' + esc(cap(goalDeadFmt(g.deadline))) + '</p>' +
      '<div class="bar"><div style="width:' + pr.pct + '%"></div></div>' + goalSuggestion(g) + '<div id="me"></div>' +
      (g.status === 'archived' ? '<p class="muted">Meta arquivada.</p>'
        : '<label>Adicionar valor (R$) *</label><div class="row"><input id="f-av" inputmode="decimal" placeholder="500,00"><input id="f-ad" type="date" value="' + today() + '" aria-label="Data"></div><input id="f-an" maxlength="300" placeholder="Observação (opcional)"><button class="btn" id="av-go">Adicionar valor</button>') +
      '<div class="row"><button class="btn ghost" id="g-ed">Editar</button>' +
      (g.status === 'archived' ? '<button class="btn ghost" id="g-re">Reativar</button>' : '<button class="btn ghost" id="g-ar">Arquivar</button>') + '</div>' +
      '<button class="btn ghost" id="cl">Fechar</button>' +
      (evs.length ? '<h2>Histórico</h2>' + evs.map(function (e) { return '<p>+' + BRL(e.amount) + ' <span class="muted">' + esc(e.date.split('-').reverse().join('/')) + (e.note ? ' • ' + esc(e.note) : '') + '</span></p>'; }).join('') : '<p class="muted">Nenhum valor registrado ainda.</p>'));
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('g-ed').onclick = function () { openGoalModal(me, gid); };
    var ar = document.getElementById('g-ar');
    if (ar) ar.onclick = function () { if (!confirm('Arquivar esta meta? Ela sairá da lista principal, mas o histórico será mantido.')) return; try { J.DB.archiveGoal(me.id, gid); closeModal(); toast('Meta arquivada.'); render('goals'); } catch (e2) { document.getElementById('me').innerHTML = err(e2); } };
    var re = document.getElementById('g-re');
    if (re) re.onclick = function () { try { J.DB.reactivateGoal(me.id, gid); closeModal(); toast('Meta reativada!'); render('goals'); } catch (e2) { document.getElementById('me').innerHTML = err(e2); } };
    var av = document.getElementById('av-go');
    if (av) av.onclick = function () {
      var btn = this; lock(btn);
      try { J.DB.addToGoal(me.id, gid, { amount: document.getElementById('f-av').value, date: document.getElementById('f-ad').value, note: document.getElementById('f-an').value }); toast('Valor registrado! 🎉'); openGoalDetail(me, gid, false); }
      catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
    if (focusAporte && av) { var inp = document.getElementById('f-av'); if (inp) inp.focus(); }
  }

  /* ============ ETAPA 6: CONTAS RECORRENTES ============ */
  var editingRec = null;
  function freqLabel(f) { return f === 'yearly' ? 'Todo ano' : 'Todo mês'; }
  function dueLabel(iso) { return iso.split('-').reverse().join('/'); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function occStatusPill(o) {
    if (o.status === 'paid') return '<span class="pill ok">✓ Paga</span>';
    if (o.status === 'skipped') return '<span class="pill">⏭ Pulada</span>';
    if (o.status === 'cancelled') return '<span class="pill over">✕ Cancelada</span>';
    return '<span class="pill warn">⏳ Pendente</span>';
  }
  function pRecurring(v, me) {
    var list = J.DB.listRecurring(me.id, false);
    var today = todayISO();
    var html = '<div class="card"><h1>Contas recorrentes</h1><p class="muted">Organize os compromissos que se repetem todos os meses.</p><button class="btn" id="rc-new">+ Nova conta</button></div><div id="e"></div>';
    if (!list.length) {
      html += '<div class="card empty"><div class="ico">🔁</div><h2>Nenhuma conta recorrente</h2><p class="muted">Cadastre aluguel, salários, assinaturas…</p></div>';
    } else {
      html += list.map(function (r) {
        var nx = r.active ? J.DB.nextDueFor(r, today) : null;
        return '<div class="card"><div class="row between"><b>' + esc(r.description) + '</b>' + (r.active ? '<span class="pill ok">Ativa</span>' : '<span class="pill">Inativa</span>') + '</div>' +
          '<p><b class="' + (r.type === 'income' ? 'pos' : 'neg') + '">' + (r.type === 'income' ? '+' : '−') + ' ' + BRL(r.amount) + '</b> <span class="muted">• ' + esc(J.DB.catName(me.id, r.category_id)) + '</span></p>' +
          '<p class="muted">' + freqLabel(r.frequency) + ' • dia ' + r.day_of_month + '<br>Responsável: ' + esc(J.DB.userName(me.id, r.payer_user_id)) + (r.is_shared ? ' • 🤝 compartilhada' : ' • 👤 individual') +
          (nx ? '<br>Próximo vencimento: <b>' + dueLabel(nx) + '</b>' : '') + '</p>' +
          '<div class="row"><button class="btn ghost" data-rced="' + r.id + '">Editar</button>' +
          (r.active ? '<button class="btn ghost" data-rcd="' + r.id + '">Desativar</button>' : '<button class="btn ghost" data-rcr="' + r.id + '">Reativar</button>') + '</div></div>';
      }).join('');
    }
    v.innerHTML = html;
    document.getElementById('rc-new').onclick = function () { openRecModal(me, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-rced]'), function (b) { b.onclick = function () { openRecModal(me, b.dataset.rced); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-rcd]'), function (b) {
      b.onclick = function () { if (!confirm('Desativar esta conta? Ela para de gerar vencimentos, mas o histórico é mantido.')) return; try { J.DB.setRecurringActive(me.id, b.dataset.rcd, false); toast('Conta desativada. O histórico foi mantido.'); render('recurring'); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-rcr]'), function (b) {
      b.onclick = function () { try { J.DB.setRecurringActive(me.id, b.dataset.rcr, true); toast('Conta reativada!'); render('recurring'); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    });
  }
  function openRecModal(me, recId) {
    var r = recId ? J.DB.getRecurring(me.id, recId) : null;
    editingRec = recId || null;
    var type = r ? r.type : 'expense';
    var people = couplePeople(me);
    modalShell('<h2>' + (r ? 'Editar conta' : 'Nova conta recorrente') + '</h2><div id="me"></div>' +
      '<div class="seg"><button id="ty-e" class="' + (type === 'expense' ? 'on' : '') + '">− Despesa</button><button id="ty-i" class="' + (type === 'income' ? 'on' : '') + '">+ Receita</button></div>' +
      '<label>Descrição *</label><input id="f-d" maxlength="120" value="' + esc(r ? r.description : '') + '" placeholder="Ex: Aluguel">' +
      '<div class="row"><div><label>Valor (R$) *</label><input id="f-v" inputmode="decimal" value="' + (r ? String(r.amount).replace('.', ',') : '') + '"></div><div><label>Dia *</label><input id="f-day" type="number" min="1" max="31" value="' + (r ? r.day_of_month : '10') + '"></div></div>' +
      '<label>Categoria *</label><select id="f-c">' + catOptions(me, type, r ? r.category_id : null) + '</select>' +
      '<div class="row"><div><label>Frequência *</label><select id="f-f"><option value="monthly"' + (!r || r.frequency === 'monthly' ? ' selected' : '') + '>Mensal</option><option value="yearly"' + (r && r.frequency === 'yearly' ? ' selected' : '') + '>Anual</option></select></div>' +
      '<div><label>Responsável *</label><select id="f-p">' + payerOptions(me, r ? r.payer_user_id : me.id) + '</select></div></div>' +
      '<div class="row"><div><label>Data inicial *</label><input id="f-s" type="date" value="' + esc(r ? r.start_date : today()) + '"></div><div><label>Data final</label><input id="f-e" type="date" value="' + esc(r ? r.end_date : '') + '"></div></div>' +
      '<label class="check"><input type="checkbox" id="f-sh"' + (!r || r.is_shared ? ' checked' : '') + '> 🤝 Compartilhada <small>(usa a mesma divisão das despesas)</small></label>' +
      '<div id="split-box"><label>Como dividir?</label><div class="seg" id="sp-seg"><button data-m="5050">50/50</button><button data-m="percent">%</button><button data-m="fixed">R$</button></div><div id="sp-body"></div><div id="sp-prev" class="muted"></div></div>' +
      '<label>Observações</label><input id="f-n" maxlength="500" value="' + esc(r ? r.notes : '') + '" placeholder="Opcional">' +
      '<button class="btn" id="sv">' + (r ? 'Salvar (só próximos)' : 'Criar conta') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    var cur = type, spMode = (r && r.split_mode) || '5050';
    var existing = (r && r.split_entries) || [];
    function showSplit() { return cur === 'expense' && document.getElementById('f-sh').checked; }
    function collectSplit() {
      return { mode: spMode, entries: people.map(function (p) {
        var el = document.getElementById('sp-' + p.id);
        return spMode === 'fixed' ? { user_id: p.id, amount: el ? el.value : '' } : { user_id: p.id, pct: el ? el.value : '' };
      }) };
    }
    function paintSplit() {
      document.getElementById('split-box').style.display = showSplit() ? '' : 'none';
      if (!showSplit()) return;
      Array.prototype.forEach.call(document.querySelectorAll('#sp-seg button'), function (b) { b.className = b.dataset.m === spMode ? 'on' : ''; });
      if (spMode === '5050') { document.getElementById('sp-body').innerHTML = '<p class="muted">Metade para cada um.</p>'; paintPreview(); return; }
      document.getElementById('sp-body').innerHTML = people.map(function (p) {
        var prev = existing.find(function (e) { return e.user_id === p.id; }) || {};
        var val = spMode === 'percent' ? (prev.pct != null ? String(prev.pct).replace('.', ',') : '50') : (prev.amount != null ? String(prev.amount).replace('.', ',') : '');
        return '<div class="split-row"><span>' + esc(p.nome.split(' ')[0]) + '</span><input id="sp-' + p.id + '" value="' + esc(val) + '" inputmode="decimal"></div>';
      }).join('');
      Array.prototype.forEach.call(document.querySelectorAll('#sp-body input'), function (i) { i.oninput = paintPreview; });
      paintPreview();
    }
    function paintPreview() {
      var el = document.getElementById('sp-prev');
      try {
        var amt = J.DB.parseAmount(document.getElementById('f-v').value || '0');
        var rr = J.DB.buildSplits(me.id, amt, spMode === '5050' ? { mode: '5050', entries: [] } : collectSplit());
        el.textContent = rr.rows.map(function (s) { return J.DB.userName(me.id, s.user_id).replace(' (você)', '') + ': ' + BRL(s.calculated_amount); }).join(' • ');
      } catch (e2) { el.innerHTML = '<span style="color:var(--primary-d)">' + esc(e2.message) + '</span>'; }
    }
    document.getElementById('ty-e').onclick = function () { cur = 'expense'; document.getElementById('ty-e').className = 'on'; document.getElementById('ty-i').className = ''; document.getElementById('f-c').innerHTML = catOptions(me, cur, null); paintSplit(); };
    document.getElementById('ty-i').onclick = function () { cur = 'income'; document.getElementById('ty-i').className = 'on'; document.getElementById('ty-e').className = ''; document.getElementById('f-c').innerHTML = catOptions(me, cur, null); paintSplit(); };
    document.getElementById('f-sh').onchange = paintSplit;
    document.getElementById('f-v').oninput = paintPreview;
    Array.prototype.forEach.call(document.querySelectorAll('#sp-seg button'), function (b) { b.onclick = function () { spMode = b.dataset.m; paintSplit(); }; });
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var data = { type: cur, description: document.getElementById('f-d').value, amount: document.getElementById('f-v').value, category_id: document.getElementById('f-c').value, frequency: document.getElementById('f-f').value, day_of_month: document.getElementById('f-day').value, start_date: document.getElementById('f-s').value, end_date: document.getElementById('f-e').value, payer_user_id: document.getElementById('f-p').value, is_shared: document.getElementById('f-sh').checked, notes: document.getElementById('f-n').value };
        if (data.type === 'expense' && data.is_shared) data.split = collectSplit();
        else if (r) data.split = { mode: r.split_mode, entries: r.split_entries };
        if (editingRec) { J.DB.updateRecurring(me.id, editingRec, data); toast('Conta atualizada (só próximos vencimentos).'); }
        else { J.DB.createRecurring(me.id, data); toast('Conta recorrente criada! 🔁'); }
        closeModal(); render('recurring');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
    paintSplit();
  }
  /* ============ AGENDA (compromissos; só apresentação sobre AgendaService) ============
     Visões: dia/semana/mês/lista(linha do tempo curta)/longo prazo/ano.
     Financeiro nunca é criado aqui; calendário financeiro só agrega. */
  var ag = { view: 'day', date: '', who: 'all', type: '', cat: '', q: '', listDays: 60, tlBack: 30, tlFwd: 120 };
  function agDate() { if (!ag.date) ag.date = todayISO(); return ag.date; }
  function agVision() { return ag.who === 'me' ? 'me' : ag.who === 'couple' ? 'couple' : 'couple'; }
  function agWhoLabel(o) {
    if (o.visibility === 'COUPLE') return 'Casal';
    return 'Só eu';
  }
  function agTypeMeta(t) {
    var m = { PERSONAL: ['👤', 'Pessoal'], COUPLE: ['❤️', 'Casal'], REMINDER: ['⏰', 'Lembrete'], APPOINTMENT: ['🩺', 'Consulta'], COMMITMENT: ['📌', 'Compromisso'], OTHER: ['📝', 'Outro'] };
    return m[t] || ['📝', t];
  }
  function agBadge(o) {
    var tm = agTypeMeta(o.event_type || o.type);
    var who = o.visibility === 'COUPLE' ? '❤️ Casal' : '👤 Só eu';
    return '<span class="pill">' + tm[0] + ' ' + esc(tm[1]) + '</span> <span class="pill">' + who + '</span>';
  }
  function agWhen(o) {
    if (o.all_day) return 'Dia inteiro';
    var s = (o.start_at && o.start_at.length > 10) ? o.start_at.slice(11, 16) : '';
    var e = (o.end_at && o.end_at.length > 10) ? o.end_at.slice(11, 16) : '';
    if (s && e && e !== s) return s + ' — ' + e;
    return s || 'Sem horário';
  }
  function agRow(me, o) {
    return '<button class="tx" data-ag="' + esc(o.key) + '" aria-label="' + esc(o.title + ', ' + dueLabel(o.date) + ', ' + agWhen(o)) + '"><span class="tx-ic">📅</span>' +
      '<span class="tx-mid"><b>' + esc(o.title) + '</b><small>' + esc(agWhen(o)) + (o.location ? ' • 📍 ' + esc(o.location) : '') + '<br>' + agBadge(o) + '</small></span>' +
      '<b>' + esc(dueLabel(o.date)) + '</b></button>';
  }
  function agDayLabel(d) {
    var t = todayISO();
    if (d === t) return 'Hoje';
    if (d === J.DB.agendaAddDays(t, 1)) return 'Amanhã';
    if (d === J.DB.agendaAddDays(t, -1)) return 'Ontem';
    var dt = new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
    var wd = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][dt.getDay()];
    return cap(wd) + ' • ' + dueLabel(d);
  }
  var AG_WD = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
  function pAgenda(v, me) {
    agDate();
    var occs, stats = null;
    try {
      var from, to;
      if (ag.view === 'day') { from = ag.date; to = ag.date; }
      else if (ag.view === 'week') { var dw = (new Date(+ag.date.slice(0, 4), +ag.date.slice(5, 7) - 1, +ag.date.slice(8, 10)).getDay() + 6) % 7; from = J.DB.agendaAddDays(ag.date, -dw); to = J.DB.agendaAddDays(from, 6); }
      else if (ag.view === 'month') { from = ag.date.slice(0, 7) + '-01'; to = ag.date.slice(0, 7) + '-' + J.DB.agendaDim(+ag.date.slice(0, 4), +ag.date.slice(5, 7)); }
      else if (ag.view === 'list') { from = ag.date; to = J.DB.agendaAddDays(ag.date, ag.listDays); }
      else if (ag.view === 'timeline') { from = J.DB.agendaAddDays(ag.date, -ag.tlBack); to = J.DB.agendaAddDays(ag.date, ag.tlFwd); }
      else { from = ag.date.slice(0, 4) + '-01-01'; to = ag.date.slice(0, 4) + '-12-31'; }
      occs = J.DB.agendaOccurrences(me.id, from, to, { vision: agVision(), type: ag.type || undefined, category: ag.cat || undefined, search: ag.q || '' });
      if (ag.view === 'year') stats = J.DB.agendaYearSummary(me.id, +ag.date.slice(0, 4), agVision());
    } catch (e) { v.innerHTML = '<div class="card"><h1>Agenda</h1></div>' + err(e); return; }
    var html = '<div class="card"><div class="row between"><h1 style="margin:0">Agenda</h1><button class="btn" id="ag-new" style="max-width:220px">+ Novo compromisso</button></div>' +
      '<p class="muted">Vida pessoal + casal. Compromissos não criam lançamentos financeiros.</p>' +
      '<div class="seg" role="tablist" aria-label="Visão da agenda">' +
      [['day', 'Dia'], ['week', 'Semana'], ['month', 'Mês'], ['list', 'Agenda'], ['timeline', 'Linha do tempo'], ['year', 'Ano']].map(function (x) {
        return '<button data-agv="' + x[0] + '" class="' + (ag.view === x[0] ? 'on' : '') + '" role="tab">' + x[1] + '</button>';
      }).join('') + '</div>';
    if (ag.view === 'month' || ag.view === 'year') {
      html += '<div class="per-row"><button class="pnav" id="ag-prev" aria-label="Anterior">‹</button><strong>' + esc(ag.view === 'month' ? monthLabel(ag.date.slice(0, 7)) : ag.date.slice(0, 4)) + '</strong><button class="pnav" id="ag-next" aria-label="Próximo">›</button><button class="btn ghost" id="ag-today" style="max-width:110px">Hoje</button></div>';
    } else {
      html += '<div class="per-row"><button class="pnav" id="ag-prev" aria-label="Anterior">‹</button><strong>' + esc(agDayLabel(ag.date)) + '</strong><button class="pnav" id="ag-next" aria-label="Próximo">›</button><button class="btn ghost" id="ag-today" style="max-width:110px">Hoje</button></div>';
    }
    html += '<div class="seg" role="group" aria-label="Quem"><button data-agw="all" class="' + (ag.who === 'all' ? 'on' : '') + '">Todos</button><button data-agw="me" class="' + (ag.who === 'me' ? 'on' : '') + '">Eu</button><button data-agw="couple" class="' + (ag.who === 'couple' ? 'on' : '') + '">Casal</button></div></div>';
    html += '<div class="card"><div class="row"><select id="ag-type" aria-label="Tipo"><option value="">Todos os tipos</option>' + J.DB.AGENDA_TYPES().map(function (t) { return '<option value="' + t.key + '"' + (ag.type === t.key ? ' selected' : '') + '>' + t.icon + ' ' + t.label + '</option>'; }).join('') + '</select>' +
      '<select id="ag-cat" aria-label="Categoria"><option value="">Todas categorias</option>' + J.DB.AGENDA_CATEGORIES().map(function (c) { return '<option value="' + esc(c) + '"' + (ag.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><input id="ag-q" placeholder="🔍 Buscar compromisso" value="' + esc(ag.q) + '" aria-label="Buscar compromisso"></div></div>';
    html += '<div id="ag-body">' + agViewHtml(me, occs, stats) + '</div>';
    v.innerHTML = html;
    document.getElementById('ag-new').onclick = function () { openAgendaModal(me, null, null); };
    var nw2 = document.getElementById('ag-new2'); if (nw2) nw2.onclick = function () { openAgendaModal(me, null, null); };
    var pv = document.getElementById('ag-prev'), nx = document.getElementById('ag-next'), td = document.getElementById('ag-today');
    if (pv) pv.onclick = function () { agMove(-1); render('agenda'); };
    if (nx) nx.onclick = function () { agMove(1); render('agenda'); };
    if (td) td.onclick = function () { ag.date = todayISO(); render('agenda'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-agv]'), function (b) { b.onclick = function () { ag.view = b.dataset.agv; render('agenda'); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-agw]'), function (b) { b.onclick = function () { ag.who = b.dataset.agw; render('agenda'); }; });
    document.getElementById('ag-type').onchange = function (e) { ag.type = e.target.value; render('agenda'); };
    document.getElementById('ag-cat').onchange = function (e) { ag.cat = e.target.value; render('agenda'); };
    document.getElementById('ag-q').onchange = function (e) { ag.q = e.target.value; render('agenda'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-ag]'), function (b) { b.onclick = function () { openAgendaDetail(me, b.dataset.ag); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-agday]'), function (b) { b.onclick = function () { ag.date = b.dataset.agday; ag.view = 'day'; render('agenda'); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-agmonth]'), function (b) { b.onclick = function () { ag.date = b.dataset.agmonth + '-01'; ag.view = 'month'; render('agenda'); }; });
    var lm = document.getElementById('ag-more'); if (lm) lm.onclick = function () { ag.listDays += 60; render('agenda'); };
    var tlb = document.getElementById('ag-tlback'); if (tlb) tlb.onclick = function () { ag.tlBack += 90; render('agenda'); };
    var tlf = document.getElementById('ag-tlfwd'); if (tlf) tlf.onclick = function () { ag.tlFwd += 120; render('agenda'); };
  }
  function agMove(dir) {
    if (ag.view === 'day' || ag.view === 'list' || ag.view === 'timeline') ag.date = J.DB.agendaAddDays(ag.date, dir);
    else if (ag.view === 'week') ag.date = J.DB.agendaAddDays(ag.date, dir * 7);
    else if (ag.view === 'month') ag.date = J.DB.shiftMonth(ag.date.slice(0, 7), dir) + '-01';
    else if (ag.view === 'year') ag.date = (+ag.date.slice(0, 4) + dir) + '-01-01';
  }
  function agViewHtml(me, occs, stats) {
    if (ag.view === 'day') return agDayHtml(me, occs);
    if (ag.view === 'week') return agWeekHtml(me, occs);
    if (ag.view === 'month') return agMonthHtml(me, occs);
    if (ag.view === 'list') return agListHtml(me, occs, false);
    if (ag.view === 'timeline') return agListHtml(me, occs, true);
    return agYearHtml(me, stats);
  }
  function agEmpty() {
    return '<div class="card empty"><div class="ico">📅</div><h2>Sua agenda está livre</h2><p class="muted">Cadastre seus primeiros compromissos e organize sua rotina pessoal e a vida a dois.</p><button class="btn" id="ag-new2" style="max-width:260px;margin:0 auto">+ Novo compromisso</button></div>';
  }
  function agDayHtml(me, occs) {
    if (!occs.length) return agEmpty();
    var all = occs.filter(function (o) { return o.all_day; });
    var timed = occs.filter(function (o) { return !o.all_day; });
    var s = '';
    if (all.length) s += '<div class="card"><b>Dia inteiro</b>' + all.map(function (o) { return agRow(me, o); }).join('') + '</div>';
    var byHour = {};
    timed.forEach(function (o) {
      var h = o.start_at.length > 10 ? o.start_at.slice(11, 13) : '--';
      (byHour[h] = byHour[h] || []).push(o);
    });
    s += '<div class="card"><b>' + esc(agDayLabel(ag.date)) + '</b>' + Object.keys(byHour).sort().map(function (h) {
      return '<p class="muted" style="margin:12px 0 4px"><b>' + h + ':00</b></p>' + byHour[h].map(function (o) { return agRow(me, o); }).join('');
    }).join('') + '</div>';
    return s;
  }
  function agWeekHtml(me, occs) {
    var dw = (new Date(+ag.date.slice(0, 4), +ag.date.slice(5, 7) - 1, +ag.date.slice(8, 10)).getDay() + 6) % 7;
    var mon = J.DB.agendaAddDays(ag.date, -dw);
    var days = [];
    for (var i = 0; i < 7; i++) days.push(J.DB.agendaAddDays(mon, i));
    var byDay = {};
    occs.forEach(function (o) { (byDay[o.date] = byDay[o.date] || []).push(o); });
    var s = '<div class="card"><div style="overflow-x:auto"><div class="ag-week" role="grid" aria-label="Semana"><div class="ag-wh"></div>' + days.map(function (d, ix) {
      return '<div class="ag-wh' + (d === todayISO() ? ' today' : '') + '">' + AG_WD[ix] + '<br><b>' + d.slice(8, 10) + '</b></div>';
    }).join('') + '</div>';
    for (var h = 6; h <= 22; h++) {
      var hh = ('0' + h).slice(-2);
      s += '<div class="ag-week"><div class="ag-wh">' + hh + ':00</div>' + days.map(function (d) {
        var list = (byDay[d] || []).filter(function (o) { return !o.all_day && o.start_at.length > 10 && o.start_at.slice(11, 13) === hh; });
        var ad = (byDay[d] || []).filter(function (o) { return o.all_day; });
        return '<div class="ag-cell">' + list.map(function (o) {
          return '<button class="ag-block" data-ag="' + esc(o.key) + '" aria-label="' + esc(o.title + ' ' + agWhen(o)) + '"><b>' + esc(o.start_at.slice(11, 16)) + '</b> ' + esc(o.title) + '<br><small>' + (o.visibility === 'COUPLE' ? '❤️ Casal' : '👤 Eu') + '</small></button>';
        }).join('') + (h === 6 && ad.length ? ad.map(function (o) { return '<button class="ag-block allday" data-ag="' + esc(o.key) + '">☀️ ' + esc(o.title) + '</button>'; }).join('') : '') + '</div>';
      }).join('') + '</div>';
    }
    return s + '</div></div>';
  }
  function agMonthHtml(me, occs) {
    var y = +ag.date.slice(0, 4), m = +ag.date.slice(5, 7);
    var startDow = (new Date(y, m - 1, 1).getDay() + 6) % 7, n = J.DB.agendaDim(y, m);
    var byDay = {};
    occs.forEach(function (o) { var dd = +o.date.slice(8, 10); (byDay[dd] = byDay[dd] || []).push(o); });
    var cells = '';
    for (var i = 0; i < startDow; i++) cells += '<div class="cal-empty"></div>';
    for (var d = 1; d <= n; d++) {
      var list = (byDay[d] || []).slice(0, 3);
      var extra = (byDay[d] || []).length - list.length;
      var key = ag.date.slice(0, 7) + '-' + ('0' + d).slice(-2);
      cells += '<div class="cal-day"><button class="cal-daynum" data-agday="' + key + '" aria-label="Ver dia ' + d + '"><b>' + d + '</b></button>' + list.map(function (o) {
        return '<button class="cal-it" data-ag="' + esc(o.key) + '" title="' + esc(o.title) + '">' + (o.visibility === 'COUPLE' ? '❤️' : '👤') + ' ' + esc(o.title.slice(0, 12)) + '</button>';
      }).join('') + (extra > 0 ? '<span class="muted">+' + extra + '</span>' : '') + '</div>';
    }
    return '<div class="card"><div class="cal-grid" role="grid" aria-label="Mês">' + AG_WD.map(function (w) { return '<div class="cal-dow">' + w + '</div>'; }).join('') + cells + '</div><p class="muted">👤 individual • ❤️ casal</p></div>';
  }
  function agListHtml(me, occs, grouped) {
    if (!occs.length) return agEmpty();
    var byDay = {}, order = [];
    occs.forEach(function (o) {
      if (!byDay[o.date]) { byDay[o.date] = []; order.push(o.date); }
      byDay[o.date].push(o);
    });
    var lastYm = '', s = '';
    order.forEach(function (d) {
      if (grouped && d.slice(0, 7) !== lastYm) { lastYm = d.slice(0, 7); s += '<h2 style="margin:16px 2px 0">' + esc(monthLabel(lastYm)) + '</h2>'; }
      s += '<div class="card"><b>' + esc(agDayLabel(d)) + '</b>' + byDay[d].map(function (o) { return agRow(me, o); }).join('') + '</div>';
    });
    if (ag.view === 'list') s += '<button class="btn ghost" id="ag-more">Carregar mais dias</button>';
    else s = '<div class="row"><button class="btn ghost" id="ag-tlback">↑ Mais antigos</button><button class="btn ghost" id="ag-tlfwd">Mais futuros ↓</button></div>' + s;
    return s;
  }
  function agYearHtml(me, stats) {
    var MN = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    var s = '<div class="card"><div class="ag-year">' + stats.months.map(function (mm, ix) {
      return '<button class="ag-mcell" data-agmonth="' + mm.month + '" aria-label="' + MN[ix] + ': ' + mm.count + ' eventos"><b>' + MN[ix] + '</b><span class="muted">' + mm.count + (mm.count === 1 ? ' evento' : ' eventos') + '</span></button>';
    }).join('') + '</div><p class="muted">Total no ano: <b>' + stats.total + '</b></p></div>';
    return s;
  }
  function openAgendaModal(me, eventId, preset) {
    var ev = null;
    if (eventId) { try { ev = J.DB.getAgendaEvent(me.id, eventId); } catch (e) { toast('Compromisso não encontrado.'); return; } }
    preset = preset || {};
    var isSeries = !!(ev && ev.recurrence_rule && !ev.recurrence_parent_id);
    var scope = 'all';
    modalShell('<h2>' + (ev ? 'Editar compromisso' : 'Novo compromisso') + '</h2><div id="me"></div>' +
      (ev && ev.recurrence_parent_id ? '<p class="muted">Editando uma ocorrência: a alteração vale só para este dia.</p>' : '') +
      (isSeries ? '<label>Alcance da edição</label><div class="seg" id="ag-scope"><button data-s="single" class="on">Apenas este evento</button><button data-s="following">Este e os próximos</button><button data-s="all">Toda a série</button></div><div class="row"><div><label>Data da ocorrência *</label><input id="f-occ" type="date" value="' + esc(todayISO()) + '"></div></div>' : '') +
      '<label>Título *</label><input id="f-t" maxlength="120" value="' + esc(ev ? ev.title : (preset.title || '')) + '" placeholder="Ex: Dentista">' +
      '<label>Tipo</label><select id="f-ty">' + J.DB.AGENDA_TYPES().map(function (t) { return '<option value="' + t.key + '"' + ((ev ? ev.event_type : preset.type) === t.key ? ' selected' : '') + '>' + t.icon + ' ' + t.label + '</option>'; }).join('') + '</select>' +
      '<label>Para quem? *</label><div class="seg" id="f-who"><button data-w="PRIVATE" class="' + ((!ev || ev.visibility !== 'COUPLE') ? 'on' : '') + '">👤 Só eu</button><button data-w="COUPLE" class="' + ((ev && ev.visibility === 'COUPLE') ? 'on' : '') + '">❤️ Nós dois</button></div>' +
      '<div class="row"><div><label>Data *</label><input id="f-dt" type="date" value="' + esc(ev ? ev.start_at.slice(0, 10) : (preset.date || todayISO())) + '"></div></div>' +
      '<div class="row" id="tm-row"><div><label>Horário (início)</label><input id="f-ts" type="time" value="' + esc(ev && ev.start_at.length > 10 ? ev.start_at.slice(11, 16) : (preset.start_time || '')) + '"></div><div><label>Horário (fim)</label><input id="f-te" type="time" value="' + esc(ev && ev.end_at && ev.end_at.length > 10 ? ev.end_at.slice(11, 16) : (preset.end_time || '')) + '"></div></div>' +
      '<label class="check"><input type="checkbox" id="f-ad"' + (ev && ev.all_day ? ' checked' : '') + '> Dia inteiro <small>(sem horário específico)</small></label>' +
      '<label>Local</label><input id="f-lo" maxlength="120" value="' + esc(ev ? (ev.location || '') : '') + '" placeholder="Ex: Consultório, restaurante">' +
      '<label>Descrição</label><input id="f-de" maxlength="500" value="' + esc(ev ? (ev.description || '') : '') + '" placeholder="Opcional">' +
      '<div class="row"><div><label>Categoria</label><select id="f-ca">' + [''].concat(J.DB.AGENDA_CATEGORIES()).map(function (c) { return '<option value="' + esc(c) + '"' + ((ev && ev.category) === c ? ' selected' : '') + '>' + (c || 'Sem categoria') + '</option>'; }).join('') + '</select></div>' +
      '<div><label>Cor</label><select id="f-co">' + J.DB.AGENDA_COLORS().map(function (c) { return '<option value="' + c + '"' + ((ev && ev.color) === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div></div>' +
      '<label>Repetição</label><select id="f-fr"><option value="none">Não se repete</option>' + [['daily', 'Todos os dias'], ['weekly', 'Toda semana'], ['biweekly', 'A cada 2 semanas'], ['monthly', 'Todo mês'], ['yearly', 'Todo ano'], ['custom', 'Personalizado']].map(function (x) { return '<option value="' + x[0] + '"' + ((ev && ev.recurrence_rule && ev.recurrence_rule.freq) === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
      '<div id="fr-x" style="display:none"><div class="row"><div><label>A cada</label><input id="f-fi" type="number" min="1" max="99" value="' + esc(ev && ev.recurrence_rule ? ev.recurrence_rule.interval : 1) + '"></div><div><label>Unidade</label><select id="f-fu"><option value="day">dia(s)</option><option value="week">semana(s)</option><option value="month">mês(meses)</option><option value="year">ano(s)</option></select></div></div>' +
      '<label>Termina em (opcional)</label><input id="f-fe" type="date" value="' + esc(ev && ev.recurrence_end_at ? ev.recurrence_end_at : '') + '"></div>' +
      '<label>Lembrete</label><select id="f-re">' + J.DB.AGENDA_REMINDER_OPTIONS().map(function (x) { return '<option value="' + (x.min == null ? '' : x.min) + '"' + (String(ev ? (ev.reminder_minutes == null ? '' : ev.reminder_minutes) : 15) === String(x.min == null ? '' : x.min) ? ' selected' : '') + '>' + x.label + '</option>'; }).join('') + '<option value="custom">Personalizado (minutos)…</option></select>' +
      '<div id="re-x" style="display:none"><label>Minutos antes</label><input id="f-rm" type="number" min="0" max="43200" value="60"></div>' +
      '<button class="btn" id="sv">' + (ev ? 'Salvar alterações' : 'Salvar compromisso') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    var who = (!ev || ev.visibility !== 'COUPLE') ? 'PRIVATE' : 'COUPLE';
    Array.prototype.forEach.call(document.querySelectorAll('#f-who button'), function (b) { b.onclick = function () { who = b.dataset.w; Array.prototype.forEach.call(document.querySelectorAll('#f-who button'), function (x) { x.className = x.dataset.w === who ? 'on' : ''; }); }; });
    Array.prototype.forEach.call(document.querySelectorAll('#ag-scope button'), function (b) { b.onclick = function () { scope = b.dataset.s; Array.prototype.forEach.call(document.querySelectorAll('#ag-scope button'), function (x) { x.className = x.dataset.s === scope ? 'on' : ''; }); }; });
    function paintRec() {
      var fr = document.getElementById('f-fr').value;
      document.getElementById('fr-x').style.display = fr === 'custom' ? '' : 'none';
    }
    document.getElementById('f-fr').onchange = paintRec; paintRec();
    document.getElementById('f-ad').onchange = function () {
      var ad = document.getElementById('f-ad').checked;
      document.getElementById('tm-row').style.display = ad ? 'none' : '';
    };
    document.getElementById('tm-row').style.display = (ev && ev.all_day) ? 'none' : '';
    document.getElementById('f-re').onchange = function () {
      document.getElementById('re-x').style.display = document.getElementById('f-re').value === 'custom' ? '' : 'none';
    };
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var fr = document.getElementById('f-fr').value;
        var rule = null;
        if (fr !== 'none') {
          rule = fr === 'custom'
            ? { freq: 'custom', interval: document.getElementById('f-fi').value, unit: document.getElementById('f-fu').value, end: document.getElementById('f-fe').value || null }
            : { freq: fr, interval: 1, end: document.getElementById('f-fe').value || null };
        }
        var re = document.getElementById('f-re').value;
        var data = { title: document.getElementById('f-t').value, event_type: document.getElementById('f-ty').value, visibility: who, date: document.getElementById('f-dt').value, start_time: document.getElementById('f-ts').value || null, end_time: document.getElementById('f-te').value || null, all_day: document.getElementById('f-ad').checked, location: document.getElementById('f-lo').value, description: document.getElementById('f-de').value, category: document.getElementById('f-ca').value, color: document.getElementById('f-co').value, recurrence_rule: rule, reminder_minutes: re === '' ? null : (re === 'custom' ? document.getElementById('f-rm').value : re) };
        if (ev) {
          if (isSeries && scope !== 'all') {
            var occ = document.getElementById('f-occ').value;
            if (!occ) throw new Error('Informe a data da ocorrência.');
            J.DB.updateAgendaEvent(me.id, ev.id, data, { scope: scope, occurrence: occ });
          } else {
            J.DB.updateAgendaEvent(me.id, ev.id, data, {});
          }
          toast('Compromisso atualizado!');
        } else {
          J.DB.createAgendaEvent(me.id, data);
          toast('Compromisso salvo! 📅');
        }
        closeModal(); render('agenda');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openAgendaDetail(me, key) {
    var parts = String(key || '').split('@');
    var occ;
    try { occ = J.DB.agendaGetOccurrence(me.id, parts[0], parts[1]); }
    catch (e) { toast('Compromisso não encontrado.'); return; }
    var pub = J.DB.agendaOccurrencePublic(me.id, occ);
    var tm = agTypeMeta(occ.event_type);
    modalShell('<span class="pill">' + tm[0] + ' ' + esc(tm[1]) + '</span> <span class="pill">' + (occ.visibility === 'COUPLE' ? '❤️ Nós dois' : '👤 Só eu') + '</span>' +
      '<h1>' + esc(occ.title) + '</h1>' +
      '<p class="muted">' + esc(agDayLabel(occ.date)) + '<br>' + esc(agWhen(occ)) + (occ.is_recurring ? '<br>🔁 Série recorrente' : '') + (occ.overridden ? '<br>✏️ Ocorrência ajustada' : '') + '</p>' +
      (occ.location ? '<p>📍 <b>' + esc(occ.location) + '</b></p>' : '') +
      (occ.description ? '<p>' + esc(occ.description) + '</p>' : '') +
      (occ.category ? '<p class="muted">Categoria: <b>' + esc(occ.category) + '</b></p>' : '') +
      '<p class="muted">Criado por: ' + esc(J.DB.userName(me.id, occ.created_by).replace(' (você)', '')) + (occ.reminder_minutes != null ? '<br>🔔 Lembrete: ' + esc(occ.reminder_minutes) + ' min antes' : '') + '</p>' +
      '<div class="row"><button class="btn ghost" id="ed">Editar</button><button class="btn ghost" id="del" style="color:var(--primary-d)">Excluir</button></div><button class="btn" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('ed').onclick = function () { openAgendaModal(me, occ.event_id, null); };
    document.getElementById('del').onclick = function () {
      if (!occ.is_recurring) {
        if (!confirm('Excluir este compromisso?')) return;
        try { J.DB.deleteAgendaEvent(me.id, occ.event_id, {}); closeModal(); toast('Compromisso excluído.'); render('agenda'); }
        catch (e2) { toast('Não foi possível excluir.'); }
        return;
      }
      modalShell('<h2>Excluir da série</h2><div id="me"></div><p class="muted">"' + esc(occ.title) + '" em ' + esc(dueLabel(occ.date)) + '</p>' +
        '<button class="btn ghost" id="d1">Apenas este evento</button><button class="btn ghost" id="d2">Este e os próximos</button><button class="btn ghost" id="d3" style="color:var(--primary-d)">Toda a série</button><button class="btn ghost" id="cl">Cancelar</button>');
      document.getElementById('cl').onclick = closeModal;
      function done(msg) { return function () { closeModal(); toast(msg); render('agenda'); }; }
      document.getElementById('d1').onclick = function () {
        try { J.DB.deleteAgendaEvent(me.id, occ.event_id, { scope: 'single', occurrence: occ.date }); done('Ocorrência excluída.')(); }
        catch (e2) { document.getElementById('me').innerHTML = err(e2); }
      };
      document.getElementById('d2').onclick = function () {
        if (!confirm('Cancelar este e os próximos eventos da série?')) return;
        try { J.DB.deleteAgendaEvent(me.id, occ.event_id, { scope: 'following', occurrence: occ.date }); done('Série cancelada a partir desta data.')(); }
        catch (e2) { document.getElementById('me').innerHTML = err(e2); }
      };
      document.getElementById('d3').onclick = function () {
        if (!confirm('Excluir toda a série? O histórico será preservado como cancelado.')) return;
        try { J.DB.deleteAgendaEvent(me.id, occ.event_id, {}); done('Série excluída.')(); }
        catch (e2) { document.getElementById('me').innerHTML = err(e2); }
      };
    };
  }
  /* ============ HÁBITOS (rotina pessoal; só apresentação sobre HabitService) ============
     Pessoal e privado: tudo filtrado por user_id no backend. Sem finanças. */
  var hb = { tab: 'today', status: 'active', cat: '', freq: '', q: '', evo: '30', evoFrom: '', evoTo: '' };
  function hbUnitName(h) {
    var m = { BOOLEAN: '', COUNT: h.unit_label || 'vezes', AMOUNT: h.unit_label || 'unidades', DURATION: h.unit_label || 'minutos' };
    return m[h.target_unit] || '';
  }
  function hbTargetLabel(h) {
    if (h.target_unit === 'BOOLEAN') return '1 vez';
    return h.target_count + ' ' + hbUnitName(h);
  }
  function hbFreqLabel(h) {
    var m = { daily: 'Todo dia', weekly: 'Toda semana', monthly: 'Todo mês', yearly: 'Todo ano', specific_days: 'Dias escolhidos' };
    return m[h.frequency_type] || h.frequency_type;
  }
  function hbStatusPill(h) {
    var st = J.DB.habitEffectiveStatus(h);
    var m = { ACTIVE: ['', 'Ativo'], PAUSED: ['warn', '⏸ Pausado'], ARCHIVED: ['', '📦 Arquivado'], COMPLETED: ['ok', '✓ Concluído'] };
    var x = m[st] || ['', st];
    return '<span class="pill ' + x[0] + '">' + esc(x[1]) + '</span>';
  }
  function pHabits(v, me) {
    var st = J.DB.habitTodayStatus(me.id);
    var html = '<div class="card"><div class="row between" style="flex-wrap:wrap"><h1 style="margin:0">Meus hábitos</h1><button class="btn" id="hb-new" style="max-width:190px">+ Novo hábito</button></div>' +
      '<p class="muted">Construa sua rotina, acompanhe sua consistência e veja sua evolução.</p>' +
      '<div class="seg-scroll"><div class="seg" role="tablist" aria-label="Visão de hábitos">' +
      [['today', 'Hoje'], ['week', 'Semana'], ['evo', 'Evolução'], ['all', 'Todos']].map(function (x) {
        return '<button data-hbt="' + x[0] + '" class="' + (hb.tab === x[0] ? 'on' : '') + '" role="tab">' + x[1] + '</button>';
      }).join('') + '</div></div>';
    html += '<div class="card"><b>Hoje</b><p><b>' + st.done + '</b> de <b>' + st.total + '</b> concluídos' + (st.total ? ' • consistência do período abaixo' : '') + '</p><p><a href="#/habits">Ver detalhes ›</a></p></div>';
    if (hb.tab === 'today') {
      html += st.items.length ? '<div class="card"><b>Para hoje</b>' + st.items.map(function (i) {
        return '<div class="row between" style="align-items:center;padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + esc(i.name) + '</b><br><span class="muted">' + (i.done ? '✓ Concluído' : (i.partial ? '◐ Parcial' : '○ Pendente')) + (i.target ? ' • meta: ' + esc(i.target) : '') + (i.value != null && !i.done ? ' • atual: ' + esc(String(i.value)) : '') + '</span></span>' +
          (i.done
            ? '<button class="btn ghost sm" data-hbundo="' + i.id + '" style="max-width:130px;flex:none">Desfazer</button>'
            : '<button class="btn sm" data-hbgo="' + i.id + '" style="max-width:130px;flex:none">Concluir</button>') + '</div>';
      }).join('') + '</div>' : '<div class="card empty"><div class="ico">🌱</div><h2>Nenhum hábito programado para hoje.</h2></div>';
    } else if (hb.tab === 'week') {
      html += hbWeekHtml(me);
    } else if (hb.tab === 'evo') {
      html += hbEvoHtml(me);
    } else {
      html += '<div class="card"><div class="row"><select id="hb-fstatus" aria-label="Estado"><option value="active"' + (hb.status === 'active' ? ' selected' : '') + '>Ativos</option><option value="">Todos</option><option value="PAUSED"' + (hb.status === 'PAUSED' ? ' selected' : '') + '>Pausados</option><option value="ARCHIVED"' + (hb.status === 'ARCHIVED' ? ' selected' : '') + '>Arquivados</option><option value="COMPLETED"' + (hb.status === 'COMPLETED' ? ' selected' : '') + '>Concluídos</option></select>' +
        '<select id="hb-fcat" aria-label="Categoria"><option value="">Todas categorias</option>' + J.DB.HABIT_CATEGORIES().map(function (c) { return '<option value="' + esc(c.name) + '"' + (hb.cat === c.name ? ' selected' : '') + '>' + c.icon + ' ' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="row"><select id="hb-ffreq" aria-label="Frequência"><option value="">Todas frequências</option>' + J.DB.HABIT_FREQUENCIES().map(function (f) { return '<option value="' + f.key + '"' + (hb.freq === f.key ? ' selected' : '') + '>' + f.label + '</option>'; }).join('') + '</select>' +
        '<input id="hb-q" placeholder="🔍 Buscar hábitos" value="' + esc(hb.q) + '" aria-label="Buscar hábitos"></div></div>';
      var list = J.DB.getHabits(me.id, { status: hb.status || undefined, category: hb.cat || undefined, frequency: hb.freq || undefined, search: hb.q || undefined });
      if (!list.length) html += '<div class="card empty"><div class="ico">🌱</div><h2>Ainda não existem hábitos</h2><p class="muted">Crie um hábito para começar a acompanhar sua rotina.</p><button class="btn" id="hb-new2" style="max-width:220px;margin:0 auto">+ Novo hábito</button></div>';
      else html += list.map(function (h) { return hbCard(me, h); }).join('');
    }
    v.innerHTML = html;
    document.getElementById('hb-new').onclick = function () { openHabitModal(me, null); };
    var nw2 = document.getElementById('hb-new2'); if (nw2) nw2.onclick = function () { openHabitModal(me, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-hbt]'), function (b) { b.onclick = function () { hb.tab = b.dataset.hbt; render('habits'); }; });
    var fs = document.getElementById('hb-fstatus'); if (fs) fs.onchange = function (e) { hb.status = e.target.value; render('habits'); };
    var fc = document.getElementById('hb-fcat'); if (fc) fc.onchange = function (e) { hb.cat = e.target.value; render('habits'); };
    var ff = document.getElementById('hb-ffreq'); if (ff) ff.onchange = function (e) { hb.freq = e.target.value; render('habits'); };
    var fq = document.getElementById('hb-q'); if (fq) fq.onchange = function (e) { hb.q = e.target.value; render('habits'); };
    var er = document.getElementById('hb-evorange'); if (er) er.onchange = function (e) { hb.evo = e.target.value; render('habits'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-hbgo]'), function (b) { b.onclick = function () { openHabitRecord(me, b.dataset.hbgo, null); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-hbundo]'), function (b) {
      b.onclick = function () {
        try {
          var c = J.DB.getHabitHistory(me.id, b.dataset.hbundo, { limit: 60 }).filter(function (x) { return x.date === todayISO(); })[0];
          if (!c) { toast('Nada para desfazer.'); return; }
          J.DB.removeCompletion(me.id, c.id); toast('Registro desfeito.'); render('habits');
        } catch (e) { toast('Não foi possível.'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-hbopen]'), function (b) { b.onclick = function () { location.hash = '#/habits/' + b.dataset.hbopen; }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-hbrec]'), function (b) { b.onclick = function () { openHabitRecord(me, b.dataset.hbrec, b.dataset.hbdate || null); }; });
  }
  function hbCard(me, h) {
    var c, prog = null;
    try { c = J.DB.calculateHabitConsistency(me.id, h.id); prog = J.DB.calculateHabitProgress(me.id, h.id, todayISO()); } catch (e) { c = { pct: null, completed: 0, expected: 0, current_streak: 0, best_streak: 0 }; }
    return '<div class="card"><div class="row between"><b>' + esc(h.icon + ' ' + h.name) + '</b>' + hbStatusPill(h) + '</div>' +
      '<p class="muted">Meta: ' + esc(hbTargetLabel(h)) + ' • ' + esc(hbFreqLabel(h)) + '</p>' +
      (prog && prog.expected ? '<p>' + (prog.done ? '✓ Concluído hoje' : (prog.partial ? '◐ Parcial hoje (' + esc(String(prog.value)) + ')' : '○ Hoje pendente')) + '</p>' : '') +
      '<p class="muted">🔥 ' + c.current_streak + ' dias • 🏆 melhor: ' + c.best_streak + ' • consistência: ' + (c.pct == null ? '—' : String(c.pct).replace('.', ',') + '%') + '</p>' +
      '<div class="bar"><div style="width:' + Math.min(100, c.pct || 0) + '%"></div></div>' +
      '<div class="row"><button class="btn ghost sm" data-hbopen="' + h.id + '">Detalhes</button>' + (prog && prog.expected && !prog.done ? '<button class="btn sm" data-hbgo="' + h.id + '">Registrar</button>' : '') + '</div></div>';
  }
  function hbWeekHtml(me) {
    var days = [];
    for (var i = 0; i < 7; i++) days.push(J.DB.agendaAddDays(todayISO(), i - 3));
    var habits = J.DB.getHabits(me.id, { active: true });
    var s = '<div class="card"><b>Semana</b><div style="overflow-x:auto"><div class="ag-week"><div class="ag-wh"></div>' + days.map(function (d, ix) {
      return '<div class="ag-wh' + (d === todayISO() ? ' today' : '') + '">' + AG_WD[(new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)).getDay() + 6) % 7] + '<br><b>' + d.slice(8, 10) + '</b></div>';
    }).join('') + '</div>';
    habits.forEach(function (h) {
      s += '<div class="ag-week"><div class="ag-wh" style="text-align:left">' + esc(h.icon + ' ' + h.name.slice(0, 10)) + '</div>' + days.map(function (d) {
        if (!J.DB.habitIsOccurrenceExpected(h, d)) return '<div class="ag-cell"><span class="muted">·</span></div>';
        var st;
        try { st = J.DB.habitOccurrenceStatus(me.id, h.id, d); } catch (e) { st = { expected: true, done: false }; }
        return '<div class="ag-cell">' + (st.done ? '<span aria-label="Concluído">✓</span>' : '<button class="ag-block" data-hbrec="' + h.id + '" data-hbdate="' + d + '" aria-label="Registrar ' + esc(h.name + ' em ' + d) + '">○</button>') + '</div>';
      }).join('') + '</div>';
    });
    return s + '</div></div>';
  }
  function hbEvoHtml(me) {
    var habits = J.DB.getHabits(me.id, { active: true });
    var to = todayISO(), from = hb.evo === 'custom' ? (hb.evoFrom || J.DB.agendaAddDays(to, -30)) : J.DB.agendaAddDays(to, -(parseInt(hb.evo, 10) || 30));
    var s = '<div class="card"><div class="row"><select id="hb-evorange" aria-label="Período"><option value="7"' + (hb.evo === '7' ? ' selected' : '') + '>Últimos 7 dias</option><option value="30"' + (hb.evo === '30' ? ' selected' : '') + '>30 dias</option><option value="90"' + (hb.evo === '90' ? ' selected' : '') + '>90 dias</option><option value="180"' + (hb.evo === '180' ? ' selected' : '') + '>6 meses</option><option value="365"' + (hb.evo === '365' ? ' selected' : '') + '>1 ano</option></select></div>';
    if (!habits.length) return s + '<p class="muted">Sem hábitos ativos.</p></div>';
    s += habits.map(function (h) {
      var t;
      try { t = J.DB.getHabitTimeline(me.id, h.id, { from: from, to: to }); } catch (e) { return ''; }
      var max = Math.max.apply(null, t.buckets.map(function (b) { return b.completed; }).concat([1]));
      return '<p><b>' + esc(h.icon + ' ' + h.name) + '</b> <span class="muted">• ' + t.buckets.reduce(function (a, b) { return a + b.completed; }, 0) + ' conclusões</span></p>' +
        '<div class="vbars" role="img" aria-label="Evolução de ' + esc(h.name) + '">' + t.buckets.map(function (b) {
          return '<div class="vbar"><span>' + b.completed + '</span><div style="height:' + Math.max(4, Math.round(b.completed / max * 90)) + 'px;background:var(--primary)"></div><small>' + esc(String(b.bucket).slice(5)) + '</small></div>';
        }).join('') + '</div>';
    }).join('') + '</div>';
    return s;
  }
  function pHabitDetail(v, me, habitId) {
    var h;
    try { h = J.DB.getHabit(me.id, habitId); } catch (e) { toast('Hábito não encontrado.'); location.hash = '#/habits'; return; }
    var c = J.DB.calculateHabitConsistency(me.id, h.id);
    var ym = todayISO().slice(0, 7);
    var cal = J.DB.getHabitCalendar(me.id, h.id, +ym.slice(0, 4), +ym.slice(5, 7));
    var hist = J.DB.getHabitHistory(me.id, h.id, { limit: 30 });
    var html = '<p class="muted"><a href="#/habits">‹ Hábitos</a></p>';
    html += '<div class="card"><div class="row between"><h1 style="margin:0">' + esc(h.icon + ' ' + h.name) + '</h1>' + hbStatusPill(h) + '</div>' +
      (h.description ? '<p class="muted">' + esc(h.description) + '</p>' : '') +
      '<p class="muted">Meta: <b>' + esc(hbTargetLabel(h)) + '</b> • ' + esc(hbFreqLabel(h)) + (h.preferred_time ? ' • ' + esc(h.preferred_time) : '') + '</p>' +
      '<p>🔥 <b>' + c.current_streak + ' dias</b> • 🏆 Melhor: <b>' + c.best_streak + ' dias</b><br>Consistência: <b>' + (c.pct == null ? '—' : String(c.pct).replace('.', ',') + '%') + '</b> <span class="muted">(' + c.completed + ' de ' + c.expected + ')</span></p>' +
      '<div class="bar"><div style="width:' + Math.min(100, c.pct || 0) + '%"></div></div>' +
      '<div class="row"><button class="btn ghost sm" id="hd-edit">Editar</button>' +
      (J.DB.habitEffectiveStatus(h) === 'PAUSED' ? '<button class="btn ghost sm" id="hd-resume">Retomar</button>' : '<button class="btn ghost sm" id="hd-pause">Pausar</button>') +
      (J.DB.habitEffectiveStatus(h) === 'ARCHIVED' ? '' : '<button class="btn ghost sm" id="hd-arch" style="color:var(--primary-d)">Arquivar</button>') + '</div></div>';
    html += '<div class="card"><b>📅 ' + esc(monthLabel(ym)) + '</b><div class="cal-grid" role="grid" aria-label="Consistência do mês">' +
      ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(function (w) { return '<div class="cal-dow">' + w + '</div>'; }).join('') +
      (function () {
        var y = +ym.slice(0, 4), m = +ym.slice(5, 7), cells = '';
        for (var i = 0; i < new Date(y, m - 1, 1).getDay(); i++) cells += '<div class="cal-empty"></div>';
        cal.days.forEach(function (dd, ix) {
          var mark = !dd.expected ? '<span class="muted">·</span>' : dd.done ? '✓' : (dd.partial ? '◐' : '○');
          cells += '<div class="cal-day"><b>' + (ix + 1) + '</b><br><span aria-label="' + (dd.expected ? (dd.done ? 'Concluído' : (dd.partial ? 'Parcial' : 'Não concluído')) : 'Não previsto') + '">' + mark + '</span></div>';
        });
        return cells;
      })() + '</div><p class="muted">✓ concluído • ◐ parcial • ○ pendente • · não previsto</p></div>';
    html += '<div class="card"><b>Histórico</b>' + (hist.length ? hist.map(function (r) {
      return '<div class="row between"><span><b>' + esc(dueLabel(r.date)) + '</b> <span class="muted">' + (r.done ? '✓' : '◐') + (r.value != null && h.target_unit !== 'BOOLEAN' ? ' ' + esc(String(r.value)) : '') + (r.note ? ' • ' + esc(r.note) : '') + '</span></span><button class="btn ghost sm" data-hed="' + r.id + '" style="max-width:90px">Editar</button></div>';
    }).join('') : '<p class="muted">Sem registros ainda.</p>') + '</div>';
    v.innerHTML = html;
    document.getElementById('hd-edit').onclick = function () { openHabitModal(me, h.id); };
    var ps = document.getElementById('hd-pause'); if (ps) ps.onclick = function () { openHabitPause(me, h.id); };
    var rs = document.getElementById('hd-resume'); if (rs) rs.onclick = function () { try { J.DB.resumeHabit(me.id, h.id); toast('Hábito retomado!'); render('habits/' + h.id); } catch (e) { toast('Não foi possível.'); } };
    var ar = document.getElementById('hd-arch'); if (ar) ar.onclick = function () {
      if (!confirm('Arquivar este hábito? O histórico será mantido.')) return;
      try { J.DB.archiveHabit(me.id, h.id); toast('Hábito arquivado.'); location.hash = '#/habits'; } catch (e) { toast('Não foi possível.'); }
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-hed]'), function (b) { b.onclick = function () { openHabitEditCompletion(me, h.id, b.dataset.hed); }; });
  }
  function openHabitModal(me, habitId) {
    var h = null;
    if (habitId) { try { h = J.DB.getHabit(me.id, habitId); } catch (e) { toast('Hábito não encontrado.'); return; } }
    modalShell('<h2>' + (h ? 'Editar hábito' : 'Novo hábito') + '</h2><div id="me"></div>' +
      '<div id="hb-sug"><label>Exemplos <span class="muted">(toque para preencher)</span></label><div class="row" style="flex-wrap:wrap">' + J.DB.HABIT_SUGGESTIONS().map(function (s, ix) { return '<button class="btn ghost sm" data-hsug="' + ix + '" style="max-width:none;flex:1 1 30%">' + s.icon + ' ' + esc(s.name) + '</button>'; }).join('') + '</div></div>' +
      '<label>Nome do hábito *</label><input id="f-hn" maxlength="80" value="' + esc(h ? h.name : '') + '">' +
      '<label>Descrição</label><input id="f-hd" maxlength="300" value="' + esc(h ? (h.description || '') : '') + '" placeholder="Opcional">' +
      '<div class="row"><div><label>Categoria</label><select id="f-hc">' + J.DB.HABIT_CATEGORIES().map(function (c) { return '<option value="' + esc(c.name) + '"' + ((h ? h.category : 'Outros') === c.name ? ' selected' : '') + '>' + c.icon + ' ' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
      '<div><label>Ícone</label><input id="f-hi" maxlength="4" value="' + esc(h ? h.icon : '') + '" placeholder="📝"></div></div>' +
      '<label>Frequência</label><select id="f-hf">' + J.DB.HABIT_FREQUENCIES().map(function (f) { return '<option value="' + f.key + '"' + ((h ? h.frequency_type : 'daily') === f.key ? ' selected' : '') + '>' + f.label + '</option>'; }).join('') + '</select>' +
      '<div id="hb-wd" style="display:none"><label>Dias da semana</label><div class="row" style="flex-wrap:wrap">' + [['1', 'SEG'], ['2', 'TER'], ['3', 'QUA'], ['4', 'QUI'], ['5', 'SEX'], ['6', 'SÁB'], ['0', 'DOM']].map(function (d) { return '<label class="check" style="flex:1 1 22%"><input type="checkbox" data-hwd="' + d[0] + '"> ' + d[1] + '</label>'; }).join('') + '</div></div>' +
      '<div class="row"><div><label>Meta</label><input id="f-hm" type="number" min="1" value="' + esc(h ? h.target_count : 1) + '"></div>' +
      '<div><label>Unidade</label><select id="f-hu">' + J.DB.HABIT_UNITS().map(function (u) { return '<option value="' + u.key + '"' + ((h ? h.target_unit : 'BOOLEAN') === u.key ? ' selected' : '') + '>' + u.label + '</option>'; }).join('') + '</select></div></div>' +
      '<label>Medida (ex: páginas, litros, minutos)</label><input id="f-hul" maxlength="20" value="' + esc(h ? (h.unit_label || '') : '') + '" placeholder="Opcional">' +
      '<div class="row"><div><label>Data de início</label><input id="f-hs" type="date" value="' + esc(h ? h.start_date : todayISO()) + '"></div>' +
      '<div><label>Horário preferido</label><input id="f-hp" type="time" value="' + esc(h && h.preferred_time ? h.preferred_time : '') + '"></div></div>' +
      '<label class="check"><input type="checkbox" id="f-hr"' + ((!h || h.reminder_enabled) ? ' checked' : '') + '> 🔔 Lembrete <small>(usa o sistema de notificações)</small></label>' +
      '<div class="row"><div><label>Hora do lembrete</label><input id="f-hrt" type="time" value="' + esc(h && h.reminder_time ? h.reminder_time : '09:00') + '"></div></div>' +
      '<button class="btn" id="sv">' + (h ? 'Salvar' : 'Criar hábito') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    function paintWd() { document.getElementById('hb-wd').style.display = document.getElementById('f-hf').value === 'specific_days' ? '' : 'none'; }
    document.getElementById('f-hf').onchange = paintWd; paintWd();
    Array.prototype.forEach.call(document.querySelectorAll('[data-hsug]'), function (b) {
      b.onclick = function () {
        var s = J.DB.HABIT_SUGGESTIONS()[+b.dataset.hsug];
        document.getElementById('f-hn').value = s.name;
        document.getElementById('f-hc').value = s.category;
        document.getElementById('f-hi').value = s.icon;
        document.getElementById('f-hf').value = s.frequency_type; paintWd();
        document.getElementById('f-hm').value = s.target_count;
        document.getElementById('f-hu').value = s.target_unit;
        document.getElementById('f-hul').value = s.unit_label || '';
        toast('Exemplo aplicado. Ajuste e salve.');
      };
    });
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var wds = [];
        if (document.getElementById('f-hf').value === 'specific_days') {
          Array.prototype.forEach.call(document.querySelectorAll('[data-hwd]'), function (c) { if (c.checked) wds.push(+c.dataset.hwd); });
        }
        var data = { name: document.getElementById('f-hn').value, description: document.getElementById('f-hd').value, category: document.getElementById('f-hc').value, icon: document.getElementById('f-hi').value || undefined, frequency_type: document.getElementById('f-hf').value, weekdays: wds, target_count: document.getElementById('f-hm').value, target_unit: document.getElementById('f-hu').value, unit_label: document.getElementById('f-hul').value, start_date: document.getElementById('f-hs').value, preferred_time: document.getElementById('f-hp').value || null, reminder_enabled: document.getElementById('f-hr').checked, reminder_time: document.getElementById('f-hrt').value || null };
        if (h) { J.DB.updateHabit(me.id, h.id, data); toast('Hábito atualizado!'); }
        else { J.DB.createHabit(me.id, data); toast('Hábito criado! 🌱'); }
        closeModal(); render(h ? 'habits/' + h.id : 'habits');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openHabitRecord(me, habitId, date) {
    var h;
    try { h = J.DB.getHabit(me.id, habitId); } catch (e) { toast('Hábito não encontrado.'); return; }
    var d = date || todayISO();
    var unitHints = { BOOLEAN: '', COUNT: h.unit_label || 'vezes', AMOUNT: h.unit_label || 'unidades', DURATION: h.unit_label || 'minutos' };
    var labels = { BOOLEAN: ['Concluído hoje?', ''], COUNT: ['Quanto?', unitHints.COUNT], AMOUNT: ['Quantidade', unitHints.AMOUNT], DURATION: ['Quanto tempo?', unitHints.DURATION] };
    var L = labels[h.target_unit] || labels.BOOLEAN;
    modalShell('<h2>' + esc(h.icon + ' ' + h.name) + '</h2><div id="me"></div><p class="muted">' + esc(dueLabel(d)) + ' • meta: ' + esc(hbTargetLabel(h)) + '</p>' +
      (h.target_unit === 'BOOLEAN' ? '<p><b>' + L[0] + '</b></p>' : '<label>' + L[0] + (L[1] ? ' (' + esc(L[1]) + ')' : '') + ' *</label><input id="f-hv" inputmode="decimal" placeholder="Ex: 20">') +
      '<button class="btn" id="sv">' + (h.target_unit === 'BOOLEAN' ? 'Concluir' : 'Registrar') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var v = h.target_unit === 'BOOLEAN' ? 1 : document.getElementById('f-hv').value;
        J.DB.recordCompletion(me.id, h.id, { completion_date: d, value: v });
        closeModal(); toast('Registrado! 🌱'); render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openHabitEditCompletion(me, habitId, completionId) {
    var h;
    try { h = J.DB.getHabit(me.id, habitId); } catch (e) { toast('Hábito não encontrado.'); return; }
    var all = J.DB.getHabitHistory(me.id, habitId, { limit: 500 });
    var c = all.filter(function (x) { return x.id === completionId; })[0];
    if (!c) { toast('Registro não encontrado.'); return; }
    modalShell('<h2>Corrigir registro</h2><div id="me"></div><p class="muted">' + esc(dueLabel(c.date)) + ' • ' + esc(h.name) + '</p>' +
      (h.target_unit === 'BOOLEAN' ? '<p class="muted">Registro de conclusão (sim/não).</p>' : '<label>Valor *</label><input id="f-hv" inputmode="decimal" value="' + esc(String(c.value != null ? c.value : '')) + '">') +
      '<label>Observação</label><input id="f-hn2" maxlength="200" value="' + esc(c.note || '') + '">' +
      '<div class="row"><button class="btn" id="sv">Salvar</button><button class="btn ghost" id="rm" style="color:var(--primary-d)">Desfazer</button></div><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        J.DB.updateCompletion(me.id, completionId, { value: h.target_unit === 'BOOLEAN' ? undefined : document.getElementById('f-hv').value, note: document.getElementById('f-hn2').value });
        closeModal(); toast('Registro corrigido.'); render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
    document.getElementById('rm').onclick = function () {
      if (!confirm('Desfazer este registro?')) return;
      try { J.DB.removeCompletion(me.id, completionId); closeModal(); toast('Registro desfeito.'); render(here()); }
      catch (e2) { document.getElementById('me').innerHTML = err(e2); }
    };
  }
  function openHabitPause(me, habitId) {
    modalShell('<h2>Pausar hábito</h2><div id="me"></div><p class="muted">Durante a pausa não há ocorrências, falhas nem lembretes. A sequência é preservada.</p>' +
      '<label>Pausar até (opcional)</label><input id="f-hu2" type="date" value="">' +
      '<div class="row"><button class="btn" id="sv">Pausar</button><button class="btn ghost" id="cl">Cancelar</button></div>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        J.DB.pauseHabit(me.id, habitId, document.getElementById('f-hu2').value || null);
        closeModal(); toast('Hábito pausado.'); render('habits/' + habitId);
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  /* ============ TAREFAS (só apresentação sobre TaskService) ============
     Fazer pessoal/do casal; sem finanças, sem virar agenda/hábito. */
  var tk = { tab: 'today', vis: 'all', q: '', status: 'pending' };
  function tkWhoBadge(vis) {
    return vis === 'COUPLE' ? '<span class="pill">❤️ Casal</span>' : '<span class="pill">👤 Pessoal</span>';
  }
  function tkDueLabel(o) {
    var t = todayISO();
    if (!o.date && !o.due_date) return 'Sem prazo';
    var d = o.date || o.due_date;
    if (d === t) return 'Hoje' + (o.due_time ? ' ' + o.due_time : '');
    if (d === J.DB.agendaAddDays(t, 1)) return 'Amanhã' + (o.due_time ? ' ' + o.due_time : '');
    return dueLabel(d) + (o.due_time ? ' ' + o.due_time : '');
  }
  function tkRow(me, o, opts) {
    opts = opts || {};
    var done = o.status === 'COMPLETED';
    var who = J.DB.userName(me.id, o.assigned_to);
    var meta = tkDueLabel(o) + ' • ' + (o.visibility === 'COUPLE' ? 'Casal' : 'Pessoal') +
      (o.visibility === 'COUPLE' && o.assigned_to ? ' • ' + esc(who) : '') +
      (o.priority === 'HIGH' && !done ? ' • Prioridade alta' : '') +
      (o.overdue && !done ? ' • <b>Atrasada</b>' : '') +
      (o.is_recurring ? ' • 🔁' : '');
    return '<div class="ov-row"><button class="chk' + (done ? ' done' : '') + '" data-tktoggle="' + esc(o.key || o.task_id || o.id) + '" aria-pressed="' + done + '" aria-label="' + esc((done ? 'Reabrir ' : 'Concluir ') + o.title) + '">' + (done ? '✓' : '') + '</button>' +
      '<span style="flex:1;min-width:0"><b>' + esc(o.title) + '</b><br><span class="muted">' + meta + '</span></span>' +
      (opts.detail === false ? '' : '<button class="btn ghost sm" data-tkopen="' + esc(o.task_id || o.id) + '" style="max-width:90px;flex:none">Abrir</button>') + '</div>';
  }
  function pTasks(v, me) {
    var tabs = [['today', 'Hoje'], ['next', 'Próximas'], ['all', 'Todas'], ['done', 'Concluídas']];
    var html = '<div class="card"><div class="row between" style="flex-wrap:wrap"><h1 style="margin:0">Tarefas</h1><button class="btn" id="tk-new" style="max-width:190px">+ Nova tarefa</button></div>' +
      '<div class="seg-scroll"><div class="seg" role="tablist" aria-label="Período">' +
      tabs.map(function (x) { return '<button data-tktab="' + x[0] + '" class="' + (tk.tab === x[0] ? 'on' : '') + '" role="tab">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="seg" role="group" aria-label="Visibilidade"><button data-tkvis="all" class="' + (tk.vis === 'all' ? 'on' : '') + '">Todas</button><button data-tkvis="PERSONAL" class="' + (tk.vis === 'PERSONAL' ? 'on' : '') + '">Pessoais</button><button data-tkvis="COUPLE" class="' + (tk.vis === 'COUPLE' ? 'on' : '') + '">Casal</button></div>' +
      '<input id="tk-q" placeholder="🔍 Buscar tarefas" value="' + esc(tk.q) + '" aria-label="Buscar tarefas"></div>';
    var list = [], emptyMsg = '';
    try {
      var vis = tk.vis === 'all' ? null : tk.vis;
      if (tk.tab === 'today') { list = J.DB.taskOccurrences(me.id, todayISO(), todayISO(), { visibility: vis }).filter(function (o) { return o.status !== 'COMPLETED' && o.status !== 'CANCELLED'; }); emptyMsg = 'Nenhuma tarefa para hoje.'; }
      else if (tk.tab === 'next') { list = J.DB.getUpcomingTasks(me.id, 30, 60).filter(function (o) { return !vis || o.visibility === vis; }); emptyMsg = 'Nada por vir.'; }
      else if (tk.tab === 'done') { list = J.DB.taskOccurrences(me.id, J.DB.agendaAddDays(todayISO(), -60), todayISO(), { visibility: vis }).filter(function (o) { return o.status === 'COMPLETED'; }).slice(-30).reverse(); emptyMsg = 'Nada concluído por aqui ainda.'; }
      else {
        var rows = J.DB.getTasks(me.id, { visibility: vis || undefined, search: tk.q || undefined, limit: 100 });
        list = rows.map(function (t) { return { key: t.id, task_id: t.id, date: t.due_date, title: t.title, due_time: t.due_time, status: t.status, priority: t.priority, visibility: t.visibility, assigned_to: t.assigned_to, owner_user_id: t.owner_user_id, is_recurring: t.recurrence_type !== 'NONE', overdue: J.DB.taskIsOverdue(t, todayISO()) }; });
        emptyMsg = 'Nada pendente por aqui. Crie uma tarefa para organizar algo que você precisa fazer.';
      }
      if (tk.tab !== 'all' && tk.q) {
        var q = tk.q.toLowerCase();
        list = list.filter(function (o) { return (o.title || '').toLowerCase().indexOf(q) >= 0; });
      }
    } catch (e) { v.innerHTML = html + '<div class="card"><b>Tarefas</b><div class="alert">Não foi possível carregar suas tarefas.</div><button class="btn ghost" data-retry>Tentar novamente</button></div>'; bindTasks(v, me); return; }
    if (!list.length) html += '<div class="card empty"><div class="ico">☑</div><h2>' + esc(emptyMsg) + '</h2><button class="btn" id="tk-new2" style="max-width:220px;margin:0 auto">+ Nova tarefa</button></div>';
    else {
      html += '<div class="card"><b>' + (tk.tab === 'today' ? 'Hoje' : tk.tab === 'next' ? 'Próximas' : tk.tab === 'done' ? 'Concluídas' : 'Todas as tarefas') + '</b>' +
        list.slice(0, 60).map(function (o) { return tkRow(me, o); }).join('') + '</div>';
    }
    v.innerHTML = html;
    bindTasks(v, me);
  }
  function bindTasks(v, me) {
    var nw = document.getElementById('tk-new'); if (nw) nw.onclick = function () { openTaskModal(me, null); };
    var nw2 = document.getElementById('tk-new2'); if (nw2) nw2.onclick = function () { openTaskModal(me, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-tktab]'), function (b) { b.onclick = function () { tk.tab = b.dataset.tktab; render('tasks'); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-tkvis]'), function (b) { b.onclick = function () { tk.vis = b.dataset.tkvis; render('tasks'); }; });
    var q = document.getElementById('tk-q'); if (q) q.onchange = function (e) { tk.q = e.target.value; render('tasks'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-tktoggle]'), function (b) {
      b.onclick = function () { tkToggle(me, b.dataset.tktoggle); };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-tkopen]'), function (b) { b.onclick = function () { openTaskDetail(me, b.dataset.tkopen); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-retry]'), function (b) { b.onclick = function () { render('tasks'); }; });
  }
  function tkParseKey(key) {
    var s = String(key || '');
    if (s.slice(0, 2) !== 't:') return { task_id: s, date: null };
    var rest = s.slice(2).split('@');
    return { task_id: rest[0], date: rest[1] || null };
  }
  function tkToggle(me, key) {
    try {
      var p = tkParseKey(key);
      var occ = null;
      try {
        var all = J.DB.taskOccurrences(me.id, '0000-01-01', '9999-12-31', {});
        occ = all.filter(function (o) { return o.key === key; })[0] || null;
      } catch (e) {}
      if (occ && occ.status === 'COMPLETED') {
        J.DB.reopenTask(me.id, { task_id: p.task_id, date: p.date });
        toast('Tarefa reaberta.');
      } else {
        J.DB.completeTask(me.id, { task_id: p.task_id, date: p.date });
        toast('Tarefa concluída.', { label: 'Desfazer', fn: function () { try { J.DB.reopenTask(me.id, { task_id: p.task_id, date: p.date }); render(here()); } catch (e2) {} } });
      }
      render(here());
    } catch (e) { toast('Não foi possível.'); }
  }
  function openTaskModal(me, taskId, preset) {
    var t = null;
    if (taskId) { try { t = J.DB.getTask(me.id, taskId); } catch (e) { toast('Tarefa não encontrada.'); return; } }
    preset = preset || {};
    var members = [];
    try { members = J.DB.myCouple(me.id).users; } catch (e2) {}
    var vis = t ? t.visibility : (preset.visibility || 'PERSONAL');
    modalShell('<h2>' + (t ? 'Editar tarefa' : 'Nova tarefa') + '</h2><div id="me"></div>' +
      '<label>Título *</label><input id="f-tt" maxlength="120" value="' + esc(t ? t.title : (preset.title || '')) + '">' +
      '<div id="tk-more" style="display:' + (t ? '' : 'none') + '">' +
      '<label>Descrição</label><input id="f-td" maxlength="500" value="' + esc(t ? (t.description || '') : '') + '">' +
      '<label>É</label><div class="row"><label class="check"><input type="radio" name="tkvis" value="PERSONAL"' + (vis === 'PERSONAL' ? ' checked' : '') + '> Pessoal</label><label class="check"><input type="radio" name="tkvis" value="COUPLE"' + (vis === 'COUPLE' ? ' checked' : '') + '> Do casal</label></div>' +
      '<label>Responsável</label><select id="f-ta"><option value="">Sem responsável</option>' + members.map(function (u) { return '<option value="' + u.id + '"' + ((t ? t.assigned_to : me.id) === u.id ? ' selected' : '') + '>' + esc(u.nome) + (u.id === me.id ? ' (você)' : '') + '</option>'; }).join('') + '</select>' +
      '<div class="row"><div><label>Prazo</label><input id="f-tdd" type="date" value="' + esc(t ? (t.due_date || '') : (preset.due_date || '')) + '"></div>' +
      '<div><label>Horário</label><input id="f-tdt" type="time" value="' + esc(t ? (t.due_time || '') : '') + '"></div></div>' +
      '<div class="row"><div><label>Prioridade</label><select id="f-tp"><option value="LOW">Baixa</option><option value="NORMAL"' + ((t ? t.priority : 'NORMAL') === 'NORMAL' ? ' selected' : '') + '>Normal</option><option value="HIGH"' + ((t ? t.priority : '') === 'HIGH' ? ' selected' : '') + '>Alta</option></select></div>' +
      '<div><label>Recorrência</label><select id="f-tr"><option value="NONE">Não repete</option><option value="DAILY">Todo dia</option><option value="WEEKLY">Toda semana</option><option value="MONTHLY">Todo mês</option><option value="SPECIFIC_DAYS">Dias específicos</option></select></div></div>' +
      '<div id="tk-wd" style="display:none"><label>Dias</label><div class="row" style="flex-wrap:wrap">' + [['1', 'SEG'], ['2', 'TER'], ['3', 'QUA'], ['4', 'QUI'], ['5', 'SEX'], ['6', 'SÁB'], ['0', 'DOM']].map(function (d) { return '<label class="check" style="flex:1 1 22%"><input type="checkbox" data-twd="' + d[0] + '"> ' + d[1] + '</label>'; }).join('') + '</div></div>' +
      '</div>' +
      (t ? '' : '<button class="btn ghost sm" id="tk-det" style="max-width:200px">+ Detalhes</button>') +
      '<button class="btn" id="sv">' + (t ? 'Salvar' : 'Criar tarefa') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    var det = document.getElementById('tk-det');
    if (det) det.onclick = function () { document.getElementById('tk-more').style.display = ''; det.style.display = 'none'; };
    function paintW() { var r = document.getElementById('f-tr'); document.getElementById('tk-wd').style.display = r && r.value === 'SPECIFIC_DAYS' ? '' : 'none'; }
    var fr = document.getElementById('f-tr'); if (fr) { if (t && t.recurrence_type !== 'NONE') fr.value = t.recurrence_type; fr.onchange = paintW; paintW(); }
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var vvr = document.querySelector('input[name="tkvis"]:checked');
        var wds = [];
        if (fr && fr.value === 'SPECIFIC_DAYS') Array.prototype.forEach.call(document.querySelectorAll('[data-twd]'), function (c) { if (c.checked) wds.push(+c.dataset.twd); });
        var data = { title: document.getElementById('f-tt').value, description: (document.getElementById('f-td') || { value: '' }).value, visibility: vvr ? vvr.value : 'PERSONAL', assigned_to: (document.getElementById('f-ta') || { value: '' }).value || null, due_date: (document.getElementById('f-tdd') || { value: '' }).value || null, due_time: (document.getElementById('f-tdt') || { value: '' }).value || null, priority: (document.getElementById('f-tp') || { value: 'NORMAL' }).value, recurrence: fr ? { type: fr.value, daysOfWeek: wds } : undefined };
        if (t) { J.DB.updateTask(me.id, t.id, data); toast('Tarefa atualizada!'); }
        else { J.DB.createTask(me.id, data); toast('Tarefa criada! ☑'); }
        closeModal(); render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openTaskDetail(me, taskId) {
    var t;
    try { t = J.DB.getTask(me.id, taskId); } catch (e) { toast('Tarefa não encontrada.'); return; }
    var who = t.assigned_to ? J.DB.userName(me.id, t.assigned_to) : 'Sem responsável';
    var creator = '';
    try { creator = J.DB.userName(me.id, t.created_by); } catch (e2) { creator = ''; }
    var freq = { NONE: 'Não repete', DAILY: 'Todo dia', WEEKLY: 'Toda semana', MONTHLY: 'Todo mês', SPECIFIC_DAYS: 'Dias específicos' }[t.recurrence_type] || t.recurrence_type;
    modalShell('<h2>' + esc(t.title) + '</h2><div id="me"></div>' +
      (t.description ? '<p class="muted">' + esc(t.description) + '</p>' : '') +
      '<p><span class="pill">' + esc(t.status === 'TODO' ? 'A fazer' : t.status === 'IN_PROGRESS' ? 'Em andamento' : t.status === 'COMPLETED' ? '✓ Concluída' : t.status === 'CANCELLED' ? 'Cancelada' : 'Arquivada') + '</span> ' +
      '<span class="pill">' + (t.visibility === 'COUPLE' ? '❤️ Casal' : '👤 Pessoal') + '</span>' +
      (t.priority === 'HIGH' ? ' <span class="pill warn">Prioridade alta</span>' : '') + '</p>' +
      '<p class="muted">Prazo: <b>' + (t.due_date ? esc(dueLabel(t.due_date)) + (t.due_time ? ' às ' + esc(t.due_time) : '') : 'Sem prazo') + '</b><br>Responsável: <b>' + esc(who) + '</b><br>Recorrência: ' + esc(freq) + (creator ? '<br>Criada por ' + esc(creator) : '') + '</p>' +
      '<div class="row"><button class="btn ghost sm" id="td-edit">Editar</button>' +
      (t.status === 'COMPLETED' ? '<button class="btn ghost sm" id="td-re">Reabrir</button>' : '<button class="btn sm" id="td-done">Concluir</button>') + '</div>' +
      '<div class="row"><button class="btn ghost sm" id="td-cancel">Cancelar</button><button class="btn ghost sm" id="td-arch">Arquivar</button></div>' +
      '<button class="btn ghost" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('td-edit').onclick = function () { openTaskModal(me, t.id); };
    var dn = document.getElementById('td-done'); if (dn) dn.onclick = function () { try { J.DB.completeTask(me.id, t.id); closeModal(); toast('Tarefa concluída.', { label: 'Desfazer', fn: function () { try { J.DB.reopenTask(me.id, t.id); render(here()); } catch (e3) {} } }); render(here()); } catch (e4) { document.getElementById('me').innerHTML = err(e4); } };
    var re = document.getElementById('td-re'); if (re) re.onclick = function () { try { J.DB.reopenTask(me.id, t.id); closeModal(); toast('Tarefa reaberta.'); render(here()); } catch (e5) { document.getElementById('me').innerHTML = err(e5); } };
    document.getElementById('td-cancel').onclick = function () { try { J.DB.cancelTask(me.id, t.id); closeModal(); toast('Tarefa cancelada.'); render(here()); } catch (e6) { document.getElementById('me').innerHTML = err(e6); } };
    document.getElementById('td-arch').onclick = function () { try { J.DB.archiveTask(me.id, t.id); closeModal(); toast('Tarefa arquivada.'); render(here()); } catch (e7) { document.getElementById('me').innerHTML = err(e7); } };
  }
  /* ============ LISTAS (só apresentação sobre ListService) ============
     Lista organiza itens; tarefa organiza ações. Sem finanças aqui. */
  var ls = { tab: 'all', q: '', hideDone: false };
  function lsTypeLbl(t) { return t === 'SHOPPING' ? 'Compras' : t === 'CHECKLIST' ? 'Checklist' : 'Geral'; }
  function lsItemLbl(it) {
    var s = it.title;
    if (it.quantity != null) s += ' — ' + String(it.quantity).replace('.', ',') + (it.unit ? ' ' + it.unit : '');
    return s;
  }
  function pLists(v, me) {
    var html = '<div class="card"><div class="row between" style="flex-wrap:wrap"><h1 style="margin:0">Listas</h1><button class="btn" id="ls-new" style="max-width:190px">+ Nova lista</button></div>' +
      '<div class="seg" role="group" aria-label="Visibilidade"><button data-lstab="all" class="' + (ls.tab === 'all' ? 'on' : '') + '">Todas</button><button data-lstab="PERSONAL" class="' + (ls.tab === 'PERSONAL' ? 'on' : '') + '">Pessoais</button><button data-lstab="COUPLE" class="' + (ls.tab === 'COUPLE' ? 'on' : '') + '">Casal</button></div>' +
      '<input id="ls-q" placeholder="🔍 Buscar listas ou itens" value="' + esc(ls.q) + '" aria-label="Buscar listas"></div>';
    var rows = [], errMsg = null;
    try { rows = J.DB.getLists(me.id, { visibility: ls.tab === 'all' ? undefined : ls.tab, search: ls.q || undefined, limit: 100 }); }
    catch (e) { errMsg = e; }
    if (errMsg) { v.innerHTML = html + '<div class="card"><b>Listas</b><div class="alert">Não foi possível carregar esta lista.</div><button class="btn ghost" data-lsretry>Tentar novamente</button></div>'; bindLists(v, me); return; }
    if (!rows.length) {
      html += '<div class="card empty"><div class="ico">📝</div><h2>Suas listas vão aparecer aqui.</h2><p class="muted">Crie uma lista para organizar compras, viagens, checklists ou qualquer outra coisa.</p><button class="btn" id="ls-new2" style="max-width:220px;margin:0 auto">+ Nova lista</button></div>';
    } else {
      html += rows.slice(0, 60).map(function (l) {
        var p;
        try { p = J.DB.getListProgress(me.id, l.id); } catch (e2) { p = { total: 0, done: 0 }; }
        var pct = p.total ? Math.round(p.done / p.total * 100) : 0;
        return '<a class="card dash-link" href="#/lists/' + l.id + '" aria-label="Abrir lista ' + esc(l.name) + '"><div class="row between"><b>' + esc(l.name) + '</b><span class="pill">' + (l.visibility === 'COUPLE' ? '❤️ Casal' : '👤 Pessoal') + '</span></div>' +
          '<p class="muted">' + esc(lsTypeLbl(l.list_type)) + (l.status !== 'ACTIVE' ? ' • ' + (l.status === 'COMPLETED' ? 'Concluída' : 'Arquivada') : '') + '</p>' +
          '<p class="muted">' + (p.total ? p.done + ' de ' + p.total + ' • ' + pct + '%' : 'Lista vazia') + '</p>' +
          '<div class="bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + pct + '%"></span></div></a>';
      }).join('');
    }
    v.innerHTML = html;
    bindLists(v, me);
  }
  function bindLists(v, me) {
    var nw = document.getElementById('ls-new'); if (nw) nw.onclick = function () { openListModal(me, null); };
    var nw2 = document.getElementById('ls-new2'); if (nw2) nw2.onclick = function () { openListModal(me, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-lstab]'), function (b) { b.onclick = function () { ls.tab = b.dataset.lstab; render('lists'); }; });
    var q = document.getElementById('ls-q'); if (q) q.onchange = function (e) { ls.q = e.target.value; render('lists'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-lsretry]'), function (b) { b.onclick = function () { render('lists'); }; });
  }
  function openListModal(me, listId) {
    var l = null;
    if (listId) { try { l = J.DB.getList(me.id, listId); } catch (e) { toast('Lista não encontrada.'); return; } }
    modalShell('<h2>' + (l ? 'Editar lista' : 'Nova lista') + '</h2><div id="me"></div>' +
      '<label>Nome *</label><input id="f-ln" maxlength="80" value="' + esc(l ? l.name : '') + '">' +
      '<label>Descrição</label><input id="f-ld" maxlength="500" value="' + esc(l ? (l.description || '') : '') + '">' +
      '<label>Tipo</label><div class="row"><label class="check"><input type="radio" name="lstype" value="GENERAL"' + ((!l || l.list_type === 'GENERAL') ? ' checked' : '') + '> Geral</label><label class="check"><input type="radio" name="lstype" value="SHOPPING"' + ((l && l.list_type === 'SHOPPING') ? ' checked' : '') + '> Compras</label><label class="check"><input type="radio" name="lstype" value="CHECKLIST"' + ((l && l.list_type === 'CHECKLIST') ? ' checked' : '') + '> Checklist</label></div>' +
      '<label>Visibilidade</label><div class="row"><label class="check"><input type="radio" name="lsvis" value="PERSONAL"' + ((!l || l.visibility === 'PERSONAL') ? ' checked' : '') + '> Pessoal</label><label class="check"><input type="radio" name="lsvis" value="COUPLE"' + ((l && l.visibility === 'COUPLE') ? ' checked' : '') + '> Casal</label></div>' +
      '<p class="muted">Pessoal só você vê. Casal fica visível para seu par.</p>' +
      '<button class="btn" id="sv">' + (l ? 'Salvar' : 'Criar') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var tp = document.querySelector('input[name="lstype"]:checked');
        var vs = document.querySelector('input[name="lsvis"]:checked');
        var data = { name: document.getElementById('f-ln').value, description: document.getElementById('f-ld').value, list_type: tp ? tp.value : 'GENERAL', visibility: vs ? vs.value : 'PERSONAL' };
        if (!l && data.visibility === 'COUPLE') {
          if (!confirm('Essa lista passará a ser visível para seu parceiro. Continuar?')) { unlock(btn); return; }
        }
        if (l && data.visibility !== l.visibility && data.visibility === 'COUPLE') {
          if (!confirm('Essa lista passará a ser visível para seu parceiro. Continuar?')) { unlock(btn); return; }
        }
        if (l) { J.DB.updateList(me.id, l.id, data); toast('Lista atualizada!'); }
        else { var nl = J.DB.createList(me.id, data); toast('Lista criada! 📝'); location.hash = '#/lists/' + nl.id; closeModal(); return; }
        closeModal(); render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function pListDetail(v, me, listId) {
    var l;
    try { l = J.DB.getList(me.id, listId); }
    catch (e) { v.innerHTML = '<div class="card"><b>Lista</b><div class="alert">Não foi possível carregar esta lista.</div><p><a href="#/lists">‹ Voltar para Listas</a></p><button class="btn ghost" onclick="location.hash=\'#/lists\'">Tentar novamente</button></div>'; return; }
    var items = [];
    try { items = J.DB.getListItems(me.id, l.id, {}); } catch (e2) { items = []; }
    var pend = items.filter(function (it) { return !it.checked; });
    var done = items.filter(function (it) { return it.checked; });
    var showDone = !ls.hideDone;
    var members = [];
    try { members = J.DB.myCouple(me.id).users; } catch (e3) {}
    function itemRow(it) {
      var who = it.assigned_to ? J.DB.userName(me.id, it.assigned_to) : null;
      var linked = it.linked_task_id ? ' • <a href="#/tasks">tarefa vinculada ›</a>' : '';
      return '<div class="ov-row"><button class="chk' + (it.checked ? ' done' : '') + '" data-lstoggle="' + it.id + '" aria-pressed="' + (!!it.checked) + '" aria-label="' + esc((it.checked ? 'Desmarcar ' : 'Marcar ') + it.title) + '">' + (it.checked ? '✓' : '') + '</button>' +
        '<span style="flex:1;min-width:0"><b>' + esc(lsItemLbl(it)) + '</b>' + (it.description ? '<br><span class="muted">' + esc(it.description) + '</span>' : '') +
        ((who && l.visibility === 'COUPLE') ? '<br><span class="muted">👤 ' + esc(who) + '</span>' : '') + linked + '</span>' +
        '<span style="display:flex;gap:2px;flex:none">' +
        (l.visibility === 'COUPLE' || true ? '<button class="btn ghost sm" data-lsmove="' + it.id + '|up" aria-label="Mover para cima" style="max-width:38px">↑</button><button class="btn ghost sm" data-lsmove="' + it.id + '|down" aria-label="Mover para baixo" style="max-width:38px">↓</button>' : '') +
        '<button class="btn ghost sm" data-lsedit="' + it.id + '" style="max-width:64px">Editar</button></span></div>';
    }
    v.innerHTML = '<p class="muted"><a href="#/lists">‹ Listas</a></p>' +
      '<div class="card"><div class="row between" style="flex-wrap:wrap"><div><h1 style="margin:0">' + esc(l.name) + '</h1><p class="muted">' + esc(lsTypeLbl(l.list_type)) + ' • ' + (l.visibility === 'COUPLE' ? 'Compartilhada' : 'Pessoal') + (l.status !== 'ACTIVE' ? ' • ' + (l.status === 'COMPLETED' ? 'Concluída' : 'Arquivada') : '') + '</p></div>' +
      '<span><button class="btn ghost sm" id="ls-edit">Editar</button> <button class="btn ghost sm" id="ls-menu">•••</button></span></div>' +
      (l.description ? '<p class="muted">' + esc(l.description) + '</p>' : '') +
      '<div class="bar" role="progressbar" aria-label="Progresso da lista"><span style="width:' + (items.length ? Math.round(done.length / items.length * 100) : 0) + '%"></span></div>' +
      '<p class="muted" aria-live="polite">' + done.length + ' de ' + items.length + (items.length ? '' : ' — Esta lista ainda está vazia. Adicione o primeiro item.') + '</p>' +
      '<form id="ls-addf"><input id="ls-add" placeholder="Adicionar item... (Enter adiciona)" autocomplete="off" aria-label="Adicionar item"></form></div>' +
      (pend.length ? '<div class="card"><b>Pendentes (' + pend.length + ')</b>' + pend.map(itemRow).join('') + '</div>' : (items.length ? '' : '')) +
      (done.length ? '<div class="card"><div class="row between"><b>Concluídos (' + done.length + ')</b><span><button class="btn ghost sm" id="ls-hide">' + (showDone ? 'Ocultar' : 'Mostrar') + '</button> <button class="btn ghost sm" id="ls-clear">Limpar concluídos</button></span></div>' + (showDone ? done.map(itemRow).join('') : '') + '</div>' : '') +
      '<div class="card"><div class="row" style="flex-wrap:wrap">' +
      (l.status === 'COMPLETED' ? '<button class="btn ghost sm" id="ls-re">Reabrir lista</button>' : '<button class="btn ghost sm" id="ls-done">Concluir lista</button>') +
      (l.status === 'ARCHIVED' ? '<button class="btn ghost sm" id="ls-re2">Desarquivar</button>' : '<button class="btn ghost sm" id="ls-arch">Arquivar</button>') +
      '</div></div>';
    var addF = document.getElementById('ls-addf');
    var addI = document.getElementById('ls-add');
    if (addI) addI.focus();
    if (addF) addF.onsubmit = function (ev) {
      ev.preventDefault();
      var title = addI.value;
      if (!title.trim()) return;
      try {
        var qm = title.match(/(\d+(?:[.,]\d+)?)\s?(kg|g|l|ml|un|pacote|pacotes|caixa|caixas|litros?|litro)?\s?(de\s+)?(.+)/i);
        var data = { title: title.trim() };
        if (qm && qm[4] && qm[4].trim().length >= 2 && /^\d/.test(title.trim())) data = { title: qm[4].trim(), quantity: parseFloat(qm[1].replace(',', '.')), unit: (qm[2] || '').slice(0, 20) || null };
        J.DB.addItem(me.id, l.id, data);
        toast('Item adicionado.', { assertive: true });
        render('lists/' + l.id);
        setTimeout(function () { var i2 = document.getElementById('ls-add'); if (i2) i2.focus(); }, 50);
      } catch (e4) { toast('Não foi possível adicionar.'); }
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-lstoggle]'), function (b) {
      b.onclick = function () {
        try {
          var iid = b.dataset.lstoggle;
          var cur = J.DB.getListItems(me.id, l.id, {}).filter(function (x) { return x.id === iid; })[0];
          if (cur && cur.checked) J.DB.uncheckItem(me.id, iid); else J.DB.checkItem(me.id, iid);
          render('lists/' + l.id);
        } catch (e5) { toast('Não foi possível.'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-lsedit]'), function (b) { b.onclick = function () { openListItemModal(me, l.id, b.dataset.lsedit); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-lsmove]'), function (b) {
      b.onclick = function () {
        try { var sp = b.dataset.lsmove.split('|'); J.DB.moveItem(me.id, sp[0], sp[1]); render('lists/' + l.id); }
        catch (e6) { toast('Não foi possível mover.'); }
      };
    });
    document.getElementById('ls-edit').onclick = function () { openListModal(me, l.id); };
    document.getElementById('ls-menu').onclick = function () { openListModal(me, l.id); };
    var hd = document.getElementById('ls-hide'); if (hd) hd.onclick = function () { ls.hideDone = !ls.hideDone; render('lists/' + l.id); };
    var cl = document.getElementById('ls-clear'); if (cl) cl.onclick = function () {
      var n = done.length;
      if (n >= 3 && !confirm('Remover ' + n + ' itens concluídos?')) return;
      try { J.DB.clearCheckedItems(me.id, l.id); toast('Concluídos removidos.'); render('lists/' + l.id); } catch (e7) { toast('Não foi possível.'); }
    };
    var dn = document.getElementById('ls-done'); if (dn) dn.onclick = function () { try { J.DB.completeList(me.id, l.id); toast('Lista concluída!'); render('lists/' + l.id); } catch (e8) { toast('Não foi possível.'); } };
    var re = document.getElementById('ls-re'); if (re) re.onclick = function () { try { J.DB.reopenList(me.id, l.id); render('lists/' + l.id); } catch (e9) {} };
    var ar = document.getElementById('ls-arch'); if (ar) ar.onclick = function () { try { J.DB.archiveList(me.id, l.id); toast('Lista arquivada.'); location.hash = '#/lists'; } catch (e10) { toast('Não foi possível.'); } };
    var re2 = document.getElementById('ls-re2'); if (re2) re2.onclick = function () { try { J.DB.reopenList(me.id, l.id); render('lists/' + l.id); } catch (e11) {} };
    void members;
  }
  function openListItemModal(me, listId, itemId) {
    var it;
    try {
      it = J.DB.getListItems(me.id, listId, {}).filter(function (x) { return x.id === itemId; })[0];
      if (!it) throw new Error('x');
    } catch (e) { toast('Item não encontrado.'); return; }
    var members = [];
    try { members = J.DB.myCouple(me.id).users; } catch (e2) {}
    var l;
    try { l = J.DB.getList(me.id, listId); } catch (e3) { l = { visibility: 'PERSONAL' }; }
    modalShell('<h2>Editar item</h2><div id="me"></div>' +
      '<label>Título</label><input id="f-it" maxlength="140" value="' + esc(it.title) + '">' +
      '<label>Descrição</label><input id="f-id" maxlength="500" value="' + esc(it.description || '') + '">' +
      '<div class="row"><div><label>Quantidade</label><input id="f-iq" inputmode="decimal" placeholder="ex: 2" value="' + esc(it.quantity != null ? String(it.quantity).replace('.', ',') : '') + '"></div>' +
      '<div><label>Unidade</label><input id="f-iu" maxlength="20" placeholder="kg, L, un..." value="' + esc(it.unit || '') + '"></div></div>' +
      (l.visibility === 'COUPLE' ? '<label>Responsável</label><select id="f-ia"><option value="">Sem responsável</option>' + members.map(function (u) { return '<option value="' + u.id + '"' + (it.assigned_to === u.id ? ' selected' : '') + '>' + esc(u.nome) + (u.id === me.id ? ' (você)' : '') + '</option>'; }).join('') + '</select>' : '') +
      '<div class="row"><button class="btn ghost sm" id="it-task">Transformar em tarefa</button><button class="btn ghost sm danger" id="it-del">Excluir</button></div>' +
      '<button class="btn" id="sv">Salvar</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      try {
        var qraw = document.getElementById('f-iq').value.trim();
        var q = qraw === '' ? null : qraw;
        var patch = { title: document.getElementById('f-it').value, description: document.getElementById('f-id').value, quantity: q, unit: document.getElementById('f-iu').value || null };
        var sel = document.getElementById('f-ia');
        if (sel) patch.assigned_to = sel.value || null;
        J.DB.updateItem(me.id, itemId, patch);
        closeModal(); toast('Item atualizado!'); render(here());
      } catch (e4) { document.getElementById('me').innerHTML = err(e4); }
    };
    document.getElementById('it-del').onclick = function () {
      try { J.DB.removeItem(me.id, itemId); closeModal(); toast('Item excluído.'); render(here()); }
      catch (e5) { document.getElementById('me').innerHTML = err(e5); }
    };
    document.getElementById('it-task').onclick = function () {
      try {
        var t = J.DB.createListTask(me.id, itemId, {});
        closeModal(); toast('Tarefa criada a partir do item!');
        location.hash = '#/tasks';
        void t;
      } catch (e6) { document.getElementById('me').innerHTML = err(e6); }
    };
  }
  function ovListsCard(me, day) {
    var lst = (day && day.lists) || [];
    if (!lst.length) return '';
    var top = lst[0];
    return '<div class="card"><b>📝 ' + esc(top.name) + '</b><p class="muted">' + top.pending + ' itens pendentes • <a href="#/lists/' + top.id + '">Ver lista ›</a></p></div>';
  }
  /* ============ ETAPA 6: CALENDÁRIO ============ */
  /* ============ ROTINAS (só apresentação sobre RoutineService) ============
     Rotina orquestra ações; nunca duplica Habit/Task/List/Agenda. */
  var rt = { tab: 'today', vis: 'all', q: '', focus: false };
  function rtFreqLbl(r) {
    var c = r.frequency_config || {};
    if (r.frequency_type === 'DAILY') return (c.interval > 1 ? 'A cada ' + c.interval + ' dias' : 'Todo dia');
    if (r.frequency_type === 'WEEKLY') return 'Toda semana';
    if (r.frequency_type === 'MONTHLY') return 'Todo mês' + (c.dayOfMonth ? ' (dia ' + c.dayOfMonth + ')' : '');
    if (r.frequency_type === 'SPECIFIC_DAYS') {
      var nm = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
      return (c.daysOfWeek || []).map(function (d) { return nm[d]; }).join(', ') || 'Dias específicos';
    }
    return 'Personalizada';
  }
  function pRoutines(v, me) {
    var tabs = [['today', 'Hoje'], ['all', 'Todas'], ['PERSONAL', 'Pessoais'], ['COUPLE', 'Casal']];
    var html = '<div class="card"><div class="row between" style="flex-wrap:wrap"><h1 style="margin:0">Rotinas</h1><button class="btn" id="rt-new" style="max-width:190px">+ Nova rotina</button></div>' +
      '<div class="seg-scroll"><div class="seg" role="tablist" aria-label="Filtro">' +
      tabs.map(function (x) { return '<button data-rttab="' + x[0] + '" class="' + ((rt.tab === x[0] && (x[0] === 'today' || x[0] === 'all')) || rt.tab === x[0] ? 'on' : '') + '" role="tab">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="seg" role="group" aria-label="Visibilidade"><button data-rtvis="all" class="' + (rt.vis === 'all' ? 'on' : '') + '">Todas</button><button data-rtvis="PERSONAL" class="' + (rt.vis === 'PERSONAL' ? 'on' : '') + '">Pessoais</button><button data-rtvis="COUPLE" class="' + (rt.vis === 'COUPLE' ? 'on' : '') + '">Casal</button></div>' +
      '<input id="rt-q" placeholder="🔍 Buscar rotinas" value="' + esc(rt.q) + '" aria-label="Buscar rotinas"></div>';
    var rows = [], rel = {}, errMsg = null;
    try {
      var vis = rt.vis === 'all' ? undefined : rt.vis;
      if (rt.tab === 'today') {
        var t = J.DB.getTodayExecutions(me.id, todayISO());
        rows = t.map(function (x) { rel[x.routine.id] = x.execution; return { id: x.routine.id, name: x.routine.name, visibility: x.routine.visibility, preferred_time: x.routine.preferred_time, status: 'ACTIVE', frequency_type: '', frequency_config: {} }; });
        if (vis) rows = rows.filter(function (r) { return r.visibility === vis; });
        if (rt.q) { var qq = rt.q.toLowerCase(); rows = rows.filter(function (r) { return r.name.toLowerCase().indexOf(qq) >= 0; }); }
      } else if (rt.tab === 'all' || rt.tab === 'PERSONAL' || rt.tab === 'COUPLE') {
        var vv = rt.tab === 'all' ? vis : rt.tab;
        rows = J.DB.getRoutines(me.id, { visibility: vv, search: rt.q || undefined, limit: 100 });
      }
    } catch (e) { errMsg = e; }
    if (errMsg) { v.innerHTML = html + '<div class="card"><b>Rotinas</b><div class="alert">Não foi possível carregar suas rotinas.</div><button class="btn ghost" data-rtretry>Tentar novamente</button></div>'; bindRoutines(v, me); return; }
    if (!rows.length) {
      var emptyTxt = rt.tab === 'today' ? 'Nenhuma rotina prevista para hoje.' : 'Crie rotinas para organizar ações que você costuma fazer juntas. Exemplos: manhã, noite, organização da casa ou planejamento semanal.';
      html += '<div class="card empty"><div class="ico">🔁</div><h2>' + esc(emptyTxt) + '</h2>' + (rt.tab === 'today' ? '' : '<button class="btn" id="rt-new2" style="max-width:220px;margin:0 auto">+ Nova rotina</button>') + '</div>';
    } else {
      html += rows.slice(0, 60).map(function (r) {
        var prog = null;
        try {
          if (rel[r.id]) prog = { done: rel[r.id].done, total: rel[r.id].total };
          else if (rt.tab === 'today') { var ex0 = J.DB.getOrCreateExecution(me.id, r.id, todayISO()); prog = { done: ex0.done, total: ex0.total }; }
        } catch (e2) {}
        var sub;
        if (prog && prog.total) sub = prog.done + ' de ' + prog.total + ' hoje';
        else if (r.status === 'PAUSED') sub = 'Pausada';
        else if (rt.tab === 'today') sub = rtFreqLbl(r) + (r.preferred_time ? ' • ' + r.preferred_time : '');
        else {
          var nx = null;
          try { nx = J.DB.routineNextOccurrence(me.id, r.id, todayISO()); } catch (e3) {}
          sub = rtFreqLbl(r) + (nx ? ' • Próxima: ' + dueLabel(nx) : '') + (r.preferred_time ? ' • ' + r.preferred_time : '');
        }
        return '<a class="card dash-link" href="#/routines/' + r.id + '" aria-label="Abrir rotina ' + esc(r.name) + '"><div class="row between"><b>' + esc(r.name) + '</b><span class="pill">' + (r.visibility === 'COUPLE' ? '❤️ Casal' : '👤 Pessoal') + '</span></div>' +
          '<p class="muted">' + esc(sub) + (r.status === 'PAUSED' ? ' • Pausada' : '') + '</p></a>';
      }).join('');
    }
    v.innerHTML = html;
    bindRoutines(v, me);
  }
  function bindRoutines(v, me) {
    var nw = document.getElementById('rt-new'); if (nw) nw.onclick = function () { openRoutineModal(me, null); };
    var nw2 = document.getElementById('rt-new2'); if (nw2) nw2.onclick = function () { openRoutineModal(me, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-rttab]'), function (b) { b.onclick = function () { rt.tab = b.dataset.rttab; render('routines'); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-rtvis]'), function (b) { b.onclick = function () { rt.vis = b.dataset.rtvis; render('routines'); }; });
    var q = document.getElementById('rt-q'); if (q) q.onchange = function (e) { rt.q = e.target.value; render('routines'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-rtretry]'), function (b) { b.onclick = function () { render('routines'); }; });
  }
  function openRoutineModal(me, routineId) {
    var r = null;
    if (routineId) { try { r = J.DB.getRoutine(me.id, routineId); } catch (e) { toast('Rotina não encontrada.'); return; } }
    var fq = r ? r.frequency_type : 'DAILY';
    var cfg = (r && r.frequency_config) || {};
    modalShell('<h2>' + (r ? 'Editar rotina' : 'Nova rotina') + '</h2><div id="me"></div>' +
      '<label>Nome *</label><input id="f-rn" maxlength="80" value="' + esc(r ? r.name : '') + '">' +
      '<label>Descrição</label><input id="f-rd" maxlength="500" value="' + esc(r ? (r.description || '') : '') + '">' +
      '<label>É</label><div class="row"><label class="check"><input type="radio" name="rtvis" value="PERSONAL"' + ((!r || r.visibility === 'PERSONAL') ? ' checked' : '') + '> Pessoal</label><label class="check"><input type="radio" name="rtvis" value="COUPLE"' + ((r && r.visibility === 'COUPLE') ? ' checked' : '') + '> Do casal</label></div>' +
      '<div class="row"><div><label>Frequência</label><select id="f-rf"><option value="DAILY">Todo dia</option><option value="WEEKLY">Toda semana</option><option value="MONTHLY">Todo mês</option><option value="SPECIFIC_DAYS">Dias específicos</option></select></div>' +
      '<div><label>Horário preferencial</label><input id="f-rp" type="time" value="' + esc(r ? (r.preferred_time || '') : '') + '"></div></div>' +
      '<div id="rt-wd" style="display:none"><label>Dias</label><div class="row" style="flex-wrap:wrap">' + [['1', 'SEG'], ['2', 'TER'], ['3', 'QUA'], ['4', 'QUI'], ['5', 'SEX'], ['6', 'SÁB'], ['0', 'DOM']].map(function (d) { return '<label class="check" style="flex:1 1 22%"><input type="checkbox" data-rwd="' + d[0] + '"' + ((cfg.daysOfWeek || []).indexOf(+d[0]) >= 0 ? ' checked' : '') + '> ' + d[1] + '</label>'; }).join('') + '</div></div>' +
      '<div class="row"><div><label>Início</label><input id="f-rs" type="date" value="' + esc(r ? (r.start_date || '') : todayISO()) + '"></div>' +
      '<div><label>Fim (opcional)</label><input id="f-re" type="date" value="' + esc(r && r.end_date ? r.end_date : '') + '"></div></div>' +
      '<p class="muted">Rotina organiza ações; não vira compromisso da agenda nem cria tarefas sozinha.</p>' +
      '<button class="btn" id="sv">' + (r ? 'Salvar' : 'Criar rotina') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    var fsel = document.getElementById('f-rf'); fsel.value = fq;
    function paintW() { document.getElementById('rt-wd').style.display = fsel.value === 'SPECIFIC_DAYS' ? '' : 'none'; }
    fsel.onchange = paintW; paintW();
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var vs = document.querySelector('input[name="rtvis"]:checked');
        var wds = [];
        if (fsel.value === 'SPECIFIC_DAYS') Array.prototype.forEach.call(document.querySelectorAll('[data-rwd]'), function (c) { if (c.checked) wds.push(+c.dataset.rwd); });
        var data = { name: document.getElementById('f-rn').value, description: document.getElementById('f-rd').value, visibility: vs ? vs.value : 'PERSONAL', frequency_type: fsel.value, frequency_config: { interval: 1, daysOfWeek: wds }, preferred_time: document.getElementById('f-rp').value || null, start_date: document.getElementById('f-rs').value || null, end_date: document.getElementById('f-re').value || null };
        if (!r && data.visibility === 'COUPLE' && !confirm('Essa rotina passará a ser visível para seu parceiro. Continuar?')) { unlock(btn); return; }
        if (r && data.visibility !== r.visibility && data.visibility === 'COUPLE' && !confirm('Essa rotina passará a ser visível para seu parceiro. Continuar?')) { unlock(btn); return; }
        if (r) { J.DB.updateRoutine(me.id, r.id, data); toast('Rotina atualizada!'); closeModal(); render(here()); }
        else { var nr = J.DB.createRoutine(me.id, data); toast('Rotina criada! 🔁'); location.hash = '#/routines/' + nr.id; closeModal(); return; }
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function pRoutineDetail(v, me, routineId) {
    var r;
    try { r = J.DB.getRoutine(me.id, routineId); }
    catch (e) { v.innerHTML = '<div class="card"><b>Rotina</b><div class="alert">Não foi possível carregar suas rotinas.</div><p><a href="#/routines">‹ Voltar para Rotinas</a></p></div>'; return; }
    var dueToday = false;
    try { dueToday = J.DB.routineIsDueOnDate(r, todayISO()); } catch (e2) {}
    var ex = null;
    if (dueToday && r.status === 'ACTIVE') { try { ex = J.DB.getOrCreateExecution(me.id, r.id, todayISO()); } catch (e3) {} }
    else { ex = null; }
    var items = [];
    try { items = J.DB.getRoutineItems(me.id, r.id); } catch (e5) {}
    var nx = null;
    try { nx = J.DB.routineNextOccurrence(me.id, r.id, todayISO()); } catch (e6) {}
    var head = '<p class="muted"><a href="#/routines">‹ Rotinas</a></p>' +
      '<div class="card"><div class="row between" style="flex-wrap:wrap"><div><h1 style="margin:0">' + esc(r.name) + '</h1><p class="muted">' + esc(rtFreqLbl(r)) + ' • ' + (r.visibility === 'COUPLE' ? 'Do casal' : 'Pessoal') + (r.preferred_time ? ' • ' + esc(r.preferred_time) : '') + (r.status !== 'ACTIVE' ? ' • ' + (r.status === 'PAUSED' ? 'Pausada' : 'Arquivada') : '') + '</p></div>' +
      '<span><button class="btn ghost sm" id="rt-edit">Editar</button></span></div>' +
      (r.description ? '<p class="muted">' + esc(r.description) + '</p>' : '') +
      (nx && !dueToday ? '<p class="muted">Próxima: <b>' + esc(dueLabel(nx)) + '</b></p>' : '') + '</div>';
    if (!ex) {
      v.innerHTML = head + '<div class="card"><b>Itens (' + items.length + ')</b>' + (items.length ? items.map(function (it) { return '<p>○ ' + esc(it.title) + (it.item_type === 'LINKED_ENTITY' ? ' <span class="muted">• vinculado</span>' : '') + '</p>'; }).join('') : '<p class="muted">Sem itens ainda.</p>') + '</div>' + rtDetailActions(r);
      bindRoutineDetail(v, me, r, null);
      return;
    }
    var pend = ex.items.filter(function (it) { return it.status === 'PENDING' && !it.removed; });
    var prog = '<div class="bar" role="progressbar" aria-label="Progresso da execução"><span style="width:' + (ex.total ? Math.round(ex.done / ex.total * 100) : 0) + '%"></span></div>' +
      '<p class="muted" aria-live="polite">Hoje • ' + ex.done + ' de ' + ex.total + (ex.status === 'COMPLETED' ? ' • Concluída' : ex.status === 'SKIPPED' ? ' • Pulada' : '') + '</p>';
    function itemRow(it) {
      var who = it.assigned_to ? J.DB.userName(me.id, it.assigned_to) : null;
      var link = it.item_type === 'LINKED_ENTITY' && it.linked_entity_type === 'LIST' ? ' • <a href="#/lists/' + it.linked_entity_id + '">abrir lista ›</a>' : it.item_type === 'LINKED_ENTITY' && it.linked_entity_type === 'TASK' ? ' • <a href="#/tasks">ver tarefa ›</a>' : it.item_type === 'LINKED_ENTITY' && it.linked_entity_type === 'HABIT' ? ' • <a href="#/habits">ver hábito ›</a>' : '';
      var st = it.status === 'COMPLETED' ? '✓' : it.status === 'SKIPPED' ? '–' : '';
      return '<div class="ov-row"><button class="chk' + (it.status === 'COMPLETED' ? ' done' : '') + '" data-rtdone="' + it.id + '" aria-pressed="' + (it.status === 'COMPLETED') + '" aria-label="' + esc((it.status === 'COMPLETED' ? 'Reabrir ' : 'Concluir ') + it.title) + '">' + st + '</button>' +
        '<span style="flex:1;min-width:0"><b>' + esc(it.title) + '</b>' + (it.required === false ? ' <span class="muted">(opcional)</span>' : '') + (who && r.visibility === 'COUPLE' ? '<br><span class="muted">👤 ' + esc(who) + '</span>' : '') + link + '</span>' +
        '<span style="display:flex;gap:2px;flex:none">' +
        (it.status === 'PENDING' ? '<button class="btn ghost sm" data-rtskip="' + it.id + '" style="max-width:64px">Pular</button>' : '<button class="btn ghost sm" data-rtredo="' + it.id + '" style="max-width:70px">Desfazer</button>') +
        '<button class="btn ghost sm" data-rtedit="' + it.routine_item_id + '" style="max-width:64px">Editar</button></span></div>';
    }
    var body = '';
    if (rt.focus && pend.length) {
      var cur = pend[0];
      body = '<div class="card center"><b>' + esc(r.name) + '</b><p class="muted">' + ex.done + ' de ' + ex.total + '</p><h2>' + esc(cur.title) + '</h2>' +
        '<div class="row" style="justify-content:center"><button class="btn" id="fc-done" style="max-width:160px">Concluir</button><button class="btn ghost" id="fc-skip" style="max-width:160px">Pular</button></div>' +
        '<p><button class="link" id="fc-all">Ver todos os itens</button></p></div>';
    } else {
      body = '<div class="card">' + prog +
        '<form id="rt-addf"><input id="rt-add" placeholder="Adicionar item... (Enter adiciona)" autocomplete="off" aria-label="Adicionar item"></form></div>' +
        (ex.items.filter(function (it) { return !it.removed; }).length ? '<div class="card"><div class="row between"><b>Itens de hoje</b><button class="btn ghost sm" id="rt-focus">Modo foco</button></div>' + ex.items.filter(function (it) { return !it.removed; }).map(itemRow).join('') + '</div>' : '<div class="card"><p class="muted">Adicione o primeiro item.</p></div>');
    }
    v.innerHTML = head + body + rtDetailActions(r, ex);
    bindRoutineDetail(v, me, r, ex);
  }
  function rtDetailActions(r, ex) {
    var h = '<div class="card"><div class="row" style="flex-wrap:wrap">';
    if (ex && ex.status !== 'COMPLETED' && ex.status !== 'SKIPPED') {
      h += '<button class="btn ghost sm" id="rt-finish">Concluir rotina</button><button class="btn ghost sm" id="rt-skipex">Pular hoje</button>';
    }
    if (r.status === 'ACTIVE') h += '<button class="btn ghost sm" id="rt-pause">Pausar</button>';
    else if (r.status === 'PAUSED') h += '<button class="btn ghost sm" id="rt-resume">Retomar</button>';
    if (r.status !== 'ARCHIVED') h += '<button class="btn ghost sm" id="rt-arch">Arquivar</button>';
    return h + '</div></div>';
  }
  function bindRoutineDetail(v, me, r, ex) {
    document.getElementById('rt-edit').onclick = function () { openRoutineModal(me, r.id); };
    var addF = document.getElementById('rt-addf');
    if (addF) addF.onsubmit = function (ev) {
      ev.preventDefault();
      var inp = document.getElementById('rt-add');
      if (!inp.value.trim()) return;
      try { J.DB.addRoutineItem(me.id, r.id, { title: inp.value.trim() }); toast('Item adicionado.'); render('routines/' + r.id); }
      catch (e) { toast('Não foi possível adicionar.'); }
    };
    if (ex) {
      Array.prototype.forEach.call(v.querySelectorAll('[data-rtdone]'), function (b) {
        b.onclick = function () {
          try {
            var it = ex.items.filter(function (x) { return x.id === b.dataset.rtdone; })[0];
            if (it && it.status === 'COMPLETED') J.DB.reopenRoutineItem(me.id, ex.id, it.id);
            else J.DB.completeRoutineItem(me.id, ex.id, b.dataset.rtdone, {});
            render('routines/' + r.id);
          } catch (e2) { toast(e2.message || 'Não foi possível.'); }
        };
      });
      Array.prototype.forEach.call(v.querySelectorAll('[data-rtskip]'), function (b) {
        b.onclick = function () { try { J.DB.skipRoutineItem(me.id, ex.id, b.dataset.rtskip); render('routines/' + r.id); } catch (e3) { toast('Não foi possível.'); } };
      });
      Array.prototype.forEach.call(v.querySelectorAll('[data-rtredo]'), function (b) {
        b.onclick = function () { try { J.DB.reopenRoutineItem(me.id, ex.id, b.dataset.rtredo); render('routines/' + r.id); } catch (e4) { toast('Não foi possível.'); } };
      });
      var fc = document.getElementById('rt-focus'); if (fc) fc.onclick = function () { rt.focus = true; render('routines/' + r.id); };
      var fa = document.getElementById('fc-all'); if (fa) fa.onclick = function () { rt.focus = false; render('routines/' + r.id); };
      var fd = document.getElementById('fc-done');
      if (fd) fd.onclick = function () {
        try {
          var p = ex.items.filter(function (x) { return x.status === 'PENDING'; })[0];
          if (p) J.DB.completeRoutineItem(me.id, ex.id, p.id, {});
          render('routines/' + r.id);
        } catch (e5) { toast(e5.message || 'Não foi possível.'); }
      };
      var fs = document.getElementById('fc-skip');
      if (fs) fs.onclick = function () {
        try {
          var p2 = ex.items.filter(function (x) { return x.status === 'PENDING'; })[0];
          if (p2) J.DB.skipRoutineItem(me.id, ex.id, p2.id);
          render('routines/' + r.id);
        } catch (e6) { toast('Não foi possível.'); }
      };
      var fin = document.getElementById('rt-finish');
      if (fin) fin.onclick = function () { try { J.DB.completeExecution(me.id, ex.id, {}); toast('Rotina concluída!'); render('routines/' + r.id); } catch (e7) { toast(e7.message || 'Não foi possível.'); } };
      var sk = document.getElementById('rt-skipex');
      if (sk) sk.onclick = function () { try { J.DB.skipExecution(me.id, ex.id); toast('Execução de hoje pulada.'); render('routines/' + r.id); } catch (e8) { toast('Não foi possível.'); } };
    }
    Array.prototype.forEach.call(v.querySelectorAll('[data-rtedit]'), function (b) { b.onclick = function () { openRoutineItemModal(me, r.id, b.dataset.rtedit); }; });
    var pa = document.getElementById('rt-pause'); if (pa) pa.onclick = function () { try { J.DB.pauseRoutine(me.id, r.id); toast('Rotina pausada.'); render('routines/' + r.id); } catch (e9) { toast('Não foi possível.'); } };
    var rs = document.getElementById('rt-resume'); if (rs) rs.onclick = function () { try { J.DB.resumeRoutine(me.id, r.id); toast('Rotina retomada!'); render('routines/' + r.id); } catch (e10) { toast('Não foi possível.'); } };
    var ar = document.getElementById('rt-arch'); if (ar) ar.onclick = function () { try { J.DB.archiveRoutine(me.id, r.id); toast('Rotina arquivada.'); location.hash = '#/routines'; } catch (e11) { toast('Não foi possível.'); } };
  }
  function openRoutineItemModal(me, routineId, itemId) {
    var it;
    try {
      it = J.DB.getRoutineItems(me.id, routineId).filter(function (x) { return x.id === itemId; })[0];
      if (!it) throw new Error('x');
    } catch (e) { toast('Item não encontrado.'); return; }
    var members = [];
    try { members = J.DB.myCouple(me.id).users; } catch (e2) {}
    var r;
    try { r = J.DB.getRoutine(me.id, routineId); } catch (e3) { r = { visibility: 'PERSONAL' }; }
    var tasks = [], habits = [], lists = [], agenda = [];
    try { tasks = J.DB.getTasks(me.id, { limit: 100 }); } catch (e4) {}
    try { habits = J.DB.getHabits(me.id, {}); } catch (e5) {}
    try { lists = J.DB.getLists(me.id, { limit: 100 }); } catch (e6) {}
    try {
      var seen = {};
      J.DB.agendaUpcoming(me.id, { from: todayISO(), days: 30, limit: 100, vision: 'couple' }).forEach(function (o) {
        if (o.event_id && !seen[o.event_id]) { seen[o.event_id] = true; agenda.push({ id: o.event_id, title: o.title }); }
      });
    } catch (e7) {}
    function entOpts(rows, label) {
      return '<optgroup label="' + label + '">' + rows.slice(0, 40).map(function (x) {
        var nm = x.title || x.name;
        return '<option value="' + x.id + '">' + esc(String(nm).slice(0, 50)) + '</option>';
      }).join('') + '</optgroup>';
    }
    modalShell('<h2>Editar item</h2><div id="me"></div>' +
      '<label>Título</label><input id="f-it" maxlength="140" value="' + esc(it.title) + '">' +
      '<label><input type="checkbox" id="f-ir"' + (it.required === false ? '' : ' checked') + '> Obrigatório para concluir a rotina</label>' +
      (r.visibility === 'COUPLE' ? '<label>Responsável</label><select id="f-ia"><option value="">Sem responsável</option>' + members.map(function (u) { return '<option value="' + u.id + '"' + (it.assigned_to === u.id ? ' selected' : '') + '>' + esc(u.nome) + (u.id === me.id ? ' (você)' : '') + '</option>'; }).join('') + '</select>' : '') +
      '<label>Vínculo (opcional)</label><select id="f-il"><option value="">Ação interna</option>' +
      '<option value="HABIT"' + (it.linked_entity_type === 'HABIT' ? ' selected' : '') + '>Hábito</option>' +
      '<option value="TASK"' + (it.linked_entity_type === 'TASK' ? ' selected' : '') + '>Tarefa</option>' +
      '<option value="LIST"' + (it.linked_entity_type === 'LIST' ? ' selected' : '') + '>Lista</option>' +
      '<option value="AGENDA_EVENT"' + (it.linked_entity_type === 'AGENDA_EVENT' ? ' selected' : '') + '>Compromisso</option></select>' +
      '<select id="f-ie" aria-label="Entidade vinculada">' + entOpts(habits, 'Hábitos') + entOpts(tasks, 'Tarefas') + entOpts(lists, 'Listas') + entOpts(agenda, 'Compromissos') + '</select>' +
      '<div class="row"><button class="btn ghost sm" id="it-up">↑ Subir</button><button class="btn ghost sm" id="it-down">↓ Descer</button><button class="btn ghost sm danger" id="it-del">Excluir</button></div>' +
      '<button class="btn" id="sv">Salvar</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    if (it.linked_entity_id) { try { document.getElementById('f-ie').value = it.linked_entity_id; } catch (e8) {} }
    document.getElementById('sv').onclick = function () {
      try {
        var lt = document.getElementById('f-il').value || null;
        var patch = { title: document.getElementById('f-it').value, required: document.getElementById('f-ir').checked, item_type: lt ? 'LINKED_ENTITY' : 'ACTION', linked_entity_type: lt, linked_entity_id: lt ? document.getElementById('f-ie').value : null };
        var sel = document.getElementById('f-ia');
        if (sel) patch.assigned_to = sel.value || null;
        J.DB.updateRoutineItem(me.id, itemId, patch);
        closeModal(); toast('Item atualizado!'); render(here());
      } catch (e9) { document.getElementById('me').innerHTML = err(e9); }
    };
    document.getElementById('it-del').onclick = function () {
      try { J.DB.removeRoutineItem(me.id, itemId); closeModal(); toast('Item excluído.'); render(here()); }
      catch (e10) { document.getElementById('me').innerHTML = err(e10); }
    };
    document.getElementById('it-up').onclick = function () { try { J.DB.moveRoutineItem(me.id, itemId, 'up'); closeModal(); render(here()); } catch (e11) {} };
    document.getElementById('it-down').onclick = function () { try { J.DB.moveRoutineItem(me.id, itemId, 'down'); closeModal(); render(here()); } catch (e12) {} };
  }
  function ovRoutinesCard(me, day) {
    var lst = (day && day.routines) || [];
    if (!lst.length) return '';
    var top = lst[0];
    return '<div class="card"><b>🔁 ' + esc(top.name) + '</b><p class="muted">' + top.done + ' de ' + top.total + ' • <a href="#/routines/' + top.id + '">Continuar ›</a></p></div>';
  }
  /* ============ PROJETOS (só apresentação sobre ProjectService) ============
     Projeto agrega via project_links; cada entidade segue no seu serviço. */
  var pj = { tab: 'active', vis: 'all', q: '', dtab: 'overview', cur: null };
  function pjStatusLbl(s) {
    return { PLANNING: 'Planejamento', ACTIVE: 'Ativo', PAUSED: 'Pausado', COMPLETED: 'Concluído', ARCHIVED: 'Arquivado' }[s] || s;
  }
  function pjNextLbl(n) {
    if (!n) return 'Nada futuro vinculado';
    return n.title + ' • ' + dueLabel(n.date);
  }
  function pProjects(v, me) {
    var tabs = [['active', 'Ativos'], ['PLANNING', 'Planejamento'], ['COMPLETED', 'Concluídos'], ['all', 'Todos']];
    var html = '<div class="card"><div class="row between" style="flex-wrap:wrap"><h1 style="margin:0">Projetos</h1><button class="btn" id="pj-new" style="max-width:190px">+ Novo projeto</button></div>' +
      '<div class="seg-scroll"><div class="seg" role="tablist" aria-label="Status">' +
      tabs.map(function (x) { return '<button data-pjtab="' + x[0] + '" class="' + (pj.tab === x[0] ? 'on' : '') + '" role="tab">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="seg" role="group" aria-label="Visibilidade"><button data-pjvis="all" class="' + (pj.vis === 'all' ? 'on' : '') + '">Todos</button><button data-pjvis="PERSONAL" class="' + (pj.vis === 'PERSONAL' ? 'on' : '') + '">Pessoais</button><button data-pjvis="COUPLE" class="' + (pj.vis === 'COUPLE' ? 'on' : '') + '">Casal</button></div>' +
      '<input id="pj-q" placeholder="🔍 Buscar projetos" value="' + esc(pj.q) + '" aria-label="Buscar projetos"></div>';
    var rows = [], errMsg = null;
    try {
      var f = { search: pj.q || undefined, limit: 100 };
      if (pj.tab === 'active') f.status = 'ACTIVE';
      else if (pj.tab !== 'all') f.status = pj.tab;
      else f.include_archived = true;
      if (pj.vis !== 'all') f.visibility = pj.vis;
      rows = J.DB.getProjects(me.id, f);
      if (pj.tab === 'active') rows = rows.concat(J.DB.getProjects(me.id, { status: 'PLANNING', visibility: f.visibility, search: f.search, limit: 100 }));
    } catch (e) { errMsg = e; }
    if (errMsg) { v.innerHTML = html + '<div class="card"><b>Projetos</b><div class="alert">Não foi possível carregar seus projetos.</div><button class="btn ghost" data-pjretry>Tentar novamente</button></div>'; bindProjects(v, me); return; }
    if (!rows.length) {
      html += '<div class="card empty"><div class="ico">🗂</div><h2>Organize objetivos maiores em projetos.</h2><p class="muted">Reúna tarefas, listas, compromissos, metas e planejamento em um só lugar.</p><button class="btn" id="pj-new2" style="max-width:220px;margin:0 auto">+ Novo projeto</button></div>';
    } else {
      html += rows.slice(0, 60).map(function (p) {
        var s = null;
        try { s = J.DB.getProjectSummary(me.id, p.id); } catch (e2) {}
        var prog = s ? s.taskDone + '/' + s.taskTotal + ' tarefas' : '';
        var goal = s && s.goalPct != null ? ' • Meta ' + String(s.goalPct).replace('.', ',') + '%' : '';
        var nx = s && s.upcoming && s.upcoming.length ? '<br><span class="muted">Próximo: ' + esc(pjNextLbl(s.upcoming[0])) + '</span>' : '';
        return '<a class="card dash-link" href="#/projects/' + p.id + '" aria-label="Abrir projeto ' + esc(p.name) + '"><div class="row between"><b>' + esc(p.name) + '</b><span class="pill">' + (p.visibility === 'COUPLE' ? '❤️ Casal' : '👤 Pessoal') + '</span></div>' +
          '<p class="muted">' + esc(pjStatusLbl(p.status)) + (p.target_date ? ' • Prazo ' + esc(dueLabel(p.target_date)) : '') + '</p>' +
          '<p>' + esc(prog) + esc(goal) + nx + '</p></a>';
      }).join('');
    }
    v.innerHTML = html;
    bindProjects(v, me);
  }
  function bindProjects(v, me) {
    var nw = document.getElementById('pj-new'); if (nw) nw.onclick = function () { openProjectModal(me, null); };
    var nw2 = document.getElementById('pj-new2'); if (nw2) nw2.onclick = function () { openProjectModal(me, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-pjtab]'), function (b) { b.onclick = function () { pj.tab = b.dataset.pjtab; render('projects'); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-pjvis]'), function (b) { b.onclick = function () { pj.vis = b.dataset.pjvis; render('projects'); }; });
    var q = document.getElementById('pj-q'); if (q) q.onchange = function (e) { pj.q = e.target.value; render('projects'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-pjretry]'), function (b) { b.onclick = function () { render('projects'); }; });
  }
  function openProjectModal(me, projectId) {
    var p = null;
    if (projectId) { try { p = J.DB.getProject(me.id, projectId); } catch (e) { toast('Projeto não encontrado.'); return; } }
    modalShell('<h2>' + (p ? 'Editar projeto' : 'Novo projeto') + '</h2><div id="me"></div>' +
      '<label>Nome *</label><input id="f-pn" maxlength="80" value="' + esc(p ? p.name : '') + '">' +
      '<label>Descrição</label><input id="f-pd" maxlength="500" value="' + esc(p ? (p.description || '') : '') + '">' +
      '<label>É</label><div class="row"><label class="check"><input type="radio" name="pjvis" value="PERSONAL"' + ((!p || p.visibility === 'PERSONAL') ? ' checked' : '') + '> Pessoal</label><label class="check"><input type="radio" name="pjvis" value="COUPLE"' + ((p && p.visibility === 'COUPLE') ? ' checked' : '') + '> Do casal</label></div>' +
      '<div class="row"><div><label>Início</label><input id="f-ps" type="date" value="' + esc(p ? (p.start_date || '') : todayISO()) + '"></div>' +
      '<div><label>Prazo desejado</label><input id="f-pt" type="date" value="' + esc(p && p.target_date ? p.target_date : '') + '"></div></div>' +
      '<p class="muted">Projeto reúne o que já existe; nada é copiado.</p>' +
      '<button class="btn" id="sv">' + (p ? 'Salvar' : 'Criar projeto') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var vs = document.querySelector('input[name="pjvis"]:checked');
        var data = { name: document.getElementById('f-pn').value, description: document.getElementById('f-pd').value, visibility: vs ? vs.value : 'PERSONAL', start_date: document.getElementById('f-ps').value || null, target_date: document.getElementById('f-pt').value || null };
        if (!p && data.visibility === 'COUPLE' && !confirm('Esse projeto passará a ser visível para seu parceiro. Continuar?')) { unlock(btn); return; }
        if (p && data.visibility !== p.visibility && data.visibility === 'COUPLE' && !confirm('Esse projeto passará a ser visível para seu parceiro. Continuar?')) { unlock(btn); return; }
        if (p) { J.DB.updateProject(me.id, p.id, data); toast('Projeto atualizado!'); closeModal(); render(here()); }
        else { var np = J.DB.createProject(me.id, data); toast('Projeto criado! 🗂'); location.hash = '#/projects/' + np.id; closeModal(); return; }
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function pProjectDetail(v, me, pid) {
    var p;
    try { p = J.DB.getProject(me.id, pid); }
    catch (e) { v.innerHTML = '<div class="card"><b>Projeto</b><div class="alert">Não foi possível carregar este projeto.</div><p><a href="#/projects">‹ Voltar para Projetos</a></p></div>'; return; }
    if (pj.cur !== pid) { pj.cur = pid; pj.dtab = 'overview'; }
    var ov = null, act = [];
    try { ov = J.DB.getProjectOverview(me.id, pid); } catch (e2) { ov = null; }
    try { act = J.DB.getProjectActivity(me.id, pid, 10); } catch (e3) {}
    if (!ov) { v.innerHTML = '<p class="muted"><a href="#/projects">‹ Projetos</a></p><div class="card"><div class="alert">Não foi possível carregar este projeto.</div><button class="btn ghost" onclick="location.hash=\'#/projects\'">Voltar</button></div>'; return; }
    var tabs = [['overview', 'Visão Geral'], ['tasks', 'Tarefas'], ['agenda', 'Agenda'], ['lists', 'Listas'], ['finance', 'Finanças']];
    var html = '<p class="muted"><a href="#/projects">‹ Projetos</a></p>' +
      '<div class="card"><div class="row between" style="flex-wrap:wrap"><div><h1 style="margin:0">' + esc(p.name) + '</h1><p class="muted">' + esc(pjStatusLbl(p.status)) + ' • ' + (p.visibility === 'COUPLE' ? 'Casal' : 'Pessoal') + (p.target_date ? ' • Prazo ' + esc(dueLabel(p.target_date)) : '') + '</p></div>' +
      '<span><button class="btn ghost sm" id="pj-edit">Editar</button></span></div>' +
      (p.description ? '<p class="muted">' + esc(p.description) + '</p>' : '') + '</div>' +
      '<div class="seg-scroll"><div class="seg" role="tablist" aria-label="Seções">' +
      tabs.map(function (x) { return '<button data-pjdtab="' + x[0] + '" class="' + (pj.dtab === x[0] ? 'on' : '') + '" role="tab">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div id="pj-body">' + pjDetailBody(me, p, ov, act) + '</div>' +
      '<div class="card"><div class="row" style="flex-wrap:wrap">' +
      (p.status === 'COMPLETED' ? '<button class="btn ghost sm" id="pj-re">Reabrir</button>' : '<button class="btn ghost sm" id="pj-done">Concluir projeto</button>') +
      (p.status === 'PAUSED' ? '<button class="btn ghost sm" id="pj-res">Retomar</button>' : (p.status !== 'COMPLETED' && p.status !== 'ARCHIVED' ? '<button class="btn ghost sm" id="pj-pause">Pausar</button>' : '')) +
      (p.status === 'ARCHIVED' ? '' : '<button class="btn ghost sm" id="pj-arch">Arquivar</button>') +
      ' <button class="btn ghost sm" id="pj-link">+ Vincular</button></div></div>';
    v.innerHTML = html;
    bindProjectDetail(v, me, p, ov);
  }
  function pjDetailBody(me, p, ov, act) {
    var h = '';
    if (pj.dtab === 'overview' || pj.dtab === 'tasks') {
      var up = (ov.upcoming && ov.upcoming.ok && ov.upcoming.data.length) ? ov.upcoming.data[0] : null;
      h += '<div class="card"><b>Próximo passo</b>' + (up ? '<h2>' + esc(up.title) + '</h2><p class="muted">Prazo: ' + esc(dueLabel(up.date)) + '</p>' : '<p class="muted">Nada futuro vinculado.</p>') + '</div>';
    }
    if (pj.dtab === 'overview' || pj.dtab === 'tasks') {
      var tk = (ov.tasks && ov.tasks.ok) ? ov.tasks.data : { total: 0, done: 0, items: [] };
      h += '<div class="card"><div class="row between"><b>Tarefas (' + tk.done + ' de ' + tk.total + ')</b><button class="btn ghost sm" id="pj-newtask">+ Tarefa</button></div>' +
        (tk.items.length ? tk.items.slice(0, 20).map(function (t) { return '<p>' + (t.status === 'COMPLETED' ? '✓ ' : '○ ') + esc(t.title) + (t.due_date ? ' <span class="muted">• ' + esc(dueLabel(t.due_date)) + '</span>' : '') + ' <button class="btn ghost sm" data-pjunlink="' + t.link_id + '" aria-label="Desvincular ' + esc(t.title) + '" style="max-width:40px">✕</button></p>'; }).join('') : '<p class="muted">Este projeto ainda não possui itens relacionados.</p>') + '</div>';
    }
    if (pj.dtab === 'overview' || pj.dtab === 'agenda') {
      var ag = (ov.agenda && ov.agenda.ok) ? ov.agenda.data : { items: [] };
      h += '<div class="card"><div class="row between"><b>Agenda</b><button class="btn ghost sm" id="pj-newag">+ Compromisso</button></div>' +
        (ag.items.length ? ag.items.slice(0, 20).map(function (o) { return '<p><b>' + esc(dueLabel(o.date)) + '</b> ' + esc(o.title) + ' <button class="btn ghost sm" data-pjunlink="' + o.link_id + '" aria-label="Desvincular" style="max-width:40px">✕</button></p>'; }).join('') : '<p class="muted">Sem compromissos vinculados.</p>') + '</div>';
    }
    if (pj.dtab === 'overview' || pj.dtab === 'lists') {
      var ls = (ov.lists && ov.lists.ok) ? ov.lists.data : [];
      var rt = [];
      try {
        var _ov2 = ov;
        if (_ov2.routines && _ov2.routines.ok) rt = _ov2.routines.data;
      } catch (eR) {}
      h += '<div class="card"><div class="row between"><b>Listas e rotinas</b><span><button class="btn ghost sm" id="pj-newlist">+ Lista</button> <button class="btn ghost sm" id="pj-linkrt">+ Rotina</button></span></div>' +
        (ls.length ? ls.map(function (l) { return '<p><a href="#/lists/' + l.id + '">' + esc(l.name) + '</a> <span class="muted">• ' + l.pending + ' pendentes</span> <button class="btn ghost sm" data-pjunlink="' + l.link_id + '" aria-label="Desvincular" style="max-width:40px">✕</button></p>'; }).join('') : '<p class="muted">Sem listas vinculadas.</p>') +
        (rt.length ? rt.map(function (r) { return '<p><a href="#/routines/' + r.id + '">' + esc(r.name) + '</a>' + (r.dueToday ? ' <span class="muted">• hoje</span>' : '') + ' <button class="btn ghost sm" data-pjunlink="' + r.link_id + '" aria-label="Desvincular" style="max-width:40px">✕</button></p>'; }).join('') : '') + '</div>';
    }
    if (pj.dtab === 'overview' || pj.dtab === 'finance') {
      var gs = (ov.goals && ov.goals.ok) ? ov.goals.data : [];
      var ps = (ov.plans && ov.plans.ok) ? ov.plans.data : [];
      h += '<div class="card"><div class="row between"><b>Finanças</b><span><button class="btn ghost sm" id="pj-newgoal">+ Meta</button> <button class="btn ghost sm" id="pj-linkpl">+ Planejamento</button></span></div>';
      if (!gs.length && !ps.length) h += '<p class="muted">Sem metas ou planejamento vinculados. O projeto não cria contabilidade própria.</p>';
      h += gs.map(function (g) { return '<p><b>' + esc(g.name) + '</b><br><span class="muted">' + BRL(g.current) + ' / ' + BRL(g.target) + ' • ' + String(g.pct).replace('.', ',') + '%</span> <button class="btn ghost sm" data-pjunlink="' + g.link_id + '" aria-label="Desvincular" style="max-width:40px">✕</button></p>'; }).join('');
      h += ps.map(function (x) { return '<p>📊 <a href="#/planning">' + esc(x.name) + '</a> <span class="muted">• ' + esc(x.status) + '</span> <button class="btn ghost sm" data-pjunlink="' + x.link_id + '" aria-label="Desvincular" style="max-width:40px">✕</button></p>'; }).join('') + '</div>';
    }
    if (pj.dtab === 'overview') {
      if (!(ov.tasks && ov.tasks.ok)) h += '<div class="card"><div class="alert">Não foi possível carregar as tarefas relacionadas.</div><button class="btn ghost sm" data-pjretry>Tentar novamente</button></div>';
      if (!(ov.goals && ov.goals.ok)) h += '<div class="card"><div class="alert">Não foi possível carregar as metas relacionadas.</div><button class="btn ghost sm" data-pjretry>Tentar novamente</button></div>';
      h += '<div class="card"><b>Atividade</b>' + (act.length ? act.map(function (a) { return '<p class="muted">' + esc(a.actor) + ' • ' + esc(a.action) + ' • ' + esc((a.at || '').slice(0, 10).split('-').reverse().join('/')) + '</p>'; }).join('') : '<p class="muted">Sem atividade registrada.</p>') + '</div>';
    }
    return h;
  }
  function bindProjectDetail(v, me, p, ov) {
    Array.prototype.forEach.call(v.querySelectorAll('[data-pjdtab]'), function (b) { b.onclick = function () { pj.dtab = b.dataset.pjdtab; render('projects/' + p.id); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-pjunlink]'), function (b) {
      b.onclick = function () {
        if (!confirm('Desvincular do projeto? A entidade continua existindo.')) return;
        try { J.DB.unlinkEntity(me.id, b.dataset.pjunlink); toast('Desvinculado.'); render('projects/' + p.id); }
        catch (eU) { toast('Não foi possível.'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-pjretry]'), function (b) { b.onclick = function () { render('projects/' + p.id); }; });
    document.getElementById('pj-edit').onclick = function () { openProjectModal(me, p.id); };
    document.getElementById('pj-link').onclick = function () { openProjectLinkModal(me, p.id); };
    var nt = document.getElementById('pj-newtask'); if (nt) nt.onclick = function () { openProjectTaskModal(me, p); };
    var nl = document.getElementById('pj-newlist'); if (nl) nl.onclick = function () { openProjectListModal(me, p); };
    var ng = document.getElementById('pj-newgoal'); if (ng) ng.onclick = function () { openProjectGoalModal(me, p); };
    var na = document.getElementById('pj-newag'); if (na) na.onclick = function () { location.hash = '#/agenda'; };
    var lr = document.getElementById('pj-linkrt'); if (lr) lr.onclick = function () { openProjectLinkModal(me, p.id, 'ROUTINE'); };
    var lp = document.getElementById('pj-linkpl'); if (lp) lp.onclick = function () { openProjectLinkModal(me, p.id, 'FINANCIAL_PLAN'); };
    var fin = document.getElementById('pj-done'); if (fin) fin.onclick = function () {
      try { J.DB.completeProject(me.id, p.id, {}); toast('Projeto concluído!'); render('projects/' + p.id); }
      catch (e) {
        if (/ainda possui/.test(e.message || '') && confirm(e.message + ' ')) { try { J.DB.completeProject(me.id, p.id, { force: true }); toast('Projeto concluído!'); render('projects/' + p.id); } catch (e2) { toast('Não foi possível.'); } }
        else toast(e.message || 'Não foi possível.');
      }
    };
    var re = document.getElementById('pj-re'); if (re) re.onclick = function () { try { J.DB.reopenProject(me.id, p.id); render('projects/' + p.id); } catch (e3) { toast('Não foi possível.'); } };
    var pa = document.getElementById('pj-pause'); if (pa) pa.onclick = function () { try { J.DB.pauseProject(me.id, p.id); toast('Projeto pausado.'); render('projects/' + p.id); } catch (e4) { toast('Não foi possível.'); } };
    var rs = document.getElementById('pj-res'); if (rs) rs.onclick = function () { try { J.DB.resumeProject(me.id, p.id); toast('Projeto retomado!'); render('projects/' + p.id); } catch (e5) { toast('Não foi possível.'); } };
    var ar = document.getElementById('pj-arch'); if (ar) ar.onclick = function () { try { J.DB.archiveProject(me.id, p.id); toast('Projeto arquivado.'); location.hash = '#/projects'; } catch (e6) { toast('Não foi possível.'); } };
  }
  function pjEntityOptions(me, type) {
    var rows = [], label = 'Entidade';
    try {
      if (type === 'TASK') { rows = J.DB.getTasks(me.id, { limit: 100 }).map(function (t) { return { id: t.id, name: t.title }; }); label = 'Tarefa'; }
      else if (type === 'LIST') { rows = J.DB.getLists(me.id, { limit: 100 }).map(function (l) { return { id: l.id, name: l.name }; }); label = 'Lista'; }
      else if (type === 'AGENDA_EVENT') {
        var seen = {};
        J.DB.agendaOccurrences(me.id, todayISO(), J.DB.agendaAddDays(todayISO(), 90), { vision: 'couple' }).forEach(function (o) { if (o.event_id && !seen[o.event_id]) { seen[o.event_id] = true; rows.push({ id: o.event_id, name: o.title }); } });
        label = 'Compromisso';
      }
      else if (type === 'ROUTINE') { rows = J.DB.getRoutines(me.id, { limit: 100 }).map(function (r) { return { id: r.id, name: r.name }; }); label = 'Rotina'; }
      else if (type === 'GOAL') { rows = J.DB.analyticsGoals(me.id).map(function (g) { return { id: g.id, name: g.name }; }); label = 'Meta'; }
      else if (type === 'FINANCIAL_PLAN') { rows = J.DB.listPlans(me.id, {}).map(function (x) { return { id: x.id, name: x.name }; }); label = 'Planejamento'; }
    } catch (e) { rows = []; }
    return { rows: rows.slice(0, 60), label: label };
  }
  function openProjectLinkModal(me, projectId, presetType) {
    var p;
    try { p = J.DB.getProject(me.id, projectId); } catch (e) { toast('Projeto não encontrado.'); return; }
    var types = [['TASK', 'Tarefa'], ['LIST', 'Lista'], ['AGENDA_EVENT', 'Compromisso'], ['ROUTINE', 'Rotina'], ['GOAL', 'Meta'], ['FINANCIAL_PLAN', 'Planejamento']];
    modalShell('<h2>Vincular ao projeto</h2><div id="me"></div>' +
      '<label>Tipo</label><select id="f-lt">' + types.map(function (t) { return '<option value="' + t[0] + '"' + (presetType === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>' +
      '<label>Item</label><select id="f-le"></select>' +
      '<p class="muted">O item continua no seu lugar; o projeto só referencia. Itens pessoais não entram em projeto do casal.</p>' +
      '<button class="btn" id="sv">Vincular</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    function paint() {
      var t = document.getElementById('f-lt').value;
      var o = pjEntityOptions(me, t);
      document.getElementById('f-le').innerHTML = o.rows.map(function (x) { return '<option value="' + x.id + '">' + esc(String(x.name).slice(0, 60)) + '</option>'; }).join('') || '<option value="">(nada disponível)</option>';
    }
    document.getElementById('f-lt').onchange = paint; paint();
    document.getElementById('sv').onclick = function () {
      try {
        var t2 = document.getElementById('f-lt').value, eid = document.getElementById('f-le').value;
        if (!eid) throw new Error('Escolha um item.');
        J.DB.linkEntity(me.id, projectId, { entity_type: t2, entity_id: eid, relationship_type: 'RELATED' });
        closeModal(); toast('Vinculado!'); render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); }
    };
  }
  function openProjectTaskModal(me, p) {
    modalShell('<h2>Nova tarefa do projeto</h2><div id="me"></div>' +
      '<label>Título *</label><input id="f-tt" maxlength="120">' +
      '<div class="row"><div><label>Prazo</label><input id="f-td" type="date"></div>' +
      '<div><label>Prioridade</label><select id="f-tp"><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="LOW">Baixa</option></select></div></div>' +
      '<p class="muted">Será criada como tarefa ' + (p.visibility === 'COUPLE' ? 'do casal' : 'pessoal') + ' e vinculada ao projeto.</p>' +
      '<button class="btn" id="sv">Criar e vincular</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        J.DB.createProjectTask(me.id, p.id, { title: document.getElementById('f-tt').value, due_date: document.getElementById('f-td').value || null, priority: document.getElementById('f-tp').value });
        closeModal(); toast('Tarefa criada no projeto!'); render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openProjectListModal(me, p) {
    modalShell('<h2>Nova lista do projeto</h2><div id="me"></div>' +
      '<label>Nome *</label><input id="f-ln" maxlength="80">' +
      '<label>Tipo</label><select id="f-ly"><option value="GENERAL">Geral</option><option value="SHOPPING">Compras</option><option value="CHECKLIST">Checklist</option></select>' +
      '<p class="muted">Será criada como lista ' + (p.visibility === 'COUPLE' ? 'do casal' : 'pessoal') + ' e vinculada ao projeto.</p>' +
      '<button class="btn" id="sv">Criar e vincular</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        J.DB.createProjectList(me.id, p.id, { name: document.getElementById('f-ln').value, list_type: document.getElementById('f-ly').value });
        closeModal(); toast('Lista criada no projeto!'); render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openProjectGoalModal(me, p) {
    modalShell('<h2>Nova meta do projeto</h2><div id="me"></div>' +
      '<label>Nome *</label><input id="f-gn" maxlength="80">' +
      '<div class="row"><div><label>Objetivo (R$)</label><input id="f-gt" inputmode="decimal" placeholder="10000"></div>' +
      '<div><label>Prazo</label><input id="f-gd" type="date"></div></div>' +
      '<p class="muted">Aporte à meta continua sem criar movimentação.</p>' +
      '<button class="btn" id="sv">Criar e vincular</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var g = J.DB.createGoal(me.id, { name: document.getElementById('f-gn').value, target_amount: document.getElementById('f-gt').value || '0', current_amount: '0', deadline: document.getElementById('f-gd').value || '' });
        J.DB.linkEntity(me.id, p.id, { entity_type: 'GOAL', entity_id: g.id, relationship_type: 'PRIMARY' });
        closeModal(); toast('Meta criada no projeto!'); render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function ovProjectsCard(me, day) {
    var lst = (day && day.projects) || [];
    if (!lst.length) return '';
    var top = lst[0];
    return '<div class="card"><b>🗂 ' + esc(top.name) + '</b><p class="muted">' + top.taskDone + '/' + top.taskTotal + ' tarefas' + (top.upcoming && top.upcoming.length ? ' • Próximo: ' + esc(pjNextLbl(top.upcoming[0])) : '') + ' • <a href="#/projects/' + top.id + '">Ver projeto ›</a></p></div>';
  }
  /* ============ INBOX (só apresentação sobre InboxService) ============
     Capturar primeiro, organizar depois. Sugestão em linguagem humana. */
  var ibx = { tab: 'pending', vis: 'all', q: '', limit: 30 };
  function ibStatusLbl(s) {
    return { UNPROCESSED: 'Pendente', SUGGESTED: 'Pendente', AWAITING_CONFIRMATION: 'Aguardando', PROCESSED: 'Organizado', DISMISSED: 'Descartado', ARCHIVED: 'Arquivado' }[s] || s;
  }
  function ibDestLbl(t) {
    return { TASK: 'Tarefa', AGENDA_EVENT: 'Compromisso', HABIT: 'Hábito', LIST: 'Lista', LIST_ITEM: 'Item de lista', ROUTINE: 'Rotina', PROJECT: 'Projeto', TRANSACTION: 'Movimentação', GOAL: 'Meta', UNKNOWN: 'A escolher' }[t] || t;
  }
  function ibWhen(iso) {
    try { var d = String(iso || '').slice(0, 10); if (!d) return ''; return d.split('-').reverse().join('/'); } catch (e) { return ''; }
  }
  function pInbox(v, me) {
    var sum = { pending: 0 };
    try { sum = J.DB.getInboxSummary(me.id); } catch (e) {}
    var tabs = [['pending', 'Pendentes'], ['processed', 'Processados'], ['dismissed', 'Descartados']];
    var html = '<div class="card"><div class="row between" style="flex-wrap:wrap"><h1 style="margin:0">Inbox</h1><span class="pill">' + sum.pending + (sum.pending === 1 ? ' item' : ' itens') + '</span></div>' +
      '<p class="muted">Capture rápido. Organize depois.</p>' +
      '<form id="ib-quickf"><div class="row"><input id="ib-quick" placeholder="O que você quer guardar?" autocomplete="off" aria-label="Captura rápida" style="flex:1;min-width:0"><button class="btn sm" id="ib-quickgo" style="max-width:130px">Capturar</button></div></form></div>' +
      '<div class="card"><div class="seg-scroll"><div class="seg" role="tablist" aria-label="Estado">' +
      tabs.map(function (x) { return '<button data-ibtab="' + x[0] + '" class="' + (ibx.tab === x[0] ? 'on' : '') + '" role="tab">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="seg" role="group" aria-label="Visibilidade"><button data-ibvis="all" class="' + (ibx.vis === 'all' ? 'on' : '') + '">Todas</button><button data-ibvis="PERSONAL" class="' + (ibx.vis === 'PERSONAL' ? 'on' : '') + '">Pessoais</button><button data-ibvis="COUPLE" class="' + (ibx.vis === 'COUPLE' ? 'on' : '') + '">Casal</button></div>' +
      '<input id="ib-q" placeholder="🔍 Buscar na Inbox" value="' + esc(ibx.q) + '" aria-label="Buscar na Inbox"></div>';
    var rows = [], total = 0, errMsg = null;
    try {
      var f = { search: ibx.q || undefined, limit: ibx.limit + 1 };
      if (ibx.vis !== 'all') f.visibility = ibx.vis;
      if (ibx.tab === 'pending') {
        var seen = {};
        ['UNPROCESSED', 'SUGGESTED', 'AWAITING_CONFIRMATION'].forEach(function (st) {
          J.DB.getInboxItems(me.id, Object.assign({}, f, { status: st, limit: ibx.limit + 1 })).items.forEach(function (it) { if (!seen[it.id]) { seen[it.id] = true; rows.push(it); } });
        });
        rows.sort(function (a, b) { return (b.created_at + b.id).localeCompare(a.created_at + a.id); });
        total = rows.length;
      } else if (ibx.tab === 'processed') {
        var r1 = J.DB.getInboxItems(me.id, Object.assign({}, f, { status: 'PROCESSED', limit: ibx.limit + 1 }));
        rows = r1.items; total = r1.total;
      } else {
        var r2 = J.DB.getInboxItems(me.id, Object.assign({}, f, { status: 'DISMISSED', limit: ibx.limit + 1 }));
        rows = r2.items; total = r2.total;
      }
    } catch (e2) { errMsg = e2; }
    if (errMsg) { v.innerHTML = html + '<div class="card"><div class="alert">Não foi possível carregar sua Inbox.</div><button class="btn ghost" data-ibretry>Tentar novamente</button></div>'; bindInbox(v, me); return; }
    if (!rows.length) {
      var emptyTxt = ibx.tab === 'pending' ? 'Sua Inbox está vazia. Use este espaço para capturar rapidamente algo que você quer organizar depois.' : ibx.tab === 'processed' ? 'Nada organizado por aqui ainda.' : 'Nenhum item pendente para organizar.';
      html += '<div class="card empty"><div class="ico">📥</div><h2>' + esc(emptyTxt) + '</h2><button class="btn" id="ib-new2" style="max-width:220px;margin:0 auto">Capturar algo</button></div>';
    } else {
      html += rows.slice(0, ibx.limit).map(function (it) {
        var sug = '';
        try { sug = J.DB.inboxSuggestionText(it); } catch (e3) { sug = ''; }
        var dest = '';
        if (it.status === 'PROCESSED' && it.processed_entity_type) {
          var tgt = null;
          try { tgt = J.DB.inboxProcessedTarget(me.id, it.id); } catch (e4) {}
          dest = tgt && tgt.available ? '<br><a href="' + tgt.route + '">Ver destino ›</a>' : '<br><span class="muted">O item foi processado anteriormente, mas o destino não está mais disponível.</span>';
        }
        var acts = '';
        if (it.status === 'PROCESSED') acts = '<button class="btn ghost sm" data-ibarch="' + it.id + '">Arquivar</button>';
        else if (it.status === 'DISMISSED' || it.status === 'ARCHIVED') acts = '<button class="btn ghost sm" data-ibrestore="' + it.id + '">Restaurar</button>';
        else acts = '<button class="btn sm" data-iborg="' + it.id + '" style="max-width:130px">Organizar</button> <button class="btn ghost sm" data-ibedit="' + it.id + '">Editar</button> <button class="btn ghost sm" data-ibdis="' + it.id + '">Descartar</button>';
        return '<div class="card"><div class="row between"><b style="flex:1;min-width:0">' + esc(it.content) + '</b><span class="pill">' + (it.visibility === 'COUPLE' ? '❤️ Casal' : '👤 Pessoal') + '</span></div>' +
          '<p class="muted">' + esc(ibWhen(it.created_at)) + ' • ' + esc(ibStatusLbl(it.status)) + (sug ? ' • ' + esc(sug) : '') + dest + '</p>' +
          '<div class="row"><button class="btn ghost sm" data-ibopen="' + it.id + '">Detalhes</button> ' + acts + '</div></div>';
      }).join('');
      if (total > ibx.limit) html += '<div class="card center"><button class="btn ghost" id="ib-more">Carregar mais</button></div>';
    }
    v.innerHTML = html;
    bindInbox(v, me);
  }
  function bindInbox(v, me) {
    var qf = document.getElementById('ib-quickf');
    if (qf) qf.onsubmit = function (ev) {
      ev.preventDefault();
      var inp = document.getElementById('ib-quick');
      if (!inp || !inp.value.trim()) return;
      try {
        var it = J.DB.captureItem(me.id, { content: inp.value.trim(), visibility: 'PERSONAL', source: 'WEB' }, {});
        toast('Capturado! ' + (it.suggested_entity_type && it.suggested_entity_type !== 'UNKNOWN' ? J.DB.inboxSuggestionText(it) : ''));
        render('inbox');
      } catch (e) { toast('Não foi possível capturar.'); }
    };
    var nw2 = document.getElementById('ib-new2'); if (nw2) nw2.onclick = function () { openQuickCapture(me); };
    var more = document.getElementById('ib-more'); if (more) more.onclick = function () { ibx.limit += 30; render('inbox'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-ibtab]'), function (b) { b.onclick = function () { ibx.tab = b.dataset.ibtab; ibx.limit = 30; render('inbox'); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ibvis]'), function (b) { b.onclick = function () { ibx.vis = b.dataset.ibvis; render('inbox'); }; });
    var q = document.getElementById('ib-q'); if (q) q.onchange = function (e) { ibx.q = e.target.value; render('inbox'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-ibretry]'), function (b) { b.onclick = function () { render('inbox'); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ibopen]'), function (b) { b.onclick = function () { openInboxDetail(me, b.dataset.ibopen); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-iborg]'), function (b) { b.onclick = function () { openInboxOrganize(me, b.dataset.iborg); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ibedit]'), function (b) { b.onclick = function () { openInboxEditModal(me, b.dataset.ibedit); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ibdis]'), function (b) { b.onclick = function () { try { J.DB.dismissInboxItem(me.id, b.dataset.ibdis); toast('Descartado. Dá para restaurar depois.'); render('inbox'); } catch (e2) { toast('Não foi possível.'); } }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ibrestore]'), function (b) { b.onclick = function () { try { J.DB.restoreInboxItem(me.id, b.dataset.ibrestore); toast('Restaurado!'); render('inbox'); } catch (e3) { toast('Não foi possível.'); } }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ibarch]'), function (b) { b.onclick = function () { try { J.DB.archiveInboxItem(me.id, b.dataset.ibarch); render('inbox'); } catch (e4) { toast('Não foi possível.'); } }; });
  }
  function openQuickCapture(me, preset) {
    preset = preset || {};
    var attach = null;
    modalShell('<h2>Capturar</h2><div id="me"></div>' +
      '<label>O que você quer guardar?</label><input id="f-cap" maxlength="500" value="' + esc(preset.content || '') + '" aria-label="O que você quer guardar?">' +
      '<div class="row" role="group" aria-label="Anexar"><button class="btn ghost sm" id="cap-mic" aria-label="Ditar por voz">🎤 Voz</button><label class="btn ghost sm" style="cursor:pointer">📷 Foto<input type="file" id="cap-img" accept="image/jpeg,image/png,image/webp" style="display:none"></label><label class="btn ghost sm" style="cursor:pointer">📎 Arquivo<input type="file" id="cap-doc" accept="application/pdf" style="display:none"></label></div>' +
      '<p class="muted" id="cap-att" role="status"></p>' +
      '<div class="row"><label class="check"><input type="radio" name="capvis" value="PERSONAL" checked> Pessoal</label><label class="check"><input type="radio" name="capvis" value="COUPLE"> Do casal</label></div>' +
      '<p class="muted">Vai para a Inbox. Você organiza depois.</p>' +
      '<button class="btn" id="sv">Capturar</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    var inp = document.getElementById('f-cap'); if (inp) inp.focus();
    document.getElementById('cap-mic').onclick = function () {
      var st = document.getElementById('cap-att');
      try {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
        if (!SR) { if (st) st.textContent = 'Voz não suportada aqui. Digite ou envie um arquivo.'; return; }
        var r = new SR(); r.lang = 'pt-BR'; r.interimResults = false; r.maxAlternatives = 1;
        if (st) st.textContent = 'Ouvindo… fale agora.';
        r.onresult = function (ev) {
          var t = ev.results[0][0].transcript || '';
          var cur = document.getElementById('f-cap');
          if (cur) cur.value = (cur.value ? cur.value + ' ' : '') + t;
          if (st) st.textContent = 'Texto capturado da voz. Confira e ajuste.';
        };
        r.onerror = function () { if (st) st.textContent = 'Não entendi o áudio. Digite ou tente de novo.'; };
        r.start();
      } catch (e) { if (st) st.textContent = 'Voz indisponível. Digite.'; }
    };
    function pickFile(inputId, kind) {
      var el = document.getElementById(inputId);
      if (el) el.onchange = function (e) {
        var f = e.target.files && e.target.files[0];
        var st = document.getElementById('cap-att');
        if (!f) return;
        if (f.size > 10 * 1024 * 1024) { if (st) st.textContent = 'Arquivo muito grande (máx 10 MB).'; return; }
        attach = { kind: kind, name: f.name || 'arquivo', mime: f.type || '', size: f.size };
        if (st) st.textContent = 'Anexo: ' + attach.name + ' (' + kind.toLowerCase() + '). Adicione um texto se quiser.';
      };
    }
    pickFile('cap-img', 'IMAGE');
    pickFile('cap-doc', 'DOCUMENT');
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var vs = document.querySelector('input[name="capvis"]:checked');
        var txt = document.getElementById('f-cap').value;
        var itp = 'TEXT', prov = {};
        if (attach && attach.kind === 'IMAGE') { itp = txt.trim() ? 'MULTIMODAL' : 'IMAGE'; prov = { file_name: attach.name, file_size: attach.size, file_mime: attach.mime }; }
        else if (attach && attach.kind === 'DOCUMENT') { itp = txt.trim() ? 'MULTIMODAL' : 'DOCUMENT'; prov = { file_name: attach.name, file_size: attach.size, file_mime: attach.mime }; }
        if (!txt.trim() && !attach) throw new Error('Escreva ou anexe algo para capturar.');
        var it = J.DB.captureItem(me.id, { content: txt.trim() || ('[' + (attach ? attach.name : 'anexo') + ']'), visibility: vs ? vs.value : 'PERSONAL', source: 'QUICK_CAPTURE', input_type: itp, processing_metadata: prov }, {});
        closeModal();
        toast('Capturado! ' + J.DB.inboxSuggestionText(it));
        render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openInboxDetail(me, itemId) {
    var it;
    try { it = J.DB.getInboxItem(me.id, itemId); } catch (e) { toast('Item não encontrado.'); return; }
    var sug = '';
    try { sug = J.DB.inboxSuggestionText(it); } catch (e2) {}
    var dest = '';
    if (it.status === 'PROCESSED' && it.processed_entity_type) {
      var tgt = null;
      try { tgt = J.DB.inboxProcessedTarget(me.id, it.id); } catch (e3) {}
      dest = tgt && tgt.available ? '<p><b>Organizado como:</b> ' + esc(ibDestLbl(it.processed_entity_type)) + ' • <a href="' + tgt.route + '">Ver ›</a></p>' : '<p class="muted">O item foi processado anteriormente, mas o destino não está mais disponível.</p>';
    }
    var acts = '';
    if (it.status === 'PROCESSED') acts = '<button class="btn ghost sm" id="d-arch">Arquivar</button>';
    else if (it.status === 'DISMISSED' || it.status === 'ARCHIVED') acts = '<button class="btn sm" id="d-re">Restaurar</button>';
    else acts = '<button class="btn sm" id="d-org">Organizar</button> <button class="btn ghost sm" id="d-ed">Editar</button> <button class="btn ghost sm" id="d-dis">Descartar</button>';
    modalShell('<h2>Captura</h2><div id="me"></div>' +
      '<p style="font-size:17px"><b>' + esc(it.content) + '</b></p>' +
      '<p class="muted">Capturado: ' + esc(ibWhen(it.created_at)) + '<br>Origem: ' + esc({ WEB: 'Na Inbox', QUICK_CAPTURE: 'Captura rápida', WHATSAPP: 'WhatsApp', AI_ASSISTANT: 'Assistente' }[it.source] || it.source) + '<br>Sugestão: ' + esc(sug) + '</p>' + dest +
      '<div class="row">' + acts + '</div><button class="btn ghost" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    var o1 = document.getElementById('d-org'); if (o1) o1.onclick = function () { openInboxOrganize(me, it.id); };
    var o2 = document.getElementById('d-ed'); if (o2) o2.onclick = function () { openInboxEditModal(me, it.id); };
    var o3 = document.getElementById('d-dis'); if (o3) o3.onclick = function () { try { J.DB.dismissInboxItem(me.id, it.id); closeModal(); toast('Descartado.'); render(here()); } catch (e4) { document.getElementById('me').innerHTML = err(e4); } };
    var o4 = document.getElementById('d-re'); if (o4) o4.onclick = function () { try { J.DB.restoreInboxItem(me.id, it.id); closeModal(); toast('Restaurado!'); render(here()); } catch (e5) { document.getElementById('me').innerHTML = err(e5); } };
    var o5 = document.getElementById('d-arch'); if (o5) o5.onclick = function () { try { J.DB.archiveInboxItem(me.id, it.id); closeModal(); render(here()); } catch (e6) {} };
  }
  function openInboxOrganize(me, itemId) {
    var it;
    try { it = J.DB.getInboxItem(me.id, itemId); } catch (e) { toast('Item não encontrado.'); return; }
    var sug = '';
    try { sug = J.DB.inboxSuggestionText(it); } catch (e2) {}
    var dests = [['TASK', '☑ Tarefa'], ['AGENDA_EVENT', '📅 Compromisso'], ['HABIT', '🌱 Hábito'], ['LIST', '📝 Nova lista'], ['LIST_ITEM', '➕ Item de lista'], ['ROUTINE', '🔁 Rotina'], ['PROJECT', '🗂 Projeto'], ['TRANSACTION', '💸 Movimentação'], ['GOAL', '🎯 Meta']];
    modalShell('<h2>Organizar</h2><div id="me"></div>' +
      '<p class="muted">"' + esc(it.content.slice(0, 80)) + '"<br>' + esc(sug) + '</p>' +
      dests.map(function (d) {
        var star = (it.suggested_entity_type === d[0] || (it.suggested_entity_type === 'UNKNOWN' && false)) ? ' ★' : '';
        return '<button class="btn ghost" data-dest="' + d[0] + '" style="margin-bottom:6px">' + d[1] + star + '</button>';
      }).join('') +
      '<button class="btn ghost" id="cl">Manter na Inbox</button>');
    document.getElementById('cl').onclick = closeModal;
    Array.prototype.forEach.call(document.querySelectorAll('[data-dest]'), function (b) {
      b.onclick = function () { openInboxDraft(me, it.id, b.dataset.dest, it.version); };
    });
  }
  function openInboxDraft(me, itemId, dest, version) {
    var prep;
    try { prep = J.DB.prepareInboxDraft(me.id, itemId, dest, { hold: true }); }
    catch (e) { toast(e.message || 'Não foi possível.'); return; }
    var d = prep.draft || {}, it = null;
    try { it = J.DB.getInboxItem(me.id, itemId); } catch (e2) {}
    var vis = d.visibility || (it ? it.visibility : 'PERSONAL');
    var h = '<h2>' + esc({ TASK: 'Nova tarefa', AGENDA_EVENT: 'Novo compromisso', HABIT: 'Novo hábito', LIST: 'Nova lista', LIST_ITEM: 'Item de lista', ROUTINE: 'Nova rotina', PROJECT: 'Novo projeto', TRANSACTION: 'Nova movimentação', GOAL: 'Nova meta' }[dest] || 'Organizar') + '</h2><div id="me"></div>';
    function visRow() {
      return '<label>Visibilidade</label><div class="row"><label class="check"><input type="radio" name="dvis" value="PERSONAL"' + (vis !== 'COUPLE' ? ' checked' : '') + '> Pessoal</label><label class="check"><input type="radio" name="dvis" value="COUPLE"' + (vis === 'COUPLE' ? ' checked' : '') + '> Do casal</label></div>';
    }
    if (dest === 'TASK') {
      var tpros = [];
      try { tpros = J.DB.getProjects(me.id, { limit: 50 }); } catch (e3) {}
      h += '<label>Título</label><input id="d-title" maxlength="120" value="' + esc(d.title || '') + '">' +
        '<div class="row"><div><label>Prazo</label><input id="d-date" type="date" value="' + esc(d.due_date || '') + '"></div>' +
        '<div><label>Horário</label><input id="d-time" type="time" value="' + esc(d.due_time || '') + '"></div></div>' +
        '<label>Projeto (opcional)</label><select id="d-proj"><option value="">Sem projeto</option>' + tpros.map(function (p) { return '<option value="' + p.id + '"' + (d.project_id === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select>' + visRow();
    } else if (dest === 'AGENDA_EVENT') {
      h += '<label>Título</label><input id="d-title" maxlength="120" value="' + esc(d.title || '') + '">' +
        '<div class="row"><div><label>Data *</label><input id="d-date" type="date" value="' + esc(d.date || '') + '"></div>' +
        '<div><label>Horário</label><input id="d-time" type="time" value="' + esc(d.start_time || '') + '"></div></div>' + visRow();
    } else if (dest === 'HABIT') {
      h += '<label>Nome do hábito</label><input id="d-title" maxlength="80" value="' + esc(d.name || '') + '"><p class="muted">Frequência: todos os dias. Ajuste depois em Hábitos.</p>';
    } else if (dest === 'LIST') {
      h += '<label>Nome da lista</label><input id="d-title" maxlength="60" value="' + esc(d.name || '') + '">' +
        '<label>Itens (um por linha)</label><textarea id="d-items" rows="4">' + esc((d.items || []).join('\n')) + '</textarea>' + visRow();
    } else if (dest === 'LIST_ITEM') {
      var lrows = [];
      try { lrows = J.DB.getLists(me.id, { limit: 100 }); } catch (e4) {}
      h += '<label>Lista *</label><select id="d-list">' + lrows.map(function (l) { return '<option value="' + l.id + '"' + (d.list_id === l.id ? ' selected' : '') + '>' + esc(l.name) + '</option>'; }).join('') + '</select>' +
        '<label>Item</label><input id="d-title" maxlength="140" value="' + esc(d.title || '') + '">';
    } else if (dest === 'ROUTINE') {
      h += '<label>Nome da rotina</label><input id="d-title" maxlength="80" value="' + esc(d.name || '') + '"><p class="muted">Frequência: todo dia. Ajuste depois em Rotinas.</p>' + visRow();
    } else if (dest === 'PROJECT') {
      h += '<label>Nome do projeto</label><input id="d-title" maxlength="80" value="' + esc(d.name || '') + '">' +
        '<label>Prazo (opcional)</label><input id="d-date" type="date" value="' + esc(d.target_date || '') + '">' + visRow();
    } else if (dest === 'TRANSACTION') {
      var cats = [], accs = [];
      try { cats = J.DB.myCategories(me.id, ''); } catch (e5) {}
      try { accs = J.DB.listAccounts(me.id, 'all'); } catch (e6) {}
      h += '<div class="row"><div><label>Tipo</label><select id="d-type"><option value="expense"' + (d.type !== 'income' ? ' selected' : '') + '>Despesa</option><option value="income"' + (d.type === 'income' ? ' selected' : '') + '>Receita</option></select></div>' +
        '<div><label>Valor (R$) *</label><input id="d-amount" inputmode="decimal" value="' + esc(d.amount != null ? String(d.amount).replace('.', ',') : '') + '"></div></div>' +
        '<label>Descrição</label><input id="d-title" maxlength="120" value="' + esc(d.description || '') + '">' +
        '<div class="row"><div><label>Data</label><input id="d-date" type="date" value="' + esc(d.date || '') + '"></div>' +
        '<div><label>Categoria *</label><select id="d-cat"><option value="">Escolher…</option>' + cats.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></div></div>' +
        '<label>Conta (opcional)</label><select id="d-acc"><option value="">Sem conta</option>' + accs.map(function (a) { return '<option value="' + a.id + '">' + esc(a.name) + '</option>'; }).join('') + '</select>' +
        '<p class="muted">Será registrada via serviço financeiro oficial, com confirmação.</p>';
    } else if (dest === 'GOAL') {
      var gpros = [];
      try { gpros = J.DB.getProjects(me.id, { limit: 50 }); } catch (e7) {}
      h += '<label>Nome da meta</label><input id="d-title" maxlength="80" value="' + esc(d.name || '') + '">' +
        '<label>Objetivo (R$) *</label><input id="d-amount" inputmode="decimal" value="' + esc(d.target != null ? String(d.target).replace('.', ',') : '') + '">' +
        '<label>Vincular ao projeto (opcional)</label><select id="d-proj"><option value="">Sem projeto</option>' + gpros.map(function (p) { return '<option value="' + p.id + '"' + (d.project_id === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select>';
    }
    h += '<div class="row"><button class="btn" id="sv">Confirmar</button><button class="btn ghost" id="bk">Voltar</button><button class="btn ghost" id="cl">Cancelar</button></div>';
    modalShell(h);
    document.getElementById('cl').onclick = function () { try { J.DB.cancelInboxProcessing(me.id, itemId); } catch (e8) {} closeModal(); render(here()); };
    document.getElementById('bk').onclick = function () { openInboxOrganize(me, itemId); };
    function gv(id) { var el = document.getElementById(id); return el ? el.value : ''; }
    function gvis() { var vs = document.querySelector('input[name="dvis"]:checked'); return vs ? vs.value : vis; }
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var nd = { visibility: ['TASK', 'AGENDA_EVENT', 'LIST', 'ROUTINE', 'PROJECT', 'TRANSACTION'].indexOf(dest) >= 0 ? gvis() : vis };
        if (dest === 'TASK') { nd.title = gv('d-title'); nd.due_date = gv('d-date') || null; nd.due_time = gv('d-time') || null; nd.project_id = gv('d-proj') || null; }
        else if (dest === 'AGENDA_EVENT') { nd.title = gv('d-title'); nd.date = gv('d-date') || null; nd.start_time = gv('d-time') || null; }
        else if (dest === 'HABIT') { nd.name = gv('d-title'); }
        else if (dest === 'LIST') { nd.name = gv('d-title'); nd.items = gv('d-items').split('\n'); }
        else if (dest === 'LIST_ITEM') { nd.list_id = gv('d-list'); nd.title = gv('d-title'); }
        else if (dest === 'ROUTINE') { nd.name = gv('d-title'); }
        else if (dest === 'PROJECT') { nd.name = gv('d-title'); nd.target_date = gv('d-date') || null; }
        else if (dest === 'TRANSACTION') { nd.type = gv('d-type'); nd.amount = gv('d-amount').replace(/\./g, '').replace(',', '.'); nd.description = gv('d-title'); nd.date = gv('d-date') || null; nd.category_id = gv('d-cat') || null; nd.account_id = gv('d-acc') || null; }
        else if (dest === 'GOAL') { nd.name = gv('d-title'); nd.target = gv('d-amount').replace(/\./g, '').replace(',', '.'); nd.project_id = gv('d-proj') || null; }
        var r = J.DB.confirmInboxProcessing(me.id, itemId, dest, nd, { expected_version: version, idempotency_key: 'web:' + itemId + ':' + Date.now() });
        closeModal();
        toast(r.already ? 'Este item já foi organizado.' : 'Organizado! 🎉');
        render(here());
      } catch (e9) { document.getElementById('me').innerHTML = err(e9) + '<p><button class="btn ghost sm" id="retry">Tentar novamente</button></p>'; unlock(btn); }
    };
  }
  function openInboxEditModal(me, itemId) {
    var it;
    try { it = J.DB.getInboxItem(me.id, itemId); } catch (e) { toast('Item não encontrado.'); return; }
    modalShell('<h2>Editar captura</h2><div id="me"></div>' +
      '<label>Texto</label><input id="f-cap" maxlength="500" value="' + esc(it.content) + '">' +
      '<div class="row"><label class="check"><input type="radio" name="capvis" value="PERSONAL"' + (it.visibility !== 'COUPLE' ? ' checked' : '') + '> Pessoal</label><label class="check"><input type="radio" name="capvis" value="COUPLE"' + (it.visibility === 'COUPLE' ? ' checked' : '') + '> Do casal</label></div>' +
      '<button class="btn" id="sv">Salvar</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var vs = document.querySelector('input[name="capvis"]:checked');
        J.DB.updateInboxItem(me.id, itemId, { content: document.getElementById('f-cap').value, visibility: vs ? vs.value : undefined });
        closeModal(); toast('Captura atualizada!'); render(here());
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function ovInboxCard(me, day) {
    var ib = (day && day.inbox) || { pending: 0, items: [] };
    if (!ib.pending) return '';
    return '<div class="card"><div class="row between"><b>📥 Inbox</b><a href="#/inbox">Ver Inbox ›</a></div>' +
      '<p><b>' + ib.pending + '</b>' + (ib.pending === 1 ? ' item para organizar' : ' itens para organizar') + '</p>' +
      (ib.items || []).slice(0, 2).map(function (it) { return '<p class="muted">• ' + esc(it.content) + '</p>'; }).join('') + '</div>';
  }
  /* ============ MINHA SEMANA (só apresentação sobre WeeklyPlanningService) ============
     Agrega leitura dos serviços oficiais. Ações reais usam os serviços. */
  var wk = { date: '', vis: 'PERSONAL' };
  function wkWDays() { return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']; }
  function wkDayName(iso) {
    try {
      var dt = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
      return wkWDays()[dt.getDay()];
    } catch (e) { return ''; }
  }
  function wkFmtDay(iso) { return wkDayName(iso) + ' ' + iso.slice(8, 10) + '/' + iso.slice(5, 7); }
  function wkFmtRange(start, end) {
    var mn = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    function p(d) { return d.slice(8, 10) + ' ' + mn[+d.slice(5, 7) - 1]; }
    return p(start) + ' — ' + p(end);
  }
  function wkRange() {
    var base = (wk.date && J.DB.agendaParseDay(wk.date)) ? wk.date : todayISO();
    return J.DB.weekRangeOf(base);
  }
  function ovWeekCard(me, day) {
    var w = (day && day.week) || { priorities_pending: 0, tasks_due: 0, next_invoice: null };
    if (!w.priorities_pending && !w.tasks_due && !w.next_invoice) return '';
    return '<div class="card"><div class="row between"><b>📅 Esta semana</b><a href="#/week">Ver semana ›</a></div>' +
      '<p class="muted">' + w.priorities_pending + ' prioridades pendentes • ' + w.tasks_due + ' tarefas com prazo' +
      (w.next_invoice ? ' • 1 fatura vence ' + esc(dueLabel(w.next_invoice.date)) : '') + '</p></div>';
  }
  function pWeek(v, me) {
    var range = wkRange();
    var ov = null, errMsg = null;
    try { ov = J.DB.getWeekOverview(me.id, { date: range.start, visibility: wk.vis }); }
    catch (e) { errMsg = e; }
    if (errMsg || !ov) {
      v.innerHTML = '<div class="card"><h1>Minha Semana</h1><div class="alert">Não foi possível carregar sua semana.</div><button class="btn ghost" data-wkretry>Tentar novamente</button></div>';
      var rt = document.querySelector('[data-wkretry]'); if (rt) rt.onclick = function () { render('week'); };
      return;
    }
    var html = '<div class="card"><div class="row between" style="flex-wrap:wrap"><div><p class="muted" style="margin:0">Minha Semana</p>' +
      '<h1 style="margin:4px 0">' + esc(wkFmtRange(ov.week.start, ov.week.end)) + '</h1></div>' +
      '<span class="row" style="flex-wrap:wrap"><button class="pnav" id="wk-prev" aria-label="Semana anterior">‹</button><button class="btn ghost sm" id="wk-today" style="max-width:130px">Esta semana</button><button class="pnav" id="wk-next" aria-label="Próxima semana">›</button></span></div>' +
      '<div class="seg" role="group" aria-label="Visão"><button data-wkvis="PERSONAL" class="' + (wk.vis !== 'COUPLE' ? 'on' : '') + '">Pessoal</button><button data-wkvis="COUPLE" class="' + (wk.vis === 'COUPLE' ? 'on' : '') + '">Casal</button></div>' +
      '<div class="row" style="flex-wrap:wrap"><button class="btn sm" id="wk-plan" style="max-width:200px">Planejar semana</button><button class="btn ghost sm" id="wk-review" style="max-width:200px">Revisar semana</button><button class="btn ghost sm" id="wk-cap" style="max-width:170px">+ Capturar</button></div></div>';
    html += wkPrioritiesHtml(me, ov);
    html += '<div class="ov-grid">' + ov.days.map(function (d) { return wkDayHtml(me, d); }).join('') + '</div>';
    html += wkTasksHtml(me, ov);
    html += wkHabitsRoutinesHtml(me, ov);
    html += wkProjectsHtml(me, ov);
    html += wkFinanceHtml(me, ov);
    v.innerHTML = html;
    bindWeek(v, me, ov);
  }
  function wkPrioritiesHtml(me, ov) {
    var prs = (ov.priorities && ov.priorities.ok && ov.priorities.data.priorities) || [];
    var s = '<div class="card"><div class="row between"><b>Prioridades</b><button class="btn ghost sm" id="wk-prio" style="max-width:170px">Definir prioridades</button></div>';
    if (!prs.length) return s + '<p class="muted">Você ainda não definiu prioridades para esta semana.</p></div>';
    return s + '<ol style="margin:8px 0;padding-left:22px">' + prs.slice(0, 3).map(function (p) {
      var link = p.linked_entity_type === 'TASK' && p.linked_entity_id ? ' <a href="#/tasks">›</a>' : p.linked_entity_type === 'PROJECT' && p.linked_entity_id ? ' <a href="#/projects/' + p.linked_entity_id + '">›</a>' : '';
      return '<li>' + (p.done ? '<s>' + esc(p.label || p.title) + '</s> ✓' : esc(p.label || p.title)) + link + '</li>';
    }).join('') + '</ol></div>';
  }
  function wkDayHtml(me, d) {
    var todayCls = d.isToday ? ' today' : '';
    var s = '<div class="card wk-day' + todayCls + '"><b>' + esc(wkFmtDay(d.date)) + (d.isToday ? ' • hoje' : '') + '</b>';
    (d.agenda || []).slice(0, 4).forEach(function (o) {
      s += '<p>📅 ' + (o.start ? esc(o.start) + ' ' : '') + esc(o.title) + '</p>';
    });
    var td = (d.tasks || []).filter(function (t) { return t.status !== 'COMPLETED'; }).slice(0, 4);
    td.forEach(function (t) {
      s += '<div class="ov-row"><button class="chk" data-wktoggle="' + esc(t.key) + '" aria-label="' + esc('Concluir ' + t.title) + '"></button><span>' + esc(t.title) + '</span></div>';
    });
    if (d.habits && d.habits.total) s += '<p class="muted">🌱 ' + d.habits.done + '/' + d.habits.total + ' hábitos</p>';
    (d.routines || []).slice(0, 2).forEach(function (r) {
      s += '<p class="muted">🔁 ' + esc(r.name) + (r.total ? ' ' + r.done + '/' + r.total : '') + '</p>';
    });
    (d.financial || []).slice(0, 2).forEach(function (f) {
      s += '<p class="muted">💳 ' + esc(f.title) + (f.amount ? ' • ' + BRL(f.amount) : '') + '</p>';
    });
    return s + '</div>';
  }
  function wkTasksHtml(me, ov) {
    var tk = (ov.tasks && ov.tasks.ok) ? ov.tasks.data : { overdue: [], today: [], upcoming: [], undated: [] };
    function rows(list) {
      return list.slice(0, 12).map(function (t) {
        return '<div class="ov-row"><button class="chk' + (t.status === 'COMPLETED' ? ' done' : '') + '" data-wktoggle="' + esc(t.key) + '" aria-pressed="' + (t.status === 'COMPLETED') + '" aria-label="' + esc('Concluir ' + t.title) + '">' + (t.status === 'COMPLETED' ? '✓' : '') + '</button>' +
          '<span style="flex:1;min-width:0"><b>' + esc(t.title) + '</b><br><span class="muted">' + (t.date ? esc(dueLabel(t.date)) + (t.due_time ? ' ' + esc(t.due_time) : '') : 'Sem prazo') + (t.overdue ? ' • <b>Atrasada</b>' : '') + (t.is_recurring ? ' • 🔁' : '') + '</span></span></div>';
      }).join('');
    }
    var s = '<div class="card"><div class="row between"><b>Tarefas</b><a href="#/tasks">Ver todas ›</a></div>';
    if (tk.overdue.length) s += '<p><b>Atrasadas</b></p>' + rows(tk.overdue);
    if (tk.today.length) s += '<p><b>Hoje</b></p>' + rows(tk.today);
    if (tk.upcoming.length) s += '<p><b>Próximas</b></p>' + rows(tk.upcoming);
    if (tk.undated.length) {
      s += '<p><b>Para considerar nesta semana</b></p>' + tk.undated.slice(0, 8).map(function (t) {
        return '<div class="ov-row"><button class="chk" data-wktoggle="' + esc(t.key) + '" aria-label="' + esc('Concluir ' + t.title) + '"></button>' +
          '<span style="flex:1;min-width:0"><b>' + esc(t.title) + '</b></span>' +
          '<input type="date" data-wkdate="' + t.task_id + '" value="" aria-label="Agendar ' + esc(t.title) + '" style="max-width:150px;flex:none"></div>';
      }).join('');
    }
    if (!tk.overdue.length && !tk.today.length && !tk.upcoming.length && !tk.undated.length) s += '<p class="muted">Sem tarefas nesta semana.</p>';
    return s + '</div>';
  }
  function wkHabitsRoutinesHtml(me, ov) {
    var hb = (ov.habits && ov.habits.ok) ? ov.habits.data : { habits: [] };
    var rt = (ov.routines && ov.routines.ok) ? ov.routines.data : { routines: [] };
    var days = (ov.week ? [ov.week.start, ov.week.end] : []);
    var s = '<div class="card"><div class="row between"><b>Hábitos e rotinas</b><a href="#/habits">Ver hábitos ›</a></div>';
    if (!hb.habits.length && !rt.routines.length) return s + '<p class="muted">Nada previsto por aqui.</p></div>';
    hb.habits.slice(0, 10).forEach(function (h) {
      s += '<div class="ov-row"><span style="flex:1;min-width:0"><b>' + esc(h.name) + '</b></span><span>';
      Object.keys(h.days || {}).sort().forEach(function (dd) {
        var st = h.days[dd];
        s += '<button class="chk sm' + (st.done ? ' done' : '') + '" data-wkhb="' + h.id + '|' + dd + '" aria-pressed="' + !!st.done + '" aria-label="' + esc(h.name + ' ' + dueLabel(dd)) + '" title="' + esc(wkFmtDay(dd)) + '">' + (st.done ? '✓' : '○') + '</button>';
      });
      s += '</span></div>';
    });
    rt.routines.slice(0, 8).forEach(function (r) {
      s += '<p>🔁 <a href="#/routines/' + r.id + '">' + esc(r.name) + '</a> <span class="muted">• ' + r.dueDates.length + ' dias' + (r.execStatus === 'COMPLETED' ? ' • ✓ hoje' : '') + '</span></p>';
    });
    return s + '</div>';
  }
  function wkProjectsHtml(me, ov) {
    var pr = (ov.projects && ov.projects.ok) ? ov.projects.data : { projects: [] };
    var s = '<div class="card"><div class="row between"><b>Projetos</b><a href="#/projects">Ver projetos ›</a></div>';
    if (!pr.projects.length) return s + '<p class="muted">Nenhum projeto com atividade nesta semana.</p></div>';
    pr.projects.slice(0, 8).forEach(function (p) {
      s += '<p><b><a href="#/projects/' + p.id + '">' + esc(p.name) + '</a></b><br><span class="muted">' + p.tasksInWeek + ' tarefa(s) nesta semana' + (p.hasCommitment ? ' • 1+ compromisso' : '') + (p.targetInWeek ? ' • prazo nesta semana' : '') + '</span></p>';
    });
    return s + '</div>';
  }
  function wkFinanceHtml(me, ov) {
    var fn = (ov.financial && ov.financial.ok) ? ov.financial.data : { realized: { income: 0, expense: 0, count: 0 }, upcoming: [], planned: [], settlement: null };
    var gs = (ov.goals && ov.goals.ok) ? ov.goals.data : { goals: [] };
    var ps = (ov.plans && ov.plans.ok) ? ov.plans.data : { plans: [] };
    var s = '<div class="card"><b>Finanças da semana</b>';
    s += '<p>Realizado: <b class="pos">' + BRL(fn.realized.income) + '</b> • <b class="neg">' + BRL(fn.realized.expense) + '</b></p>';
    if (fn.upcoming.length) {
      s += '<p><b>Previsto</b></p>' + fn.upcoming.slice(0, 8).map(function (x) {
        return '<p>• ' + esc(x.title) + ' — <b>' + BRL(x.amount || 0) + '</b> <span class="muted">' + esc(dueLabel(x.date)) + ' • ' + esc(x.status) + '</span> <a href="' + esc(x.route || '#/calendar') + '">›</a></p>';
      }).join('');
    }
    if (fn.planned.length) {
      s += '<p><b>Planejado (não é gasto real)</b></p>' + fn.planned.slice(0, 6).map(function (x) {
        return '<p class="muted">• ' + esc(x.title) + ' — ' + BRL(x.amount || 0) + '</p>';
      }).join('');
    }
    if (fn.settlement) s += '<p>⚖️ Acerto pendente: <b>' + BRL(fn.settlement.amount) + '</b> <a href="#/settlements">Ver acertos ›</a></p>';
    if (gs.goals.length) s += '<p><b>Metas com contexto</b></p>' + gs.goals.slice(0, 4).map(function (g) { return '<p>🎯 ' + esc(g.name) + (g.deadline ? ' <span class="muted">• ' + esc(dueLabel(g.deadline)) + '</span>' : '') + '</p>'; }).join('');
    if (ps.plans.length) s += '<p class="muted">📊 Planejamento: ' + ps.plans.slice(0, 3).map(function (x) { return esc(x.name); }).join(', ') + '</p>';
    if (!fn.upcoming.length && !fn.planned.length && !gs.goals.length) s += '<p class="muted">Sem compromissos financeiros nesta semana.</p>';
    return s + '</div>';
  }
  function bindWeek(v, me, ov) {
    var pv = document.getElementById('wk-prev'); if (pv) pv.onclick = function () { var r = wkRange(); wk.date = J.DB.agendaAddDays(r.start, -7); render('week'); };
    var nx = document.getElementById('wk-next'); if (nx) nx.onclick = function () { var r = wkRange(); wk.date = J.DB.agendaAddDays(r.start, 7); render('week'); };
    var td = document.getElementById('wk-today'); if (td) td.onclick = function () { wk.date = ''; render('week'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-wkvis]'), function (b) { b.onclick = function () { wk.vis = b.dataset.wkvis; render('week'); }; });
    var pl = document.getElementById('wk-plan'); if (pl) pl.onclick = function () { openWeekWizard(me); };
    var rv = document.getElementById('wk-review'); if (rv) rv.onclick = function () { openWeekReview(me); };
    var cp = document.getElementById('wk-cap'); if (cp) cp.onclick = function () { openQuickCapture(me); };
    var pr = document.getElementById('wk-prio'); if (pr) pr.onclick = function () { openWeekPriorities(me); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-wktoggle]'), function (b) {
      b.onclick = function () { tkToggle(me, b.dataset.wktoggle); setTimeout(function () { render('week'); }, 50); };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-wkhb]'), function (b) {
      b.onclick = function () {
        var sp = b.dataset.wkhb.split('|');
        try {
          var st = J.DB.habitOccurrenceStatus(me.id, sp[0], sp[1]);
          if (st.done && st.completion_id) { J.DB.removeCompletion(me.id, st.completion_id); toast('Hábito desmarcado.'); }
          else { J.DB.recordCompletion(me.id, sp[0], { completion_date: sp[1] }); toast('Hábito concluído!'); }
          render('week');
        } catch (e) { toast('Não foi possível registrar.'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-wkdate]'), function (inp) {
      inp.onchange = function () {
        if (!inp.value) return;
        var tid = inp.dataset.wkdate, prev = null;
        try {
          var t0 = J.DB.getTask(me.id, tid);
          prev = t0.due_date || null;
          J.DB.updateTask(me.id, tid, { due_date: inp.value });
          toast('Tarefa movida para ' + dueLabel(inp.value) + '.', { label: 'Desfazer', fn: function () { try { J.DB.updateTask(me.id, tid, { due_date: prev }); render('week'); } catch (e2) {} } });
          render('week');
        } catch (e3) { toast('Não foi possível reagendar.'); }
      };
    });
  }
  function openWeekWizard(me) {
    var range = wkRange();
    var ov = null;
    try { ov = J.DB.getWeekOverview(me.id, { date: range.start, visibility: wk.vis }); } catch (e) { toast('Não foi possível carregar.'); return; }
    var cands = [];
    try { cands = J.DB.getWeekSuggestCandidates(me.id, { date: range.start }); } catch (e2) {}
    wkMInit(ov, cands);
    wkMRender(me, ov);
  }
  function wkMInit(ov, cands) {
    var prs = (ov.priorities && ov.priorities.ok) ? ov.priorities.data.priorities : [];
    wk.m = wk.m || {};
    wk.m.step = 0;
    wk.m.cands = cands.slice(0, 12);
    wk.m.sel = prs.slice(0, 3).map(function (p, ix) { return { key: 'cur' + ix, title: p.label || p.title, ref: p.linked_entity_type ? { kind: p.linked_entity_type.toLowerCase(), id: p.linked_entity_id } : null }; });
    wk.m.free = '';
    wk.m.notes = '';
  }
  function wkMRender(me, ov) {
    var steps = ['Visão geral', 'Agenda', 'Tarefas', 'Hábitos e rotinas', 'Projetos', 'Finanças', 'Prioridades', 'Confirmar'];
    var st = wk.m.step, h = '<h2>Planejar minha semana</h2><div id="me"></div><p class="muted" role="status">Passo ' + (st + 1) + ' de 8 • ' + steps[st] + '</p>';
    if (st === 0) {
      var tk = (ov.tasks && ov.tasks.ok) ? ov.tasks.data : { overdue: [], upcoming: [] };
      var ag = (ov.agenda && ov.agenda.ok) ? ov.agenda.data : [];
      h += '<p>Esta semana você tem:</p><ul>' +
        '<li><b>' + ag.length + '</b> compromissos</li>' +
        '<li><b>' + (tk.overdue.length + tk.upcoming.length) + '</b> tarefas com prazo' + (tk.overdue.length ? ' (' + tk.overdue.length + ' atrasada(s))' : '') + '</li>' +
        '<li><b>' + ((ov.projects && ov.projects.ok) ? ov.projects.data.projects.length : 0) + '</b> projetos com atividade</li>' +
        '<li><b>' + ((ov.financial && ov.financial.ok) ? ov.financial.data.upcoming.length : 0) + '</b> compromissos financeiros previstos</li></ul>';
    } else if (st === 1) {
      var ag2 = (ov.agenda && ov.agenda.ok) ? ov.agenda.data : [];
      var cf = (ov.conflicts && ov.conflicts.ok) ? ov.conflicts.data : [];
      h += ag2.length ? ag2.slice(0, 10).map(function (x) { return '<p><b>' + esc(wkFmtDay(x.date)) + '</b> ' + (x.start ? esc(x.start) + ' ' : '') + esc(x.title) + '</p>'; }).join('') : '<p class="muted">Sem compromissos.</p>';
      if (cf.length) h += '<div class="alert">Atenção: ' + cf.length + ' conflito(s) de horário: ' + cf.slice(0, 3).map(function (c) { return esc(c.a.title) + ' × ' + esc(c.b.title) + ' (' + esc(wkFmtDay(c.date)) + ')'; }).join('; ') + '.</div>';
    } else if (st === 2) {
      var tk2 = (ov.tasks && ov.tasks.ok) ? ov.tasks.data : { overdue: [], upcoming: [], undated: [] };
      ['overdue', 'upcoming', 'undated'].forEach(function (k) {
        if (!tk2[k].length) return;
        h += '<p><b>' + ({ overdue: 'Atrasadas', upcoming: 'Com prazo', undated: 'Sem prazo' })[k] + '</b></p>' +
          tk2[k].slice(0, 8).map(function (t) { return '<p>○ ' + esc(t.title) + (t.date ? ' <span class="muted">• ' + esc(dueLabel(t.date)) + '</span>' : '') + '</p>'; }).join('');
      });
      if (!tk2.overdue.length && !tk2.upcoming.length && !tk2.undated.length) h += '<p class="muted">Sem tarefas.</p>';
    } else if (st === 3) {
      var hb = (ov.habits && ov.habits.ok) ? ov.habits.data.habits : [];
      var rt = (ov.routines && ov.routines.ok) ? ov.routines.data.routines : [];
      h += '<p class="muted">' + hb.length + ' hábito(s) • ' + rt.length + ' rotina(s) previstas. Apenas revise — nada muda aqui.</p>' +
        hb.slice(0, 6).map(function (x) { return '<p>🌱 ' + esc(x.name) + '</p>'; }).join('') +
        rt.slice(0, 6).map(function (x) { return '<p>🔁 ' + esc(x.name) + '</p>'; }).join('');
    } else if (st === 4) {
      var pr = (ov.projects && ov.projects.ok) ? ov.projects.data.projects : [];
      h += pr.length ? pr.slice(0, 6).map(function (x) { return '<p>🗂 <b>' + esc(x.name) + '</b><br><span class="muted">' + x.tasksInWeek + ' tarefa(s)' + (x.targetInWeek ? ' • prazo nesta semana' : '') + ' • <a href="#/projects/' + x.id + '">Abrir ›</a></span></p>'; }).join('') : '<p class="muted">Sem projetos com atividade.</p>';
    } else if (st === 5) {
      var fn = (ov.financial && ov.financial.ok) ? ov.financial.data : { realized: {}, upcoming: [], planned: [] };
      h += '<p>Realizado: <b>' + BRL((fn.realized || {}).expense || 0) + '</b> em despesas</p>' +
        (fn.upcoming || []).slice(0, 6).map(function (x) { return '<p>• ' + esc(x.title) + ' — <b>' + BRL(x.amount || 0) + '</b> <span class="muted">' + esc(dueLabel(x.date)) + '</span></p>'; }).join('') +
        ((fn.planned || []).length ? '<p class="muted">Planejado (não é gasto real): ' + fn.planned.length + ' item(ns).</p>' : '');
    } else if (st === 6) {
      h += '<p><b>Quais até 3 coisas você quer tratar como prioridade nesta semana?</b></p><div id="e"></div>';
      h += wk.m.cands.map(function (c, ix) {
        var on = wk.m.sel.some(function (s) { return s.key === 'c' + ix; });
        return '<p><label class="check"><input type="checkbox" data-wkpick="c' + ix + '"' + (on ? ' checked' : '') + '> ' + esc(c.title) + ' <span class="muted">• ' + esc(c.date || '') + '</span></label></p>';
      }).join('');
      h += '<label>Ou escreva uma prioridade</label><input id="wk-free" maxlength="120" value="' + esc(wk.m.free) + '">';
      h += '<p class="muted">Selecionadas: ' + wk.m.sel.length + '/3</p>';
    } else {
      h += '<p><b>Sua semana</b></p><p><b>Prioridades</b></p><ol>' + (wk.m.sel.length ? wk.m.sel.map(function (s) { return '<li>' + esc(s.title) + '</li>'; }).join('') : '<li class="muted">Nenhuma definida</li>') + '</ol>' +
        '<label>Observação (opcional)</label><input id="wk-notes" maxlength="500" value="' + esc(wk.m.notes) + '">';
    }
    h += '<div class="row"><button class="btn" id="sv">' + (st === 7 ? 'Começar semana' : 'Próximo') + '</button>' +
      (st > 0 ? '<button class="btn ghost" id="bk">Voltar</button>' : '') + '<button class="btn ghost" id="cl">Fechar</button></div>';
    if (st === 6) h += '<div class="row" style="margin-top:8px"><button class="btn ghost sm" id="wk-addfree">+ Adicionar texto livre</button><button class="btn ghost sm" id="wk-clear">Limpar</button></div>';
    modalShell(h);
    document.getElementById('cl').onclick = closeModal;
    var bk = document.getElementById('bk'); if (bk) bk.onclick = function () { wk.m.step--; wkMRender(me, ov); };
    if (st === 6) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-wkpick]'), function (c) {
        c.onchange = function () {
          var ix = +c.dataset.wkpick.slice(1), cd = wk.m.cands[ix];
          if (c.checked) {
            if (wk.m.sel.length >= 3) { c.checked = false; toast('No máximo 3 prioridades.'); return; }
            wk.m.sel.push({ key: 'c' + ix, title: cd.title, ref: cd.ref || null });
          } else {
            wk.m.sel = wk.m.sel.filter(function (s) { return s.key !== 'c' + ix; });
          }
          wkMRender(me, ov);
        };
      });
      var af = document.getElementById('wk-addfree'); if (af) af.onclick = function () {
        var t = document.getElementById('wk-free').value.trim().slice(0, 120);
        wk.m.free = document.getElementById('wk-free').value;
        if (t.length < 2) { toast('Escreva a prioridade.'); return; }
        if (wk.m.sel.length >= 3) { toast('No máximo 3 prioridades. Limpe para trocar.'); return; }
        wk.m.sel.push({ key: 'f' + Date.now(), title: t.charAt(0).toUpperCase() + t.slice(1), ref: null });
        wk.m.free = '';
        wkMRender(me, ov);
      };
      var cl = document.getElementById('wk-clear'); if (cl) cl.onclick = function () { wk.m.sel = []; wk.m.free = ''; wkMRender(me, ov); };
      var fr = document.getElementById('wk-free'); if (fr) fr.onchange = function () { wk.m.free = fr.value; };
    }
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        if (st < 7) { wk.m.step++; wkMRender(me, ov); return; }
        var notesEl = document.getElementById('wk-notes');
        var plan = J.DB.getOrCreateWeeklyPlan(me.id, { date: wkRange().start, visibility: wk.vis });
        J.DB.updateWeeklyPlan(me.id, plan.id, { status: 'ACTIVE', notes: notesEl ? notesEl.value : '' }, {});
        var existing = [];
        try { existing = J.DB.getWeekPriorities(me.id, plan.id); } catch (e2) {}
        var need = Math.max(0, 3 - existing.length);
        wk.m.sel.slice(0, need).forEach(function (s) {
          if (s.ref && s.ref.kind === 'task') J.DB.addWeeklyPriority(me.id, plan.id, { title: s.title, linked_entity_type: 'TASK', linked_entity_id: s.ref.task_id });
          else if (s.ref && s.ref.kind === 'project') J.DB.addWeeklyPriority(me.id, plan.id, { title: s.title, linked_entity_type: 'PROJECT', linked_entity_id: s.ref.project_id });
          else if (s.ref && s.ref.kind === 'financial') J.DB.addWeeklyPriority(me.id, plan.id, { title: s.title });
          else J.DB.addWeeklyPriority(me.id, plan.id, { title: s.title });
        });
        try { J.DB.convSetContext(me.id, null, 'web', 'WEEKLY_PLAN', plan.id, 120); } catch (e3) {}
        closeModal(); toast('Semana planejada! 🎯'); render('week');
      } catch (e4) { var m = document.getElementById('me'); if (m) m.innerHTML = err(e4); unlock(btn); }
    };
  }
  function openWeekPriorities(me) {
    var range = wkRange();
    var plan = null;
    try { plan = J.DB.getOrCreateWeeklyPlan(me.id, { date: range.start, visibility: wk.vis }); }
    catch (e) { toast('Não foi possível.'); return; }
    var prs = [];
    try { prs = J.DB.getWeekPriorities(me.id, plan.id); } catch (e2) {}
    modalShell('<h2>Prioridades da semana</h2><div id="me"></div>' +
      (prs.length ? '<ol>' + prs.map(function (p, ix) {
        return '<li>' + (p.done ? '<s>' + esc(p.label || p.title) + '</s> ✓' : esc(p.label || p.title)) +
          ' <button class="btn ghost sm" data-wkprm="' + p.id + '" style="max-width:44px" aria-label="Remover">✕</button></li>';
      }).join('') + '</ol>' : '<p class="muted">Você ainda não definiu prioridades para esta semana.</p>') +
      '<label>Nova prioridade (texto livre)</label><input id="wk-newp" maxlength="120">' +
      '<div class="row"><button class="btn" id="sv">Adicionar</button><button class="btn ghost" id="cl">Fechar</button></div>');
    document.getElementById('cl').onclick = closeModal;
    Array.prototype.forEach.call(document.querySelectorAll('[data-wkprm]'), function (b) {
      b.onclick = function () { try { J.DB.removeWeeklyPriority(me.id, b.dataset.wkprm); openWeekPriorities(me); render('week'); } catch (e3) { toast('Não foi possível.'); } };
    });
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var t = document.getElementById('wk-newp').value.trim().slice(0, 120);
        J.DB.addWeeklyPriority(me.id, plan.id, { title: t });
        openWeekPriorities(me); render('week');
      } catch (e4) { document.getElementById('me').innerHTML = err(e4); unlock(btn); }
    };
  }
  function openWeekReview(me) {
    var range = wkRange();
    var rev = null;
    try { rev = J.DB.getWeeklyReview(me.id, { date: range.start }); } catch (e) { toast('Não foi possível carregar.'); return; }
    modalShell('<h2>Revisar semana</h2><div id="me"></div>' +
      '<p>Prioridades: <b>' + rev.priorities.done + ' de ' + rev.priorities.total + '</b> concluídas.</p>' +
      '<p>Tarefas: <b>' + rev.tasks.done + ' de ' + rev.tasks.total + '</b> concluídas.</p>' +
      '<p>Hábitos: <b>' + rev.habits.done + ' de ' + rev.habits.total + '</b>.</p>' +
      (rev.tasks.pending.length ? '<p><b>Ainda pendentes:</b> ' + rev.tasks.pending.slice(0, 5).map(function (t) { return esc(t.title); }).join(', ') + '.</p>' : '<p class="muted">Nada pendente. 🎉</p>') +
      '<div class="row"><button class="btn" id="sv">Concluir revisão</button><button class="btn ghost" id="nx">Planejar próxima semana</button><button class="btn ghost" id="cl">Fechar</button></div>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('nx').onclick = function () {
      wk.date = J.DB.agendaAddDays(range.start, 7);
      closeModal(); render('week'); openWeekWizard(me);
    };
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var plans = J.DB.getWeeklyPlans(me.id, {}).filter(function (p) { return p.week_start_date === range.start && p.status !== 'ARCHIVED'; });
        plans.forEach(function (p) { try { J.DB.completeWeeklyReview(me.id, p.id); } catch (e2) {} });
        closeModal(); toast('Revisão concluída!'); render('week');
      } catch (e3) { document.getElementById('me').innerHTML = err(e3); unlock(btn); }
    };
  }
  /* ============ FECHAMENTO MENSAL (só apresentação sobre MonthlyReviewService) ============
     Agrega leitura dos serviços oficiais. Ações financeiras usam os serviços. */
  var mr = { year: '', month: '', vis: 'PERSONAL', step: 1 };
  function mrSteps() { return ['Resumo', 'Receitas e despesas', 'Orçamento', 'Contas e faturas', 'Acertos', 'Metas', 'Projetos', 'Próximo mês', 'Conclusão']; }
  function mrStepSection(ix) { return ['SUMMARY', 'INCOME_EXPENSE', 'BUDGET', 'ACCOUNTS_INVOICES', 'SETTLEMENTS', 'GOALS', 'PROJECTS', 'NEXT_MONTH', null][ix]; }
  function mrDefault() {
    try {
      var l = J.DB.monthlyLastClosedMonth();
      return { year: String(l.year), month: ('0' + l.month).slice(-2) };
    } catch (e) { return { year: todayISO().slice(0, 4), month: todayISO().slice(5, 7) }; }
  }
  function mrCurrent() {
    var d = mrDefault();
    var y = mr.year || d.year, m = mr.month || d.month;
    return { year: parseInt(y, 10), month: parseInt(m, 10) };
  }
  function mrShift(dir) {
    var c = mrCurrent(), y = c.year, m = c.month + dir;
    while (m < 1) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    mr.year = String(y); mr.month = ('0' + m).slice(-2); mr.step = 1;
  }
  function mrIsJoint(me) { try { return J.DB.moneyMode(me.id) === 'JOINT'; } catch (e) { return false; } }
  function ovMonthlyReviewCard(me, day) {
    var c = (day && day.monthly_review) || null;
    if (!c) return '';
    if (c.status === 'COMPLETED') return '<div class="card"><div class="row between"><b>📊 ' + esc(c.month_label) + ' revisado</b><a href="#/monthly-review">Ver fechamento ›</a></div></div>';
    if (c.status === 'IN_PROGRESS') return '<div class="card"><div class="row between"><b>📊 Fechamento mensal</b><a href="#/monthly-review">Continuar ›</a></div><p class="muted">' + esc(c.month_label) + ' • ' + c.done + ' de ' + c.total + ' etapas concluídas</p><p><a href="#/monthly-review">Continuar fechamento de ' + esc(c.month_label.split(' de ')[0]) + ' ›</a></p></div>';
    return '<div class="card"><div class="row between"><b>📊 ' + esc(c.month_label) + ' terminou</b></div><p class="muted">Quer revisar o mês?</p><p><a class="btn sm" href="#/monthly-review" style="max-width:220px">Iniciar fechamento</a></p></div>';
  }
  function pMonthlyReview(v, me, year, month) {
    if (/^\d{4}$/.test(String(year || '')) && parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12) { mr.year = String(year); mr.month = ('0' + parseInt(month, 10)).slice(-2); }
    var c = mrCurrent();
    var rev = null, revErr = null;
    try { rev = J.DB.getReviewByMonth(me.id, c.year, c.month, mr.vis); } catch (e) { revErr = e; }
    var today = todayISO();
    var isFuture = (c.year > +today.slice(0, 4) || (c.year === +today.slice(0, 4) && c.month > +today.slice(5, 7)));
    var isCur = (c.year === +today.slice(0, 4) && c.month === +today.slice(5, 7));
    var steps = mrSteps();
    var mrKey = c.year + '-' + c.month + '|' + mr.vis + '|' + (rev ? rev.id : 'none');
    if (mr._key !== mrKey) { mr._key = mrKey; mr.step = (rev && rev.current_step) || 1; }
    var st = Math.max(1, Math.min(9, mr.step || 1));
    mr.step = st;
    var html = '<div class="card"><p class="muted" style="margin:0">Fechamento Mensal</p>' +
      '<h1 style="margin:4px 0">' + esc(cap(J.DB.monthlyLabel(c.year, c.month))) + '</h1>' +
      '<div class="per-row"><button class="pnav" id="mr-prev" aria-label="Mês anterior">‹</button><strong>' + esc(monthLabel(c.year + '-' + ('0' + c.month).slice(-2))) + '</strong><button class="pnav" id="mr-next" aria-label="Próximo mês">›</button></div>' +
      '<div class="seg" role="group" aria-label="Visão"><button data-mrvis="PERSONAL" class="' + (mr.vis !== 'COUPLE' ? 'on' : '') + '">Pessoal</button><button data-mrvis="COUPLE" class="' + (mr.vis === 'COUPLE' ? 'on' : '') + '">Casal</button></div>';
    if (revErr) html += err(revErr);
    if (isFuture) html += '<div class="alert">Este mês ainda não terminou para fechamento. Você pode planejar o período em <a href="#/planning">Planejamento</a>.</div>';
    else if (isCur) html += '<p class="muted">Este mês ainda está em andamento. Você pode revisar os dados até agora, mas o período ainda não terminou.</p>';
    if (!rev && !isFuture) html += '<div class="row" style="flex-wrap:wrap"><button class="btn sm" id="mr-start" style="max-width:240px">Iniciar fechamento</button></div>';
    if (rev) {
      html += '<p class="muted" role="status">Passo ' + st + ' de 9 • ' + esc(steps[st - 1]) + (rev.status === 'COMPLETED' ? ' • ✓ concluído' : '') + '</p>';
      html += '<ol class="steps" aria-label="Etapas do fechamento">' + steps.map(function (s, ix) {
        var cls = (ix + 1) < st ? 'done' : ((ix + 1) === st ? 'now' : 'todo');
        var mark = (ix + 1) < st ? '✓ ' : '';
        if (ix + 1 === st) return '<li class="' + cls + '" aria-current="step"><b>' + mark + esc(s) + '</b></li>';
        return '<li class="' + cls + '">' + mark + esc(s) + '</li>';
      }).join('') + '</ol>';
      if (rev.status === 'COMPLETED' && rev.review_summary_snapshot) html += '<p class="muted">Dados referentes ao fechamento realizado em ' + esc(String(rev.completed_at || '').slice(0, 10)) + '.</p>';
      try {
        if (rev.status === 'COMPLETED') {
          var mrsnap = J.DB.getReviewSummary(me.id, { reviewId: rev.id });
          if (mrsnap && mrsnap.review.changed_since_close) html += '<div class="alert">Os dados atuais deste mês mudaram desde o fechamento. O registro histórico acima foi preservado. <a href="#/reports">Ver dados atuais ›</a></div>';
        }
      } catch (eSnap) {}
      html += '<div id="mr-body">' + mrStepHtml(me, rev, st) + '</div>';
      html += '<div class="row"><' + (st > 1 ? 'button class="btn ghost" id="mr-back">← Voltar' : 'span') + (st > 1 ? '</button>' : '</span>') +
        (st < 9 ? '<button class="btn" id="mr-next2">Continuar →</button>' : '') +
        '<button class="btn ghost" id="mr-exit">Sair</button></div>';
      if (st === 9) html += '<div class="row"><button class="btn ghost sm" id="mr-notesv" style="max-width:200px">Observações</button>' + (rev.status === 'COMPLETED' ? '<button class="btn ghost sm" id="mr-reopen" style="max-width:200px">Reabrir fechamento</button>' : '<button class="btn sm" id="mr-finish" style="max-width:220px">Concluir fechamento</button>') + '</div>';
    }
    html += '</div>';
    v.innerHTML = html;
    bindMonthlyReview(v, me, rev, c);
  }
  function mrSec(fn, fallback) { try { return { ok: true, data: fn() }; } catch (e) { return { ok: false, data: fallback }; } }
  function mrStepHtml(me, rev, st) {
    var c = { year: rev.reference_year, month: rev.reference_month };
    var vis = mr.vis;
    var h = '';
    if (st === 1) {
      var s = mrSec(function () { return J.DB.getReviewSummary(me.id, { reviewId: rev.id }); }, null);
      if (!s.ok || !s.data) return '<div class="alert">Não foi possível carregar o resumo.</div>';
      var sm = s.data.summary;
      h += '<div class="card"><b>Resumo factual</b>' +
        '<p>Receitas<br><b class="pos">' + BRL(sm.income) + '</b></p>' +
        '<p>Despesas<br><b class="neg">' + BRL(sm.expense) + '</b></p>' +
        '<p>Resultado do mês (receitas − despesas)<br><b>' + BRL(sm.result) + '</b></p>' +
        (sm.save_rate != null ? '<p>Taxa de poupança<br><b>' + String(sm.save_rate).replace('.', ',') + '%</b></p>' : '') +
        (sm.prev_expense != null ? '<p class="muted">Despesas: ' + BRL(sm.expense) + '. Mês anterior: ' + BRL(sm.prev_expense) + '. Diferença: ' + BRL(sm.expense_diff) + ' (As despesas foram ' + BRL(Math.abs(sm.expense_diff)) + (sm.expense_diff >= 0 ? ' maiores' : ' menores') + ' que no mês anterior).</p>' : '') +
        '<p>Orçamento: <b>' + (sm.budgets.total - sm.budgets.over) + '</b> categorias dentro do limite, <b>' + sm.budgets.over + '</b> acima.</p>' +
        '<p>Faturas: <b>' + sm.invoices.paid + '</b> pagas, <b>' + sm.invoices.pending + '</b> pendentes.</p></div>';
      if (s.data.review.is_partial) h += '<p class="muted">Revisão parcial: o mês ainda está em andamento.</p>';
    } else if (st === 2) {
      var ie = mrSec(function () { return J.DB.getIncomeExpenseSection(me.id, { reviewId: rev.id }); }, null);
      if (!ie.ok || !ie.data) return '<div class="alert">Não foi possível carregar receitas e despesas.</div>';
      var d = ie.data;
      h += '<div class="card"><b>Receitas e despesas</b><p>Total de receitas: <b class="pos">' + BRL(d.income) + '</b></p><p>Total de despesas: <b class="neg">' + BRL(d.expense) + '</b></p><p>Resultado: <b>' + BRL(d.result) + '</b></p>';
      if (d.categories.length) h += '<p><b>Por categoria</b></p>' + d.categories.slice(0, 6).map(function (x) { return '<p>' + esc(x.name) + ' — <b>' + BRL(x.value) + '</b></p>'; }).join('');
      if (d.largest.length) h += '<p><b>Maiores despesas</b></p>' + d.largest.slice(0, 5).map(function (x) { return '<p>' + esc(x.description) + ' — <b>' + BRL(x.amount) + '</b> <span class="muted">' + esc(dueLabel(x.date)) + '</span></p>'; }).join('');
      if (d.recurring.monthly_estimate) h += '<p class="muted">Recorrências: estimativa mensal ' + BRL(d.recurring.monthly_estimate) + '.</p>';
      h += '</div>';
    } else if (st === 3) {
      var b = mrSec(function () { return J.DB.getBudgetSection(me.id, { reviewId: rev.id }); }, null);
      if (!b.ok || !b.data) return '<div class="alert">Não foi possível carregar o orçamento.</div>';
      var bd = b.data;
      if (!bd.items.length) h += '<div class="card"><b>Orçamento</b><p class="muted">Você não configurou orçamento para este mês.</p><p><a class="btn ghost sm" href="#/budget" style="max-width:220px">Configurar orçamento</a> <button class="btn ghost sm" id="mr-skip" style="max-width:120px">Pular</button></p></div>';
      else h += '<div class="card"><b>Orçamento</b>' + bd.items.slice(0, 20).map(function (x) { return '<p><b>' + esc(x.name) + '</b><br><span class="muted">Orçado ' + BRL(x.budgeted) + ' • Realizado ' + BRL(x.spent) + ' • Diferença ' + BRL(x.spent - x.budgeted) + ' • ' + esc(x.status) + '</span></p>'; }).join('') + '<p><a href="#/budget">Planejar orçamento do próximo mês ›</a></p></div>';
    } else if (st === 4) {
      var ac = mrSec(function () { return J.DB.getAccountsSection(me.id, {}); }, null);
      var iv = mrSec(function () { return J.DB.getInvoiceSection(me.id, { reviewId: rev.id }); }, null);
      h += '<div class="card"><b>Contas e faturas</b>';
      if (ac.ok && ac.data) h += '<p>Dinheiro nas contas (saldo atual): <b>' + BRL(ac.data.total_balance) + '</b></p><p class="muted">Saldo atual — não é o resultado do mês.</p>';
      else h += '<p class="muted">Contas indisponíveis no momento.</p>';
      if (iv.ok && iv.data) {
        if (!iv.data.invoices.length) h += '<p class="muted">Sem faturas neste mês.</p>';
        else h += iv.data.invoices.slice(0, 10).map(function (x) { return '<p>🧾 Fatura ' + x.month + '/' + x.year + ' — <b>' + BRL(x.total) + '</b> <span class="pill">' + esc(x.status) + '</span> ' + (x.status !== 'paid' && x.status !== 'cancelled' ? '<a href="#/invoices">Ver fatura ›</a>' : '') + '</p>'; }).join('');
        var pend = iv.data.invoices.filter(function (x) { return x.status !== 'paid' && x.status !== 'cancelled'; }).length;
        if (pend) h += '<div class="alert">' + pend + ' fatura(s) do período ainda pendente(s).</div>';
        if (iv.data.installments_next.length) h += '<p class="muted">Parcelas futuras: ' + iv.data.installments_next.slice(0, 3).map(function (x) { return esc(x.label) + ' ' + BRL(x.amount); }).join('; ') + '.</p>';
      } else h += '<p class="muted">Faturas indisponíveis no momento.</p>';
      h += '</div>';
    } else if (st === 5) {
      var stt = mrSec(function () { return J.DB.getSettlementSection(me.id, { reviewId: rev.id }); }, null);
      if (!stt.ok || !stt.data) return '<div class="alert">Não foi possível carregar acertos.</div>';
      var sd = stt.data;
      h += '<div class="card"><b>Acertos</b>';
      if (sd.mode === 'JOINT') h += '<p class="muted">Neste modo, as despesas compartilhadas não geram acertos internos automáticos.</p>';
      else if (sd.debt) h += '<p>Acerto pendente: <b>' + BRL(sd.debt.amount) + '</b> <a href="#/settlements">Ver acertos ›</a></p>';
      else h += '<p class="muted">Nenhum acerto pendente no momento.</p>';
      if ((sd.history || []).length) h += '<p class="muted">Acertos realizados no mês: ' + sd.history.length + '.</p>';
      h += '</div>';
    } else if (st === 6) {
      var g = mrSec(function () { return J.DB.getGoalSection(me.id, {}); }, null);
      if (!g.ok || !g.data) return '<div class="alert">Não foi possível carregar metas.</div>';
      if (!g.data.goals.length) h += '<div class="card"><b>Metas</b><p class="muted">Nenhuma meta ativa para revisar neste período.</p></div>';
      else h += '<div class="card"><b>Metas</b>' + g.data.goals.slice(0, 10).map(function (x) { return '<p>🎯 <b>' + esc(x.name) + '</b><br><span class="muted">Meta ' + BRL(x.target) + ' • Acumulado ' + BRL(x.current) + (x.pct != null ? ' • Progresso ' + String(x.pct).replace('.', ',') + '%' : '') + ' • <a href="#/goals">Ver ›</a></span></p>'; }).join('') + '</div>';
    } else if (st === 7) {
      var pj = mrSec(function () { return J.DB.getProjectSection(me.id, { reviewId: rev.id }); }, null);
      if (!pj.ok || !pj.data) return '<div class="alert">Não foi possível carregar projetos. As seções financeiras continuam disponíveis.</div>';
      if (!pj.data.projects.length) h += '<div class="card"><b>Projetos</b><p class="muted">Nenhum projeto relevante neste período.</p><p><button class="btn ghost sm" id="mr-skip" style="max-width:120px">Pular</button></p></div>';
      else h += '<div class="card"><b>Projetos</b>' + pj.data.projects.slice(0, 10).map(function (x) { return '<p><b><a href="#/projects/' + x.id + '">' + esc(x.name) + '</a></b><br><span class="muted">' + x.tasks_done + '/' + x.tasks_total + ' tarefas' + (x.upcoming_in_month ? ' • ' + x.upcoming_in_month + ' previstas no mês' : '') + '</span></p>'; }).join('') + '</div>';
    } else if (st === 8) {
      var nx = mrSec(function () { return J.DB.getNextMonthSection(me.id, { reviewId: rev.id }); }, null);
      if (!nx.ok || !nx.data) return '<div class="alert">Não foi possível carregar o próximo mês.</div>';
      var n = nx.data;
      h += '<div class="card"><b>' + esc(cap(n.month_label)) + ' — já previsto</b>' +
        '<p>Compromissos já registrados: <b>' + BRL(n.commitments_total) + '</b></p>' +
        '<p class="muted">Recorrentes ' + BRL(n.by_kind.recurring) + ' • Faturas ' + BRL(n.by_kind.invoice) + ' • Parcelas ' + BRL(n.by_kind.installment) + '</p>' +
        (n.items.length ? n.items.slice(0, 10).map(function (x) { return '<p>• ' + esc(x.label) + ' — <b>' + BRL(x.amount) + '</b> <span class="muted">' + esc(dueLabel(x.date)) + '</span></p>'; }).join('') : '<p class="muted">Nada previsto por aqui.</p>') +
        '<p class="muted">Com base nos itens já registrados, a projeção atual ' + (n.projected_balance != null ? 'é de ' + BRL(n.projected_balance.projected != null ? n.projected_balance.projected : n.projected_balance) : 'está disponível no planejamento') + ' — não é saldo garantido.</p>' +
        '<p>Orçamento do próximo mês: ' + (n.budgets.configured ? n.budgets.count + ' categorias configuradas' : 'ainda não configurado') + ' • <a href="#/budget">Planejar orçamento ›</a></p>' +
        (n.goals.length ? '<p>Metas com prazo: ' + n.goals.slice(0, 4).map(function (x) { return esc(x.name); }).join(', ') + '.</p>' : '') +
        (n.projects.length ? '<p>Projetos: ' + n.projects.slice(0, 4).map(function (x) { return esc(x.name) + ' (' + x.upcoming + ' previstas)'; }).join('; ') + '.</p>' : '') +
        '<p><a href="#/planning">Ver planejamento ›</a> • <a href="#/week">Ver Minha Semana ›</a></p></div>';
    } else {
      var f = mrSec(function () { return J.DB.getReviewSummary(me.id, { reviewId: rev.id }); }, null);
      var sm2 = (f.ok && f.data) ? f.data.summary : null;
      var nn = mrSec(function () { return J.DB.getNextMonthSection(me.id, { reviewId: rev.id }); }, null);
      h += '<div class="card"><b>Conclusão</b>';
      if (sm2) h += '<p>Receitas <b class="pos">' + BRL(sm2.income) + '</b> • Despesas <b class="neg">' + BRL(sm2.expense) + '</b> • Resultado <b>' + BRL(sm2.result) + '</b></p><p class="muted">Orçamento: ' + sm2.budgets.over + ' categoria(s) acima do planejado.</p>';
      if (nn.ok && nn.data) h += '<p class="muted">Próximo mês: ' + BRL(nn.data.commitments_total) + ' em compromissos já registrados.</p>';
      h += '<label for="mr-notes">Observações do mês (opcional)</label><textarea id="mr-notes" maxlength="2000" rows="3" placeholder="O que quero lembrar deste mês?">' + esc(rev.notes || '') + '</textarea>';
      if (rev.status === 'COMPLETED') h += '<p class="muted">Fechamento concluído em ' + esc(String(rev.completed_at || '').slice(0, 10)) + '. O fechamento não trava o mês: você ainda pode corrigir lançamentos.</p>';
      h += '</div>';
    }
    return h;
  }
  function bindMonthlyReview(v, me, rev, c) {
    var pv = document.getElementById('mr-prev'); if (pv) pv.onclick = function () { mrShift(-1); render('monthly-review'); };
    var nx = document.getElementById('mr-next'); if (nx) nx.onclick = function () { mrShift(1); render('monthly-review'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-mrvis]'), function (b) { b.onclick = function () { mr.vis = b.dataset.mrvis; mr.step = 1; render('monthly-review'); }; });
    var st = document.getElementById('mr-start');
    if (st) st.onclick = function () {
      lock(st);
      try { var r = J.DB.startReview(me.id, { year: c.year, month: c.month, visibility: mr.vis }); mr.step = r.current_step || 1; toast('Fechamento iniciado!'); render('monthly-review'); }
      catch (e) { v.querySelector('.card').insertAdjacentHTML('beforeend', err(e)); unlock(st); }
    };
    var bk = document.getElementById('mr-back'); if (bk) bk.onclick = function () { mr.step = Math.max(1, mr.step - 1); render('monthly-review'); };
    var fw = document.getElementById('mr-next2');
    if (fw) fw.onclick = function () {
      var sec = mrStepSection(mr.step - 1);
      if (sec && rev) { try { J.DB.completeSection(me.id, rev.id, sec); } catch (e) {} }
      mr.step = Math.min(9, mr.step + 1); render('monthly-review');
    };
    var ex = document.getElementById('mr-exit'); if (ex) ex.onclick = function () { location.hash = '#/dashboard'; };
    var sk = document.getElementById('mr-skip');
    if (sk) sk.onclick = function () {
      var sec2 = mrStepSection(mr.step - 1);
      if (sec2 && rev) { try { J.DB.skipSection(me.id, rev.id, sec2); } catch (e2) {} }
      mr.step = Math.min(9, mr.step + 1); render('monthly-review');
    };
    var fin = document.getElementById('mr-finish');
    if (fin) fin.onclick = function () {
      var notes = document.getElementById('mr-notes');
      lock(fin);
      try {
        if (notes) J.DB.updateReviewNotes(me.id, rev.id, notes.value);
        J.DB.completeReview(me.id, rev.id);
        toast('Fechamento concluído!');
        render('monthly-review');
      } catch (e3) { toast(e3.message || 'Não foi possível concluir.'); unlock(fin); }
    };
    var nv = document.getElementById('mr-notesv'); if (nv) nv.onclick = function () { var t = document.getElementById('mr-notes'); if (t) t.focus(); };
    var ro = document.getElementById('mr-reopen');
    if (ro) ro.onclick = function () { try { J.DB.reopenReview(me.id, rev.id); toast('Fechamento reaberto para ajustes de revisão.'); render('monthly-review'); } catch (e4) { toast('Não foi possível reabrir.'); } };
    var ta = document.getElementById('mr-notes');
    if (ta) ta.onchange = function () { try { J.DB.updateReviewNotes(me.id, rev.id, ta.value); } catch (e5) {} };
  }
  var calYM = '', calView = 'month', calVision = 'couple', calType = '', calState = '', calAccount = '', calCard = '', calCat = '', calSub = '', calPerson = '', calSearch = '', calPlan = '', calCash = false, calHabits = false;
  function calFilters() {
    var o = { vision: calVision || 'couple', today: todayISO() };
    if (calType) o.types = [calType];
    if (calState) o.states = [calState];
    if (calAccount) o.account_id = calAccount;
    if (calCard) o.credit_card_id = calCard;
    if (calCat) o.category_id = calSub || calCat;
    if (calPerson === 'me' || calPerson === 'partner') o.person = calPerson;
    if (calSearch) o.search = calSearch;
    if (calPlan) o.plan_id = calPlan;
    return o;
  }
  function calRange() {
    var y = parseInt(calYM.slice(0, 4), 10), m = parseInt(calYM.slice(5, 7), 10);
    return { from: calYM + '-01', to: calYM + '-' + new Date(y, m, 0).getDate() };
  }
  function calStatePill(s) {
    var map = { realizado: ['ok', '✓ realizado'], previsto: ['', '◷ previsto'], planejado: ['', '✎ planejado'], pendente: ['', '⏳ pendente'], vencido: ['over', '⚠ vencido'], pago: ['ok', '✓ pago'], 'concluído': ['ok', '✓ concluído'], cancelado: ['', '✕ cancelado'], pulado: ['', '⏭ pulado'], info: ['', 'ℹ info'] };
    var m = map[s] || ['', s];
    return '<span class="pill ' + m[0] + '">' + esc(m[1]) + '</span>';
  }
  function calTypeIcon(t) {
    if (t === 'routine') return '🔁';
    return { income: '🟢', expense: '🔴', transfer: '⇄', invoice: '🧾', invoice_payment: '🧾', installment: '🗓️', recurring: '🔁', goal: '🎯', budget: '📊', settlement: '⚖️', planning_item: '✎', insight: '💡', agenda: '📅', habit: '🌱', task: '☑' }[t] || '•';
  }
  function occIcon(o) {
    var t = o.rec ? o.rec.type : 'expense';
    if (o.status === 'paid') return '✓';
    if (o.status === 'skipped') return '⏭';
    if (o.status === 'cancelled') return '✕';
    return t === 'income' ? '🟢' : '🔴';
  }
  function occRow(me, o) {
    var name = o.rec ? o.rec.description : 'Conta';
    return '<button class="tx" data-occ="' + o.id + '"><span class="tx-ic">' + occIcon(o) + '</span>' +
      '<span class="tx-mid"><b>' + esc(name) + '</b><small>' + dueLabel(o.due_date) + ' • ' + (o.status === 'paid' ? 'paga' : o.status === 'skipped' ? 'pulada' : o.status === 'cancelled' ? 'cancelada' : 'pendente') + '</small></span>' +
      '<b class="' + (o.rec && o.rec.type === 'income' ? 'pos' : 'neg') + '">' + BRL(o.amount) + '</b></button>';
  }
  function pCalendar(v, me) {
    if (!calYM) calYM = thisMonth();
    J.DB.ensureOccurrences(me.id, calYM, J.DB.shiftMonth(calYM, 1));
    var r = calRange(), F = calFilters();
    var evs, sum;
    try {
      evs = calHabits
        ? J.DB.getUnifiedCalendar(me.id, Object.assign({}, F, { from: r.from, to: r.to }))
        : J.DB.getCalendarEvents(me.id, Object.assign({}, F, { from: r.from, to: r.to }));
      sum = J.DB.calculatePeriodSummary(me.id, Object.assign({}, F, { from: r.from, to: r.to }));
    } catch (e) { v.innerHTML = '<div class="card"><h1>Calendário financeiro</h1></div>' + err(e) + '<button class="btn ghost" id="cal-retry">Tentar novamente</button>'; var cr = document.getElementById('cal-retry'); if (cr) cr.onclick = function () { render('calendar'); }; return; }
    var partnerId = J.DB.memberIds(me.id).filter(function (x) { return x !== me.id; })[0] || null;
    var vMe = esc(me.nome.split(' ')[0]), vPa = partnerId ? esc(firstShort(me, partnerId)) : 'Parceiro';
    var accs = J.DB.listAccounts(me.id, 'all'), cards = J.DB.listCards(me.id, 'all'), cats = J.DB.myCategories(me.id, '');
    var plans = [];
    try { plans = J.DB.listPlans(me.id, {}); } catch (e2) {}
    var html = '<div class="card"><h1>Calendário financeiro</h1>' +
      '<p class="muted">O que aconteceu, o que vai acontecer e o que foi planejado — projeções marcadas como tal, nunca como realizadas.</p>' +
      '<div class="per-row"><button class="pnav" id="c-prev" aria-label="Mês anterior">‹</button><strong>' + esc(monthLabel(calYM)) + '</strong><button class="pnav" id="c-next" aria-label="Próximo mês">›</button></div>' +
      '<div class="seg" role="tablist" aria-label="Visão do calendário"><button id="cv-m" class="' + (calView === 'month' ? 'on' : '') + '">Mês</button><button id="cv-w" class="' + (calView === 'week' ? 'on' : '') + '">Semana</button><button id="cv-l" class="' + (calView === 'list' ? 'on' : '') + '">Lista</button><button id="cv-u" class="' + (calView === 'upcoming' ? 'on' : '') + '">Próximos</button><button id="cv-o" class="' + (calView === 'overdue' ? 'on' : '') + '">Atrasados</button></div>' +
      '<div class="seg" role="group" aria-label="Visão"><button data-cvv="couple" class="' + (calVision === 'couple' ? 'on' : '') + '">Casal</button><button data-cvv="me" class="' + (calVision === 'me' ? 'on' : '') + '">' + vMe + '</button><button data-cvv="partner" class="' + (calVision === 'partner' ? 'on' : '') + '">' + vPa + '</button></div><div class="row"><button class="btn ghost" id="c-agnew">+ Novo compromisso</button></div></div>';
    html += '<div class="card"><b>Filtros</b><div class="row">' +
      '<select id="cf-type" aria-label="Tipo"><option value="">Todos os tipos</option>' + J.DB.CALENDAR_TYPES.map(function (t) { return '<option value="' + t + '"' + (calType === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' +
      '<select id="cf-state" aria-label="Estado"><option value="">Todos os estados</option>' + J.DB.CALENDAR_STATES.map(function (t) { return '<option value="' + t + '"' + (calState === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><select id="cf-acc" aria-label="Conta"><option value="">Todas as contas</option>' + accs.map(function (a) { return '<option value="' + a.id + '"' + (calAccount === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select>' +
      '<select id="cf-card" aria-label="Cartão"><option value="">Todos os cartões</option>' + cards.map(function (a) { return '<option value="' + a.id + '"' + (calCard === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><select id="cf-cat" aria-label="Categoria"><option value="">Todas as categorias</option>' + J.DB.getCategoryTree(me.id, '', false).map(function (p) { return '<option value="' + p.id + '"' + (calCat === p.id ? ' selected' : '') + '>' + esc(p.icon + ' ' + p.name) + '</option>'; }).join('') + '</select>' +
      '<select id="cf-catsub" aria-label="Subcategoria"><option value="">Todas subcategorias</option>' + subCatOptions(me, calCat, calSub) + '</select>' +
      '<select id="cf-person" aria-label="Pessoa"><option value="">Casal</option><option value="me"' + (calPerson === 'me' ? ' selected' : '') + '>Eu</option><option value="partner"' + (calPerson === 'partner' ? ' selected' : '') + '>Parceiro</option></select></div>' +
      '<div class="row"><input id="cf-q" placeholder="Buscar (ex: Netflix)" value="' + esc(calSearch) + '" aria-label="Buscar"><select id="cf-plan" aria-label="Plano"><option value="">Todos os planos</option>' + plans.map(function (a) { return '<option value="' + a.id + '"' + (calPlan === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><button class="btn ghost" id="cf-cash">' + (calCash ? 'Ocultar fluxo de caixa' : 'Ver fluxo de caixa') + '</button><button class="btn ghost" id="cf-hab">' + (calHabits ? 'Ocultar hábitos' : 'Incluir hábitos') + '</button><button class="btn ghost" id="cf-csv">Exportar CSV</button><button class="btn ghost" id="cf-clear">Limpar</button></div></div>';
    html += '<div class="card"><b>Resumo do período</b><p class="muted">Realizado: <b class="pos">+' + BRL(sum.incomeRealized) + '</b> <b class="neg">−' + BRL(sum.expenseRealized) + '</b> (= ' + BRL(sum.resultRealized) + ') • Compromissos: <b>' + BRL(sum.commitments) + '</b> • Planejado: <b class="pos">+' + BRL(sum.plannedIn) + '</b> <b class="neg">−' + BRL(sum.plannedOut) + '</b><br>Saldo em contas: <b>' + BRL(sum.opening) + '</b>' + (sum.projected != null ? ' • Saldo projetado (mês): <b>' + BRL(sum.projected) + '</b> <span class="muted">(projeção, não saldo)</span>' : '') + '</p></div><div id="e"></div>';
    if (calCash) {
      try {
        var cf = J.DB.calendarCashflow(me.id, Object.assign({}, F, { from: r.from, to: r.to }));
        html += '<div class="card"><b>Fluxo de caixa (contas)</b><p class="muted">Abertura: ' + BRL(cf.opening) + ' • Fechamento projetado do período: ' + BRL(cf.closing) + ' <span class="muted">(só move conta: cartão entra na fatura; transferência não altera resultado)</span></p>' +
          cf.days.filter(function (d, ix) { return d.in || d.out || ix % 5 === 0; }).slice(0, 12).map(function (d) { return '<p><b>' + dueLabel(d.date) + '</b> <span class="muted">+' + BRL(d.in) + ' −' + BRL(d.out) + ' = </span><b>' + BRL(d.balance) + '</b></p>'; }).join('') + '</div>';
      } catch (e3) { html += '<div class="card"><b>Fluxo de caixa</b>' + err(e3) + '</div>'; }
    }
    if (!evs.length) {
      var emptyMsg = calView === 'overdue' ? 'Nenhum compromisso atrasado.' : calView === 'upcoming' ? 'Não há compromissos futuros cadastrados.' : 'Não há movimentações ou compromissos neste período.';
      html += '<div class="card empty"><div class="ico">📅</div><h2>Nada por aqui</h2><p class="muted">' + emptyMsg + '</p>' + (J.DB.listPlans(me.id, {}).length ? '' : '<p class="muted">Você ainda não possui itens planejados para este período.</p>') + '</div>';
    } else if (calView === 'month') {
      html += calMonthGrid(me, calYM, evs);
    } else if (calView === 'week') {
      html += calWeekView(me, evs);
    } else if (calView === 'upcoming' || calView === 'overdue') {
      var list = calView === 'upcoming'
        ? J.DB.getUpcomingEvents(me.id, Object.assign({}, F, { limit: 30 }))
        : J.DB.getOverdueEvents(me.id, Object.assign({}, F, { limit: 50 }));
      html += list.length ? '<div class="card"><b>' + (calView === 'upcoming' ? 'Próximos eventos' : 'Atrasados') + ' (' + list.length + ')</b>' + list.map(function (e) { return calRow(e); }).join('') + '</div>'
        : '<div class="card empty"><div class="ico">📅</div><h2>Nada por aqui</h2><p class="muted">' + (calView === 'upcoming' ? 'Não há compromissos futuros cadastrados.' : 'Nenhum compromisso atrasado.') + '</p></div>';
    } else {
      var byDay = J.DB.groupEventsByDate(evs);
      html += Object.keys(byDay).sort().map(function (day) {
        return '<div class="card"><div class="row between"><b>' + esc(dueLabel(day)) + '</b><button class="btn ghost" data-day="' + day + '">Detalhe do dia</button></div>' + byDay[day].map(function (e) { return calRow(e); }).join('') + '</div>';
      }).join('');
    }
    v.innerHTML = html;
    document.getElementById('c-prev').onclick = function () { calYM = J.DB.shiftMonth(calYM, -1); render('calendar'); };
    var cag = document.getElementById('c-agnew'); if (cag) cag.onclick = function () { openAgendaModal(me, null, null); };
    document.getElementById('c-next').onclick = function () { calYM = J.DB.shiftMonth(calYM, 1); render('calendar'); };
    document.getElementById('cv-m').onclick = function () { calView = 'month'; render('calendar'); };
    document.getElementById('cv-w').onclick = function () { calView = 'week'; render('calendar'); };
    document.getElementById('cv-l').onclick = function () { calView = 'list'; render('calendar'); };
    document.getElementById('cv-u').onclick = function () { calView = 'upcoming'; render('calendar'); };
    document.getElementById('cv-o').onclick = function () { calView = 'overdue'; render('calendar'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-cvv]'), function (b) { b.onclick = function () { calVision = b.dataset.cvv; render('calendar'); }; });
    document.getElementById('cf-type').onchange = function (e) { calType = e.target.value; render('calendar'); };
    document.getElementById('cf-state').onchange = function (e) { calState = e.target.value; render('calendar'); };
    document.getElementById('cf-acc').onchange = function (e) { calAccount = e.target.value; render('calendar'); };
    document.getElementById('cf-card').onchange = function (e) { calCard = e.target.value; render('calendar'); };
    document.getElementById('cf-cat').onchange = function (e) { calCat = e.target.value; calSub = ''; render('calendar'); };
    var cfcs = document.getElementById('cf-catsub'); if (cfcs) cfcs.onchange = function (e) { calSub = e.target.value; render('calendar'); };
    document.getElementById('cf-person').onchange = function (e) { calPerson = e.target.value; render('calendar'); };
    document.getElementById('cf-plan').onchange = function (e) { calPlan = e.target.value; render('calendar'); };
    document.getElementById('cf-q').onchange = function (e) { calSearch = e.target.value; render('calendar'); };
    document.getElementById('cf-cash').onclick = function () { calCash = !calCash; render('calendar'); };
    document.getElementById('cf-hab').onclick = function () { calHabits = !calHabits; render('calendar'); };
    document.getElementById('cf-clear').onclick = function () { calType = calState = calAccount = calCard = calCat = calSub = calPerson = calSearch = calPlan = ''; calHabits = false; render('calendar'); };
    document.getElementById('cf-csv').onclick = function () {
      try {
        var f = J.DB.calendarExportCsv(me.id, Object.assign({}, F, { from: r.from, to: r.to }));
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([f.csv], { type: 'text/csv;charset=utf-8' }));
        a.download = f.filename; a.click();
        toast('CSV baixado! 📥');
      } catch (e4) { toast('Não foi possível exportar. Tente de novo.'); }
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-ev]'), function (b) { b.onclick = function () { openCalEventModal(me, b.dataset.ev); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-day]'), function (b) { b.onclick = function () { openCalDayModal(me, b.dataset.day); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-occ]'), function (b) { b.onclick = function () { openOccModal(me, b.dataset.occ); }; });
  }
  function calRow(e) {
    return '<button class="tx" data-ev="' + esc(e.id) + '" aria-label="' + esc(e.title + ' ' + e.status + ' ' + e.event_date) + '"><span class="tx-ic">' + calTypeIcon(e.event_type) + '</span>' +
      '<span class="tx-mid"><b>' + esc(e.title) + '</b><small>' + dueLabel(e.event_date) + ' • ' + esc(e.event_type) + '</small></span>' +
      '<span style="text-align:right"><b class="' + (e.event_type === 'income' ? 'pos' : e.event_type === 'expense' ? 'neg' : '') + '">' + BRL(e.amount) + '</b><br>' + calStatePill(e.status) + '</span></button>';
  }
  function calMonthGrid(me, ym, evs) {
    var y = parseInt(ym.slice(0, 4), 10), m = parseInt(ym.slice(5, 7), 10);
    var startDow = new Date(y, m - 1, 1).getDay(), n = new Date(y, m, 0).getDate();
    var byDay = {};
    evs.forEach(function (e) { var dd = parseInt(e.event_date.slice(8, 10), 10); (byDay[dd] = byDay[dd] || []).push(e); });
    var cells = '';
    for (var i = 0; i < startDow; i++) cells += '<div class="cal-empty"></div>';
    for (var d = 1; d <= n; d++) {
      var list = (byDay[d] || []).slice(0, 3);
      var extra = (byDay[d] || []).length - list.length;
      var warn = (byDay[d] || []).some(function (e) { return e.status === 'vencido'; });
      cells += '<div class="cal-day' + (warn ? ' cal-warn' : '') + '"><button class="cal-daynum" data-day="' + ym + '-' + ('0' + d).slice(-2) + '" aria-label="Ver dia ' + d + '"><b>' + d + '</b></button>' + list.map(function (e) {
        return '<button class="cal-it" data-ev="' + esc(e.id) + '" title="' + esc(e.title) + ' ' + BRL(e.amount) + ' (' + esc(e.status) + ')">' + calTypeIcon(e.event_type) + ' ' + esc(e.title.slice(0, 12)) + '</button>';
      }).join('') + (extra > 0 ? '<span class="muted">+' + extra + ' eventos</span>' : '') + '</div>';
    }
    return '<div class="card"><div class="cal-grid" role="grid" aria-label="Calendário mensal"><div class="cal-dow">D</div><div class="cal-dow">S</div><div class="cal-dow">T</div><div class="cal-dow">Q</div><div class="cal-dow">Q</div><div class="cal-dow">S</div><div class="cal-dow">S</div>' + cells + '</div><p class="muted">✓ realizado • ✎ planejado • ◷ previsto • ⏳ pendente • ⚠ vencido</p></div>';
  }
  function calWeekView(me, evs) {
    var byDay = J.DB.groupEventsByDate(evs);
    return Object.keys(byDay).sort().slice(0, 7).map(function (day) {
      return '<div class="card"><div class="row between"><b>' + esc(dueLabel(day)) + '</b><button class="btn ghost" data-day="' + day + '">Detalhe do dia</button></div>' + byDay[day].map(function (e) { return calRow(e); }).join('') + '</div>';
    }).join('') || '<div class="card empty"><div class="ico">📅</div><h2>Nada por aqui</h2><p class="muted">Não há movimentações ou compromissos neste período.</p></div>';
  }
  function openCalDayModal(me, day) {
    var evs, sum;
    try { evs = J.DB.getEventsForDay(me.id, day, calFilters()); sum = J.DB.calculateDaySummary(me.id, day, calFilters()); }
    catch (e) { toast('Não foi possível carregar o dia.'); return; }
    modalShell('<h2>' + esc(dueLabel(day)) + '</h2><div id="me"></div>' +
      '<p class="muted">Entradas realizadas: <b class="pos">' + BRL(sum.incomeRealized) + '</b> • Saídas realizadas: <b class="neg">' + BRL(sum.expenseRealized) + '</b><br>Compromissos: <b>' + BRL(sum.commitments) + '</b> • Planejado: <b class="pos">+' + BRL(sum.plannedIn) + '</b> <b class="neg">−' + BRL(sum.plannedOut) + '</b></p>' +
      (evs.length ? evs.map(function (e) { return calRow(e); }).join('') : '<p class="muted">Não há movimentações ou compromissos neste dia.</p>') +
      '<button class="btn ghost" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    Array.prototype.forEach.call(document.querySelectorAll('#modal-root [data-ev]'), function (b) { b.onclick = function () { openCalEventModal(me, b.dataset.ev); }; });
  }
  function openCalEventModal(me, eventId) {
    var d;
    try { d = J.DB.getEventDetails(me.id, eventId); } catch (e) { toast('Evento não encontrado.'); return; }
    var e = d.event;
    modalShell('<h2>' + calTypeIcon(e.event_type) + ' ' + esc(e.title) + '</h2><div id="me"></div>' +
      '<p><b>' + BRL(e.amount) + '</b> • ' + esc(dueLabel(e.event_date)) + '<br>' + calStatePill(e.status) + ' <span class="muted">• ' + esc(e.event_type) + ' • origem: ' + esc(e.source_type) + '</span>' +
      (e.description ? '<br><span class="muted">' + esc(e.description) + '</span>' : '') + '</p>' +
      '<div class="row">' + d.actions.map(function (a, ix) { return '<button class="btn' + (ix ? ' ghost' : '') + '" data-act="' + ix + '">' + esc(a.label) + '</button>'; }).join('') + '</div>' +
      (e.source_type === 'recurring' && e.related_entity_id ? '<div class="row"><button class="btn ghost" id="rec-open">Abrir recorrência</button></div>' : '') +
      (e.source_type === 'planning_item' ? '<p><a href="' + esc(e.route) + '">Ver no planejamento ›</a></p>' : '') +
      '<button class="btn ghost" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    Array.prototype.forEach.call(document.querySelectorAll('#modal-root [data-act]'), function (b) {
      b.onclick = function () {
        var a = d.actions[parseInt(b.dataset.act, 10)];
        if (!a) return;
        closeModal();
        location.hash = a.route;
      };
    });
    var ro = document.getElementById('rec-open');
    if (ro) ro.onclick = function () { closeModal(); openOccModal(me, e.source_id); };
  }
  function openOccModal(me, occId) {
    var o;
    try { o = J.DB.getOccurrence(me.id, occId); } catch (e) { toast('Compromisso não encontrado.'); return; }
    var r = o.rec || {};
    modalShell('<h2>' + esc(r.description || 'Compromisso') + '</h2><div id="me"></div>' +
      '<p><b>' + BRL(o.amount) + '</b> • vencimento ' + dueLabel(o.due_date) + '<br>' + occStatusPill(o) +
      (r.category_id ? ' <span class="muted">' + esc(J.DB.catName(me.id, r.category_id)) + '</span>' : '') +
      (r.payer_user_id ? '<br><span class="muted">Responsável: ' + esc(J.DB.userName(me.id, r.payer_user_id)) + (r.is_shared ? ' • 🤝' : ' • 👤') + '</span>' : '') + '</p>' +
      (o.status === 'pending'
        ? '<label>Valor a registrar (R$) *</label><input id="f-ov" inputmode="decimal" value="' + String(o.amount).replace('.', ',') + '"><button class="btn" id="pay">Marcar como paga</button><div class="row"><button class="btn ghost" id="sk">Pular este mês</button><button class="btn ghost" id="cx">Cancelar</button></div>'
        : o.status === 'paid' ? '<p class="muted">Esta conta já foi registrada como paga.' + (o.transaction_id ? ' <a href="#/transactions">Ver nas transações ›</a>' : '') + '</p><div class="row"><button class="btn ghost" id="re">Reabrir</button></div>'
        : '<div class="row"><button class="btn ghost" id="re">Reabrir (voltar a pendente)</button></div>') +
      '<button class="btn ghost" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    function refresh() { closeModal(); render(here()); }
    var pay = document.getElementById('pay');
    if (pay) pay.onclick = function () {
      if (!confirm('Confirmar pagamento de ' + BRL(o.amount) + '? Será criada uma transação real.')) return;
      var btn = this; lock(btn);
      try { J.DB.payOccurrence(me.id, occId, { amount: document.getElementById('f-ov').value }); toast('Conta paga e registrada! ✅'); refresh(); }
      catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
    var sk = document.getElementById('sk');
    if (sk) sk.onclick = function () { try { J.DB.setOccurrenceStatus(me.id, occId, 'skipped'); toast('Ocorrência pulada. A conta continua ativa.'); refresh(); } catch (e2) { document.getElementById('me').innerHTML = err(e2); } };
    var cx = document.getElementById('cx');
    if (cx) cx.onclick = function () { if (confirm('Cancelar esta ocorrência?')) { try { J.DB.setOccurrenceStatus(me.id, occId, 'cancelled'); toast('Ocorrência cancelada.'); refresh(); } catch (e2) { document.getElementById('me').innerHTML = err(e2); } } };
    var re = document.getElementById('re');
    if (re) re.onclick = function () { try { J.DB.setOccurrenceStatus(me.id, occId, 'pending'); toast('Compromisso reaberto.'); refresh(); } catch (e2) { document.getElementById('me').innerHTML = err(e2); } };
  }
  /* ============ ETAPA 6: RELATÓRIOS ============ */
  var rep = { preset: 'month', month: '', cFrom: '', cTo: '', vision: 'couple', category: '', subcategory: '', type: '', account: '', card: '', search: '', catEvo: '', shown: 30, tab: 'all', savedName: '' };
  function repRange() {
    if (!rep.month) rep.month = thisMonth();
    var sh = J.DB.shiftMonth;
    if (rep.preset === 'prev') { var p = sh(rep.month, -1); return { from: p, to: p, single: true }; }
    if (rep.preset === 'last3') return { from: sh(rep.month, -2), to: rep.month, single: false };
    if (rep.preset === 'last6') return { from: sh(rep.month, -5), to: rep.month, single: false };
    if (rep.preset === 'last12') return { from: sh(rep.month, -11), to: rep.month, single: false };
    if (rep.preset === 'year') { var y = thisMonth().slice(0, 4); return { from: y + '-01', to: y + '-12', single: false }; }
    if (rep.preset === 'prevYear') { var py = String(+thisMonth().slice(0, 4) - 1); return { from: py + '-01', to: py + '-12', single: false }; }
    if (rep.preset === 'custom' && rep.cFrom && rep.cTo) {
      var a = rep.cFrom < rep.cTo ? rep.cFrom : rep.cTo, b = rep.cFrom < rep.cTo ? rep.cTo : rep.cFrom;
      return { from: a, to: b, single: a === b };
    }
    return { from: rep.month, to: rep.month, single: true };
  }
  var REP_TABS = [['all', 'Tudo'], ['summary', 'Resumo'], ['flow', 'Receitas e fluxo'], ['cats', 'Categorias'], ['accounts', 'Contas'], ['cards', 'Cartões e faturas'], ['commit', 'Compromissos'], ['budget', 'Orçamento'], ['goals', 'Metas'], ['plan', 'Planejamento'], ['couple', 'Casal'], ['rec', 'Reconciliação'], ['extra', 'Insights+']];
  function repShow(tab) { return rep.tab === 'all' || rep.tab === tab; }
  function repOpt(r, F) {
    return { vision: rep.vision, preset: rep.preset === 'year' || rep.preset === 'prevYear' ? 'custom' : rep.preset, month: rep.month, cFrom: r.from, cTo: r.to, category_id: F.category_id, account_id: F.account_id, credit_card_id: F.credit_card_id, type: F.type || undefined };
  }
  function repFilter() {
    var t = (rep.type === 'income' || rep.type === 'expense') ? rep.type : undefined;
    return { vision: rep.vision, category_id: rep.subcategory || rep.category || undefined, type: t, account_id: rep.account || undefined, credit_card_id: rep.card || undefined };
  }
  function rsec(title, fn) {
    try { return '<div class="card"><b>' + title + '</b>' + fn() + '</div>'; }
    catch (e) { return '<div class="card"><b>' + title + '</b><div class="alert">Não foi possível carregar esta seção.</div><button class="btn ghost" data-rep-retry>Tentar novamente</button></div>'; }
  }
  function repMonths(r) {
    var out = [], c = r.from;
    while (c <= r.to && out.length < 13) { out.push(c); if (c === r.to) break; c = J.DB.shiftMonth(c, 1); }
    return out;
  }
  function downloadCsv(me, kind, r) {
    try {
      var f = J.DB.buildCsv(me.id, kind, { from: r.from, to: r.to });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([f.csv], { type: 'text/csv;charset=utf-8' }));
      a.download = f.filename; a.click();
      toast('CSV baixado! 📥');
    } catch (e) { toast('Não foi possível exportar. Tente de novo.'); }
  }
  function pReports(v, me) {
    var r = repRange(), F = repFilter();
    var partnerId = J.DB.memberIds(me.id).filter(function (x) { return x !== me.id; })[0] || null;
    var vMe = esc(me.nome.split(' ')[0]), vPa = partnerId ? esc(firstShort(me, partnerId)) : 'Parceiro';
    var cats = J.DB.myCategories(me.id, '');
    var accs = J.DB.listAccounts(me.id, 'all'), cards = J.DB.listCards(me.id, 'all');
    var d = J.DB.dashboardCalc(me.id, { from: r.from, to: r.to, vision: rep.vision, category_id: F.category_id, type: F.type, account_id: F.account_id, credit_card_id: F.credit_card_id });
    var eng = J.DB.calculateSettlementBalance(me.id);
    var html = '<div class="print-only"><h1>Relatório financeiro</h1><p>' + esc(rangeLabel(r)) + ' • ' + (rep.vision === 'couple' ? 'casal' : rep.vision) + ' • gerado em ' + esc(todayISO().split('-').reverse().join('/')) + '</p></div>';
    html += '<div class="card no-print"><h1>Relatórios</h1>' +
      '<div class="row"><select id="r-preset" aria-label="Período"><option value="month"' + (rep.preset === 'month' ? ' selected' : '') + '>Este mês</option><option value="prev"' + (rep.preset === 'prev' ? ' selected' : '') + '>Mês anterior</option><option value="last3"' + (rep.preset === 'last3' ? ' selected' : '') + '>Últimos 3 meses</option><option value="last6"' + (rep.preset === 'last6' ? ' selected' : '') + '>Últimos 6 meses</option><option value="last12"' + (rep.preset === 'last12' ? ' selected' : '') + '>Últimos 12 meses</option><option value="year"' + (rep.preset === 'year' ? ' selected' : '') + '>Ano atual</option><option value="prevYear"' + (rep.preset === 'prevYear' ? ' selected' : '') + '>Ano anterior</option><option value="custom"' + (rep.preset === 'custom' ? ' selected' : '') + '>Personalizado</option></select>';
    if (rep.preset === 'custom') html += '<input type="month" id="r-cf" value="' + esc(rep.cFrom) + '" aria-label="De"><input type="month" id="r-ct" value="' + esc(rep.cTo) + '" aria-label="Até">';
    html += '<select id="r-vis" aria-label="Visão"><option value="couple"' + (rep.vision === 'couple' ? ' selected' : '') + '>Casal</option><option value="me"' + (rep.vision === 'me' ? ' selected' : '') + '>' + vMe + '</option><option value="partner"' + (rep.vision === 'partner' ? ' selected' : '') + '>' + vPa + '</option></select></div>';
    html += '<div class="row"><select id="r-cat" aria-label="Categoria"><option value="">Todas categorias</option>' + J.DB.getCategoryTree(me.id, '', false).map(function (p) {
      return '<option value="' + p.id + '"' + (rep.category === p.id ? ' selected' : '') + '>' + esc(p.icon + ' ' + p.name) + '</option>';
    }).join('') + '</select><select id="r-catsub" aria-label="Subcategoria"><option value="">Todas subcategorias</option>' + subCatOptions(me, rep.category, rep.subcategory) + '</select>';
    html += '<select id="r-type" aria-label="Tipo"><option value="">Receitas + despesas</option><option value="income"' + (rep.type === 'income' ? ' selected' : '') + '>Receitas</option><option value="expense"' + (rep.type === 'expense' ? ' selected' : '') + '>Despesas</option><option value="transfer"' + (rep.type === 'transfer' ? ' selected' : '') + '>Transferências</option><option value="invoice"' + (rep.type === 'invoice' ? ' selected' : '') + '>Faturas</option><option value="installment"' + (rep.type === 'installment' ? ' selected' : '') + '>Parcelas</option><option value="recurring"' + (rep.type === 'recurring' ? ' selected' : '') + '>Recorrências</option><option value="goal"' + (rep.type === 'goal' ? ' selected' : '') + '>Metas</option><option value="budget"' + (rep.type === 'budget' ? ' selected' : '') + '>Orçamento</option><option value="planning"' + (rep.type === 'planning' ? ' selected' : '') + '>Planejamento</option><option value="settlement"' + (rep.type === 'settlement' ? ' selected' : '') + '>Acertos</option></select></div>';
    html += '<div class="row"><select id="r-acc" aria-label="Conta"><option value="">Todas as contas</option>' + accs.map(function (a) {
      return '<option value="' + a.id + '"' + (rep.account === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>';
    }).join('') + '</select>';
    html += '<select id="r-card" aria-label="Cartão"><option value="">Todos os cartões</option>' + cards.map(function (c) {
      return '<option value="' + c.id + '"' + (rep.card === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('') + '</select></div>';
    html += '<p class="muted">' + esc(rangeLabel(r)) + (rep.vision === 'couple' ? ' • casal' : ' • ' + (rep.vision === 'me' ? vMe : vPa)) + '</p>';
    html += '<div class="rep-tabs" role="tablist" aria-label="Seções">' + REP_TABS.map(function (t) {
      return '<button data-rtab="' + t[0] + '" class="' + (rep.tab === t[0] ? 'on' : '') + '" role="tab">' + t[1] + '</button>';
    }).join('') + '</div>';
    html += '<div class="row"><button class="btn ghost" id="r-print">🖨️ Imprimir / PDF</button><button class="btn ghost" id="r-csv">📥 Exportar CSV</button></div>';
    html += '<div class="row" id="r-csvrow" style="display:none"><select id="r-kind" aria-label="Tipo de exportação"><option value="transactions">Transações</option><option value="categories">Despesas por categoria</option><option value="cashflow">Fluxo de caixa</option><option value="invoices">Faturas</option><option value="installments">Parcelas</option><option value="budget">Orçamento</option><option value="settlements">Acertos</option><option value="rep-category">V3: categorias</option><option value="rep-trend">V3: evolução</option><option value="rep-commitment">V3: compromissos</option><option value="rep-invoice">V3: faturas</option><option value="rep-installment">V3: parcelas</option><option value="rep-budget">V3: orçamento</option><option value="rep-goal">V3: metas</option><option value="rep-planning">V3: planejamento</option><option value="rep-scenario">V3: cenários</option><option value="rep-settlement">V3: acertos</option><option value="rep-recurring">V3: recorrências</option><option value="rep-account">V3: contas</option><option value="rep-card">V3: cartões</option><option value="rep-reconciliation">V3: reconciliação</option><option value="rep-insight">V3: insights</option><option value="rep-comparison">V3: comparação</option><option value="rep-summary">V3: resumo</option></select><button class="btn" id="r-dl" style="max-width:150px">Baixar</button></div>';
    html += '<div class="row"><input id="r-svname" placeholder="Nome do relatório salvo…" value="' + esc(rep.savedName) + '" aria-label="Nome do relatório"><button class="btn ghost" id="r-save">💾 Salvar</button><select id="r-saved" aria-label="Relatórios salvos"><option value="">Relatórios salvos…</option>' + J.DB.listSavedReports(me.id).map(function (s) {
      return '<option value="' + s.id + '">' + esc(s.name + ' • ' + s.report_type) + '</option>';
    }).join('') + '</select></div><div id="r-savemsg"></div></div><div id="e"></div>';

    if (!d.totalTx) {
      v.innerHTML = html + '<div class="card empty"><div class="ico">📈</div><h2>Ainda não existem transações suficientes para gerar este relatório.</h2><p class="muted">Ajuste o período ou os filtros.</p></div>';
      bindRepChrome(v, me, r); return;
    }
    // resumo + comparação com período anterior
    if (repShow('summary')) html += rsec('Resumo financeiro', function () {
      var span = repMonths(r).length;
      var pTo = J.DB.shiftMonth(r.from, -1), pFrom = J.DB.shiftMonth(pTo, -(span - 1));
      var pd = J.DB.dashboardCalc(me.id, { from: pFrom, to: pTo, vision: rep.vision, category_id: F.category_id, type: F.type, account_id: F.account_id, credit_card_id: F.credit_card_id });
      var hasPrev = (pd.incomeCount + pd.expenseCount) > 0;
      function cmp(cur, prv, label) {
        if (!hasPrev) return '';
        var diff = Math.round((cur - prv) * 100) / 100;
        var pct = prv ? Math.round(diff / prv * 10000) / 100 : null;
        var word = diff === 0 ? 'iguais' : diff < 0 ? 'menores' : 'maiores';
        return '<br>' + label + ' anterior: ' + BRL(prv) + ' • diferença ' + BRL(diff) + (pct == null ? '' : ' (' + fmtPct(pct) + ')') + ' ' + word + ' que o período anterior.';
      }
      return '<p>Receitas <b class="pos">' + BRL(d.income) + '</b> • Despesas <b class="neg">' + BRL(d.expense) + '</b> • Resultado <b>' + BRL(d.balance) + '</b> • Poupança <b>' + (d.saveRate == null ? '—' : fmtPct(d.saveRate)) + '</b>' +
        '<br><span class="muted">' + txNoun(d.incomeCount + d.expenseCount) + ' no período.' + cmp(d.income, pd.income, 'Receitas') + cmp(d.expense, pd.expense, 'Despesas') + '</span></p>' + rdChart(me, r, d);
    });
    // categorias + evolução da categoria (hierárquico, expansível)
    if (repShow('cats')) html += rsec('Despesas por categoria', function () {
      var catN = J.DB.expenseCounts(me.id, r.from, r.to);
      function cnt(id, kids) {
        var n = catN[id] || 0;
        (kids || []).forEach(function (k) { n += catN[k.id] || 0; });
        return n;
      }
      var s = d.byCat.length ? d.byCat.map(function (c) {
        var n = cnt(c.id, c.children);
        var open = !!catExp['rep:' + c.id];
        var kids = (c.children && c.children.length && open) ? c.children.map(function (k) {
          return '<p style="margin-left:16px">└ ' + esc(k.icon + ' ' + k.name) + ' — <b>' + BRL(k.value) + '</b> <span class="muted">' + String(k.pct).replace('.', ',') + '% • ' + txNoun(catN[k.id] || 0) + '</span></p>';
        }).join('') : '';
        var toggle = (c.children && c.children.length) ? '<button class="link" data-catexp="rep:' + c.id + '">' + (open ? '▾' : '▸') + '</button>' : '';
        return '<p>' + toggle + esc(c.icon + ' ' + c.name) + ' — <b>' + BRL(c.value) + '</b> <span class="muted">' + String(c.pct).replace('.', ',') + '% • ' + txNoun(n) + '</span></p>' + kids;
      }).join('') : '<p class="muted">Sem despesas no período.</p>';
      var evoCat = rep.catEvo || (d.byCat[0] && d.byCat[0].id) || '';
      var months = repMonths(r);
      var evoRows = months.map(function (ym) {
        var dd = J.DB.dashboardCalc(me.id, { from: ym, to: ym, vision: rep.vision });
        var f = dd.byCat.find(function (c) { return c.id === evoCat; });
        if (!f) dd.byCat.forEach(function (c) { (c.children || []).forEach(function (k) { if (k.id === evoCat) f = k; }); });
        return { m: ym, v: f ? f.value : 0 };
      });
      s += '<label>Evolução da categoria</label><select id="r-evo" aria-label="Categoria para evolução">' + d.byCat.map(function (c) {
        var sub = (c.children || []).map(function (k) {
          return '<option value="' + k.id + '"' + (evoCat === k.id ? ' selected' : '') + '>' + esc(c.name + ' → ' + k.name) + '</option>';
        }).join('');
        return '<option value="' + c.id + '"' + (evoCat === c.id ? ' selected' : '') + '>' + esc(c.icon + ' ' + c.name) + '</option>' + sub;
      }).join('') + '</select>';
      if (evoCat) s += evoRows.map(function (e) { return '<p>' + esc(monthLabel(e.m)) + ': <b>' + BRL(e.v) + '</b></p>'; }).join('');
      return s;
    });
    // receitas por categoria + maiores + busca + tabela
    if (repShow('flow')) html += rsec('Receitas e maiores despesas', function () {
      var s = '<p class="muted">RECEITAS POR CATEGORIA</p>' + (d.incomeByCat.length ? d.incomeByCat.map(function (c) {
        var open = !!catExp['repi:' + c.id];
        var kids = (c.children && c.children.length && open) ? c.children.map(function (k) {
          return '<p style="margin-left:16px">└ ' + esc(k.icon + ' ' + k.name) + ' — <b>' + BRL(k.value) + '</b> <span class="muted">' + String(k.pct).replace('.', ',') + '%</span></p>';
        }).join('') : '';
        var toggle = (c.children && c.children.length) ? '<button class="link" data-catexp="repi:' + c.id + '">' + (open ? '▾' : '▸') + '</button>' : '';
        return '<p>' + toggle + esc(c.icon + ' ' + c.name) + ' — <b>' + BRL(c.value) + '</b> <span class="muted">' + String(c.pct).replace('.', ',') + '%</span></p>' + kids;
      }).join('') : '<p class="muted">Sem receitas no período.</p>');
      var all = J.DB.listTx(me.id, { from: r.from, to: r.to, type: 'expense', category_id: F.category_id || undefined, account_id: F.account_id || undefined, credit_card_id: F.credit_card_id || undefined });
      var top = all.slice().sort(function (a, b) { return b.amount - a.amount; }).slice(0, 8);
      s += '<p class="muted">MAIORES DESPESAS</p>' + (top.length ? top.map(function (t) {
        return '<p>' + esc(t.description) + ' <span class="muted">' + dueLabel(t.date) + ' • ' + esc(J.DB.catName(me.id, t.category_id)) + '</span> — <b>' + BRL(t.amount) + '</b></p>';
      }).join('') : '<p class="muted">Sem despesas.</p>');
      var rows = J.DB.listTx(me.id, { from: r.from, to: r.to, search: rep.search || undefined });
      var shown = rows.slice(0, rep.shown);
      s += '<label>Buscar no período</label><input id="r-q" placeholder="Descrição ou observação…" value="' + esc(rep.search) + '">';
      s += '<div id="r-txhost">';
      var rowsHtml = shown.map(function (t) { return txRow(me, t); }).join('');
      s += rowsHtml || '<p class="muted">Nada encontrado.</p>';
      if (rows.length > rep.shown) s += '<button class="btn ghost" id="r-more">Mostrar mais (' + (rows.length - rep.shown) + ')</button>';
      s += '</div>';
      return s;
    });
    // contas + fluxo
    if (repShow('accounts')) html += rsec('Contas e fluxo de caixa', function () {
      var cf = J.DB.cashFlowByAccount(me.id, r.from, r.to);
      var s = cf.accounts.map(function (a) {
        return '<p><b>' + esc(a.name) + '</b> <span class="muted">' + esc(J.DB.accountTypeLabel(a.type)) + (a.active ? '' : ' • inativa') + '</span><br>' +
          'Início ' + BRL(a.start) + ' + entradas ' + BRL(a.inIncome + a.inTransfers) + ' (receitas ' + BRL(a.inIncome) + ' + transf. ' + BRL(a.inTransfers) + ') − saídas ' + BRL(a.outExpense + a.outTransfers + a.outPays) + ' (despesas ' + BRL(a.outExpense) + ' + transf. ' + BRL(a.outTransfers) + ' + faturas ' + BRL(a.outPays) + ') = <b>' + BRL(a.end) + '</b></p>';
      }).join('') || '<p class="muted">Nenhuma conta.</p>';
      var t = cf.totals;
      s += '<p><b>Consolidado:</b> início ' + BRL(t.start) + ' • fim <b>' + BRL(t.end) + '</b></p><p><a href="#/accounts">Ver contas ›</a></p>';
      return s;
    });
    // transferências
    if (repShow('flow')) html += rsec('Transferências', function () {
      var trs = J.DB.listTransfers(me.id).filter(function (t) { return t.date.slice(0, 7) >= r.from && t.date.slice(0, 7) <= r.to; });
      var rin = 0, rout = 0;
      trs.forEach(function (t) { rin += t.amount; rout += t.amount; });
      var s = '<p>Enviado <b>' + BRL(rout) + '</b> • Recebido <b>' + BRL(rin) + '</b> • ' + trs.length + (trs.length === 1 ? ' transferência' : ' transferências') + '<br><span class="muted">Resultado consolidado: ' + BRL(0) + ' (não altera receitas nem despesas).</span></p>';
      return s + trs.slice(0, 10).map(function (t) {
        return '<p>' + esc(J.DB.accountName(me.id, t.from_account_id)) + ' → ' + esc(J.DB.accountName(me.id, t.to_account_id)) + ' — <b>' + BRL(t.amount) + '</b> <span class="muted">' + dueLabel(t.date) + '</span></p>';
      }).join('');
    });
    // cartões
    if (repShow('cards')) html += rsec('Cartões', function () {
      return J.DB.listCards(me.id, 'active').map(function (c) {
        var u = J.DB.calculateCardAvailableLimit(me.id, c.id);
        var n = J.DB.listTx(me.id, { from: r.from, to: r.to, type: 'expense', credit_card_id: c.id }).length;
        var pend = J.DB.calculateCardInstallmentCommitment(me.id, c.id);
        var invs = J.DB.listInvoices(me.id, {}).filter(function (i) { return i.credit_card_id === c.id && i.status !== 'paid' && i.status !== 'cancelled'; }).length;
        return '<p><b>' + esc(c.name) + '</b><br><span class="muted">Limite ' + BRL(c.credit_limit) + ' • comprometido ' + BRL(u.used) + ' • disponível ' + BRL(u.available) + ' • ' + n + ' compras • parcelas pendentes ' + BRL(pend) + ' • ' + invs + ' faturas pendentes</span></p>';
      }).join('') || '<p class="muted">Nenhum cartão ativo.</p>';
    });
    // parcelas
    if (repShow('commit')) html += rsec('Parcelas e compromissos', function () {
      var ps = J.DB.listInstallmentPurchases(me.id, {});
      var act = ps.filter(function (p) { return p.status === 'active'; });
      var s = act.slice(0, 10).map(function (p) {
        var sm = J.DB.purchaseSummary(me.id, p.id);
        return '<p><b>' + esc(p.description) + '</b> <span class="muted">' + esc(J.DB.cardName(me.id, p.credit_card_id)) + '</span><br>' + (sm.installmentCount - sm.pendingInstallments + 1) + '/' + sm.installmentCount + ' • próxima ' + (sm.nextDueDate ? dueLabel(sm.nextDueDate) : '—') + ' • restante <b>' + BRL(sm.pendingAmount) + '</b></p>';
      }).join('');
      var fut = 0;
      act.forEach(function (p) { fut += J.DB.purchaseSummary(me.id, p.id).pendingAmount; });
      return (s || '<p class="muted">Nenhuma compra parcelada ativa.</p>') + '<p><b>Compromissos futuros: ' + BRL(Math.round(fut * 100) / 100) + '</b> <span class="muted">(não é dívida automática)</span></p>';
    });
    // faturas + pagamentos
    if (repShow('cards')) html += rsec('Faturas e pagamentos', function () {
      var invs = J.DB.listInvoices(me.id, {}).filter(function (i) { return i.reference_year + '-' + ('0' + i.reference_month).slice(-2) >= r.from && i.reference_year + '-' + ('0' + i.reference_month).slice(-2) <= r.to; });
      var pays = J.DB.listInvoicePayments(me.id, {}).filter(function (p) { return p.payment_date.slice(0, 7) >= r.from && p.payment_date.slice(0, 7) <= r.to; });
      var totPay = Math.round(pays.reduce(function (a, p) { return a + p.amount; }, 0) * 100) / 100;
      var s = invs.map(function (i) {
        return '<p><b>' + esc(J.DB.cardName(me.id, i.credit_card_id)) + '</b> ' + ('0' + i.reference_month).slice(-2) + '/' + i.reference_year + ' — total ' + BRL(i.total_amount) + ' • pago ' + BRL(i.paid_amount) + ' • pendente ' + BRL(J.DB.calculateInvoiceOutstanding(me.id, i.id)) + ' • ' + esc(invStatusText(i.status)) + '</p>';
      }).join('') || '<p class="muted">Nenhuma fatura no período.</p>';
      s += '<p><b>Pagamentos de fatura no período: ' + BRL(totPay) + '</b> <span class="muted">(fluxo de caixa, não nova despesa)</span></p>';
      return s + pays.slice(0, 10).map(function (p) {
        return '<p>−' + BRL(p.amount) + ' <span class="muted">' + dueLabel(p.payment_date) + ' • ' + esc(J.DB.accountName(me.id, p.payment_account_id)) + '</span></p>';
      }).join('');
    });
    // orçamento (meses do período com orçamento)
    if (repShow('budget')) html += rsec('Orçamento', function () {
      var s = '';
      repMonths(r).forEach(function (ym) {
        var bs = J.DB.budgetSummary(me.id, ym);
        if (!bs.items.length) return;
        s += '<p><b>' + esc(monthLabel(ym)) + '</b>: ' + BRL(bs.spent) + ' / ' + BRL(bs.total) + ' (' + String(bs.pct).replace('.', ',') + '%)' +
          bs.items.map(function (it) { return '<br>• ' + esc(it.name) + ': ' + BRL(it.spent) + '/' + BRL(it.limit) + ' (' + String(it.pct).replace('.', ',') + '%) ' + it.status.icon + ' ' + it.status.label; }).join('') + '</p>';
      });
      return s || '<p class="muted">Nenhum orçamento no período.</p>';
    });
    // metas
    if (repShow('goals')) html += rsec('Metas', function () {
      var gs = J.DB.listGoals(me.id, true);
      var act = gs.filter(function (g) { return g.status === 'active'; }), done = gs.filter(function (g) { return g.status === 'completed'; });
      var s = '<p>Ativas: <b>' + act.length + '</b> • Concluídas: <b>' + done.length + '</b></p>';
      return s + gs.slice(0, 8).map(function (g) {
        var pr = J.DB.goalProgress(g);
        return '<p><b>' + esc(g.name) + '</b> — ' + BRL(g.current_amount) + ' de ' + BRL(g.target_amount) + ' (' + String(pr.pct).replace('.', ',') + '%) • ' + esc(goalStatusText(g.status)) + (g.deadline ? ' • ' + dueLabel(g.deadline) : '') + '</p>';
      }).join('') || '<p class="muted">Nenhuma meta.</p>';
    });
    // participação + acertos + histórico
    if (repShow('couple')) html += rsec('Participação e acertos', function () {
      var s = d.perPerson.map(function (p) {
        return '<p>👤 <b>' + esc(J.DB.userName(me.id, p.user_id)) + '</b><br><span class="muted">Pagou: ' + BRL(p.indivPaid + p.sharedPaid) + ' • Responsabilidade: ' + BRL(respOfPeriod(me, p.user_id, r)) + '</span></p>';
      }).join('');
      s += eng.debt ? '<p>⚖️ Pendente: <b>' + esc(firstShort(me, eng.debt.from)) + ' deve ' + BRL(eng.debt.amount) + ' para ' + esc(firstShort(me, eng.debt.to)) + '</b></p>' : '<p class="muted">Sem acerto pendente. ✅</p>';
      var hist = J.DB.listSettlements(me.id).filter(function (x) { return x.date.slice(0, 7) >= r.from && x.date.slice(0, 7) <= r.to; });
      var tot = Math.round(hist.reduce(function (a, x) { return a + x.amount; }, 0) * 100) / 100;
      s += '<p>Acertos realizados no período: <b>' + BRL(tot) + '</b></p>' + hist.slice(0, 10).map(function (x) {
        return '<p>' + dueLabel(x.date) + ' • ' + esc(J.DB.userName(me.id, x.from_user_id).replace(' (você)', '')) + ' → ' + esc(J.DB.userName(me.id, x.to_user_id).replace(' (você)', '')) + ' — <b>' + BRL(x.amount) + '</b>' + (x.notes ? ' <span class="muted">' + esc(x.notes) + '</span>' : '') + '</p>';
      }).join('');
      return s;
    });
    // evolução 12m
    if (repShow('summary')) html += rsec('Evolução de 12 meses', function () {
      var months = [];
      (function () { var c = r.to; for (var i = 0; i < 12; i++) { months.unshift(c); c = J.DB.shiftMonth(c, -1); } })();
      var rows = months.map(function (ym) {
        var dd = J.DB.dashboardCalc(me.id, { from: ym, to: ym, vision: rep.vision });
        return { m: ym, inc: dd.income, exp: dd.expense, bal: dd.balance, has: (dd.incomeCount + dd.expenseCount) > 0 };
      }).filter(function (e) { return e.has; });
      if (!rows.length) return '<p class="muted">Sem dados.</p>';
      var max = Math.max.apply(null, rows.map(function (e) { return Math.max(e.inc, e.exp, 0.01); }));
      return '<div class="vbars" role="img" aria-label="Evolução de receitas e despesas">' + rows.map(function (e) {
        return '<div class="vbar"><span>' + BRL(e.inc) + '</span><div style="height:' + Math.max(4, Math.round(e.inc / max * 80)) + 'px;background:var(--green)"></div><div style="height:' + Math.max(4, Math.round(e.exp / max * 80)) + 'px;background:var(--primary-d)"></div><small>' + e.m.slice(5) + '/' + e.m.slice(2, 4) + '<br>' + BRL(e.exp) + '</small></div>';
      }).join('') + '</div><p class="muted">Verde = receitas • vermelho = despesas. Há dados para ' + rows.length + (rows.length === 1 ? ' mês.' : ' meses.') + '</p>' +
        rows.map(function (e) { return '<p>' + esc(monthLabel(e.m)) + ': +' + BRL(e.inc) + ' −' + BRL(e.exp) + ' = <b>' + BRL(e.bal) + '</b></p>'; }).join('');
    });
    // comparação atual x anterior (ano x anterior, 3m x anteriores)
    if (repShow('summary')) html += rsec('Comparação de períodos', function () {
      var c = J.DB.generateComparisonReport(me.id, repOpt(r, F));
      function row(label, cur, d) {
        return '<p>' + label + ': ' + BRL(cur) + ' → anterior ' + BRL(d.previousValue) + ' • diferença <b>' + BRL(d.absoluteDifference) + '</b>' + (d.percentageDifference == null ? '' : ' (' + fmtPct(d.percentageDifference) + ')') + '</p>';
      }
      return row('Receitas', c.current.totalIncome, c.comparison.income) + row('Despesas', c.current.totalExpenses, c.comparison.expenses) + row('Resultado', c.current.financialResult, c.comparison.result);
    });
    // análise de gastos: maiores, frequência, merchants
    if (repShow('cats')) html += rsec('Análise de gastos', function () {
      var c = J.DB.generateCategoryReport(me.id, repOpt(r, F));
      var s = '<p class="muted">MAIORES DESPESAS</p>' + ((c.largest || []).slice(0, 8).map(function (t) {
        return '<p>' + esc(t.description) + ' — <b>' + BRL(t.amount) + '</b> <span class="muted">' + esc(t.date) + ' • ' + esc(t.categoryName || '') + '</span></p>';
      }).join('') || '<p class="muted">Sem dados.</p>');
      if (c.frequency) s += '<p class="muted">FREQUÊNCIA</p><p>' + c.frequency.count + ' transações • média <b>' + BRL(c.frequency.avg) + '</b>' + (c.frequency.median != null ? ' • mediana ' + BRL(c.frequency.median) : '') + '</p>';
      if (c.merchants && c.merchants.length) s += '<p class="muted">ESTABELECIMENTOS</p>' + c.merchants.slice(0, 8).map(function (m) {
        return '<p>' + esc(m.name) + ' — <b>' + BRL(m.total) + '</b> <span class="muted">' + m.count + 'x</span></p>';
      }).join('');
      return s;
    });
    // recorrências: configurada vs paga
    if (repShow('commit')) html += rsec('Recorrências', function () {
      var c = J.DB.generateRecurringReport(me.id, repOpt(r, F));
      return c.items.slice(0, 15).map(function (x) {
        return '<p><b>' + esc(x.description) + '</b> <span class="muted">' + esc(x.frequency) + (x.active ? '' : ' • inativa') + '</span><br>Valor ' + BRL(x.amount) + ' • realizado no período <b>' + BRL(x.realizedInPeriod) + '</b> • pendente <b>' + BRL(x.pendingInPeriod) + '</b>' + (x.next ? ' • próxima ' + dueLabel(x.next.due_date) : '') + '</p>';
      }).join('') || '<p class="muted">Nenhuma recorrência.</p>';
    });
    // compromissos futuros consolidados
    if (repShow('commit')) html += rsec('Compromissos futuros', function () {
      var c = J.DB.generateCommitmentReport(me.id, repOpt(r, F));
      var s = '<p>Total comprometido: <b>' + BRL(c.total) + '</b> <span class="muted">(' + c.count + ' itens)</span></p>';
      s += Object.keys(c.byMonth).sort().map(function (m) { return '<p>' + esc(monthLabel(m)) + ': <b>' + BRL(c.byMonth[m]) + '</b></p>'; }).join('');
      s += '<p class="muted">Por tipo: ' + Object.keys(c.byKind).map(function (k) { return k + ' ' + BRL(c.byKind[k]); }).join(' • ') + '</p>';
      return s + c.items.slice(0, 15).map(function (i) { return '<p>' + dueLabel(i.date) + ' • ' + esc(i.label) + ' — <b>' + BRL(i.amount) + '</b></p>'; }).join('');
    });
    // planejamento + planejado x realizado + cenários
    if (repShow('plan')) html += rsec('Planejamento', function () {
      var c = J.DB.generatePlanningReport(me.id, repOpt(r, F));
      if (!c.plans.length) return '<p class="muted">Nenhum planejamento disponível.</p><p><a href="#/planning">Ver planejamento ›</a></p>';
      return c.plans.map(function (p) {
        if (p.error) return '<p><b>' + esc(p.name) + '</b> <span class="muted">não foi possível calcular.</span></p>';
        return '<p><b>' + esc(p.name) + '</b> <span class="muted">' + esc(p.status) + '</span><br>Receitas planejadas ' + BRL(p.income) + ' • saídas ' + BRL(p.outflows) + ' • saldo projetado <b>' + BRL(p.ending) + '</b></p>' +
          p.months.map(function (m) { return '<p class="muted">' + esc(monthLabel(m.ym)) + ': plan. ' + BRL(m.income) + '/' + BRL(m.outflows) + ' • real ' + BRL(m.realized) + ' • dif. ' + BRL(m.dIncome) + '/' + BRL(m.dExpense) + '</p>'; }).join('');
      }).join('') + '<p><a href="#/planning">Ver planejamento ›</a></p>';
    });
    if (repShow('plan')) html += rsec('Cenários', function () {
      var c = J.DB.generateScenarioReport(me.id, repOpt(r, F));
      if (!c.scenarios.length) return '<p class="muted">Nenhum cenário no período.</p>';
      return c.scenarios.map(function (s) {
        return '<p><b>' + esc(s.scenario) + '</b> <span class="muted">' + esc(s.plan + ' • ' + s.type) + '</span><br>Receitas ' + BRL(s.income) + ' • saídas ' + BRL(s.outflows) + ' • projetado <b>' + BRL(s.ending) + '</b></p>';
      }).join('') + '<p class="muted">Diferenças objetivas, sem “melhor cenário”.</p>';
    });
    // reconciliação (P19 + 19.1)
    if (repShow('rec')) html += rsec('Reconciliação', function () {
      var c = J.DB.generateReconciliationReport(me.id, repOpt(r, F));
      var s = '<p>Importados: <b>' + c.counts.imported + '</b> • reconciliados <b>' + c.counts.reconciled + '</b> • novos <b>' + c.counts.new + '</b> • duplicados <b>' + c.counts.duplicates + '</b> • ignorados <b>' + c.counts.ignored + '</b> • pendentes <b>' + c.counts.pending + '</b></p>';
      return s + (c.batches.map(function (b) {
        return '<p><b>' + esc(b.file) + '</b> <span class="muted">' + (b.type === 'card' ? 'fatura de cartão' : 'extrato') + ' • ' + esc(b.status) + ' • ' + esc(b.created) + '</span> <a href="#/imports/' + b.id + '">abrir ›</a></p>';
      }).join('') || '<p class="muted">Nenhuma importação no período.</p>');
    });
    // insights + notificações operacionais
    if (repShow('extra')) html += rsec('Insights no período', function () {
      var c = J.DB.generateInsightReport(me.id, repOpt(r, F));
      return (c.items.slice(0, 15).map(function (i) {
        return '<p><b>' + esc(i.title) + '</b> <span class="muted">' + esc(i.severity + ' • ' + i.status) + '</span></p>';
      }).join('') || '<p class="muted">Nenhum insight no período.</p>') + '<p><a href="#/insights">Ver insights ›</a></p>';
    });
    if (repShow('extra')) html += rsec('Notificações no período', function () {
      var c = J.DB.generateNotificationReport(me.id, repOpt(r, F));
      return '<p>Total geradas: <b>' + c.total + '</b></p>' + Object.keys(c.byStatus).map(function (k) { return '<p>' + esc(k) + ': <b>' + c.byStatus[k] + '</b></p>'; }).join('') + '<p class="muted">Métricas operacionais, não indicadores financeiros.</p>';
    });

    v.innerHTML = html;
    bindRepChrome(v, me, r);
  }
  function bindRepChrome(v, me, r) {
    function b(id, fn) { var el = document.getElementById(id); if (el) el.onchange = fn; }
    bindCatExp(v);
    b('r-preset', function (e) { rep.preset = e.target.value; render('reports'); });
    b('r-cf', function (e) { rep.cFrom = e.target.value; if (rep.cFrom && rep.cTo) render('reports'); });
    b('r-ct', function (e) { rep.cTo = e.target.value; if (rep.cFrom && rep.cTo) render('reports'); });
    b('r-vis', function (e) { rep.vision = e.target.value; render('reports'); });
    b('r-cat', function (e) { rep.category = e.target.value; rep.subcategory = ''; render('reports'); });
    b('r-catsub', function (e) { rep.subcategory = e.target.value; render('reports'); });
    b('r-type', function (e) { rep.type = e.target.value; render('reports'); });
    b('r-acc', function (e) { rep.account = e.target.value; render('reports'); });
    b('r-card', function (e) { rep.card = e.target.value; render('reports'); });
    b('r-evo', function (e) { rep.catEvo = e.target.value; render('reports'); });
    var q = document.getElementById('r-q'); if (q) q.oninput = function (e) { rep.search = e.target.value; rep.shown = 30; renderTxTable(v, me, r); };
    var mr = document.getElementById('r-more'); if (mr) mr.onclick = function () { rep.shown += 30; render('reports'); };
    var pr = document.getElementById('r-print'); if (pr) pr.onclick = function () { window.print(); };
    var cs = document.getElementById('r-csv'); if (cs) cs.onclick = function () { var w = document.getElementById('r-csvrow'); if (w) w.style.display = w.style.display === 'none' ? '' : 'none'; };
    var dl = document.getElementById('r-dl'); if (dl) dl.onclick = function () { downloadReportCsv(me, document.getElementById('r-kind').value, r); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-rtab]'), function (x) { x.onclick = function () { rep.tab = x.dataset.rtab; render('reports'); }; });
    var sv = document.getElementById('r-save'); if (sv) sv.onclick = function () {
      var msg = document.getElementById('r-savemsg');
      try {
        var s = J.DB.createSavedReport(me.id, { name: document.getElementById('r-svname').value, report_type: rep.tab === 'all' ? 'summary' : ({ summary: 'summary', flow: 'income_expense', cats: 'category', accounts: 'account', cards: 'invoice', commit: 'commitment', budget: 'budget', goals: 'goal', plan: 'planning', couple: 'participation', rec: 'reconciliation', extra: 'insight' }[rep.tab] || 'summary'), filters: repOpt(r, repFilter()) });
        rep.savedName = '';
        toast('Relatório salvo!');
        render('reports');
      } catch (e) { if (msg) msg.innerHTML = err(e); }
    };
    var sn = document.getElementById('r-svname'); if (sn) sn.oninput = function (e) { rep.savedName = e.target.value; };
    var sl = document.getElementById('r-saved'); if (sl) sl.onchange = function (e) {
      if (!e.target.value) return;
      try {
        var s = J.DB.getSavedReport(me.id, e.target.value);
        rep.preset = s.filters.preset === 'custom' ? 'custom' : (['month', 'prev', 'last3', 'last6', 'last12'].indexOf(s.filters.preset) >= 0 ? s.filters.preset : 'custom');
        rep.month = s.filters.month || rep.month; rep.cFrom = s.filters.cFrom || ''; rep.cTo = s.filters.cTo || '';
        rep.vision = s.filters.vision || 'couple'; rep.category = s.filters.category_id || ''; rep.subcategory = ''; rep.account = s.filters.account_id || ''; rep.card = s.filters.credit_card_id || '';
        render('reports');
      } catch (e2) { toast('Não foi possível carregar. Tente de novo.'); }
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-rep-retry]'), function (x) { x.onclick = function () { render('reports'); }; });
  }
  function downloadReportCsv(me, kind, r) {
    try {
      var f;
      if (String(kind).indexOf('rep-') === 0) {
        f = J.DB.exportReport(me.id, String(kind).slice(4), { filters: repOpt(r, repFilter()) });
      } else {
        f = J.DB.buildCsv(me.id, kind, { from: r.from, to: r.to });
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([f.csv], { type: 'text/csv;charset=utf-8' }));
      a.download = f.filename; a.click();
      toast('CSV baixado! 📥');
    } catch (e) { toast('Não foi possível exportar. Tente de novo.'); }
  }
  function renderTxTable(v, me, r) {
    // re-render leve da tabela de busca sem perder o foco
    var host = v.querySelector('#r-txhost');
    if (!host) { render('reports'); return; }
    var rows = J.DB.listTx(me.id, { from: r.from, to: r.to, search: rep.search || undefined });
    var shown = rows.slice(0, rep.shown);
    host.innerHTML = shown.map(function (t) { return txRow(me, t); }).join('') || '<p class="muted">Nada encontrado.</p>';
    host.innerHTML += rows.length > rep.shown ? '<button class="btn ghost" id="r-more">Mostrar mais (' + (rows.length - rep.shown) + ')</button>' : '';
    Array.prototype.forEach.call(host.querySelectorAll('.tx'), function (x) { x.onclick = function () { openTxDetail(me, x.dataset.id); }; });
    var mr = document.getElementById('r-more'); if (mr) mr.onclick = function () { rep.shown += 30; render('reports'); };
  }
  /* ============ PROMPT 8 (V2): CONTAS ============ */
  var accF = { owner: '', type: '', status: 'active' };
  function accTypeIcon(t) { var m = { checking: '🏦', savings: '🐷', cash: '💵', investment: '📈', other: '💼' }; return m[t] || '💼'; }
  function accOwnerLabel(me, a) {
    if (a.owner_type === 'joint') return 'Casal';
    return J.DB.userName(me.id, a.owner_user_id).replace(' (você)', '');
  }
  function cardOptions(me, selected, currentId) {
    var list = J.DB.listCards(me.id, 'active');
    var html = list.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('');
    if (currentId && !list.some(function (c) { return c.id === currentId; })) {
      html += '<option value="' + currentId + '" selected>' + esc(J.DB.cardName(me.id, currentId)) + ' (desativado)</option>';
    }
    return html;
  }
  function accountOptions(me, selected, currentId) {
    var list = J.DB.listAccounts(me.id, 'active');
    var html = '<option value="">Sem conta</option>' + list.map(function (a) {
      return '<option value="' + a.id + '"' + (a.id === selected ? ' selected' : '') + '>' + esc(a.name) + '</option>';
    }).join('');
    if (currentId && !list.some(function (a) { return a.id === currentId; })) {
      html += '<option value="' + currentId + '" selected>' + esc(J.DB.accountName(me.id, currentId)) + ' (desativada)</option>';
    }
    return html;
  }
  function pAccounts(v, me) {
    var all = J.DB.listAccounts(me.id, 'all');
    var s = J.DB.calculateAccountsSummary(me.id);
    var members = J.DB.memberIds(me.id);
    var html = '<div class="card"><h1>Contas</h1><p class="muted">Onde está o dinheiro do casal</p>';
    html += '<div class="card hero" style="margin:8px 0"><span class="muted">Dinheiro registrado</span><h1>' + BRL(s.totalBalance) + '</h1><p class="muted">' +
      members.map(function (u) { return esc(firstShort(me, u)) + ' ' + BRL(s.individual[u] || 0); }).join(' • ') +
      ' • Casal ' + BRL(s.jointBalance) + '</p><p class="muted">Valores por propriedade. Não entram no cálculo de acertos.</p></div>';
    html += '<div class="row"><select id="af-o" aria-label="Proprietário"><option value="">Todos</option>' +
      members.map(function (u) { return '<option value="' + u + '"' + (accF.owner === u ? ' selected' : '') + '>' + esc(J.DB.userName(me.id, u).replace(' (você)', '')) + '</option>'; }).join('') +
      '<option value="joint"' + (accF.owner === 'joint' ? ' selected' : '') + '>Casal</option></select>';
    html += '<select id="af-t" aria-label="Tipo"><option value="">Todos os tipos</option>' + J.DB.accountTypes().map(function (t) {
      return '<option value="' + t.id + '"' + (accF.type === t.id ? ' selected' : '') + '>' + t.label + '</option>';
    }).join('') + '</select>';
    html += '<select id="af-s" aria-label="Status"><option value="active"' + (accF.status === 'active' ? ' selected' : '') + '>Ativas</option><option value="inactive"' + (accF.status === 'inactive' ? ' selected' : '') + '>Inativas</option><option value="all"' + (accF.status === 'all' ? ' selected' : '') + '>Todas</option></select></div>';
    html += '<button class="btn" id="ac-new">+ Nova conta</button><button class="btn ghost" id="ac-tr" style="margin-top:8px">⇄ Transferir dinheiro</button></div><div id="e"></div>';
    var rows = all.filter(function (a) {
      if (accF.status === 'active' && !a.active) return false;
      if (accF.status === 'inactive' && a.active) return false;
      if (accF.type && a.type !== accF.type) return false;
      if (accF.owner === 'joint' && a.owner_type !== 'joint') return false;
      if (accF.owner && accF.owner !== 'joint' && !(a.owner_type === 'individual' && a.owner_user_id === accF.owner)) return false;
      return true;
    });
    if (!all.length) {
      html += '<div class="card empty"><div class="ico">🏦</div><h2>Onde está o dinheiro?</h2><p class="muted">Cadastre suas contas para acompanhar quanto dinheiro vocês têm e de onde ele está.</p><button class="btn" id="ac-first">+ Adicionar primeira conta</button></div>';
    } else if (!rows.length) {
      html += '<div class="card empty"><div class="ico">🔍</div><h2>Nada por aqui</h2><p class="muted">Ajuste os filtros.</p></div>';
    } else {
      html += rows.map(function (a) {
        var bal = J.DB.calculateAccountBalance(me.id, a.id);
        return '<a class="card dash-link" href="#/accounts/' + a.id + '"><div class="row between"><b>' + accTypeIcon(a.type) + ' ' + esc(a.name) + '</b>' + (a.active ? '<span class="pill ok">Ativa</span>' : '<span class="pill">Inativa</span>') + '</div>' +
          '<p class="muted">' + esc(J.DB.accountTypeLabel(a.type)) + ' • ' + esc(accOwnerLabel(me, a)) + '</p><h2 class="' + (bal < 0 ? 'neg' : '') + '">' + BRL(bal) + '</h2></a>';
      }).join('');
    }
    v.innerHTML = html;
    document.getElementById('af-o').onchange = function (e) { accF.owner = e.target.value; render('accounts'); };
    document.getElementById('af-t').onchange = function (e) { accF.type = e.target.value; render('accounts'); };
    document.getElementById('af-s').onchange = function (e) { accF.status = e.target.value; render('accounts'); };
    var n0 = document.getElementById('ac-new'); if (n0) n0.onclick = function () { openAccountModal(me, null); };
    var n1 = document.getElementById('ac-first'); if (n1) n1.onclick = function () { openAccountModal(me, null); };
    var tr = document.getElementById('ac-tr'); if (tr) tr.onclick = function () { openTransferModal(me, null, null); };
  }
  function pAccountDetail(v, me, accountId) {
    var a;
    try { a = J.DB.getAccount(me.id, accountId); } catch (e) { v.innerHTML = err(e) + '<a class="btn ghost" style="text-decoration:none;text-align:center" href="#/accounts">Voltar</a>'; return; }
    var bal = J.DB.calculateAccountBalance(me.id, accountId);
    var movs = J.DB.listTx(me.id, { account_id: accountId });
    var html = '<div class="card"><p><a href="#/accounts">‹ Contas</a></p><div class="row between"><h1 style="margin:0">' + accTypeIcon(a.type) + ' ' + esc(a.name) + '</h1>' + (a.active ? '<span class="pill ok">Ativa</span>' : '<span class="pill">Inativa</span>') + '</div>' +
      '<p class="muted">' + esc(J.DB.accountTypeLabel(a.type)) + ' • ' + esc(accOwnerLabel(me, a)) + '</p>' +
      '<p class="muted">Saldo atual</p><h1>' + BRL(bal) + '</h1>' +
      '<p class="muted">Saldo inicial: ' + BRL(a.initial_balance) + ' • Criada em ' + esc(dmy(a.created_at)) + (a.notes ? '<br>📝 ' + esc(a.notes) : '') + '</p>' +
      '<div class="row"><button class="btn ghost" id="ac-ed">Editar</button>' +
      (a.active ? '<button class="btn ghost" id="ac-d">Desativar</button>' : '<button class="btn ghost" id="ac-r">Reativar</button>') + '</div><div id="e"></div></div>';
    var trs = J.DB.listTransfers(me.id, accountId);
    var invPays = J.DB.listInvoicePayments(me.id, { account_id: accountId });
    if (trs.length) {
      html += '<div class="card"><b>Transferências</b>' + trs.map(function (x) {
        var out = x.from_account_id === accountId;
        return '<button class="tx" data-tr="' + x.id + '"><span class="tx-ic">⇄</span>' +
          '<span class="tx-mid"><b>' + (out ? 'Transferência para ' + esc(J.DB.accountName(me.id, x.to_account_id)) : 'Transferência recebida de ' + esc(J.DB.accountName(me.id, x.from_account_id))) + '</b><small>' + dueLabel(x.date) + (x.description ? ' • ' + esc(x.description) : '') + '</small></span>' +
          '<b class="' + (out ? 'neg' : 'pos') + '">' + (out ? '−' : '+') + ' ' + BRL(x.amount) + '</b></button>';
      }).join('') + '</div>';
    }
    if (invPays.length) {
      html += '<div class="card"><b>Pagamentos de fatura</b>' + invPays.map(function (p) {
        var cn = '';
        try { cn = J.DB.cardName(me.id, J.DB.getInvoiceRaw(me.id, p.invoice_id).credit_card_id); } catch (e3) { cn = 'Cartão'; }
        return '<p>🧾 Pagamento de fatura • ' + esc(cn) + ' — <b class="neg">−' + BRL(p.amount) + '</b> <span class="muted">' + dueLabel(p.payment_date) + '</span></p>';
      }).join('') + '</div>';
    }
    html += '<div class="card"><b>Movimentações (' + movs.length + ')</b>' + (movs.length ? movs.slice(0, 30).map(function (t) { return txRow(me, t); }).join('') + (movs.length > 30 ? '<p class="muted">Mostrando as 30 mais recentes.</p>' : '') : '<p class="muted">Nenhuma transação vinculada a esta conta.</p>') + '</div>';
    v.innerHTML = html;
    document.getElementById('ac-ed').onclick = function () { openAccountModal(me, accountId); };
    var dd = document.getElementById('ac-d');
    if (dd) dd.onclick = function () { if (!confirm('Desativar esta conta? Ela mantém o histórico e não aceitará novas transações.')) return; try { J.DB.setAccountActive(me.id, accountId, false); toast('Conta desativada.'); render('accounts/' + accountId); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    var rr = document.getElementById('ac-r');
    if (rr) rr.onclick = function () { try { J.DB.setAccountActive(me.id, accountId, true); toast('Conta reativada!'); render('accounts/' + accountId); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    Array.prototype.forEach.call(v.querySelectorAll('[data-tr]'), function (b) { b.onclick = function () { openTransferDetail(me, b.dataset.tr); }; });
    Array.prototype.forEach.call(v.querySelectorAll('.tx[data-id]'), function (b) { b.onclick = function () { openTxDetail(me, b.dataset.id); }; });
  }
  function openAccountModal(me, accountId) {
    var a = accountId ? J.DB.getAccount(me.id, accountId) : null;
    var peopleOpts = J.DB.memberIds(me.id).map(function (u) {
      var sel = (!!a && a.owner_type === 'individual' && a.owner_user_id === u.id) || (!a && u.id === me.id);
      return '<option value="' + u.id + '"' + (sel ? ' selected' : '') + '>' + esc(J.DB.userName(me.id, u).replace(' (você)', '')) + '</option>';
    }).join('');
    modalShell('<h2>' + (a ? 'Editar conta' : 'Nova conta') + '</h2><div id="me"></div>' +
      '<label>Nome *</label><input id="f-an" maxlength="60" value="' + esc(a ? a.name : '') + '" placeholder="Ex: Nubank">' +
      '<label>Tipo *</label><select id="f-at">' + J.DB.accountTypes().map(function (t) {
        return '<option value="' + t.id + '"' + (a && a.type === t.id ? ' selected' : '') + '>' + t.icon + ' ' + t.label + '</option>';
      }).join('') + '</select>' +
      '<label>Pertence a *</label><select id="f-ao"><option value="joint"' + (a && a.owner_type === 'joint' ? ' selected' : '') + '>Casal</option>' + peopleOpts + '</select>' +
      '<label>Saldo inicial (R$) *</label><input id="f-av" inputmode="decimal" placeholder="5.000,00" value="' + (a ? String(a.initial_balance).replace('.', ',') : '') + '">' +
      (a && J.DB.accountHasTx(me.id, accountId) ? '<p class="muted">🔒 Conta com movimentações: o saldo inicial não pode ser alterado.</p>' : '') +
      '<label>Observações</label><input id="f-an2" maxlength="500" value="' + esc(a ? a.notes : '') + '" placeholder="Opcional">' +
      '<button class="btn" id="sv">' + (a ? 'Salvar' : 'Criar conta') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var ow = document.getElementById('f-ao').value;
        var data = { name: document.getElementById('f-an').value, type: document.getElementById('f-at').value, owner_type: ow === 'joint' ? 'joint' : 'individual', owner_user_id: ow === 'joint' ? null : ow, initial_balance: document.getElementById('f-av').value, notes: document.getElementById('f-an2').value };
        var back = here();
        if (a) J.DB.updateAccount(me.id, accountId, data); else J.DB.createAccount(me.id, data);
        closeModal(); toast(a ? 'Conta atualizada!' : 'Conta criada! 🏦');
        render(back.indexOf('accounts') === 0 ? back : 'accounts');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openTransferModal(me, presetFrom, editingId) {
    var act = J.DB.listAccounts(me.id, 'active');
    if (act.length < 2) {
      modalShell('<h2>Transferir dinheiro</h2><p class="muted">Você precisa de pelo menos duas contas ativas para transferir.</p><button class="btn" id="cl">Entendi</button>');
      document.getElementById('cl').onclick = closeModal;
      return;
    }
    var t = editingId ? J.DB.getTransfer(me.id, editingId) : null;
    var from = t ? t.from_account_id : (presetFrom || act[0].id);
    var to = t ? t.to_account_id : (act.find(function (a) { return a.id !== from; }) || act[1] || act[0]).id;
    function opts(sel) {
      return act.map(function (a) { return '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + esc(a.name) + ' (' + BRL(J.DB.calculateAccountBalance(me.id, a.id)) + ')</option>'; }).join('');
    }
    modalShell('<h2>' + (t ? 'Editar transferência' : 'Transferir dinheiro') + '</h2><div id="me"></div>' +
      '<label>Conta de origem *</label><select id="f-tf">' + opts(from) + '</select>' +
      '<label>Conta de destino *</label><select id="f-tt">' + opts(to) + '</select>' +
      '<div class="row"><div><label>Valor (R$) *</label><input id="f-tv" inputmode="decimal" value="' + (t ? String(t.amount).replace('.', ',') : '') + '"></div><div><label>Data *</label><input id="f-td" type="date" value="' + esc(t ? t.date : today()) + '"></div></div>' +
      '<label>Descrição</label><input id="f-tn" maxlength="120" value="' + esc(t ? t.description : '') + '" placeholder="Ex: Dinheiro para despesas do mês">' +
      '<button class="btn" id="sv">' + (t ? 'Salvar' : 'Transferir') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var data = { from_account_id: document.getElementById('f-tf').value, to_account_id: document.getElementById('f-tt').value, amount: document.getElementById('f-tv').value, date: document.getElementById('f-td').value, description: document.getElementById('f-tn').value };
        var back = here();
        if (t) J.DB.updateTransfer(me.id, t.id, data); else J.DB.createTransfer(me.id, data);
        closeModal(); toast(t ? 'Transferência atualizada!' : 'Transferência feita! ⇄');
        render(back.indexOf('accounts') === 0 ? back : 'accounts');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openTransferDetail(me, transferId) {
    var t;
    try { t = J.DB.getTransfer(me.id, transferId); } catch (e) { toast('Transferência não encontrada.'); return; }
    modalShell('<span class="pill">⇄ Transferência</span><h1>' + BRL(t.amount) + '</h1>' +
      '<p><b>' + esc(J.DB.accountName(me.id, t.from_account_id)) + '</b><br>↓<br><b>' + esc(J.DB.accountName(me.id, t.to_account_id)) + '</b></p>' +
      '<p class="muted">' + dueLabel(t.date) + (t.description ? '<br>📝 ' + esc(t.description) : '') + '<br>Criada por ' + esc(J.DB.userName(me.id, t.created_by)) + ' em ' + esc(dmy(t.created_at)) + '</p><div id="me"></div>' +
      '<div class="row"><button class="btn ghost" id="ed">Editar</button><button class="btn ghost" id="del" style="color:var(--primary-d)">Excluir</button></div><button class="btn" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('ed').onclick = function () { openTransferModal(me, null, transferId); };
    document.getElementById('del').onclick = function () {
      if (!confirm('Excluir esta transferência? Os saldos voltarão ao estado anterior.')) return;
      try { J.DB.deleteTransfer(me.id, transferId); closeModal(); toast('Transferência excluída.'); render(here()); }
      catch (e2) { document.getElementById('me').innerHTML = err(e2); }
    };
  }
  /* ============ PROMPT 10 (V2): CARTÕES ============ */
  function cardOwnerLabel(me, c) {
    if (c.owner_type === 'joint') return 'Casal';
    return J.DB.userName(me.id, c.owner_user_id).replace(' (você)', '');
  }
  function cardHead(c) {
    return esc(c.name) + '<br><span class="muted">' + esc(c.brand) + (c.last_four_digits ? ' •••• ' + esc(c.last_four_digits) : '') + '</span>';
  }
  function pCards(v, me) {
    var all = J.DB.listCards(me.id, 'all');
    var s = J.DB.cardsSummary(me.id);
    var html = '<div class="card"><h1>Cartões</h1><p class="muted">Acompanhe seus limites e compromissos no cartão</p>';
    if (s.activeCards) {
      html += '<div class="card hero" style="margin:8px 0"><span class="muted">Limite total</span><h1>' + BRL(s.totalLimit) + '</h1><p class="muted">Utilizado <b class="neg">' + BRL(s.totalUsed) + '</b> • Disponível <b>' + BRL(s.totalAvailable) + '</b>' + (s.anyExceeded ? '<br>🚨 Há cartão com limite excedido' : '') + '<br>Limite não é dinheiro em conta.</p></div>';
    }
    html += '<button class="btn" id="cc-new">+ Novo cartão</button></div><div id="e"></div>';
    if (!all.length) {
      html += '<div class="card empty"><div class="ico">💳</div><h2>Nenhum cartão</h2><p class="muted">Cadastre o cartão para acompanhar limite e compras.</p></div>';
    } else {
      html += all.filter(function (c) { return c.active; }).map(function (c) { return cardLink(me, c); }).join('');
      var ina = all.filter(function (c) { return !c.active; });
      if (ina.length) html += '<details class="card"><summary><b>Inativos (' + ina.length + ')</b></summary>' + ina.map(function (c) { return cardLink(me, c); }).join('') + '</details>';
    }
    v.innerHTML = html;
    document.getElementById('cc-new').onclick = function () { openCardModal(me, null); };
  }
  function cardLink(me, c) {
    var u = J.DB.calculateCardAvailableLimit(me.id, c.id);
    return '<a class="card dash-link" href="#/cards/' + c.id + '"><div class="row between"><b>💳 ' + cardHead(c) + '</b>' + (c.active ? '<span class="pill ok">Ativo</span>' : '<span class="pill">Inativo</span>') + '</div>' +
      '<p class="muted">' + esc(cardOwnerLabel(me, c)) + ' • Fecha dia ' + c.closing_day + ' • Vence dia ' + c.due_day + '</p>' +
      '<p>Limite <b>' + BRL(u.limit) + '</b> • Utilizado <b class="neg">' + BRL(u.used) + '</b> • Disponível <b>' + BRL(u.available) + '</b>' + (u.exceeded ? ' <span class="pill over">🚨 Limite excedido</span>' : '') + '</p></a>';
  }
  function pCardDetail(v, me, cardId) {
    var c;
    try { c = J.DB.getCard(me.id, cardId); } catch (e) { v.innerHTML = err(e) + '<a class="btn ghost" style="text-decoration:none;text-align:center" href="#/cards">Voltar</a>'; return; }
    var u = J.DB.calculateCardAvailableLimit(me.id, cardId);
    var movs = J.DB.listTx(me.id, { credit_card_id: cardId });
    var payName = c.payment_account_id ? J.DB.accountName(me.id, c.payment_account_id) : 'Não definida';
    var html = '<div class="card"><p><a href="#/cards">‹ Cartões</a></p><div class="row between"><h1 style="margin:0">💳 ' + esc(c.name) + '</h1>' + (c.active ? '<span class="pill ok">Ativo</span>' : '<span class="pill">Inativo</span>') + '</div>' +
      '<p class="muted">' + esc(c.brand) + (c.last_four_digits ? ' •••• ' + esc(c.last_four_digits) : '') + ' • ' + esc(cardOwnerLabel(me, c)) + '</p>' +
      '<p class="muted">Limite</p><h1>' + BRL(u.limit) + '</h1>' +
      '<p>Utilizado: <b class="neg">' + BRL(u.used) + '</b> • Disponível: <b>' + BRL(u.available) + '</b>' + (u.exceeded ? ' <span class="pill over">🚨 Limite excedido</span>' : '') + '</p>' +
      '<p class="muted">Fecha dia ' + c.closing_day + ' • Vence dia ' + c.due_day + '<br>Conta para pagamento: <b>' + esc(payName) + '</b>' + (c.notes ? '<br>📝 ' + esc(c.notes) : '') + '</p>' +
      '<div class="row"><button class="btn ghost" id="cc-ed">Editar</button>' +
      (c.active ? '<button class="btn ghost" id="cc-d">Desativar</button>' : '<button class="btn ghost" id="cc-r">Reativar</button>') + (c.active ? '<button class="btn ghost" id="cc-ip">💳 Comprar parcelado</button>' : '') + '</div><div id="e"></div></div>';
    html += '<div class="card"><b>Compras recentes (' + movs.length + ')</b>' + (movs.length ? movs.slice(0, 30).map(function (t) { return txRow(me, t); }).join('') + (movs.length > 30 ? '<p class="muted">Mostrando as 30 mais recentes.</p>' : '') : '<p class="muted">Nenhuma compra neste cartão.</p>') + '</div>';
    v.innerHTML = html;
    document.getElementById('cc-ed').onclick = function () { openCardModal(me, cardId); };
    var cip = document.getElementById('cc-ip');
    if (cip) cip.onclick = function () { openInstallmentModal(me, null, cardId); };
    var dd = document.getElementById('cc-d');
    if (dd) dd.onclick = function () { if (!confirm('Desativar este cartão? Ele mantém histórico e compras, mas não aceitará novas.')) return; try { J.DB.setCardActive(me.id, cardId, false); toast('Cartão desativado.'); render('cards/' + cardId); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    var rr = document.getElementById('cc-r');
    if (rr) rr.onclick = function () { try { J.DB.setCardActive(me.id, cardId, true); toast('Cartão reativado!'); render('cards/' + cardId); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    Array.prototype.forEach.call(v.querySelectorAll('.tx[data-id]'), function (b) { b.onclick = function () { openTxDetail(me, b.dataset.id); }; });
  }
  function openCardModal(me, cardId) {
    var c = cardId ? J.DB.getCard(me.id, cardId) : null;
    var peopleOpts = J.DB.memberIds(me.id).map(function (u) {
      var sel = (!!c && c.owner_type === 'individual' && c.owner_user_id === u.id) || (!c && u.id === me.id);
      return '<option value="' + u.id + '"' + (sel ? ' selected' : '') + '>' + esc(J.DB.userName(me.id, u).replace(' (você)', '')) + '</option>';
    }).join('');
    var payOpts = '<option value="">Nenhuma</option>' + J.DB.listAccounts(me.id, 'active').map(function (a) {
      return '<option value="' + a.id + '"' + (c && c.payment_account_id === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>';
    }).join('');
    modalShell('<h2>' + (c ? 'Editar cartão' : 'Novo cartão') + '</h2><div id="me"></div>' +
      '<label>Nome *</label><input id="f-cn" maxlength="60" value="' + esc(c ? c.name : '') + '" placeholder="Ex: Nubank">' +
      '<div class="row"><div><label>Bandeira</label><select id="f-cb">' + J.DB.cardBrands().map(function (b) { return '<option' + (c && c.brand === b ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select></div>' +
      '<div><label>Últimos 4 dígitos</label><input id="f-c4" inputmode="numeric" maxlength="4" value="' + esc(c ? c.last_four_digits : '') + '" placeholder="1234"></div></div>' +
      '<label>Pertence a *</label><select id="f-co"><option value="joint"' + (c && c.owner_type === 'joint' ? ' selected' : '') + '>Casal</option>' + peopleOpts + '</select>' +
      '<label>Limite (R$) *</label><input id="f-cl" inputmode="decimal" placeholder="5.000,00" value="' + (c ? String(c.credit_limit).replace('.', ',') : '') + '">' +
      '<div class="row"><div><label>Fechamento (dia) *</label><input id="f-cf" type="number" min="1" max="31" value="' + (c ? c.closing_day : '10') + '"></div><div><label>Vencimento (dia) *</label><input id="f-cd" type="number" min="1" max="31" value="' + (c ? c.due_day : '17') + '"></div></div>' +
      '<label>Conta para pagamento</label><select id="f-cp">' + payOpts + '</select>' +
      '<label>Observações</label><input id="f-cn2" maxlength="500" value="' + esc(c ? c.notes : '') + '" placeholder="Opcional">' +
      '<p class="muted">🔒 Guardamos só os 4 últimos dígitos. Nunca informe número completo, CVV ou senha.</p>' +
      '<button class="btn" id="sv">' + (c ? 'Salvar' : 'Criar cartão') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var ow = document.getElementById('f-co').value;
        var data = { name: document.getElementById('f-cn').value, brand: document.getElementById('f-cb').value, last_four_digits: document.getElementById('f-c4').value, owner_type: ow === 'joint' ? 'joint' : 'individual', owner_user_id: ow === 'joint' ? null : ow, credit_limit: document.getElementById('f-cl').value, closing_day: document.getElementById('f-cf').value, due_day: document.getElementById('f-cd').value, payment_account_id: document.getElementById('f-cp').value, notes: document.getElementById('f-cn2').value };
        var back = here();
        if (c) J.DB.updateCard(me.id, cardId, data); else J.DB.createCard(me.id, data);
        closeModal(); toast(c ? 'Cartão atualizado!' : 'Cartão criado! 💳');
        render(back.indexOf('cards') === 0 ? back : 'cards');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  /* ============ PROMPT 11 (V2): COMPRAS PARCELADAS ============ */
  var instF = { card: '', status: '', category: '' };
  function instStatusPill(p) {
    if (p.status === 'cancelled') return '<span class="pill over">✕ Cancelada</span>';
    if (p.status === 'completed') return '<span class="pill ok">✓ Concluída</span>';
    return '<span class="pill warn">⏳ Ativa</span>';
  }
  function pInstallments(v, me) {
    var rows = J.DB.listInstallmentPurchases(me.id, { card_id: instF.card || undefined, status: instF.status || undefined, category_id: instF.category || undefined });
    var cards = J.DB.listCards(me.id, 'all');
    var cats = J.DB.myCategories(me.id, 'expense');
    var html = '<div class="card"><h1>Compras parceladas</h1><p class="muted">Uma compra, várias parcelas. O total compromete o limite.</p><button class="btn" id="ip-new">+ Nova compra parcelada</button></div>';
    html += '<div class="card"><div class="row"><select id="if-c" aria-label="Cartão"><option value="">Todos os cartões</option>' + cards.map(function (c) {
      return '<option value="' + c.id + '"' + (instF.card === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('') + '</select>';
    html += '<select id="if-s" aria-label="Status"><option value="">Todos status</option><option value="active"' + (instF.status === 'active' ? ' selected' : '') + '>Ativas</option><option value="completed"' + (instF.status === 'completed' ? ' selected' : '') + '>Concluídas</option><option value="cancelled"' + (instF.status === 'cancelled' ? ' selected' : '') + '>Canceladas</option></select>';
    html += '<select id="if-g" aria-label="Categoria"><option value="">Todas categorias</option>' + J.DB.getCategoryTree(me.id, 'expense', false).map(function (p) {
      var self = '<option value="' + p.id + '"' + (instF.category === p.id ? ' selected' : '') + '>' + esc(p.icon + ' ' + p.name) + '</option>';
      if (!p.children.length) return self;
      return '<optgroup label="' + esc(p.icon + ' ' + p.name) + '">' + self + p.children.map(function (k) {
        return '<option value="' + k.id + '"' + (instF.category === k.id ? ' selected' : '') + '>' + esc(k.icon + ' ' + k.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('') + '</select></div></div><div id="e"></div>';
    if (!rows.length) {
      html += '<div class="card empty"><div class="ico">🗓️</div><h2>Nenhuma compra parcelada</h2><p class="muted">Registre um Notebook em 12x e acompanhe cada parcela.</p></div>';
    } else {
      html += rows.map(function (p) {
        var s = J.DB.purchaseSummary(me.id, p.id);
        return '<button class="tx" data-ip="' + p.id + '"><span class="tx-ic">🗓️</span>' +
          '<span class="tx-mid"><b>' + esc(p.description) + '</b><small>' + esc(J.DB.cardName(me.id, p.credit_card_id)) + ' • ' + p.installment_count + 'x • 1ª ' + dueLabel(p.first_installment_date) + (p.is_shared ? ' • 🤝' : ' • 👤') + '</small></span>' +
          '<span style="text-align:right"><b>' + BRL(p.total_amount) + '</b><br><small class="muted">' + s.pendingInstallments + ' pendentes</small></span></button>';
      }).join('');
    }
    v.innerHTML = html;
    document.getElementById('ip-new').onclick = function () { openInstallmentModal(me, null, null); };
    document.getElementById('if-c').onchange = function (e) { instF.card = e.target.value; render('installments'); };
    document.getElementById('if-s').onchange = function (e) { instF.status = e.target.value; render('installments'); };
    document.getElementById('if-g').onchange = function (e) { instF.category = e.target.value; render('installments'); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-ip]'), function (b) { b.onclick = function () { openInstallmentDetail(me, b.dataset.ip); }; });
  }
  function openInstallmentModal(me, editId, presetCard) {
    var p = editId ? J.DB.getInstallmentPurchase(me.id, editId) : null;
    var people = couplePeople(me);
    var cards = J.DB.listCards(me.id, 'active');
    if (!p && !cards.length) {
      modalShell('<h2>Compra parcelada</h2><p class="muted">Você precisa de um cartão ativo primeiro.</p><div class="row"><a class="btn" style="text-decoration:none;text-align:center" href="#/cards">Ir para cartões</a><button class="btn ghost" id="cl">Fechar</button></div>');
      document.getElementById('cl').onclick = closeModal;
      return;
    }
    var cardId = p ? p.credit_card_id : (presetCard || (cards[0] && cards[0].id) || '');
    var spMode = (p && p.split_mode) || '5050';
    var existing = (p && p.split_entries) || [];
    modalShell('<h2>' + (p ? 'Editar compra parcelada' : 'Nova compra parcelada') + '</h2><div id="me"></div>' +
      (p ? '<p class="muted"><b>' + BRL(p.total_amount) + '</b> em ' + p.installment_count + 'x no cartão <b>' + esc(J.DB.cardName(me.id, p.credit_card_id)) + '</b> • 1ª ' + dueLabel(p.first_installment_date) + '<br>Valor, parcelas, cartão e data inicial não mudam (cancele e recrie se precisar).</p>'
        : '<label>Descrição *</label><input id="f-id" maxlength="120" placeholder="Ex: Notebook">' +
        '<div class="row"><div><label>Valor total (R$) *</label><input id="f-it" inputmode="decimal" placeholder="3.600,00"></div><div><label>Parcelas *</label><input id="f-in" type="number" min="1" max="60" value="12"></div></div>' +
        '<label>Cartão *</label><select id="f-ic">' + cards.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cardId ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>' +
        '<label>Primeira parcela *</label><input id="f-if" type="date" value="' + today() + '">') +
      (p ? '<label>Descrição *</label><input id="f-id" maxlength="120" value="' + esc(p.description) + '">' : '') +
      '<label>Categoria *</label><select id="f-ig">' + catOptions(me, 'expense', p ? p.category_id : null) + '</select>' +
      '<label>Responsável *</label><select id="f-ip">' + payerOptions(me, p ? p.payer_user_id : me.id) + '</select>' +
      '<label class="check"><input type="checkbox" id="f-is"' + (!p || p.is_shared ? ' checked' : '') + '> 🤝 Compartilhada</label>' +
      '<div id="split-box"><label>Como dividir?</label><div class="seg" id="sp-seg"><button data-m="5050">50/50</button><button data-m="percent">%</button><button data-m="fixed">R$</button></div><div id="sp-body"></div><div id="sp-prev" class="muted"></div></div>' +
      '<label>Observações</label><input id="f-ino" maxlength="500" value="' + esc(p ? p.notes : '') + '" placeholder="Opcional">' +
      '<button class="btn" id="sv">' + (p ? 'Salvar' : 'Criar compra') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    function showSplit() { return document.getElementById('f-is').checked; }
    function collectSplit() {
      return { mode: spMode, entries: people.map(function (pp) {
        var el = document.getElementById('sp-' + pp.id);
        return spMode === 'fixed' ? { user_id: pp.id, amount: el ? el.value : '' } : { user_id: pp.id, pct: el ? el.value : '' };
      }) };
    }
    function paintSplit() {
      document.getElementById('split-box').style.display = showSplit() ? '' : 'none';
      if (!showSplit()) return;
      Array.prototype.forEach.call(document.querySelectorAll('#sp-seg button'), function (b) { b.className = b.dataset.m === spMode ? 'on' : ''; });
      if (spMode === '5050') { document.getElementById('sp-body').innerHTML = '<p class="muted">Metade para cada um.</p>'; paintPreview(); return; }
      document.getElementById('sp-body').innerHTML = people.map(function (pp) {
        var prev = existing.find(function (e) { return e.user_id === pp.id; }) || {};
        var val = spMode === 'percent' ? (prev.pct != null ? String(prev.pct).replace('.', ',') : '50') : (prev.amount != null ? String(prev.amount).replace('.', ',') : '');
        return '<div class="split-row"><span>' + esc(pp.nome.split(' ')[0]) + '</span><input id="sp-' + pp.id + '" value="' + esc(val) + '" inputmode="decimal"></div>';
      }).join('');
      Array.prototype.forEach.call(document.querySelectorAll('#sp-body input'), function (i) { i.oninput = paintPreview; });
      paintPreview();
    }
    function paintPreview() {
      var el = document.getElementById('sp-prev');
      if (p) { el.textContent = 'Divisão recalculada por parcela ao salvar.'; return; }
      try {
        var tot = J.DB.parseAmount(document.getElementById('f-it').value || '0');
        var n = parseInt(document.getElementById('f-in').value, 10) || 0;
        var amts = J.DB.buildInstallmentAmounts(tot, n);
        var dates = J.DB.calculateInstallmentDates(document.getElementById('f-if').value || today(), n);
        var same = amts.every(function (a) { return a === amts[0]; });
        el.innerHTML = 'Total <b>' + BRL(tot) + '</b> • ' + n + 'x de ' + (same ? '' : 'aproximadamente ') + '<b>' + BRL(amts[0]) + '</b>' +
          (same ? '' : ' (última pode variar centavos)') + '<br>1ª ' + dueLabel(dates[0]) + ' • última ' + dueLabel(dates[n - 1]);
      } catch (e2) { el.innerHTML = '<span style="color:var(--primary-d)">' + esc(e2.message) + '</span>'; }
    }
    document.getElementById('f-is').onchange = paintSplit;
    ['f-it', 'f-in', 'f-if'].forEach(function (id) { var el = document.getElementById(id); if (el) el.oninput = paintPreview; });
    Array.prototype.forEach.call(document.querySelectorAll('#sp-seg button'), function (b) { b.onclick = function () { spMode = b.dataset.m; paintSplit(); }; });
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var back = here();
        if (p) {
          J.DB.updateInstallmentPurchase(me.id, p.id, { description: document.getElementById('f-id').value, category_id: document.getElementById('f-ig').value, payer_user_id: document.getElementById('f-ip').value, is_shared: document.getElementById('f-is').checked, split: collectSplit(), notes: document.getElementById('f-ino').value });
          toast('Compra atualizada!');
        } else {
          J.DB.createInstallmentPurchase(me.id, { description: document.getElementById('f-id').value, total_amount: document.getElementById('f-it').value, count: document.getElementById('f-in').value, credit_card_id: document.getElementById('f-ic').value, first_installment_date: document.getElementById('f-if').value, category_id: document.getElementById('f-ig').value, payer_user_id: document.getElementById('f-ip').value, is_shared: document.getElementById('f-is').checked, split: collectSplit(), notes: document.getElementById('f-ino').value });
          toast('Compra parcelada criada! 🗓️');
        }
        closeModal(); render(back.indexOf('installments') === 0 || back === 'cards' ? back : 'installments');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
    paintSplit();
  }
  function openInstallmentDetail(me, purchaseId) {
    var p;
    try { p = J.DB.getInstallmentPurchase(me.id, purchaseId); } catch (e) { toast('Compra não encontrada.'); return; }
    var s = J.DB.purchaseSummary(me.id, purchaseId);
    var rows = J.DB.purchaseInstallments(me.id, purchaseId);
    function respLine(amountCents) {
      if (!p.is_shared) return '';
      try {
        return '<br>' + J.DB.installmentResponsibility(me.id, p, amountCents).map(function (r) {
          return esc(J.DB.userName(me.id, r.user_id).replace(' (você)', '')) + ' ' + BRL(r.amount);
        }).join(' • ');
      } catch (e2) { return ''; }
    }
    modalShell('<div class="row between"><b>' + esc(p.description) + '</b>' + instStatusPill(p) + '</div><div id="me"></div>' +
      '<p class="muted">💳 ' + esc(J.DB.cardName(me.id, p.credit_card_id)) + ' • ' + esc(J.DB.catName(me.id, p.category_id)) + '<br>Responsável: ' + esc(J.DB.userName(me.id, p.payer_user_id)) + (p.is_shared ? ' • 🤝' : ' • 👤') + (p.notes ? '<br>📝 ' + esc(p.notes) : '') + '</p>' +
      '<h1>' + BRL(p.total_amount) + '</h1><p class="muted">' + p.installment_count + ' parcelas • pagas ' + s.paidInstallments + ' (' + BRL(s.paidAmount) + ') • pendentes ' + s.pendingInstallments + ' (' + BRL(s.pendingAmount) + ')</p>' +
      rows.map(function (r) {
        return '<p>' + r.installment_number + '/' + r.total_installments + ' <b>' + BRL(r.amount) + '</b> • ' + dueLabel(r.due_date) + ' ' + (r.status === 'paid' ? '<span class="pill ok">✓ Paga</span>' : r.status === 'cancelled' ? '<span class="pill over">✕ Cancelada</span>' : '<span class="pill warn">⏳ Pendente</span>') + '<span class="muted">' + respLine(Math.round(r.amount * 100)) + '</span></p>';
      }).join('') +
      '<div class="row"><button class="btn ghost" id="ed">Editar</button>' +
      (p.status === 'active' ? '<button class="btn ghost" id="cx" style="color:var(--primary-d)">Cancelar compra</button>' : '') + '</div><button class="btn" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('ed').onclick = function () { openInstallmentModal(me, purchaseId, null); };
    var cx = document.getElementById('cx');
    if (cx) cx.onclick = function () {
      if (!confirm('Cancelar esta compra? As parcelas pendentes serão canceladas. O histórico será mantido.')) return;
      try { J.DB.cancelInstallmentPurchase(me.id, purchaseId); toast('Compra cancelada.'); closeModal(); render(here()); }
      catch (e2) { document.getElementById('me').innerHTML = err(e2); }
    };
  }
  /* ============ PROMPT 12 (V2): FATURAS ============ */
  var invF = { card: '', ym: '', status: '' };
  function invStatusPill(st) {
    if (st === 'paid') return '<span class="pill ok">✓ Paga</span>';
    if (st === 'closed') return '<span class="pill">Fechada</span>';
    if (st === 'overdue') return '<span class="pill over">⚠️ Vencida</span>';
    if (st === 'cancelled') return '<span class="pill over">✕ Cancelada</span>';
    return '<span class="pill warn">Aberta</span>';
  }
  function invStatusText(st) {
    return { paid: 'Paga', closed: 'Fechada', overdue: 'Vencida', cancelled: 'Cancelada', open: 'Aberta' }[st] || st;
  }
  function goalStatusText(st) {
    return { active: 'Ativa', completed: 'Concluída', archived: 'Arquivada' }[st] || st;
  }
  function invRefLabel(inv) { return MESES[inv.reference_month - 1] + ' de ' + inv.reference_year; }
  function pInvoices(v, me) {
    var rows = J.DB.listInvoices(me.id, {
      card_id: invF.card || undefined,
      month: invF.ym ? parseInt(invF.ym.slice(5, 7), 10) : undefined,
      year: invF.ym ? parseInt(invF.ym.slice(0, 4), 10) : undefined,
      status: invF.status || undefined
    });
    var cards = J.DB.listCards(me.id, 'all');
    var html = '<div class="card"><h1>Faturas</h1><p class="muted">Compras no cartão, fechamento e pagamento.</p>';
    html += '<div class="row"><select id="iv-c" aria-label="Cartão"><option value="">Todos os cartões</option>' + cards.map(function (c) {
      return '<option value="' + c.id + '"' + (invF.card === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('') + '</select>';
    html += '<input type="month" id="iv-m" value="' + esc(invF.ym) + '" aria-label="Mês">';
    html += '<select id="iv-s" aria-label="Status"><option value="">Todos status</option><option value="open"' + (invF.status === 'open' ? ' selected' : '') + '>Abertas</option><option value="closed"' + (invF.status === 'closed' ? ' selected' : '') + '>Fechadas</option><option value="paid"' + (invF.status === 'paid' ? ' selected' : '') + '>Pagas</option><option value="overdue"' + (invF.status === 'overdue' ? ' selected' : '') + '>Vencidas</option><option value="cancelled"' + (invF.status === 'cancelled' ? ' selected' : '') + '>Canceladas</option></select></div></div><div id="e"></div>';
    if (!rows.length) {
      html += '<div class="card empty"><div class="ico">🧾</div><h2>Você ainda não possui faturas.</h2><p class="muted">Faturas nascem das compras no cartão.</p></div>';
    } else {
      html += rows.map(function (i) {
        var out = J.DB.calculateInvoiceOutstanding(me.id, i.id);
        return '<a class="card dash-link" href="#/invoices/' + i.id + '"><div class="row between"><b>💳 ' + esc(J.DB.cardName(me.id, i.credit_card_id)) + '</b>' + invStatusPill(i.status) + '</div>' +
          '<p class="muted">' + esc(cap(invRefLabel(i))) + ' • vence ' + dueLabel(i.due_date) + '</p>' +
          '<p>Total <b>' + BRL(i.total_amount) + '</b> • Pago ' + BRL(i.paid_amount) + ' • Pendente <b>' + BRL(out) + '</b></p></a>';
      }).join('');
    }
    v.innerHTML = html;
    document.getElementById('iv-c').onchange = function (e) { invF.card = e.target.value; render('invoices'); };
    document.getElementById('iv-m').onchange = function (e) { invF.ym = e.target.value; render('invoices'); };
    document.getElementById('iv-s').onchange = function (e) { invF.status = e.target.value; render('invoices'); };
  }
  function pInvoiceDetail(v, me, invoiceId) {
    var inv;
    try { inv = J.DB.getInvoice(me.id, invoiceId); } catch (e) { v.innerHTML = err(e) + '<a class="btn ghost" style="text-decoration:none;text-align:center" href="#/invoices">Voltar</a>'; return; }
    var out = J.DB.calculateInvoiceOutstanding(me.id, invoiceId);
    var items = J.DB.invoiceItems(me.id, invoiceId);
    var pays = J.DB.listInvoicePayments(me.id, { invoice_id: invoiceId });
    var card;
    try { card = J.DB.getCard(me.id, inv.credit_card_id); } catch (e2) { card = null; }
    var html = '<div class="card"><p><a href="#/invoices">‹ Faturas</a></p><div class="row between"><h1 style="margin:0">🧾 ' + esc(card ? card.name : 'Cartão') + '</h1>' + invStatusPill(inv.status) + '</div>' +
      '<p class="muted">' + esc(cap(invRefLabel(inv))) + ' • ' + dueLabel(inv.billing_period_start) + ' a ' + dueLabel(inv.billing_period_end) + '<br>Fechamento ' + dueLabel(inv.closing_date) + ' • Vencimento ' + dueLabel(inv.due_date) + '</p>' +
      '<h1>' + BRL(inv.total_amount) + '</h1><p class="muted">Pago ' + BRL(inv.paid_amount) + ' • Pendente <b>' + BRL(out) + '</b></p><div id="e"></div>';
    if (inv.status === 'open') html += '<div class="row"><button class="btn ghost" id="iv-close">Fechar fatura</button></div>';
    if ((inv.status === 'closed' || inv.status === 'overdue' || (inv.status === 'open' && out > 0)) && out > 0) html += '<button class="btn" id="iv-pay">Pagar fatura (' + BRL(out) + ')</button>';
    if (inv.status !== 'paid' && inv.status !== 'cancelled') html += '<button class="btn ghost" id="iv-cx" style="color:var(--primary-d)">Cancelar fatura</button>';
    html += '</div>';
    if (items.txs.length) {
      html += '<div class="card"><b>Compras</b>' + items.txs.map(function (t) { return txRow(me, t); }).join('') + '</div>';
    }
    if (items.installments.length) {
      html += '<div class="card"><b>Parcelas</b>' + items.installments.map(function (r) {
        var pname = '';
        try { pname = J.DB.getInstallmentPurchase(me.id, r.installment_purchase_id).description; } catch (e3) { pname = 'Parcelada'; }
        return '<p>' + esc(pname) + ' ' + r.installment_number + '/' + r.total_installments + ' — <b>' + BRL(r.amount) + '</b> <span class="muted">' + dueLabel(r.due_date) + '</span></p>';
      }).join('') + '</div>';
    }
    if (pays.length) {
      html += '<div class="card"><b>Pagamentos</b>' + pays.map(function (p) {
        return '<p>−' + BRL(p.amount) + ' <span class="muted">' + dueLabel(p.payment_date) + ' • ' + esc(J.DB.accountName(me.id, p.payment_account_id)) + (p.notes ? ' • ' + esc(p.notes) : '') + '</span></p>';
      }).join('') + '</div>';
    }
    if (!items.txs.length && !items.installments.length) html += '<div class="card"><p class="muted">Nenhum item nesta fatura ainda.</p></div>';
    v.innerHTML = html;
    var cl = document.getElementById('iv-close');
    if (cl) cl.onclick = function () { if (!confirm('Fechar a fatura de ' + BRL(inv.total_amount) + '? Novas compras entrarão na próxima.')) return; try { J.DB.closeInvoice(me.id, invoiceId); toast('Fatura fechada.'); render('invoices/' + invoiceId); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    var py = document.getElementById('iv-pay');
    if (py) py.onclick = function () { openPayModal(me, invoiceId); };
    var cx = document.getElementById('iv-cx');
    if (cx) cx.onclick = function () { if (!confirm('Cancelar esta fatura? O histórico será mantido.')) return; try { J.DB.cancelInvoice(me.id, invoiceId); toast('Fatura cancelada.'); render('invoices/' + invoiceId); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    Array.prototype.forEach.call(v.querySelectorAll('.tx[data-id]'), function (b) { b.onclick = function () { openTxDetail(me, b.dataset.id); }; });
  }
  function openPayModal(me, invoiceId) {
    var inv = J.DB.getInvoice(me.id, invoiceId);
    var out = J.DB.calculateInvoiceOutstanding(me.id, invoiceId);
    if (out <= 0) { toast('Nada a pagar nesta fatura.'); return; }
    var accs = J.DB.listAccounts(me.id, 'active');
    var def = inv.payment_account_id && accs.some(function (a) { return a.id === inv.payment_account_id; }) ? inv.payment_account_id : (accs[0] && accs[0].id) || '';
    modalShell('<h2>Pagar fatura</h2><div id="me"></div>' +
      '<p>Valor pendente<br><h1>' + BRL(out) + '</h1></p>' +
      '<label>Conta para pagamento *</label><select id="f-pa">' + accs.map(function (a) {
        return '<option value="' + a.id + '"' + (a.id === def ? ' selected' : '') + '>' + esc(a.name) + ' (' + BRL(J.DB.calculateAccountBalance(me.id, a.id)) + ')</option>';
      }).join('') + '</select>' +
      '<div class="row"><div><label>Data *</label><input id="f-pd" type="date" value="' + today() + '"></div></div>' +
      '<label>Observação</label><input id="f-pn" maxlength="300" placeholder="Opcional">' +
      '<p class="muted">Pagamento integral. Não cria despesa nem transferência.</p>' +
      '<button class="btn" id="sv">Pagar ' + BRL(out) + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      if (!confirm('Confirmar pagamento de ' + BRL(out) + ' usando ' + document.getElementById('f-pa').selectedOptions[0].text + '?')) { unlock(btn); return; }
      try {
        J.DB.payInvoice(me.id, invoiceId, { payment_account_id: document.getElementById('f-pa').value, amount: out, payment_date: document.getElementById('f-pd').value, notes: document.getElementById('f-pn').value });
        closeModal(); toast('Fatura paga com sucesso. ✅'); render('invoices/' + invoiceId);
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  /* ---------- DEMAIS TELAS (etapas 1–5, preservadas) ---------- */
  /* ============ PROMPT 26: PLANEJAMENTO ============ */
  var plState = { plan: null, vision: 'couple', scenario: null, cmpB: '' };
  function planStatusPill(s) {
    return s === 'active' ? '<span class="pill ok">Ativo</span>' : s === 'draft' ? '<span class="pill">Rascunho</span>' : s === 'completed' ? '<span class="pill ok">Concluído</span>' : '<span class="pill">Arquivado</span>';
  }
  function planItemTypeLabel(t) {
    return { income: 'Receita', expense: 'Despesa', saving: 'Reserva', goal_contribution: 'Meta', commitment: 'Compromisso', adjustment: 'Ajuste' }[t] || t;
  }
  function pPlanning(v, me) {
    var plans = J.DB.listPlans(me.id, {});
    var html = '<div class="card"><h1>Planejamento financeiro</h1><p class="muted">Organize receitas, despesas, compromissos e metas futuras em um único lugar. Projetado com base nos dados atuais — nunca mexe nos lançamentos reais.</p>' +
      '<div class="row"><button class="btn" id="pl-new">+ Novo plano</button><button class="btn ghost" id="pl-base">Gerar baseline</button></div></div>';
    if (!plans.length) {
      html += '<div class="card empty"><div class="ico">🗺️</div><h2>Crie seu primeiro planejamento financeiro</h2><p class="muted">Organize receitas, despesas, compromissos e metas futuras em um único lugar.</p><div class="row"><button class="btn" id="pl-new2">Criar manualmente</button><button class="btn ghost" id="pl-base2">Gerar planejamento inicial com dados existentes</button></div></div>';
    } else {
      html += plans.map(function (p) {
        return '<a class="card dash-link" href="#/planning/' + p.id + '"><div class="row between"><b>🗺️ ' + esc(p.name) + '</b>' + planStatusPill(p.status) + '</div>' +
          '<p class="muted">' + esc(dueLabel(p.period_start)) + ' a ' + esc(dueLabel(p.period_end)) + '</p></a>';
      }).join('');
    }
    html += '<div id="e"></div>';
    v.innerHTML = html;
    function openCreate() { openPlanModal(me, null); }
    document.getElementById('pl-new').onclick = openCreate;
    var n2 = document.getElementById('pl-new2'); if (n2) n2.onclick = openCreate;
    function openBase() { openBaselineModal(me); }
    document.getElementById('pl-base').onclick = openBase;
    var b2 = document.getElementById('pl-base2'); if (b2) b2.onclick = openBase;
  }
  function openPlanModal(me, planId) {
    var p = planId ? J.DB.getPlan(me.id, planId) : null;
    modalShell('<h2>' + (p ? 'Editar plano' : 'Novo plano') + '</h2><div id="me"></div>' +
      '<label>Nome *</label><input id="f-pn" value="' + esc(p ? p.name : '') + '">' +
      '<label>Descrição</label><input id="f-pd" value="' + esc(p ? p.description : '') + '">' +
      '<div class="row"><div><label>Início *</label><input id="f-ps" type="date" value="' + esc(p ? p.period_start : '') + '"></div>' +
      '<div><label>Fim *</label><input id="f-pe" type="date" value="' + esc(p ? p.period_end : '') + '"></div></div>' +
      '<button class="btn" id="sv">' + (p ? 'Salvar' : 'Criar') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var data = { name: document.getElementById('f-pn').value, description: document.getElementById('f-pd').value, period_start: document.getElementById('f-ps').value, period_end: document.getElementById('f-pe').value };
        if (p) J.DB.updatePlan(me.id, planId, data);
        else { var np = J.DB.createPlan(me.id, data); location.hash = '#/planning/' + np.id; }
        closeModal(); toast(p ? 'Plano atualizado!' : 'Plano criado!'); render(p ? 'planning/' + planId : 'planning');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openBaselineModal(me) {
    modalShell('<h2>Gerar planejamento inicial</h2><div id="me"></div><p class="muted">Usa recorrências, metas e acertos pendentes. Valores projetados, não garantias. Não cria transações reais.</p>' +
      '<label>Nome</label><input id="f-bn" placeholder="Planejamento (opcional)">' +
      '<label>Horizonte</label><select id="f-bm"><option value="1">1 mês</option><option value="3" selected>3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select>' +
      '<button class="btn" id="sv">Gerar</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var np = J.DB.generateBaselinePlan(me.id, { months: document.getElementById('f-bm').value, name: document.getElementById('f-bn').value || undefined });
        closeModal(); toast('Planejamento gerado!'); location.hash = '#/planning/' + np.id;
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function pPlanningDetail(v, me, planId) {
    var p;
    try { p = J.DB.getPlan(me.id, planId); }
    catch (e) { v.innerHTML = err(e) + '<a class="btn ghost" style="text-decoration:none;text-align:center" href="#/planning">Voltar</a>'; return; }
    if (plState.plan !== planId) { plState = { plan: planId, vision: 'couple', scenario: null, cmpB: '' }; }
    var scens = J.DB.listScenarios(me.id, planId).filter(function (s) { return s.status !== 'archived'; });
    if (!plState.scenario || !scens.some(function (s) { return s.id === plState.scenario; })) {
      var base = scens.filter(function (s) { return s.scenario_type === 'baseline'; })[0];
      plState.scenario = base ? base.id : (scens[0] ? scens[0].id : null);
    }
    var c;
    try { c = J.DB.calculatePlan(me.id, planId, { scenarioId: plState.scenario, vision: plState.vision }); }
    catch (e2) { v.innerHTML = err(e2) + '<a class="btn ghost" style="text-decoration:none;text-align:center" href="#/planning">Voltar</a>'; return; }
    var safe;
    try { safe = J.DB.calculateSafeAvailableAmount(me.id, planId, { scenarioId: plState.scenario, vision: plState.vision }); }
    catch (e3) { safe = null; }
    var vTag = plState.vision === 'couple' ? '' : ' <span class="muted">• visão ' + (plState.vision === 'me' ? 'Eu' : 'Parceiro') + '</span>';
    var html = '<div class="card"><p><a href="#/planning">‹ Planejamento</a></p><div class="row between"><h1 style="margin:0">🗺️ ' + esc(p.name) + '</h1>' + planStatusPill(p.status) + '</div>' +
      '<p class="muted">' + esc(dueLabel(p.period_start)) + ' a ' + esc(dueLabel(p.period_end)) + ' • Base: ' + esc(dueLabel(p.base_date)) + vTag + '</p>' +
      (p.description ? '<p>' + esc(p.description) + '</p>' : '') +
      '<div class="row"><select id="pl-vis" aria-label="Visão"><option value="couple"' + (plState.vision === 'couple' ? ' selected' : '') + '>Casal</option><option value="me"' + (plState.vision === 'me' ? ' selected' : '') + '>Eu</option><option value="partner"' + (plState.vision === 'partner' ? ' selected' : '') + '>Parceiro</option></select>' +
      '<select id="pl-scen" aria-label="Cenário">' + scens.map(function (s) { return '<option value="' + s.id + '"' + (plState.scenario === s.id ? ' selected' : '') + '>' + esc(s.name) + ' (' + s.scenario_type + ')</option>'; }).join('') + '</select></div>';
    if (p.status === 'draft') html += '<div class="row"><button class="btn" id="pl-act">Ativar plano</button></div>';
    if (p.status !== 'archived' && p.status !== 'completed') html += '<div class="row"><button class="btn ghost" id="pl-ed">Editar</button><button class="btn ghost" id="pl-dup">Duplicar</button><button class="btn ghost" id="pl-arch" style="color:var(--primary-d)">Arquivar</button></div>';
    html += '<div id="e"></div></div>';
    html += '<div class="card"><b>Resumo' + (c.scenario.name !== 'Base' ? ' • cenário ' + esc(c.scenario.name) : '') + '</b>' +
      '<p class="muted">Dinheiro considerado: <b>' + BRL(c.opening) + '</b> • Entradas planejadas: <b class="pos">' + BRL(c.totals.income) + '</b> • Saídas planejadas: <b class="neg">' + BRL(c.totals.expenses + c.totals.savings + c.totals.goalContributions) + '</b><br>Saldo final projetado: <b>' + BRL(c.totals.ending) + '</b>' +
      (safe ? ' • Valor planejado ainda disponível: <b>' + BRL(safe.safe) + '</b>' : '') + '</p>' +
      '<p class="muted">Projetado com base nos dados atuais. Não é saldo em conta; limite de cartão não incluído.</p></div>';
    html += '<div class="card"><b>Fluxo de caixa planejado</b>' + c.months.map(function (m) {
      return '<p><b>' + esc(monthLabel(m.ym)) + '</b><br><span class="muted">+' + BRL(m.income) + ' −' + BRL(m.expenses + m.savings + m.goalContributions) + ' = </span><b>' + BRL(m.net) + '</b> <span class="muted">• fim ' + BRL(m.ending) + '</span></p>';
    }).join('') + '</div>';
    html += '<div class="card"><b>Compromissos futuros</b><p class="muted">Parcelas (1x cada), descoberto de faturas, recorrências pendentes e acerto. Total: <b>' + BRL(c.commitments.total) + '</b></p>' +
      (c.commitments.items.slice(0, 12).map(function (it) {
        return '<p>' + esc(it.label) + '<br><span class="muted">' + esc(dueLabel(it.date)) + ' • </span><b>' + BRL(it.amount) + '</b></p>';
      }).join('') || '<p class="muted">Nenhum compromisso no período.</p>') + '</div>';
    html += '<div class="card"><b>Metas</b>' + (c.goals.length ? c.goals.map(function (g) {
      return '<p><b>' + esc(g.name) + '</b><br><span class="muted">' + BRL(g.current) + ' de ' + BRL(g.target) + ' • planejado: ' + BRL(g.plannedContributions) + ' • faltam: ' + BRL(g.remaining) + (g.shortfall > 0 ? ' • diferença: <b class="neg">' + BRL(g.shortfall) + '</b>' : ' • <b class="pos">coberto</b>') + '</span></p>';
    }).join('') : '<p class="muted">Sem metas ativas. <a href="#/goals">Ver metas ›</a></p>') + '<p class="muted">Contribuição planejada não altera a meta; só o aporte real.</p></div>';
    html += '<div class="card"><b>Orçamentos</b>' + (c.budgets.length ? c.budgets.map(function (b) {
      return '<p><b>' + esc(monthLabel(b.ym)) + '</b><br><span class="muted">Teto: ' + BRL(b.limit) + ' • Planejado: ' + BRL(b.planned) + ' • Gasto: ' + BRL(b.spent) + '</span></p>';
    }).join('') : '<p class="muted">Sem orçamentos no período.</p>') + '<p class="muted">Orçamento é teto de referência; planejado vem dos itens.</p></div>';
    html += '<div class="card"><b>Planejado x realizado</b>' + c.months.map(function (m) {
      return '<p><b>' + esc(monthLabel(m.ym)) + '</b><br><span class="muted">Receitas: plan. ' + BRL(m.variance.income.planned) + ' • real ' + BRL(m.variance.income.actual) + ' • <b>dif. ' + BRL(m.variance.income.variance) + '</b><br>Despesas: plan. ' + BRL(m.variance.expense.planned) + ' • real ' + BRL(m.variance.expense.actual) + ' • <b>dif. ' + BRL(m.variance.expense.variance) + '</b></span></p>';
    }).join('') +
      (c.categories.slice(0, 8).map(function (k) {
        return '<p>' + esc(k.icon + ' ' + k.name) + '<br><span class="muted">Plan. ' + BRL(k.planned) + ' • real ' + BRL(k.actual) + ' • <b>dif. ' + BRL(k.variance) + '</b></span></p>';
      }).join('') || '') + '</div>';
    var items = J.DB.listPlanItems(me.id, planId, {});
    html += '<div class="card"><div class="row between"><b>Itens do plano (' + items.filter(function (i) { return i.active; }).length + ')</b>' + (p.status !== 'archived' && p.status !== 'completed' ? '<button class="btn ghost" id="pl-add">+ Item</button>' : '') + '</div>' +
      (items.map(function (i) {
        return '<p>' + (i.active ? '' : '<span class="muted">[inativo] </span>') + '<b>' + esc(i.name) + '</b> <span class="pill">' + esc(planItemTypeLabel(i.item_type)) + '</span><br><span class="muted">' + esc(dueLabel(i.planned_date)) + ' • ' + esc(i.frequency) + ' • </span><b>' + BRL(i.amount) + '</b>' +
          (p.status !== 'archived' && p.status !== 'completed' ? ' <button class="btn ghost" data-pied="' + i.id + '">Editar</button><button class="btn ghost" data-pidel="' + i.id + '" style="color:var(--primary-d)">Remover</button>' : '') + '</p>';
      }).join('') || '<p class="muted">Nenhum item ainda.</p>') + '</div>';
    html += '<div class="card"><div class="row between"><b>Cenários</b>' + (p.status !== 'archived' && p.status !== 'completed' ? '<button class="btn ghost" id="pl-scadd">+ Cenário</button>' : '') + '</div>' +
      scens.map(function (s) {
        return '<p><b>' + esc(s.name) + '</b> <span class="pill">' + esc(s.scenario_type) + '</span> <span class="pill">' + esc(s.status) + '</span>' +
          (p.status !== 'archived' && p.status !== 'completed' ? ' <button class="btn ghost" data-scadd="' + s.id + '">+ Ajuste</button><button class="btn ghost" data-scdup="' + s.id + '">Duplicar</button>' + (s.status !== 'archived' ? ' <button class="btn ghost" data-scarch="' + s.id + '">Arquivar</button>' : '') : '') + '</p>' +
          J.DB.listScenarioItems(me.id, s.id).map(function (x) {
            return '<p class="muted" style="margin-left:12px">• ' + esc(x.name) + ' — ' + (x.source_plan_item_id ? 'ajuste ' + esc(x.adjustment_type) + ' ' + esc(String(x.adjustment_value)) : 'extra ' + BRL(x.amount)) + (p.status !== 'archived' && p.status !== 'completed' ? ' <button class="btn ghost" data-sied="' + x.id + '">Editar</button><button class="btn ghost" data-sidel="' + x.id + '">Remover</button>' : '') + '</p>';
          }).join('');
      }).join('') +
      '<div class="row"><select id="pl-cmpb" aria-label="Comparar com">' + scens.filter(function (s) { return s.id !== plState.scenario; }).map(function (s) { return '<option value="' + s.id + '"' + (plState.cmpB === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select><button class="btn ghost" id="pl-cmp">Comparar</button><button class="btn ghost" id="pl-sim">Simular cenário atual</button></div><div id="pl-cmpres"></div></div>';
    if (c.insights.length) html += '<div class="card"><b>Contexto (insights)</b>' + c.insights.map(function (x) { return '<p>💡 ' + esc(x.title) + ' <span class="muted">• ' + esc(x.severity) + '</span></p>'; }).join('') + '<p class="muted">Contexto factual; não é recomendação.</p></div>';
    v.innerHTML = html;
    document.getElementById('pl-vis').onchange = function (e) { plState.vision = e.target.value; render('planning/' + planId); };
    document.getElementById('pl-scen').onchange = function (e) { plState.scenario = e.target.value || null; render('planning/' + planId); };
    var act = document.getElementById('pl-act');
    if (act) act.onclick = function () { try { J.DB.activatePlan(me.id, planId); toast('Plano ativado!'); render('planning/' + planId); } catch (e) { document.getElementById('e').innerHTML = err(e); } };
    var ed = document.getElementById('pl-ed');
    if (ed) ed.onclick = function () { openPlanModal(me, planId); };
    var dp = document.getElementById('pl-dup');
    if (dp) dp.onclick = function () { try { var np = J.DB.duplicatePlan(me.id, planId); toast('Plano duplicado!'); location.hash = '#/planning/' + np.id; } catch (e) { document.getElementById('e').innerHTML = err(e); } };
    var ar = document.getElementById('pl-arch');
    if (ar) ar.onclick = function () { if (!confirm('Arquivar este plano? Ele ficará somente leitura.')) return; try { J.DB.archivePlan(me.id, planId); toast('Plano arquivado.'); render('planning/' + planId); } catch (e) { document.getElementById('e').innerHTML = err(e); } };
    var ad = document.getElementById('pl-add');
    if (ad) ad.onclick = function () { openPlanItemModal(me, planId, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-pied]'), function (b) { b.onclick = function () { openPlanItemModal(me, planId, b.dataset.pied); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-pidel]'), function (b) {
      b.onclick = function () {
        if (!confirm('Remover este item do planejamento? Os lançamentos reais não são afetados.')) return;
        try { J.DB.removePlanItem(me.id, b.dataset.pidel); toast('Item removido.'); render('planning/' + planId); } catch (e) { document.getElementById('e').innerHTML = err(e); }
      };
    });
    var sc = document.getElementById('pl-scadd');
    if (sc) sc.onclick = function () { openScenarioModal(me, planId, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-scadd]'), function (b) { b.onclick = function () { openScenarioItemAddModal(me, planId, b.dataset.scadd); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-scdup]'), function (b) { b.onclick = function () { try { J.DB.duplicateScenario(me.id, b.dataset.scdup); toast('Cenário duplicado!'); render('planning/' + planId); } catch (e) { document.getElementById('e').innerHTML = err(e); } }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-scarch]'), function (b) { b.onclick = function () { if (!confirm('Arquivar este cenário?')) return; try { J.DB.archiveScenario(me.id, b.dataset.scarch); toast('Cenário arquivado.'); render('planning/' + planId); } catch (e) { document.getElementById('e').innerHTML = err(e); } }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-sied]'), function (b) { b.onclick = function () { openScenarioItemModal(me, planId, b.dataset.sied); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-sidel]'), function (b) { b.onclick = function () { if (!confirm('Remover este ajuste? O plano base não muda.')) return; try { J.DB.removeScenarioItem(me.id, b.dataset.sidel); toast('Ajuste removido.'); render('planning/' + planId); } catch (e) { document.getElementById('e').innerHTML = err(e); } }; });
    document.getElementById('pl-cmpb').onchange = function (e) { plState.cmpB = e.target.value; };
    document.getElementById('pl-cmp').onclick = function () {
      try {
        var other = plState.cmpB || (scens.filter(function (s) { return s.id !== plState.scenario; })[0] || {}).id;
        if (!other) { document.getElementById('pl-cmpres').innerHTML = '<p class="muted">Crie outro cenário para comparar.</p>'; return; }
        var cmp = J.DB.compareScenario(me.id, planId, plState.scenario, other);
        document.getElementById('pl-cmpres').innerHTML = '<p><b>' + esc(cmp.a.name) + ' × ' + esc(cmp.b.name) + '</b> (diferença B − A)</p>' +
          cmp.months.map(function (m) { return '<p class="muted">' + esc(monthLabel(m.ym)) + ': saldo ' + BRL(m.dEnding) + ' • resultado ' + BRL(m.dNet) + '</p>'; }).join('') +
          '<p>Totais: saldo <b>' + BRL(cmp.totals.ending) + '</b> • resultado <b>' + BRL(cmp.totals.net) + '</b></p>';
      } catch (e) { document.getElementById('pl-cmpres').innerHTML = err(e); }
    };
    document.getElementById('pl-sim').onclick = function () {
      try {
        var s2 = J.DB.simulateScenario(me.id, plState.scenario || scens[0].id);
        document.getElementById('pl-cmpres').innerHTML = '<p><b>Simulação</b> <span class="muted">(não altera nada real)</span></p><p class="muted">Entradas: ' + BRL(s2.totals.income) + ' • Saídas: ' + BRL(s2.totals.expenses + s2.totals.savings + s2.totals.goalContributions) + ' • Saldo final projetado: <b>' + BRL(s2.totals.ending) + '</b></p>';
      } catch (e) { document.getElementById('pl-cmpres').innerHTML = err(e); }
    };
  }
  function planCatOptions(me, sel, onlyExpense) {
    var list = onlyExpense ? expCats(me) : J.DB.myCategories(me.id);
    return list.map(function (c) { return '<option value="' + c.id + '"' + (sel === c.id ? ' selected' : '') + '>' + esc(c.icon + ' ' + c.name) + '</option>'; }).join('');
  }
  function planPeopleOptions(me, sel) {
    var people = couplePeople(me);
    return '<option value="">Casal (todos)</option>' + people.map(function (u) { return '<option value="' + u.id + '"' + (sel === u.id ? ' selected' : '') + '>' + esc(u.nome) + '</option>'; }).join('');
  }
  function openPlanItemModal(me, planId, itemId) {
    var it = null;
    if (itemId) {
      it = J.DB.listPlanItems(me.id, planId, {}).filter(function (x) { return x.id === itemId; })[0];
      if (!it) { toast('Item não encontrado.'); return; }
    }
    modalShell('<h2>' + (it ? 'Editar item' : 'Novo item') + '</h2><div id="me"></div><p class="muted">Item planejado não cria lançamento real.</p>' +
      '<label>Nome *</label><input id="f-in" value="' + esc(it ? it.name : '') + '">' +
      '<div class="row"><div><label>Tipo *</label><select id="f-it">' + J.DB.PLAN_ITEM_TYPES.map(function (t) { return '<option value="' + t + '"' + (it && it.item_type === t ? ' selected' : '') + '>' + esc(planItemTypeLabel(t)) + '</option>'; }).join('') + '</select></div>' +
      '<div><label>Frequência *</label><select id="f-if">' + J.DB.PLAN_ITEM_FREQUENCIES.map(function (f) { return '<option value="' + f + '"' + (it && it.frequency === f ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select></div></div>' +
      '<label>Valor (R$) *</label><input id="f-iv" inputmode="decimal" placeholder="500,00" value="' + (it ? String(it.amount).replace('.', ',') : '') + '">' +
      '<label>Data planejada *</label><input id="f-ip" type="date" value="' + esc(it ? it.planned_date : '') + '">' +
      '<div class="row"><div><label>Início (opcional)</label><input id="f-is" type="date" value="' + esc(it && it.start_date ? it.start_date : '') + '"></div>' +
      '<div><label>Fim (opcional)</label><input id="f-ie" type="date" value="' + esc(it && it.end_date ? it.end_date : '') + '"></div></div>' +
      '<label>Categoria (opcional)</label><select id="f-ic"><option value="">—</option>' + planCatOptions(me, it ? it.category_id : null) + '</select>' +
      '<label>Responsável</label><select id="f-iu">' + planPeopleOptions(me, it ? it.user_id : null) + '</select>' +
      '<label>Observação</label><input id="f-io" value="' + esc(it ? it.notes : '') + '">' +
      '<button class="btn" id="sv">' + (it ? 'Salvar' : 'Adicionar') + '</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var data = { name: document.getElementById('f-in').value, item_type: document.getElementById('f-it').value, frequency: document.getElementById('f-if').value, amount: document.getElementById('f-iv').value, planned_date: document.getElementById('f-ip').value, start_date: document.getElementById('f-is').value || undefined, end_date: document.getElementById('f-ie').value || undefined, category_id: document.getElementById('f-ic').value || undefined, user_id: document.getElementById('f-iu').value || undefined, notes: document.getElementById('f-io').value };
        if (it) J.DB.updatePlanItem(me.id, itemId, data);
        else J.DB.addPlanItem(me.id, planId, data);
        closeModal(); toast(it ? 'Item atualizado!' : 'Item adicionado!'); render('planning/' + planId);
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openScenarioModal(me, planId) {
    modalShell('<h2>Novo cenário</h2><div id="me"></div><p class="muted">Cenários simulam variações sem alterar o plano nem os dados reais.</p>' +
      '<label>Nome *</label><input id="f-sn" placeholder="Ex: conservador, -10% lazer">' +
      '<label>Tipo *</label><select id="f-st"><option value="custom">Personalizado</option><option value="conservative">Conservador</option></select>' +
      '<label>Descrição</label><input id="f-sd">' +
      '<button class="btn" id="sv">Criar</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        J.DB.createScenario(me.id, planId, { name: document.getElementById('f-sn').value, scenario_type: document.getElementById('f-st').value, description: document.getElementById('f-sd').value });
        closeModal(); toast('Cenário criado! Adicione ajustes a itens do plano.'); render('planning/' + planId);
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openScenarioItemModal(me, planId, scenItemId) {
    var db = J.DB.all();
    var x = db.financial_plan_scenario_items.find(function (r) { return r.id === scenItemId; });
    if (!x) { toast('Ajuste não encontrado.'); return; }
    var items = J.DB.listPlanItems(me.id, planId, { activeOnly: true });
    modalShell('<h2>' + (x.source_plan_item_id ? 'Editar ajuste' : 'Editar item extra') + '</h2><div id="me"></div>' +
      (x.source_plan_item_id
        ? '<label>Tipo de ajuste *</label><select id="f-xa"><option value="none"' + (x.adjustment_type === 'none' ? ' selected' : '') + '>Nenhum</option><option value="fixed"' + (x.adjustment_type === 'fixed' ? ' selected' : '') + '>Valor fixo</option><option value="percentage"' + (x.adjustment_type === 'percentage' ? ' selected' : '') + '>Percentual (%)</option></select>' +
          '<label>Valor do ajuste</label><input id="f-xv" inputmode="decimal" value="' + esc(String(x.adjustment_value)) + '">'
        : '<label>Nome *</label><input id="f-xn" value="' + esc(x.name) + '"><label>Tipo *</label><select id="f-xt">' + J.DB.PLAN_ITEM_TYPES.map(function (t) { return '<option value="' + t + '"' + (x.item_type === t ? ' selected' : '') + '>' + esc(planItemTypeLabel(t)) + '</option>'; }).join('') + '</select>' +
          '<label>Valor (R$) *</label><input id="f-xv2" inputmode="decimal" value="' + esc(String(x.amount).replace('.', ',')) + '"><label>Data *</label><input id="f-xd" type="date" value="' + esc(x.planned_date) + '">') +
      '<button class="btn" id="sv">Salvar</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        if (x.source_plan_item_id) {
          var patch = { adjustment_type: document.getElementById('f-xa').value };
          if (patch.adjustment_type !== 'none') patch.adjustment_value = document.getElementById('f-xv').value;
          J.DB.updateScenarioItem(me.id, scenItemId, patch);
        } else {
          J.DB.updateScenarioItem(me.id, scenItemId, { name: document.getElementById('f-xn').value, item_type: document.getElementById('f-xt').value, amount: document.getElementById('f-xv2').value, planned_date: document.getElementById('f-xd').value });
        }
        closeModal(); toast('Ajuste salvo!'); render('planning/' + planId);
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openScenarioItemAddModal(me, planId, scenarioId) {
    var items = J.DB.listPlanItems(me.id, planId, { activeOnly: true });
    modalShell('<h2>Novo ajuste do cenário</h2><div id="me"></div><p class="muted">Ajuste um item do plano ou adicione um item extra. Nada aqui altera dados reais.</p>' +
      '<label>Item do plano (ou extra)</label><select id="f-xs"><option value="">+ Item extra</option>' + items.map(function (i) { return '<option value="' + i.id + '">' + esc(i.name) + ' • ' + BRL(i.amount) + '</option>'; }).join('') + '</select>' +
      '<div id="f-xextra"><label>Nome *</label><input id="f-xn" placeholder="Ex: freelance extra"><label>Tipo *</label><select id="f-xt">' + J.DB.PLAN_ITEM_TYPES.map(function (t) { return '<option value="' + t + '">' + esc(planItemTypeLabel(t)) + '</option>'; }).join('') + '</select>' +
      '<label>Valor (R$) *</label><input id="f-xv2" inputmode="decimal" placeholder="500,00"><label>Data *</label><input id="f-xd" type="date"></div>' +
      '<div id="f-xadj"><label>Tipo de ajuste *</label><select id="f-xa"><option value="none">Nenhum (manter valor)</option><option value="fixed">Valor fixo</option><option value="percentage">Percentual (%)</option></select>' +
      '<label>Valor do ajuste</label><input id="f-xv" inputmode="decimal" placeholder="Ex: 800 ou -10"></div>' +
      '<button class="btn" id="sv">Adicionar</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    function syncMode() {
      var linked = !!document.getElementById('f-xs').value;
      document.getElementById('f-xextra').style.display = linked ? 'none' : '';
      document.getElementById('f-xadj').style.display = linked ? '' : 'none';
    }
    document.getElementById('f-xs').onchange = syncMode; syncMode();
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var sid = document.getElementById('f-xs').value;
        if (sid) {
          var patch = { source_plan_item_id: sid, adjustment_type: document.getElementById('f-xa').value, name: 'x' };
          if (patch.adjustment_type !== 'none') patch.adjustment_value = document.getElementById('f-xv').value;
          else patch.adjustment_value = 0;
          var base = items.filter(function (i) { return i.id === sid; })[0];
          patch.name = base ? base.name : 'x';
          J.DB.addScenarioItem(me.id, scenarioId, patch);
        } else {
          J.DB.addScenarioItem(me.id, scenarioId, { name: document.getElementById('f-xn').value, item_type: document.getElementById('f-xt').value, amount: document.getElementById('f-xv2').value, planned_date: document.getElementById('f-xd').value, adjustment_type: 'none' });
        }
        closeModal(); toast('Ajuste adicionado!'); render('planning/' + planId);
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  /* ============ MemberContext (só apresentação/autorização contextual) ============
     Centraliza leitura de sessão + casal. Nunca substitui validação backend. */
  function ctxOf(me) {
    var c = { me: me, couple: null, members: [], users: [], role: null, isOwner: false, mode: 'SEPARATE' };
    if (!me) return c;
    try {
      var ctx = J.DB.myCouple(me.id);
      c.couple = ctx.couple || null; c.members = ctx.members || []; c.users = ctx.users || [];
      var m = c.members.filter(function (x) { return x.user_id === me.id; })[0];
      c.role = m ? m.role : null; c.isOwner = c.role === 'owner';
      c.mode = J.DB.moneyMode(me.id);
    } catch (e) {}
    return c;
  }
  J.Ctx = {
    _c: null,
    get: function () {
      var me = J.Auth.current();
      if (!me) { this._c = ctxOf(null); return this._c; }
      if (!this._c || !this._c.me || this._c.me.id !== me.id) this._c = ctxOf(me);
      return this._c;
    },
    clear: function () { this._c = null; }
  };
  function pMore(v) {
    var me = J.Auth.current();
    v.innerHTML = '<div class="card"><h1>Mais</h1><p class="muted">Atalhos e ajustes.</p></div>' +
      '<div class="menu"><a href="#/tasks">☑ Tarefas <span>›</span></a><a href="#/lists">📝 Listas <span>›</span></a><a href="#/routines">🔁 Rotinas <span>›</span></a><a href="#/projects">🗂 Projetos <span>›</span></a><a href="#/inbox">📥 Inbox <span>›</span></a><a href="#/week">📅 Minha Semana <span>›</span></a><a href="#/monthly-review">📊 Fechamento Mensal <span>›</span></a><a href="#/finance">💰 Finanças <span>›</span></a><a href="#/installments">🗓️ Parceladas <span>›</span></a><a href="#/insights">💡 Insights <span>›</span></a><a href="#/assistant">🤖 Assistente <span>›</span></a><a href="#/notifications">🔔 Notificações <span>›</span></a><a href="#/calendar">📅 Calendário <span>›</span></a><a href="#/recurring">🔁 Recorrentes <span>›</span></a><a href="#/imports">📥 Importar extrato <span>›</span></a><a href="#/settings">⚙️ Configurações <span>›</span></a></div>' +
      (me ? '<button class="btn ghost" id="more-out">Sair da conta</button>' : '');
    var out = document.getElementById('more-out');
    if (out) out.onclick = function () { J.Auth.logout(); };
  }
  /* ============ CONFIGURAÇÕES: hub + subseções ============
     Áreas principais = usar o dinheiro. Configurações = definir como o
     app e o casal funcionam. Reutiliza todos os serviços existentes. */
  function crumb(title) {
    return '<p class="muted"><a href="#/settings">‹ Configurações</a> <span class="crumb-sep">› ' + esc(title) + '</span></p>';
  }
  var SETTING_GROUPS = [
    ['Conta', [['profile', '👤', 'Meu perfil', 'Nome, e-mail, avatar e conta'], ['preferences', '🎛️', 'Preferências', 'Visão padrão e período inicial'], ['privacy', '🔒', 'Privacidade e segurança', 'Senha, segurança e auditoria']]],
    ['Casal', [['couple', '❤️', 'Casal', 'Participantes e convites'], ['money', '💱', 'Gestão do dinheiro', 'Dinheiro separado ou tudo junto']]],
    ['Finanças', [['categories', '🏷️', 'Categorias', 'Categorias e subcategorias'], ['automation', '⚙️', 'Automação', 'Regras e automações'], ['financial', '💹', 'Preferências financeiras', 'Insights e visualização'], ['data', '📥', 'Dados', 'Importações e reconciliações']]],
    ['Comunicação', [['notifications', '🔔', 'Notificações', 'Preferências de alertas'], ['whatsapp', '📱', 'WhatsApp', 'Conexão e preferências'], ['assistant', '🤖', 'Assistente financeiro', 'Conversas e privacidade']]]
  ];
  function pSettings(v, me) {
    var mode = J.DB.moneyMode(me.id);
    var modeLbl = mode === 'JOINT' ? 'Tudo junto' : 'Dinheiro separado';
    v.innerHTML = '<div class="card"><h1>Configurações</h1><p class="muted">Gerencie sua conta, seu casal e as preferências do aplicativo.</p></div>' +
      SETTING_GROUPS.map(function (g) {
        return '<h2 class="set-group">' + g[0] + '</h2>' + g[1].map(function (s) {
          var extra = s[0] === 'money' ? '<br><span class="muted">Gestão atual: <b>' + modeLbl + '</b></span>' : '';
          return '<a class="card dash-link" href="#/settings/' + s[0] + '"><div class="row between"><b>' + s[1] + ' ' + s[2] + '</b><span>›</span></div><p class="muted">' + s[3] + extra + '</p></a>';
        }).join('');
      }).join('');
  }
  function pSettingsSub(v, me, sub) {
    var map = { profile: pSettingsProfile, preferences: pSettingsPreferences, couple: pSettingsCouple, money: pSettingsMoney, financial: pSettingsFinancial, automation: pSettingsAutomation, notifications: pSettingsNotifPrefs, whatsapp: pSettingsWhatsapp, assistant: pSettingsAssistant, data: pSettingsData, categories: pSettingsCategories, privacy: pSettingsPrivacy };
    var fn = map[sub];
    if (!fn) { location.hash = '#/settings'; return pSettings(v, me); }
    return fn(v, me);
  }
  function pSettingsMoney(v, me) {
    var ctx = J.DB.myCouple(me.id);
    if (!ctx.couple) { location.hash = '#/onboarding'; return; }
    var isOwner = ctx.members.some(function (m) { return m.user_id === me.id && m.role === 'owner'; });
    v.innerHTML = crumb('Gestão do dinheiro') + '<div class="card"><h1>Gestão do dinheiro</h1><p class="muted">Como vocês querem administrar o dinheiro? Os registros financeiros existentes nunca são alterados.</p></div>' + moneyModeCard(me, ctx, isOwner);
    bindMoneyMode(me, isOwner);
  }
  function pSettingsPreferences(v, me) {
    v.innerHTML = crumb('Preferências') + '<div class="card"><h1>Preferências</h1><div id="e"></div>' +
      '<label>Visão financeira padrão</label><select id="pf-vis"><option value="couple">Casal</option><option value="me">Só eu</option></select>' +
      '<label>Período inicial da Visão Geral</label><select id="pf-ov"><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option></select>' +
      '<button class="btn" id="pf-sv">Salvar</button><p class="muted">Preferências deste aparelho; apagadas ao sair da conta.</p></div>';
    try {
      var d = JSON.parse(localStorage.getItem('juntos_dash_v3') || '{}');
      if (d.vision) document.getElementById('pf-vis').value = d.vision;
      var o = JSON.parse(localStorage.getItem('juntos_ov_v1') || '{}');
      if (o.mode) document.getElementById('pf-ov').value = o.mode;
    } catch (e) {}
    document.getElementById('pf-sv').onclick = function () {
      try {
        dash.vision = document.getElementById('pf-vis').value; dashPersist();
        ov.mode = document.getElementById('pf-ov').value; ovPersist();
        toast('Preferências salvas!');
      } catch (e2) { document.getElementById('e').innerHTML = err(e2); }
    };
  }
  function pSettingsProfile(v, me) {
    var av = me.avatar
      ? '<img class="avatar-img" src="' + me.avatar + '" alt="Foto de ' + esc(me.nome) + '" style="width:72px;height:72px;margin:0 auto">'
      : '<div class="avatar" style="width:72px;height:72px;font-size:32px;margin:0 auto">' + esc(me.nome.charAt(0).toUpperCase()) + '</div>';
    v.innerHTML = crumb('Meu perfil') + '<div class="card"><h1>Meu perfil</h1><div id="e"></div>' +
      '<div class="center">' + av + '<p><label class="link" for="f-av" style="cursor:pointer">Trocar foto</label>' +
      (me.avatar ? ' • <button class="link danger" id="av-rm">Remover</button>' : '') + '</p>' +
      '<input id="f-av" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" aria-label="Enviar foto de perfil"></div>' +
      '<label>Nome</label><input id="f-nm" value="' + esc(me.nome) + '"><label>E-mail</label><input value="' + esc(me.email) + '" disabled aria-describedby="em-ro"><p class="muted" id="em-ro">O e-mail é somente leitura nesta etapa.</p>' +
      '<p class="muted">Conta criada em ' + esc(dmy(me.created_at)) + '</p>' +
      '<button class="btn" id="sv">Salvar</button></div>' +
      '<div class="card"><b>Conta</b><p class="muted">Para trocar a senha, vá em <a href="#/settings/privacy">Privacidade e segurança</a>.</p>' +
      '<button class="btn ghost" id="out">Sair da conta</button></div>';
    document.getElementById('sv').onclick = function () { try { J.Auth.updateProfile(document.getElementById('f-nm').value); toast('Perfil atualizado!'); render('settings/profile'); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    document.getElementById('out').onclick = function () { J.Auth.logout(); };
    document.getElementById('f-av').onchange = function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (!f) return;
      if (['image/png', 'image/jpeg', 'image/webp', 'image/gif'].indexOf(f.type) < 0) { document.getElementById('e').innerHTML = err(new Error('Envie uma imagem PNG, JPG, WEBP ou GIF.')); return; }
      if (f.size > 300 * 1024) { document.getElementById('e').innerHTML = err(new Error('Imagem muito grande (máx 300 KB).')); return; }
      var rd = new FileReader();
      rd.onload = function () {
        try { J.Auth.setAvatar(rd.result); toast('Foto atualizada!'); render('settings/profile'); }
        catch (e3) { document.getElementById('e').innerHTML = err(e3); }
      };
      rd.readAsDataURL(f);
    };
    var rm = document.getElementById('av-rm');
    if (rm) rm.onclick = function () { try { J.Auth.setAvatar(null); toast('Foto removida.'); render('settings/profile'); } catch (e4) { document.getElementById('e').innerHTML = err(e4); } };
  }
  function pSettingsCouple(v, me) {
    var ctx = J.DB.myCouple(me.id);
    if (!ctx.couple) { location.hash = '#/onboarding'; return; }
    var isOwner = ctx.members.some(function (m) { return m.user_id === me.id && m.role === 'owner'; });
    var created = ctx.couple.created_at ? esc(dmy(ctx.couple.created_at)) : '—';
    v.innerHTML = crumb('Casal') + '<div class="card"><h1>Casal</h1><p class="muted">Gerencie a relação financeira e as configurações do seu casal.</p></div>' +
      '<div class="card"><h2>' + esc(ctx.couple.name) + '</h2><div id="e"></div><p class="muted">Criado em ' + created + ' • ' + ctx.users.length + ' participante(s)</p>' +
      ctx.users.map(function (u) {
        var r = ctx.members.find(function (m) { return m.user_id === u.id; });
        var you = u.id === me.id ? ' (você)' : '';
        return '<p><span class="avatar-sm" role="img" aria-label="' + esc(u.nome) + '">' + esc(u.nome.charAt(0).toUpperCase()) + '</span> <b>' + esc(u.nome) + you + '</b> <span class="pill">' + (r && r.role === 'owner' ? 'dono' : 'membro') + '</span><br><span class="muted">Ativo • desde ' + esc(dmy((r && r.joined_at) || u.created_at)) + '</span></p>';
      }).join('') +
      (isOwner ? '<label>Renomear casal</label><div class="row"><input id="f-cn" value="' + esc(ctx.couple.name) + '"><button class="btn" id="sv" style="max-width:120px">Salvar</button></div>' : '<p class="muted">Só quem criou pode renomear.</p>') + '</div>' +
      '<div class="card"><b>Convite</b><div id="inv-box">' + inviteSectionHtml(me) + '</div></div>' +
      moneyModeCard(me, ctx, isOwner);
    if (isOwner) document.getElementById('sv').onclick = function () {
      var db = J.DB.all(); db.couples.find(function (c) { return c.id === ctx.couple.id; }).name = document.getElementById('f-cn').value.trim() || ctx.couple.name;
      J.DB.save(db); toast('Nome atualizado!'); render('settings/couple');
    };
    bindInviteSection(v, me);
    bindMoneyMode(me, isOwner);
  }
  function inviteSectionHtml(me) {
    var list = J.DB.myInvites(me.id);
    var pend = list.find(function (i) { return i.status === 'pending' && new Date(i.expires_at) > new Date(); });
    var s = '<p class="muted">Compartilhe o código manualmente (sem e-mail nesta etapa). Uso único, máx. 2 participantes.</p><div id="e-inv"></div>';
    s += pend ? '<div class="code">' + esc(pend.code) + '</div><p class="muted">Válido até ' + esc(dmy(pend.expires_at)) + '</p><div class="row"><button class="btn ghost" id="cp">Copiar</button><button class="btn" id="nw">Gerar novo</button></div>'
      : '<button class="btn" id="nw">Gerar código JNT-XXXXXX</button>';
    if (list.length) s += '<p class="muted">Histórico:</p>' + list.slice(0, 5).map(function (i) { return '<p><b>' + esc(i.code) + '</b> <span class="pill">' + esc(i.status) + '</span><br><span class="muted">expira ' + esc(dmy(i.expires_at)) + '</span></p>'; }).join('');
    return s;
  }
  function bindInviteSection(v, me) {
    var nw = document.getElementById('nw');
    if (nw) nw.onclick = function () { try { J.DB.createInvite(me.id); render('settings/couple'); toast('Código gerado!'); } catch (e) { var b = document.getElementById('e-inv'); if (b) b.innerHTML = err(e); } };
    var cp = document.getElementById('cp');
    if (cp) cp.onclick = function () {
      var pend = J.DB.myInvites(me.id).find(function (i) { return i.status === 'pending' && new Date(i.expires_at) > new Date(); });
      if (!pend) return;
      try { navigator.clipboard.writeText(pend.code); toast('Código copiado!'); } catch (e) { toast('Anote: ' + pend.code); }
    };
  }
  function pSettingsFinancial(v, me) {
    var types = J.DB.INSIGHT_TYPES;
    var rows = '';
    try {
      var db = J.DB.all(), cid = J.DB.myCoupleId(me.id);
      rows = types.map(function (t) {
        var off = db.financial_insight_preferences.some(function (p) { return p.couple_id === cid && p.insight_type === t && !p.enabled && (p.user_id === null || p.user_id === me.id); });
        return '<div class="row between"><span>' + esc(t.replace(/_/g, ' ')) + '</span><button class="btn ghost sm" data-insp="' + t + '">' + (off ? 'Ativar' : 'Desativar') + '</button></div>';
      }).join('');
    } catch (e) { rows = '<p class="muted">Indisponível.</p>'; }
    var mode = J.DB.moneyMode(me.id);
    v.innerHTML = crumb('Preferências financeiras') + '<div class="card"><h1>Preferências financeiras</h1><p class="muted">Os valores são exibidos em reais (R$). Gestão atual do casal: <b>' + (mode === 'JOINT' ? 'Tudo junto' : 'Dinheiro separado') + '</b> (<a href="#/settings/couple">alterar</a>).</p></div>' +
      '<div class="card"><b>Tipos de insight</b><p class="muted">Quais análises automáticas aparecem para o casal.</p><div id="e-ins"></div>' + rows + '</div>';
    Array.prototype.forEach.call(v.querySelectorAll('[data-insp]'), function (b) {
      b.onclick = function () {
        try {
          var t = b.dataset.insp;
          var d2 = J.DB.all(), c2 = J.DB.myCoupleId(me.id);
          var isOff = d2.financial_insight_preferences.some(function (p) { return p.couple_id === c2 && p.insight_type === t && !p.enabled && (p.user_id === null || p.user_id === me.id); });
          J.DB.setInsightPreference(me.id, { insight_type: t, enabled: isOff });
          render('settings/financial');
        } catch (e2) { var eb = document.getElementById('e-ins'); if (eb) eb.innerHTML = err(e2); }
      };
    });
  }
  function pSettingsNotifPrefs(v, me) {
    v.innerHTML = crumb('Notificações') + '<div class="card"><h1>Notificações</h1><p class="muted">Controle como e quando os alertas chegam. Para ver as mensagens recebidas, abra <a href="#/notifications">Notificações</a>.</p></div>' + ntPrefsCard(me);
    bindNtPrefs(v, me);
  }
  function pSettingsWhatsapp(v, me) {
    v.innerHTML = crumb('WhatsApp') + '<div class="card"><h1>WhatsApp</h1><p class="muted">O WhatsApp é só um canal: seus dados continuam aqui.</p></div>' + waSettingsCard(me);
    bindWaSettings(v, me);
  }
  function pSettingsAssistant(v, me) {
    var convs = [];
    try { convs = J.DB.aiListConversations(me.id); } catch (e) { v.innerHTML = crumb('Assistente financeiro') + '<div class="card"><h1>Assistente financeiro</h1>' + err(e) + '</div>'; return; }
    v.innerHTML = crumb('Assistente financeiro') + '<div class="card"><h1>Assistente financeiro</h1><p class="muted">Para conversar, abra o <a href="#/assistant">Assistente</a>. Aqui você gerencia suas conversas. Os dados financeiros ficam intactos ao excluir uma conversa.</p></div>' +
      '<div class="card"><b>Conversas (' + convs.length + ')</b><div id="e-as"></div>' + (convs.length ? convs.map(function (c) {
        return '<div class="row between"><span><b>' + esc(c.title) + '</b>' + (c.status === 'archived' ? ' <span class="pill">arquivada</span>' : '') + '</span><span><button class="btn ghost sm" data-as-arch="' + c.id + '">Arquivar</button> <button class="btn ghost sm" data-as-del="' + c.id + '" style="color:var(--primary-d)">Excluir</button></span></div>';
      }).join('') : '<p class="muted">Nenhuma conversa ainda.</p>') + '</div>';
    Array.prototype.forEach.call(v.querySelectorAll('[data-as-arch]'), function (b) {
      b.onclick = function () { try { J.DB.aiArchiveConversation(me.id, b.dataset.asArch); render('settings/assistant'); } catch (e2) { toast('Não foi possível.'); } };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-as-del]'), function (b) {
      b.onclick = function () {
        if (!confirm('Excluir esta conversa? Os dados financeiros ficam intactos.')) return;
        try { J.DB.aiDeleteConversation(me.id, b.dataset.asDel); render('settings/assistant'); } catch (e2) { toast('Não foi possível.'); }
      };
    });
  }
  function pSettingsData(v, me) {
    var rows = [];
    try { rows = J.DB.listImportBatches(me.id, {}).slice(0, 5); } catch (e) { /* sem casal */ }
    v.innerHTML = crumb('Dados') + '<div class="card"><h1>Dados</h1><p class="muted">Importações e reconciliações. Para importar novos arquivos, abra <a href="#/imports">Importações</a>.</p></div>' +
      '<div class="card"><b>Últimas importações</b>' + (rows.length ? rows.map(function (b) {
        return '<a class="dash-link" href="#/imports/' + b.id + '"><p><b>📄 ' + esc(b.file_name) + '</b> <span class="pill">' + esc(b.status) + '</span><br><span class="muted">Total ' + b.total_rows + ' • novos ' + b.new_rows + ' • conciliados ' + b.matched_rows + ' • importados ' + b.imported_rows + '</span></p></a>';
      }).join('') : '<p class="muted">Nenhuma importação ainda.</p>') + '</div>';
  }
  function pSettingsCategories(v, me) {
    var tree = J.DB.getCategoryTree(me.id, '', true);
    function typePill(t) { return '<span class="pill">' + (t === 'income' ? 'receita' : t === 'expense' ? 'despesa' : 'ambos') + '</span>'; }
    function nodeHtml(c, isSub) {
      var n = J.DB.catTxCount(me.id, c.id);
      var st = c.active ? '' : ' <span class="pill">inativa</span>';
      return '<div class="card" style="margin:8px 0' + (isSub ? ';margin-left:20px' : '') + '"><div class="row between"><b>' + (isSub ? '└ ' : '') + esc(c.icon + ' ' + c.name) + '</b>' + typePill(c.type) + '</div>' +
        '<p class="muted">' + txNoun(n) + st + '</p>' +
        '<div class="row"><button class="btn ghost sm" data-ced="' + c.id + '">Editar</button>' +
        (c.active
          ? '<button class="btn ghost sm" data-ctx="' + c.id + '">' + (n ? 'Arquivar' : 'Desativar') + '</button>'
          : '<button class="btn ghost sm" data-cre="' + c.id + '">Reativar</button>') +
        '<button class="btn ghost sm" data-cdel="' + c.id + '" style="color:var(--primary-d)">Excluir</button>' +
        (!isSub ? '<button class="btn ghost sm" data-csub="' + c.id + '">+ Sub</button>' : '<button class="btn ghost sm" data-cmv="' + c.id + '">Mover</button>') +
        '</div></div>';
    }
    v.innerHTML = crumb('Categorias') + '<div class="card"><h1>Categorias</h1><p class="muted">Categoria principal + subcategoria (opcional, máx. 2 níveis). Desativar preserva o histórico.</p>' +
      '<div class="row"><button class="btn" id="cc-new">+ Nova categoria</button></div><div id="e-cat"></div></div>' +
      (tree.length ? tree.map(function (p) { return nodeHtml(p, false) + p.children.map(function (k) { return nodeHtml(k, true); }).join(''); }).join('') : '<div class="card empty"><div class="ico">🏷️</div><h2>Sem categorias</h2></div>');
    document.getElementById('cc-new').onclick = function () { openCategoryModal(me, null, null); };
    Array.prototype.forEach.call(v.querySelectorAll('[data-csub]'), function (b) { b.onclick = function () { openCategoryModal(me, null, b.dataset.csub); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ced]'), function (b) { b.onclick = function () { openCategoryModal(me, b.dataset.ced, null); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ctx]'), function (b) {
      b.onclick = function () {
        try { J.DB.archiveCategory(me.id, b.dataset.ctx); toast('Categoria arquivada. O histórico fica intacto.'); render('settings/categories'); }
        catch (e2) { document.getElementById('e-cat').innerHTML = err(e2); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-cre]'), function (b) {
      b.onclick = function () {
        try { J.DB.updateCategory(me.id, b.dataset.cre, { active: true }); toast('Categoria reativada!'); render('settings/categories'); }
        catch (e2) { document.getElementById('e-cat').innerHTML = err(e2); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-cdel]'), function (b) {
      b.onclick = function () {
        if (!confirm('Excluir? Com movimentações vinculadas, a categoria será desativada em vez de excluída (histórico preservado).')) return;
        try {
          var r = J.DB.deleteCategory(me.id, b.dataset.cdel);
          toast(r.archived ? 'Possui movimentações: desativada em vez de excluída.' : 'Categoria excluída.');
          render('settings/categories');
        } catch (e2) { document.getElementById('e-cat').innerHTML = err(e2); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-cmv]'), function (b) { b.onclick = function () { openCategoryMoveModal(me, b.dataset.cmv); }; });
  }
  function openCategoryModal(me, catId, parentId) {
    var c = catId ? J.DB.catGet(me.id, catId) : null;
    if (catId && !c) { toast('Categoria não encontrada.'); return; }
    var isSub = !!((c && c.parent_category_id) || parentId);
    var type = c ? c.type : 'expense';
    var treeType = '';
    if (c) treeType = c.type === 'both' ? '' : c.type;
    else if (parentId) { var pp = J.DB.catGet(me.id, parentId); treeType = (pp && pp.type === 'both') ? '' : (pp ? pp.type : 'expense'); }
    var tree = J.DB.getCategoryTree(me.id, treeType, true);
    var parentSel = (c && c.parent_category_id) || parentId || '';
    modalShell('<h2>' + (c ? 'Editar' : (isSub ? 'Nova subcategoria' : 'Nova categoria')) + '</h2><div id="me"></div>' +
      '<label>Tipo</label><select id="cf-t"' + (c ? ' disabled' : '') + '><option value="expense"' + (type === 'expense' ? ' selected' : '') + '>Despesa</option><option value="income"' + (type === 'income' ? ' selected' : '') + '>Receita</option><option value="both"' + (type === 'both' ? ' selected' : '') + '>Ambos</option></select>' +
      (isSub ? '<label>Categoria principal *</label><select id="cf-p">' + tree.map(function (p) { return '<option value="' + p.id + '"' + (p.id === parentSel ? ' selected' : '') + '>' + esc(p.icon + ' ' + p.name) + '</option>'; }).join('') + '</select>' : '') +
      '<label>Nome *</label><input id="cf-n" maxlength="60" value="' + esc(c ? c.name : '') + '" placeholder="' + (isSub ? 'Ex: Delivery' : 'Ex: Farmácia') + '">' +
      '<label>Ícone</label><input id="cf-i" maxlength="4" value="' + esc(c ? c.icon : '') + '" placeholder="🏷️">' +
      '<div class="row"><button class="btn" id="sv">' + (c ? 'Salvar' : 'Criar') + '</button><button class="btn ghost" id="cl">Cancelar</button></div>');
    document.getElementById('cl').onclick = closeModal;
    var tsel = document.getElementById('cf-t');
    if (tsel) tsel.onchange = function () {
      var psel = document.getElementById('cf-p');
      if (psel) {
        var tt = J.DB.getCategoryTree(me.id, tsel.value === 'both' ? '' : tsel.value, true);
        psel.innerHTML = tt.map(function (p) { return '<option value="' + p.id + '">' + esc(p.icon + ' ' + p.name) + '</option>'; }).join('') || '<option value="">Nenhuma principal deste tipo</option>';
      }
    };
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var payload = { name: document.getElementById('cf-n').value, icon: document.getElementById('cf-i').value || undefined };
        var psel2 = document.getElementById('cf-p');
        if (c) {
          if (psel2) payload.parent_category_id = psel2.value || null;
          J.DB.updateCategory(me.id, catId, payload);
          toast('Categoria atualizada!');
        } else {
          payload.type = document.getElementById('cf-t').value;
          if (psel2) payload.parent_category_id = psel2.value || null;
          J.DB.createCategory(me.id, payload);
          toast(isSub ? 'Subcategoria criada!' : 'Categoria criada!');
        }
        closeModal(); render('settings/categories');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openCategoryMoveModal(me, catId) {
    var c = J.DB.catGet(me.id, catId);
    if (!c) { toast('Categoria não encontrada.'); return; }
    var tree = J.DB.getCategoryTree(me.id, c.type === 'both' ? '' : c.type, true).filter(function (p) { return p.id !== catId; });
    modalShell('<h2>Mover subcategoria</h2><div id="me"></div>' +
      '<p>Mover <b>' + esc(c.icon + ' ' + c.name) + '</b> para outra categoria principal do mesmo tipo. O histórico é preservado.</p>' +
      '<label>Nova principal *</label><select id="cf-mp">' + tree.map(function (p) { return '<option value="' + p.id + '"' + (p.id === c.parent_category_id ? ' selected' : '') + '>' + esc(p.icon + ' ' + p.name) + '</option>'; }).join('') + '</select>' +
      '<div class="row"><button class="btn" id="sv">Mover</button><button class="btn ghost" id="cl">Cancelar</button></div>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        J.DB.updateCategory(me.id, catId, { parent_category_id: document.getElementById('cf-mp').value });
        closeModal(); toast('Subcategoria movida!'); render('settings/categories');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function pSettingsPrivacy(v, me) {
    var secs = [];
    try { secs = J.DB.listSecurityEvents(me.id, { limit: 10 }); } catch (e) { /* sem casal */ }
    v.innerHTML = crumb('Privacidade e segurança') + '<div class="card"><h1>Privacidade e segurança</h1><p class="muted">Seus dados ficam neste navegador (demonstração). Nenhum segredo é exibido aqui.</p></div>' +
      '<div class="card"><b>Alterar senha</b><div id="e-pw"></div><div id="pw-s1"><p class="muted">Geramos um código de 6 dígitos na tela (sem e-mail nesta etapa).</p><button class="btn ghost" id="pw-go">Gerar código</button></div>' +
      '<div id="pw-s2" class="hidden"><div class="code" id="pw-code"></div><label>Código</label><input id="pw-cd" inputmode="numeric"><label>Nova senha (6+ caracteres)</label><input id="pw-np" type="password"><button class="btn" id="pw-ok">Definir nova senha</button></div></div>' +
      '<div class="card"><b>Atividade recente</b>' + (secs.length ? secs.map(function (s) {
        return '<p><b>' + esc(s.action || s.event_type) + '</b> <span class="pill">' + esc(s.result || 'ok') + '</span><br><span class="muted">' + esc(dmy(s.created_at)) + ' • ' + esc(s.event_type) + '</span></p>';
      }).join('') : '<p class="muted">Nenhum evento registrado.</p>') + '</div>' +
      '<div class="card"><b>Dados locais</b><p class="muted">Apaga tudo deste navegador (demonstração).</p><button class="btn ghost" id="wipe" style="color:var(--primary-d)">Apagar dados locais</button></div>';
    document.getElementById('pw-go').onclick = function () {
      try {
        var c = J.Auth.forgot(me.email);
        document.getElementById('pw-s1').classList.add('hidden');
        document.getElementById('pw-s2').classList.remove('hidden');
        document.getElementById('pw-code').textContent = c;
        toast('Código gerado. Anote com carinho.');
      } catch (e2) { document.getElementById('e-pw').innerHTML = err(e2); }
    };
    document.getElementById('pw-ok').onclick = function () {
      try {
        J.Auth.reset(me.email, document.getElementById('pw-cd').value, document.getElementById('pw-np').value);
        toast('Senha atualizada!');
        render('settings/privacy');
      } catch (e2) { document.getElementById('e-pw').innerHTML = err(e2); }
    };
    document.getElementById('wipe').onclick = function () { if (confirm('Apagar tudo deste navegador?')) { localStorage.clear(); location.reload(); } };
  }
  function pSettingsAutomation(v, me) {
    var st = J.DB.automationStatus(me.id);
    var autoHtml = '<div class="card"><b>⚙️ Automação (diagnóstico técnico)</b>' +
      '<p class="muted">Jobs pendentes: <b>' + st.pending + '</b> • com erro: <b>' + st.failed + '</b>' +
      (st.lastRun ? ' • última execução: ' + esc(dmy(st.lastRun)) : ' • nenhuma execução ainda') + '</p>';
    if (st.failed) autoHtml += '<button class="btn ghost" id="au-retry">Tentar failed novamente</button>';
    autoHtml += '<button class="btn ghost" id="au-run">Executar verificação agora</button><div id="au-msg"></div>';
    autoHtml += st.recent.length ? st.recent.map(function (e) {
      return '<p><span class="pill">' + esc(e.status) + '</span> ' + esc(e.automation_type) + ' <span class="muted">' + esc(e.trigger_source) + (e.error_message ? ' • ' + esc(e.error_message) : '') + '</span></p>';
    }).join('') : '<p class="muted">Nenhuma execução registrada.</p>';
    autoHtml += '</div>';
    v.innerHTML = crumb('Automação') + '<div class="card"><h1>Automação</h1><p class="muted">Regras automáticas do casal. O motor de automação continua o mesmo.</p></div>' + autoHtml + rulesSection(me);
    bindRulesSection(v, me);
    var rt = document.getElementById('au-retry');
    if (rt) rt.onclick = function () { try { var n = J.DB.retryFailedJobs(me.id); toast(n ? n + ' job(s) para tentar de novo.' : 'Nada para repetir.'); render('settings/automation'); } catch (e) { toast('Não foi possível. Tente de novo.'); } };
    document.getElementById('au-run').onclick = function () {
      var btn = this; lock(btn);
      try {
        var s = J.DB.runScheduledScan(me.id, {});
        document.getElementById('au-msg').innerHTML = '<p class="muted">Verificação: ' + s.events + ' eventos, ' + s.jobs + ' jobs, ' + s.ran + ' executados.</p>';
        toast('Verificação concluída.');
      } catch (e) { document.getElementById('au-msg').innerHTML = err(e); unlock(btn); }
    };
  }
  /* ============ OPEN FINANCE DESATIVADO (flag central) ============
     Card preservado no código, mas nunca renderizado com a flag off. */
  function ofSettingsCard(me) {
    if (!J.DB.ofIsEnabled()) return '';
    var conns = [];
    try { conns = J.DB.ofListConnections(me.id); } catch (e) { return ''; }
    var s = '<div class="card"><b>🏦 Open Finance</b><p class="muted">Somente leitura: sincroniza extratos para a reconciliação existente. Nada entra no financeiro sem sua confirmação.</p>';
    if (!conns.length) s += '<p class="muted">Nenhum banco conectado.</p>';
    s += conns.map(function (c) {
      var accs = [];
      try { accs = J.DB.ofListBankAccounts(me.id, c.id); } catch (e2) {}
      var health = { status: 'attention', detail: '' };
      try { health = J.DB.ofConnectionHealth(me.id, c.id); } catch (e3) {}
      var runs = [];
      try { runs = J.DB.ofListSyncRuns(me.id, { connection_id: c.id, limit: 1 }); } catch (e4) {}
      var lr = runs[0] || null;
      return '<div class="card" style="margin:8px 0"><div class="row between"><b>' + esc(c.institution_name) + '</b><span class="pill' + (c.status === 'active' ? ' ok' : '') + '">' + esc(c.status) + '</span></div>' +
        '<p class="muted">' + esc(c.provider) + (c.last_sync_at ? ' • sincronizado em ' + esc(dmy(c.last_sync_at)) : ' • nunca sincronizado') + ' • saúde: <b>' + esc(health.status) + '</b>' + (health.detail ? ' (' + esc(health.detail) + ')' : '') +
        (lr ? '<br>Último sync: ' + esc(lr.status) + ' • +' + lr.transactions_new + ' novas, ' + lr.transactions_matched + ' conciliadas, ' + lr.transactions_conflicts + ' revisão' : '') + '</p>' +
        accs.map(function (a) {
          return '<p>• <b>' + esc(a.name) + '</b> <span class="muted">' + BRL(a.balance) + (a.linked_account_id ? ' → ' + esc(J.DB.accountName(me.id, a.linked_account_id)) : ' • sem vínculo') + '</span></p>';
        }).join('') +
        (c.status === 'active' ? '<div class="row"><button class="btn ghost sm" data-ofsync="' + c.id + '">Sincronizar</button><button class="btn ghost sm" data-oflink="' + c.id + '">Vincular conta</button><button class="btn ghost sm" data-ofimp="' + c.id + '">Conciliar</button><button class="btn ghost sm" data-ofoff="' + c.id + '" style="color:var(--primary-d)">Desconectar</button></div>' : '') + '</div>';
    }).join('');
    s += '<div class="row"><select id="of-prov" aria-label="Provedor"><option value="local-sim">local-sim (testes)</option><option value="belvo">Belvo</option><option value="pluggy">Pluggy</option></select><input id="of-inst" placeholder="Banco (ex: Nubank)" aria-label="Instituição" maxlength="80"></div><div class="row"><button class="btn ghost" id="of-conn">Conectar banco</button><a class="btn ghost" style="text-decoration:none;text-align:center" href="#/openfinance">Central de conciliação</a></div><div id="of-msg"></div></div>';
    return s;
  }
  function bindOfSettings(v, me) {
    var msg = function (t) { var m = document.getElementById('of-msg'); if (m) m.innerHTML = t; };
    var cn = document.getElementById('of-conn');
    if (cn) cn.onclick = function () {
      try {
        J.DB.ofConnect(me.id, { provider: document.getElementById('of-prov').value, institution_name: document.getElementById('of-inst').value });
        toast('Banco conectado!'); render('settings');
      } catch (e) { msg(err(e)); }
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-ofsync]'), function (b) {
      b.onclick = function () {
        try {
          var r = J.DB.ofSyncAccounts(me.id, b.dataset.ofsync, {});
          var t = J.DB.ofSyncTransactions(me.id, b.dataset.ofsync, {});
          toast('Sincronizado: ' + r.new + ' contas, ' + t.new + ' lançamentos.');
          render('settings');
        } catch (e) { toast(e.message || 'Não foi possível sincronizar.'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-oflink]'), function (b) {
      b.onclick = function () {
        try {
          var accs = J.DB.ofListBankAccounts(me.id, b.dataset.ofsync);
          if (!accs.length) { toast('Sincronize primeiro.'); return; }
          var mine = J.DB.listAccounts(me.id, 'active');
          if (!mine.length) { toast('Cadastre uma conta interna primeiro.'); return; }
          var names = mine.map(function (a, ix) { return (ix + 1) + '=' + a.name; }).join('\n');
          var pick = prompt('Vincular "' + accs[0].name + '" a qual conta?\n' + names + '\nDigite o número:');
          if (pick == null) return;
          var ix = parseInt(pick, 10) - 1;
          if (!mine[ix]) { toast('Opção inválida.'); return; }
          J.DB.ofLinkBankAccount(me.id, accs[0].id, mine[ix].id);
          toast('Conta vinculada!');
          render('settings');
        } catch (e) { toast(e.message || 'Não foi possível vincular.'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ofimp]'), function (b) {
      b.onclick = function () {
        try {
          var batch = J.DB.ofImportToReconciliation(me.id, b.dataset.ofsync, {});
          toast('Lote pronto para conciliação!');
          location.hash = '#/imports/' + batch.id;
        } catch (e) { toast(e.message || 'Não foi possível conciliar.'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ofoff]'), function (b) {
      b.onclick = function () {
        if (!confirm('Desconectar este banco? O histórico conciliado permanece.')) return;
        try { J.DB.ofDisconnect(me.id, b.dataset.ofoff); toast('Desconectado.'); render('settings'); }
        catch (e) { toast('Não foi possível. Tente de novo.'); }
      };
    });
  }
  /* ============ PROMPT 35: CENTRAL DE CONCILIAÇÃO OPEN FINANCE ============ */
  var ofF = { conn: '', status: '', acc: '' };
  function pOpenFinance(v, me) {
    var conns = J.DB.ofListConnections(me.id);
    var runs = J.DB.ofListSyncRuns(me.id, { limit: 1 });
    var last = runs[0] || null;
    var html = '<div class="card"><h1>Open Finance</h1>' +
      '<p class="muted">Fonte externa somente leitura. Nada entra no financeiro sem conciliação e confirmação.</p>' +
      (last ? '<p class="muted">Última sincronização: <b>' + esc(last.status) + '</b> • ' + last.transactions_new + ' novas, ' + last.transactions_matched + ' conciliadas, ' + last.transactions_conflicts + ' para revisão' + (last.completed_at ? ' • ' + esc(dueLabel(last.completed_at)) : '') + '</p>'
        : '<p class="muted">Nenhuma sincronização ainda.</p>') +
      '<div class="row"><select id="of-fconn" aria-label="Conexão"><option value="">Todas as conexões</option>' + conns.map(function (c) { return '<option value="' + c.id + '"' + (ofF.conn === c.id ? ' selected' : '') + '>' + esc(c.institution_name) + '</option>'; }).join('') + '</select>' +
      '<select id="of-fstatus" aria-label="Estado"><option value="">Todos os estados</option>' + ['new', 'suggested', 'conflict', 'duplicate', 'resolved'].map(function (s) { return '<option value="' + s + '"' + (ofF.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><button class="btn ghost" id="of-syncall">Sincronizar agora</button><a class="btn ghost" style="text-decoration:none;text-align:center" href="#/settings">Gerenciar conexões</a></div><div id="e"></div></div>';
    try {
      var db = J.DB.all();
      var staged = db.openfinance_bank_transactions.filter(function (t) {
        return J.DB.myCoupleId(me.id) && t.couple_id === J.DB.myCoupleId(me.id) && (!ofF.conn || t.connection_id === ofF.conn);
      }).sort(function (a, b) { return (b.date + b.id).localeCompare(a.date + a.id); });
      var groups = { new: [], suggested: [], conflict: [], duplicate: [], resolved: [] };
      staged.forEach(function (t) {
        if (t.canonical_transaction_id) { groups.resolved.push(t); return; }
        if ((t.ext_status || 'posted') === 'cancelled') { groups.conflict.push(t); return; }
        var cands = [];
        try { cands = J.DB.ofFindCandidates(me.id, t.id, 3); } catch (e) {}
        var top = cands[0] || null;
        if (!top) groups.new.push(t);
        else if (top.score >= 0.98) groups.duplicate.push({ t: t, cands: cands });
        else if (top.score >= 0.75) groups.suggested.push({ t: t, cands: cands });
        else groups.conflict.push(t);
      });
      function row(e, extra) {
        var t = e.t || e;
        var conn = conns.filter(function (c) { return c.id === t.connection_id; })[0];
        return '<div class="card" style="margin:8px 0"><div class="row between"><b>' + esc(t.description) + '</b><b>' + BRL(t.amount) + '</b></div>' +
          '<p class="muted">' + esc(dueLabel(t.date)) + ' • ' + esc(conn ? conn.institution_name : '') + ' • ' + esc(t.ext_status || 'posted') + (t.canonical_transaction_id ? ' • <b class="pos">conciliada</b>' : '') + '</p>' + (extra || '') +
          '<div class="row"><button class="btn ghost sm" data-ofdet="' + t.id + '">Detalhe</button>' +
          (!t.canonical_transaction_id && (t.ext_status || 'posted') !== 'cancelled' ? '<button class="btn ghost sm" data-ofign="' + t.id + '">Ignorar</button>' : '') + '</div><div id="ofd-' + t.id + '"></div></div>';
      }
      function show(list, title, empty) {
        if (ofF.status && ofF.status !== 'all' && title.toLowerCase().indexOf(ofF.status) < 0) return '';
        if (title === 'Novas' && ofF.status && ofF.status !== 'new') return '';
        if (!list.length) return '<div class="card"><b>' + title + '</b><p class="muted">' + empty + '</p></div>';
        return '<div class="card"><b>' + title + ' (' + list.length + ')</b>' + list.slice(0, 20).map(function (e) { return row(e); }).join('') + '</div>';
      }
      html += show(groups.new, 'Novas transações', 'Nada novo sem correspondente.');
      html += show(groups.suggested, 'Correspondências sugeridas', 'Sem sugestões.');
      html += show(groups.conflict, 'Conflitos', 'Sem conflitos.');
      html += show(groups.duplicate, 'Duplicidades', 'Sem duplicidades.');
      html += show(groups.resolved, 'Resolvidos', 'Nada resolvido ainda.');
      var exs = J.DB.ofListExceptions(me.id, { status: 'open', limit: 10 });
      if (exs.length && (!ofF.status || ofF.status === 'conflict')) {
        html += '<div class="card"><b>Exceções (' + exs.length + ')</b>' + exs.map(function (x) {
          return '<p><b>' + esc(x.exception_type) + '</b> <span class="muted">' + esc(x.severity) + '</span><br>' + esc(x.description) + ' <button class="btn ghost sm" data-ofex="' + x.id + '">Resolver</button></p>';
        }).join('') + '</div>';
      }
    } catch (e) { html += '<div class="card">' + err(e) + '</div>'; }
    v.innerHTML = html;
    document.getElementById('of-fconn').onchange = function (e) { ofF.conn = e.target.value; render('openfinance'); };
    document.getElementById('of-fstatus').onchange = function (e) { ofF.status = e.target.value; render('openfinance'); };
    document.getElementById('of-syncall').onclick = function () {
      try {
        var list = J.DB.ofListConnections(me.id).filter(function (c) { return c.status === 'active' && (!ofF.conn || c.id === ofF.conn); });
        if (!list.length) { toast('Nenhuma conexão ativa.'); return; }
        var r = J.DB.ofSyncNow(me.id, list[0].id, {});
        toast('Sincronizado: ' + r.new + ' novas, ' + r.matched + ' conciliadas.');
        render('openfinance');
      } catch (e2) { document.getElementById('e').innerHTML = err(e2); }
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-ofdet]'), function (b) {
      b.onclick = function () {
        var host = document.getElementById('ofd-' + b.dataset.ofdet);
        try {
          var t = J.DB.all().openfinance_bank_transactions.filter(function (x) { return x.id === b.dataset.ofdet && x.couple_id === J.DB.myCoupleId(me.id); })[0];
          var cands = J.DB.ofFindCandidates(me.id, t.id, 5);
          host.innerHTML = '<div class="card" style="margin:8px 0;background:#fafaf9"><div class="row"><div style="flex:1"><b>OPEN FINANCE</b><p class="muted">' + esc(t.description) + '<br>' + esc(dueLabel(t.date)) + ' • <b>' + BRL(t.amount) + '</b><br>ID externo: ' + esc(t.external_id) + '</p></div>' +
            '<div style="flex:1"><b>SISTEMA</b>' + (cands.length ? cands.map(function (c) {
              return '<p>' + esc(c.label) + ' <b>' + BRL(c.score) + '</b><br><button class="btn ghost sm" data-ofuse="' + t.id + '|' + c.kind + '|' + c.id + '">Usar esta</button></p>';
            }).join('') : '<p class="muted">Sem correspondente. <button class="btn ghost sm" data-ofnew="' + t.id + '">Importar como nova</button></p>') + '</div></div></div>';
          Array.prototype.forEach.call(host.querySelectorAll('[data-ofuse]'), function (u) {
            u.onclick = function () {
              try {
                var p = u.dataset.ofuse.split('|');
                J.DB.ofCreateMatchSuggestion(me.id, p[0], p[1], p[2]);
                var m = J.DB.all().reconciliation_matches.filter(function (x) { return x.source_record_id === p[0] && x.status === 'pending' && x.couple_id === J.DB.myCoupleId(me.id); }).slice(-1)[0];
                if (m) J.DB.ofResolveMatch(me.id, m.id, true);
                toast('Conciliado!');
                render('openfinance');
              } catch (e3) { toast(e3.message || 'Não foi possível.'); }
            };
          });
          Array.prototype.forEach.call(host.querySelectorAll('[data-ofnew]'), function (u) {
            u.onclick = function () {
              try {
                var batch = J.DB.ofImportToReconciliation(me.id, t.connection_id, {});
                location.hash = '#/imports/' + batch.id;
              } catch (e3) { toast(e3.message || 'Não foi possível.'); }
            };
          });
        } catch (e4) { host.innerHTML = err(e4); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ofign]'), function (b) {
      b.onclick = function () {
        try { J.DB.ofCreateException(me.id, ((J.DB.all().openfinance_bank_transactions.filter(function (x) { return x.id === b.dataset.ofign && x.couple_id === J.DB.myCoupleId(me.id); })[0] || {}).connection_id), b.dataset.ofign, null, 'manual_review_required', 'info', 'Ignorado pelo usuário na central.'); toast('Ignorado.'); render('openfinance'); }
        catch (e) { toast('Não foi possível.'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ofex]'), function (b) {
      b.onclick = function () {
        if (!confirm('Marcar exceção como resolvida?')) return;
        try { J.DB.ofResolveException(me.id, b.dataset.ofex, 'resolved', 'Revisado na central.'); toast('Resolvida.'); render('openfinance'); }
        catch (e) { toast('Não foi possível.'); }
      };
    });
  }
  /* ============ PROMPT 17: UI DE REGRAS ============ */
  var ruleWiz = null;
  function ruleTriggerFields(trigger) {
    var e = J.DB.RULE_TRIGGER_ENTITY[trigger];
    return (J.DB.RULE_FIELDS[e] || []).map(function (f) { return { id: f, label: ruleFieldLabel(f) }; });
  }
  function ruleFieldLabel(f) {
    var m = { description: 'Descrição', type: 'Tipo', amount: 'Valor', category_id: 'Categoria', category_name: 'Nome da categoria', created_by: 'Criado por', payer_user_id: 'Pagador', is_shared: 'Compartilhada', account_id: 'Conta', credit_card_id: 'Cartão', date: 'Data', from_account_id: 'Conta origem', to_account_id: 'Conta destino', total_amount: 'Valor total', status: 'Status', due_date: 'Vencimento', installment_number: 'Nº parcela', frequency: 'Frequência', pct: 'Percentual usado', spent: 'Gasto', remaining: 'Restante', progress: 'Progresso', current: 'Valor atual', target: 'Objetivo' };
    return m[f] || f;
  }
  function ruleOpLabel(o) {
    var m = { equals: 'é igual a', not_equals: 'é diferente de', contains: 'contém', not_contains: 'não contém', starts_with: 'começa com', ends_with: 'termina com', greater_than: 'maior que', greater_than_or_equal: 'maior ou igual a', less_than: 'menor que', less_than_or_equal: 'menor ou igual a', between: 'entre (min,max)', in: 'é um de (a,b,c)', not_in: 'não é um de', is_empty: 'está vazio', is_not_empty: 'não está vazio' };
    return m[o] || o;
  }
  function rulesSection(me) {
    var rules = J.DB.listRules(me.id, true);
    var s = '<div class="card"><b>🤖 Regras automáticas</b><p class="muted">Crie regras para automatizar tarefas repetitivas nas suas finanças.</p>';
    s += '<div class="row"><button class="btn" id="rl-new">+ Nova regra</button><button class="btn ghost" id="rl-sug">Ver sugestões</button></div><div id="rl-e"></div>';
    if (!rules.length) s += '<p class="muted">Nenhuma regra ainda. Ex: "Uber → Transporte".</p>';
    s += rules.map(function (r) {
      var acts = r.actions.map(function (a) { return J.DB.ruleActionLabel(a.type); }).join(', ');
      return '<div class="card" style="margin:8px 0"><div class="row between"><b>' + esc(r.name) + '</b>' + (r.active ? '<span class="pill ok">● Ativa</span>' : '<span class="pill">○ Inativa</span>') + '</div>' +
        '<p class="muted">Quando: ' + esc(J.DB.ruleTriggerLabel(r.trigger_type)) + ' • ' + r.conditions.length + (r.conditions.length === 1 ? ' condição' : ' condições') + ' (' + (r.condition_operator === 'OR' ? 'qualquer' : 'todas') + ')<br>Fazer: ' + esc(acts) + ' • prioridade ' + r.priority +
        (r.last_executed_at ? '<br>Última execução: ' + esc(dmy(r.last_executed_at)) : '<br>Nunca executada') + '</p>' +
        '<div class="row"><button class="btn ghost" data-rlh="' + r.id + '">Histórico</button><button class="btn ghost" data-rle="' + r.id + '">Editar</button><button class="btn ghost" data-rld="' + r.id + '">Duplicar</button></div>' +
        '<div class="row"><button class="btn ghost" data-rlt="' + r.id + '">' + (r.active ? 'Desativar' : 'Ativar') + '</button><button class="btn ghost" data-rlx="' + r.id + '" style="color:var(--primary-d)">Excluir</button></div></div>';
    }).join('');
    return s + '</div>';
  }
  function bindRulesSection(v, me) {
    var nw = document.getElementById('rl-new');
    if (nw) nw.onclick = function () { ruleWiz = { step: 1, editId: null, data: { name: '', description: '', active: true, priority: 10, trigger_type: 'transaction_created', condition_operator: 'AND', conditions: [], actions: [] } }; paintRuleWiz(me); };
    var sg = document.getElementById('rl-sug');
    if (sg) sg.onclick = function () {
      try {
        var made = J.DB.seedSuggestedRules(me.id);
        toast(made.length ? made.length + ' sugestões adicionadas (inativas).' : 'Sugestões já existem.');
        render('settings/automation');
      } catch (e) { document.getElementById('rl-e').innerHTML = err(e); }
    };
    function act(sel, fn) {
      Array.prototype.forEach.call(v.querySelectorAll(sel), function (b) { b.onclick = function () { fn(b); }; });
    }
    act('[data-rlh]', function (b) { openRuleHistory(me, b.dataset.rlh); });
    act('[data-rle]', function (b) {
      var r = J.DB.getRule(me.id, b.dataset.rle);
      ruleWiz = { step: 1, editId: r.id, data: { name: r.name, description: r.description, active: r.active, priority: r.priority, trigger_type: r.trigger_type, condition_operator: r.condition_operator, conditions: JSON.parse(JSON.stringify(r.conditions)), actions: JSON.parse(JSON.stringify(r.actions)) } };
      paintRuleWiz(me);
    });
    act('[data-rld]', function (b) {
      try { J.DB.duplicateRule(me.id, b.dataset.rld); toast('Regra duplicada (inativa).'); render('settings/automation'); }
      catch (e) { document.getElementById('rl-e').innerHTML = err(e); }
    });
    act('[data-rlt]', function (b) {
      try {
        var r = J.DB.getRule(me.id, b.dataset.rlt);
        J.DB.enableRule(me.id, r.id, !r.active);
        toast(r.active ? 'Regra desativada.' : 'Regra ativada!');
        render('settings/automation');
      } catch (e) { document.getElementById('rl-e').innerHTML = err(e); }
    });
    act('[data-rlx]', function (b) {
      if (!confirm('Excluir esta regra? O histórico de execuções será mantido.')) return;
      try { J.DB.deleteRule(me.id, b.dataset.rlx); toast('Regra excluída.'); render('settings/automation'); }
      catch (e) { document.getElementById('rl-e').innerHTML = err(e); }
    });
  }
  function paintRuleWiz(me) {
    var w = ruleWiz, d = w.data;
    var titles = { 1: 'Etapa 1 — Nome', 2: 'Etapa 2 — Quando', 3: 'Etapa 3 — Condições', 4: 'Etapa 4 — Fazer', 5: 'Etapa 5 — Ativação' };
    var body = '<h2>' + (w.editId ? 'Editar regra' : 'Nova regra') + '</h2><p class="muted">' + titles[w.step] + ' (' + w.step + '/5)</p><div id="me"></div>';
    if (w.step === 1) {
      body += '<label>Nome *</label><input id="w-n" maxlength="80" value="' + esc(d.name) + '" placeholder="Ex: Uber para Transporte">' +
        '<label>Descrição</label><input id="w-d" maxlength="300" value="' + esc(d.description) + '">' +
        '<div class="row"><div><label>Prioridade (1 = máxima)</label><input id="w-p" type="number" min="1" max="100" value="' + d.priority + '"></div>' +
        '<div><label>Status</label><select id="w-a"><option value="1"' + (d.active ? ' selected' : '') + '>Ativa</option><option value="0"' + (!d.active ? ' selected' : '') + '>Inativa</option></select></div></div>';
    } else if (w.step === 2) {
      body += '<label>Quando acontecer... *</label><select id="w-t">' + J.DB.RULE_TRIGGERS.map(function (t) {
        return '<option value="' + t + '"' + (d.trigger_type === t ? ' selected' : '') + '>' + J.DB.ruleTriggerLabel(t) + '</option>';
      }).join('') + '</select><p class="muted">A regra vale para novos eventos desse tipo.</p>';
    } else if (w.step === 3) {
      body += '<label>Combinar: </label><div class="seg"><button id="w-and" class="' + (d.condition_operator === 'AND' ? 'on' : '') + '">TODAS</button><button id="w-or" class="' + (d.condition_operator === 'OR' ? 'on' : '') + '">QUALQUER</button></div><div id="w-conds">' +
        d.conditions.map(function (c, i) {
          return '<div class="card" style="margin:6px 0"><b>' + esc(ruleFieldLabel(c.field)) + '</b> ' + esc(ruleOpLabel(c.operator)) + ' <b>' + esc(String(c.value)) + '</b> <button class="link danger" data-wcx="' + i + '">remover</button></div>';
        }).join('') + '</div>' +
        '<div class="row"><select id="w-cf" aria-label="Campo">' + ruleTriggerFields(d.trigger_type).map(function (f) { return '<option value="' + f.id + '">' + f.label + '</option>'; }).join('') + '</select>' +
        '<select id="w-co" aria-label="Operador">' + J.DB.RULE_OPERATORS.map(function (o) { return '<option value="' + o + '">' + ruleOpLabel(o) + '</option>'; }).join('') + '</select></div>' +
        '<div class="row"><input id="w-cv" placeholder="Valor (ex: Uber, 500, true)"><button class="btn" id="w-cadd" style="max-width:130px">Adicionar</button></div>' +
        '<p class="muted">Texto: sem diferenciar maiúsculas. Valores: use ponto decimal. Datas: aaaa-mm-dd.</p>';
    } else if (w.step === 4) {
      body += '<div id="w-acts">' + d.actions.map(function (a, i) {
        return '<div class="card" style="margin:6px 0"><b>' + esc(J.DB.ruleActionLabel(a.type)) + '</b>' +
          (a.type === 'set_category' ? ' → ' + esc(J.DB.catName(me.id, a.category_id)) : '') +
          ((a.type === 'set_description' || a.type === 'add_note') ? ': ' + esc(a.text || '') : '') +
          ' <button class="link danger" data-wax="' + i + '">remover</button></div>';
      }).join('') + '</div>' +
        '<div class="row"><select id="w-at" aria-label="Ação">' + J.DB.RULE_ACTIONS.map(function (a) { return '<option value="' + a + '">' + J.DB.ruleActionLabel(a) + '</option>'; }).join('') + '</select><button class="btn" id="w-aadd" style="max-width:130px">Adicionar</button></div><div id="w-apar"></div>';
    } else {
      var prev = '';
      try {
        var t0 = J.DB.testRule(me.id, Object.assign({ trigger_type: d.trigger_type }, d));
        prev = '<p class="muted">Encontramos <b>' + t0.matched + '</b> registro(s) compatíveis (de ' + t0.total + ' verificados). Nada será alterado agora.</p>' +
          (t0.sample.length ? t0.sample.map(function (s) { return '<p>• ' + esc(s.label) + '</p>'; }).join('') : '');
      } catch (e2) { prev = '<div class="alert">' + esc(e2.message) + '</div>'; }
      body += '<p><b>' + esc(d.name || '(sem nome)') + '</b><br><span class="muted">Quando: ' + esc(J.DB.ruleTriggerLabel(d.trigger_type)) + ' • ' + d.conditions.length + ' condição(ões) (' + d.condition_operator + ')<br>Fazer: ' + d.actions.map(function (a) { return J.DB.ruleActionLabel(a.type); }).join(', ') + '<br>Prioridade ' + d.priority + ' • ' + (d.active ? 'Ativa' : 'Inativa') + '</span></p>' + prev +
        '<button class="btn ghost" id="w-test">Testar regra (simulação)</button><div id="w-tres"></div>';
    }
    body += '<div class="row"><button class="btn ghost" id="w-bk">' + (w.step === 1 ? 'Cancelar' : 'Voltar') + '</button>';
    body += w.step < 5 ? '<button class="btn" id="w-nx">Continuar</button>' : '<button class="btn" id="w-sv">Salvar regra</button>';
    body += '</div>';
    modalShell(body);
    function collect() {
      if (w.step === 1) { d.name = document.getElementById('w-n').value; d.description = document.getElementById('w-d').value; d.priority = document.getElementById('w-p').value; d.active = document.getElementById('w-a').value === '1'; }
      if (w.step === 2) { d.trigger_type = document.getElementById('w-t').value; }
    }
    document.getElementById('w-bk').onclick = function () {
      collect();
      if (w.step === 1) { closeModal(); ruleWiz = null; return; }
      w.step--; paintRuleWiz(me);
    };
    var nx = document.getElementById('w-nx');
    if (nx) nx.onclick = function () { collect(); w.step++; paintRuleWiz(me); };
    if (w.step === 3) {
      document.getElementById('w-and').onclick = function () { d.condition_operator = 'AND'; paintRuleWiz(me); };
      document.getElementById('w-or').onclick = function () { d.condition_operator = 'OR'; paintRuleWiz(me); };
      document.getElementById('w-cadd').onclick = function () {
        d.conditions.push({ field: document.getElementById('w-cf').value, operator: document.getElementById('w-co').value, value: document.getElementById('w-cv').value });
        paintRuleWiz(me);
      };
      Array.prototype.forEach.call(document.querySelectorAll('[data-wcx]'), function (b) { b.onclick = function () { d.conditions.splice(parseInt(b.dataset.wcx, 10), 1); paintRuleWiz(me); }; });
    }
    if (w.step === 4) {
      document.getElementById('w-aadd').onclick = function () {
        var tp = document.getElementById('w-at').value;
        if (tp === 'set_category') {
          document.getElementById('w-apar').innerHTML = '<div class="row"><select id="w-ac">' + catOptions(me, '') + '</select><button class="btn" id="w-acok" style="max-width:110px">OK</button></div>';
          document.getElementById('w-acok').onclick = function () { d.actions.push({ type: 'set_category', category_id: document.getElementById('w-ac').value }); paintRuleWiz(me); };
        } else if (tp === 'set_description' || tp === 'add_note') {
          document.getElementById('w-apar').innerHTML = '<div class="row"><input id="w-atx" placeholder="Texto"><button class="btn" id="w-atok" style="max-width:110px">OK</button></div>';
          document.getElementById('w-atok').onclick = function () { d.actions.push({ type: tp, text: document.getElementById('w-atx').value }); paintRuleWiz(me); };
        } else {
          d.actions.push({ type: tp }); paintRuleWiz(me);
        }
      };
      Array.prototype.forEach.call(document.querySelectorAll('[data-wax]'), function (b) { b.onclick = function () { d.actions.splice(parseInt(b.dataset.wax, 10), 1); paintRuleWiz(me); }; });
    }
    if (w.step === 5) {
      var tst = document.getElementById('w-test');
      if (tst) tst.onclick = function () {
        try {
          var t = J.DB.testRule(me.id, Object.assign({ trigger_type: d.trigger_type }, d));
          document.getElementById('w-tres').innerHTML = '<p class="muted">Simulação: <b>' + t.matched + '</b> de ' + t.total + ' seriam afetados. Faria: ' + t.actions.join(', ') + '. Nada foi alterado.</p>';
        } catch (e2) { document.getElementById('w-tres').innerHTML = err(e2); }
      };
      document.getElementById('w-sv').onclick = function () {
        var btn = this; lock(btn);
        try {
          var payload = { name: d.name, description: d.description, active: d.active, priority: d.priority, trigger_type: d.trigger_type, condition_operator: d.condition_operator, conditions: d.conditions, actions: d.actions };
          if (w.editId) J.DB.updateRule(me.id, w.editId, payload); else J.DB.createRule(me.id, payload);
          closeModal(); ruleWiz = null; toast(w.editId ? 'Regra atualizada!' : 'Regra criada! 🤖'); render('settings/automation');
        } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
      };
    }
  }
  function openRuleHistory(me, ruleId) {
    var rows;
    try { rows = J.DB.listRuleExecutions(me.id, ruleId, 20); }
    catch (e) { toast('Regra não encontrada.'); return; }
    modalShell('<h2>Histórico da regra</h2>' +
      (rows.length ? rows.map(function (x) {
        return '<p><span class="pill">' + esc(x.status) + '</span> ' + (x.action ? esc(J.DB.ruleActionLabel(x.action)) + ' • ' : '') +
          (x.before_data != null || x.after_data != null ? esc(JSON.stringify(x.before_data)) + ' → ' + esc(JSON.stringify(x.after_data)) : esc(x.reason || (x.matched ? 'confere' : 'não confere'))) +
          (x.error_message ? '<br><span class="muted">' + esc(x.error_message) + '</span>' : '') +
          '<br><span class="muted">' + esc(dmy(x.executed_at)) + '</span></p>';
      }).join('') : '<p class="muted">Nenhuma execução ainda.</p>') +
      '<button class="btn" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
  }
  function reviewSuggestionsHtml(me) {
    var total = J.DB.listSuggestions(me.id, { status: 'pending' });
    var rows = total.slice(0, 20);
    var html = '<details class="card"' + (rows.length ? ' open' : '') + '><summary><b>💡 Revisar categorias (' + total.length + ')</b></summary><div id="sg-list">';
    if (!rows.length) return html + '<p class="muted">Nenhuma sugestão pendente. Transações em “Outros” geram sugestões automáticas.</p></div></details>';
    html += rows.map(function (s) {
      var tx;
      try { tx = J.DB.getTx(me.id, s.transaction_id); } catch (e) { return ''; }
      var pct = Math.round(s.confidence_score * 100);
      var ruleHint = '';
      try {
        if (J.DB.suggestRuleCreation(me.id, { description: tx.description })) ruleHint = '<button class="btn ghost" data-sgrule="' + s.id + '">Criar regra</button>';
      } catch (e2) { /* sem hint */ }
      return '<div class="card" style="margin:8px 0"><b>' + esc(tx.description) + '</b> <span class="muted">' + BRL(tx.amount) + '</span><p>' + esc(J.DB.catDisplayName(me.id, tx.category_id)) + ' → <b>' + esc(J.DB.catDisplayName(me.id, s.suggested_category_id)) + ' (' + pct + '%)</b><br><span class="muted">' + esc(s.reason) + '</span></p><div class="row"><button class="btn ghost" data-sgok="' + s.id + '">Aceitar</button><button class="btn ghost" data-sgother="' + s.id + '">Outra</button><button class="btn ghost" data-sgno="' + s.id + '">Ignorar</button>' + ruleHint + '</div></div>';
    }).join('') + '</div></details>';
    return html;
  }
  function bindReviewSuggestions(v, me) {
    function each(sel, fn) { Array.prototype.forEach.call(v.querySelectorAll(sel), function (b) { b.onclick = function () { fn(b); }; }); }
    each('[data-sgok]', function (b) {
      try { J.DB.acceptSuggestion(me.id, b.dataset.sgok); toast('Categoria aplicada! ✅'); render('transactions'); }
      catch (e) { toast(e.message || 'Não foi possível aplicar.'); }
    });
    each('[data-sgno]', function (b) {
      try { J.DB.rejectSuggestion(me.id, b.dataset.sgno); toast('Sugestão ignorada.'); render('transactions'); }
      catch (e) { toast(e.message || 'Não foi possível.'); }
    });
    each('[data-sgother]', function (b) { openCorrectModal(me, b.dataset.sgother); });
    each('[data-sgrule]', function (b) {
      try {
        var s = J.DB.getSuggestion(me.id, b.dataset.sgrule);
        var tx = J.DB.getTx(me.id, s.transaction_id);
        var rh = J.DB.suggestRuleCreation(me.id, { description: tx.description });
        if (!rh) { toast('Sem padrão consistente para regra.'); return; }
        ruleWiz = { step: 1, editId: null, data: Object.assign({ description: 'Sugerida pelo histórico.' }, rh.draft) };
        paintRuleWiz(me);
      } catch (e) { toast(e.message || 'Não foi possível.'); }
    });
  }
  function openCorrectModal(me, suggestionId) {
    var s;
    try { s = J.DB.getSuggestion(me.id, suggestionId); }
    catch (e) { toast('Sugestão não encontrada.'); return; }
    var cats = J.DB.myCategories(me.id, '');
    modalShell('<h2>Corrigir categoria</h2><div id="me"></div>' +
      '<p class="muted">Sugestão: <b>' + esc(J.DB.catDisplayName(me.id, s.suggested_category_id)) + '</b></p>' +
      '<label>Categoria correta *</label><select id="f-cx">' + catOptions(me, '') + '</select>' +
      '<button class="btn" id="sv">Aplicar correção</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        J.DB.correctSuggestion(me.id, suggestionId, document.getElementById('f-cx').value);
        closeModal(); toast('Correção aplicada e registrada. 🎯'); render('transactions');
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  /* ============ PROMPT 19: IMPORTAÇÃO (UI) ============ */
  var impF = { type: '', status: '', account: '' };
  var impTab = 'all';
  function pImports(v, me) {
    var accs = J.DB.listAccounts(me.id, 'all');
    var cards = J.DB.listCards(me.id, 'active');
    var rows = J.DB.listImportBatches(me.id, { file_type: impF.type || undefined, status: impF.status || undefined, account_id: impF.account || undefined });
    var html = '<div class="card"><h1>Importações</h1><p class="muted">Traga extratos ou faturas em CSV/OFX. Nada vira lançamento sem sua confirmação.</p>' +
      '<label>O que você deseja importar? *</label><div class="row"><label><input type="radio" name="im-src" value="bank_statement" checked> Extrato bancário</label><label><input type="radio" name="im-src" value="credit_card_statement"> Fatura de cartão</label></div>' +
      '<label>Arquivo (.csv ou .ofx) *</label><input id="im-file" type="file" accept=".csv,.ofx,.txt">' +
      '<div id="im-bankbox"><label>Conta de destino *</label><select id="im-acc">' + accs.filter(function (a) { return a.active; }).map(function (a) { return '<option value="' + a.id + '">' + esc(a.name) + '</option>'; }).join('') + '</select></div>' +
      '<div id="im-cardbox" style="display:none"><label>Cartão da fatura *</label><select id="im-card">' + (cards.length ? cards.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + (c.last_four_digits ? ' •••• ' + esc(c.last_four_digits) : '') + '</option>'; }).join('') : '<option value="">Nenhum cartão ativo</option>') + '</select></div>' +
      '<div id="im-map"></div><div id="e"></div>' +
      '<button class="btn" id="im-go">Ler arquivo</button></div>';
    html += '<div class="card"><div class="row"><select id="im-ft" aria-label="Tipo"><option value="">CSV + OFX</option><option value="csv"' + (impF.type === 'csv' ? ' selected' : '') + '>CSV</option><option value="ofx"' + (impF.type === 'ofx' ? ' selected' : '') + '>OFX</option></select>' +
      '<select id="im-fs" aria-label="Status"><option value="">Todos status</option>' + ['uploaded', 'preview', 'ready', 'processing', 'completed', 'partially_completed', 'failed', 'cancelled'].map(function (s) { return '<option value="' + s + '"' + (impF.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div></div>';
    html += rows.length ? rows.map(function (b) {
      var isCard = (b.import_source_type || 'bank_statement') === 'credit_card_statement';
      var where = isCard ? ('💳 ' + esc(J.DB.cardName(me.id, b.credit_card_id))) : esc(J.DB.accountName(me.id, b.account_id));
      return '<a class="card dash-link" href="#/imports/' + b.id + '"><div class="row between"><b>📄 ' + esc(b.file_name) + '</b><span class="pill">' + esc(b.status) + '</span></div>' +
        '<p class="muted">' + (isCard ? 'Fatura • ' : 'Extrato • ') + where + ' • ' + (b.period_start ? dueLabel(b.period_start) + ' a ' + dueLabel(b.period_end) : '—') + '<br>Total ' + b.total_rows + ' • novos ' + b.new_rows + ' • conciliados ' + b.matched_rows + ' • importados ' + b.imported_rows + ' • ignorados ' + b.ignored_rows + '</p></a>';
    }).join('') : '<div class="card empty"><div class="ico">📥</div><h2>Nenhuma importação</h2><p class="muted">Envie seu primeiro extrato acima.</p></div>';
    v.innerHTML = html;
    function imSrc() { var el = v.querySelector('input[name="im-src"]:checked'); return el ? el.value : 'bank_statement'; }
    Array.prototype.forEach.call(v.querySelectorAll('input[name="im-src"]'), function (r) {
      r.onchange = function () {
        document.getElementById('im-bankbox').style.display = imSrc() === 'bank_statement' ? '' : 'none';
        document.getElementById('im-cardbox').style.display = imSrc() === 'credit_card_statement' ? '' : 'none';
      };
    });
    document.getElementById('im-ft').onchange = function (e) { impF.type = e.target.value; render('imports'); };
    document.getElementById('im-fs').onchange = function (e) { impF.status = e.target.value; render('imports'); };
    document.getElementById('im-go').onclick = function () { startImportUpload(me); };
  }
  function startImportUpload(me) {
    var inp = document.getElementById('im-file');
    var srcEl = document.querySelector('input[name="im-src"]:checked');
    var src = srcEl ? srcEl.value : 'bank_statement';
    var acc = document.getElementById('im-acc').value;
    var cardBox = document.getElementById('im-card');
    var card = cardBox ? cardBox.value : '';
    var errBox = document.getElementById('e');
    if (!inp.files || !inp.files.length) { errBox.innerHTML = err(new Error('Escolha um arquivo CSV ou OFX.')); return; }
    var f = inp.files[0];
    if (!/\.(csv|ofx|txt)$/i.test(f.name)) { errBox.innerHTML = err(new Error('Formato não suportado. Envie CSV ou OFX.')); return; }
    if (f.size > 2000000) { errBox.innerHTML = err(new Error('Arquivo muito grande (máx ~2MB).')); return; }
    if (src === 'credit_card_statement' && !card) { errBox.innerHTML = err(new Error('Escolha o cartão desta fatura.')); return; }
    if (src === 'bank_statement' && !acc) { errBox.innerHTML = err(new Error('Escolha a conta de destino.')); return; }
    var rd = new FileReader();
    rd.onerror = function () { errBox.innerHTML = err(new Error('Não foi possível ler o arquivo.')); };
    rd.onload = function () {
      try {
        var text = String(rd.result || '');
        var isOfx = /\.ofx$/i.test(f.name);
        if (!isOfx) {
          var delim = J.DB.detectCsvDelimiter(text);
          var grid = J.DB.parseCsvRows(text, delim);
          if (grid.length < 2) throw new Error('Arquivo sem dados.');
          paintMappingModal(me, f.name, text, grid, delim, src === 'bank_statement' ? acc : null, src, src === 'credit_card_statement' ? card : null);
        } else {
          var data = { file_name: f.name, file_type: 'ofx', content: text, import_source_type: src };
          if (src === 'bank_statement') data.account_id = acc; else data.credit_card_id = card;
          var b = J.DB.createImportBatch(me.id, data);
          J.DB.analyzeBatch(me.id, b.id);
          if (src === 'credit_card_statement') { try { J.DB.ensureBatchInvoice(me.id, b.id, {}); } catch (e3) { /* fatura pode ser criada depois */ } }
          toast('Arquivo lido! Revise a prévia.');
          location.hash = '#/imports/' + b.id;
        }
      } catch (e2) { errBox.innerHTML = err(e2); }
    };
    rd.readAsText(f);
  }
  function paintMappingModal(me, fileName, text, grid, delim, accId, srcType, cardId) {
    srcType = srcType || 'bank_statement';
    var isCard = srcType === 'credit_card_statement';
    var headers = grid[0] || [];
    var auto = J.DB.detectColumnMapping(headers);
    var saved = isCard ? J.DB.listImportMappings(me.id, null, 'credit_card_statement', cardId) : J.DB.listImportMappings(me.id, accId, 'csv');
    function sel(id, cur, n) {
      return '<label>' + n + '</label><select id="' + id + '"><option value="-1">—</option>' + headers.map(function (h, i) {
        return '<option value="' + i + '"' + (cur === i ? ' selected' : '') + '>' + esc(h || ('Coluna ' + (i + 1))) + '</option>';
      }).join('') + '</select>';
    }
    modalShell('<h2>Mapear colunas</h2><div id="me"></div>' +
      (saved.length ? '<label>Reutilizar mapeamento</label><select id="mp-saved"><option value="">Detectar automaticamente</option>' + saved.map(function (m) { return '<option value="' + m.id + '">' + esc(m.mapping_name) + '</option>'; }).join('') + '</select>' : '') +
      '<div id="mp-fields">' + sel('mp-date', auto.date, 'Data *') + sel('mp-desc', auto.description, 'Descrição *') + sel('mp-amount', auto.amount, 'Valor (único)') +
      '<div class="row"><div>' + sel('mp-debit', auto.debit, 'Débito') + '</div><div>' + sel('mp-credit', auto.credit, 'Crédito') + '</div></div>' +
      sel('mp-type', auto.type, 'Tipo') + sel('mp-ext', auto.external_id, 'Identificador') +
      (isCard ? sel('mp-inst', auto.installment, 'Parcela (ex: 1/3)') : '') +
      '<div class="row"><div><label>Formato de data</label><select id="mp-df"><option value="auto">Automático</option><option value="DD/MM/YYYY">DD/MM/AAAA</option><option value="YYYY-MM-DD">AAAA-MM-DD</option><option value="MM/DD/YYYY">MM/DD/AAAA</option></select></div>' +
      '<div><label>Decimais</label><select id="mp-dec"><option value="">Automático</option><option value=",">Vírgula (1.234,56)</option><option value=".">Ponto (1234.56)</option></select></div></div>' +
      '<label><input type="checkbox" id="mp-save"> Salvar este mapeamento para o futuro</label>' +
      '<p class="muted">Amostra: ' + esc((grid[1] || []).slice(0, 3).join(' | ')) + '</p></div>' +
      '<button class="btn" id="sv">Confirmar e importar</button><button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    var svd = document.getElementById('mp-saved');
    if (svd) svd.onchange = function () {
      var m = saved.find(function (x) { return x.id === svd.value; });
      if (!m || !m.column_mapping) return;
      ['date', 'description', 'amount', 'debit', 'credit', 'type', 'external_id', 'installment'].forEach(function (k) {
        var el = document.getElementById('mp-' + (k === 'description' ? 'desc' : k === 'external_id' ? 'ext' : k === 'amount' ? 'amount' : k === 'debit' ? 'debit' : k === 'credit' ? 'credit' : k === 'type' ? 'type' : k === 'installment' ? 'inst' : 'date'));
        if (el && m.column_mapping[k] != null) el.value = m.column_mapping[k];
      });
      if (m.date_format) document.getElementById('mp-df').value = m.date_format;
      if (m.decimal_separator !== undefined) document.getElementById('mp-dec').value = m.decimal_separator;
      toast('Mapeamento aplicado. Confira antes de confirmar.');
    };
    function gi(id) { var v = parseInt(document.getElementById(id).value, 10); return isNaN(v) || v < 0 ? -1 : v; }
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        var instEl = document.getElementById('mp-inst');
        var mapping = { delimiter: delim, date: gi('mp-date'), description: gi('mp-desc'), amount: gi('mp-amount'), debit: gi('mp-debit'), credit: gi('mp-credit'), type: gi('mp-type'), external_id: gi('mp-ext'), installment: instEl ? gi('mp-inst') : -1, date_format: document.getElementById('mp-df').value, decimal_separator: document.getElementById('mp-dec').value };
        var cdata = { file_name: fileName, file_type: 'csv', content: text, mapping: mapping, import_source_type: srcType };
        if (isCard) cdata.credit_card_id = cardId; else cdata.account_id = accId;
        var b = J.DB.createImportBatch(me.id, cdata);
        if (document.getElementById('mp-save').checked) {
          var sdata = { file_type: isCard ? 'credit_card_statement' : 'csv', mapping_name: fileName.replace(/\.[^.]+$/, ''), column_mapping: { date: mapping.date, description: mapping.description, amount: mapping.amount, debit: mapping.debit, credit: mapping.credit, type: mapping.type, external_id: mapping.external_id, installment: mapping.installment }, date_format: mapping.date_format, decimal_separator: mapping.decimal_separator };
          if (isCard) sdata.credit_card_id = cardId; else sdata.account_id = accId;
          J.DB.saveImportMapping(me.id, sdata);
        }
        J.DB.analyzeBatch(me.id, b.id);
        if (isCard) { try { J.DB.ensureBatchInvoice(me.id, b.id, {}); } catch (e3) { /* fatura pode ser criada depois */ } }
        closeModal(); toast('Arquivo lido! Revise a prévia.');
        location.hash = '#/imports/' + b.id;
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  /* Caixa da fatura: período, vencimento, total do arquivo × total central. */
  function importInvoiceBox(me, batchId, b) {
    var out = '';
    try {
      var st = J.DB.calculateImportedStatementTotal(me.id, batchId);
      out += '<p><b>Lançamentos:</b> ' + st.count + ' • <b>Total do arquivo:</b> ' + BRL(st.total) + '</p>';
      var res = J.DB.ensureBatchInvoice(me.id, batchId, {});
      if (res.invoice) {
        var inv = J.DB.getInvoice(me.id, res.invoice.id);
        var total = J.DB.calculateInvoiceTotal(me.id, inv.id);
        var div = J.DB.statementDivergence(me.id, batchId);
        out += '<p><b>Fatura:</b> ' + ('0' + inv.reference_month).slice(-2) + '/' + inv.reference_year + ' • vence ' + dueLabel(inv.due_date) + ' • <b>Total Juntos:</b> ' + BRL(total) + '</p>';
        if (div.diff) out += '<p class="alert">O total dos lançamentos importados (' + BRL(div.statementTotal) + ') não corresponde ao total da fatura (' + BRL(div.invoiceTotal) + '). Confira juros, tarifas, estornos ou pagamentos no arquivo.</p>';
        else out += '<p class="muted">✓ Totais conferem.</p>';
      } else {
        out += '<p class="alert">Não encontramos uma fatura para este cartão e período (' + ('0' + res.month).slice(-2) + '/' + res.year + ').</p><div class="row"><button class="btn ghost" id="im-mkinv">Criar fatura a partir deste arquivo</button></div>' +
          '<p class="muted">Este arquivo parece representar apenas os lançamentos desta fatura.</p>';
      }
    } catch (e) { out += '<p class="muted">Fatura ainda não identificada.</p>'; }
    return out;
  }
  function pImportDetail(v, me, batchId) {
    var b;
    try { b = J.DB.getImportBatch(me.id, batchId); }
    catch (e) { v.innerHTML = err(e) + '<a class="btn ghost" style="text-decoration:none;text-align:center" href="#/imports">Voltar</a>'; return; }
    var isCard = (b.import_source_type || 'bank_statement') === 'credit_card_statement';
    var rows = J.DB.listImportedRows(me.id, batchId, {});
    var html = '<div class="card"><p><a href="#/imports">‹ Importações</a></p><div class="row between"><h1 style="margin:0">📄 ' + esc(b.file_name) + '</h1><span class="pill">' + esc(b.status) + '</span></div>' +
      '<p class="muted">' + (isCard ? ('💳 Fatura • ' + esc(J.DB.cardName(me.id, b.credit_card_id))) : esc(J.DB.accountName(me.id, b.account_id))) + ' • ' + (b.period_start ? 'Período: ' + dueLabel(b.period_start) + ' a ' + dueLabel(b.period_end) : '') + (b.possible_duplicate ? '<br>⚠️ Este arquivo parece já ter sido importado.' : '') + '</p>';
    if (isCard) html += importInvoiceBox(me, batchId, b);
    html += '<p>Total ' + b.total_rows + ' • novos ' + b.new_rows + ' • duplicados ' + b.duplicate_rows + ' • conciliados ' + b.matched_rows + ' • importados ' + b.imported_rows + ' • ignorados ' + b.ignored_rows + (b.invalid_rows ? ' • inválidos ' + b.invalid_rows : '') + '</p><div id="e"></div>';
    if (['preview', 'ready'].indexOf(b.status) >= 0) {
      html += '<div class="row"><button class="btn ghost" id="im-allnew">Importar novos</button><button class="btn ghost" id="im-fin">Concluir</button><button class="btn ghost" id="im-cx" style="color:var(--primary-d)">Cancelar lote</button></div>';
    }
    html += '</div>';
    var tabs = [['all', 'Todos'], ['new', 'Novos'], ['matched', 'Conciliados'], ['duplicate', 'Duplicados'], ['ignored', 'Ignorados'], ['invalid', 'Erros']];
    var counts = { all: rows.length, new: 0, matched: 0, duplicate: 0, ignored: 0, invalid: 0 };
    rows.forEach(function (r) {
      if (r.status === 'invalid' || r.status === 'failed') counts.invalid++;
      else if (r.status === 'ignored') counts.ignored++;
      else if (r.match_status === 'duplicate') counts.duplicate++;
      else if (r.match_status === 'matched' || r.status === 'imported') counts.matched++;
      else counts.new++;
    });
    if (['new', 'matched', 'duplicate', 'ignored', 'invalid'].indexOf(impTab) < 0) impTab = 'all';
    function inTab(r) {
      if (impTab === 'all') return true;
      if (impTab === 'invalid') return r.status === 'invalid' || r.status === 'failed';
      if (impTab === 'ignored') return r.status === 'ignored';
      if (impTab === 'duplicate') return r.match_status === 'duplicate';
      if (impTab === 'matched') return r.match_status === 'matched' || r.status === 'imported';
      return r.status !== 'invalid' && r.status !== 'failed' && r.status !== 'ignored' && r.match_status !== 'duplicate' && r.match_status !== 'matched' && r.status !== 'imported';
    }
    var shown = rows.filter(inTab).slice(0, 100);
    html += '<div class="card"><div class="row">' + tabs.map(function (t) {
      return '<button class="btn ghost sm" data-im-tab="' + t[0] + '"' + (impTab === t[0] ? ' disabled' : '') + '>' + t[1] + ' (' + counts[t[0]] + ')</button>';
    }).join('') + '</div><b>Prévia (' + rows.filter(inTab).length + ')</b>' + shown.map(function (r) { return importRowHtml(me, r); }).join('') + '</div>';
    v.innerHTML = html;
    Array.prototype.forEach.call(v.querySelectorAll('[data-im-tab]'), function (tb) {
      tb.onclick = function () { impTab = tb.dataset.imTab; render('imports/' + batchId); };
    });
    var an = document.getElementById('im-allnew');
    if (an) an.onclick = function () {
      try {
        var n = J.DB.confirmAllNew(me.id, batchId);
        var f = J.DB.finalizeBatch(me.id, batchId);
        toast(n + ' confirmados. Lote: ' + f.status + '.');
        render('imports/' + batchId);
      } catch (e2) { document.getElementById('e').innerHTML = err(e2); }
    };
    var fi = document.getElementById('im-fin');
    if (fi) fi.onclick = function () {
      try { var f = J.DB.finalizeBatch(me.id, batchId); toast('Lote: ' + f.status + '.'); render('imports/' + batchId); }
      catch (e2) { document.getElementById('e').innerHTML = err(e2); }
    };
    var cx = document.getElementById('im-cx');
    if (cx) cx.onclick = function () {
      if (!confirm('Cancelar este lote? Linhas já importadas permanecem.')) return;
      try { J.DB.cancelBatch(me.id, batchId); toast('Lote cancelado.'); render('imports/' + batchId); }
      catch (e2) { document.getElementById('e').innerHTML = err(e2); }
    };
    var mk = document.getElementById('im-mkinv');
    if (mk) mk.onclick = function () {
      try {
        var res = J.DB.ensureBatchInvoice(me.id, batchId, {});
        if (res.invoice) { render('imports/' + batchId); return; }
        var st = J.DB.calculateImportedStatementTotal(me.id, batchId);
        var ref = J.DB.invoiceRefForDate(me.id, b.credit_card_id, b.period_start);
        modalShell('<h2>Criar fatura?</h2><div id="me"></div><p>Cartão: <b>' + esc(J.DB.cardName(me.id, b.credit_card_id)) + '</b><br>Período: <b>' + ('0' + res.month).slice(-2) + '/' + res.year + '</b><br>Fechamento: ' + dueLabel(ref.closing) + ' • Vencimento: ' + dueLabel(ref.due) + '<br>Total estimado do arquivo: <b>' + BRL(st.total) + '</b></p><p class="muted">O valor final será calculado pelos lançamentos (serviço central).</p><button class="btn" id="mk-ok">Criar fatura</button> <button class="btn ghost" id="cl">Cancelar</button>');
        document.getElementById('cl').onclick = closeModal;
        document.getElementById('mk-ok').onclick = function () {
          try { J.DB.ensureBatchInvoice(me.id, batchId, { month: res.month, year: res.year, create: true }); closeModal(); toast('Fatura criada! 🧾'); render('imports/' + batchId); }
          catch (e3) { document.getElementById('me').innerHTML = err(e3); }
        };
      } catch (e2) { document.getElementById('e').innerHTML = err(e2); }
    };
    bindImportRows(v, me, batchId);
  }
  function importRowHtml(me, r) {
    if (r.status === 'invalid' || r.status === 'failed' && !r.normalized_date) {
      return '<div class="card" style="margin:8px 0"><b>Linha ' + r.line_number + '</b> <span class="pill over">' + (r.status === 'failed' ? 'Falhou' : 'Inválida') + '</span><p class="muted">' + esc(r.import_error || 'Registro inválido.') + '</p></div>';
    }    var stTag = r.status === 'imported' ? '<span class="pill ok">✓ Importada</span>' : r.status === 'ignored' ? '<span class="pill">Ignorada</span>' : r.status === 'confirmed' ? '<span class="pill ok">Confirmada</span>' : r.status === 'invalid' ? '<span class="pill over">Inválida</span>' : r.status === 'failed' ? '<span class="pill over">Falhou</span>' : '<span class="pill warn">Pendente</span>';
    var matchTag = r.match_status === 'duplicate' ? ' <span class="pill over">Duplicada</span>' : r.match_status === 'matched' ? ' <span class="pill">🔗 ' + esc(r.match_reason || 'Conciliada') + '</span>' : '';
    var extraTag = '';
    if (r.credit_card_id) {
      if (r.installment_number && r.total_installments) extraTag += ' <span class="pill">' + r.installment_number + '/' + r.total_installments + '</span>';
      var kindLabel = { card_purchase: 'Compra', card_installment: 'Parcela', card_payment: 'Pagamento', card_refund: 'Estorno', card_fee: 'Encargo', card_adjustment: 'Ajuste' }[r.card_item_type || ''];
      if (kindLabel && r.card_item_type !== 'card_purchase') extraTag += ' <span class="pill">' + kindLabel + '</span>';
    }
    var sug = '';
    try {
      if (r.status === 'valid' && (r.match_status === 'new' || r.match_status === 'matched')) {
        var hit = J.DB.suggestCategory(me.id, { description: r.normalized_description, type: r.normalized_type, payer_user_id: me.id, date: r.normalized_date, excludeTxId: null });
        if (hit) sug = '<br><span class="muted">💡 Categoria sugerida: ' + esc(J.DB.catDisplayName(me.id, hit.category_id)) + '</span>';
      }
    } catch (e) { /* sem sugestão */ }
    var acts = '';
    if (r.status === 'valid' || r.status === 'confirmed') {
      acts = '<div class="row"><button class="btn ghost" data-im-ok="' + r.id + '">Importar</button><button class="btn ghost" data-im-man="' + r.id + '">Conciliar</button><button class="btn ghost" data-im-no="' + r.id + '">Ignorar</button>';
      if (r.credit_card_id && (r.card_item_type === 'card_installment' || r.card_item_type === 'card_purchase') && r.match_status === 'new') {
        acts += '<button class="btn ghost" data-im-newp="' + r.id + '">Criar parcelada</button>';
      }
      if (r.match_status === 'matched') {
        var ms = [];
        try { ms = J.DB.rowMatches(me.id, r.id).filter(function (m) { return m.status === 'pending'; }); } catch (e2) {}
        ms.slice(0, 2).forEach(function (m) {
          acts += '<button class="btn ghost" data-im-pay="' + r.id + '|' + m.id + '">Usar: ' + esc(describeMatch(me, m)) + '</button>';
        });
      }
      acts += '</div>';
    } else if (r.match_status === 'matched' && r.status === 'valid') {
      acts = '<div class="row"><button class="btn ghost" data-im-un="' + r.id + '">Desfazer conciliação</button></div>';
    }
    return '<div class="card" style="margin:8px 0"><b>' + esc(r.raw_description || r.normalized_description) + '</b> <span class="muted">linha ' + r.line_number + '</span><p>' + dueLabel(r.normalized_date) + ' • <b class="' + (r.debit_credit === 'credit' ? 'pos' : 'neg') + '">' + (r.debit_credit === 'credit' ? '+' : '−') + ' ' + BRL(r.normalized_amount) + '</b> ' + stTag + matchTag + extraTag + sug + '</p>' + acts + '</div>';
  }
  function describeMatch(me, m) {
    try {
      if (m.entity_type === 'transaction') { var t = J.DB.getTx(me.id, m.entity_id); return t.description + ' (' + Math.round(m.confidence_score * 100) + '%)'; }
      if (m.entity_type === 'transfer') return 'transferência (' + Math.round(m.confidence_score * 100) + '%)';
      if (m.entity_type === 'invoice_payment') return 'pagamento (' + Math.round(m.confidence_score * 100) + '%)';
      if (m.entity_type === 'installment') { try { var ins = J.DB.getInstallment(me.id, m.entity_id); return 'Parcela ' + ins.installment_number + '/' + ins.total_installments + ' (' + Math.round(m.confidence_score * 100) + '%)'; } catch (e3) { /* segue */ } }
      if (m.entity_type === 'installment_purchase') return 'compra parcelada (' + Math.round(m.confidence_score * 100) + '%)';
    } catch (e) { /* segue */ }
    return 'correspondência (' + Math.round((m.confidence_score || 0) * 100) + '%)';
  }
  function bindImportRows(v, me, batchId) {
    function each(sel, fn) { Array.prototype.forEach.call(v.querySelectorAll(sel), function (b) { b.onclick = function () { fn(b); }; }); }
    function rerender() { render('imports/' + batchId); }
    each('[data-im-ok]', function (b) {
      try { J.DB.confirmRow(me.id, b.dataset.imOk); J.DB.importRowAsNew(me.id, b.dataset.imOk); toast('Importada! ✅'); rerender(); }
      catch (e) { toast(e.message || 'Não foi possível importar.'); }
    });
    each('[data-im-no]', function (b) {
      try { J.DB.ignoreRow(me.id, b.dataset.imNo); toast('Ignorada.'); rerender(); }
      catch (e) { toast(e.message || 'Não foi possível.'); }
    });
    each('[data-im-man]', function (b) { openManualMatch(me, batchId, b.dataset.imMan); });
    each('[data-im-newp]', function (b) { openInstallmentPurchaseModal(me, batchId, b.dataset.imNewp); });
    each('[data-im-un]', function (b) {
      try { J.DB.unmatchRow(me.id, b.dataset.imUn); toast('Conciliação desfeita.'); rerender(); }
      catch (e) { toast(e.message || 'Não foi possível.'); }
    });
    each('[data-im-pay]', function (b) {
      var parts = (b.dataset.imPay || '').split('|');
      openMatchAction(me, batchId, parts[0], parts[1]);
    });
  }
  function openManualMatch(me, batchId, rowId) {
    var cands;
    try { cands = J.DB.findRowCandidates(me.id, rowId); }
    catch (e) { toast('Registro não encontrado.'); return; }
    modalShell('<h2>Conciliar manualmente</h2><div id="me"></div>' +
      (cands.length ? cands.map(function (c) {
        return '<div class="card" style="margin:6px 0"><p>' + esc(c.label) + ' <span class="pill">' + Math.round(c.score * 100) + '%</span></p><button class="btn ghost" data-mk="' + c.kind + '|' + c.id + '">Relacionar</button></div>';
      }).join('') : '<p class="muted">Nenhum candidato próximo.</p>') +
      '<button class="btn ghost" id="cl">Fechar</button>');
    document.getElementById('cl').onclick = closeModal;
    Array.prototype.forEach.call(document.querySelectorAll('[data-mk]'), function (b) {
      b.onclick = function () {
        var p = b.dataset.mk.split('|');
        try { J.DB.conciliateRow(me.id, rowId, p[0], p[1]); closeModal(); toast('Conciliado! 🔗'); render('imports/' + batchId); }
        catch (e2) { document.getElementById('me').innerHTML = err(e2); }
      };
    });
  }
  /* Criar compra parcelada a partir da linha: pré-preenche, usuário confirma
     tudo (nunca inventa parcelas futuras sozinho). */
  function openInstallmentPurchaseModal(me, batchId, rowId) {
    var row;
    try { row = J.DB.getImportedRow(me.id, rowId); }
    catch (e) { toast('Registro não encontrado.'); return; }
    var preTotal = row.normalized_amount, preCount = row.total_installments || 1;
    modalShell('<h2>Criar compra parcelada</h2><div id="me"></div>' +
      '<p class="muted">Da linha ' + row.line_number + ': <b>' + esc(row.normalized_description) + '</b> • ' + BRL(row.normalized_amount) + (row.installment_number && row.total_installments ? ' • arquivo indica ' + row.installment_number + '/' + row.total_installments : '') + '</p>' +
      '<label>Descrição *</label><input id="ip-desc" value="' + esc(row.normalized_description) + '">' +
      '<div class="row"><div><label>Valor total *</label><input id="ip-total" inputmode="decimal" value="' + String(preTotal).replace('.', ',') + '"></div>' +
      '<div><label>Nº de parcelas *</label><input id="ip-count" inputmode="numeric" value="' + preCount + '"></div></div>' +
      '<div class="row"><div><label>Primeira parcela *</label><input id="ip-first" type="date" value="' + row.normalized_date + '"></div>' +
      '<div><label>Responsável</label><select id="ip-payer">' + payerOptions(me) + '</select></div></div>' +
      '<label>Categoria *</label><select id="ip-cat">' + catOptions(me, 'expense') + '</select>' +
      '<p class="muted">Serão criadas exatamente as parcelas informadas, no cartão da fatura.</p>' +
      '<button class="btn" id="sv">Criar compra</button> <button class="btn ghost" id="cl">Cancelar</button>');
    document.getElementById('cl').onclick = closeModal;
    document.getElementById('sv').onclick = function () {
      var btn = this; lock(btn);
      try {
        J.DB.createInstallmentPurchaseFromRow(me.id, rowId, {
          description: document.getElementById('ip-desc').value,
          total_amount: document.getElementById('ip-total').value,
          count: document.getElementById('ip-count').value,
          first_installment_date: document.getElementById('ip-first').value,
          category_id: document.getElementById('ip-cat').value,
          payer_user_id: document.getElementById('ip-payer').value
        });
        closeModal(); toast('Compra parcelada criada! 💳'); render('imports/' + batchId);
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); unlock(btn); }
    };
  }
  function openMatchAction(me, batchId, rowId, matchId) {    var m;
    try {
      var ms = J.DB.rowMatches(me.id, rowId);
      m = ms.find(function (x) { return x.id === matchId; });
      if (!m) throw new Error('Correspondência não encontrada.');
    } catch (e) { toast('Correspondência não encontrada.'); return; }
    var isPair = false;
    if (m.entity_type === 'transfer') {
      try { J.DB.getTransfer(me.id, m.entity_id); }
      catch (e2) { isPair = true; }
    }
    var body = '<h2>Correspondência (' + Math.round(m.confidence_score * 100) + '%)</h2><div id="me"></div><p class="muted">' + esc(m.match_reason || '') + '</p>';
    if (isPair) {
      body += '<p>Par de transferência ainda não existe no 2gtr.</p><button class="btn" id="mk-tr">Criar transferência</button>';
    } else if (m.entity_type === 'invoice_payment' || m.entity_type === 'invoice') {
      body += '<p>Possível pagamento de fatura. Escolha a fatura:</p><div id="mk-invs"></div>';
    } else {
      body += '<button class="btn" id="mk-ok">Conciliar</button>';
    }
    body += '<button class="btn ghost" id="cl">Fechar</button>';
    modalShell(body);
    document.getElementById('cl').onclick = closeModal;
    var ok = document.getElementById('mk-ok');
    if (ok) ok.onclick = function () {
      try { J.DB.conciliateRow(me.id, rowId, m.entity_type, m.entity_id); closeModal(); toast('Conciliado! 🔗'); render('imports/' + batchId); }
      catch (e2) { document.getElementById('me').innerHTML = err(e2); }
    };
    var tr = document.getElementById('mk-tr');
    if (tr) tr.onclick = function () {
      try {
        var pairRow = J.DB.getImportedRow(me.id, m.entity_id);
        var outId = null, inId = null;
        [rowId, pairRow.id].forEach(function (id) {
          var r = id === rowId ? J.DB.getImportedRow(me.id, rowId) : pairRow;
          if (r.debit_credit === 'debit') outId = id; else inId = id;
        });
        if (!outId || !inId) throw new Error('Par inválido.');
        J.DB.createTransferFromPair(me.id, outId, inId);
        closeModal(); toast('Transferência criada! ⇄'); render('imports/' + batchId);
      } catch (e2) { document.getElementById('me').innerHTML = err(e2); }
    };
    var invBox = document.getElementById('mk-invs');
    if (invBox) {
      var invs = J.DB.listInvoices(me.id, {}).filter(function (i) { return i.status !== 'paid' && i.status !== 'cancelled'; }).slice(0, 10);
      invBox.innerHTML = invs.length ? invs.map(function (i) {
        return '<div class="row"><span>' + esc(J.DB.cardName(me.id, i.credit_card_id)) + ' • ' + BRL(J.DB.calculateInvoiceOutstanding(me.id, i.id)) + ' • vence ' + dueLabel(i.due_date) + '</span><button class="btn ghost" data-pay="' + i.id + '">Pagar</button></div>';
      }).join('') : '<p class="muted">Nenhuma fatura em aberto.</p>';
      Array.prototype.forEach.call(invBox.querySelectorAll('[data-pay]'), function (b) {
        b.onclick = function () {
          try { J.DB.confirmInvoicePayment(me.id, rowId, b.dataset.pay); closeModal(); toast('Fatura conciliada! 🧾'); render('imports/' + batchId); }
          catch (e2) { document.getElementById('me').innerHTML = err(e2); }
        };
      });
    }
  }
  /* ============ PROMPT 21: INSIGHTS (só fatos, sem julgamento) ============ */
  var insF = { preset: 'current_month', view: 'couple', type: '', severity: '', status: 'active' };
  var INS_ACT_ROUTES = { view_transactions: '#/transactions', view_budget: '#/budget', view_invoice: '#/invoices', view_card: '#/cards', view_installments: '#/installments', view_goals: '#/goals', view_settlements: '#/settlements', view_reconciliation: '#/imports', view_recurring: '#/recurring', view_reports: '#/reports', none: '' };
  var INS_TYPE_LABELS = { spending_increase: 'Gasto em alta', spending_decrease: 'Gasto em queda', category_increase: 'Categoria em alta', category_decrease: 'Categoria em queda', unusual_expense: 'Fora do padrão', budget_attention: 'Orçamento', budget_exceeded: 'Orçamento estourado', upcoming_commitment: 'Compromissos', invoice_due: 'Fatura a vencer', invoice_overdue: 'Fatura vencida', card_utilization: 'Cartão', installment_commitment: 'Parcelas', recurring_expense: 'Recorrentes', goal_progress: 'Meta', goal_deadline: 'Meta', settlement_pending: 'Acerto', cash_flow_change: 'Fluxo de caixa', income_change: 'Receitas', expense_change: 'Despesas', financial_pattern: 'Padrão', reconciliation_attention: 'Conciliação' };
  var INS_ICONS = { spending: '💸', budget: '📊', cards: '💳', invoices: '🧾', installments: '🗓️', recurring: '🔁', goals: '🎯', settlements: '⚖️', cash_flow: '🌊', income: '💰', expenses: '🧾', reconciliation: '📥', general: '💡' };
  function pInsights(v, me) {
    var f = { view: insF.view === 'couple' ? 'couple' : undefined, type: insF.type || undefined, severity: insF.severity || undefined };
    if (insF.status === 'active') f.active = true; else if (insF.status) f.status = insF.status;
    var list, counts = { total: 0, unread: 0, attention: 0 }, genErr = '';
    try {
      var existing = J.DB.listInsights(me.id, f);
      if (!existing.length && insF.status === 'active' && !insF.type && !insF.severity) {
        try { J.DB.generateInsights(me.id, { preset: insF.preset, view: insF.view }); } catch (e2) { genErr = e2.message; }
        existing = J.DB.listInsights(me.id, f);
      }
      list = existing.slice(0, 50);
      counts = J.DB.insightCounts(me.id, { view: insF.view === 'couple' ? 'couple' : undefined });
    } catch (e) {
      v.innerHTML = '<div class="card"><h1>Insights financeiros</h1>' + err(e) + '<button class="btn" onclick="location.reload()">Tentar novamente</button></div>';
      return;
    }
    var html = '<div class="card"><h1>Insights financeiros</h1><p class="muted">Informações baseadas nos dados financeiros do casal.</p>' +
      '<p><b>' + counts.unread + ' novos insights</b> • ' + counts.attention + ' de atenção</p>' +
      (genErr ? err(new Error(genErr)) : '') +
      '<div class="row"><select id="ins-preset" aria-label="Período"><option value="current_month"' + (insF.preset === 'current_month' ? ' selected' : '') + '>Mês atual</option><option value="previous_month"' + (insF.preset === 'previous_month' ? ' selected' : '') + '>Mês anterior</option><option value="last_3_months"' + (insF.preset === 'last_3_months' ? ' selected' : '') + '>Últimos 3 meses</option></select>' +
      '<select id="ins-view" aria-label="Visão"><option value="couple"' + (insF.view === 'couple' ? ' selected' : '') + '>Casal</option><option value="me"' + (insF.view === 'me' ? ' selected' : '') + '>Eu</option><option value="partner"' + (insF.view === 'partner' ? ' selected' : '') + '>Parceiro</option></select></div>' +
      '<div class="row"><select id="ins-type" aria-label="Tipo"><option value="">Todos os tipos</option>' + J.DB.INSIGHT_TYPES.map(function (t) { return '<option value="' + t + '"' + (insF.type === t ? ' selected' : '') + '>' + (INS_TYPE_LABELS[t] || t) + '</option>'; }).join('') + '</select>' +
      '<select id="ins-sev" aria-label="Severidade"><option value="">Todas</option><option value="info"' + (insF.severity === 'info' ? ' selected' : '') + '>Info</option><option value="attention"' + (insF.severity === 'attention' ? ' selected' : '') + '>Atenção</option><option value="important"' + (insF.severity === 'important' ? ' selected' : '') + '>Importante</option></select>' +
      '<select id="ins-st" aria-label="Status"><option value="active"' + (insF.status === 'active' ? ' selected' : '') + '>Ativos</option><option value="new"' + (insF.status === 'new' ? ' selected' : '') + '>Novos</option><option value="read"' + (insF.status === 'read' ? ' selected' : '') + '>Lidos</option><option value="dismissed"' + (insF.status === 'dismissed' ? ' selected' : '') + '>Dispensados</option><option value="expired"' + (insF.status === 'expired' ? ' selected' : '') + '>Expirados</option><option value="">Todos</option></select></div>' +
      '<div class="row"><button class="btn" id="ins-gen">Atualizar insights</button></div><div id="e"></div></div>';
    if (!list.length) {
      html += '<div class="card empty"><div class="ico">💡</div><h2>Sem insights por aqui</h2><p class="muted">Ainda não encontramos mudanças relevantes nos seus dados financeiros.</p></div>';
    } else {
      html += list.map(function (r) { return insightCardHtml(r); }).join('');
    }
    v.innerHTML = html;
    function refilter() { render('insights'); }
    document.getElementById('ins-preset').onchange = function (e) { insF.preset = e.target.value; refilter(); };
    document.getElementById('ins-view').onchange = function (e) { insF.view = e.target.value; refilter(); };
    document.getElementById('ins-type').onchange = function (e) { insF.type = e.target.value; refilter(); };
    document.getElementById('ins-sev').onchange = function (e) { insF.severity = e.target.value; refilter(); };
    document.getElementById('ins-st').onchange = function (e) { insF.status = e.target.value; refilter(); };
    document.getElementById('ins-gen').onclick = function () {
      var btn = this; lock(btn);
      try { J.DB.generateInsights(me.id, { preset: insF.preset, view: insF.view }); toast('Insights atualizados! 💡'); refilter(); }
      catch (e2) { document.getElementById('e').innerHTML = err(e2); unlock(btn); }
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-ins-read]'), function (b) {
      b.onclick = function () { try { J.DB.setInsightStatus(me.id, b.dataset.insRead, 'read'); refilter(); } catch (e2) { toast('Não foi possível.'); } };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ins-no]'), function (b) {
      b.onclick = function () { try { J.DB.setInsightStatus(me.id, b.dataset.insNo, 'dismiss'); toast('Dispensado.'); refilter(); } catch (e2) { toast('Não foi possível.'); } };
    });
  }
  function insightCardHtml(r) {
    var sev = r.severity === 'important' ? '<span class="pill over">Importante</span>' : r.severity === 'attention' ? '<span class="pill warn">Atenção</span>' : '<span class="pill">Info</span>';
    var st = r.status === 'new' ? '<span class="pill ok">Novo</span>' : '';
    var act = (r.action_type && r.action_type !== 'none' && INS_ACT_ROUTES[r.action_type]) ? '<a class="btn ghost" style="text-decoration:none;text-align:center" href="' + INS_ACT_ROUTES[r.action_type] + '">' + esc(r.action_label || 'Ver') + '</a>' : '';
    var ev = '';
    try {
      var e = r.evidence || {};
      var parts = [];
      if (e.current_value != null) parts.push('Atual: <b>' + esc(fmtInsightVal(e.current_value)) + '</b>');
      if (e.previous_average != null) parts.push('Média anterior: <b>' + esc(fmtInsightVal(e.previous_average)) + '</b>');
      if (e.percentage_change != null) parts.push('Variação: <b>' + esc(String(e.percentage_change).replace('.', ',')) + '%</b>');
      if (e.usage != null) parts.push('Uso: <b>' + esc(String(e.usage).replace('.', ',')) + '%</b>');
      if (e.due_date) parts.push('Vencimento: <b>' + esc(String(e.due_date).split('-').reverse().join('/')) + '</b>');
      if (e.days_to_due != null) parts.push('Em <b>' + e.days_to_due + ' dias</b>');
      if (e.count != null) parts.push('Qtd: <b>' + e.count + '</b>');
      if (parts.length) ev = '<p class="muted">' + parts.join(' • ') + '</p>';
    } catch (e2) { /* sem evidência */ }
    var acts = '<div class="row">' + act;
    if (r.status === 'new') acts += '<button class="btn ghost" data-ins-read="' + r.id + '">Marcar como lido</button>';
    if (r.status === 'new' || r.status === 'read') acts += '<button class="btn ghost" data-ins-no="' + r.id + '">Dispensar</button>';
    acts += '</div>';
    return '<div class="card" style="margin:8px 0"><div class="row between"><b>' + (INS_ICONS[r.category] || '💡') + ' ' + esc(r.title) + '</b>' + sev + '</div>' +
      '<p>' + esc(r.summary) + ' ' + st + '</p>' +
      '<p class="muted"><b>Por que estamos vendo isso?</b><br>' + esc(r.explanation) + '</p>' + ev + acts + '</div>';
  }
  function fmtInsightVal(x) {
    if (typeof x === 'number') return 'R$ ' + x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(',00', '');
    return String(x);
  }
  /* ============ PROMPT 22: ASSISTENTE (conversa sobre dados reais) ============ */
  var asConv = null;
  var AS_SUGGEST = ['Como estão nossas finanças este mês?', 'O que temos amanhã?', 'O que merece nossa atenção?', 'Quanto gastamos com alimentação?', 'Qual é nossa próxima fatura?', 'Quanto ainda temos de orçamento?', 'Quanto temos em parcelas?', 'Como está nossa meta?', 'Quanto está pendente de acerto?'];
  function pAssistant(v, me) {
    try { J.DB.aiListConversations(me.id); }
    catch (e) { v.innerHTML = '<div class="card"><h1>Assistente</h1>' + err(e) + '</div>'; return; }
    var convs = J.DB.aiListConversations(me.id);
    if (!asConv || !convs.some(function (c) { return c.id === asConv; })) asConv = convs.length ? convs[0].id : null;
    var msgs = asConv ? J.DB.aiListMessages(me.id, asConv, 50) : [];
    var pend = asConv ? J.DB.aiPendingAction(me.id, asConv) : null;
    var html = '<div class="card"><h1>Assistente financeiro</h1><p class="muted">Pergunte sobre as finanças do casal. Ações só acontecem com sua confirmação.</p>';
    html += '<div class="row"><select id="as-conv" aria-label="Conversa">' + convs.map(function (c) { return '<option value="' + c.id + '"' + (c.id === asConv ? ' selected' : '') + '>' + esc(c.title) + (c.status === 'archived' ? ' (arquivada)' : '') + '</option>'; }).join('') + '</select><button class="btn ghost sm" id="as-new">Nova</button></div>';
    if (asConv) html += '<div class="row"><button class="btn ghost sm" id="as-ren">Renomear</button><button class="btn ghost sm" id="as-arch">Arquivar</button><button class="btn ghost sm" id="as-del">Excluir</button></div>';
    html += '<div id="e"></div></div>';
    html += '<div class="card" id="as-msgs">' + (msgs.length ? msgs.map(function (m) { return asMsgHtml(m); }).join('') : '<p class="muted">Olá! Pergunte, por exemplo, “Quanto gastamos esse mês?”.</p>') + '</div>';
    if (pend) html += '<div class="card"><b>Confirmar ação</b><p>' + esc(asActionLabel(pend)) + '</p><div class="row"><button class="btn" data-ai-ok="' + pend.id + '">Confirmar</button><button class="btn ghost" data-ai-no="' + pend.id + '">Cancelar</button></div><p class="muted">Só vale para esta ação, agora.</p></div>';
    html += '<div class="card"><div class="row">' + AS_SUGGEST.slice(0, 4).map(function (s) { return '<button class="btn ghost sm" data-as-sug="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
    html += '<div class="row"><input id="as-in" maxlength="1000" placeholder="Escreva sua pergunta…" aria-label="Mensagem"><button class="btn" id="as-send">Enviar</button><button class="btn ghost" id="as-mic" aria-label="Enviar mensagem de voz">🎙️</button><button class="btn ghost" id="as-img" aria-label="Enviar imagem">🖼️</button><button class="btn ghost" id="as-doc" aria-label="Enviar documento">📄</button></div><div id="as-busy" class="muted" style="display:none">Processando…</div>';
    html += '<div id="as-image" style="display:none"><p class="muted" id="as-istate" role="status">Envie uma foto do recibo, comprovante ou fatura.</p><div class="row"><label class="btn ghost sm" style="cursor:pointer">📷 Câmera<input type="file" id="as-icam" accept="image/*" capture="environment" style="display:none"></label><label class="btn ghost sm" style="cursor:pointer">🖼️ Escolher<input type="file" id="as-ifile" accept="image/jpeg,image/png,image/webp" style="display:none"></label><button class="btn ghost sm" id="as-icancel">Cancelar</button></div><div id="as-iprev"></div></div>';
    html += '<div id="as-doc" style="display:none"><p class="muted" id="as-dstate" role="status">Envie um PDF (fatura, boleto, extrato).</p><div class="row"><label class="btn ghost sm" style="cursor:pointer">📄 Escolher PDF<input type="file" id="as-dfile" accept="application/pdf" style="display:none"></label><button class="btn ghost sm" id="as-dcancel">Cancelar</button></div><div id="as-dprev"></div></div>';
    html += '<div id="as-multi" style="display:none"><p class="muted" id="as-mstate" role="status">Anexos prontos para combinar.</p><div id="as-mlist"></div><div class="row"><button class="btn sm" id="as-mgo">Combinar e interpretar</button><button class="btn ghost sm" id="as-mclear">Limpar</button></div></div></div>';
    html += '<div id="as-audio" style="display:none"><p class="muted" id="as-astate" role="status">Pronto para gravar.</p><div class="row"><button class="btn ghost sm" id="as-arec">● Gravar</button><button class="btn ghost sm" id="as-astop" disabled>■ Parar</button><button class="btn ghost sm" id="as-acancel">Cancelar</button><label class="btn ghost sm" style="cursor:pointer">📎 Arquivo<input type="file" id="as-afile" accept="audio/*" style="display:none"></label></div><div id="as-aprev"></div></div></div>';
    v.innerHTML = html;
    var box = document.getElementById('as-msgs');
    box.scrollTop = box.scrollHeight;
    document.getElementById('as-conv').onchange = function (e) { asConv = e.target.value || null; render('assistant'); };
    document.getElementById('as-new').onclick = function () {
      try { var c = J.DB.aiCreateConversation(me.id, 'Conversa'); asConv = c.id; render('assistant'); }
      catch (e2) { document.getElementById('e').innerHTML = err(e2); }
    };
    var rn = document.getElementById('as-ren');
    if (rn) rn.onclick = function () {
      var t = prompt('Nome da conversa:');
      if (t == null) return;
      try { J.DB.aiRenameConversation(me.id, asConv, t); render('assistant'); }
      catch (e2) { document.getElementById('e').innerHTML = err(e2); }
    };
    var ar = document.getElementById('as-arch');
    if (ar) ar.onclick = function () { try { J.DB.aiArchiveConversation(me.id, asConv); render('assistant'); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    var del = document.getElementById('as-del');
    if (del) del.onclick = function () {
      if (!confirm('Excluir esta conversa? Os dados financeiros ficam intactos.')) return;
      try { J.DB.aiDeleteConversation(me.id, asConv); asConv = null; render('assistant'); } catch (e2) { document.getElementById('e').innerHTML = err(e2); }
    };
    function send(text) {
      var busy = document.getElementById('as-busy');
      busy.style.display = '';
      setTimeout(function () {
        try {
          if (!asConv) { var c = J.DB.aiCreateConversation(me.id, 'Conversa'); asConv = c.id; }
          J.DB.aiProcessMessage(me.id, asConv, text);
          render('assistant');
        } catch (e2) { busy.style.display = 'none'; document.getElementById('e').innerHTML = err(e2); }
      }, 30);
    }
    document.getElementById('as-send').onclick = function () {
      var inp = document.getElementById('as-in');
      if (!inp.value.trim()) return;
      send(inp.value);
    };
    /* Entrada por áudio: MediaRecorder quando há; transcrição client-side
       (Web Speech) quando há; senão o usuário edita/confirma o texto.
       Nada é enviado sem ação explícita; texto vale como se digitado. */
    (function bindAudio() {
      var panel = document.getElementById('as-audio');
      var state = document.getElementById('as-astate');
      var prev = document.getElementById('as-aprev');
      var recB = document.getElementById('as-arec'), stopB = document.getElementById('as-astop');
      var micB = document.getElementById('as-mic');
      var rec = null, chunks = [], t0 = 0, timer = null, lastAudio = null;
      function say(t) { if (state) state.textContent = t; }
      function recog() {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
        if (!SR) return null;
        try {
          var r = new SR();
          r.lang = 'pt-BR'; r.interimResults = false; r.maxAlternatives = 1;
          return r;
        } catch (e) { return null; }
      }
      micB.onclick = function () {
        panel.style.display = panel.style.display === 'none' ? '' : 'none';
        say('Pronto para gravar. A permissão do microfone só é pedida ao gravar.');
      };
      document.getElementById('as-acancel').onclick = function () {
        try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) {}
        clearInterval(timer); panel.style.display = 'none'; prev.innerHTML = ''; lastAudio = null;
        stopB.disabled = true;
      };
      recB.onclick = function () {
        if (!window.MediaRecorder) { say('Gravação não suportada aqui. Envie um arquivo de áudio ou digite.'); return; }
        prev.innerHTML = ''; lastAudio = null;
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          chunks = [];
          rec = new MediaRecorder(stream);
          rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = function () {
            clearInterval(timer);
            stream.getTracks().forEach(function (t) { t.stop(); });
            var dur = Math.round((Date.now() - t0) / 1000);
            var blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
            say('Gravação pronta (' + dur + 's). Transcrevendo…');
            var sr = recog();
            function done(text) { showPreview({ mime: blob.type || 'audio/webm', size: blob.size, durationSec: dur }, text); }
            if (sr) {
              sr.onresult = function (ev) { done(ev.results[0][0].transcript); };
              sr.onerror = function () { say('Não consegui transcrever sozinho. Edite o texto abaixo e envie.'); done(''); };
              try { sr.start(); setTimeout(function () { try { sr.stop(); } catch (e2) {} }, 8000); } catch (e3) { done(''); }
            } else { say('Transcrição automática indisponível. Edite o texto abaixo e envie.'); done(''); }
          };
          t0 = Date.now(); rec.start();
          stopB.disabled = false;
          say('Gravando… 0s');
          timer = setInterval(function () { say('Gravando… ' + Math.round((Date.now() - t0) / 1000) + 's'); }, 1000);
        }).catch(function () { say('Microfone negado. Sem problema: digite sua mensagem ou envie um arquivo.'); });
      };
      stopB.onclick = function () { try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) {} stopB.disabled = true; };
      document.getElementById('as-afile').onchange = function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        showPreview({ mime: f.type || 'audio/mpeg', size: f.size, durationSec: null, name: f.name }, '');
        say('Arquivo pronto. Edite a transcrição abaixo e envie.');
      };
      function showPreview(file, text) {
        lastAudio = file;
        prev.innerHTML = '<label>Entendi:</label><input id="as-atext" maxlength="1000" value="' + esc(text || '') + '" aria-label="Transcrição">' +
          '<div class="row"><button class="btn sm" id="as-ago">Enviar como mensagem</button></div><p class="muted">Confira o texto: ele vale como se você tivesse digitado.</p>';
        document.getElementById('as-ago').onclick = function () {
          var tx = document.getElementById('as-atext').value;
          if (!tx.trim()) { say('Edite a transcrição antes de enviar.'); return; }
          var busy = document.getElementById('as-busy');
          busy.style.display = '';
          setTimeout(function () {
            try {
              if (!asConv) { var c = J.DB.aiCreateConversation(me.id, 'Conversa'); asConv = c.id; }
              var a = J.DB.audioReceive(me.id, { mime: file.mime, size: file.size, durationSec: file.durationSec, name: file.name || 'gravacao', storageRef: 'web:' + Date.now().toString(36) }, { channel: 'web', source: file.name ? 'uploaded_file' : 'microphone', conversationId: asConv });
              J.DB.audioTranscribe(me.id, a.id, { provider: 'client-side', transcript: tx });
              J.DB.audioToAssistant(me.id, a.id, { conversationId: asConv });
              render('assistant');
            } catch (e2) { busy.style.display = 'none'; document.getElementById('e').innerHTML = err(e2); }
          }, 30);
        };
      }
    })();
    document.getElementById('as-in').onkeydown = function (e) {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('as-send').click(); }
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-as-sug]'), function (b) { b.onclick = function () { send(b.dataset.asSug); }; });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ai-ok]'), function (b) {
      b.onclick = function () {
        try {
          var done = J.DB.aiConfirmAction(me.id, b.dataset.aiOk);
          toast('Ação concluída! ✅');
          render('assistant');
          void done;
        } catch (e2) { toast(e2.message || 'Não foi possível concluir.'); render('assistant'); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ai-no]'), function (b) {
      b.onclick = function () {
        try { J.DB.aiCancelAction(me.id, b.dataset.aiNo); toast('Ação cancelada.'); } catch (e2) { toast('Não foi possível.'); }
        render('assistant');
      };
    });
    /* Entrada por imagem: câmera/upload/paste → extração (client-side ou
       explícita) → prévia "Encontrei:" → assistente. Nada executa sozinho. */
    (function bindImage() {
      var panel = document.getElementById('as-image');
      var state = document.getElementById('as-istate');
      var prev = document.getElementById('as-iprev');
      function say(t) { if (state) state.textContent = t; }
      document.getElementById('as-img').onclick = function () {
        panel.style.display = panel.style.display === 'none' ? '' : 'none';
      };
      document.getElementById('as-icancel').onclick = function () { panel.style.display = 'none'; prev.innerHTML = ''; };
      function handleFile(f) {
        if (!f) return;
        say('Enviando…');
        prev.innerHTML = '';
        var busy = document.getElementById('as-busy');
        busy.style.display = '';
        setTimeout(function () {
          try {
            if (!asConv) { var c = J.DB.aiCreateConversation(me.id, 'Conversa'); asConv = c.id; }
            var img = J.DB.imageReceive(me.id, { mime: f.type || 'image/jpeg', size: f.size || 1024, name: f.name || 'foto', storageRef: 'web:' + Date.now().toString(36) }, { channel: 'web', source: 'upload', conversationId: asConv });
            showExtract(img.id, f);
          } catch (e2) { busy.style.display = 'none'; say(e2.message || 'Não foi possível enviar.'); }
        }, 30);
      }
      function showExtract(imageId, f) {
        var busy = document.getElementById('as-busy');
        busy.style.display = 'none';
        var thumb = '';
        try {
          if (f && window.URL && window.URL.createObjectURL) {
            thumb = '<img src="' + window.URL.createObjectURL(f) + '" alt="Prévia da imagem enviada" style="max-width:120px;border-radius:8px">';
          }
        } catch (e) {}
        prev.innerHTML = thumb +
          '<p class="muted">Analisando…</p><label>Dados identificados (edite se preciso)</label>' +
          '<div class="row"><input id="as-imerchant" placeholder="Estabelecimento" aria-label="Estabelecimento"><input id="as-iamount" inputmode="decimal" placeholder="Valor (ex: 184,32)" aria-label="Valor"></div>' +
          '<div class="row"><input id="as-idate" type="date" aria-label="Data"><select id="as-itype" aria-label="Tipo de documento"><option value="receipt">Recibo</option><option value="invoice">Fatura</option><option value="proof_of_payment">Comprovante</option><option value="bill">Boleto/conta</option><option value="screenshot">Print</option><option value="unknown">Outro</option></select></div>' +
          '<div class="row"><button class="btn sm" id="as-igo">Interpretar</button><button class="btn ghost sm" id="as-iplus">＋ Combinar</button><button class="btn ghost sm" id="as-idel">Remover</button></div>' +
          '<p class="muted">Nada é registrado sem sua confirmação.</p>';
        say('Encontrei a imagem. Confira os dados e toque em Interpretar.');
        document.getElementById('as-idel').onclick = function () { try { J.DB.imageCancel(me.id, imageId); } catch (e) {} prev.innerHTML = ''; say('Imagem removida.'); };
        document.getElementById('as-iplus').onclick = function () {
          try {
            try {
              J.DB.imageProcess(me.id, imageId, { provider: 'client-side', extraction: {
                imageType: document.getElementById('as-itype').value,
                merchantName: document.getElementById('as-imerchant').value || null,
                date: document.getElementById('as-idate').value || null,
                totalAmount: document.getElementById('as-iamount').value || null,
                currency: 'BRL', rawText: document.getElementById('as-imerchant').value || ''
              } });
            } catch (e0) { /* sem dados suficientes: anexa mesmo assim */ }
            var inp = J.DB.mmReceiveInput(me.id, 'image', { imageId: imageId }, { channel: 'web', source: 'camera' });
            window.__asAnnex = window.__asAnnex || [];
            window.__asAnnex.push({ kind: 'image', inputId: inp.id, label: '📷 Imagem' });
            if (window.__asRefreshMulti) window.__asRefreshMulti();
            toast('Imagem adicionada aos anexos. Combine com outros.');
          } catch (e) { say(e.message || 'Não foi possível anexar.'); }
        };
        document.getElementById('as-igo').onclick = function () {
          busy.style.display = '';
          setTimeout(function () {
            try {
              var ex = {
                imageType: document.getElementById('as-itype').value,
                merchantName: document.getElementById('as-imerchant').value || null,
                date: document.getElementById('as-idate').value || null,
                totalAmount: document.getElementById('as-iamount').value || null,
                currency: 'BRL', rawText: document.getElementById('as-imerchant').value || ''
              };
              J.DB.imageProcess(me.id, imageId, { provider: 'client-side', extraction: ex });
              J.DB.imageToAssistant(me.id, imageId, { conversationId: asConv });
              render('assistant');
            } catch (e2) { busy.style.display = 'none'; say(e2.message || 'Não consegui identificar. Tente uma foto mais nítida.'); }
          }, 30);
        };
      }
      document.getElementById('as-icam').onchange = function (e) { handleFile(e.target.files && e.target.files[0]); };
      document.getElementById('as-ifile').onchange = function (e) { handleFile(e.target.files && e.target.files[0]); };
      document.getElementById('as-in').addEventListener('paste', function (e) {
        var items = (e.clipboardData && e.clipboardData.items) || [];
        for (var i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image/') === 0) {
            e.preventDefault();
            panel.style.display = '';
            handleFile(items[i].getAsFile());
            return;
          }
        }
      });
    })();
    /* Documentos + multimodal: anexos combináveis, mesmos estados e
       confirmações. Entradas viram NormalizedInput no contexto. */
    (function bindDoc() {
      var panel = document.getElementById('as-doc');
      var state = document.getElementById('as-dstate');
      var prev = document.getElementById('as-dprev');
      var mpanel = document.getElementById('as-multi');
      var mlist = document.getElementById('as-mlist');
      var mstate = document.getElementById('as-mstate');
      window.__asAnnex = window.__asAnnex || [];
      function say(t) { if (state) state.textContent = t; }
      function refreshMulti() {
        var n = window.__asAnnex.length;
        mpanel.style.display = n ? '' : 'none';
        if (mstate) mstate.textContent = n ? n + ' anexo(s) pronto(s) para combinar.' : 'Anexos prontos para combinar.';
        mlist.innerHTML = window.__asAnnex.map(function (a, ix) {
          return '<p>' + esc(a.label) + ' <button class="btn ghost sm" data-annex="' + ix + '">Remover</button></p>';
        }).join('');
        Array.prototype.forEach.call(mlist.querySelectorAll('[data-annex]'), function (b) {
          b.onclick = function () { window.__asAnnex.splice(+b.dataset.annex, 1); refreshMulti(); };
        });
      }
      document.getElementById('as-doc').onclick = function () {
        panel.style.display = panel.style.display === 'none' ? '' : 'none';
      };
      document.getElementById('as-dcancel').onclick = function () { panel.style.display = 'none'; prev.innerHTML = ''; };
      document.getElementById('as-dfile').onchange = function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        say('Enviando…');
        var busy = document.getElementById('as-busy');
        busy.style.display = '';
        setTimeout(function () {
          try {
            if (!asConv) { var c = J.DB.aiCreateConversation(me.id, 'Conversa'); asConv = c.id; }
            var doc = J.DB.receiveDocument(me.id, { mime: f.type || 'application/pdf', size: f.size || 2048, pageCount: 1, name: f.name || 'doc.pdf', storageRef: 'web:' + Date.now().toString(36) }, { channel: 'web', conversationId: asConv });
            busy.style.display = 'none';
            prev.innerHTML = '<p><b>📄 ' + esc(f.name || 'documento') + '</b></p><label>O que este documento contém? (edite se preciso)</label>' +
              '<div class="row"><input id="as-dmerc" placeholder="Estabelecimento/beneficiário" aria-label="Estabelecimento"><input id="as-dval" inputmode="decimal" placeholder="Valor (ex: 189,90)" aria-label="Valor"></div>' +
              '<div class="row"><input id="as-ddate" type="date" aria-label="Data"><button class="btn sm" id="as-dgo">Interpretar</button></div>' +
              '<p class="muted">Nada é registrado sem sua confirmação.</p>';
            say('Documento recebido. Confira e toque em Interpretar.');
            document.getElementById('as-dgo').onclick = function () {
              busy.style.display = '';
              setTimeout(function () {
                try {
                  J.DB.extractDocumentText(me.id, doc.id, { provider: 'client-side', extraction: {
                    documentType: 'unknown',
                    merchantName: document.getElementById('as-dmerc').value || null,
                    totalAmount: document.getElementById('as-dval').value || null,
                    date: document.getElementById('as-ddate').value || null,
                    rawText: document.getElementById('as-dmerc').value || ''
                  } });
                  var inp = J.DB.mmReceiveInput(me.id, 'document', { docId: doc.id }, { channel: 'web', source: 'document_upload' });
                  window.__asAnnex.push({ kind: 'document', inputId: inp.id, label: '📄 ' + (f.name || 'documento') });
                  refreshMulti();
                  say('Pronto. Combine com outros anexos ou interprete.');
                  render('assistant');
                } catch (e2) { busy.style.display = 'none'; say(e2.message || 'Não consegui interpretar.'); }
              }, 30);
            };
          } catch (e3) { busy.style.display = 'none'; say(e3.message || 'Não foi possível enviar.'); }
        }, 30);
      };
      var mgo = document.getElementById('as-mgo');
      if (mgo) mgo.onclick = function () {
        var busy = document.getElementById('as-busy');
        busy.style.display = '';
        setTimeout(function () {
          try {
            if (!asConv) { var c = J.DB.aiCreateConversation(me.id, 'Conversa'); asConv = c.id; }
            var ctx = J.DB.mmBuildContext(me.id, window.__asAnnex.map(function (a) { return a.inputId; }), { conversationId: asConv, channel: 'web' });
            var res = J.DB.mmInterpret(me.id, ctx.id, { conversationId: asConv });
            window.__asAnnex = [];
            if (res.needsResolution) {
              render('assistant');
              toast('Há valores diferentes. Escolha qual usar.');
            } else render('assistant');
          } catch (e2) { busy.style.display = 'none'; toast(e2.message || 'Não foi possível combinar.'); }
        }, 30);
      };
      var mclear = document.getElementById('as-mclear');
      if (mclear) mclear.onclick = function () { window.__asAnnex = []; refreshMulti(); };
      refreshMulti();
      window.__asRefreshMulti = refreshMulti;
    })();
  }
  function asMsgHtml(m) {
    var tag = m.message_type === 'audio' ? ' 🎙️' : m.message_type === 'image' ? ' 🖼️' : m.message_type === 'document' ? ' 📄' : m.message_type === 'multimodal' ? ' ✨' : '';
    var who = m.role === 'user' ? '<b>Você' + tag + '</b>' : m.role === 'assistant' ? '<b>🤖 Assistente</b>' : '<b class="muted">' + esc(m.role) + '</b>';
    return '<div style="margin:8px 0">' + who + '<p style="margin:2px 0">' + esc(m.content) + '</p></div>';
  }
  function asActionLabel(a) {
    var p = a.request_data || {};
    var M = J.DB.aiMoney;
    var names = { create_transaction: 'Registrar ' + (p.type === 'income' ? 'receita' : 'despesa'), create_transfer: 'Transferência', create_goal: 'Criar meta', create_recurring: 'Criar recorrente', mark_invoice_paid: 'Pagar fatura', update_transaction: 'Ajustar lançamento', create_agenda_event: 'Marcar compromisso', update_agenda_event: 'Alterar compromisso', cancel_agenda_event: 'Cancelar compromisso' };
    var s = names[a.action_type] || a.action_type;
    if (p.title) s += ' • "' + p.title + '"';
    if (p.date) s += ' • ' + String(p.date).split('-').reverse().join('/');
    if (p.amount != null) s += ' • ' + M(p.amount);
    if (p.description || p.name) s += ' • ' + (p.description || p.name);
    if (p.date || p.payment_date) s += ' • ' + (p.date || p.payment_date).split('-').reverse().join('/');
    return s;
  }
  /* ============ PROMPT 23: WHATSAPP (canal nas configs) ============ */
  function waSettingsCard(me) {
    var conn = null, prefs = null;
    try { conn = J.DB.waMyConnection(me.id); prefs = J.DB.waGetPreferences(me.id); } catch (e) { /* sem casal */ }
    var s = '<div class="card"><b>📱 WhatsApp</b>';
    if (conn) {
      s += '<p class="muted">WhatsApp conectado<br>' + esc(conn.phone_masked || '(número vinculado)') + ' • desde ' + esc(dmy(conn.verified_at)) + '</p>';
      s += '<div class="row"><button class="btn ghost" id="wa-unlink" style="color:var(--primary-d)">Desvincular</button></div>';
    } else {
      s += '<p class="muted">Vincule seu WhatsApp para registrar gastos e consultar finanças por mensagem. O número é só um canal: seus dados continuam aqui.</p>';
      s += '<div class="row"><button class="btn ghost" id="wa-code">Gerar código</button></div><div id="wa-code-out"></div>';
    }
    if (prefs) {
      s += '<p class="muted">Mensagens proativas: <b>' + (prefs.allow_proactive_messages ? 'ativadas' : 'desativadas') + '</b> • silêncio ' + esc(prefs.quiet_hours_start) + '–' + esc(prefs.quiet_hours_end) + '</p>';
      s += '<div class="row"><button class="btn ghost sm" id="wa-pref">' + (prefs.allow_proactive_messages ? 'Desativar proativas' : 'Ativar proativas') + '</button></div>';
    }
    return s + '</div>';
  }
  function bindWaSettings(v, me) {
    var g = document.getElementById('wa-code');
    if (g) g.onclick = function () {
      try {
        var r = J.DB.waGenerateLinkCode(me.id);
        document.getElementById('wa-code-out').innerHTML = '<p>Envie no WhatsApp: <b>' + esc(r.code) + '</b><br><span class="muted">Vale por 10 minutos, uso único.</span></p>';
      } catch (e) { document.getElementById('wa-code-out').innerHTML = err(e); }
    };
    var u = document.getElementById('wa-unlink');
    if (u) u.onclick = function () {
      if (!confirm('Desvincular o WhatsApp? O histórico financeiro fica intacto.')) return;
      try { J.DB.waRevokeConnection(me.id); toast('WhatsApp desvinculado.'); render('settings/whatsapp'); }
      catch (e) { toast('Não foi possível.'); }
    };
    var p = document.getElementById('wa-pref');
    if (p) p.onclick = function () {
      try {
        var cur = J.DB.waGetPreferences(me.id);
        J.DB.waSetPreferences(me.id, { allow_proactive_messages: !cur.allow_proactive_messages });
        render('settings/whatsapp');
      } catch (e) { toast('Não foi possível.'); }
    };
  }
  /* ============ PROMPT 24: CENTRAL DE NOTIFICAÇÕES ============ */
  var ntF = { tab: 'all', group: '', origin: '' };
  var NT_GROUPS = [['invoices', 'Faturas'], ['budget', 'Orçamento'], ['installments', 'Parcelas'], ['goals', 'Metas'], ['imports', 'Importações'], ['recurring', 'Recorrentes'], ['settlements', 'Acertos']];
  function ntGroupOf(n) {
    if (/^invoice/.test(n.type)) return 'invoices';
    if (/^budget/.test(n.type)) return 'budget';
    if (/^installment/.test(n.type)) return 'installments';
    if (/^goal/.test(n.type)) return 'goals';
    if (/^import/.test(n.type) || n.type === 'reconciliation_pending') return 'imports';
    if (/^recurring/.test(n.type)) return 'recurring';
    if (/^settlement/.test(n.type)) return 'settlements';
    return '';
  }
  function pNotifications(v, me) {
    var list, counts = { total: 0, unread: 0 };
    try {
      var f = {};
      if (ntF.tab === 'unread') f.unread = true;
      if (ntF.tab === 'important') f.important = true;
      list = J.DB.notifList(me.id, f).filter(function (n) {
        return (!ntF.group || ntGroupOf(n) === ntF.group) && (!ntF.origin || (n.origin || 'operational') === ntF.origin);
      }).slice(0, 50);
      counts.unread = J.DB.notifUnreadCount(me.id);
      counts.total = J.DB.notifList(me.id, {}).length;
    } catch (e) {
      v.innerHTML = '<div class="card"><h1>Notificações</h1>' + err(e) + '<button class="btn" onclick="location.reload()">Tentar novamente</button></div>';
      return;
    }
    var html = '<div class="card"><h1>Notificações</h1>' +
      '<p class="muted">' + (counts.unread ? '<b>' + counts.unread + ' não lidas</b>' : 'Tudo em dia.') + ' • ' + counts.total + ' no total</p>' +
      '<div class="row"><button class="btn ghost sm" id="nt-all">Marcar todas como lidas</button><button class="btn ghost sm" id="nt-scan">Verificar agora</button></div>' +
      '<div class="row"><select id="nt-tab" aria-label="Filtro"><option value="all"' + (ntF.tab === 'all' ? ' selected' : '') + '>Todas</option><option value="unread"' + (ntF.tab === 'unread' ? ' selected' : '') + '>Não lidas</option><option value="important"' + (ntF.tab === 'important' ? ' selected' : '') + '>Importantes</option></select>' +
      '<select id="nt-group" aria-label="Grupo"><option value="">Todos os grupos</option>' + NT_GROUPS.map(function (g) { return '<option value="' + g[0] + '"' + (ntF.group === g[0] ? ' selected' : '') + '>' + g[1] + '</option>'; }).join('') + '</select>' +
      '<select id="nt-origin" aria-label="Origem"><option value="">Todas</option><option value="operational"' + (ntF.origin === 'operational' ? ' selected' : '') + '>Operacionais</option><option value="intelligent"' + (ntF.origin === 'intelligent' ? ' selected' : '') + '>Inteligentes</option></select></div><div id="e"></div></div>';
    if (!list.length) {
      html += '<div class="card empty"><div class="ico">🔔</div><h2>Nada por aqui</h2><p class="muted">Sem notificações para este filtro.</p></div>';
    } else {
      html += list.map(function (n) { return ntCardHtml(me, n); }).join('');
    }
    v.innerHTML = html;
    document.getElementById('nt-tab').onchange = function (e) { ntF.tab = e.target.value; render('notifications'); };
    document.getElementById('nt-group').onchange = function (e) { ntF.group = e.target.value; render('notifications'); };
    document.getElementById('nt-origin').onchange = function (e) { ntF.origin = e.target.value; render('notifications'); };
    document.getElementById('nt-all').onclick = function () { try { J.DB.notifMarkAllRead(me.id); render('notifications'); } catch (e2) { document.getElementById('e').innerHTML = err(e2); } };
    document.getElementById('nt-scan').onclick = function () {
      var btn = this; lock(btn);
      try { J.DB.notifScan(me.id, {}); toast('Verificação concluída! 🔔'); render('notifications'); }
      catch (e2) { document.getElementById('e').innerHTML = err(e2); unlock(btn); }
    };
    Array.prototype.forEach.call(v.querySelectorAll('[data-nt-read]'), function (b) {
      b.onclick = function () { try { J.DB.notifRead(me.id, b.dataset.ntRead); render('notifications'); } catch (e2) { toast('Não foi possível.'); } };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-nt-no]'), function (b) {
      b.onclick = function () { try { J.DB.notifDismiss(me.id, b.dataset.ntNo); render('notifications'); } catch (e2) { toast('Não foi possível.'); } };
    });
  }
  function ntCardHtml(me, n) {
    var sev = n.priority === 'important' ? '<span class="pill over">Importante</span>' : n.priority === 'attention' ? '<span class="pill warn">Atenção</span>' : '<span class="pill">Info</span>';
    var unread = ['sent', 'delivered'].indexOf(n.status) >= 0 ? '<span class="pill ok">Nova</span>' : '<span class="pill">' + esc(n.status) + '</span>';
    var origin = (n.origin || 'operational') === 'intelligent' ? ' <span class="pill">inteligente</span>' : '';
    var link = '';
    try {
      var href = J.DB.notifDeepLink(me.id, n.id);
      link = '<a class="btn ghost" style="text-decoration:none;text-align:center" href="' + href + '">Abrir</a>';
    } catch (e) { /* sem acesso */ }
    var acts = '<div class="row">' + link;
    if (['sent', 'delivered'].indexOf(n.status) >= 0) acts += '<button class="btn ghost" data-nt-read="' + n.id + '">Marcar como lida</button>';
    if (['sent', 'delivered', 'read'].indexOf(n.status) >= 0) acts += '<button class="btn ghost" data-nt-no="' + n.id + '">Dispensar</button>';
    acts += '</div>';
    var when = '';
    try { when = esc(dmy(n.created_at)); } catch (e2) { when = ''; }
    return '<div class="card" style="margin:8px 0"><div class="row between"><b>🔔 ' + esc(n.title) + '</b>' + sev + '</div>' +
      '<p>' + esc(n.body) + ' ' + unread + origin + '</p><p class="muted">' + when + '</p>' + acts + '</div>';
  }
  /* ============ PROMPT 24: PREFS DE NOTIFICAÇÃO ============ */
  function ntPrefsCard(me) {
    var types = J.DB.NOTIFICATION_TYPES();
    var rows = '';
    try {
      var prefs = J.DB.notifGetPreferences(me.id);
      function isOff(t, ch) {
        return prefs.some(function (p) { return p.notification_type === t && p.channel === ch && !p.enabled; });
      }
      rows = types.map(function (t) {
        var offApp = isOff(t.key, 'in_app'), offWa = isOff(t.key, 'whatsapp');
        return '<div class="row between"><span>' + esc(t.key.replace(/_/g, ' ')) + '</span><span><button class="btn ghost sm" data-ntp-app="' + t.key + '">' + (offApp ? 'App off' : 'App on') + '</button> <button class="btn ghost sm" data-ntp-wa="' + t.key + '">' + (offWa ? 'WA off' : 'WA on') + '</button></span></div>';
      }).join('');
    } catch (e) { rows = '<p class="muted">Indisponível.</p>'; }
    return '<div class="card"><b>🔔 Notificações</b><p class="muted">Ative por tipo e canal. Silêncio padrão 22h–08h.</p>' + rows + '<div class="row"><label>Silêncio de</label><input id="nt-q1" style="max-width:90px" value="22:00"><label>até</label><input id="nt-q2" style="max-width:90px" value="08:00"><button class="btn ghost sm" id="nt-qsv">Salvar</button></div><div id="nt-pm"></div></div>';
  }
  function bindNtPrefs(v, me) {
    Array.prototype.forEach.call(v.querySelectorAll('[data-ntp-app]'), function (b) {
      b.onclick = function () {
        try {
          var cur = J.DB.notifGetPreferences(me.id).filter(function (p) { return p.notification_type === b.dataset.ntpApp && p.channel === 'in_app' && p.user_id === me.id; })[0];
          J.DB.notifSetPreference(me.id, { notification_type: b.dataset.ntpApp, channel: 'in_app', enabled: cur ? !cur.enabled : false });
          render('settings/notifications');
        } catch (e) { document.getElementById('nt-pm').innerHTML = err(e); }
      };
    });
    Array.prototype.forEach.call(v.querySelectorAll('[data-ntp-wa]'), function (b) {
      b.onclick = function () {
        try {
          var cur = J.DB.notifGetPreferences(me.id).filter(function (p) { return p.notification_type === b.dataset.ntpWa && p.channel === 'whatsapp' && p.user_id === me.id; })[0];
          J.DB.notifSetPreference(me.id, { notification_type: b.dataset.ntpWa, channel: 'whatsapp', enabled: cur ? !cur.enabled : false });
          render('settings/notifications');
        } catch (e) { document.getElementById('nt-pm').innerHTML = err(e); }
      };
    });
    var sv = document.getElementById('nt-qsv');
    if (sv) sv.onclick = function () {
      try {
        var a = document.getElementById('nt-q1').value, b2 = document.getElementById('nt-q2').value;
        J.DB.NOTIFICATION_TYPES().forEach(function (t) {
          J.DB.notifSetPreference(me.id, { notification_type: t.key, channel: 'in_app', quiet_hours_start: a, quiet_hours_end: b2 });
          J.DB.notifSetPreference(me.id, { notification_type: t.key, channel: 'whatsapp', quiet_hours_start: a, quiet_hours_end: b2 });
        });
        toast('Silêncio atualizado.');
        render('settings/notifications');
      } catch (e) { document.getElementById('nt-pm').innerHTML = err(e); }
    };
  }
  /* P38: MoneyManagementModeSelector — cards selecionáveis + confirmação. */
  function moneyModeCard(me, ctx, isOwner) {
    var mode = J.DB.moneyMode(me.id);
    function card(m, icon, t, d) {
      var on = mode === m;
      return '<button class="mode-card' + (on ? ' on' : '') + '" data-mm="' + m + '" ' + (isOwner ? '' : 'disabled') + ' aria-pressed="' + on + '">' +
        '<span class="mode-ico" aria-hidden="true">' + icon + '</span><b>' + t + (on ? ' ✓' : '') + '</b><span class="muted">' + d + '</span></button>';
    }
    return '<div class="card"><b>Gestão do dinheiro</b><p class="muted">Como vocês querem administrar o dinheiro?</p><div id="mm-err"></div>' +
      '<div class="mode-grid">' +
      card('SEPARATE', '👛', 'Dinheiro separado', 'Cada um mantém seu dinheiro e vocês fazem acertos quando necessário.') +
      card('JOINT', '👩‍❤️‍👨', 'Tudo junto', 'As receitas e despesas dos dois fazem parte do dinheiro do casal. Não há acertos entre vocês.') +
      '</div><p class="muted" id="mm-status">Vocês podem mudar essa escolha depois. Os registros financeiros existentes não serão alterados.' +
      (isOwner ? '' : '<br>Só quem criou o casal pode alterar.') + '</p></div>';
  }
  function bindMoneyMode(me, isOwner) {
    if (!isOwner) return;
    var cur = J.DB.moneyMode(me.id);
    Array.prototype.forEach.call(document.querySelectorAll('[data-mm]'), function (b) {
      b.onclick = function () {
        var next = b.dataset.mm;
        if (next === cur) return;
        var toJoint = next === 'JOINT';
        modalShell('<h2>Mudar para "' + (toJoint ? 'Tudo junto' : 'Dinheiro separado') + '"?</h2><div id="me"></div>' +
          '<p class="muted">' + (toJoint
            ? 'A partir dessa configuração, o aplicativo vai considerar as receitas e despesas dos dois dentro da visão financeira do casal. Os registros existentes não serão apagados nem alterados. Acertos já registrados continuarão no histórico.'
            : 'A partir dessa mudança, despesas compartilhadas poderão gerar acertos entre vocês novamente. Os registros financeiros existentes não serão alterados.') + '</p>' +
          '<div class="row"><button class="btn ghost" id="cl">Cancelar</button><button class="btn" id="mm-ok">Confirmar alteração</button></div>');
        document.getElementById('cl').onclick = closeModal;
        document.getElementById('mm-ok').onclick = function () {
          var btn = this; btn.disabled = true; btn.textContent = 'Salvando...';
          try {
            J.DB.setMoneyManagementMode(me.id, next);
            closeModal(); toast('Configuração atualizada'); render('settings/couple');
          } catch (e2) { document.getElementById('me').innerHTML = err(e2); btn.disabled = false; btn.textContent = 'Confirmar alteração'; }
        };
      };
    });
  }
  /* ---------- BOOT ---------- */
  function boot() {
    var lo = document.getElementById('btn-logout-desk'); if (lo) lo.onclick = function () { J.Auth.logout(); };
    bindUserMenu();
    var tg = document.getElementById('sb-toggle');
    if (tg && !tg.dataset.b) {
      tg.dataset.b = '1';
      tg.onclick = function () {
        var sb = document.getElementById('sidebar');
        var col = !sb.classList.contains('collapsed');
        try { localStorage.setItem('juntos_sb_v1', col ? '1' : '0'); } catch (e) {}
        paintShell(J.Auth.current());
      };
    }
    function setOff() {
      var bar = document.getElementById('offline-bar');
      var off = !navigator.onLine;
      if (bar) bar.classList.toggle('hidden', !off);
      if (off) toast('Você está sem conexão. Algumas informações podem não estar atualizadas.');
    }
    window.addEventListener('offline', setOff);
    window.addEventListener('online', function () { var bar = document.getElementById('offline-bar'); if (bar) bar.classList.add('hidden'); toast('Conexão de volta!'); });
    setOff();
    var fab = document.getElementById('fab'); if (fab) fab.onclick = function () {
      var me = J.Auth.current();
      if (!me || !J.DB.myCoupleId(me.id)) { toast('Crie ou entre em um casal primeiro ❤️'); return; }
      modalShell('<h2>O que deseja criar?</h2><div id="me"></div>' +
        '<button class="btn" id="fb-x">✨ Capturar na Inbox</button>' +
        '<button class="btn" id="fb-r">+ Receita</button>' +
        '<button class="btn" id="fb-e">− Despesa</button>' +
        '<button class="btn ghost" id="fb-a">📅 Novo compromisso</button>' +
        '<button class="btn ghost" id="fb-h">🌱 Novo hábito</button>' +
        '<button class="btn ghost" id="fb-t">☑ Nova tarefa</button>' +
        '<button class="btn ghost" id="fb-g">🎯 Nova meta</button>' +
        '<button class="btn ghost" id="fb-c">🔁 Nova conta recorrente</button>' +
        '<button class="btn ghost" id="cl">Cancelar</button>');
      document.getElementById('cl').onclick = closeModal;
      document.getElementById('fb-x').onclick = function () { closeModal(); openQuickCapture(me); };
      document.getElementById('fb-r').onclick = function () { closeModal(); openTxModal(me, null, 'income'); };
      document.getElementById('fb-e').onclick = function () { closeModal(); openTxModal(me, null, 'expense'); };
      document.getElementById('fb-a').onclick = function () { closeModal(); openAgendaModal(me, null, null); };
      document.getElementById('fb-h').onclick = function () { closeModal(); location.hash = '#/habits'; };
      document.getElementById('fb-t').onclick = function () { closeModal(); location.hash = '#/tasks'; };
      document.getElementById('fb-g').onclick = function () { closeModal(); goAndOpen(me, '#/goals', 'goals', function () { openGoalModal(me, null); }); };
      document.getElementById('fb-c').onclick = function () { closeModal(); goAndOpen(me, '#/recurring', 'recurring', function () { openRecModal(me, null); }); };
    };
    var _bt = document.getElementById('boot'); if (_bt) _bt.classList.add('hidden');
    if (!location.hash) location.hash = '#/landing';
    J.Router.start();
  }

  J.App = { render: render, boot: boot, toast: toast, openTx: openTxModal };
})(window.Juntos);
document.addEventListener('DOMContentLoaded', function () { window.Juntos.App.boot(); });
