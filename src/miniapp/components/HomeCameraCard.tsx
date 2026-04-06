import React from "react";

export interface HomeCameraCardProps {
  label: string;
  thumb: string;
  thumbKey: string;
  hideImg: boolean;
  busy: boolean;
  onThumbError: (key: string) => void;
  onOpen: () => void;
  
  typeLabel?: string;
}

export const HomeCameraCard: React.FC<HomeCameraCardProps> = ({
  label,
  thumb,
  thumbKey,
  hideImg,
  busy,
  onThumbError,
  onOpen,
  typeLabel = "Camera",
}) => (
  <article
    className={`home-page__camera-card camera-feed-card${busy ? " camera-feed-card--sdk-loading-active" : ""}`}
    role="button"
    tabIndex={0}
    aria-busy={busy}
    onClick={() => onOpen()}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") onOpen();
    }}
    aria-label={`Mở camera (JSAPI): ${label}`}
  >
    <div className="camera-feed-card__preview">
      {hideImg ? (
        <div className="camera-feed-card__preview-fallback" aria-hidden />
      ) : (
        <img
          className="camera-feed-card__thumb"
          src={thumb}
          alt=""
          loading="lazy"
          onError={() => onThumbError(thumbKey)}
        />
      )}
      {busy && (
        <div className="camera-feed-card__loading-overlay" role="status">
          Đang mở…
        </div>
      )}
    </div>
    <div className="camera-feed-card__bar">
      <span className="camera-feed-card__id">
        {typeLabel ? <span className="camera-feed-card__type">{typeLabel}</span> : null}
        {label}
      </span>
      <span className="camera-feed-card__status">
        <span className="camera-feed-card__dot" />
        Trực tuyến
      </span>
    </div>
  </article>
);
