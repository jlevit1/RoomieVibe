# Đề xuất tính năng & mô hình kiếm tiền cho RoomieVibe

> Ghi chú brainstorm. Cập nhật 2026-10-02: đã làm xong Nhóm 5 (#15–19), các mục còn lại chưa triển khai.

## Tính năng nên bổ sung (ưu tiên theo nhóm)

### Nhóm 1 — Chống lừa đảo & minh bạch giá (ưu tiên cao nhất)
1. Xác minh tin đăng / định danh chủ trọ (badge "Đã xác minh") + nút báo cáo tin đăng lừa đảo.
2. Minh bạch giá điện/nước/dịch vụ đi kèm ngay trong tin đăng (tách riêng, so với giá nhà nước).

### Nhóm 2 — Mở rộng từ hạ tầng ví/chat đã có
3. Đánh giá 2 chiều: landlord review renter (hiện chỉ có renter review tin đăng).
4. Thanh toán tiền thuê hàng tháng qua ví (không chỉ đặt cọc xem phòng), nhắc lịch, biên lai tự động.
5. Hợp đồng thuê điện tử đơn giản (tick xác nhận điều khoản + xuất PDF lưu hệ thống).

### Nhóm 3 — Thói quen người dùng Việt Nam
6. Đăng nhập / thông báo qua Zalo thay vì chỉ email.
7. Tìm phòng theo khoảng cách/thời gian di chuyển đến trường/công ty (đi xe máy).

### Nhóm 4 — Bổ sung thêm
8. Đăng ký tạm trú online — hướng dẫn/liên kết thủ tục khai báo tạm trú (nghĩa vụ pháp lý thật của chủ trọ ở VN, chưa nền tảng nào làm tốt).
9. Chia hoá đơn tiền phòng/điện nước giữa các roommate ở ghép qua ví (bill splitting).
10. Đặt lịch xem phòng theo khung giờ thay vì hẹn qua chat tự do, tránh trùng lịch.
11. Theo dõi lịch sử giá của một tin đăng + cảnh báo tăng giá đột biến.
12. Review khu trọ (an ninh, ngập nước, giá điện nước chung khu vực) — không chỉ review từng phòng.
13. So sánh nhiều tin đăng cạnh nhau (giá, diện tích, tiện ích) trước khi quyết định.
14. Chế độ tiếng Anh cho du học sinh/người nước ngoài thuê trọ ở VN — mở rộng tệp người dùng.

### Nhóm 5 — Đề xuất từ người dùng (2026-10-02) — [ĐÃ LÀM]
15. [Đã làm] Chỉ đường: nút "Chỉ đường từ vị trí của tôi" vẽ tuyến xe máy ngay trên bản đồ (Goong Direction, hiện km + phút) và nút "Mở Google Maps" để dẫn đường từng bước.
16. [Đã làm] Chủ nhà đánh dấu "Đã cho thuê" / "Mở cho thuê lại": tin bị ẩn khỏi tìm kiếm + bản đồ, trang chi tiết hiện banner, chặn liên hệ & đặt cọc mới. Có thể chọn người thuê (từ những người đã nhắn tin) để họ nhận thông báo và được đánh giá.
17. [Đã làm] Trợ lý AI hiểu "gần <địa danh>": Gemini chuẩn hoá tên địa điểm → Goong geocode → lọc phòng trong bán kính (mặc định 3 km, hiểu "bán kính 2km", "500m", "đi bộ được" = 1 km), hiện khoảng cách trên từng phòng và bản đồ vòng bán kính.
18. [Đã làm] Chỉ người đã thuê (chủ nhà xác nhận) hoặc đã hoàn tất đặt cọc xem phòng mới được đánh giá; đánh giá có huy hiệu "Đã thuê phòng này" / "Đã đặt cọc xem phòng".
19. [Đã làm] Đẩy tin trả phí bằng ví: gói 3 ngày 15k / 7 ngày 30k / 30 ngày 99k, mua thêm thì cộng dồn; tin được đẩy đứng đầu khi sắp xếp "Mới nhất" và có nhãn "Nổi bật"; lịch sử ví ghi "Phí đẩy tin".

## Ý tưởng kiếm tiền (monetization)

1. **[Đã làm — xem #19] Tin đăng trả phí / đẩy tin (VIP listing)** — landlord trả phí để tin lên đầu trang tìm kiếm, gắn nhãn "Tin nổi bật"; giới hạn số tin đăng miễn phí/tháng. Mô hình chuẩn của Chợ Tốt, Phongtro123.
2. **Phí giao dịch trên đặt cọc** — thu % nhỏ (vd 1-2%) trên mỗi giao dịch đặt cọc đi qua ví (nền tảng đóng vai trò escrow trung gian).
3. **Gói thành viên chủ trọ (Landlord Pro)** — trả phí hàng tháng: đăng tin không giới hạn, xem thống kê lượt xem/liên hệ, badge "Đối tác tin cậy".
4. **Phí xác minh "Chủ trọ uy tín"** — thu phí một lần cho gói kiểm tra giấy tờ/định danh (gắn với đề xuất #1 ở trên) — vừa ra tiền vừa tăng trust cho nền tảng.
5. **Quảng cáo hiển thị đúng đối tượng** — banner cho dịch vụ liên quan: nội thất, chuyển nhà, lắp mạng/wifi, bảo hiểm nhà trọ — nhắm sinh viên/người mới thuê trọ.
6. **Affiliate/hoa hồng dịch vụ liên kết** — liên kết chuyển nhà, lắp đặt điện nước, bảo hiểm cháy nổ; nhận hoa hồng khi người dùng đặt qua nền tảng.
7. **Nổi bật hồ sơ roommate** — phí nhỏ để hồ sơ tìm ở ghép được ưu tiên hiển thị/gợi ý nhiều hơn.
8. **Gói tin đăng có video/ảnh 360°** — thu phí cao hơn cho tin đăng "cao cấp" có video tour thay vì chỉ ảnh tĩnh.
9. **Bán báo cáo/dữ liệu thị trường** — giá thuê trung bình theo khu vực, xu hướng, bán cho môi giới BĐS hoặc nhà nghiên cứu (dạng báo cáo định kỳ trả phí).
10. **Gói bảo hiểm rủi ro đặt cọc** — hợp tác đối tác bảo hiểm, ăn chia hoa hồng khi người dùng mua thêm bảo hiểm cho khoản cọc.
11. **Marketplace dịch vụ đi kèm** — gọi thợ sửa chữa/dọn dẹp/chuyển nhà ngay trong app, thu phí hoa hồng trên mỗi đơn dịch vụ hoàn thành.

**Gợi ý cho một đồ án học thuật:** dễ demo và thuyết phục nhất là kết hợp #1 (tin VIP) + #2 (phí giao dịch đặt cọc) vì tận dụng trực tiếp module ví/escrow đã có sẵn, không cần tích hợp bên thứ 3 mới.
