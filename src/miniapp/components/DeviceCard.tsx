import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDevicePower } from "../hooks/useDevicePower";
import { Store } from "../lib/store";
import type { DeviceCardKind } from "../lib/deviceCardKind";
import type { SmartSwitchChannel } from "../services/deviceSync";
import { useGatewayPlugStateWithFallback } from "../hooks/useGatewayPlugHttpFallback";
import { useSmartSwitchStatesWs } from "../lib/tbWebSocket";

const POWER_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12L12 4A8 8 0 1 1 11.98 4" />
  </svg>
);

const SW_STORE = "deviceSwitchCh:";

function readSwitchChannels(deviceId: string): [boolean, boolean, boolean, boolean] {
  const read = (i: number) => Store.get(`${SW_STORE}${deviceId}:${i}`, "") === "on";
  return [read(1), read(2), read(3), read(4)];
}

function writeSwitchChannel(deviceId: string, channel: SmartSwitchChannel, on: boolean): void {
  Store.set(`${SW_STORE}${deviceId}:${channel}`, on ? "on" : "off");
}

interface DeviceCardProps {
  deviceId: string;
  name: string;
  meta: string;
  statusLabel: string;
  icon: React.ReactNode;
  defaultOn?: boolean;
  deviceKind?: DeviceCardKind;
  /** Ổ cắm / đèn hành lang: nút on/off — HTTP POST `cmd-socket` (xem `deviceControlHttp`); WS chỉ đọc `state-plug`. */
  onRemotePowerChange?: (nextOn: boolean) => Promise<void>;
  /** Smart Switch 4 kênh — POST SHARED_SCOPE `cmd-sw1`…`cmd-sw4` on/off; đọc WS `state-sw*`. */
  onRemoteSwitchChannelChange?: (channel: SmartSwitchChannel, nextOn: boolean) => Promise<void>;
  /** Đồng bộ trạng thái nút khi mở thẻ (GET attribute). */
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
  /** Trạng thái kênh cục bộ — nguồn ban đầu từ localStorage/HTTP; cập nhật lạc quan khi user click. */
  const [channelsOn, setChannelsOn] = useState<[boolean, boolean, boolean, boolean]>(() =>
    readSwitchChannels(deviceId),
  );

  const quadSwitch = Boolean(onRemoteSwitchChannelChange);
  const kindClass = deviceKind ? `device-card--kind-${deviceKind}` : "";

  /**
   * WS realtime cho Smart Switch — mỗi kênh subscribe riêng.
   * Giá trị WS luôn override local state để phản ánh trạng thái thực của thiết bị.
   */
  const swWs = useSmartSwitchStatesWs(quadSwitch ? deviceId : null);

  /**
   * Effective channels: WS override per-channel, fallback về local khi WS chưa có.
   * Derive trực tiếp — không dùng useEffect để tránh race condition và delay render.
   */
  const effectiveChs: [boolean, boolean, boolean, boolean] = [
    swWs.sw1 !== undefined ? swWs.sw1 : channelsOn[0],
    swWs.sw2 !== undefined ? swWs.sw2 : channelsOn[1],
    swWs.sw3 !== undefined ? swWs.sw3 : channelsOn[2],
    swWs.sw4 !== undefined ? swWs.sw4 : channelsOn[3],
  ];

  /**
   * Gateway plug: WS trực tiếp override giá trị hiển thị.
   * Không dùng useEffect để tránh race condition HTTP/WS.
   */
  const { live: gatewayPlugLive } = useGatewayPlugStateWithFallback(
    !quadSwitch && initialRemotePowerSource === "gateway-plug" ? deviceId : null,
  );

  /**
   * Đèn hành lang: lạc quan ngay khi bấm (nút đổi tức thì); WS/HTTP là nguồn đúng sau đó.
   */
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

  const onChannelToggle = useCallback(
    (channel: SmartSwitchChannel) => {
      if (!onRemoteSwitchChannelChange) return;
      const idx = channel - 1;
      const nextOn = !effectiveChs[idx];
      setChannelBusy(channel);
      void onRemoteSwitchChannelChange(channel, nextOn)
        .then(() => {
          setChannelsOn((prev) => {
            const next = [...prev] as [boolean, boolean, boolean, boolean];
            next[idx] = nextOn;
            return next;
          });
          writeSwitchChannel(deviceId, channel, nextOn);
        })
        .catch(() => {
          /* API lỗi — giữ UI cũ */
        })
        .finally(() => setChannelBusy(null));
    },
    [effectiveChs, deviceId, onRemoteSwitchChannelChange],
  );

  const onCount = effectiveChs.filter(Boolean).length;

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
          <div className="device-card__sw-grid" role="group" aria-label="Bốn kênh công tắc">
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
                  disabled={busy}
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
