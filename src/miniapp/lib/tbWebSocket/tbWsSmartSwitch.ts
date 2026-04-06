const SWITCH_KEYS = ["state-sw1", "state-sw2", "state-sw3", "state-sw4"] as const;
const COMMAND_KEYS = ["cmd-sw1", "cmd-sw2", "cmd-sw3", "cmd-sw4"] as const;
const TRACKED_ATTR_KEYS = new Set<string>([...SWITCH_KEYS, ...COMMAND_KEYS]);

export { SWITCH_KEYS, COMMAND_KEYS };

export const SWITCH_KEY_TO_IDX: Record<string, 0 | 1 | 2 | 3> = {
  "state-sw1": 0, "state-sw2": 1, "state-sw3": 2, "state-sw4": 3,
  "cmd-sw1": 0, "cmd-sw2": 1, "cmd-sw3": 2, "cmd-sw4": 3,
};

export function parseSwitchBool(value: unknown): boolean {
  const n = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "t", "on", "yes"].includes(n);
}

export function processAttrs(
  attrs: unknown,
  sink: (key: string, value: unknown) => void,
): void {
  if (!attrs || typeof attrs !== "object" || attrs === null) return;
  for (const [k, v] of Object.entries(attrs as Record<string, unknown>)) {
    if (!TRACKED_ATTR_KEYS.has(k)) continue;
    let value: unknown = v;
    if (Array.isArray(v) && v.length > 0) {
      const firstEntry = v[0];
      if (Array.isArray(firstEntry) && firstEntry.length >= 2) {
        value = firstEntry[1];
      }
    }
    if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
      value = (value as { value: unknown }).value;
    }
    sink(k, value);
  }
}
