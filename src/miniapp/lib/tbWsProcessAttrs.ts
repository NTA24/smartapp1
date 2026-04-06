/**
 * Logic tương đương demo HTML ThingsBoard / `index-ws-tb-full-command-jwt-org.html`:
 * sau `JSON.parse`, lấy lớp `data` (và `data.data` nếu có), duyệt từng key → giá trị thường là `[[ts, value], …]` hoặc `[ts, value]`.
 */

/** Bỏ qua key meta khi duyệt object giống `processAttrs` trong demo. */
const PROCESS_ATTRS_SKIP_KEYS = new Set([
  "data",
  "latestValues",
  "entityId",
  "deviceId",
  "errorCode",
  "errorMsg",
  "subscriptionId",
  "cmdId",
  "cmdUpdateType",
  "type",
  "unsubscribe",
]);

/**
 * Gộp các lớp payload TB: `root.data`, `root.data.data`.
 * **Không** gộp `latestValues` — TB dùng map đó cho **timestamp** mới nhất từng key (`state-sw3` → `1775…`),
 * gộp nhầm sẽ ghi đè `data.state-sw3` = `[[ts,"on"]]` và làm hỏng parse on/off.
 */
export function layersForProcessAttrs(msg: Record<string, unknown>): unknown[] {
  const layers: unknown[] = [];
  const d = msg.data;
  if (d !== undefined) layers.push(d);
  if (d && typeof d === "object" && d !== null && !Array.isArray(d) && "data" in d) {
    layers.push((d as { data: unknown }).data);
  }
  return layers;
}

/**
 * Với mỗi object trong `layers`, gán từng key (trừ meta) vào `acc` — key sau ghi đè key trước.
 */
export function mergeLayersIntoFlatAttrMap(
  layers: unknown[],
  acc: Record<string, unknown>,
): void {
  for (const layer of layers) {
    if (!layer || typeof layer !== "object" || Array.isArray(layer)) continue;
    for (const [k, v] of Object.entries(layer as Record<string, unknown>)) {
      if (PROCESS_ATTRS_SKIP_KEYS.has(k)) continue;
      acc[k] = v;
    }
  }
}
