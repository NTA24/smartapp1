import React, { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";

const MOCK_ROOMS = ["Tất cả", "Phòng khách", "Phòng ngủ", "Bếp", "Ban công"];

/** Dải chọn phòng (vuốt ngang) — demo lọc thiết bị theo phòng */
export const HomeRoomStrip: React.FC = () => {
  const rooms = useMemo(() => MOCK_ROOMS, []);

  return (
    <div className="home-room-strip" aria-label="Lọc theo phòng">
      <Swiper modules={[FreeMode]} slidesPerView="auto" spaceBetween={8} freeMode className="home-room-strip__swiper">
        {rooms.map((name) => (
          <SwiperSlide key={name} className="home-room-strip__slide">
            <button type="button" className="home-room-strip__chip">
              {name}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
