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
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
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
      container.innerHTML = `<a href="${loginHref}">Login</a> <a href="${registerHref}" class="btn btn-primary btn-sm">Register</a>`;
      return;
    }

    const switchable = accounts.filter((a) => String(a.id) !== String(user.id));
    container.innerHTML = `
      <details style="position:relative;">
        <summary style="list-style:none; cursor:pointer; color:var(--text-dim); font-size:0.85rem;">
          ${user.username} ▾
        </summary>
        <div style="position:absolute; right:0; top:1.8rem; min-width:240px; background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:0.6rem; z-index:999;">
          <div style="font-size:0.76rem; color:var(--text-muted); margin-bottom:0.4rem;">Current account</div>
          <div style="font-size:0.84rem; margin-bottom:0.6rem;">${user.username} (${user.role})</div>
          ${switchable.length ? `<div style="font-size:0.76rem; color:var(--text-muted); margin-bottom:0.35rem;">Switch account</div>` : ''}
          ${switchable.map((a) => `<button type="button" data-switch-account="${a.id}" style="display:block; width:100%; text-align:left; background:none; color:var(--text-dim); border:1px solid var(--line); border-radius:8px; padding:0.35rem 0.5rem; margin-bottom:0.35rem; cursor:pointer;">${a.user.username} (${a.user.role})</button>`).join('')}
          <div style="display:flex; gap:0.45rem; margin-top:0.4rem;">
            <a href="${loginHref}" style="font-size:0.8rem;">Add account</a>
            <button type="button" data-logout-current style="margin-left:auto; background:none; border:none; color:var(--accent2); cursor:pointer; font-size:0.8rem;">Logout current</button>
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
