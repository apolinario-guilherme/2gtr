/* Auth — adapter local (fundação). Produção: delegar a Supabase Auth / Firebase Auth.
   Nunca exibir erro técnico; mensagens amigáveis tratadas em app.js */
(function (J) {
  var SKEY = 'juntos_session_v1';
  function sess() { try { return JSON.parse(localStorage.getItem(SKEY)); } catch (e) { return null; } }
  function setS(s) { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); }
  // hash demonstrativo com salt (NÃO usar em produção com dados reais)
  function hash(pw, salt) {
    var h1 = 0x811c9dc5, h2 = 0x01000193, s = salt + '::' + pw;
    for (var i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619); h2 = Math.imul(h2 + s.charCodeAt(i), 31); }
    return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }
  var Auth = {
    current: function () {
      var s = sess(); if (!s) return null;
      var u = J.DB.all().users.find(function (x) { return x.id === s.userId; });
      return u || null;
    },
    register: function (nome, email, pass) {
      nome = String(nome || '').trim(); email = String(email || '').trim().toLowerCase();
      if (nome.length < 2) throw new Error('Conte-nos seu nome (mínimo 2 letras).');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Digite um e-mail válido.');
      if (String(pass || '').length < 6) throw new Error('A senha precisa de pelo menos 6 caracteres.');
      var db = J.DB.all();
      if (db.users.some(function (u) { return u.email === email; })) throw new Error('Este e-mail já está cadastrado. Tente entrar.');
      var u = { id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nome: nome, email: email, salt: Math.random().toString(36).slice(2), avatar: null, created_at: new Date().toISOString() };
      u.pass = hash(pass, u.salt);
      db.users.push(u); J.DB.save(db); setS({ userId: u.id });
      try { J.DB.logSecurityEvent(u.id, 'register', { action: 'register', metadata: {} }); } catch (e) {}
      return u;
    },
    login: function (email, pass) {
      email = String(email || '').trim().toLowerCase();
      try { J.DB.rateCheck('login:' + email, 10, 60000); } catch (e) { throw new Error('Muitas tentativas. Aguarde um momento.'); }
      var db = J.DB.all();
      var u = db.users.find(function (x) { return x.email === email; });
      if (!u || u.pass !== hash(pass, u.salt)) {
        try { J.DB.logSecurityEvent(u ? u.id : null, 'login', { action: 'login', result: 'denied', metadata: {} }); } catch (e2) {}
        throw new Error('E-mail ou senha incorretos.');
      }
      setS({ userId: u.id });
      try { J.DB.logSecurityEvent(u.id, 'login', { action: 'login', metadata: {} }); } catch (e3) {}
      return u;
    },
    logout: function () {
      try { var me = Auth.current(); if (me) J.DB.logSecurityEvent(me.id, 'logout', { action: 'logout', metadata: {} }); } catch (e) {}
      setS(null); location.hash = '#/login';
    },
    forgot: function (email) {
      email = String(email || '').trim().toLowerCase();
      try { J.DB.rateCheck('forgot:' + email, 5, 60000); } catch (e) { throw new Error('Muitas tentativas. Aguarde um momento.'); }
      var db = J.DB.all();
      var u = db.users.find(function (x) { return x.email === email; });
      if (!u) throw new Error('Se este e-mail existir, enviaremos as instruções.'); // anti-enumeração
      var code = String(Math.floor(100000 + Math.random() * 900000));
      db.resets = db.resets.filter(function (r) { return r.email !== email; });
      db.resets.push({ email: email, code: code, exp: Date.now() + 30 * 60e3 });
      J.DB.save(db); return code; // nesta etapa: exibir na tela (sem envio de e-mail)
    },
    reset: function (email, code, npass) {
      email = String(email || '').trim().toLowerCase();
      var db = J.DB.all();
      var r = db.resets.find(function (x) { return x.email === email && x.code === String(code).trim(); });
      if (!r || r.exp < Date.now()) throw new Error('Código inválido ou expirado.');
      if (String(npass || '').length < 6) throw new Error('A nova senha precisa de 6+ caracteres.');
      var u = db.users.find(function (x) { return x.email === email; });
      u.pass = hash(npass, u.salt);
      db.resets = db.resets.filter(function (x) { return x.email !== email; });
      J.DB.save(db); setS({ userId: u.id }); return u;
    },
    updateProfile: function (nome) {
      var me = Auth.current(); if (!me) return;
      var db = J.DB.all(); var u = db.users.find(function (x) { return x.id === me.id; });
      u.nome = String(nome || '').trim() || u.nome; J.DB.save(db);
    }
  };
  J.Auth = Auth;
})(window.Juntos);
