/**
 * Module quyền thiết bị (wv.getSetting / wv.authorize).
 * Gom getSetting + authorize, state permissionStatus tương đương useState<AuthSetting>({}).
 *
 * @typedef {Object} AuthSetting
 * @property {boolean} [location]
 * @property {boolean} [camera]
 * @property {boolean} [bluetooth]
 * @property {boolean} [album]
 * @property {boolean} [contacts]
 * @property {boolean} [microphone]
 * @property {boolean} [file]
 * @property {boolean} [call]
 * @property {boolean} [vibrate]
 * @property {boolean} [screen]
 *
 * @typedef {Object} GetSettingResult
 * @property {AuthSetting} authSetting
 *
 * @typedef {Object} AuthorizeResult
 * @property {Record<string, boolean>} successScope
 * @property {string} msg
 */

(function () {
  'use strict';

  /** @type {('location'|'camera'|'bluetooth'|'album'|'contacts'|'microphone'|'file'|'call'|'vibrate'|'screen')[]} */
  var PERMISSION_SCOPES = ['location', 'camera', 'bluetooth', 'album', 'contacts', 'microphone', 'file', 'call', 'vibrate', 'screen'];

  /** @type {AuthSetting} State tương đương useState<AuthSetting>({}) */
  var permissionStatus = {};

  /**
   * @param {AuthSetting} authSetting
   */
  function setPermissionStatus(authSetting) {
    if (authSetting && typeof authSetting === 'object') {
      permissionStatus = authSetting;
      if (typeof window !== 'undefined') window.MINIAPP_PERMISSION_STATUS = permissionStatus;
    }
  }

  /**
   * @returns {AuthSetting}
   */
  function getPermissionStatus() {
    return permissionStatus;
  }

  /**
   * getSetting — trạng thái quyền thiết bị (wv.getSetting).
   * @returns {Promise<GetSettingResult>}
   */
  function getSetting() {
    return new Promise(function (resolve, reject) {
      if (!window.WindVane) {
        reject(new Error('WindVane is not available. Please run in Mini App environment.'));
        return;
      }
      window.WindVane.call(
        'wv',
        'getSetting',
        {},
        function (result) {
          resolve({ authSetting: (result && result.authSetting) ? result.authSetting : {} });
        },
        function (error) {
          var msg = (error && typeof error === 'object') ? JSON.stringify(error) : String(error);
          reject(new Error(msg || 'Failed to get settings'));
        }
      );
    });
  }

  /**
   * Kiểm tra đã có quyền scope chưa.
   * @param {string} scope
   * @returns {Promise<boolean>}
   */
  function hasPermission(scope) {
    return getSetting()
      .then(function (settings) {
        return Boolean(settings.authSetting && settings.authSetting[scope]);
      })
      .catch(function (err) {
        console.warn('Unable to fetch permission settings:', err);
        return false;
      });
  }

  /**
   * @param {string} scope
   * @param {string} [msg]
   * @returns {AuthorizeResult}
   */
  function buildSuccessResult(scope, msg) {
    msg = msg || 'Permission granted';
    var o = {};
    o[scope] = true;
    return { successScope: o, msg: msg };
  }

  /**
   * authorize(scope) — xin quyền thiết bị (wv.authorize). Nếu đã có quyền thì trả về luôn.
   * @param {string} scope
   * @returns {Promise<AuthorizeResult>}
   */
  function authorize(scope) {
    if (!window.WindVane) {
      return Promise.reject(new Error('WindVane is not available. Please run in Mini App environment.'));
    }
    return hasPermission(scope).then(function (granted) {
      if (granted) {
        return buildSuccessResult(scope, 'Permission already granted');
      }
      return new Promise(function (resolve, reject) {
        window.WindVane.call(
          'wv',
          'authorize',
          { scope: scope },
          function (result) {
            resolve(result || buildSuccessResult(scope));
          },
          function (error) {
            hasPermission(scope).then(function (grantedAfter) {
              if (grantedAfter) {
                resolve(buildSuccessResult(scope, 'Permission already granted'));
              } else {
                var msg = (error && typeof error === 'object') ? JSON.stringify(error) : String(error);
                reject(new Error(msg || 'Failed to authorize'));
              }
            });
          }
        );
      });
    });
  }

  if (typeof window !== 'undefined') {
    window.MiniAppPermissions = {
      getSetting: getSetting,
      authorize: authorize,
      hasPermission: hasPermission,
      setPermissionStatus: setPermissionStatus,
      getPermissionStatus: getPermissionStatus,
      PERMISSION_SCOPES: PERMISSION_SCOPES
    };
  }
})();
