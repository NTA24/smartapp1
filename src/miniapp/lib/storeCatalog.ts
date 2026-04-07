/** Ảnh trong `public/store/` (hai mẫu camera người dùng cung cấp). */
export const STORE_IMAGES = {
  mini: "/store/camera-mini.png",
  ptz: "/store/camera-ptz.png",
} as const;

export type StoreProductItem = {
  id: string;
  title: string;
  subtitle?: string;
  price: string;
  image: string;
};

function dealClones(): StoreProductItem[] {
  const base: Omit<StoreProductItem, "id">[] = [
    {
      title: "Camera mini Smart Home",
      subtitle: "Góc siêu rộng · Hồng ngoại ban đêm",
      price: "1.290.000đ",
      image: STORE_IMAGES.mini,
    },
    {
      title: "Camera PTZ 360°",
      subtitle: "Xoay ngang dọc · Theo dõi chuyển động",
      price: "1.890.000đ",
      image: STORE_IMAGES.ptz,
    },
    {
      title: "Camera mini (bản Pro)",
      subtitle: "2K · Âm thanh hai chiều",
      price: "1.590.000đ",
      image: STORE_IMAGES.mini,
    },
    {
      title: "Camera PTZ + Cloud 30 ngày",
      subtitle: "Combo thiết bị + lưu trữ",
      price: "2.190.000đ",
      image: STORE_IMAGES.ptz,
    },
    {
      title: "Camera mini Twin Pack",
      subtitle: "Mua 2 giảm thêm 12%",
      price: "2.399.000đ",
      image: STORE_IMAGES.mini,
    },
    {
      title: "Camera an ninh PTZ Outdoor",
      subtitle: "Chống nước IP65",
      price: "2.490.000đ",
      image: STORE_IMAGES.ptz,
    },
    {
      title: "Camera mini Lite",
      subtitle: "Đồng bộ 1 chạm · Gọn nhẹ",
      price: "1.190.000đ",
      image: STORE_IMAGES.mini,
    },
    {
      title: "Kit PTZ + Cảm báo cửa",
      subtitle: "An ninh gói gọn",
      price: "2.790.000đ",
      image: STORE_IMAGES.ptz,
    },
    {
      title: "Camera PTZ Full Color đêm",
      subtitle: "Hình ảnh màu ban đêm · Spotlight",
      price: "2.290.000đ",
      image: STORE_IMAGES.ptz,
    },
    {
      title: "Combo 3× Camera mini",
      subtitle: "Tiết kiệm 18% · Đồng bộ app",
      price: "3.290.000đ",
      image: STORE_IMAGES.mini,
    },
    {
      title: "Camera mini + thẻ 64GB",
      subtitle: "Ghi cục bộ · Plug & play",
      price: "1.449.000đ",
      image: STORE_IMAGES.mini,
    },
    {
      title: "Chân đế & nguồn PTZ",
      subtitle: "Phụ kiện chính hãng",
      price: "359.000đ",
      image: STORE_IMAGES.ptz,
    },
    {
      title: "UPS mini cho camera",
      subtitle: "4–6 giờ dự phòng cúp điện",
      price: "890.000đ",
      image: STORE_IMAGES.mini,
    },
    {
      title: "PTZ Outdoor Pro",
      subtitle: "IP66 · Chống nắng mưa",
      price: "2.990.000đ",
      image: STORE_IMAGES.ptz,
    },
  ];
  return base.map((b, i) => ({ ...b, id: `deal-${i + 1}` }));
}

export const STORE_DEAL_PRODUCTS: StoreProductItem[] = dealClones();
