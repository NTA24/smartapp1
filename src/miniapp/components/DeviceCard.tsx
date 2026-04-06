import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDevicePower } from "../hooks/useDevicePower";
import type { DeviceCardKind } from "../lib/deviceCardKind";
import type { SmartSwitchChannel } from "../services/deviceSync";
import { useGatewayPlugStateWithFallback } from "../hooks/useGatewayPlugHttpFallback";
import { useSmartSwitchStatesWs } from "../lib/tbWebSocket";

const POWER_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12L12 4A8 8 0 1 1 11.98 4" />
  </svg>
);

interface DeviceCardProps {
  deviceId: string;
  name: string;
  meta: string;
  statusLabel: string;
  icon: React.ReactNode;
  defaultOn?: boolean;
  deviceKind?: DeviceCardKind;
  onRemotePowerChange?: (nextOn: boolean) => Promise<void>;
  onRemoteSwitchChannelChange?: (channel: SmartSwitchChannel, nextOn: boolean) => Promise<void>;
  initialRemotePowerSource?: "gateway-plug";
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  deviceId,
  name,
  meta,
  statusLabel: _statusLabel,
  icon,
  defaultOn = false,
  deviceKind,
  onRemotePowerChange,
  onRemoteSwitchChannelChange,
  initialRemotePowerSource,
}) => {
  const { on: localOn, setPower } = useDevicePower(deviceId, defaultOn);
  const navigate = useNavigate();
  const [powerBusy, setPowerBusy] = useState(false);
  const [channelBusy, setChannelBusy] = useState<SmartSwitchChannel | null>(null);

  const isTbDeviceUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceId.trim());
  const quadSwitch = deviceKind === "switch" && isTbDeviceUuid;
  const canPostSwitchChannels = Boolean(onRemoteSwitchChannelChange);
  const kindClass = deviceKind ? `device-card--kind-${deviceKind}` : "";

  /* ── WS realtime — giống demo HTML: mọi push (state-sw* / cmd-sw*) → 1 tuple ── */
  const swWs = useSmartSwitchStatesWs(quadSwitch ? deviceId : null);

  /**
   * Optimistic overlay: khi user bấm trên app, hiện ngay trạng thái mới
   * trước khi WS push back. WS push back → xoá optimistic (wsRev đổi).
   * Giống demo HTML: `updateAttributeState(key, nextChecked)` ngay sau POST.
   */
  const [optimistic, setOptimistic] = useState<Record<number, boolean>>({});
  useEffect(() => {
    setOptimistic({});
  }, [swWs.wsRev]);

  const wsSlots = [swWs.sw1, swWs.sw2, swWs.sw3, swWs.sw4] as const;
  const effectiveChs: [boolean, boolean, boolean, boolean] = [
    optimistic[0] ?? wsSlots[0] ?? false,
    optimistic[1] ?? wsSlots[1] ?? false,
    optimistic[2] ?? wsSlots[2] ?? false,
    optimistic[3] ?? wsSlots[3] ?? false,
  ];

  /**
   * Giống demo HTML `saveCommandAttribute(key, checked)`:
   * 1. Optimistic UI ngay (setOptimistic)
   * 2. POST SHARED_SCOPE `{ "cmd-sw*": "on"|"off" }`
   * 3. TB push WS → wsRev đổi → optimistic bị xoá → hiện giá trị WS thật
   */
  const onChannelToggle = useCallback(
    (channel: SmartSwitchChannel) => {
      if (!onRemoteSwitchChannelChange) return;
      const idx = channel - 1;
      const nextOn = !effectiveChs[idx];
      setOptimistic((prev) => ({ ...prev, [idx]: nextOn }));
      setChannelBusy(channel);
      void onRemoteSwitchChannelChange(channel, nextOn)
        .catch(() => {
          setOptimistic((prev) => {
            const next = { ...prev };
            delete next[idx];
            return next;
          });
        })
        .finally(() => setChannelBusy(null));
    },
    [effectiveChs, onRemoteSwitchChannelChange],
  );

  const onCount = effectiveChs.filter(Boolean).length;

  /* ── Gateway plug (đèn hành lang) — giữ nguyên ── */
  const { live: gatewayPlugLive } = useGatewayPlugStateWithFallback(
    !quadSwitch && initialRemotePowerSource === "gateway-plug" ? deviceId : null,
  );
  const [gatewayPlugTapOptimistic, setGatewayPlugTapOptimistic] = useState<boolean | null>(null);
  const isHallwayGateway = !quadSwitch && initialRemotePowerSource === "gateway-plug";

  useEffect(() => {
    if (gatewayPlugTapOptimistic === null) return;
    if (gatewayPlugLive === gatewayPlugTapOptimistic) setGatewayPlugTapOptimistic(null);
  }, [gatewayPlugLive, gatewayPlugTapOptimistic]);

  useEffect(() => {
    if (gatewayPlugTapOptimistic === null) return;
    const t = window.setTimeout(() => setGatewayPlugTapOptimistic(null), 5000);
    return () => window.clearTimeout(t);
  }, [gatewayPlugTapOptimistic]);

  const on: boolean | undefined = isHallwayGateway
    ? gatewayPlugTapOptimistic !== null
      ? gatewayPlugTapOptimistic
      : gatewayPlugLive
    : gatewayPlugLive !== undefined
      ? gatewayPlugLive
      : localOn;

  return (
    <div
      className={`device-card ${quadSwitch ? "device-card--quad-switch" : ""} ${kindClass}`.trim()}
      data-device-id={deviceId}
      data-device-kind={deviceKind ?? undefined}
      onClick={(e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (target.closest(".power-btn") || target.closest(".device-card__sw-grid")) return;
        navigate(`/device/${deviceId}`);
      }}
    >
      <div className="card-header">
        <div className="device-icon-wrap">
          {icon}
        </div>
        {quadSwitch ? (
          <div
            className="device-card__sw-grid"
            role="group"
            aria-label="Bốn kênh công tắc"
          >
            {([1, 2, 3, 4] as const).map((ch) => {
              const onCh = effectiveChs[ch - 1];
              const busy = channelBusy === ch;
              return (
                <button
                  key={ch}
                  type="button"
                  className={`power-btn power-btn--channel ${onCh ? "on" : ""}`}
                  aria-label={onCh ? `Tắt kênh ${ch}` : `Bật kênh ${ch}`}
                  aria-busy={busy}
                  disabled={busy || !canPostSwitchChannels}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChannelToggle(ch);
                  }}
                >
                  <span className="power-symbol">{POWER_SVG}</span>
                  <span className="power-btn__ch-label">{ch}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            className={`power-btn ${on ? "on" : ""} ${isHallwayGateway && on === undefined && !powerBusy ? "power-btn--ws-pending" : ""}`.trim()}
            data-state-plug={isHallwayGateway ? (on === undefined ? "pending" : on ? "on" : "off") : undefined}
            aria-label={
              isHallwayGateway && on === undefined
                ? "Chưa nhận trạng thái WS — bấm để bật hoặc đợi kết nối"
                : on
                  ? "Tắt"
                  : "Bật"
            }
            aria-busy={powerBusy}
            disabled={powerBusy}
            onClick={(e) => {
              e.stopPropagation();
              const next = !(on ?? false);
              if (onRemotePowerChange) {
                if (isHallwayGateway) setGatewayPlugTapOptimistic(next);
                setPowerBusy(true);
                void onRemotePowerChange(next)
                  .then(() => {
                    if (!isHallwayGateway) setPower(next);
                  })
                  .catch(() => {
                    if (isHallwayGateway) setGatewayPlugTapOptimistic(null);
                  })
                  .finally(() => setPowerBusy(false));
              } else {
                setPower(next);
              }
            }}
          >
            <span className="power-symbol">{POWER_SVG}</span>
          </button>
        )}
      </div>
      <div className="device-name">{name}</div>
      <div className="device-meta">
        <span>{meta}</span>
        <span>
          {quadSwitch
            ? `${onCount}/4 bật`
            : isHallwayGateway && on === undefined
              ? "Đang tải…"
              : on
                ? "Bật"
                : "Tắt"}
        </span>
      </div>
    </div>
  );
};
