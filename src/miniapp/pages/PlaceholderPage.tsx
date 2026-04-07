import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LeftOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { STORE_DEAL_PRODUCTS, type StoreProductItem } from "../lib/storeCatalog";

interface PlaceholderPageProps {
  title: string;
  backTo: string;
  children?: React.ReactNode;
  isPlaceholder?: boolean;
}

export const IS_PLACEHOLDER_PAGE = true;

const STORE_PROMO_SLIDES = [
  { id: "1", line1: "Khuyến mãi thiết bị thông minh", line2: "Giảm đến 30% tuần này" },
  { id: "2", line1: "Miễn phí lắp đặt", line2: "Cho đơn từ 2 triệu" },
  { id: "3", line1: "Bảo hành 24 tháng", line2: "Đổi mới trong 30 ngày" },
];

function StoreProductCard({ item }: { item: StoreProductItem }) {
  return (
    <div className="store-product-card">
      <div className="store-product-card__surface">
        <div className="store-product-card__img-wrap">
          <img src={item.image} alt="" loading="lazy" decoding="async" />
        </div>
        <div className="store-product-card__body">
          <div className="store-product-card__title">{item.title}</div>
          {item.subtitle ? <div className="store-product-card__sub">{item.subtitle}</div> : null}
          <div className="store-product-card__price">{item.price}</div>
        </div>
      </div>
    </div>
  );
}

function StoreProductRow({ title, items }: { title: string; items: StoreProductItem[] }) {
  return (
    <section className="store-product-row" aria-label={title}>
      <h2 className="store-product-row__title">{title}</h2>
      <Swiper
        cssMode
        slidesPerView="auto"
        spaceBetween={12}
        className="store-product-row__swiper"
        watchOverflow
      >
        {items.map((item) => (
          <SwiperSlide key={item.id} className="store-product-row__slide">
            <StoreProductCard item={item} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, backTo, children, isPlaceholder = true }) => {
  const location = useLocation();
  const isStore = location.pathname.includes("/store");

  return (
    <motion.div
      className={`page-profile-sub page-profile-sub--motion${isStore ? " page-store" : ""}`}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="sub-page-header">
        <Link to={backTo} className="back btn-back">
          <span className="btn-back-arrow">
            <LeftOutlined />
          </span>
        </Link>
        <h1 className="sub-page-title">{title}</h1>
      </div>
      <div className="profile-sub-body">
        {isStore && (
          <>
            <div className="store-promo-swiper-wrap" aria-label="Khuyến mãi">
              <Swiper
                modules={[Autoplay, Pagination]}
                slidesPerView={1}
                spaceBetween={0}
                loop
                autoplay={{ delay: 4200, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                className="store-promo-swiper"
              >
                {STORE_PROMO_SLIDES.map((s) => (
                  <SwiperSlide key={s.id}>
                    <div className="store-promo-slide">
                      <div className="store-promo-slide__line1">{s.line1}</div>
                      <div className="store-promo-slide__line2">{s.line2}</div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="store-page-sections">
              <StoreProductRow title="Mua sắm giá ưu đãi" items={STORE_DEAL_PRODUCTS} />
            </div>
          </>
        )}
        {isPlaceholder && !isStore && (
          <p style={{ color: "#8b95a5", fontSize: 12, marginBottom: 8 }}>
            Placeholder page
          </p>
        )}
        {children ?? (!isStore ? <p style={{ color: "#666" }}>Nội dung trang {title}.</p> : null)}
      </div>
    </motion.div>
  );
};
