/**
 * Cấu hình ThingsBoard (REST API).
 * - THINGSBOARD_API_KEY: API Key (X-Authorization: ApiKey <key>), dùng cho POST .../DEVICE/{id}/SHARED_SCOPE.
 * - THINGSBOARD_DEVICE_ID: UUID của device (ThingsBoard → Device → id), dùng trong URL telemetry/attributes.
 */
window.THINGSBOARD_TOKEN = 'tb_D77pvSxqVNDwV-OpNoULfhBb318X-u-EnazZd2XcO-l6YkPRo77LIHsJ3pXzCYVuFr8sc-2JzOxisUByuK01dw';
window.THINGSBOARD_DEVICE_ID = window.THINGSBOARD_DEVICE_ID || '5dda6760-1c28-11f1-ae4a-7d6b236a15c2';
