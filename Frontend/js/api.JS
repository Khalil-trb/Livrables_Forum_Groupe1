const API_BASE = 'http://localhost:3000/api';

const ACCOUNTS_KEY = 'forum_accounts';
const CURRENT_ACCOUNT_KEY = 'forum_current_account_id';

const api = {
  async request(method, endpoint, body = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = authStore.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (auth && res.status === 401) {
      authStore.clearCurrentAccount();
      throw new Error('Session expirée ou invalide. Reconnectez-vous.');
    }
    if (!res.ok) throw new Error(data.error || 'Requete impossible');
    return data;
  },
  get: (endpoint, auth = false) => api.request('GET', endpoint, null, auth),
  post: (endpoint, body, auth = false) => api.request('POST', endpoint, body, auth),
  put: (endpoint, body, auth = false) => api.request('PUT', endpoint, body, auth),
  patch: (endpoint, body, auth = false) => api.request('PATCH', endpoint, body, auth),
  delete: (endpoint, auth = false) => api.request('DELETE', endpoint, null, auth),
};

const authStore = {
  loadAccounts() {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  },
  getCurrentAccountId() {
    return localStorage.getItem(CURRENT_ACCOUNT_KEY);
  },
  setCurrentAccountId(id) {
    if (!id) {
      localStorage.removeItem(CURRENT_ACCOUNT_KEY);
      return;
    }
    localStorage.setItem(CURRENT_ACCOUNT_KEY, String(id));
  },
  migrateLegacySession() {
    const legacyToken = localStorage.getItem('token');
    const legacyUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!legacyToken || !legacyUser?.id) return;

    const accounts = this.loadAccounts();
    const accountId = String(legacyUser.id);
    const next = {
      id: accountId,
      user: legacyUser,
      token: legacyToken,
      lastUsedAt: Date.now(),
    };
    const existingIndex = accounts.findIndex((a) => a.id === accountId);
    if (existingIndex >= 0) accounts[existingIndex] = next;
    else accounts.push(next);
    this.saveAccounts(accounts);
    this.setCurrentAccountId(accountId);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getAccounts() {
    this.migrateLegacySession();
    return this.loadAccounts();
  },
  getCurrentAccount() {
    const accounts = this.getAccounts();
    const currentId = this.getCurrentAccountId();
    if (!accounts.length) return null;
    if (currentId) {
      const found = accounts.find((a) => a.id === currentId);
      if (found) return found;
    }
    const fallback = accounts[0];
    this.setCurrentAccountId(fallback.id);
    return fallback;
  },
  getToken() {
    return this.getCurrentAccount()?.token || null;
  },
  clearCurrentAccount() {
    const current = this.getCurrentAccount();
    if (!current) return;
    const accounts = this.getAccounts().filter((a) => a.id !== current.id);
    this.saveAccounts(accounts);
    if (!accounts.length) this.setCurrentAccountId(null);
    else this.setCurrentAccountId(accounts[0].id);
  },
};

const auth = {
  isLoggedIn: () => !!authStore.getCurrentAccount(),
  getUser: () => authStore.getCurrentAccount()?.user || null,
  getAccounts: () => authStore.getAccounts().map((a) => a.user),
  login: (token, user) => {
    if (!user?.id) return;
    const accountId = String(user.id);
    const accounts = authStore.getAccounts();
    const next = { id: accountId, user, token, lastUsedAt: Date.now() };
    const existingIndex = accounts.findIndex((a) => a.id === accountId);
    if (existingIndex >= 0) accounts[existingIndex] = next;
    else accounts.push(next);
    authStore.saveAccounts(accounts);
    authStore.setCurrentAccountId(accountId);
  },
  switchAccount: (userId, redirect = true) => {
    const accounts = authStore.getAccounts();
    const nextId = String(userId);
    if (!accounts.find((a) => a.id === nextId)) return;
    authStore.setCurrentAccountId(nextId);
    if (redirect) window.location.reload();
  },
  logoutCurrent: () => {
    const current = authStore.getCurrentAccount();
    if (!current) {
      window.location.href = '/index.html';
      return;
    }
    const accounts = authStore.getAccounts().filter((a) => a.id !== current.id);
    authStore.saveAccounts(accounts);
    if (!accounts.length) authStore.setCurrentAccountId(null);
    else authStore.setCurrentAccountId(accounts[0].id);
    window.location.href = '/index.html';
  },
  logout: () => {
    authStore.saveAccounts([]);
    authStore.setCurrentAccountId(null);
    window.location.href = '/index.html';
  },
  renderAccountMenu: (containerId, opts = {}) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const user = auth.getUser();
    const accounts = authStore.getAccounts();
    const basePath = opts.basePath || '';
    const loginHref = `${basePath}pages/login.html`;
    const registerHref = `${basePath}pages/register.html`;

    if (!user) {
      container.innerHTML = `<a href="${loginHref}">Connexion</a> <a href="${registerHref}" class="btn btn-primary btn-sm">Inscription</a>`;
      return;
    }

    const switchable = accounts.filter((a) => String(a.id) !== String(user.id));
    container.innerHTML = `
    <details class="account-details">
        <summary class="account-summary">
          ${user.username} ▾
        </summary>
        <div class="account-menu">
          <div class="account-menu-label">Compte actuel</div>
          <div class="account-menu-current">${user.username}</div>
          ${switchable.length ? `<div class="account-menu-label">Changer de compte</div>` : ''}
          ${switchable.map((a) => `<button type="button" data-switch-account="${a.id}" class="account-switch-btn">${a.user.username} (${a.user.role})</button>`).join('')}
          <div class="account-menu-actions">
            <a href="${basePath}pages/settings.html">Profil / Parametres</a>
            <a href="${loginHref}">Ajouter un compte</a>
            <button type="button" data-logout-current>Deconnexion</button>
          </div>
        </div>
      </details>
    `;

    container.querySelectorAll('[data-switch-account]').forEach((btn) => {
      btn.addEventListener('click', () => auth.switchAccount(btn.getAttribute('data-switch-account')));
    });
    container.querySelector('[data-logout-current]')?.addEventListener('click', () => auth.logoutCurrent());
  }
};

