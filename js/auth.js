/* Auth — adapter local (fundação). Produção: delegar a Supabase Auth / Firebase Auth.
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
  /* ============ LOGIN SOCIAL (OAuth/OIDC, sem segredos no frontend) ============
     Google (GIS token flow) + Facebook (JS SDK) + Apple (JS popup + JWKS).
     Cliente público: só IDs públicos via window.JuntosConfig (js/config.js).
     Vinculação: identidade (provider+sub) manda; e-mail verificado sugere
     vínculo com consentimento; Facebook (sem flag) exige senha da conta. */
  var _scripts = {};
  function loadScript(src) {
    if (_scripts[src]) return _scripts[src];
    _scripts[src] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.defer = true;
      s.onload = function () { resolve(true); };
      s.onerror = function () { reject(new Error('Falha de comunicação com o provedor. Verifique sua conexão.')); };
      document.head.appendChild(s);
    });
    return _scripts[src];
  }
  function socialCfg() {
    var c = (typeof window !== 'undefined' && window.JuntosConfig) || {};
    return {
      googleClientId: String(c.GOOGLE_CLIENT_ID || ''),
      facebookAppId: String(c.FACEBOOK_APP_ID || ''),
      appleClientId: String(c.APPLE_CLIENT_ID || ''),
      appleRedirectUri: String(c.APPLE_REDIRECT_URI || '')
    };
  }
  function socialEnabled(provider) {
    var c = socialCfg();
    if (provider === 'google') return !!c.googleClientId;
    if (provider === 'facebook') return !!c.facebookAppId;
    if (provider === 'apple') return !!c.appleClientId;
    return false;
  }
  function randState() {
    try {
      var b = new Uint8Array(16), s = '';
      ((window.crypto || window.msCrypto).getRandomValues(b));
      for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2);
      return s;
    } catch (e) {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
  }
  function b64urlToBytes(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function socialError(provider, err) {
    var m = String((err && err.message) || err || '');
    if (/cancel|cancelado|popup closed|user_cancel|auth_cancel/i.test(m)) return new Error('Login cancelado. Tente novamente quando quiser.');
    if (/access_denied|denied|negad/i.test(m)) return new Error('Autorização negada no provedor. Tente novamente ou use outro método.');
    if (/rede|network|communication|comunica/i.test(m)) return new Error('Falha de comunicação com o provedor. Verifique sua conexão.');
    if (/configura/i.test(m)) return err;
    if (/vinculada a outro|password|senha|e-mail|email/i.test(m)) return err;
    return new Error('Não foi possível entrar com ' + providerName(provider) + '. Tente novamente ou use e-mail e senha.');
  }
  function providerName(p) { return p === 'google' ? 'Google' : p === 'facebook' ? 'Facebook' : p === 'apple' ? 'Apple' : p; }
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
      u.pass = hash(npass, u.salt);
      db.resets = db.resets.filter(function (x) { return x.email !== email; });
      J.DB.save(db);
      try { J.DB.reactivateAccount(u.id); } catch (eR) {}
      setS({ userId: u.id, sv: u.session_version || 1 }); return u;
    },
    socialProviders: function () {
      return [
        { id: 'google', label: 'Continuar com Google', enabled: socialEnabled('google') },
        { id: 'facebook', label: 'Continuar com Facebook', enabled: socialEnabled('facebook') },
        { id: 'apple', label: 'Continuar com Apple', enabled: socialEnabled('apple') }
      ];
    },
    socialErrorMessage: function (provider, err) { return socialError(provider, err).message; },
    /* Google: GIS token flow (popup, sem redirect/CSRF) → userinfo validado pelo Google. */
    socialGoogle: function () {
      var c = socialCfg();
      if (!c.googleClientId) return Promise.reject(new Error('Login com Google ainda não configurado.'));
      return loadScript('https://accounts.google.com/gsi/client').then(function () {
        return new Promise(function (resolve, reject) {
          var done = false;
          try {
            var client = window.google.accounts.oauth2.initTokenClient({
              client_id: c.googleClientId,
              scope: 'openid email profile',
              callback: function (resp) {
                if (done) return; done = true;
                if (!resp || resp.error || !resp.access_token) {
                  reject(new Error(resp && resp.error === 'popup_closed_by_user' ? 'Login cancelado. Tente novamente quando quiser.' : 'Autorização negada no provedor.'));
                  return;
                }
                fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + resp.access_token } })
                  .then(function (r) {
                    if (!r.ok) throw new Error('Falha de comunicação com o provedor.');
                    return r.json();
                  })
                  .then(function (u) {
                    if (!u || !u.sub) throw new Error('Resposta inválida do provedor.');
                    resolve({ provider: 'google', providerUserId: String(u.sub), name: String(u.name || ''), email: String(u.email || ''), emailVerified: u.email_verified === true || u.email_verified === 'true' });
                  })
                  .catch(function (e) { reject(e); });
              }
            });
            client.requestAccessToken({ prompt: '' });
          } catch (e) { if (!done) { done = true; reject(e); } }
        });
      });
    },
    /* Facebook: JS SDK (sessão validada pelo próprio SDK) → /me. Sem flag de
       e-mail no FB: vinculação a conta existente exige a senha dela. */
    socialFacebook: function () {
      var c = socialCfg();
      if (!c.facebookAppId) return Promise.reject(new Error('Login com Facebook ainda não configurado.'));
      return loadScript('https://connect.facebook.net/pt_BR/sdk.js').then(function () {
        return new Promise(function (resolve, reject) {
          try {
            if (!window.FB) throw new Error('Falha de comunicação com o provedor.');
            window.FB.init({ appId: c.facebookAppId, cookie: false, xfbml: false, version: 'v21.0' });
            window.FB.login(function (resp) {
              if (!resp || !resp.authResponse || !resp.authResponse.accessToken) {
                reject(new Error('Autorização negada no provedor.'));
                return;
              }
              window.FB.api('/me', { fields: 'id,name,email' }, function (u) {
                if (!u || u.error || !u.id) { reject(new Error('Falha de comunicação com o provedor.')); return; }
                resolve({ provider: 'facebook', providerUserId: String(u.id), name: String(u.name || ''), email: String(u.email || ''), emailVerified: false });
              });
            }, { scope: 'email,public_profile' });
          } catch (e) { reject(e); }
        });
      });
    },
    /* Apple: popup (state anti-CSRF) → id_token validado localmente contra o
       JWKS oficial (RS256 + iss/aud/exp/sub). Relay privado é aceito como e-mail. */
    socialApple: function () {
      var c = socialCfg();
      if (!c.appleClientId) return Promise.reject(new Error('Login com Apple ainda não configurado.'));
      return loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js').then(function () {
        if (!window.AppleID || !window.AppleID.auth) throw new Error('Falha de comunicação com o provedor.');
        var state = randState();
        window.AppleID.auth.init({ clientId: c.appleClientId, scope: 'name email', redirectURI: c.appleRedirectUri || (location.origin + '/#/auth/callback'), state: state, usePopup: true });
        return window.AppleID.auth.signIn().then(function (resp) {
          var auth = (resp && resp.authorization) || {};
          if (!auth.id_token) throw new Error('Resposta inválida do provedor.');
          if (auth.state && auth.state !== state) throw new Error('Sessão inválida. Tente novamente.');
          return Auth.verifyAppleIdToken(auth.id_token, c.appleClientId).then(function (claims) {
            var person = (resp.user && resp.user.name) || {};
            var fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
            return { provider: 'apple', providerUserId: String(claims.sub), name: fullName, email: String(claims.email || ''), emailVerified: claims.email_verified === true || claims.email_verified === 'true' };
          });
        });
      });
    },
    verifyAppleIdToken: function (idToken, clientId) {
      var parts = String(idToken || '').split('.');
      if (parts.length !== 3) return Promise.reject(new Error('Resposta inválida do provedor.'));
      var header, payload;
      try {
        header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
        payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
      } catch (e) { return Promise.reject(new Error('Resposta inválida do provedor.')); }
      if (!header.kid) return Promise.reject(new Error('Resposta inválida do provedor.'));
      return fetch('https://appleid.apple.com/auth/keys').then(function (r) {
        if (!r.ok) throw new Error('Falha de comunicação com o provedor.');
        return r.json();
      }).then(function (jwks) {
        var keys = (jwks && jwks.keys) || [];
        var jwk = keys.filter(function (k) { return k.kid === header.kid && k.kty === 'RSA'; })[0];
        if (!jwk) throw new Error('Resposta inválida do provedor.');
        var data = new TextEncoder().encode(parts[0] + '.' + parts[1]);
        var sig = b64urlToBytes(parts[2]);
        return window.crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
          .then(function (key) { return window.crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data); })
          .then(function (ok) {
            if (!ok) throw new Error('Sessão inválida. Tente novamente.');
            if (payload.iss !== 'https://appleid.apple.com') throw new Error('Sessão inválida. Tente novamente.');
            if (payload.aud !== clientId) throw new Error('Sessão inválida. Tente novamente.');
            if (!(payload.exp * 1000 > Date.now())) throw new Error('Sessão expirada. Tente novamente.');
            if (!payload.sub) throw new Error('Resposta inválida do provedor.');
            return payload;
          });
      });
    },
    /* Orquestração: identidade manda; e-mail verificado sugere vínculo com
       consentimento; Facebook/sem e-mail verificado exige senha da conta. */
    socialLogin: function (profile) {
      try { J.DB.rateCheck('social:' + profile.provider, 20, 60000); } catch (e) { throw new Error('Muitas tentativas. Aguarde um momento.'); }
      var provider = String(profile.provider || '').toLowerCase();
      var sub = String(profile.providerUserId || '');
      if (['google', 'facebook', 'apple'].indexOf(provider) < 0 || !sub) throw new Error('Identidade do provedor inválida.');
      var ident = J.DB.findOAuthIdentity(provider, sub);
      if (ident) {
        var db0 = J.DB.all();
        var u0 = db0.users.find(function (x) { return x.id === ident.user_id; });
        if (!u0) throw new Error('Conta não encontrada. Fale com o suporte.');
        try { J.DB.reactivateAccount(u0.id); } catch (eR) {}
        setS({ userId: u0.id, sv: u0.session_version || 1 });
        try { J.DB.logSecurityEvent(u0.id, 'login', { action: 'social_login', metadata: { provider: provider } }); } catch (e2) {}
        return { status: 'ok', user: u0, isNew: false };
      }
      var email = String(profile.email || '').trim().toLowerCase();
      if (!email || email.indexOf('@') < 0) {
        throw new Error(provider === 'facebook'
          ? 'Não conseguimos obter seu e-mail do Facebook. Libere o e-mail nas permissões ou use outro método.'
          : 'Não conseguimos obter seu e-mail. Tente outro método.');
      }
      var existing = J.DB.findUserByEmail(email);
      if (!existing) {
        var nm = String(profile.name || '').trim();
        if (nm.length < 2) {
          var base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
          nm = base.charAt(0).toUpperCase() + base.slice(1);
        }
        var db = J.DB.all();
        var nu = { id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nome: nm.slice(0, 80), email: email, salt: null, pass: null, avatar: null, deactivated_at: null, session_version: 1, created_at: new Date().toISOString() };
        db.users.push(nu); J.DB.save(db);
        J.DB.linkOAuthIdentity(nu.id, { provider: provider, provider_user_id: sub, email: email, email_verified: !!profile.emailVerified });
        setS({ userId: nu.id, sv: 1 });
        try { J.DB.logSecurityEvent(nu.id, 'register', { action: 'social_register', metadata: { provider: provider } }); } catch (e3) {}
        return { status: 'ok', user: nu, isNew: true };
      }
      return { status: 'need_link', user: { id: existing.id, nome: existing.nome, email: existing.email }, profile: { provider: provider, providerUserId: sub, name: profile.name, email: email, emailVerified: !!profile.emailVerified }, needsPassword: !!existing.pass };
    },
    socialLinkConfirm: function (userId, profile, password) {
      var db = J.DB.all();
      var u = db.users.find(function (x) { return x.id === userId; });
      if (!u) throw new Error('Conta não encontrada.');
      if (u.pass) {
        if (!password) throw new Error('Digite a senha da sua conta para confirmar a vinculação.');
        if (u.pass !== hash(password, u.salt)) {
          try { J.DB.logSecurityEvent(u.id, 'login', { action: 'social_link', result: 'denied', metadata: { provider: profile.provider } }); } catch (e) {}
          throw new Error('Senha incorreta. A conta social não foi vinculada.');
        }
      }
      J.DB.linkOAuthIdentity(userId, { provider: profile.provider, provider_user_id: profile.providerUserId, email: profile.email, email_verified: !!profile.emailVerified });
      try { J.DB.reactivateAccount(userId); } catch (eR) {}
      var u3 = J.DB.all().users.find(function (x) { return x.id === userId; });
      setS({ userId: userId, sv: (u3 && u3.session_version) || 1 });
      try { J.DB.logSecurityEvent(userId, 'login', { action: 'social_link', metadata: { provider: profile.provider } }); } catch (e2) {}
      return u;
    },
    /* Reautenticação recente p/ ações destrutivas (em memória, 10 min).
       Senha: confere hash. Social: novo popup com sub igual ao já vinculado. */
    reauthenticatePassword: function (userId, password) {
      var db = J.DB.all();
      var u = db.users.find(function (x) { return x.id === userId; });
      if (!u || !u.pass) throw new Error('Esta conta não tem senha. Use seu login social para confirmar.');
      if (u.pass !== hash(password, u.salt)) throw new Error('Senha incorreta.');
      _reauth[userId] = { userId: userId, method: 'password', at: Date.now() };
      return _reauth[userId];
    },
    reauthenticateSocial: function (provider) {
      var me = Auth.current();
      if (!me) throw new Error('Entre novamente.');
      var linked = J.DB.userOAuthIdentities(me.id).filter(function (x) { return x.provider === provider; });
      if (!linked.length) throw new Error('Nenhum login social deste provedor vinculado à sua conta.');
      var fn = provider === 'google' ? Auth.socialGoogle : provider === 'facebook' ? Auth.socialFacebook : Auth.socialApple;
      return fn().then(function (profile) {
        var okSub = linked.some(function (x) { return x.provider_user_id === String(profile.providerUserId); });
        if (!okSub) throw new Error('Este login social não pertence a esta conta.');
        _reauth[me.id] = { userId: me.id, method: 'social', provider: provider, at: Date.now() };
        return _reauth[me.id];
      });
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
