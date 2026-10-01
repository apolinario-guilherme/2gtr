/* Auth — adapter local (fundação). Produção: delegar a Supabase Auth / Firebase Auth.
   Login social (Google/Facebook/Apple) desativado: somente e-mail + senha.
   Nunca exibir erro técnico; mensagens amigáveis tratadas em app.js */
(function (J) {
  var SKEY = 'juntos_session_v1';
  function sess() { try { return JSON.parse(localStorage.getItem(SKEY)); } catch (e) { return null; } }
  function setS(s) { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); }
  // hash demonstrativo com salt (NÃO usar em produção com dados reais;
  // produção exige backend com bcrypt/scrypt/argon2 — este adapter é local).
  function hash(pw, salt) {
    var h1 = 0x811c9dc5, h2 = 0x01000193, s = salt + '::' + pw;
    for (var i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619); h2 = Math.imul(h2 + s.charCodeAt(i), 31); }
    return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }
  function randHex(n) {
    try {
      var c = (typeof window !== 'undefined' && (window.crypto || window.msCrypto)) || null;
      if (c && c.getRandomValues) {
        var b = new Uint8Array(n), out = '';
        c.getRandomValues(b);
        for (var i = 0; i < n; i++) out += ('0' + b[i].toString(16)).slice(-2);
        return out.slice(0, n * 2);
      }
    } catch (e) {}
    var s = '';
    for (var j = 0; j < n * 2; j++) s += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    return s;
  }
  var _reauth = {};
  var Auth = {
    current: function () {
      var s = sess(); if (!s) return null;
      var u = J.DB.all().users.find(function (x) { return x.id === s.userId; });
      if (!u || u.deactivated_at) return null;
      if (s.sv != null) { if (u.session_version == null || s.sv !== u.session_version) return null; }
      else if (u.session_version !== 1) return null;
      return u || null;
    },
    register: function (nome, email, pass) {
      nome = String(nome || '').trim(); email = String(email || '').trim().toLowerCase();
      if (nome.length < 2) throw new Error('Conte-nos seu nome (mínimo 2 letras).');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Digite um e-mail válido.');
      if (String(pass || '').length < 6) throw new Error('A senha precisa de pelo menos 6 caracteres.');
      var db = J.DB.all();
      if (db.users.some(function (u) { return u.email === email; })) throw new Error('Este e-mail já está cadastrado. Tente entrar.');
      var u = { id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nome: nome, email: email, salt: randHex(16), avatar: null, deactivated_at: null, session_version: 1, created_at: new Date().toISOString() };
      u.pass = hash(pass, u.salt);
      db.users.push(u); J.DB.save(db); setS({ userId: u.id, sv: 1 });
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
      try { J.DB.reactivateAccount(u.id); } catch (eR) {}
      setS({ userId: u.id, sv: u.session_version || 1 });
      try { J.DB.logSecurityEvent(u.id, 'login', { action: 'login', metadata: {} }); } catch (e3) {}
      return u;
    },
    logout: function () {
      try { var me = Auth.current(); if (me) J.DB.logSecurityEvent(me.id, 'logout', { action: 'logout', metadata: {} }); } catch (e) {}
      setS(null);
      /* Limpa preferências de interface (filtros/visões) p/ não vazar contexto entre usuários. */
      try { ['juntos_dash_v3', 'juntos_ov_v1', 'juntos_sb_v1'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e2) {}
      try { if (J.Ctx) J.Ctx.clear(); } catch (e3) {}
      location.hash = '#/login';
    },
    forgot: function (email) {
      email = String(email || '').trim().toLowerCase();
      try { J.DB.rateCheck('forgot:' + email, 5, 60000); } catch (e) { throw new Error('Muitas tentativas. Aguarde um momento.'); }
      var db = J.DB.all();
      var u = db.users.find(function (x) { return x.email === email; });
      if (!u) throw new Error('Se este e-mail existir, enviaremos as instruções.'); // anti-enumeração
      var code = J.DB.randDigits(6);
      db.resets = db.resets.filter(function (r) { return r.email !== email; });
      db.resets.push({ email: email, code: code, exp: Date.now() + 30 * 60e3 });
      J.DB.save(db); return code; // nesta etapa: exibir na tela (sem envio de e-mail)
    },
    reset: function (email, code, npass) {
      email = String(email || '').trim().toLowerCase();
      try { J.DB.rateCheck('reset:' + email, 10, 60000); } catch (e) { throw new Error('Muitas tentativas. Aguarde um momento.'); }
      var db = J.DB.all();
      var r = db.resets.find(function (x) { return x.email === email && x.code === String(code).trim(); });
      if (!r || r.exp < Date.now()) throw new Error('Código inválido ou expirado.');
      if (String(npass || '').length < 6) throw new Error('A nova senha precisa de 6+ caracteres.');
      var u = db.users.find(function (x) { return x.email === email; });
      if (!u) throw new Error('Conta não encontrada.');
      if (!u.salt) u.salt = randHex(16);
      u.pass = hash(npass, u.salt);
      db.resets = db.resets.filter(function (x) { return x.email !== email; });
      J.DB.save(db);
      try { J.DB.reactivateAccount(u.id); } catch (eR) {}
      setS({ userId: u.id, sv: u.session_version || 1 }); return u;
    },
    /* Reautenticação recente p/ ações destrutivas (em memória, 10 min). */
    reauthenticatePassword: function (userId, password) {
      var db = J.DB.all();
      var u = db.users.find(function (x) { return x.id === userId; });
      if (!u || !u.pass) throw new Error('Esta conta ainda não tem senha. Use "Esqueci minha senha" para definir uma.');
      if (u.pass !== hash(password, u.salt)) throw new Error('Senha incorreta.');
      _reauth[userId] = { userId: userId, method: 'password', at: Date.now() };
      return _reauth[userId];
    },
    deactivateAccount: function () {
      var me = Auth.current();
      if (!me) throw new Error('Entre novamente.');
      var r = J.DB.deactivateAccount(me.id);
      delete _reauth[me.id];
      Auth.logout();
      return r;
    },
    deleteAccount: function (password) {
      var me = Auth.current();
      if (!me) throw new Error('Entre novamente.');
      var proof = _reauth[me.id];
      if (!proof || !(proof.at > Date.now() - 10 * 60 * 1000)) {
        if (password == null) throw new Error('Confirme sua identidade para excluir a conta.');
        proof = Auth.reauthenticatePassword(me.id, password);
      }
      var r = J.DB.deleteUserAccount(me.id, proof);
      delete _reauth[me.id];
      try { setS(null); } catch (e) {}
      try { ['juntos_dash_v3', 'juntos_ov_v1', 'juntos_sb_v1'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e2) {}
      try { if (J.Ctx) J.Ctx.clear(); } catch (e3) {}
      return r;
    },
    updateProfile: function (nome) {
      var me = Auth.current(); if (!me) return;
      var db = J.DB.all(); var u = db.users.find(function (x) { return x.id === me.id; });
      u.nome = String(nome || '').trim() || u.nome; J.DB.save(db);
    },
    /* Avatar: valida tipo real (MIME), tamanho e prefixo dataURL; nunca URL arbitrária. */
    setAvatar: function (dataUrl) {
      var me = Auth.current(); if (!me) throw new Error('Entre novamente.');
      if (dataUrl == null || dataUrl === '') {
        var db0 = J.DB.all(); db0.users.find(function (x) { return x.id === me.id; }).avatar = null; J.DB.save(db0); return null;
      }
      var m = /^data:(image\/(png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
      if (!m) throw new Error('Envie uma imagem PNG, JPG, WEBP ou GIF.');
      var bytes = Math.floor(m[3].length * 3 / 4);
      if (bytes > 300 * 1024) throw new Error('Imagem muito grande (máx 300 KB).');
      var db = J.DB.all(); db.users.find(function (x) { return x.id === me.id; }).avatar = 'data:' + m[1] + ';base64,' + m[3]; J.DB.save(db);
      return true;
    }
  };
  J.Auth = Auth;
})(window.Juntos);
