/**
 * WindVane Auth - Lấy auth code trong môi trường Mini App (Alibaba/1688)
 * Sử dụng WindVane.call('wv', 'getAuthCode', ...)
 */

(function (global) {
  'use strict';

  /**
   * @typedef {{ authCode: string, [key: string]: any }} AuthCodeResponse
   */

  /**
   * Lấy auth code từ Mini App (WindVane).
   * @param {string} appId
   * @param {string[]} [scopes=['auth_user']]
   * @returns {Promise<AuthCodeResponse>}
   */
  function getAuthCode(appId, scopes) {
    scopes = scopes && scopes.length ? scopes : ['auth_user'];

    return new Promise(function (resolve, reject) {
      if (!global.WindVane || typeof global.WindVane.call !== 'function') {
        reject(new Error('WindVane is not available. Please run in Mini App environment.'));
        return;
      }

      var params = { appId: appId, scopes: scopes };

      global.WindVane.call(
        'wv',
        'getAuthCode',
        params,
        function (result) {
          if (result && result.authCode) {
            resolve(result);
          } else {
            reject(new Error('No auth code returned'));
          }
        },
        function (error) {
          var message = (error && (error.message || error.msg)) || (typeof error === 'string' ? error : JSON.stringify(error));
          reject(new Error(message || 'Failed to get auth code'));
        }
      );
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getAuthCode: getAuthCode };
  } else {
    global.getAuthCode = getAuthCode;
  }
})(typeof window !== 'undefined' ? window : this);
