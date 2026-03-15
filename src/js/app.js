/**
 * SPA Router & Pages - Xiaomi Home H5
 *
 * FIX: Thêm Store wrapper để đọc/ghi localStorage an toàn.
 *      Một số Super App WebView (WKWebView ITP, Alipay, WeChat sandbox)
 *      chặn hoặc isolate localStorage → truy cập trực tiếp sẽ throw exception.
 *      Store dùng in-memory fallback khi localStorage không khả dụng.
 */
(function () {
  'use strict';

  /* ===== Safe storage wrapper ===== */
  var Store = (function () {
    var _mem = {};
    function get(key, def) {
      try {
        var v = window.localStorage.getItem(key);
        return (v !== null && v !== undefined) ? v : (_mem[key] !== undefined ? _mem[key] : (def !== undefined ? def : null));
      } catch (e) {
        return _mem[key] !== undefined ? _mem[key] : (def !== undefined ? def : null);
      }
    }
    function set(key, value) {
      _mem[key] = String(value);
      try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }
    return { get: get, set: set };
  })();

  /* ===== Import: permissions module (js/permissions.js) — getSetting, authorize, hasPermission, setPermissionStatus, getPermissionStatus ===== */
  var MiniAppPermissions = (typeof window !== 'undefined' && window.MiniAppPermissions) || null;
  var getSetting = (MiniAppPermissions && MiniAppPermissions.getSetting) || function () { return Promise.reject(new Error('MiniAppPermissions not loaded')); };
  var authorize = (MiniAppPermissions && MiniAppPermissions.authorize) || function () { return Promise.reject(new Error('MiniAppPermissions not loaded')); };
  var hasPermission = (MiniAppPermissions && MiniAppPermissions.hasPermission) || function () { return Promise.resolve(false); };

  // Version + debug API calls (cùng dòng / cùng khu vực)
  var MINIAPP_DEBUG = { version: '1.0.3', windVaneReady: '-', getAuthCode: '-', superappLogin: '-' };
  function updateMiniAppDebug(key, value) {
    if (MINIAPP_DEBUG[key] !== undefined) MINIAPP_DEBUG[key] = value;
    var el = document.getElementById('miniapp-debug-bar');
    if (el) {
      var appIdStatus = getMiniAppAppId() ? '✓' : '(rỗng)';
      el.textContent = 'v' + MINIAPP_DEBUG.version + ' | appId: ' + appIdStatus + ' | WindVaneReady: ' + MINIAPP_DEBUG.windVaneReady + ' | getAuthCode: ' + MINIAPP_DEBUG.getAuthCode + ' | superapp-login: ' + MINIAPP_DEBUG.superappLogin;
    }
  }
  if (!window.__MINIAPP_VERSION_SHOWN__) {
    window.__MINIAPP_VERSION_SHOWN__ = true;
    var debugBar = document.createElement('div');
    debugBar.id = 'miniapp-debug-bar';
    debugBar.setAttribute('style', 'position:fixed;top:0;left:0;right:0;z-index:9999;font-size:11px;line-height:1.3;padding:6px 8px;background:#1a1a1a;color:#0f0;word-break:break-all;');
    debugBar.textContent = 'v' + MINIAPP_DEBUG.version + ' | appId: - | WindVaneReady: - | getAuthCode: - | superapp-login: -';
    document.body.appendChild(debugBar);
    alert('Mini app build v1.0.3');
  }

  // Bảng xin quyền: hiện khi mở app. Từ chối/× chỉ đóng bảng; Cho phép → gọi getAuthCode (get permission) rồi đóng.
  (function setupAuthPermissionModal() {
    var overlay = document.getElementById('auth-permission-overlay');
    if (!overlay) return;
    function closeModal() {
      overlay.setAttribute('aria-hidden', 'true');
    }
    var denyBtn = document.getElementById('auth-permission-deny');
    var closeBtn = document.getElementById('auth-permission-close');
    if (denyBtn) denyBtn.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    // Nút "Cho phép" gắn ở dưới sau khi loginMiniApp đã định nghĩa
  })();

  // API backend: ưu tiên Super App inject; nếu mở từ domain khác (gateway, iframe) thì gọi thẳng Vercel
  var VERCEL_API_BASE = 'https://smartapp-ten.vercel.app/api';
  var isSameOrigin = typeof location !== 'undefined' && location.hostname === 'smartapp-ten.vercel.app';
  var API_BASE = (window.APP_API_BASE_URL !== undefined && window.APP_API_BASE_URL !== '')
    ? window.APP_API_BASE_URL
    : (isSameOrigin ? '/api' : VERCEL_API_BASE);
  var USER_PHONE = window.MINIAPP_USER_PHONE || '';
  var main = document.getElementById('main-content');
  var navItems = document.querySelectorAll('.nav-item');

  // appId: bắt buộc cho getAuthCode. Ưu tiên: inject → localStorage (nhập trên Profile) → URL ?appId= → hằng số.
  var DEFAULT_MINIAPP_APP_ID = '1512032299590111735808'; // App ID fix cứng cho API auth
  var appIdFromUrl = typeof location !== 'undefined' && location.search && (function () { var m = location.search.match(/[?&]appId=([^&]+)/); return m ? decodeURIComponent(m[1]) : ''; })();
  var STORAGE_KEY_APP_ID = 'miniapp_app_id';
  function getMiniAppAppId() {
    return (window.MINIAPP_APP_ID || window.APP_ID || (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_APP_ID)) || appIdFromUrl || DEFAULT_MINIAPP_APP_ID || '').toString().trim();
  }

  // get-auth-code payload: { appId, scopes }. Scopes đúng theo API: USER_NAME, USER_PHONE_NUMBER.
  var SCOPE_USER_NAME = 'USER_NAME';
  var SCOPE_PHONE = 'USER_PHONE_NUMBER';
  var DEFAULT_SCOPES = [SCOPE_USER_NAME, SCOPE_PHONE];

  // Đợi WindVane sẵn sàng (event WindVaneReady hoặc fallback 2.5s) — native có thể inject chậm
  function onWindVaneReady() {
    return new Promise(function (resolve) {
      if (window.WindVane && typeof window.WindVane.call === 'function') return resolve();
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      document.addEventListener('WindVaneReady', finish, { once: true });
      setTimeout(finish, 2500);
    });
  }

  function getAuthCodeWV(scopes, retryCount) {
    retryCount = retryCount || 0;
    var s = Array.isArray(scopes) && scopes.length ? scopes : DEFAULT_SCOPES;
    return onWindVaneReady().then(function () {
      return new Promise(function (resolve) { resolve(); });
    }).then(function () {
      // Thêm delay ngắn sau WindVaneReady để native kịp xử lý
      return new Promise(function (r) { setTimeout(r, 400); });
    }).then(function () {
      updateMiniAppDebug('windVaneReady', window.WindVane && typeof window.WindVane.call === 'function' ? 'đã chạy' : 'xong, không WV');
      return new Promise(function (resolve, reject) {
        if (!window.WindVane || typeof window.WindVane.call !== 'function') {
          updateMiniAppDebug('getAuthCode', 'lỗi (không WV)');
          return reject(new Error('WindVane chưa sẵn sàng / không có trong môi trường hiện tại'));
        }
        var appId = getMiniAppAppId();
        if (!appId) {
          updateMiniAppDebug('getAuthCode', 'lỗi (thiếu appId)');
          return reject(new Error('appId đang rỗng. Vào Hồ sơ → nhập App ID (lấy từ Tammi) → Lưu, rồi thử lại.'));
        }
        updateMiniAppDebug('getAuthCode', retryCount > 0 ? 'đang gọi (retry)' : 'đang gọi');
        var params = { appId: appId, scopes: s };
        window.WindVane.call(
          'wv',
          'getAuthCode',
          params,
          function (res) {
            if (!res || !res.authCode) {
              updateMiniAppDebug('getAuthCode', 'lỗi (no authCode)');
              return reject(new Error('Không nhận được authCode'));
            }
            updateMiniAppDebug('getAuthCode', 'đã gọi');
            resolve(res);
          },
          function (err) {
            var raw = err && typeof err === 'object' ? err : {};
            var code = raw.code !== undefined ? raw.code : raw.error;
            var msg = (raw.message || raw.errorMessage || raw.msg || '');
            var msgLower = (msg + '').toLowerCase();
            if (code === 11 || code === '11') updateMiniAppDebug('getAuthCode', 'lỗi 11: user hủy');
            else if (code === 12 || code === '12') updateMiniAppDebug('getAuthCode', 'lỗi 12: network');
            else if (code === 13 || code === '13') updateMiniAppDebug('getAuthCode', 'lỗi 13: scope/capability');
            else updateMiniAppDebug('getAuthCode', 'lỗi ' + (code != null ? code : (msgLower || 'WV')));
            var normalized = typeof err === 'object' && err !== null ? { error: code, code: code, message: msg || ('getAuthCode fail ' + (code != null ? 'code=' + code : '')) } : { error: code, code: code, message: String(err) };
            try { for (var k in raw) if (normalized[k] === undefined) normalized[k] = raw[k]; } catch (e) {}
            reject(normalized);
          }
        );
      });
    }).catch(function (err) {
      // Retry 1 lần sau 1.5s nếu lỗi (trừ thiếu appId / không có WV)
      if (retryCount < 1 && window.WindVane && getMiniAppAppId()) {
        var code = err && (err.code !== undefined ? err.code : err.error);
        if (code !== 11) {
          updateMiniAppDebug('getAuthCode', 'sẽ retry...');
          return new Promise(function (r) { setTimeout(r, 1500); }).then(function () {
            return getAuthCodeWV(scopes, 1);
          });
        }
      }
      throw err;
    });
  }

  // Quyền thiết bị: dùng API đã import từ MiniAppPermissions (getSetting, authorize, hasPermission, setPermissionStatus, getPermissionStatus).
  var P = MiniAppPermissions;
  var DEVICE_PERMISSION_SCOPES = (P && P.PERMISSION_SCOPES) ? P.PERMISSION_SCOPES : ['location', 'camera', 'microphone', 'bluetooth', 'album', 'contacts', 'file', 'call', 'vibrate', 'screen'];
  function setPermissionStatus(authSetting) {
    if (P && P.setPermissionStatus) P.setPermissionStatus(authSetting);
  }
  function getPermissionStatus() {
    return (P && P.getPermissionStatus) ? P.getPermissionStatus() : {};
  }
  function getSettingWV() {
    return getSetting();
  }
  function authorizeWV(scope) {
    return authorize(scope).then(function (r) {
      return { success: !!(r && r.successScope && r.successScope[scope]), successScope: (r && r.successScope) ? r.successScope : {} };
    });
  }
  function ensureAuthorizeWV(scope) {
    return authorizeWV(scope);
  }

  // Gửi authCode về backend (get-access-token → user-info-by-scope); không đổi token ở frontend
  function loginMiniApp(scopes) {
    var s = scopes && scopes.length ? scopes : DEFAULT_SCOPES;
    return getAuthCodeWV(s).then(function (auth) {
      updateMiniAppDebug('superappLogin', 'đang gọi');
      return fetch(API_BASE + '/auth/superapp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authCode: auth.authCode, scopes: s, appId: getMiniAppAppId() })
      }).then(function (r) { return r.json(); }).then(function (data) {
        updateMiniAppDebug('superappLogin', data && data.success ? 'OK' : 'lỗi');
        return data;
      }).catch(function (e) {
        updateMiniAppDebug('superappLogin', 'lỗi');
        throw e;
      });
    });
  }

  function initMiniAppUserPhone() {
    if (window.__miniappUserPhoneLoaded) return;
    window.__miniappUserPhoneLoaded = true;

    loginMiniApp(DEFAULT_SCOPES)
      .then(function (data) {
        if (!data || data.success === false) return;
        var phone = data.data && (data.data.phoneNumber || (data.data.user && (data.data.user.phoneNumber || data.data.user.msisdn)));
        if (!phone) return;
        USER_PHONE = phone;
        window.MINIAPP_USER_PHONE = phone;
        var el = document.querySelector('.account-phone-number');
        if (el) el.textContent = phone;
      })
      .catch(function () { /* user deny / WindVane → bỏ qua */ });
  }

  // Nút "Cho phép" trên bảng xin quyền: gọi getAuthCode (get permission) → cập nhật số ĐT → đóng bảng
  (function bindAuthPermissionAllow() {
    var overlay = document.getElementById('auth-permission-overlay');
    var allowBtn = document.getElementById('auth-permission-allow');
    if (!overlay || !allowBtn) return;
    allowBtn.addEventListener('click', function () {
      loginMiniApp(DEFAULT_SCOPES)
        .then(function (data) {
          if (data && data.success && data.data) {
            var phone = data.data.phoneNumber || (data.data.user && (data.data.user.phoneNumber || data.data.user.msisdn));
            if (phone) {
              USER_PHONE = phone;
              window.MINIAPP_USER_PHONE = phone;
              var el = document.querySelector('.account-phone-number');
              if (el) el.textContent = phone;
            }
          }
          overlay.setAttribute('aria-hidden', 'true');
        })
        .catch(function () {
          overlay.setAttribute('aria-hidden', 'true');
        });
    });
  })();

  /* In-memory + localStorage lưu danh sách hẹn giờ theo từng thiết bị */
  var TIMER_STORE_KEY_PREFIX = 'deviceTimers:';
  function loadDeviceTimers(deviceId) {
    var raw = Store.get(TIMER_STORE_KEY_PREFIX + deviceId, '');
    if (!raw) {
      return [
        { time: '23:30', desc: 'Chuyển cấp độ gió 2 | Mỗi ngày', enabled: true },
        { time: '05:00', desc: 'Tắt | Mỗi ngày', enabled: false }
      ];
    }
    try {
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }
  function saveDeviceTimers(deviceId, timers) {
    try {
      Store.set(TIMER_STORE_KEY_PREFIX + deviceId, JSON.stringify(timers || []));
    } catch (e) {
      // ignore
    }
  }

  /** Gửi trạng thái power lên ThingsBoard. URL: https://things.iot-platform.io.vn/api/plugins/telemetry/DEVICE/5dda6760-1c28-11f1-ae4a-7d6b236a15c2/SHARED_SCOPE */
  var THINGSBOARD_HOST = ('https://things.iot-platform.io.vn').replace(/\/$/, '');
  var THINGSBOARD_API_KEY = window.THINGSBOARD_TOKEN || '';
  var THINGSBOARD_DEVICE_ID = window.THINGSBOARD_DEVICE_ID || '5dda6760-1c28-11f1-ae4a-7d6b236a15c2';
  function sendPowerTelemetry(isOn, deviceId) {
    if (deviceId !== '2') return;
    if (!THINGSBOARD_API_KEY) return;
    var url = THINGSBOARD_HOST + '/api/plugins/telemetry/DEVICE/' + encodeURIComponent(THINGSBOARD_DEVICE_ID) + '/SHARED_SCOPE';
    var payload = { power: isOn ? 'on' : 'off' };
    var headers = { 'Content-Type': 'application/json' };
    headers['X-Authorization'] = 'ApiKey ' + THINGSBOARD_API_KEY;
    fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) console.warn('[telemetry] HTTP ' + res.status + ' ' + res.statusText + ' → ' + url);
      })
      .catch(function (err) { console.warn('[telemetry]', err); });
  }

  /** Chỉ gọi JSBridge khi chạy trong app native (WebView). Ở browser chỉ dùng ThingsBoard API. */
  function isNativeWebView() {
    return !!(window.NativeBridge && typeof window.NativeBridge.call === 'function') ||
           !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.JSBridge);
  }

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function setNav(page) {
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-page') === page);
    });
  }

  /* FIX: dùng Store.get() thay vì localStorage.getItem() trực tiếp */
  function getDeviceId() {
    return Store.get('currentDeviceId', '1');
  }

  function renderHome() {
    setNav('home');
    var html =
      '<div class="page-home">' +
      '  <div class="user-id" id="user-id">6838309456-</div>' +
      '  <div class="tabs">' +
      '    <a href="#/" class="active">Smart Home</a>' +
      '    <a href="#/shared">Đã chia sẻ</a>' +
      '    <span class="icon-menu" id="btn-menu"><iconify-icon icon="ant-design:menu-outlined"></iconify-icon></span>' +
      '  </div>' +
      '  <div class="menu-dropdown" id="home-menu" aria-hidden="true">' +
      '    <a href="#/" class="menu-item">Smart Home</a>' +
      '    <a href="#/shared" class="menu-item">Đã chia sẻ</a>' +
      '    <a href="#/nav-settings" class="menu-item"><span>Cài đặt điều hướng</span><span class="menu-icon"><iconify-icon icon="ant-design:setting-outlined"></iconify-icon></span></a>' +
      '    <a href="#/my-devices" class="menu-item"><span>Thiết bị của tôi</span><span class="menu-icon"><iconify-icon icon="ant-design:search-outlined"></iconify-icon></span></a>' +
      '  </div>' +
      '  <div class="menu-overlay" id="menu-overlay" aria-hidden="true"></div>' +
      '  <div class="home-device-cards">' +
      '    <div class="device-card" data-device-id="1">' +
      '      <div class="card-header">' +
      '        <div class="device-icon-wrap"><iconify-icon icon="ant-design:cloud-outlined"></iconify-icon></div>' +
      '        <button class="power-btn on" type="button" aria-label="Tắt"><span class="power-symbol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12L12 4A8 8 0 1 1 11.98 4"/></svg></span></button>' +
      '      </div>' +
      '      <div class="device-name">Máy lọc không khí thông minh</div>' +
      '      <div class="device-meta"><span>Thiết bị</span><span>Trung bình</span></div>' +
      '    </div>' +
      '    <div class="device-card" data-device-id="2">' +
      '      <div class="card-header">' +
      '        <div class="device-icon-wrap"><iconify-icon icon="ant-design:bulb-outlined"></iconify-icon></div>' +
      '        <button class="power-btn" type="button" aria-label="Bật"><span class="power-symbol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12L12 4A8 8 0 1 1 11.98 4"/></svg></span></button>' +
      '      </div>' +
      '      <div class="device-name">Đèn thông minh</div>' +
      '      <div class="device-meta"><span>Thiết bị</span><span>Tắt</span></div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="edit-wrap"><a href="#/edit-room" class="btn-edit">Chỉnh sửa</a></div>' +
      '</div>';
    main.innerHTML = html;

    main.querySelectorAll('.device-card').forEach(function (card) {
      var deviceId = card.getAttribute('data-device-id');
      var powerBtn = card.querySelector('.power-btn');
      var statusEl = card.querySelector('.device-meta span:last-child');
      if (card) {
        card.addEventListener('click', function (e) {
          if (!e.target.closest('.power-btn')) {
            location.hash = '#/device/' + deviceId;
          }
        });
      }
      if (powerBtn) {
        powerBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var on = powerBtn.classList.toggle('on');
          if (statusEl) statusEl.textContent = on ? 'Bật' : 'Tắt';
          if (deviceId === '1') {
            window.JSBridge.send('device/setPower', { deviceId: deviceId, on: on }, function (res) {
              if (res && res.success === false) {
                powerBtn.classList.toggle('on');
                if (statusEl) statusEl.textContent = powerBtn.classList.contains('on') ? 'Bật' : 'Tắt';
              }
            });
          } else {
            sendPowerTelemetry(on, deviceId);
            if (isNativeWebView()) {
              window.JSBridge.send('device/setPower', { deviceId: deviceId, on: on }, function (res) {
                if (res && res.success === false) {
                  powerBtn.classList.toggle('on');
                  if (statusEl) statusEl.textContent = powerBtn.classList.contains('on') ? 'Bật' : 'Tắt';
                }
              });
            }
          }
        });
      }
    });
    var btnMenu = document.getElementById('btn-menu');
    var homeMenu = document.getElementById('home-menu');
    var overlay = document.getElementById('menu-overlay');
    function openMenu() { homeMenu && (homeMenu.setAttribute('aria-hidden', 'false'), homeMenu.classList.add('open')); overlay && (overlay.setAttribute('aria-hidden', 'false'), overlay.classList.add('open')); }
    function closeMenu() { homeMenu && (homeMenu.setAttribute('aria-hidden', 'true'), homeMenu.classList.remove('open')); overlay && (overlay.setAttribute('aria-hidden', 'true'), overlay.classList.remove('open')); }
    if (btnMenu) btnMenu.addEventListener('click', function (e) { e.stopPropagation(); openMenu(); });
    if (overlay) overlay.addEventListener('click', closeMenu);
    main.querySelectorAll('.menu-dropdown .menu-item').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  function renderDevice(id) {
    setNav('home');
    var deviceId = id || getDeviceId();
    var isLight = deviceId === '2';
    var deviceTitle = isLight ? 'Đèn thông minh' : 'Máy lọc không khí thông minh';
    var html;
    if (isLight) {
      html =
        '<div class="page-device page-device--light">' +
        '  <div class="nav-bar">' +
        '    <a class="back btn-back" href="#/"><span class="btn-back-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span></a>' +
        '    <span class="title">Đèn thông minh</span>' +
        '    <span class="menu-dots"><iconify-icon icon="ant-design:ellipsis-outlined"></iconify-icon></span>' +
        '  </div>' +
        '  <div class="device-light-body">' +
        '    <div class="device-icon-wrap device-light-icon"><iconify-icon icon="ant-design:bulb-outlined"></iconify-icon></div>' +
        '    <div class="power-control" id="device-power">' +
        '      <div class="power-icon"><span class="power-symbol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12L12 4A8 8 0 1 1 11.98 4"/></svg></span></div>' +
        '      <span class="power-label">Bật</span>' +
        '    </div>' +
        '  </div>' +
        '  <div class="device-actions-section">' +
        '    <a href="#/device/' + deviceId + '/timer" class="feature-card">' +
        '      <div class="feature-icon"><iconify-icon icon="ant-design:clock-circle-outlined"></iconify-icon></div>' +
        '      <div class="feature-content"><div class="feature-title">Hẹn giờ</div><div class="feature-desc">Bật/tắt thiết bị theo lịch</div></div>' +
        '      <span class="feature-arrow">›</span>' +
        '    </a>' +
        '    <a href="#/device/' + deviceId + '/automation" class="feature-card">' +
        '      <div class="feature-icon"><iconify-icon icon="ant-design:thunderbolt-outlined"></iconify-icon></div>' +
        '      <div class="feature-content"><div class="feature-title">Tự động hóa</div><div class="feature-desc">Thiết lập kịch bản tự động</div></div>' +
        '      <span class="feature-arrow">›</span>' +
        '    </a>' +
        '  </div>' +
        '</div>';
    } else {
      html =
      '<div class="page-device">' +
      '  <div class="nav-bar">' +
      '    <a class="back btn-back" href="#/"><span class="btn-back-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span></a>' +
      '    <span class="title">' + deviceTitle + '</span>' +
      '    <span class="menu-dots"><iconify-icon icon="ant-design:ellipsis-outlined"></iconify-icon></span>' +
      '  </div>' +
      '  <div class="air-quality-section">' +
      '    <div class="air-quality-glow-wrap">' +
      '      <div class="air-quality-glow"></div>' +
      '      <div class="air-quality-particles">' +
      '        <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>' +
      '        <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>' +
      '        <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>' +
      '        <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>' +
      '        <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>' +
      '        <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>' +
      '        <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>' +
      '        <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>' +
      '      </div>' +
      '      <div class="air-quality-text">' +
      '        <div class="air-quality-label">Chất lượng không khí trong nhà kết hợp</div>' +
      '        <div class="air-quality-value" id="aq-value">Trung bình</div>' +
      '        <div class="air-quality-env">Nhiệt độ: 23°C | Độ ẩm: 62%</div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="pm-section">' +
      '    <div class="pm-item"><div class="value">053</div><div class="unit">PM2.5(µg/m³)</div></div>' +
      '    <div class="pm-item"><div class="label">Tốt</div><div class="label">Hạt thô</div></div>' +
      '  </div>' +
      '  <div class="power-control" id="device-power">' +
      '    <div class="power-icon on"><span class="power-symbol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12L12 4A8 8 0 1 1 11.98 4"/></svg></span></div>' +
      '    <span class="power-label">Tắt</span>' +
      '  </div>' +
      '  <div class="mode-section">' +
      '    <div class="mode-buttons">' +
      '      <button type="button" class="mode-btn" data-mode="auto"><span class="mode-icon">A</span><span class="mode-label">Tự động</span></button>' +
      '      <button type="button" class="mode-btn" data-mode="sleep"><span class="mode-icon"><iconify-icon icon="ant-design:moon-outlined"></iconify-icon></span><span class="mode-label">Ngủ</span></button>' +
      '      <button type="button" class="mode-btn" data-mode="manual"><span class="mode-icon"><iconify-icon icon="ant-design:form-outlined"></iconify-icon></span><span class="mode-label">Thủ công</span></button>' +
      '      <button type="button" class="mode-btn active" data-mode="wind"><span class="mode-icon mode-icon-wind"><svg viewBox="0 0 24 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M1 4 Q6 1 12 4 T23 4"/></svg></span><span class="mode-label">Cấp độ gió</span></button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="mode-section">' +
      '    <div class="section-title">Cài đặt cấp bậc</div>' +
      '    <div class="level-buttons">' +
      '      <button type="button" class="level-btn active" data-level="1"><span class="level-icon"><span class="level-waves"><svg viewBox="0 0 24 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 4 Q6 1 12 4 T23 4"/></svg></span></span></button>' +
      '      <button type="button" class="level-btn" data-level="2"><span class="level-icon"><span class="level-waves"><svg viewBox="0 0 24 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M1 3 Q6 5.5 12 3 T23 3"/><path d="M1 5 Q6 2.5 12 5 T23 5"/></svg></span></span></button>' +
      '      <button type="button" class="level-btn" data-level="3"><span class="level-icon"><span class="level-waves"><svg viewBox="0 0 24 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M1 2.2 Q6 4 12 2.2 T23 2.2"/><path d="M1 4 Q6 2 12 4 T23 4"/><path d="M1 5.8 Q6 4 12 5.8 T23 5.8"/></svg></span></span></button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="feature-card" data-feature="ion">' +
      '    <div class="feature-icon"><iconify-icon icon="ant-design:thunderbolt-outlined"></iconify-icon></div>' +
      '    <div class="feature-content"><div class="feature-title">Ion âm</div><div class="feature-desc">Bật</div></div>' +
      '    <span class="feature-arrow">›</span>' +
      '  </div>' +
      '  <div class="feature-card">' +
      '    <div class="feature-icon"><iconify-icon icon="ant-design:filter-outlined"></iconify-icon></div>' +
      '    <div class="feature-content"><div class="feature-title">Lọc</div><div class="feature-desc">Còn lại 66%, Còn lại 193 ngày</div></div>' +
      '    <span class="feature-arrow">›</span>' +
      '  </div>' +
      '  <div class="feature-card">' +
      '    <div class="feature-icon"><iconify-icon icon="ant-design:menu-outlined"></iconify-icon></div>' +
      '    <div class="feature-content"><div class="feature-title">Kiểu truyền thống</div></div>' +
      '    <span class="feature-arrow">›</span>' +
      '  </div>' +
      '  <div class="device-actions-section">' +
      '    <a href="#/device/' + deviceId + '/timer" class="feature-card">' +
      '      <div class="feature-icon"><iconify-icon icon="ant-design:clock-circle-outlined"></iconify-icon></div>' +
      '      <div class="feature-content"><div class="feature-title">Hẹn giờ</div><div class="feature-desc">Bật/tắt thiết bị theo lịch</div></div>' +
      '      <span class="feature-arrow">›</span>' +
      '    </a>' +
      '    <a href="#/device/' + deviceId + '/automation" class="feature-card">' +
      '      <div class="feature-icon"><iconify-icon icon="ant-design:thunderbolt-outlined"></iconify-icon></div>' +
      '      <div class="feature-content"><div class="feature-title">Tự động hóa</div><div class="feature-desc">Thiết lập kịch bản tự động</div></div>' +
      '      <span class="feature-arrow">›</span>' +
      '    </a>' +
      '  </div>' +
      '  <div style="text-align:center;padding:24px 0;color:#999;font-size:12px;">SH</div>' +
      '</div>';
    }
    main.innerHTML = html;

    var powerEl = document.getElementById('device-power');
    var powerIcon = powerEl && powerEl.querySelector('.power-icon');
    var powerLabel = powerEl && powerEl.querySelector('.power-label');
    var isOn = false;
    if (powerEl) {
      powerEl.addEventListener('click', function () {
        isOn = !isOn;
        if (powerIcon) powerIcon.classList.toggle('on', isOn);
        if (powerLabel) powerLabel.textContent = isOn ? 'Tắt' : 'Bật';
        if (deviceId === '1') {
          window.JSBridge.send('device/setPower', { deviceId: deviceId, on: isOn }, noop);
        } else {
          sendPowerTelemetry(isOn, deviceId);
          if (isNativeWebView()) window.JSBridge.send('device/setPower', { deviceId: deviceId, on: isOn }, noop);
        }
      });
    }

    if (powerIcon && powerLabel && isNativeWebView()) {
      window.JSBridge.send('device/getState', { deviceId: deviceId }, function (res) {
        if (res && res.success && res.data) {
          isOn = !!res.data.on;
          powerIcon.classList.toggle('on', isOn);
          powerLabel.textContent = isOn ? 'Tắt' : 'Bật';
        }
      });
    }

    if (!isLight) {
      main.querySelectorAll('.mode-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          main.querySelectorAll('.mode-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          window.JSBridge.send('device/setMode', { deviceId: deviceId, mode: btn.getAttribute('data-mode') }, noop);
        });
      });
      main.querySelectorAll('.level-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          main.querySelectorAll('.level-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          window.JSBridge.send('device/setLevel', { deviceId: deviceId, level: btn.getAttribute('data-level') }, noop);
        });
      });
    }
  }

  function renderDeviceTimer(deviceId) {
    setNav('home');
    var timers = loadDeviceTimers(deviceId);
    var listHtml = '';
    timers.forEach(function (t, idx) {
      listHtml +=
        '    <div class="timer-item" data-index="' + idx + '">' +
        '      <div class="timer-item-main">' +
        '        <span class="timer-item-time">' + (t.time || '') + '</span>' +
        '        <span class="timer-item-desc">' + (t.desc || '') + '</span>' +
        '      </div>' +
        '      <div class="timer-item-actions">' +
        '        <label class="timer-toggle"><input type="checkbox" class="timer-toggle-input"' + (t.enabled ? ' checked' : '') + '><span class="timer-toggle-slider"></span></label>' +
        '        <button type="button" class="timer-delete-btn" data-index="' + idx + '" aria-label="Xóa hẹn giờ"><iconify-icon icon="ant-design:delete-outlined"></iconify-icon></button>' +
        '      </div>' +
        '    </div>';
    });
    var html =
      '<div class="page-timer-list" data-device-id="' + deviceId + '">' +
      '  <div class="timer-list-header">' +
      '    <a class="timer-close" href="#/device/' + deviceId + '" aria-label="Đóng"><iconify-icon icon="ant-design:close-outlined"></iconify-icon></a>' +
      '    <h1 class="timer-list-title">Hẹn giờ</h1>' +
      '    <button type="button" class="timer-header-action" aria-label="Tùy chọn"><iconify-icon icon="ant-design:export-outlined"></iconify-icon></button>' +
      '  </div>' +
      '  <div class="timer-list-body">' +
           listHtml +
      '  </div>' +
      '  <button type="button" class="timer-fab" id="btn-add-timer" aria-label="Thêm hẹn giờ"><iconify-icon icon="ant-design:plus-outlined" class="timer-fab-icon"></iconify-icon></button>' +
      '  <div class="timer-add-sheet" id="timer-add-sheet" aria-hidden="true">' +
      '    <div class="timer-sheet-overlay" id="timer-sheet-overlay"></div>' +
      '    <div class="timer-sheet-content">' +
      '      <h2 class="timer-sheet-title">Thêm hẹn giờ</h2>' +
      '      <a href="#/device/' + deviceId + '/timer/add" class="timer-sheet-option" id="timer-sheet-option-time">Bật/tắt điểm thời gian</a>' +
      '      <a href="#/device/' + deviceId + '/timer/add?duration=1" class="timer-sheet-option">Bật/tắt khoảng thời gian</a>' +
      '      <button type="button" class="timer-sheet-cancel" id="timer-sheet-cancel">Hủy</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var sheet = document.getElementById('timer-add-sheet');
    var overlay = document.getElementById('timer-sheet-overlay');
    var btnAdd = document.getElementById('btn-add-timer');
    var btnCancel = document.getElementById('timer-sheet-cancel');
    function openSheet() { if (sheet) { sheet.setAttribute('aria-hidden', 'false'); sheet.classList.add('open'); } }
    function closeSheet() { if (sheet) { sheet.setAttribute('aria-hidden', 'true'); sheet.classList.remove('open'); } }
    if (btnAdd) btnAdd.addEventListener('click', openSheet);
    if (overlay) overlay.addEventListener('click', closeSheet);
    if (btnCancel) btnCancel.addEventListener('click', closeSheet);
    main.querySelectorAll('.timer-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-index') || '-1', 10);
        if (idx < 0) return;
        var list = loadDeviceTimers(deviceId);
        if (!Array.isArray(list) || idx >= list.length) return;
        list.splice(idx, 1);
        saveDeviceTimers(deviceId, list);
        renderDeviceTimer(deviceId);
      });
    });
  }

  function renderDeviceTimerAdd(deviceId) {
    setNav('home');
    var timerState = { hour: 11, minute: 26, action: null, repeat: 'once' };
    var repeatLabels = { once: 'Một lần', daily: 'Mỗi ngày', workdays: 'Ngày làm việc', holidays: 'Ngày nghỉ lễ', custom: 'Tùy chỉnh' };
    var actionLabel = timerState.action ? timerState.action.label : null;
    var html =
      '<div class="page-timer-add" data-device-id="' + deviceId + '">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/device/' + deviceId + '/timer"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="title">Hẹn giờ</h1>' +
      '  </div>' +
      '  <div class="timer-add-body">' +
      '    <div class="timer-form-card">' +
      '      <div class="timer-form-row timer-form-row-toggle">' +
      '        <span class="timer-form-label timer-form-label--customize" id="timer-row-customize">Tùy chỉnh</span>' +
      '        <label class="timer-toggle"><input type="checkbox" class="timer-toggle-input" id="timer-customize" checked><span class="timer-toggle-slider"></span></label>' +
      '      </div>' +
      '      <div class="timer-form-row timer-form-row-click" id="timer-row-time">' +
      '        <span class="timer-form-label">Thời gian</span>' +
      '        <span class="timer-form-value" id="timer-display-time">11:26</span>' +
      '        <iconify-icon icon="ant-design:right-outlined" class="timer-form-arrow"></iconify-icon>' +
      '      </div>' +
      '    </div>' +
      '    <div class="timer-form-card">' +
      '      <div class="timer-form-row timer-form-row-click" id="timer-row-action">' +
      '        <span class="timer-form-label">Bắt đầu</span>' +
      '        <span class="timer-form-value timer-form-value--unset" id="timer-display-action"><span class="timer-action-dot"></span>Chưa đặt</span>' +
      '        <iconify-icon icon="ant-design:right-outlined" class="timer-form-arrow"></iconify-icon>' +
      '      </div>' +
      '      <p class="timer-form-hint">Để thực hiện thao tác được chỉ định, thiết bị phải được bật nguồn và đã kết nối mạng.</p>' +
      '    </div>' +
      '    <div class="timer-form-card">' +
      '      <div class="timer-form-row timer-form-row-click" id="timer-row-repeat">' +
      '        <span class="timer-form-label">Lặp lại</span>' +
      '        <span class="timer-form-value" id="timer-display-repeat">Một lần</span>' +
      '        <iconify-icon icon="ant-design:right-outlined" class="timer-form-arrow"></iconify-icon>' +
      '      </div>' +
      '    </div>' +
      '    <div class="timer-save-wrap">' +
      '      <button type="button" class="timer-save-btn" id="timer-save-btn">OK</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="timer-time-picker-overlay" id="timer-time-picker-overlay" aria-hidden="true">' +
      '    <div class="timer-time-picker" id="timer-time-picker">' +
      '      <h3 class="timer-time-picker-title">Chọn thời gian</h3>' +
      '      <p class="timer-time-picker-preview" id="timer-time-picker-preview">11:26</p>' +
      '      <div class="timer-time-picker-wheels">' +
      '        <div class="timer-wheel-wrap"><select id="timer-hour" class="timer-wheel">' + Array.from({ length: 24 }, function (_, i) { return '<option value="' + i + '">' + (i < 10 ? '0' : '') + i + ' giờ</option>'; }).join('') + '</select></div>' +
      '        <div class="timer-wheel-wrap"><select id="timer-minute" class="timer-wheel">' + Array.from({ length: 60 }, function (_, i) { return '<option value="' + i + '">' + (i < 10 ? '0' : '') + i + ' phút</option>'; }).join('') + '</select></div>' +
      '      </div>' +
      '      <div class="timer-time-picker-actions">' +
      '        <button type="button" class="timer-picker-btn timer-picker-cancel" id="timer-time-cancel">Hủy</button>' +
      '        <button type="button" class="timer-picker-btn timer-picker-ok" id="timer-time-ok">OK</button>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="timer-repeat-sheet" id="timer-repeat-sheet" aria-hidden="true">' +
      '    <div class="timer-sheet-overlay" id="timer-repeat-overlay"></div>' +
      '    <div class="timer-sheet-content">' +
      '      <h2 class="timer-sheet-title">Lặp lại</h2>' +
      '      <button type="button" class="timer-repeat-option" data-repeat="once"><span class="timer-repeat-option-text">Một lần</span><span class="timer-repeat-check"><iconify-icon icon="ant-design:check-outlined"></iconify-icon></span></button>' +
      '      <button type="button" class="timer-repeat-option" data-repeat="daily"><span class="timer-repeat-option-text">Mỗi ngày</span><span class="timer-repeat-check"><iconify-icon icon="ant-design:check-outlined"></iconify-icon></span></button>' +
      '      <button type="button" class="timer-repeat-option" data-repeat="workdays"><span class="timer-repeat-option-text">Ngày làm việc</span><span class="timer-repeat-check"><iconify-icon icon="ant-design:check-outlined"></iconify-icon></span></button>' +
      '      <button type="button" class="timer-repeat-option" data-repeat="holidays"><span class="timer-repeat-option-text">Ngày nghỉ lễ</span><span class="timer-repeat-check"><iconify-icon icon="ant-design:check-outlined"></iconify-icon></span></button>' +
      '      <button type="button" class="timer-repeat-option" data-repeat="custom"><span class="timer-repeat-option-text">Tùy chỉnh</span><span class="timer-repeat-check"><iconify-icon icon="ant-design:check-outlined"></iconify-icon></span></button>' +
      '      <div class="timer-repeat-actions">' +
      '        <button type="button" class="timer-repeat-btn timer-repeat-cancel" id="timer-repeat-cancel">Hủy</button>' +
      '        <button type="button" class="timer-repeat-btn timer-repeat-ok" id="timer-repeat-ok">OK</button>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var page = main.querySelector('.page-timer-add');
    var displayTime = document.getElementById('timer-display-time');
    var displayAction = document.getElementById('timer-display-action');
    var displayRepeat = document.getElementById('timer-display-repeat');
    var timeOverlay = document.getElementById('timer-time-picker-overlay');
    var hourSelect = document.getElementById('timer-hour');
    var minuteSelect = document.getElementById('timer-minute');
    if (hourSelect) hourSelect.value = String(timerState.hour);
    if (minuteSelect) minuteSelect.value = String(timerState.minute);
    var timePreview = document.getElementById('timer-time-picker-preview');
    function applyTime() {
      var h = parseInt(hourSelect.value, 10);
      var m = parseInt(minuteSelect.value, 10);
      timerState.hour = h;
      timerState.minute = m;
      var s = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
      if (displayTime) { displayTime.textContent = s; displayTime.classList.remove('timer-form-value--unset'); }
      if (timePreview) timePreview.textContent = s;
    }
    function openTimePicker() {
      if (hourSelect) hourSelect.value = timerState.hour;
      if (minuteSelect) minuteSelect.value = timerState.minute;
      applyTime();
      if (timeOverlay) { timeOverlay.setAttribute('aria-hidden', 'false'); timeOverlay.classList.add('open'); }
    }
    function closeTimePicker() {
      if (timeOverlay) { timeOverlay.setAttribute('aria-hidden', 'true'); timeOverlay.classList.remove('open'); }
    }
    main.querySelector('#timer-row-time').addEventListener('click', openTimePicker);
    if (hourSelect) hourSelect.addEventListener('change', applyTime);
    if (minuteSelect) minuteSelect.addEventListener('change', applyTime);
    document.getElementById('timer-time-cancel').addEventListener('click', closeTimePicker);
    document.getElementById('timer-time-ok').addEventListener('click', function () { applyTime(); closeTimePicker(); });
    if (timeOverlay) timeOverlay.addEventListener('click', function (e) { if (e.target === timeOverlay) closeTimePicker(); });
    main.querySelector('#timer-row-action').addEventListener('click', function () { location.hash = '#/device/' + deviceId + '/timer/add/action'; });
    var customizeLabel = document.getElementById('timer-row-customize');
    if (customizeLabel) customizeLabel.addEventListener('click', function (e) { e.preventDefault(); location.hash = '#/device/' + deviceId + '/timer/add/action'; });
    var repeatSheet = document.getElementById('timer-repeat-sheet');
    function openRepeatSheet() {
      if (repeatSheet) { repeatSheet.setAttribute('aria-hidden', 'false'); repeatSheet.classList.add('open'); }
    }
    function closeRepeatSheet() {
      if (repeatSheet) { repeatSheet.setAttribute('aria-hidden', 'true'); repeatSheet.classList.remove('open'); }
    }
    var repeatOverlay = document.getElementById('timer-repeat-overlay');
    if (repeatOverlay) repeatOverlay.addEventListener('click', closeRepeatSheet);
    function updateRepeatSelection(selectedKey) {
      if (!repeatSheet) return;
      timerState.repeat = selectedKey;
      repeatSheet.querySelectorAll('.timer-repeat-option').forEach(function (btn) {
        var key = btn.getAttribute('data-repeat');
        btn.classList.toggle('selected', key === selectedKey);
      });
    }
    if (repeatSheet) {
      document.getElementById('timer-repeat-cancel').addEventListener('click', closeRepeatSheet);
      document.getElementById('timer-repeat-ok').addEventListener('click', function () {
        if (displayRepeat) displayRepeat.textContent = repeatLabels[timerState.repeat] || 'Một lần';
        closeRepeatSheet();
      });
      repeatSheet.querySelectorAll('.timer-repeat-option').forEach(function (btn) {
        btn.addEventListener('click', function () { updateRepeatSelection(btn.getAttribute('data-repeat')); });
      });
    }
    main.querySelector('#timer-row-repeat').addEventListener('click', function () {
      openRepeatSheet();
      setTimeout(function () { updateRepeatSelection(timerState.repeat); }, 50);
    });
    var savedAction = window.__timerActionSelection;
    if (savedAction && displayAction) {
      displayAction.textContent = savedAction.label;
      displayAction.classList.remove('timer-form-value--unset');
      timerState.action = savedAction;
      window.__timerActionSelection = null;
    }
    var saveBtn = document.getElementById('timer-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var h = timerState.hour;
        var m = timerState.minute;
        var timeStr = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
        var repeatLabelsForSave = repeatLabels || {};
        var repeatText = repeatLabelsForSave[timerState.repeat] || 'Một lần';
        var actionText = (timerState.action && timerState.action.label) ? timerState.action.label : 'Chưa đặt';
        var desc = actionText + ' | ' + repeatText;
        var list = loadDeviceTimers(deviceId);
        list.push({ time: timeStr, desc: desc, enabled: true });
        saveDeviceTimers(deviceId, list);
        location.hash = '#/device/' + deviceId + '/timer';
      });
    }
  }

  function renderDeviceTimerAction(deviceId) {
    setNav('home');
    var devices = [
      { id: '1', name: 'Máy lọc không khí thông minh', actions: [
        { id: 'on', label: 'Bật' },
        { id: 'off', label: 'Tắt' },
        { id: 'mode_auto', label: 'Chế độ tự động' },
        { id: 'mode_sleep', label: 'Chế độ ngủ' },
        { id: 'level_1', label: 'Chuyển cấp độ gió 1' },
        { id: 'level_2', label: 'Chuyển cấp độ gió 2' },
        { id: 'level_3', label: 'Chuyển cấp độ gió 3' }
      ]},
      { id: '2', name: 'Đèn thông minh', actions: [
        { id: 'on', label: 'Bật' },
        { id: 'off', label: 'Tắt' }
      ]},
      { id: '3', name: 'Quạt', actions: [
        { id: 'on', label: 'Turn on' },
        { id: 'off', label: 'Turn off' },
        { id: 'sleep', label: 'Set to sleep mode' },
        { id: 'breeze', label: 'Set to direct breeze' },
        { id: 'oscillate_on', label: 'Enable oscillation' },
        { id: 'oscillate_off', label: 'Disable oscillation' },
        { id: 'level_1', label: 'Change speed to Level 1' },
        { id: 'level_2', label: 'Change speed to Level 2' },
        { id: 'level_3', label: 'Change speed to Level 3' }
      ]}
    ];
    var html =
      '<div class="page-timer-action" data-device-id="' + deviceId + '">' +
      '  <div class="sub-header timer-action-header">' +
      '    <button type="button" class="timer-action-close timer-action-close--left" aria-label="Đóng"><iconify-icon icon="ant-design:close-outlined"></iconify-icon></button>' +
      '    <h1 class="title">Bắt đầu</h1>' +
      '    <span class="timer-action-spacer"></span>' +
      '  </div>' +
      '  <div class="timer-action-body">';
    devices.forEach(function (dev) {
      html += '<div class="timer-action-device-block">';
      html += '<h2 class="timer-action-device-name">' + dev.name + '</h2>';
      dev.actions.forEach(function (act) {
        html += '<button type="button" class="timer-action-option" data-device-id="' + dev.id + '" data-action-id="' + act.id + '" data-label="' + act.label.replace(/"/g, '&quot;') + '">' +
          '<span class="timer-action-label">' + act.label + '</span>' +
          '<span class="timer-action-radio"></span></button>';
      });
      html += '</div>';
    });
    html += '  </div></div>';
    main.innerHTML = html;
    main.querySelectorAll('.timer-action-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.__timerActionSelection = { deviceId: btn.getAttribute('data-device-id'), actionId: btn.getAttribute('data-action-id'), label: btn.getAttribute('data-label') };
        location.hash = '#/device/' + deviceId + '/timer/add';
      });
    });
    main.querySelectorAll('.timer-action-close').forEach(function (el) {
      el.addEventListener('click', function () { location.hash = '#/device/' + deviceId + '/timer/add'; });
    });
  }

  function renderDeviceAutomation(deviceId) {
    setNav('home');
    var deviceName = deviceId === '2' ? 'Đèn thông minh' : 'Máy lọc không khí thông minh';
    var html =
      '<div class="page-device-sub">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/device/' + deviceId + '"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="title">Tự động hóa</h1>' +
      '  </div>' +
      '  <div class="device-sub-body">' +
      '    <p class="device-sub-desc">' + deviceName + '</p>' +
      '    <div class="automation-device-empty">' +
      '      <div class="automation-device-icon"><iconify-icon icon="ant-design:thunderbolt-outlined"></iconify-icon></div>' +
      '      <p class="automation-device-text">Chưa có kịch bản tự động cho thiết bị này</p>' +
      '      <a href="#/automation" class="btn-primary">Thiết lập tự động hóa</a>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
  }

  function noop() {}

  function renderAutomation() {
    setNav('automation');
    var scenariosExplore = [
      { title: 'Exit home', desc: 'Bật | Số lượng người dùng: 17.31M', icons: ['home', 'bulb', 'device'] },
      { title: 'Do-Not-Disturb', desc: 'Khả dụng | Số lượng người dùng: 0.93M', icons: ['moon', 'device', 'bell'] },
      { title: 'Global DND', desc: 'Số lượng người dùng: 0.03M', icons: ['bell', 'device', 'bell'] },
      { title: 'Cool home on return if temperature is high', desc: 'Số lượng người dùng: 0.02M', icons: ['thermo', 'device', 'device'] },
      { title: 'Driving away from home', desc: 'Một số người đã bắt đầu sử dụng', icons: ['car', 'bulb', 'device'] }
    ];
    var tabExploreHtml = '';
    scenariosExplore.forEach(function (s) {
      tabExploreHtml +=
        '<a href="#" class="scenario-card" data-scenario="' + (s.title || '').replace(/"/g, '&quot;') + '">' +
        '  <h3 class="scenario-card-title">' + (s.title || '') + '</h3>' +
        '  <p class="scenario-card-desc">' + (s.desc || '') + '</p>' +
        '  <div class="scenario-card-icons">' +
        '    <span class="scenario-icon scenario-icon--' + (s.icons[0] || '') + '"></span>' +
        '    <span class="scenario-icon scenario-icon--' + (s.icons[1] || '') + '"></span>' +
        '    <span class="scenario-icon scenario-icon--' + (s.icons[2] || '') + '"></span>' +
        '  </div>' +
        '</a>';
    });
    var html =
      '<div class="page-automation page-situation">' +
      '  <div class="situation-header">' +
      '    <a class="situation-back btn-back" href="#/"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="situation-title">Tình huống</h1>' +
      '    <button type="button" class="situation-add" id="automation-btn-add" aria-label="Thêm"><iconify-icon icon="ant-design:plus-outlined"></iconify-icon></button>' +
      '  </div>' +
      '  <div class="situation-tabs">' +
      '    <button type="button" class="situation-tab active" data-tab="explore">Khám phá</button>' +
      '    <button type="button" class="situation-tab" data-tab="mine">Tình huống của tôi</button>' +
      '    <a href="#/automation/log" class="situation-tab" data-tab="log">Nhật ký</a>' +
      '  </div>' +
      '  <div class="situation-content" id="situation-content">' +
      '    <div class="situation-pane active" data-pane="explore">' +
      '      <div class="scenario-cards">' + tabExploreHtml + '</div>' +
      '    </div>' +
      '    <div class="situation-pane" data-pane="mine">' +
      '      <div class="empty-state">' +
      '        <div class="empty-icon"><iconify-icon icon="ant-design:inbox-outlined"></iconify-icon></div>' +
      '        <p class="empty-text">Chạm vào Thêm để thêm tình huống</p>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="situation-add-menu-overlay" id="situation-add-overlay" aria-hidden="true"></div>' +
      '  <div class="situation-add-menu" id="situation-add-menu" aria-hidden="true">' +
      '    <a href="#/create-manual" class="situation-add-item">Điều khiển thủ công</a>' +
      '    <a href="#/automation/setup" class="situation-add-item">Tự động hóa</a>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;

    var btnAdd = document.getElementById('automation-btn-add');
    var addMenu = document.getElementById('situation-add-menu');
    var addOverlay = document.getElementById('situation-add-overlay');
    function openAddMenu() {
      if (addMenu) { addMenu.classList.add('open'); addMenu.setAttribute('aria-hidden', 'false'); }
      if (addOverlay) { addOverlay.classList.add('open'); addOverlay.setAttribute('aria-hidden', 'false'); }
    }
    function closeAddMenu() {
      if (addMenu) { addMenu.classList.remove('open'); addMenu.setAttribute('aria-hidden', 'true'); }
      if (addOverlay) { addOverlay.classList.remove('open'); addOverlay.setAttribute('aria-hidden', 'true'); }
    }
    if (btnAdd) btnAdd.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (addMenu && addMenu.classList.contains('open')) { closeAddMenu(); } else { openAddMenu(); }
    });
    if (addOverlay) addOverlay.addEventListener('click', closeAddMenu);
    main.querySelectorAll('.situation-add-item').forEach(function (item) {
      item.addEventListener('click', function () { closeAddMenu(); });
    });
    var tabs = main.querySelectorAll('.situation-tab');
    var panes = main.querySelectorAll('.situation-pane');
    tabs.forEach(function (tab) {
      if (tab.tagName === 'A') return;
      tab.addEventListener('click', function () {
        var t = tab.getAttribute('data-tab');
        tabs.forEach(function (tb) { tb.classList.remove('active'); });
        tab.classList.add('active');
        panes.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-pane') === t);
        });
      });
    });
  }

  function renderAutomationLog() {
    setNav('home');
    var html =
      '<div class="page-automation-log">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/automation"><span class="btn-back-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span></a>' +
      '    <h1 class="title">Nhật ký tự động</h1>' +
      '  </div>' +
      '  <div class="log-body">' +
      '    <div class="log-empty-state">' +
      '      <div class="log-empty-illustration">' +
      '        <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round">' +
      '          <ellipse cx="60" cy="36" rx="28" ry="10" opacity="0.5"/>' +
      '          <path d="M60 26 L60 14 M56 18 L60 14 L64 18" opacity="0.6"/>' +
      '          <line x1="20" y1="52" x2="100" y2="52"/>' +
      '          <circle cx="35" cy="62" r="4" opacity="0.4"/>' +
      '          <circle cx="85" cy="58" r="3" opacity="0.35"/>' +
      '          <path d="M48 44 Q60 38 72 44" opacity="0.45"/>' +
      '        </svg>' +
      '      </div>' +
      '      <p class="log-empty-label">Trống</p>' +
      '    </div>' +
      '  </div>' +
      '  <button type="button" class="fab log-fab" aria-label="Xóa nhật ký">' +
      '    <iconify-icon icon="ant-design:delete-outlined" class="log-fab-icon"></iconify-icon>' +
      '  </button>' +
      '</div>';
    main.innerHTML = html;
    var logFab = main.querySelector('.log-fab');
    if (logFab) logFab.addEventListener('click', function () {
      window.JSBridge.send('automation/clearLog', {}, function (res) {
        if (res && res.success) main.querySelector('.log-empty-state').style.display = 'flex';
      });
    });
  }

  function renderProfile() {
    setNav('profile');
    var html =
      '<div class="page-profile">' +
      '  <div class="account-section">' +
      '    <div class="account-id"><a href="#/account">6838309456</a> <span>›</span></div>' +
      '    <div class="account-sub">Quản lý tài khoản</div>' +
      '    <div class="account-phone">' +
      '      <span class="account-phone-label">Số điện thoại</span>' +
      '      <div class="account-phone-value">' +
      '        <span class="account-phone-number">' + (USER_PHONE || 'Chưa có') + '</span>' +
      '        <button type="button" class="account-phone-copy" id="btn-copy-phone" data-phone="' + (USER_PHONE || '') + '">Sao chép</button>' +
      '      </div>' +
      '    </div>' +
      '    <div class="profile-appid-row">' +
      '      <label class="profile-appid-label">App ID (Mini App)</label>' +
      '      <div class="profile-appid-input-row">' +
      '        <input type="text" class="profile-appid-input" id="input-miniapp-appid" placeholder="Dán App ID từ Tammi/Super App" value="' + (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_APP_ID) ? String(localStorage.getItem(STORAGE_KEY_APP_ID)).replace(/"/g, '&quot;') : '') + '">' +
      '        <button type="button" class="profile-appid-save" id="btn-save-appid">Lưu</button>' +
      '      </div>' +
      '      <div class="profile-appid-hint">Nếu appId rỗng: lấy App ID từ console Tammi → dán vào ô trên → Lưu → bấm &quot;Kiểm tra kết nối / Lấy số ĐT&quot;</div>' +
      '    </div>' +
      '    <button type="button" class="profile-check-api-btn" id="btn-check-user-info">Kiểm tra kết nối / Lấy số ĐT</button>' +
      '    <div class="profile-check-result" id="profile-check-result"></div>' +
      '    <div class="profile-permission-row">' +
      '      <button type="button" class="profile-check-api-btn" id="btn-request-call-permission">Xin quyền gọi (call)</button>' +
      '      <div class="profile-permission-result" id="profile-permission-result"></div>' +
      '    </div>' +
      '    <div class="profile-env-check" id="profile-env-check"></div>' +
      '    <div class="tags"><span class="tag">2 gia đình</span><span class="tag">1 thiết bị</span></div>' +
      '  </div>' +
      '  <div class="card-block">' +
      '    <div class="card-title">6838309456</div>' +
      '    <div class="card-desc">Thành viên trong gia đình(1)</div>' +
      '    <div class="card-actions">' +
      '      <button type="button" class="icon-btn" id="btn-add-family-member" aria-label="Thêm thành viên"><iconify-icon icon="ant-design:plus-outlined"></iconify-icon></button>' +
      '      <a href="#/account" class="icon-btn" aria-label="Quản lý gia đình"><iconify-icon icon="ant-design:user-outlined"></iconify-icon></a>' +
      '    </div>' +
      '  </div>' +
      '  <a href="#/voice" class="list-item">' +
      '    <div class="list-icon blue"><iconify-icon icon="ant-design:audio-outlined"></iconify-icon></div>' +
      '    <span class="list-text">Trợ lý thoại</span>' +
      '    <span class="list-arrow">›</span>' +
      '  </a>' +
      '  <a href="#/devices" class="list-item">' +
      '    <div class="list-icon green"><iconify-icon icon="ant-design:desktop-outlined"></iconify-icon></div>' +
      '    <span class="list-text">Quản lý nhiều thiết bị</span>' +
      '    <span class="list-arrow">›</span>' +
      '  </a>' +
      '  <a href="#/hub" class="list-item">' +
      '    <div class="list-icon green"><iconify-icon icon="ant-design:appstore-outlined"></iconify-icon></div>' +
      '    <span class="list-text">Hub & cổng</span>' +
      '    <span class="list-arrow">›</span>' +
      '  </a>' +
      '  <a href="#/settings" class="list-item">' +
      '    <div class="list-icon gray"><iconify-icon icon="ant-design:setting-outlined"></iconify-icon></div>' +
      '    <span class="list-text">Cài đặt khác</span>' +
      '    <span class="list-arrow">›</span>' +
      '  </a>' +
      '  <div class="card-block" style="margin-top:16px">' +
      '    <a href="#/help" class="list-item" style="padding-left:0">' +
      '      <div class="list-icon blue"><iconify-icon icon="ant-design:message-outlined"></iconify-icon></div>' +
      '      <span class="list-text">Trợ giúp và phản hồi</span>' +
      '      <span class="list-arrow">›</span>' +
      '    </a>' +
      '  </div>' +
      '  <div class="family-role-modal-overlay" id="family-role-modal-overlay" aria-hidden="true"></div>' +
      '  <div class="family-role-modal" id="family-role-modal" aria-hidden="true">' +
      '    <h3 class="family-role-modal-title">Vui lòng chọn quyền cho các thành viên gia đình.</h3>' +
      '    <div class="family-role-options">' +
      '      <button type="button" class="family-role-option selected" data-role="member">' +
      '        <span class="family-role-check"><iconify-icon icon="ant-design:check-outlined"></iconify-icon></span>' +
      '        <div class="family-role-content"><strong>Thành viên</strong><br><small>Có thể sử dụng mọi thiết bị thông minh trong nhà bạn.</small></div>' +
      '      </button>' +
      '      <button type="button" class="family-role-option" data-role="admin">' +
      '        <span class="family-role-check"><iconify-icon icon="ant-design:check-outlined"></iconify-icon></span>' +
      '        <div class="family-role-content"><strong>Quản trị viên</strong><br><small>Có thể ghép nối và xóa thiết bị, thêm và xóa thành viên đồng thời quản lý nhà.</small></div>' +
      '      </button>' +
      '    </div>' +
      '    <div class="family-role-actions">' +
      '      <button type="button" class="family-role-btn family-role-btn-cancel" id="family-role-cancel">Hủy</button>' +
      '      <button type="button" class="family-role-btn family-role-btn-next" id="family-role-next">Tiếp</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var btnCopyPhone = document.getElementById('btn-copy-phone');
    if (btnCopyPhone) {
      btnCopyPhone.addEventListener('click', function () {
        var phone = USER_PHONE || btnCopyPhone.getAttribute('data-phone') || '';
        if (!phone) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(phone).catch(function () { /* ignore */ });
        } else {
          try {
            var temp = document.createElement('input');
            temp.value = phone;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
          } catch (e) {
            // ignore
          }
        }
        alert('Đã sao chép số điện thoại');
      });
    }

    var resultEl = document.getElementById('profile-check-result');
    var inputAppId = document.getElementById('input-miniapp-appid');
    var btnSaveAppId = document.getElementById('btn-save-appid');
    if (inputAppId && btnSaveAppId) {
      btnSaveAppId.addEventListener('click', function () {
        var val = (inputAppId.value || '').trim();
        if (typeof localStorage !== 'undefined') {
          if (val) {
            localStorage.setItem(STORAGE_KEY_APP_ID, val);
            if (resultEl) { resultEl.textContent = 'Đã lưu App ID. Bấm "Kiểm tra kết nối / Lấy số ĐT" để thử lại.'; resultEl.classList.remove('error'); }
          } else {
            localStorage.removeItem(STORAGE_KEY_APP_ID);
            if (resultEl) { resultEl.textContent = 'Đã xóa App ID đã lưu.'; resultEl.classList.remove('error'); }
          }
          updateMiniAppDebug('windVaneReady', MINIAPP_DEBUG.windVaneReady || '-');
        }
      });
    }
    var btnCheckUserInfo = document.getElementById('btn-check-user-info');
    var phoneNumberEl = main.querySelector('.account-phone-number');
    var envEl = document.getElementById('profile-env-check');
    if (envEl) {
      var hasWV = !!(window.WindVane && typeof window.WindVane.call === 'function');
      var inIframe = typeof window !== 'undefined' && window.self !== window.top;
      var ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '').slice(0, 60) : '';
      envEl.innerHTML =
        '<div class="profile-env-label">Môi trường</div>' +
        '<div class="profile-env-row">WindVane: <strong>' + (hasWV ? 'Có' : 'Không') + '</strong></div>' +
        '<div class="profile-env-row">Dự đoán: <strong>' + (hasWV ? 'WebView H5 (có JSAPI)' : 'Browser hoặc WebView chưa inject WindVane') + '</strong></div>' +
        (inIframe ? '<div class="profile-env-row">Đang trong iframe</div>' : '') +
        '<div class="profile-env-row profile-env-ua">' + (ua ? 'UA: ' + ua + '…' : '') + '</div>';
    }
    function showResult(text, isError) {
      if (!resultEl) return;
      resultEl.textContent = text;
      resultEl.style.display = 'block';
      resultEl.style.padding = '8px 12px';
      resultEl.style.marginTop = '8px';
      resultEl.style.fontSize = '13px';
      resultEl.style.borderRadius = '8px';
      resultEl.style.background = isError ? '#ffebee' : '#e8f5e9';
      resultEl.style.color = isError ? '#c62828' : '#2e7d32';
    }
    // Xin quyền gọi (call) — dùng authorize('call') như handleRequestPermission / handlePermissionError
    var btnRequestCall = document.getElementById('btn-request-call-permission');
    var permissionResultEl = document.getElementById('profile-permission-result');
    function showPermissionFeedback(type, message) {
      if (!permissionResultEl) return;
      permissionResultEl.textContent = message;
      permissionResultEl.style.display = 'block';
      permissionResultEl.style.padding = '8px 12px';
      permissionResultEl.style.marginTop = '8px';
      permissionResultEl.style.fontSize = '13px';
      permissionResultEl.style.borderRadius = '8px';
      permissionResultEl.style.background = type === 'error' ? '#ffebee' : '#e8f5e9';
      permissionResultEl.style.color = type === 'error' ? '#c62828' : '#2e7d32';
    }
    if (btnRequestCall) {
      btnRequestCall.addEventListener('click', function () {
        btnRequestCall.disabled = true;
        showPermissionFeedback('', 'Đang xin quyền gọi...');
        authorize('call')
          .then(function () {
            showPermissionFeedback('success', 'Call permission granted successfully');
          })
          .catch(function (err) {
            showPermissionFeedback('error', 'Permission denied. Please grant call permission in device settings.');
            authorize('call').catch(function () {});
          })
          .finally(function () {
            btnRequestCall.disabled = false;
          });
      });
    }
    if (btnCheckUserInfo) {
      btnCheckUserInfo.addEventListener('click', function () {
        showResult('Đang đợi WindVane (tối đa 1.5s)...', false);
        onWindVaneReady().then(function () {
          if (!window.WindVane || typeof window.WindVane.call !== 'function') {
            fetch(API_BASE + '/ping')
              .then(function (r) { return r.json(); })
              .then(function (d) {
                showResult('Không có WindVane (Browser / WebView chưa inject?). Ping: ' + (d && d.ok ? 'OK' : JSON.stringify(d)), true);
              })
              .catch(function (err) {
                showResult('Không có WindVane. Ping lỗi: ' + (err && err.message || String(err)), true);
              });
            return;
          }
          showResult('Đang gọi getAuthCode...', false);
          loginMiniApp(DEFAULT_SCOPES)
            .then(function (data) {
              if (data && data.success && data.data) {
                var phone = data.data.phoneNumber || (data.data.user && (data.data.user.phoneNumber || data.data.user.msisdn));
                if (phone) {
                  USER_PHONE = phone;
                  window.MINIAPP_USER_PHONE = phone;
                  if (phoneNumberEl) phoneNumberEl.textContent = phone;
                  if (btnCopyPhone) btnCopyPhone.setAttribute('data-phone', phone);
                  showResult('OK. Số ĐT: ' + phone, false);
                } else {
                  showResult('Backend OK nhưng không có số. Chi tiết: ' + JSON.stringify(data.data).slice(0, 300), true);
                }
              } else {
                var errMsg = (data && (data.error || data.message)) || JSON.stringify(data);
                if (data && data.detail) errMsg += ' | detail: ' + (typeof data.detail === 'string' ? data.detail.slice(0, 100) : JSON.stringify(data.detail).slice(0, 100));
                showResult('Backend lỗi: ' + errMsg.slice(0, 250), true);
              }
            })
            .catch(function (err) {
              var code = err && (err.error !== undefined ? err.error : err.code);
              var msg = (err && (err.errorMessage || err.message)) || '';
              if (err && typeof err === 'object' && !msg) {
                try { msg = JSON.stringify(err); } catch (e) { msg = String(err); }
                if (msg.length > 200) msg = msg.slice(0, 200) + '…';
              }
              if (!msg) msg = String(err);
              var msgLower = (msg + '').toLowerCase();
              if (msgLower.indexOf('location') !== -1) {
                msg = msg + ' (Mini app không xin location — nếu Super App bắt location khi getAuthCode, cần bên Tammi bỏ kiểm tra đó.)';
              } else if (code === 13 || err && (err.error === 13 || err.code === 13)) {
                msg = 'Lỗi 13: scope không hợp lệ hoặc app chưa bật getAuthCode trong capability. Kiểm tra appId + scope trùng với console.';
              } else if (code === 11 || err && (err.error === 11 || err.code === 11)) {
                msg = 'Lỗi 11: User hủy cấp quyền.';
              } else if (code === 12 || err && (err.error === 12 || err.code === 12)) {
                msg = 'Lỗi 12: Network / timeout.';
              } else if (code != null) {
                msg = (msg ? msg + ' ' : '') + '(code: ' + code + ')';
              }
              var sent = 'Đã gửi: appId=' + (getMiniAppAppId() || '(rỗng)') + ', scopes=' + JSON.stringify(DEFAULT_SCOPES);
              showResult('Lỗi: ' + msg + '. ' + sent, true);
            });
        });
      });
    }

    var overlay = document.getElementById('family-role-modal-overlay');
    var modal = document.getElementById('family-role-modal');
    var btnAdd = document.getElementById('btn-add-family-member');
    var btnCancel = document.getElementById('family-role-cancel');
    var btnNext = document.getElementById('family-role-next');
    var options = main.querySelectorAll('.family-role-option');
    function openFamilyModal() {
      if (overlay) { overlay.setAttribute('aria-hidden', 'false'); overlay.classList.add('open'); }
      if (modal)   { modal.setAttribute('aria-hidden', 'false');   modal.classList.add('open'); }
    }
    function closeFamilyModal() {
      if (overlay) { overlay.setAttribute('aria-hidden', 'true'); overlay.classList.remove('open'); }
      if (modal)   { modal.setAttribute('aria-hidden', 'true');   modal.classList.remove('open'); }
    }
    if (btnAdd)    btnAdd.addEventListener('click', openFamilyModal);
    if (overlay)   overlay.addEventListener('click', closeFamilyModal);
    if (btnCancel) btnCancel.addEventListener('click', closeFamilyModal);
    if (btnNext)   btnNext.addEventListener('click', function () { closeFamilyModal(); });
    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        options.forEach(function (o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
      });
    });
  }

  function renderStore() {
    setNav('store');
    main.innerHTML = '<div class="page-store"><div class="placeholder">Cửa hàng - Nội dung đang cập nhật</div></div>';
  }

  function renderShared() {
    setNav('home');
    var html =
      '<div class="page-home">' +
      '  <div class="user-id" id="user-id">6838309456-</div>' +
      '  <div class="tabs">' +
      '    <a href="#/">Smart Home</a>' +
      '    <a href="#/shared" class="active">Đã chia sẻ</a>' +
      '    <span class="icon-menu" id="btn-menu"><iconify-icon icon="ant-design:menu-outlined"></iconify-icon></span>' +
      '  </div>' +
      '  <div class="menu-dropdown" id="home-menu" aria-hidden="true">' +
      '    <a href="#/" class="menu-item">Smart Home</a>' +
      '    <a href="#/shared" class="menu-item">Đã chia sẻ</a>' +
      '    <a href="#/nav-settings" class="menu-item"><span>Cài đặt điều hướng</span><span class="menu-icon"><iconify-icon icon="ant-design:setting-outlined"></iconify-icon></span></a>' +
      '    <a href="#/my-devices" class="menu-item"><span>Thiết bị của tôi</span><span class="menu-icon"><iconify-icon icon="ant-design:search-outlined"></iconify-icon></span></a>' +
      '  </div>' +
      '  <div class="menu-overlay" id="menu-overlay" aria-hidden="true"></div>' +
      '  <div class="home-device-cards">' +
      '    <div class="device-card" data-device-id="1">' +
      '      <div class="card-header">' +
      '        <div class="device-icon-wrap"><iconify-icon icon="ant-design:cloud-outlined"></iconify-icon></div>' +
      '        <button class="power-btn on" type="button" aria-label="Tắt"><span class="power-symbol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12L12 4A8 8 0 1 1 11.98 4"/></svg></span></button>' +
      '      </div>' +
      '      <div class="device-name">Máy lọc không khí thông minh</div>' +
      '      <div class="device-meta"><span>Thiết bị</span><span>Kém</span></div>' +
      '    </div>' +
      '    <div class="device-card" data-device-id="2">' +
      '      <div class="card-header">' +
      '        <div class="device-icon-wrap"><iconify-icon icon="ant-design:bulb-outlined"></iconify-icon></div>' +
      '        <button class="power-btn on" type="button" aria-label="Tắt"><span class="power-symbol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12L12 4A8 8 0 1 1 11.98 4"/></svg></span></button>' +
      '      </div>' +
      '      <div class="device-name">Đèn thông minh</div>' +
      '      <div class="device-meta"><span>Thiết bị</span><span>Bật</span></div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="edit-wrap"><a href="#/edit-room" class="btn-edit">Chỉnh sửa</a></div>' +
      '</div>';
    main.innerHTML = html;
    main.querySelectorAll('.device-card').forEach(function (card) {
      var deviceId = card.getAttribute('data-device-id');
      var powerBtn = card.querySelector('.power-btn');
      if (card) {
        card.addEventListener('click', function (e) {
          if (!e.target.closest('.power-btn')) location.hash = '#/device/' + deviceId;
        });
      }
      if (powerBtn) {
          powerBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var on = powerBtn.classList.toggle('on');
            if (deviceId === '1') {
              window.JSBridge.send('device/setPower', { deviceId: deviceId, on: on }, function (res) { if (res && res.success === false) powerBtn.classList.toggle('on'); });
            } else {
              sendPowerTelemetry(on, deviceId);
              if (isNativeWebView()) {
                window.JSBridge.send('device/setPower', { deviceId: deviceId, on: on }, function (res) { if (res && res.success === false) powerBtn.classList.toggle('on'); });
              }
            }
          });
        }
    });
    var btnMenu = document.getElementById('btn-menu');
    var homeMenu = document.getElementById('home-menu');
    var overlay  = document.getElementById('menu-overlay');
    function openMenu()  { homeMenu && (homeMenu.setAttribute('aria-hidden', 'false'), homeMenu.classList.add('open'));    overlay && (overlay.setAttribute('aria-hidden', 'false'), overlay.classList.add('open')); }
    function closeMenu() { homeMenu && (homeMenu.setAttribute('aria-hidden', 'true'),  homeMenu.classList.remove('open')); overlay && (overlay.setAttribute('aria-hidden', 'true'),  overlay.classList.remove('open')); }
    if (btnMenu) btnMenu.addEventListener('click', function (e) { e.stopPropagation(); openMenu(); });
    if (overlay) overlay.addEventListener('click', closeMenu);
    main.querySelectorAll('.menu-dropdown .menu-item').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  function renderScan() {
    setNav('home');
    var html =
      '<div class="page-scan">' +
      '  <div class="scan-header">' +
      '    <a class="scan-back" href="#/add-device" aria-label="Quay lại"><span class="scan-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '  </div>' +
      '  <div class="scan-frame-wrap">' +
      '    <div class="scan-frame">' +
      '      <div class="scan-corner scan-corner--tl"></div>' +
      '      <div class="scan-corner scan-corner--tr"></div>' +
      '      <div class="scan-corner scan-corner--bl"></div>' +
      '      <div class="scan-corner scan-corner--br"></div>' +
      '    </div>' +
      '  </div>' +
      '  <p class="scan-hint">Quét mã QR trên thiết bị hoặc hướng dẫn sử dụng</p>' +
      '  <a href="#/add-device" class="scan-manual-link">Không có mã QR và thêm thủ công <iconify-icon icon="ant-design:right-outlined"></iconify-icon></a>' +
      '  <div class="scan-actions">' +
      '    <button type="button" class="scan-action-btn" id="scan-btn-library">' +
      '      <span class="scan-action-icon"><iconify-icon icon="ant-design:picture-outlined"></iconify-icon></span>' +
      '      <span class="scan-action-label">Thư viện</span>' +
      '    </button>' +
      '    <button type="button" class="scan-action-btn" id="scan-btn-flash">' +
      '      <span class="scan-action-icon"><iconify-icon icon="mdi:flashlight"></iconify-icon></span>' +
      '      <span class="scan-action-label">Đèn pin</span>' +
      '    </button>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var btnLib   = document.getElementById('scan-btn-library');
    var btnFlash = document.getElementById('scan-btn-flash');
    if (btnLib)   btnLib.addEventListener('click',   function () { window.JSBridge.send('scan/fromGallery',  {}, noop); });
    if (btnFlash) btnFlash.addEventListener('click', function () { window.JSBridge.send('scan/toggleFlash',  {}, noop); });
  }

  function renderNotifications() {
    setNav('home');
    var html =
      '<div class="page-notifications">' +
      '  <div class="notif-header">' +
      '    <a class="back btn-back" href="#/"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="notif-title">Thông báo</h1>' +
      '    <a href="#/notification-settings" class="notif-settings" aria-label="Cài đặt thông báo"><iconify-icon icon="ant-design:setting-outlined"></iconify-icon></a>' +
      '  </div>' +
      '  <div class="notif-filter">' +
      '    <span class="notif-filter-label">Tất cả nhà</span>' +
      '    <iconify-icon icon="ant-design:down-outlined" class="notif-filter-chevron"></iconify-icon>' +
      '  </div>' +
      '  <div class="notif-toolbar">' +
      '    <span class="notif-unread-count">1 thông báo chưa đọc</span>' +
      '    <button type="button" class="btn-mark-read" id="btn-mark-read">Tất cả đã đọc</button>' +
      '  </div>' +
      '  <div class="notif-list">' +
      '    <a href="#" class="notif-card notif-card--unread" data-id="1">' +
      '      <span class="notif-card-icon"><iconify-icon icon="ant-design:mail-outlined"></iconify-icon><span class="notif-dot"></span></span>' +
      '      <div class="notif-card-body">' +
      '        <div class="notif-card-title">Thông báo hệ thống</div>' +
      '        <div class="notif-card-desc">Nguyễn Kim Thuần Chia sẻ thiết bị với quý khách</div>' +
      '      </div>' +
      '      <span class="notif-card-time">Hôm qua</span>' +
      '    </a>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var btnMark = document.getElementById('btn-mark-read');
    if (btnMark) btnMark.addEventListener('click', function () {
      main.querySelectorAll('.notif-card--unread').forEach(function (c) { c.classList.remove('notif-card--unread'); });
      var countEl = main.querySelector('.notif-unread-count');
      if (countEl) countEl.textContent = '0 thông báo chưa đọc';
    });
  }

  function renderNotificationSettings() {
    setNav('home');
    var html =
      '<div class="page-notification-settings">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/notifications"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="title">Cài đặt thông báo</h1>' +
      '  </div>' +
      '  <div class="notification-settings-body">' +
      '    <p class="settings-section-label">Nhận các thông báo hệ thống</p>' +
      '    <a href="#/notification-settings/system" class="settings-row">' +
      '      <div class="settings-row-text"><strong>Thông báo hệ thống</strong><br><small>Thông báo chính thức, thông báo chia sẻ, thông báo thông minh cho toàn bộ nhà, v.v.</small></div>' +
      '      <iconify-icon icon="ant-design:right-outlined" class="settings-row-arrow"></iconify-icon>' +
      '    </a>' +
      '    <p class="settings-section-label">Nhận các thông báo về thiết bị</p>' +
      '    <div class="settings-row settings-row--toggle">' +
      '      <span class="settings-row-text"><strong>Thông báo thiết bị</strong></span>' +
      '      <label class="toggle-switch"><input type="checkbox" checked><span class="slider"></span></label>' +
      '    </div>' +
      '    <a href="#/notification-settings/device" class="settings-row">' +
      '      <span class="settings-row-text"><strong>Quản lý thông báo về thiết bị</strong></span>' +
      '      <iconify-icon icon="ant-design:right-outlined" class="settings-row-arrow"></iconify-icon>' +
      '    </a>' +
      '    <a href="#/notification-settings/shared" class="settings-row">' +
      '      <span class="settings-row-text"><strong>Quản lý thông báo về thiết bị dùng chung</strong></span>' +
      '      <iconify-icon icon="ant-design:right-outlined" class="settings-row-arrow"></iconify-icon>' +
      '    </a>' +
      '    <p class="settings-section-label">Thông báo tình huống đã nhận</p>' +
      '    <div class="settings-row settings-row--toggle">' +
      '      <span class="settings-row-text"><strong>Thông báo kết quả thực hiện tình huống</strong></span>' +
      '      <label class="toggle-switch"><input type="checkbox"><span class="slider"></span></label>' +
      '    </div>' +
      '    <p class="settings-section-label">Không làm phiền</p>' +
      '    <a href="#/notification-settings/dnd" class="settings-row">' +
      '      <span class="settings-row-text"><strong>Khoảng thời gian không làm phiền</strong></span>' +
      '      <span class="settings-row-value">Không đặt</span>' +
      '      <iconify-icon icon="ant-design:right-outlined" class="settings-row-arrow"></iconify-icon>' +
      '    </a>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
  }

  function renderVoice() {
    setNav('home');
    var html =
      '<div class="page-profile-sub">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/profile"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="title">Trợ lý thoại</h1>' +
      '  </div>' +
      '  <div class="profile-sub-body">' +
      '    <h2 class="profile-sub-heading">Trợ lý thoại</h2>' +
      '    <div class="voice-assistants">' +
      '      <a href="#" class="voice-assistant-item"><span class="voice-assistant-icon alexa">Alexa</span><span class="voice-assistant-name">Amazon Alexa</span></a>' +
      '      <a href="#" class="voice-assistant-item"><span class="voice-assistant-icon google">G</span><span class="voice-assistant-name">Google Assistant</span></a>' +
      '      <a href="#" class="voice-assistant-item"><span class="voice-assistant-icon clova">C</span><span class="voice-assistant-name">NAVER Clova</span></a>' +
      '    </div>' +
      '    <h2 class="profile-sub-heading">Các thiết bị hỗ trợ điều khiển bằng giọng nói</h2>' +
      '    <div class="voice-devices-grid">' +
      '      <a href="#" class="voice-device-tile"><span class="voice-device-icon"><iconify-icon icon="ant-design:video-camera-outlined"></iconify-icon></span><span>Webcam</span></a>' +
      '      <a href="#" class="voice-device-tile"><span class="voice-device-icon"><iconify-icon icon="ant-design:bulb-outlined"></iconify-icon></span><span>Đèn</span></a>' +
      '      <a href="#" class="voice-device-tile"><span class="voice-device-icon"><iconify-icon icon="ant-design:cloud-outlined"></iconify-icon></span><span>Máy lọc không khí</span></a>' +
      '      <a href="#" class="voice-device-tile"><span class="voice-device-icon"><iconify-icon icon="ant-design:appstore-outlined"></iconify-icon></span><span>Robot</span></a>' +
      '    </div>' +
      '    <div class="voice-camera-list">' +
      '      <a href="#" class="voice-camera-item">Xiaomi Home Security Camera</a>' +
      '      <a href="#" class="voice-camera-item">Xiaomi Home Security Camera Basic 1080P</a>' +
      '      <a href="#" class="voice-camera-item">Xiaomi Home Security Camera 360° 1080P</a>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
  }

  function renderDevices() {
    setNav('home');
    var html =
      '<div class="page-profile-sub">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/profile"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="title">Quản lý nhiều thiết bị</h1>' +
      '  </div>' +
      '  <div class="profile-sub-body">' +
      '    <a href="#/devices/utilities" class="profile-list-row">Tiện ích<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
  }

  function renderHub() {
    setNav('home');
    var html =
      '<div class="page-profile-sub">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/profile"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="title">Hub & cổng</h1>' +
      '  </div>' +
      '  <div class="profile-sub-body">' +
      '    <div class="hub-select"><span>6838309456</span><iconify-icon icon="ant-design:down-outlined"></iconify-icon></div>' +
      '    <div class="hub-empty">' +
      '      <div class="hub-empty-illus"></div>' +
      '      <p class="hub-empty-text">Hiện không có cổng.</p>' +
      '      <a href="#" class="hub-empty-link">Tìm hiểu thêm về cổng</a>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
  }

  function renderSettings() {
    setNav('home');
    var html =
      '<div class="page-profile-sub">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/profile"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="title">Cài đặt</h1>' +
      '  </div>' +
      '  <div class="profile-sub-body settings-body">' +
      '    <p class="settings-group-label">Chung</p>' +
      '    <a href="#/notification-settings" class="profile-list-row">Cài đặt thông báo<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <a href="#" class="profile-list-row">Cài đặt bảo mật<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <a href="#" class="profile-list-row">Đơn vị nhiệt độ<span class="row-value">Độ C</span><iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <div class="profile-list-row profile-list-row--toggle"><span>Chế độ tối của plug-in</span><label class="toggle-switch"><input type="checkbox" checked><span class="slider"></span></label></div>' +
      '    <a href="#" class="profile-list-row">Tính năng thử nghiệm<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <p class="settings-group-label">Nhà và thiết bị</p>' +
      '    <a href="#" class="profile-list-row">Trình quản lý nhà riêng<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <a href="#" class="profile-list-row">Chia sẻ thiết bị<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <a href="#" class="profile-list-row">Thẻ thao tác nhanh<span class="row-value">Tắt</span><iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <div class="profile-list-row profile-list-row--toggle"><span>Âm phát ra khi chạm</span><label class="toggle-switch"><input type="checkbox" checked><span class="slider"></span></label></div>' +
      '    <p class="settings-group-label">Ngôn ngữ và quốc gia</p>' +
      '    <a href="#" class="profile-list-row">Quốc gia<span class="row-value">Việt Nam</span><iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <a href="#" class="profile-list-row">Ngôn ngữ<span class="row-value">Tiếng Việt</span><iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <p class="settings-group-label">Riêng tư và bảo mật</p>' +
      '    <a href="#" class="profile-list-row">Quản lý các quyền hệ thống<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <a href="#" class="profile-list-row">Thông tin pháp lý & Quản lý quyền riêng tư<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <p class="settings-group-label">Giới thiệu</p>' +
      '    <a href="#" class="profile-list-row">Về Xiaomi Home<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <a href="#" class="profile-list-row">Kiểm tra bản cập nhật<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <a href="#" class="profile-list-row">Xóa bộ nhớ đệm (112.61M)<iconify-icon icon="ant-design:right-outlined" class="row-arrow"></iconify-icon></a>' +
      '    <button type="button" class="btn-logout">Đăng xuất</button>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
  }

  function renderAccount() {
    setNav('home');
    var html =
      '<div class="page-account">' +
      '  <div class="account-page-header">' +
      '    <a class="back btn-back" href="#/profile"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <div class="account-page-title-wrap">' +
      '      <span class="account-page-title">6838309456</span>' +
      '      <iconify-icon icon="ant-design:down-outlined" class="account-page-chevron"></iconify-icon>' +
      '    </div>' +
      '    <a href="#" class="account-page-add" id="account-header-add" aria-label="Thêm"><iconify-icon icon="ant-design:plus-outlined"></iconify-icon></a>' +
      '  </div>' +
      '  <p class="account-page-sub">0 phòng 0 thiết bị</p>' +
      '  <div class="account-page-body">' +
      '    <p class="account-section-label">Thành viên trong gia đình (1)</p>' +
      '    <a href="#" class="account-member-row">' +
      '      <span class="account-member-icon"><iconify-icon icon="ant-design:user-outlined"></iconify-icon></span>' +
      '      <div class="account-member-info"><strong>6838309456 (Tôi)</strong><br><small>Chủ sở hữu</small></div>' +
      '      <iconify-icon icon="ant-design:right-outlined" class="account-row-arrow"></iconify-icon>' +
      '    </a>' +
      '    <a href="#/profile" class="account-member-row">' +
      '      <span class="account-member-icon account-member-icon--add"><iconify-icon icon="ant-design:plus-outlined"></iconify-icon></span>' +
      '      <span class="account-member-label">Mời thành viên</span>' +
      '      <iconify-icon icon="ant-design:right-outlined" class="account-row-arrow"></iconify-icon>' +
      '    </a>' +
      '    <p class="account-section-label">Gia đình</p>' +
      '    <a href="#" class="account-member-row">' +
      '      <span class="account-member-label">Tên nhà riêng</span>' +
      '      <span class="account-member-value">6838309456</span>' +
      '      <iconify-icon icon="ant-design:right-outlined" class="account-row-arrow"></iconify-icon>' +
      '    </a>' +
      '    <a href="#/nav-settings" class="account-member-row">' +
      '      <span class="account-member-label">Cài đặt điều hướng</span>' +
      '      <iconify-icon icon="ant-design:right-outlined" class="account-row-arrow"></iconify-icon>' +
      '    </a>' +
      '    <button type="button" class="btn-delete-family" id="btn-delete-family">Xóa bỏ gia đình</button>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var btnAdd = document.getElementById('account-header-add');
    if (btnAdd) btnAdd.addEventListener('click', function (e) { e.preventDefault(); window.openGlobalAddMenu && window.openGlobalAddMenu(); });
  }

  function renderHelp() {
    setNav('home');
    var html =
      '<div class="page-profile-sub">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/profile"><span class="btn-back-arrow"><iconify-icon icon="ant-design:left-outlined"></iconify-icon></span></a>' +
      '    <h1 class="title">Trợ giúp và phản hồi</h1>' +
      '  </div>' +
      '  <div class="profile-sub-body">' +
      '    <p class="profile-sub-heading">Thiết bị của tôi</p>' +
      '    <a href="#/device/1" class="help-device-item">' +
      '      <span class="help-device-icon"></span>' +
      '      <span class="help-device-name">Máy lọc không khí thông minh Xiao...</span>' +
      '    </a>' +
      '    <p class="profile-sub-heading">Thêm</p>' +
      '    <div class="help-more-row">' +
      '      <a href="#" class="help-more-item"><span class="help-more-icon help-more-icon--green"><iconify-icon icon="ant-design:home-outlined"></iconify-icon></span><span>Ứng dụng Xiaomi Home</span></a>' +
      '      <a href="#" class="help-more-item"><span class="help-more-icon help-more-icon--purple"><iconify-icon icon="ant-design:tablet-outlined"></iconify-icon></span><span>Máy tính bảng và đồng hồ</span></a>' +
      '      <a href="#" class="help-more-item"><span class="help-more-icon help-more-icon--orange"><iconify-icon icon="ant-design:message-outlined"></iconify-icon></span><span>Câu hỏi và đề xuất</span></a>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
  }

  function renderSubPage(title, backHash, content) {
    setNav('home');
    var body = content || '<p class="placeholder" style="padding:20px;color:var(--text-muted);">Nội dung đang cập nhật</p>';
    var html =
      '<div class="page-sub">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="' + (backHash || '#/') + '"><span class="btn-back-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span></a>' +
      '    <h1 class="title">' + title + '</h1>' +
      '  </div>' +
      '  <div class="sub-body">' + body + '</div>' +
      '</div>';
    main.innerHTML = html;
  }

  function renderNavSettings() {
    setNav('home');
    var html =
      '<div class="page-nav-settings">' +
      '  <div class="nav-settings-header">' +
      '    <a class="back btn-back" href="#/"><span class="btn-back-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span></a>' +
      '    <h1 class="title">Cài đặt điều hướng</h1>' +
      '    <a href="#/nav-settings/edit" class="header-right">Chỉnh sửa</a>' +
      '  </div>' +
      '  <div class="nav-settings-body">' +
      '    <a href="#/" class="nav-settings-item">Smart Home<span class="arrow">›</span></a>' +
      '  </div>' +
      '  <a href="#/nav-settings/add" class="fab" aria-label="Thêm">+</a>' +
      '</div>';
    main.innerHTML = html;
  }

  function renderMyDevices() {
    setNav('home');
    var html =
      '<div class="page-my-devices">' +
      '  <div class="my-devices-header">' +
      '    <a class="back btn-back" href="#/"><span class="btn-back-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span></a>' +
      '    <h1 class="title">Thiết bị của tôi</h1>' +
      '  </div>' +
      '  <div class="my-devices-bar">' +
      '    <span class="bar-text">Thiết bị của tôi(1)</span>' +
      '    <span class="bar-arrow">▾</span>' +
      '  </div>' +
      '  <div class="my-devices-list">' +
      '    <div class="device-card" data-device-id="1">' +
      '      <div class="card-header">' +
      '        <div class="device-icon-wrap">🌬️</div>' +
      '        <button class="power-btn on" type="button" aria-label="Tắt"><span class="power-symbol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12L12 4A8 8 0 1 1 11.98 4"/></svg></span></button>' +
      '      </div>' +
      '      <div class="device-name">Máy lọc không khí thông minh</div>' +
      '      <div class="device-meta"><span>Thiết bị</span><span>Kém</span></div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var card = main.querySelector('.device-card');
    if (card) card.addEventListener('click', function (e) { if (!e.target.classList.contains('power-btn')) location.hash = '#/device/1'; });
    var powerBtn = main.querySelector('.power-btn');
    if (powerBtn) powerBtn.addEventListener('click', function (e) { e.stopPropagation(); powerBtn.classList.toggle('on'); });
  }

  function renderAddDevice() {
    setNav('home');
    var html =
      '<div class="page-add-device">' +
      '  <div class="add-device-header">' +
      '    <a class="back btn-back" href="#/automation"><span class="btn-back-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span></a>' +
      '    <h1 class="title">Thêm thiết bị</h1>' +
      '    <div class="header-icons"><iconify-icon icon="ant-design:search-outlined" class="icon-ai"></iconify-icon><iconify-icon icon="ant-design:question-circle-outlined" class="icon-ai"></iconify-icon></div>' +
      '  </div>' +
      '  <div class="add-device-body">' +
      '    <section class="add-device-section">' +
      '      <h2 class="section-title">Khám phá thiết bị lân cận</h2>' +
      '      <div class="bluetooth-illus">' +
      '        <div class="bluetooth-phone">' +
      '          <div class="bluetooth-app-grid">' +
      '            <div class="bluetooth-app bluetooth-app--active"><iconify-icon icon="mdi:bluetooth"></iconify-icon></div>' +
      '            <div class="bluetooth-app"></div>' +
      '            <div class="bluetooth-app"></div>' +
      '            <div class="bluetooth-app"></div>' +
      '          </div>' +
      '        </div>' +
      '        <div class="bluetooth-hand" aria-hidden="true"><iconify-icon icon="mdi:hand-pointing-right"></iconify-icon></div>' +
      '      </div>' +
      '      <p class="section-desc">Bật Bluetooth để tìm các thiết bị Bluetooth ở gần.</p>' +
      '      <button type="button" class="btn-bluetooth">Bật Bluetooth</button>' +
      '    </section>' +
      '    <a href="#/automation/scan" class="add-device-row">' +
      '      <span class="row-icon scan"><iconify-icon icon="ant-design:scan-outlined"></iconify-icon></span>' +
      '      <span class="row-text">Quét để thêm</span>' +
      '      <span class="row-arrow"><iconify-icon icon="ant-design:right-outlined"></iconify-icon></span>' +
      '    </a>' +
      '    <section class="add-device-section">' +
      '      <h2 class="section-title">Thêm thiết bị thủ công</h2>' +
      '      <div class="device-category">' +
      '        <h3 class="category-name">Dụng cụ vệ sinh</h3>' +
      '        <div class="device-grid">' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:reload-outlined"></iconify-icon></span><span class="tile-label">Máy giặt/máy sấy</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:appstore-outlined"></iconify-icon></span><span class="tile-label">Robot dọn nhà</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:solution-outlined"></iconify-icon></span><span class="tile-label">Máy lau sàn</span></a>' +
      '        </div>' +
      '      </div>' +
      '      <div class="device-category">' +
      '        <h3 class="category-name">An ninh gia đình</h3>' +
      '        <div class="device-grid">' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:camera-outlined"></iconify-icon></span><span class="tile-label">Máy ảnh</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:bell-outlined"></iconify-icon></span><span class="tile-label">Chuông chống trộm</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:lock-outlined"></iconify-icon></span><span class="tile-label">Khóa cửa</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:safety-certificate-outlined"></iconify-icon></span><span class="tile-label">Két sắt an toàn</span></a>' +
      '        </div>' +
      '      </div>' +
      '      <div class="device-category">' +
      '        <h3 class="category-name">Cảm biến</h3>' +
      '        <div class="device-grid">' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:dashboard-outlined"></iconify-icon></span><span class="tile-label">Cảm biến nhiệt độ và độ ẩm</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:fire-outlined"></iconify-icon></span><span class="tile-label">Cảm biến khói</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:cloud-outlined"></iconify-icon></span><span class="tile-label">Cảm biến ngâm nước</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:user-outlined"></iconify-icon></span><span class="tile-label">Cảm biến cơ thể người</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:swap-outlined"></iconify-icon></span><span class="tile-label">Từ tính cửa sổ / cửa ra vào</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:bulb-outlined"></iconify-icon></span><span class="tile-label">Cảm biến độ sáng</span></a>' +
      '        </div>' +
      '      </div>' +
      '      <div class="device-category">' +
      '        <h3 class="category-name">Thiết bị điện môi trường</h3>' +
      '        <div class="device-grid">' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:cloud-outlined"></iconify-icon></span><span class="tile-label">Máy tạo độ ẩm</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:fire-outlined"></iconify-icon></span><span class="tile-label">Lò sưởi</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:cloud-outlined"></iconify-icon></span><span class="tile-label">Máy lạnh</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:cloud-outlined"></iconify-icon></span><span class="tile-label">Máy lọc không khí</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:bulb-outlined"></iconify-icon></span><span class="tile-label">Đèn quạt</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:customer-service-outlined"></iconify-icon></span><span class="tile-label">Loa</span></a>' +
      '          <a href="#" class="device-tile"><span class="tile-icon"><iconify-icon icon="ant-design:download-outlined"></iconify-icon></span><span class="tile-label">Máy hút ẩm</span></a>' +
      '        </div>' +
      '      </div>' +
      '    </section>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var btnBt = main.querySelector('.btn-bluetooth');
    if (btnBt) btnBt.addEventListener('click', function () { window.JSBridge.send('device/toggleBluetooth', {}, noop); });
  }

  function renderCreateManualControl() {
    setNav('home');
    var html =
      '<div class="page-create-manual">' +
      '  <div class="sub-header">' +
      '    <a class="back btn-back" href="#/automation"><span class="btn-back-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span></a>' +
      '    <h1 class="title">Tạo điều khiển thủ công</h1>' +
      '  </div>' +
      '  <div class="create-manual-body">' +
      '    <div class="field-wrap">' +
      '      <input type="text" class="input-name" id="manual-name" placeholder="Nhập tên" />' +
      '      <p class="field-error" id="manual-name-error"></p>' +
      '    </div>' +
      '    <h3 class="create-manual-heading">Điều chỉnh thiết bị thành</h3>' +
      '    <button type="button" class="btn-add-action" id="btn-add-action-manual"><span class="btn-add-icon">+</span> Thêm hành động</button>' +
      '  </div>' +
      '  <button type="button" class="btn-setup" id="btn-setup-manual">Thiết lập</button>' +
      '  <div class="action-modal-overlay" id="action-modal-overlay" aria-hidden="true"></div>' +
      '  <div class="action-modal" id="action-modal" aria-hidden="true">' +
      '    <h3 class="action-modal-title">Thêm hành động</h3>' +
      '    <a href="#" class="action-modal-item" data-action="device"><span class="action-icon house"><iconify-icon icon="ant-design:home-outlined"></iconify-icon></span><div><strong>Thiết bị nhà thông minh</strong><br><small>Ví dụ: "Bật đèn trần"</small></div><span class="arrow"><iconify-icon icon="ant-design:right-outlined"></iconify-icon></span></a>' +
      '    <a href="#" class="action-modal-item" data-action="wait"><span class="action-icon clock"><iconify-icon icon="ant-design:clock-circle-outlined"></iconify-icon></span><div><strong>Chế độ chờ</strong><br><small>Ví dụ: "Thực hiện sau khi chờ 5 phút"</small></div><span class="arrow"><iconify-icon icon="ant-design:right-outlined"></iconify-icon></span></a>' +
      '    <a href="#" class="action-modal-item" data-action="notify"><span class="action-icon bell"><iconify-icon icon="ant-design:bell-outlined"></iconify-icon></span><div><strong>Thông báo</strong><br><small>Ví dụ: "Gửi thông báo đến điện thoại"</small></div><span class="arrow"><iconify-icon icon="ant-design:right-outlined"></iconify-icon></span></a>' +
      '    <a href="#" class="action-modal-item" data-action="automation"><span class="action-icon y"><iconify-icon icon="ant-design:thunderbolt-outlined"></iconify-icon></span><div><strong>Tự động hóa hiện có</strong><br><small>Ví dụ: "Sử dụng tự động hóa hoặc điều khiển thủ công cụ thể"</small></div><span class="arrow"><iconify-icon icon="ant-design:right-outlined"></iconify-icon></span></a>' +
      '    <button type="button" class="action-modal-cancel" id="action-modal-cancel">Hủy</button>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var overlay   = document.getElementById('action-modal-overlay');
    var modal     = document.getElementById('action-modal');
    var btnAdd    = document.getElementById('btn-add-action-manual');
    var btnCancel = document.getElementById('action-modal-cancel');
    var inputName = document.getElementById('manual-name');
    var errEl     = document.getElementById('manual-name-error');
    function openModal()  { if (overlay) { overlay.setAttribute('aria-hidden', 'false'); overlay.classList.add('open'); }    if (modal) { modal.setAttribute('aria-hidden', 'false'); modal.classList.add('open'); } }
    function closeModal() { if (overlay) { overlay.setAttribute('aria-hidden', 'true');  overlay.classList.remove('open'); } if (modal) { modal.setAttribute('aria-hidden', 'true');  modal.classList.remove('open'); } }
    if (btnAdd)    btnAdd.addEventListener('click', openModal);
    if (overlay)   overlay.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    main.querySelectorAll('.action-modal-item').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); closeModal(); }); });
    var btnSetup = document.getElementById('btn-setup-manual');
    if (btnSetup) btnSetup.addEventListener('click', function () {
      var name = inputName && inputName.value.trim();
      if (errEl) errEl.textContent = '';
      if (!name) {
        if (errEl) errEl.textContent = 'Tên điều khiển thủ công không được để trống';
        if (inputName) inputName.classList.add('error');
        return;
      }
      if (inputName) inputName.classList.remove('error');
      window.JSBridge.send('manual/save', { name: name }, function (res) {
        if (res && res.success) location.hash = '#/automation';
      });
    });
  }

  function renderAutomationSetup() {
    setNav('home');
    var html =
      '<div class="page-automation-setup page-scene-exit">' +
      '  <div class="scene-header">' +
      '    <a class="back btn-back" href="#/automation"><span class="btn-back-arrow"><iconify-icon icon="ant-design:close-outlined"></iconify-icon></span></a>' +
      '    <h1 class="scene-title">Exit home</h1>' +
      '    <button type="button" class="scene-save" id="scene-save-btn" aria-label="Lưu"><iconify-icon icon="ant-design:check-outlined"></iconify-icon></button>' +
      '  </div>' +
      '  <div class="scene-body">' +
      '    <p class="scene-desc">When you leave home, turn off lights, turn on cameras, and start cleaning</p>' +
      '    <div class="scene-warning">' +
      '      To save this scene, please uncheck all deleted devices or devices not found in current home.' +
      '    </div>' +
      '    <h2 class="scene-section-title">Do the following things:</h2>' +
      '    <div class="scene-card scene-card--expandable open">' +
      '      <div class="scene-card-head" id="scene-appliances-head">' +
      '        <span class="scene-card-icon scene-card-icon--green"><iconify-icon icon="ant-design:thunderbolt-outlined"></iconify-icon></span>' +
      '        <div class="scene-card-head-text">' +
      '          <span class="scene-card-title">Turn off appliances</span>' +
      '          <span class="scene-card-meta">1 device selected</span>' +
      '        </div>' +
      '        <iconify-icon icon="ant-design:up-outlined" class="scene-card-chevron"></iconify-icon>' +
      '      </div>' +
      '      <div class="scene-card-body">' +
      '        <div class="scene-card-sub-row"><span class="scene-card-sub">Switch off appliances</span><button type="button" class="scene-select-all">Select all</button></div>' +
      '        <div class="scene-device-list">' +
      '          <label class="scene-device-item">' +
      '            <span class="scene-device-icon"><iconify-icon icon="ant-design:cloud-outlined"></iconify-icon></span>' +
      '            <div class="scene-device-info"><span class="scene-device-name">Quạt</span><span class="scene-device-room">Phòng khách</span></div>' +
      '            <input type="checkbox" class="scene-device-check">' +
      '          </label>' +
      '          <label class="scene-device-item scene-device-item--deleted">' +
      '            <span class="scene-device-icon"><iconify-icon icon="ant-design:cloud-outlined"></iconify-icon></span>' +
      '            <div class="scene-device-info"><span class="scene-device-name">Quạt cây</span><span class="scene-device-room scene-device-room--deleted">Device deleted</span></div>' +
      '            <input type="checkbox" class="scene-device-check" checked>' +
      '          </label>' +
      '        </div>' +
      '        <p class="scene-card-hint">This feature is currently not supported by devices not in the list</p>' +
      '      </div>' +
      '    </div>' +
      '    <h2 class="scene-section-title">More triggers to execute this scene</h2>' +
      '    <div class="scene-card">' +
      '      <div class="scene-trigger-row">' +
      '        <span class="scene-trigger-icon"><iconify-icon icon="ant-design:environment-outlined"></iconify-icon></span>' +
      '        <span class="scene-trigger-label">When leaving home</span>' +
      '        <label class="timer-toggle"><input type="checkbox" class="timer-toggle-input"><span class="timer-toggle-slider"></span></label>' +
      '      </div>' +
      '    </div>' +
      '    <div class="scene-card">' +
      '      <a href="#" class="scene-trigger-row scene-trigger-row--link" id="scene-voice-row">' +
      '        <span class="scene-trigger-icon"><iconify-icon icon="ant-design:audio-outlined"></iconify-icon></span>' +
      '        <span class="scene-trigger-label">Voice control</span>' +
      '        <span class="scene-trigger-value">"Exit home"</span>' +
      '        <iconify-icon icon="ant-design:right-outlined" class="scene-trigger-arrow"></iconify-icon>' +
      '      </a>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
    var saveBtn = document.getElementById('scene-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', function () { location.hash = '#/automation'; });
    var head = document.getElementById('scene-appliances-head');
    var card = head && head.closest('.scene-card--expandable');
    if (head && card) head.addEventListener('click', function () { card.classList.toggle('open'); });
    var voiceRow = document.getElementById('scene-voice-row');
    if (voiceRow) voiceRow.addEventListener('click', function (e) { e.preventDefault(); });
  }

  function renderEditRoom() {
    setNav('home');
    var html =
      '<div class="page-edit-room">' +
      '  <div class="edit-room-header">' +
      '    <a class="back btn-back" href="#/"><span class="btn-back-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span></a>' +
      '    <h1 class="title">Chỉnh sửa phòng</h1>' +
      '  </div>' +
      '  <div class="edit-room-body">' +
      '    <a href="#/edit-room/name" class="edit-room-row"><span class="label">Tên</span><span class="value">Nhà thông minh</span><span class="arrow">›</span></a>' +
      '    <a href="#/edit-room/bg" class="edit-room-row"><span class="label">Hình nền</span><span class="bg-preview"></span><span class="arrow">›</span></a>' +
      '    <div class="edit-room-divider"></div>' +
      '    <a href="#/edit-room/manual" class="edit-room-row"><span class="label">Điều khiển thủ công</span><span class="arrow">›</span></a>' +
      '    <div class="edit-room-divider"></div>' +
      '    <p class="edit-room-subtitle">Chỉnh sửa mô-đun</p>' +
      '    <div class="edit-room-toggle-item"><span class="toggle-label">Nhóm đèn</span><label class="toggle-switch"><input type="checkbox"><span class="slider"></span></label></div>' +
      '    <div class="edit-room-toggle-item"><span class="toggle-label">Nhóm rèm</span><label class="toggle-switch"><input type="checkbox"><span class="slider"></span></label></div>' +
      '    <div class="edit-room-toggle-item"><span class="toggle-label">Nhóm các thiết bị môi trường</span><label class="toggle-switch"><input type="checkbox"><span class="slider"></span></label></div>' +
      '    <div class="edit-room-toggle-item"><span class="toggle-label">Nhóm camera</span><label class="toggle-switch"><input type="checkbox"><span class="slider"></span></label></div>' +
      '    <div class="edit-room-toggle-item"><div class="toggle-label-wrap"><span class="toggle-label">Nhóm các thiết bị ngoại tuyến</span><span class="toggle-desc">Nhóm các thiết bị đã ngoại tuyến trong 30 ngày trở lên</span></div><label class="toggle-switch"><input type="checkbox"><span class="slider"></span></label></div>' +
      '  </div>' +
      '</div>';
    main.innerHTML = html;
  }

  // ========== Router ==========
  function route() {
    var hash  = (location.hash || '#/').slice(1);
    var parts = hash.split('/').filter(Boolean);
    var page  = parts[0] || 'home';
    var id    = parts[1];

    if (page === 'home' && !id)   return renderHome();
    if (page === 'shared')        return renderShared();
    if (page === 'device') {
      var sub = parts[2];
      var sub2 = parts[3];
      var sub3 = parts[4];
      if (sub === 'timer') {
        if (sub2 === 'add') return sub3 === 'action' ? renderDeviceTimerAction(id) : renderDeviceTimerAdd(id);
        return renderDeviceTimer(id);
      }
      if (sub === 'automation') return renderAutomation();
      return renderDevice(id);
    }
    if (page === 'automation')    return id === 'log' ? renderAutomationLog() : id === 'scan' ? renderScan() : id === 'setup' ? renderAutomationSetup() : renderAutomation();
    if (page === 'profile')       return renderProfile();
    if (page === 'store')         return renderStore();
    if (page === 'edit-room')     return id ? renderSubPage(id === 'name' ? 'Tên phòng' : id === 'bg' ? 'Hình nền' : 'Điều khiển thủ công', '#/edit-room') : renderEditRoom();
    if (page === 'nav-settings')  return id === 'edit' ? renderSubPage('Chỉnh sửa điều hướng', '#/nav-settings') : id === 'add' ? renderSubPage('Thêm mục', '#/nav-settings') : renderNavSettings();
    if (page === 'add-device')    return renderAddDevice();
    if (page === 'create-manual') return renderCreateManualControl();
    if (page === 'my-devices')    return renderMyDevices();
    if (page === 'account')       return renderAccount();
    if (page === 'voice')         return renderVoice();
    if (page === 'devices')       return id === 'utilities' ? renderSubPage('Tiện ích', '#/devices') : renderDevices();
    if (page === 'hub')           return renderHub();
    if (page === 'settings')      return renderSettings();
    if (page === 'notifications') return renderNotifications();
    if (page === 'notification-settings') return renderNotificationSettings();
    if (page === 'help')          return renderHelp();
    renderHome();
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('load', route);

  // ========== Status bar global handlers ==========
  (function setupStatusBar() {
    var btnNotif        = document.getElementById('btn-notification');
    var panel           = document.getElementById('notification-panel');
    var overlay         = document.getElementById('notification-overlay');
    var btnAdd          = document.getElementById('btn-add');
    var globalAddMenu   = document.getElementById('global-add-menu');
    var globalAddOverlay = document.getElementById('global-add-overlay');

    function openNotification() {
      window.JSBridge && window.JSBridge.send('notification/open', {}, noop);
      location.hash = '#/notifications';
    }
    function closeNotification() {
      if (panel)   { panel.setAttribute('aria-hidden', 'true');   panel.classList.remove('open'); }
      if (overlay) { overlay.setAttribute('aria-hidden', 'true'); overlay.classList.remove('open'); }
    }
    if (btnNotif) btnNotif.addEventListener('click', openNotification);
    if (overlay)  overlay.addEventListener('click', closeNotification);

    window.openGlobalAddMenu = function () {
      if (globalAddMenu)    { globalAddMenu.setAttribute('aria-hidden', 'false');    globalAddMenu.classList.add('open'); }
      if (globalAddOverlay) { globalAddOverlay.setAttribute('aria-hidden', 'false'); globalAddOverlay.classList.add('open'); }
    };
    window.closeGlobalAddMenu = function () {
      if (globalAddMenu)    { globalAddMenu.setAttribute('aria-hidden', 'true');    globalAddMenu.classList.remove('open'); }
      if (globalAddOverlay) { globalAddOverlay.setAttribute('aria-hidden', 'true'); globalAddOverlay.classList.remove('open'); }
    };
    if (btnAdd)          btnAdd.addEventListener('click', window.openGlobalAddMenu);
    if (globalAddOverlay) globalAddOverlay.addEventListener('click', window.closeGlobalAddMenu);
    if (globalAddMenu) {
      globalAddMenu.querySelectorAll('.add-menu-item').forEach(function (el) {
        el.addEventListener('click', window.closeGlobalAddMenu);
      });
    }
  })();

})();
