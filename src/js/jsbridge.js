/**
 * JSBridge - Cầu nối H5 ↔ Native App (WebView)
 *
 * Chuẩn flow:
 *   H5            → JSBridge.send(method, params, callback)
 *   JSBridge      → NativeBridge.call(payloadJson)        [Android]
 *                 → webkit.messageHandlers.JSBridge        [iOS]
 *                 → POST /api/bridge                       [Browser fallback]
 *   Native xử lý
 *   Native        → window.JSBridge.receive(cbId, result)
 *   JSBridge      → gọi callback(result) đã đăng ký
 *
 * API public:
 *   JSBridge.send(method, params, callback)   — H5 gọi Native
 *   JSBridge.receive(callbackId, resultJson)  — Native gọi lại H5
 *
 * Backward-compat aliases (giữ để không break code cũ):
 *   JSBridge.invoke        → JSBridge.send
 *   JSBridge.invokeCallback → JSBridge.receive
 */
(function (global) {
  'use strict';

  var _cbSeq = 0;
  var _callbacks = {};
  var CB_TIMEOUT  = 15000; // ms — tự hủy callback nếu Native không trả lời
  var XHR_TIMEOUT = 10000; // ms — timeout cho HTTP fallback

  /* ── internal: đăng ký callback với auto-expire ── */
  function _register(id, fn) {
    _callbacks[id] = fn;
    setTimeout(function () {
      if (_callbacks[id]) {
        _callbacks[id]({ success: false, error: 'timeout' });
        delete _callbacks[id];
      }
    }, CB_TIMEOUT);
  }

  /* ── internal: HTTP fallback khi không có WebView Native ── */
  function _httpFallback(method, params, done) {
    var url = (global.APP_API_BASE_URL || '') + '/api/bridge';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = XHR_TIMEOUT;

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      var res = { success: false };
      try {
        var data = JSON.parse(xhr.responseText || '{}');
        res = (data.success !== undefined) ? data : { success: true, data: data };
      } catch (e) {
        res.error = xhr.responseText || 'Network error';
      }
      done(res);
    };
    xhr.onerror   = function () { done({ success: false, error: 'Network error' }); };
    xhr.ontimeout = function () { done({ success: false, error: 'Request timeout' }); };
    xhr.send(JSON.stringify({ method: method, params: params }));
  }

  /**
   * send(method, params, callback)
   * ─────────────────────────────
   * H5 gọi Native. Tự chọn kênh theo môi trường:
   *   1. NativeBridge.call()          — Android (JavascriptInterface)
   *   2. android.invoke()             — Android legacy
   *   3. webkit.messageHandlers       — iOS WKWebView
   *   4. POST /api/bridge             — Browser / dev fallback
   */
  function send(method, params, callback) {
    var id      = 'cb_' + (++_cbSeq);
    var payload = { method: method, params: params || {}, callbackId: id };

    if (typeof callback === 'function') _register(id, callback);

    /* 1. Android — NativeBridge inject qua addJavascriptInterface */
    if (global.NativeBridge && typeof global.NativeBridge.call === 'function') {
      try {
        global.NativeBridge.call(JSON.stringify(payload));
      } catch (e) {
        console.warn('[JSBridge] NativeBridge.call error:', e);
        _settle(id, { success: false, error: 'NativeBridge error' });
      }
      return;
    }

    /* 2. Android legacy */
    if (global.android && typeof global.android.invoke === 'function') {
      try {
        var r = global.android.invoke(JSON.stringify(payload));
        if (r) _settle(id, typeof r === 'string' ? JSON.parse(r) : r);
      } catch (e) {
        _settle(id, { success: false, error: String(e) });
      }
      return;
    }

    /* 3. iOS WKWebView */
    if (global.webkit &&
        global.webkit.messageHandlers &&
        global.webkit.messageHandlers.JSBridge) {
      try {
        global.webkit.messageHandlers.JSBridge.postMessage(payload);
      } catch (e) {
        console.warn('[JSBridge] webkit postMessage error:', e);
        _settle(id, { success: false, error: 'webkit bridge error' });
      }
      return;
    }

    /* 4. HTTP fallback */
    setTimeout(function () {
      _httpFallback(method, params, function (res) { _settle(id, res); });
    }, 0);
  }

  /* ── internal: settle một callback (gọi fn rồi xóa) ── */
  function _settle(id, result) {
    if (!_callbacks[id]) return;
    _callbacks[id](result);
    delete _callbacks[id];
  }

  /**
   * receive(callbackId, resultJson)
   * ───────────────────────────────
   * Native gọi vào H5 sau khi xử lý xong:
   *
   *   Android (Kotlin):
   *     webView.evaluateJavascript(
   *       "window.JSBridge.receive('cb_1', " + JSONObject.quote(result.toString()) + ");",
   *       null
   *     )
   *
   *   iOS (Swift):
   *     webView.evaluateJavaScript(
   *       "window.JSBridge.receive('\(callbackId)', \(resultJson));"
   *     )
   */
  function receive(callbackId, resultJson) {
    var cb = _callbacks[callbackId];
    if (!cb) return; // timeout đã dọn trước hoặc id không hợp lệ
    try {
      cb(typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson);
    } catch (e) {
      cb({ success: false, error: 'JSBridge.receive parse error: ' + e.message });
    }
    delete _callbacks[callbackId];
  }

  /* ── export ── */
  var JSBridge = {
    send    : send,
    receive : receive,
    // backward-compat aliases — không xóa để không break code cũ
    invoke         : send,
    invokeCallback : receive,
    // internal — dùng trong unit test / debug
    _fallback : _httpFallback
  };

  global.JSBridge = JSBridge;
  if (global.window) global.window.JSBridge = JSBridge;

})(typeof window !== 'undefined' ? window : this);
