/**
 * WindVane File - Đọc dữ liệu file theo path (Mini App)
 * WindVane.call('WVFile', 'getDataByFilePath', ...)
 */

(function (global) {
  'use strict';

  /**
   * Lấy dữ liệu file dạng base64 theo path.
   * @param {{ path: string }} params
   * @returns {Promise<{ base64Data: string }>}
   */
  function getDataByFilePath(params) {
    return new Promise(function (resolve, reject) {
      if (!global.WindVane || typeof global.WindVane.call !== 'function') {
        reject(new Error('WindVane is not available. Please run in Mini App environment.'));
        return;
      }

      if (!params || typeof params.path !== 'string') {
        reject(new Error('params.path is required'));
        return;
      }

      global.WindVane.call(
        'WVFile',
        'getDataByFilePath',
        params,
        function (result) {
          if (result && result.base64Data != null) {
            resolve(result);
          } else {
            reject(new Error('No base64Data in result'));
          }
        },
        function (error) {
          var msg = (error && (error.msg || error.message)) || (typeof error === 'string' ? error : JSON.stringify(error));
          reject(new Error(msg || 'Failed to get file data'));
        }
      );
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getDataByFilePath: getDataByFilePath };
  } else {
    global.getDataByFilePath = getDataByFilePath;
  }
})(typeof window !== 'undefined' ? window : this);
