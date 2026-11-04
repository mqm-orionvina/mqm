// MQM ORION VINA · phần dùng chung cho 4 trang (trang chủ, Setup, Đăng ký mẫu, Đánh giá mẫu)
// API: Apps Script "MQM ORION VINA" trong tài khoản thaixclaude. Đăng nhập (tên + PIN) lưu token trên máy này 12 giờ.
const PC_API = 'https://script.google.com/macros/s/AKfycby7R2fwonLjguL1Vh6RyipQ45xhSfv9OPg9Fs-_elgMTUBr8knevf3R6JBPWcSPwajx/exec';
// Logo ORION (vẽ lại bằng SVG, giữ cùng nội dung với orion.svg)
const PC_LOGO = '<svg viewBox="0 0 150 100" aria-label="ORION"><circle cx="60" cy="54" r="44" fill="#e8222a"/><g fill="#fff"><polygon points="19.4,79.5 21.4,83.7 26.0,83.5 22.7,86.6 24.3,90.9 20.2,88.7 16.7,91.6 17.5,87.1 13.7,84.5 18.2,83.9"/><polygon points="36.0,82.0 37.5,86.0 41.7,86.1 38.4,88.8 39.5,92.9 36.0,90.5 32.5,92.9 33.6,88.8 30.3,86.1 34.5,86.0"/><polygon points="7.3,56.5 10.9,60.8 16.3,59.1 13.4,63.9 16.6,68.5 11.1,67.2 7.8,71.7 7.4,66.1 2.0,64.3 7.2,62.1"/><polygon points="17.4,30.3 21.5,36.1 28.4,34.6 24.2,40.2 27.8,46.3 21.1,44.1 16.4,49.3 16.5,42.3 10.0,39.5 16.7,37.4"/><polygon points="38.3,12.1 42.4,19.5 50.8,18.7 45.0,24.9 48.3,32.6 40.7,29.0 34.4,34.6 35.5,26.2 28.2,21.9 36.5,20.4"/><polygon points="65.5,1.0 69.3,10.1 79.2,10.2 71.7,16.6 74.6,26.0 66.2,20.9 58.2,26.6 60.5,17.0 52.5,11.1 62.4,10.4"/></g><polygon fill="#e8222a" points="126.0,6.0 130.9,19.2 145.0,19.8 134.0,28.6 137.8,42.2 126.0,34.4 114.2,42.2 118.0,28.6 107.0,19.8 121.1,19.2"/></svg>';
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
  can(part, u) { u = u || PC.user(); if (!u) return false; return part === 'setup' ? ['RD', 'MKT', 'FQS', 'ADMIN'].includes(u.role) : part === 'register' ? ['HOST', 'ADMIN'].includes(u.role) : true; },
  roleName: { RD: 'RD', MKT: 'MKT', FQS: 'FQS', HOST: 'Host · đăng ký mẫu', ADMIN: 'Quản lý' },
  // Hộp đăng nhập; resolve khi đăng nhập xong
  login(title) {
    return new Promise(done => {
      const box = document.createElement('div');
      box.className = 'pc-login';
      box.innerHTML = `<form class="pc-login-card"><button type="button" class="pc-x" aria-label="Đóng">×</button>
        <span class="pc-logo">${PC_LOGO}</span><b>${title || 'Chào mừng đến MQM ORION VINA'}</b><small>Đăng nhập bằng tài khoản anh Thái cấp</small>
        <label>Tên đăng nhập<input name="user" autocomplete="username" placeholder="Tên đăng nhập" required></label>
        <label>Mã PIN<input name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="Mã PIN" required></label>
        <p class="pc-err" hidden></p><button class="pc-main">Tiếp tục</button>
        <div class="pc-or">HOẶC</div><a class="pc-ghost" href="evaluate.html">Vào đánh giá mẫu, không cần đăng nhập</a>
        <p class="pc-fine">Quên PIN? Liên hệ anh Thái để cấp lại.</p></form>`;
      document.body.appendChild(box);
      const f = box.querySelector('form'), err = box.querySelector('.pc-err');
      box.querySelector('.pc-x').onclick = () => { box.remove(); done(null); };
      box.onclick = e => { if (e.target === box) { box.remove(); done(null); } };
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
    el.innerHTML = `<button class="pc-back" aria-label="Quay lại">←<span class="t"> Quay lại</span></button><a class="pc-home" href="./"><span class="pc-logo sm">${PC_LOGO}</span>MQM ORION VINA</a><span class="pc-part">${label}</span>${u ? `<span class="pc-me">${u.name} · ${PC.roleName[u.role] || u.role}<button class="pc-out">Đăng xuất</button></span>` : ''}`;
    const o = el.querySelector('.pc-out'); if (o) o.onclick = () => { PC.logout(); location.href = './'; };
    // Quay lại trang trước trong app; mở thẳng từ link / QR thì về trang chủ
    el.querySelector('.pc-back').onclick = () => { if (history.length > 1 && document.referrer.startsWith(location.origin)) history.back(); else location.href = './'; };
  },
};
// Link riêng của anh Thái (pc/?k=…): đổi khoá lấy token quản lý dài hạn, lưu trên máy này, bỏ khoá khỏi thanh địa chỉ rồi tải lại
(() => {
  const k = new URLSearchParams(location.search).get('k');
  if (!k) return;
  history.replaceState(null, '', location.pathname);
  PC.post('keyLogin', { k }).then(r => {
    if (!r.ok) throw new Error(r.error);
    PC.save(r.token, r.user); location.reload();
  }).catch(e => alert('Link quản lý không dùng được: ' + e.message));
})();
// Kiểu chung: thanh trên, hộp đăng nhập, và giao diện trắng · bo tròn · nút viên thuốc đỏ cho 3 trang (chèn 1 lần, đè kiểu cũ của trang)
(() => {
  const s = document.createElement('style');
  s.textContent = `
  .pc-logo{display:grid;place-items:center;flex:none}.pc-logo svg{width:66px;height:44px}
  .pc-logo.sm svg{width:42px;height:28px}
  .pc-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 20px;background:#fff;color:#111;font:600 14px/1.3 "Segoe UI",system-ui,Arial,sans-serif;position:sticky;top:0;z-index:20;border-bottom:1px solid #f0f0f0}
  .pc-bar a.pc-home{display:flex;align-items:center;gap:8px;color:#c8102e;text-decoration:none;font-weight:800;font-size:18px;letter-spacing:-.02em}
  .pc-back{border:0;background:#efefef;color:#111;border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer}.pc-back:hover{background:#e2e2e2}
  .pc-part{font-weight:700;background:#efefef;border-radius:999px;padding:7px 14px}.pc-me{margin-left:auto;display:flex;align-items:center;gap:10px;color:#5f5f5f}
  .pc-out{border:0;background:#efefef;color:#111;border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer}.pc-out:hover{background:#e2e2e2}
  .pc-login{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:99;padding:16px;overflow:auto}
  .pc-login-card{position:relative;background:#fff;color:#111;border-radius:32px;padding:30px 34px 24px;width:100%;max-width:480px;display:flex;flex-direction:column;align-items:stretch;gap:12px;font:15px/1.4 "Segoe UI",system-ui,Arial,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.25)}
  .pc-login-card .pc-logo{align-self:center;margin-bottom:4px}
  .pc-login-card>b{font-size:30px;line-height:1.15;letter-spacing:-.03em;text-align:center;font-weight:800}
  .pc-login-card>small{color:#5f5f5f;text-align:center;font-size:15px;margin:-4px 0 6px}
  .pc-login-card label{display:flex;flex-direction:column;gap:6px;font-weight:600;font-size:13px;color:#333}
  .pc-login-card input{font:inherit;font-size:16px;height:52px;padding:0 16px;border:2px solid #cdcdcd;border-radius:16px;outline:none;width:100%;box-sizing:border-box}
  .pc-login-card input:focus{border-color:#0074e8;box-shadow:0 0 0 4px rgba(0,116,232,.18)}
  .pc-main{margin-top:6px;height:50px;border:0;border-radius:999px;background:#c8102e;color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}.pc-main:hover{background:#a00c24}.pc-main:disabled{opacity:.5}
  .pc-or{display:flex;align-items:center;gap:12px;color:#111;font-weight:700;font-size:13px;margin:2px 0}.pc-or:before,.pc-or:after{content:"";flex:1;height:1px;background:#e2e2e2}
  .pc-ghost{height:50px;border:2px solid #cdcdcd;border-radius:999px;background:#fff;color:#111;font-weight:700;display:flex;align-items:center;justify-content:center;text-decoration:none;text-align:center;padding:0 14px}.pc-ghost:hover{background:#f6f6f6}
  .pc-fine{margin:4px 0 0;text-align:center;font-size:12px;color:#767676}
  .pc-x{position:absolute;right:16px;top:14px;width:40px;height:40px;border-radius:50%;border:0;background:none;font-size:28px;line-height:1;cursor:pointer;color:#111}.pc-x:hover{background:#efefef}
  .pc-err{color:#c8102e;margin:0;font-size:13px;font-weight:600}
  @media (max-width:520px){.pc-login{align-items:flex-end;padding:0}.pc-login-card{border-radius:32px 32px 0 0;padding:26px 20px 22px}.pc-login-card>b{font-size:25px}.pc-bar{padding:10px 12px;gap:8px;flex-wrap:nowrap}.pc-back{padding:8px 12px}.pc-back .t{display:none}
    .pc-bar a.pc-home{font-size:15px;white-space:nowrap;gap:6px}.pc-logo.sm svg{width:32px;height:22px}.pc-part{padding:6px 10px;font-size:12.5px;white-space:nowrap}.pc-me{display:none}}
  /* Giao diện chung 3 trang Setup / Đăng ký / Đánh giá */
  body:has(.pc-bar){background:#fff!important;font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif}
  /* Chỉ trắng · đỏ · xám: thay các màu hồng, xanh, vàng, tím cũ */
  :root:has(.pc-bar){--red-soft:#f3f3f3!important;--page:#fff!important;--line:#e6e6e6!important;--blue:#111!important;--green:#111!important;--amber:#8a8a8a!important;--g:#111!important;--g-soft:#f3f3f3!important;--ink:#111!important;--muted:#6b6b6b!important}
  .pc-bar~* .tag,.pc-bar~* .grp{background:#f1f1f1!important;color:#111!important;font-weight:700!important;letter-spacing:.01em}
  .pc-bar~* .tag.comp,.pc-bar~* .tag.new,.pc-bar~* .tag.low{background:#fff!important;color:#6b6b6b!important;box-shadow:inset 0 0 0 1px #dcdcdc}
  .pc-bar~* .tag.na{background:#fff!important;color:#c8102e!important;box-shadow:inset 0 0 0 1px #f0c4cc}
  .pc-bar~* .tag.ok{background:#111!important;color:#fff!important}
  .pc-bar~* .ball,.pc-bar~* .drow:focus-within{background:#f6f6f6!important}
  .pc-bar~* .p-ok{background:#111!important;color:#fff!important}.pc-bar~* .p-low{background:#efefef!important;color:#111!important}.pc-bar~* .p-none{background:#fff!important;color:#c8102e!important;box-shadow:inset 0 0 0 1px #f0c4cc}
  .pc-bar~* .done .ok{background:#c8102e!important;color:#fff!important}
  .pc-bar~* .savedbox.draft,.pc-bar~* .fileinfo.err{background:#f3f3f3!important;color:#111!important}
  .pc-bar~* .qt td.chg textarea:not(:placeholder-shown){border-color:#111!important;background:#fafafa!important}
  .pc-bar~* .prod .ic{background:#f3f3f3!important;color:#111!important}
  .pc-bar~* .sample{border-radius:22px!important}.pc-bar~* .sample .th{background:#f3f3f3!important}
  .pc-bar~* .bar .prog .track i{background:#c8102e!important}
  .pc-bar~.hero{background:#fff!important;color:#111!important;padding:28px 20px 18px!important}
  .pc-bar~.hero{text-align:center}.pc-bar~.hero .top,.pc-bar~.hero .txt{max-width:640px!important;margin:0 auto!important}
  .pc-bar~.hero .top{justify-content:center!important;gap:14px!important;flex-wrap:wrap}
  .pc-bar~.hero .brand{color:#c8102e;opacity:1!important}.pc-bar~.hero .right{align-items:center!important}
  .pc-bar~.hero h1{font-size:clamp(30px,5vw,46px)!important;letter-spacing:-.035em;line-height:1.08;margin:12px 0 8px!important}
  .pc-bar~.hero p{color:#5f5f5f!important;opacity:1!important;font-size:16px!important;margin:0 auto!important;max-width:560px}
  .pc-bar~.hero .lang{background:#efefef!important}.pc-bar~.hero .lang button{color:#111!important}.pc-bar~.hero .lang button.on{background:#111!important;color:#fff!important}
  .pc-bar~.wrap,.pc-bar~* .wrap{margin-top:8px!important}
  .pc-bar~* .card,.pc-bar~.card{border-radius:28px!important;box-shadow:none!important;border:1.5px solid #ececec;padding:20px!important}
  .pc-bar~* .card h2 .n{background:#c8102e!important;color:#fff!important}
  .pc-bar~* .btn{border-radius:999px!important;font-weight:700!important;background:#c8102e}
  .pc-bar~* .btn:hover{filter:brightness(.92)}
  .pc-bar~* .btn.ghost{background:#efefef!important;border:0!important;color:#111!important}
  .pc-bar~* .chip{border-radius:999px;border:0!important;background:#efefef!important;color:#111!important}
  .pc-bar~* .chip.on{background:#111!important;color:#fff!important}
  .pc-bar~* input:not([type=checkbox]):not([type=radio]),.pc-bar~* select,.pc-bar~* textarea{border:2px solid #cdcdcd!important;border-radius:16px!important;min-height:50px}
  .pc-bar~* textarea{min-height:110px}
  .pc-bar~* input:focus,.pc-bar~* select:focus,.pc-bar~* textarea:focus{border-color:#0074e8!important;box-shadow:0 0 0 4px rgba(0,116,232,.18)!important}`;
  document.head.appendChild(s);
})();
