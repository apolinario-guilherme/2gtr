/* Router hash + guards. Rotas públicas: login/register/forgot. Demais exigem sessão.
   /onboarding exige login SEM casal; rotas do app exigem login COM casal (ou redirecionam p/ onboarding). */
(function (J) {
  var TITLES = { dashboard: 'Início', transactions: 'Movimentações', accounts: 'Contas', cards: 'Cartões', installments: 'Parceladas', invoices: 'Faturas', imports: 'Importações', insights: 'Insights', assistant: 'Assistente', notifications: 'Notificações', planning: 'Planejamento', budget: 'Orçamento', goals: 'Metas', settlements: 'Acertos', recurring: 'Contas recorrentes', calendar: 'Calendário', reports: 'Relatórios', more: 'Mais', settings: 'Configurações', profile: 'Perfil', couple: 'Casal', invite: 'Convite', openfinance: 'Open Finance', onboarding: 'Bem-vindo', login: 'Entrar', register: 'Criar conta', 'forgot-password': 'Recuperar senha' };
  var PUBLIC = ['login', 'register', 'forgot-password'];
  function parse() { var h = location.hash.replace('#/', '') || 'dashboard'; return h.split('?')[0]; }
  function base(r) { return r.split('/')[0]; }
  function nav() {
    var r = parse(), b = base(r), me = J.Auth.current();
    if (!me && !PUBLIC.includes(b)) return location.hash = '#/login';
    if (me && PUBLIC.includes(b)) return go(me);
    if (me && b === 'onboarding' && J.DB.myCoupleId(me.id)) return location.hash = '#/dashboard';
    if (me && !PUBLIC.includes(b) && b !== 'onboarding' && !J.DB.myCoupleId(me.id)) return location.hash = '#/onboarding';
    render(r);
  }
  function go(me) { location.hash = J.DB.myCoupleId(me.id) ? '#/dashboard' : '#/onboarding'; }
  function render(r) {
    var b = base(r);
    var bare = ['login', 'register', 'forgot-password', 'onboarding'].includes(b);
    document.getElementById('shell').classList.toggle('bare', bare);
    document.getElementById('page-title').textContent = TITLES[b] || '2gtr';
    try { document.title = (TITLES[b] ? TITLES[b] + ' | ' : '') + '2gtr'; } catch (e) {}
    document.querySelectorAll('#side-nav a,#bottomnav a').forEach(function (a) { a.classList.toggle('active', a.dataset.r === b); });
    document.getElementById('avatar-btn').textContent = (J.Auth.current() || { nome: '?' }).nome.charAt(0).toUpperCase();
    var _hn = document.getElementById('hello-name'); if (_hn) { var _me = J.Auth.current(); _hn.textContent = _me ? 'Olá, ' + _me.nome.split(' ')[0] : 'Olá'; }
    J.App.render(r);
  }
  window.addEventListener('hashchange', nav);
  J.Router = { start: nav, go: go };
})(window.Juntos);
