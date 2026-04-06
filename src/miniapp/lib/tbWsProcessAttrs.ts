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

export function layersForProcessAttrs(msg: Record<string, unknown>): unknown[] {
  const layers: unknown[] = [];
  const d = msg.data;
  if (d !== undefined) layers.push(d);
  if (d && typeof d === "object" && d !== null && !Array.isArray(d) && "data" in d) {
    layers.push((d as { data: unknown }).data);
  }
  return layers;
}

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
