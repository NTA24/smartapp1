/** Dùng chung trang lab WebSocket (human_sensor, state-plug, …). */

export function mergeWsDataLayers(msg: Record<string, unknown>): Record<string, unknown> {
  const acc: Record<string, unknown> = {};
  const push = (o: unknown) => {
    if (o && typeof o === "object" && !Array.isArray(o)) Object.assign(acc, o as Record<string, unknown>);
  };
  push(msg.data);
  const d = msg.data;
  if (d && typeof d === "object" && d !== null) push((d as { data?: unknown }).data);

  const ascRaw = (msg as { attrSubCmds?: unknown }).attrSubCmds;
  if (Array.isArray(ascRaw)) {
    for (const part of ascRaw) {
      if (part && typeof part === "object" && part !== null) {
        const p = part as Record<string, unknown>;
        if ("data" in p && p.data !== undefined) push(p.data);
        else push(part);
      }
    }
  } else if (ascRaw && typeof ascRaw === "object" && ascRaw !== null) {
    const o = ascRaw as Record<string, unknown>;
    if ("data" in o) push(o.data);
  }

  /** TB `latestValues`: key → timestamp — không merge (ghi đè sai giá trị thật trong `data`). */
  return acc;
}

export function latestScalar(raw: unknown): unknown {
  if (raw === undefined || raw === null) return undefined;
  if (Array.isArray(raw) && raw.length > 0) {
    const rows = raw
      .filter((x) => Array.isArray(x) && x.length >= 2)
      .map((x) => [Number((x as unknown[])[0]), (x as unknown[])[1]] as [number, unknown]);
    if (rows.length === 0) return undefined;
    rows.sort((a, b) => b[0] - a[0]);
    let v = rows[0][1];
    if (Array.isArray(v) && v.length === 1) v = v[0];
    if (v && typeof v === "object" && !Array.isArray(v) && "value" in (v as object)) {
      return (v as { value: unknown }).value;
    }
    return v;
  }
  return raw;
}
