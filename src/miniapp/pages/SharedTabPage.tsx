import React from "react";

/** Tab "Đã chia sẻ" — nội dung placeholder; vỏ layout ở HomeLayout */
export const SharedTabPage: React.FC = () => {
  return (
    <div className="home-page__shared-body">
      <p className="home-page__shared-text">Chưa có thiết bị được chia sẻ.</p>
      <p className="home-page__shared-hint">Khi có chia sẻ từ thành viên khác, danh sách sẽ hiển thị tại đây.</p>
    </div>
  );
};
