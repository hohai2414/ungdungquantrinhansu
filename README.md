# Nhân sự · Minh Phát

## Triển khai trên Vercel

Bản build hỗ trợ cả Sites/Cloudflare và Vercel. `vercel.json` đặt Framework là Other (`null`), Build Command `npm run build`, Output Directory `public`. Build tạo `public/index.html`; các `/api/*` chạy qua Vercel Function `api/index.js`, giữ nguyên kiểm tra đăng nhập và quyền phía máy chủ. Không chọn `dist` làm thư mục công khai vì nó chứa mã máy chủ.

Vercel không có binding Cloudflare D1. Bản Vercel dùng Turso/libSQL để lưu dữ liệu bền vững:

1. Tạo cơ sở dữ liệu Turso, lấy URL và auth token. Trong **Vercel → Settings → Environment Variables**, cấu hình `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `OPENAI_API_KEY` và tùy chọn `OPENAI_MODEL=gpt-4.1-mini`. Khóa trên Sites không tự chuyển sang Vercel; không đưa khóa vào GitHub.
2. Tạo `.env` cục bộ theo `.env.example`, điền URL/token, rồi chạy `node --env-file=.env scripts/migrate-vercel.mjs` để tạo schema. Script áp dụng migration theo thứ tự, kiểm tra checksum, lưu lịch sử và không chạy lại migration đã áp dụng.
3. Redeploy nhánh `main` trên Vercel. Sau khi có database/schema, `DEMO_MODE=true` sẽ tạo dữ liệu và tài khoản mẫu ở lần gọi API đầu tiên. Nếu chưa có cấu hình DB, giao diện báo thiếu cấu hình thay vì lưu dữ liệu tạm trong `/tmp`.
4. Khi vận hành thật, dùng DB mới, đặt `DEMO_MODE=false`, chạy migration và cấp Admin đầu tiên; giữ Site/Vercel có cơ chế giới hạn truy cập phù hợp. Dữ liệu đang có trên D1 không tự chuyển sang Turso; đây là hai DB độc lập.

Để thử migration/adapter trước khi cấu hình DB thật: `node test-vercel.mjs`. Tài liệu: https://vercel.com/docs/project-configuration và https://docs.turso.tech/sdk/ts/reference.

Web app tiếng Việt, giao diện trắng/cam #f58220, dữ liệu mẫu 168 hồ sơ. Máy chủ kiểm tra quyền cho mọi API. SQLite khi chạy tại máy; Cloudflare D1 khi triển khai Sites. Không dùng localStorage để lưu dữ liệu nghiệp vụ.

## Trải nghiệm

Chạy bằng Node.js 24: `npm install`, `npm run build`, `npm run dev`, sau đó mở http://localhost:4173.

Tài khoản: `admin@demo.vn`, `hr@demo.vn`, `manager@demo.vn`, `employee@demo.vn`. Mật khẩu chung: `NhanSu@2026`. Đây là các tài khoản demo; có nút chọn vai trò ở màn hình đăng nhập. Admin có thể tạo tài khoản mới trong Tài khoản → Quản lý tài khoản. Mật khẩu mới cần ít nhất 12 ký tự.

## Đã hoàn thiện

- Dashboard, tìm kiếm, lọc và phân trang hồ sơ; thêm, sửa và xem chi tiết.
- Quản lý phòng ban, chức danh, hợp đồng và bảng công bằng biểu mẫu hoặc Excel.
- Gửi yêu cầu nghỉ phép; quản lý duyệt nhóm, HR/Admin duyệt toàn công ty. Máy chủ buộc yêu cầu của nhân viên về đúng hồ sơ của họ, chặn lịch nghỉ trùng, kiểm tra số phép và trạng thái duyệt.
- Theo dõi ứng viên ở năm giai đoạn, thêm/sửa hồ sơ và thay đổi giai đoạn.
- Báo cáo thống kê từ dữ liệu hiện tại, xuất .xlsx; nhập có mẫu, xem trước và kiểm tra dữ liệu trên máy chủ. Tối đa 300 dòng / 2 MB mỗi tệp.
- Thông báo trong ứng dụng về phép chờ duyệt và hợp đồng trong 30 ngày; lịch sử đăng nhập và thao tác ghi dữ liệu, 100 bản ghi gần nhất.
- Đăng nhập bằng mật khẩu PBKDF2-SHA256 100.000 vòng và salt riêng, cookie HttpOnly/SameSite/Secure trên HTTPS; phiên 8 giờ, đổi mật khẩu thu hồi các phiên; hạn chế đăng nhập sai 8 lần/15 phút theo IP và email; kiểm tra Origin cho thao tác ghi.
- Employee: hồ sơ/bảng công/phép cá nhân. Manager: hồ sơ, hợp đồng, công và phép của nhóm; không thấy lương hợp đồng. HR: dữ liệu toàn công ty. Admin: quyền HR và tạo tài khoản.
- SQLite lưu ở `data/hr.sqlite`, ngoài thư mục mã nguồn được đưa lên hosting. D1 lưu bền vững trên Sites, schema qua migration Drizzle.

## Cần cấu hình trước khi dùng chính thức

1. Chạy trên HTTPS, cấu hình D1 hoặc máy chủ Node với SQLite trên ổ đĩa bền vững; chỉ mở cho tài khoản được cấp quyền. Site demo được giữ riêng tư ở lớp nền tảng.
2. Chuyển `DEMO_MODE=false` trên máy chủ để ngừng tự sinh dữ liệu mẫu, dùng cơ sở dữ liệu mới và chạy migration. **Không dùng dữ liệu/tài khoản demo cho vận hành thật.** Admin ban đầu trên máy cục bộ có thể tạo bằng `HR_ADMIN_PASSWORD` và `node provision.mjs` sau khi DB đã được tạo. Trên D1 cần quản trị viên triển khai cấp tài khoản đầu tiên với cùng hàm PBKDF2; sau đó cấp các tài khoản còn lại qua giao diện.
3. Liên kết tài khoản với hồ sơ nhân viên chính xác; thiết lập `managerId` theo mã hồ sơ người quản lý. Cấp quỹ phép năm cho từng nhân viên và nhập phòng ban/chức danh thực tế.
4. Thiết lập quy định chấm công, ca làm và ngày lễ. Bản này ghi bảng công thủ công/Excel; chưa kết nối máy chấm công và chưa tự tính công từ ca. Phép tính ngày làm việc từ thứ Hai–thứ Sáu, chưa trừ lễ; yêu cầu phép năm qua hai năm phải tách riêng.
5. Sao lưu và thử khôi phục DB, quản lý thời hạn lưu dữ liệu và quyền truy cập. SQLite cần sao lưu có kiểm soát khi DB đang mở. D1 cần cấu hình quy trình sao lưu/khôi phục của nền tảng.
6. Chưa tích hợp email/SMS/push, quên mật khẩu/SSO/MFA, khóa tài khoản, máy chấm công, lương/BHXH, tải bản scan hợp đồng, tuyển dụng công khai hay ký điện tử. Thông báo hiện tại được cập nhật khi tải lại dữ liệu.

Biểu đồ nhân sự thể hiện nhân viên hiện còn làm việc tích lũy theo năm gia nhập; tỷ lệ nghỉ việc là tỷ lệ trong tập hồ sơ hiện tại, không phải báo cáo biến động lịch sử theo tháng. Mức lương chỉ xuất hiện trong biểu mẫu hợp đồng của HR/Admin, không tính bảng lương.

## Kiểm tra

`npm test`: cơ sở dữ liệu SQLite độc lập, kiểm tra đăng nhập, phạm vi dữ liệu, quyền sửa/duyệt, Origin, nghỉ trùng, lưu/import, hợp đồng sai ngày và đăng xuất. `ui-check.mjs`: kiểm tra trình duyệt cục bộ, tìm kiếm, thêm hồ sơ, xuất/nhập Excel, các màn hình và kích thước điện thoại; cần Playwright và Chrome. Kiểm tra WebMCP đăng ký không có môi trường hỗ trợ tại máy này; API điều hướng có feature-detect và vẫn tuân theo vai trò của giao diện.

Thư viện Excel dùng bản 0.20.3 từ nguồn chính thức: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/. Không có dữ liệu cá nhân thật trong mã nguồn.

## Báo cáo nhân sự bằng OpenAI

HR/Admin mở **Báo cáo nhân sự → Tạo báo cáo bằng AI**, chọn tháng, tạo và xem lại hoặc tải `.txt`. Báo cáo lưu bền vững trong DB kèm số liệu nguồn, mô hình, người tạo, thời gian và token sử dụng. Manager/Employee không được tạo hay đọc báo cáo AI toàn công ty, kể cả gọi API trực tiếp. Không thiết lập lịch chạy tự động; nút tạo thực hiện viết báo cáo theo yêu cầu.

Máy chủ gọi Responses API với `store:false` và giới hạn 3.000 token đầu ra, mặc định `gpt-4.1-mini`. Secret `OPENAI_API_KEY` và biến `OPENAI_MODEL` nằm trong cấu hình runtime Sites. Với bản cục bộ, cấp các biến môi trường đó trước `npm run dev`, không ghi khóa vào mã nguồn. Sau khi đổi secret trên Sites cần triển khai phiên bản để áp dụng cấu hình.

Dữ liệu gửi OpenAI chỉ gồm số đếm nhân sự theo phòng ban/chức danh, hợp đồng cần chú ý, công và phép giao tháng, giai đoạn tuyển dụng và giới hạn dữ liệu. Không gửi tên, email, điện thoại, địa chỉ, ngày sinh, lý do nghỉ hoặc lương cá nhân. Đây là bản nháp, HR cần kiểm tra số liệu và khuyến nghị trước khi sử dụng. `store:false` không đồng nghĩa với Zero Data Retention; chính sách xử lý dữ liệu: https://developers.openai.com/api/docs/guides/your-data.

Giới hạn: 10 lần tạo mỗi người/ngày, 30 lần toàn công ty/ngày, ít nhất một phút giữa hai yêu cầu; các lượt thất bại cũng tính vào giới hạn để chống lạm dụng. Thời gian chờ OpenAI tối đa 45 giây. Chi phí trừ vào tài khoản API; cần API key hợp lệ, quyền mô hình và đủ hạn mức/thanh toán. Khóa đã gửi trong chat nên được thu hồi/thay mới trước khi vận hành thật. Tài khoản demo HR/Admin có thể tiêu hạn mức trong phạm vi Site riêng tư, cần loại bỏ khi vận hành.

Kiểm tra bổ sung: `node test-ai.mjs`. Kiểm tra kết nối thực tế: `node test-ai.mjs --live`, nhận khóa qua stdin ẩn, không ghi khóa vào tệp. Tài liệu API: https://developers.openai.com/api/docs/guides/text.

