/* Router hash + guards (= ProtectedRoute da arquitetura).
   Públicas: landing/login/register/forgot/privacy/terms. Demais exigem sessão.
   /onboarding exige login SEM casal; rotas do app exigem login COM casal. */
(function (J) {
  var TITLES = { landing: '2gtr', privacy: 'Privacidade', terms: 'Termos de uso', finance: 'Finanças', forbidden: 'Sem acesso', notfound: 'Não encontrada', dashboard: 'Início', transactions: 'Movimentações', accounts: 'Contas', cards: 'Cartões', installments: 'Parceladas', invoices: 'Faturas', imports: 'Importações', insights: 'Insights', assistant: 'Assistente', notifications: 'Notificações', planning: 'Planejamento', agenda: 'Agenda', tasks: 'Tarefas', lists: 'Listas', routines: 'Rotinas', projects: 'Projetos', inbox: 'Inbox', habits: 'Hábitos', budget: 'Orçamento', goals: 'Metas', settlements: 'Acertos', recurring: 'Contas recorrentes', calendar: 'Calendário', reports: 'Relatórios', more: 'Mais', settings: 'Configurações', profile: 'Perfil', couple: 'Casal', invite: 'Convite', openfinance: 'Open Finance', onboarding: 'Bem-vindo', login: 'Entrar', register: 'Criar conta', 'forgot-password': 'Recuperar senha' };
  var PUBLIC = ['landing', 'login', 'register', 'forgot-password', 'privacy', 'terms'];
  var INDEXABLE = ['landing', 'privacy', 'terms'];
  var _pending = null;
  function parse() { var h = location.hash.replace('#/', '') || 'landing'; return h.split('?')[0]; }
  function base(r) { return r.split('/')[0]; }
  function nav() {
    var r = parse(), b = base(r), me = J.Auth.current();
    if (!me && !PUBLIC.includes(b)) {
      if (b !== 'login' && r !== 'login') _pending = '#/' + r;
      return location.hash = '#/login';
    }
    if (me && PUBLIC.includes(b)) return go(me);
    if (me && b === 'onboarding' && J.DB.myCoupleId(me.id)) return location.hash = '#/dashboard';
    if (me && !PUBLIC.includes(b) && b !== 'onboarding' && !J.DB.myCoupleId(me.id)) return location.hash = '#/onboarding';
    render(r);
  }
  function go(me) {
    var back = _pending; _pending = null;
    if (back && /^#\/[a-z][a-z0-9\/_-]*$/i.test(back)) {
      var bb = back.replace('#/', '').split('/')[0];
      if (!PUBLIC.includes(bb) && bb !== 'onboarding' && bb !== 'landing') { location.hash = back; return; }
    }
    location.hash = J.DB.myCoupleId(me.id) ? '#/dashboard' : '#/onboarding';
  }
  function render(r) {
    var b = base(r);
    var bare = ['landing', 'login', 'register', 'forgot-password', 'privacy', 'terms', 'onboarding'].includes(b);
    document.getElementById('shell').classList.toggle('bare', bare);
    document.getElementById('page-title').textContent = TITLES[b] || '2gtr';
    try { document.title = b === 'landing' ? '2gtr — Sua vida organizada em um só lugar' : (TITLES[b] ? TITLES[b] + ' | ' : '') + '2gtr'; } catch (e) {}
    try {
      var robots = document.getElementById('meta-robots');
      if (robots) robots.setAttribute('content', INDEXABLE.includes(b) && !J.Auth.current() ? 'index, follow' : 'noindex, nofollow');
    } catch (e2) {}
    document.querySelectorAll('#side-nav a,#bottomnav a').forEach(function (a) {
      var on = a.dataset.r === b;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var _ab = document.getElementById('avatar-btn');
    if (_ab) _ab.textContent = (J.Auth.current() || { nome: '?' }).nome.charAt(0).toUpperCase();
    var _hn = document.getElementById('hello-name'); if (_hn) { var _me = J.Auth.current(); _hn.textContent = _me ? 'Olá, ' + _me.nome.split(' ')[0] : 'Olá'; }
    J.App.render(r);
  }
  window.addEventListener('hashchange', nav);
  J.Router = { start: nav, go: go };
})(window.Juntos);
