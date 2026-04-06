import { ConfigProvider, theme } from "antd";
import viVN from "antd/locale/vi_VN";
import "antd/dist/reset.css";
import MiniApp from "./miniapp/App";
import "./miniapp/style.css";

/** Đồng bộ với `--accent-teal` trong `miniapp/style.css` */
const BRAND_PRIMARY = "#00acc1";
const BRAND_PRIMARY_HOVER = "#0097a7";

export default function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: BRAND_PRIMARY,
          colorInfo: BRAND_PRIMARY,
          colorLink: BRAND_PRIMARY,
          colorLinkHover: BRAND_PRIMARY_HOVER,
          colorLinkActive: BRAND_PRIMARY_HOVER,
          borderRadius: 12,
          borderRadiusLG: 16,
        },
        components: {
          Slider: {
            trackBg: BRAND_PRIMARY,
            trackHoverBg: BRAND_PRIMARY_HOVER,
            handleColor: BRAND_PRIMARY,
            handleActiveColor: BRAND_PRIMARY_HOVER,
            dotBorderColor: BRAND_PRIMARY,
            railBg: "rgba(0, 172, 193, 0.12)",
            railHoverBg: "rgba(0, 172, 193, 0.18)",
          },
          Switch: {
            colorPrimary: BRAND_PRIMARY,
            colorPrimaryHover: BRAND_PRIMARY_HOVER,
          },
          Button: {
            colorPrimary: BRAND_PRIMARY,
            colorPrimaryHover: BRAND_PRIMARY_HOVER,
            colorPrimaryActive: "#00838f",
          },
        },
      }}
    >
      <MiniApp />
    </ConfigProvider>
  );
}
