/**
 * iconify-loader.js
 * Load iconify-icon từ CDN; nếu CDN fail (offline / mini-app sandbox / corporate proxy)
 * thì tự động load bản đã cache local tại /vendor/iconify-icon.min.js.
 *
 * Server Express sẽ tự download file này về /frontend/vendor/ khi khởi động.
 * Xem thêm: backend/server.js → hàm downloadVendorFiles()
 */
(function () {
  var CDN_URL   = 'https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js';
  var LOCAL_URL = '/vendor/iconify-icon.min.js';

  function loadScript(src, onError) {
    var s   = document.createElement('script');
    s.src   = src;
    s.async = false; // giữ thứ tự thực thi
    if (typeof onError === 'function') s.onerror = onError;
    document.head.appendChild(s);
    return s;
  }

  // Thử CDN trước; nếu lỗi load local
  loadScript(CDN_URL, function () {
    console.warn('[iconify-loader] CDN unreachable, loading local vendor copy');
    loadScript(LOCAL_URL);
  });
})();
