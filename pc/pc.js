// MQM PC · phần dùng chung cho 4 trang (trang chủ, Setup, Đăng ký mẫu, Đánh giá mẫu)
// API: Apps Script "MQM PC" trong tài khoản thaixclaude. Đăng nhập (tên + PIN) lưu token trên máy này 12 giờ.
const PC_API = 'https://script.google.com/macros/s/AKfycby7R2fwonLjguL1Vh6RyipQ45xhSfv9OPg9Fs-_elgMTUBr8knevf3R6JBPWcSPwajx/exec';
const PC = {
  get(q) { return fetch(`${PC_API}?api=${q}`, { credentials: 'omit' }).then(r => r.json()); },
  post(api, data) {
    return fetch(PC_API, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ api, t: PC.token(), data }) }).then(r => r.json());
  },
  token() { try { return localStorage.getItem('mqmPcToken') || ''; } catch (e) { return ''; } },
  user() { try { return JSON.parse(localStorage.getItem('mqmPcUser') || 'null'); } catch (e) { return null; } },
  save(tok, user) { try { localStorage.setItem('mqmPcToken', tok); localStorage.setItem('mqmPcUser', JSON.stringify(user)); } catch (e) {} },
  logout() { try { localStorage.removeItem('mqmPcToken'); localStorage.removeItem('mqmPcUser'); } catch (e) {} },
  // Vai trò được vào từng phần: RD / MKT vào Setup, HOST vào Đăng ký mẫu, ADMIN vào cả hai; Đánh giá thì ai cũng vào
  can(part, u) { u = u || PC.user(); if (!u) return false; return part === 'setup' ? ['RD', 'MKT', 'ADMIN'].includes(u.role) : part === 'register' ? ['HOST', 'ADMIN'].includes(u.role) : true; },
  roleName: { RD: 'RD', MKT: 'MKT', HOST: 'Host · đăng ký mẫu', ADMIN: 'Quản lý' },
  // Hộp đăng nhập; resolve khi đăng nhập xong
  login(title) {
    return new Promise(done => {
      const box = document.createElement('div');
      box.className = 'pc-login';
      box.innerHTML = `<form class="pc-login-card"><b>${title || 'Đăng nhập'}</b><small>Tài khoản do anh Thái cấp</small>
        <label>Tên đăng nhập<input name="user" autocomplete="username" required></label>
        <label>Mã PIN<input name="pin" type="password" inputmode="numeric" autocomplete="current-password" required></label>
        <p class="pc-err" hidden></p><div class="pc-row"><button type="button" class="pc-ghost">Huỷ</button><button class="pc-main">Đăng nhập</button></div></form>`;
      document.body.appendChild(box);
      const f = box.querySelector('form'), err = box.querySelector('.pc-err');
      box.querySelector('.pc-ghost').onclick = () => { box.remove(); done(null); };
      f.onsubmit = async e => {
        e.preventDefault(); err.hidden = true; f.querySelector('.pc-main').disabled = true;
        try {
          const r = await PC.post('login', { user: f.user.value, pin: f.pin.value });
          if (!r.ok) throw new Error(r.error);
          PC.save(r.token, r.user); box.remove(); done(r.user);
        } catch (x) { err.textContent = x.message || 'Không đăng nhập được'; err.hidden = false; f.querySelector('.pc-main').disabled = false; }
      };
      f.user.focus();
    });
  },
  // Trang Setup / Đăng ký: chưa đăng nhập hoặc sai quyền thì hỏi đăng nhập, không được thì về trang chủ
  async guard(part) {
    let u = PC.user();
    if (u && PC.can(part, u)) {
      const r = await PC.get('me&t=' + encodeURIComponent(PC.token())).catch(() => null);
      if (r && r.ok) return { user: r.user, mine: r.mine };
      PC.logout(); u = null;
    }
    u = await PC.login(part === 'setup' ? 'Đăng nhập để vào Setup' : 'Đăng nhập để vào Đăng ký mẫu');
    if (!u || !PC.can(part, u)) { alert(u ? 'Tài khoản này không có quyền vào phần này.' : 'Cần đăng nhập.'); location.href = './'; return null; }
    const r = await PC.get('me&t=' + encodeURIComponent(PC.token()));
    return { user: r.user || u, mine: r.mine };
  },
  // Thanh trên cùng: về trang chủ + người đang đăng nhập
  bar(el, label) {
    const u = PC.user();
    el.innerHTML = `<a class="pc-home" href="./">← MQM PC</a><span class="pc-part">${label}</span>${u ? `<span class="pc-me">${u.name} · ${PC.roleName[u.role] || u.role}<button class="pc-out">Đăng xuất</button></span>` : ''}`;
    const o = el.querySelector('.pc-out'); if (o) o.onclick = () => { PC.logout(); location.href = './'; };
  },
};
// Kiểu cho thanh trên và hộp đăng nhập (chèn 1 lần)
(() => {
  const s = document.createElement('style');
  s.textContent = `.pc-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 16px;background:#141414;color:#fff;font:600 13px/1.3 system-ui,Segoe UI,Arial,sans-serif}
  .pc-bar a{color:#eef36a;text-decoration:none;font-weight:800}.pc-part{font-weight:700}.pc-me{margin-left:auto;display:flex;align-items:center;gap:8px;color:#d9d9d9}
  .pc-out{border:1px solid #555;background:none;color:#fff;border-radius:999px;padding:3px 10px;font:inherit;cursor:pointer}
  .pc-login{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99;padding:16px}
  .pc-login-card{background:#fff;color:#141414;border-radius:20px;padding:22px;width:100%;max-width:360px;display:flex;flex-direction:column;gap:10px;font:14px system-ui,Segoe UI,Arial,sans-serif}
  .pc-login-card b{font-size:18px}.pc-login-card small{color:#666}.pc-login-card label{display:flex;flex-direction:column;gap:4px;font-weight:700;font-size:13px}
  .pc-login-card input{font:inherit;font-size:16px;padding:10px 12px;border:1.5px solid #ddd;border-radius:12px}
  .pc-row{display:flex;gap:8px;justify-content:flex-end;margin-top:6px}.pc-row button{font:inherit;font-weight:700;border-radius:999px;padding:10px 18px;cursor:pointer;border:1.5px solid #141414}
  .pc-main{background:#141414;color:#fff}.pc-ghost{background:#fff}.pc-err{color:#d93a2b;margin:0;font-size:13px}`;
  document.head.appendChild(s);
})();
