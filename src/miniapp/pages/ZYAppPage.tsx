import React, { useEffect } from "react";

const ZYAPP_INDEX_URL = "/ZYApp/index.html";

export const ZYAppPage: React.FC = () => {
  useEffect(() => {
    const main = document.getElementById("main-content");
    main?.classList.add("is-zyapp");
    return () => {
      main?.classList.remove("is-zyapp");
    };
  }, []);

  return (
    <div className="page-zyapp">
      <iframe title="ZYApp" src={ZYAPP_INDEX_URL} className="zyapp-iframe" />
    </div>
  );
};

