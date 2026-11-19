# IT Operations & NOC Portal

Portal Next.js cho Checkmk, NetBox, Snipe-IT và Grafana. Không có cấu hình nào có thể bảo đảm vượt Nessus: cần quét thực tế và xử lý cả hệ điều hành, TLS, cấu hình nguồn và các phát hiện cụ thể.

## Triển khai Ubuntu 24.04

1. Cài Node.js LTS tương thích phiên bản Next.js trong `package-lock.json`, Nginx và PM2. Sao chép mã vào `/opt/noc-portal`, tạo tài khoản dịch vụ không đặc quyền, giới hạn quyền thư mục.
2. Sao chép `.env.local.example` thành `.env.local`. Thiết lập mật khẩu mạnh, `AUTH_SECRET` ngẫu nhiên ít nhất 32 byte (`openssl rand -base64 48`), URL và token chỉ đọc cho từng hệ thống. Giới hạn quyền đọc file môi trường cho tài khoản dịch vụ (`chmod 600 .env.local`). Với token NetBox v2 giữ nguyên tiền tố `nbt_`; token cũ dùng `Token`.
3. Với chứng chỉ nội bộ/self-signed, đưa CA hoặc chứng chỉ tin cậy vào `/etc/noc-portal/internal-ca.pem`, đặt `NODE_EXTRA_CA_CERTS` trong môi trường PM2 **trước khi Node khởi động**. Không tắt xác minh TLS toàn cục.
4. Chạy `npm ci`, `npm run build`, sau đó `NODE_EXTRA_CA_CERTS=/etc/noc-portal/internal-ca.pem pm2 start npm --name noc-portal -- start -- --hostname 127.0.0.1` và `pm2 save`; cấu hình `pm2 startup` theo hướng dẫn của PM2. Nếu không dùng CA riêng, bỏ biến môi trường này.
5. Cài cấu hình mẫu `deploy/nginx.conf` vào Nginx, thay hostname và đường dẫn chứng chỉ, kiểm tra `sudo nginx -t` rồi reload Nginx. Chỉ mở 80/443; không công khai cổng 3000. Cấu hình DNS và chứng chỉ TLS hợp lệ trước khi bật HTTPS/HSTS. Cập nhật hệ điều hành, Node và các dependency thường xuyên.
6. Cấu hình Grafana cho phép embedding (`allow_embedding = true`), quyền truy cập dashboard phù hợp và cookie tương thích; trình duyệt phải truy cập được Grafana. `GRAFANA_URL` cần được đặt trước bước build vì CSP được tạo khi build. Việc xác thực Grafana là riêng biệt.

## Giới hạn vận hành

Rate limit trong bộ nhớ là theo tiến trình, mất khi khởi động lại và không dùng chung giữa nhiều instance. Nginx phải là proxy tin cậy duy nhất tới Node vì nó đặt lại `X-Real-IP`; bổ sung rate limiting tại Nginx hoặc kho lưu trữ dùng chung khi mở rộng. Cookie được ký JWT, HttpOnly, SameSite Strict và Secure trong production; JWT được ký, không mã hóa nội dung. Đăng xuất xóa cookie nhưng không thu hồi bản sao JWT đã bị đánh cắp trước khi hết hạn 8 giờ.

Kiểm tra quyền và schema API trên hai bản Checkmk trước khi sử dụng. Các bản cài đặt có thể không trả trạng thái host trong endpoint cấu hình host; `hostStateAvailable` cho biết dữ liệu này có đủ hay không. Danh sách NetBox giới hạn 1.000 thiết bị; Snipe-IT giới hạn 500 tài sản và 500 license, chỉ số sử dụng/kho và cảnh báo dựa trên trang được tải. Số không được gán chỉ là xấp xỉ số sẵn kho, không thay thế trạng thái kho chính thức. Không đưa hệ thống vào sản xuất trước khi kiểm thử các giới hạn này với dữ liệu thực tế.
