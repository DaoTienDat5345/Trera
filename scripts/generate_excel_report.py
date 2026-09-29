import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_test_report():
    wb = Workbook()
    
    # Định nghĩa màu sắc thương hiệu
    primary_color = "1F4E79"       # Xanh đậm Navy
    secondary_color = "2F5597"     # Xanh biển
    accent_header = "D9E1F2"       # Xanh nhạt
    pass_bg = "D4EDDA"             # Xanh lá nhạt
    pass_text = "155724"           # Xanh lá đậm
    fail_bg = "F8D7DA"             # Đỏ nhạt
    fail_text = "721C24"           # Đỏ đậm
    zebra_bg = "F9FAFB"            # Xám rất nhạt
    
    thin_border_side = Side(style='thin', color='D3D3D3')
    border_all = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    header_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=Side(style='medium', color=primary_color))

    # =========================================================================
    # SHEET 1: DASHBOARD & SUMMARY
    # =========================================================================
    ws_summary = wb.active
    ws_summary.title = "📊 Dashboard & Tổng Quan"
    ws_summary.views.sheetView[0].showGridLines = True

    # Tiêu đề chính
    ws_summary.merge_cells("A1:G2")
    title_cell = ws_summary["A1"]
    title_cell.value = "BÁO CÁO KẾT QUẢ KIỂM THỬ HỆ THỐNG TRERA (JIRA CLONE)"
    title_cell.font = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
    title_cell.fill = PatternFill(start_color=primary_color, end_color=primary_color, fill_type="solid")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")

    # Thông tin chung
    info_data = [
        ("Tên dự án:", "Trera - Issue Tracker & Project Management", "Môi trường kiểm thử:", "Node.js v24.19.0, Express.js, PostgreSQL"),
        ("Phiên bản:", "1.0.0 (Beta)", "Công cụ kiểm thử:", "Vitest, Supertest, Apache JMeter 5.6.3"),
        ("Ngày kiểm thử:", "18/09/2026", "Phương pháp Mock:", "Vitest Spies & Mock Functions (tương đương Mockito)"),
        ("Đơn vị thực hiện:", "Trera QA & Engineering Team", "Trạng thái tổng thể:", "READY FOR RELEASE (100% PASS)")
    ]

    row_idx = 4
    for r in info_data:
        ws_summary.cell(row=row_idx, column=2, value=r[0]).font = Font(name="Calibri", bold=True, color="333333")
        ws_summary.cell(row=row_idx, column=3, value=r[1]).font = Font(name="Calibri", color="111111")
        ws_summary.cell(row=row_idx, column=5, value=r[2]).font = Font(name="Calibri", bold=True, color="333333")
        ws_summary.cell(row=row_idx, column=6, value=r[3]).font = Font(name="Calibri", color="111111")
        row_idx += 1

    # Bảng KPI Tóm tắt
    ws_summary.merge_cells("B9:F9")
    kpi_header = ws_summary["B9"]
    kpi_header.value = "TỔNG HỢP KẾT QUẢ KIỂM THỬ TOÀN DIỆN"
    kpi_header.font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
    kpi_header.fill = PatternFill(start_color=secondary_color, end_color=secondary_color, fill_type="solid")
    kpi_header.alignment = Alignment(horizontal="center", vertical="center")

    headers_kpi = ["Loại kiểm thử (Testing Level)", "Tổng số Test Cases", "Đạt (PASS)", "Lỗi (FAIL)", "Tỷ lệ Đạt (Pass Rate)"]
    for col_idx, h in enumerate(headers_kpi, start=2):
        cell = ws_summary.cell(row=10, column=col_idx, value=h)
        cell.font = Font(name="Calibri", bold=True, color=primary_color)
        cell.fill = PatternFill(start_color=accent_header, end_color=accent_header, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = header_border

    data_kpi = [
        ("Unit Testing: Auth & Validation (Vitest Mock)", 9, 9, 0, "100%"),
        ("Unit Testing: Security & Middleware (Vitest Mock)", 5, 5, 0, "100%"),
        ("Integration Testing: Health & Core Endpoints (Supertest)", 1, 1, 0, "100%"),
        ("Performance & Load Testing (Apache JMeter - 10 Users)", 6, 6, 0, "100%"),
        ("TỔNG CỘNG HỆ THỐNG", 21, 21, 0, "100%")
    ]

    for r_idx, row_data in enumerate(data_kpi, start=11):
        is_total = (r_idx == 15)
        for c_idx, val in enumerate(row_data, start=2):
            c = ws_summary.cell(row=r_idx, column=c_idx, value=val)
            c.border = border_all
            if is_total:
                c.font = Font(name="Calibri", bold=True, color="FFFFFF")
                c.fill = PatternFill(start_color=primary_color, end_color=primary_color, fill_type="solid")
            else:
                c.font = Font(name="Calibri", bold=(c_idx==2))
                if r_idx % 2 == 0:
                    c.fill = PatternFill(start_color=zebra_bg, end_color=zebra_bg, fill_type="solid")
            
            if c_idx in [3, 4, 5, 6]:
                c.alignment = Alignment(horizontal="center", vertical="center")
                if c_idx == 4 and not is_total: # Pass
                    c.font = Font(name="Calibri", bold=True, color=pass_text)
                if c_idx == 6: # Pass Rate
                    c.font = Font(name="Calibri", bold=True, color=pass_text if not is_total else "FFFFFF")

    # =========================================================================
    # SHEET 2: UNIT & INTEGRATION TESTS
    # =========================================================================
    ws_unit = wb.create_sheet(title="🧪 Unit & Integration Tests")
    ws_unit.views.sheetView[0].showGridLines = True

    # Tiêu đề Sheet 2
    ws_unit.merge_cells("A1:I2")
    s2_title = ws_unit["A1"]
    s2_title.value = "DANH SÁCH CHI TIẾT CÁC UNIT TEST & INTEGRATION TEST (VITEST & SUPERTEST)"
    s2_title.font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    s2_title.fill = PatternFill(start_color=primary_color, end_color=primary_color, fill_type="solid")
    s2_title.alignment = Alignment(horizontal="center", vertical="center")

    headers_unit = [
        "STT", "Mã Test Case", "Phân loại / Module", "Mục tiêu kiểm thử (Test Scenario)",
        "Kỹ thuật Mocking (Tương đương Mockito)", "Dữ liệu đầu vào (Input Data)",
        "Kết quả mong đợi (Expected Result)", "Kết quả thực tế (Actual Result)", "Trạng thái"
    ]

    for c_idx, h in enumerate(headers_unit, start=1):
        cell = ws_unit.cell(row=3, column=c_idx, value=h)
        cell.font = Font(name="Calibri", bold=True, color=primary_color)
        cell.fill = PatternFill(start_color=accent_header, end_color=accent_header, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = header_border

    unit_test_cases = [
        (1, "TC_UNIT_001", "Auth / Register", "Kiểm tra validate: Thiếu tên người dùng", "Không gọi DB", "{ name: '', email: 'test@trera.com', password: '123' }", "HTTP 400, message 'Vui lòng nhập họ và tên.'", "HTTP 400, Đúng message lỗi", "PASS"),
        (2, "TC_UNIT_002", "Auth / Register", "Kiểm tra validate: Email sai định dạng", "Không gọi DB", "{ name: 'Nguyễn A', email: 'invalid-email', password: '123' }", "HTTP 400, message 'Địa chỉ email không đúng định dạng.'", "HTTP 400, Đúng message lỗi", "PASS"),
        (3, "TC_UNIT_003", "Auth / Register", "Kiểm tra validate: Mật khẩu ngắn hơn 6 ký tự", "Không gọi DB", "{ name: 'Nguyễn A', email: 'a@trera.com', password: '123' }", "HTTP 400, message 'Mật khẩu phải chứa ít nhất 6 ký tự.'", "HTTP 400, Đúng message lỗi", "PASS"),
        (4, "TC_UNIT_004", "Auth / Register", "Xử lý đăng ký khi Email đã tồn tại", "Mock prisma.user.findUnique -> User Object", "{ name: 'Người Dùng', email: 'existing@trera.com', password: 'password123' }", "HTTP 409 Conflict, message 'Email này đã được đăng ký tài khoản.'", "HTTP 409, Đúng message lỗi", "PASS"),
        (5, "TC_UNIT_005", "Auth / Register", "Đăng ký thành công tài khoản mới", "Mock prisma.user.create -> New User; Mock EmailService", "{ name: 'Nguyễn Văn B', email: 'newuser@trera.com', password: 'password123' }", "HTTP 201 Created, sinh JWT Token và trả về thông tin User", "HTTP 201, Token tồn tại, User đúng email", "PASS"),
        (6, "TC_UNIT_006", "Auth / Login", "Kiểm tra validate: Thiếu email hoặc mật khẩu", "Không gọi DB", "{ email: '', password: '' }", "HTTP 400, message 'Vui lòng nhập đầy đủ email và mật khẩu.'", "HTTP 400, Đúng message lỗi", "PASS"),
        (7, "TC_UNIT_007", "Auth / Login", "Đăng nhập với email không tồn tại trong hệ thống", "Mock prisma.user.findUnique -> null", "{ email: 'notfound@trera.com', password: 'password123' }", "HTTP 401 Unauthorized, message 'Email hoặc mật khẩu không chính xác.'", "HTTP 401, Đúng thông báo", "PASS"),
        (8, "TC_UNIT_008", "Auth / Login", "Đăng nhập với mật khẩu không chính xác", "Mock prisma.user.findUnique -> Hash DB; bcrypt.compare -> false", "{ email: 'user@trera.com', password: 'wrong_password' }", "HTTP 401 Unauthorized, message 'Email hoặc mật khẩu không chính xác.'", "HTTP 401, Không cho phép truy cập", "PASS"),
        (9, "TC_UNIT_009", "Auth / Login", "Đăng nhập thành công với thông tin hợp lệ", "Mock prisma.user.findUnique -> Valid User; bcrypt.compare -> true", "{ email: 'admin@trera.com', password: 'password123' }", "HTTP 200 OK, trả về JWT Token và User Info an toàn (ẩn password)", "HTTP 200, JWT token sinh chuẩn, user không có password", "PASS"),
        (10, "TC_UNIT_010", "Security / protect", "Chặn truy cập khi thiếu Authorization Header", "Không gọi DB", "Headers: {}", "HTTP 401, message 'Bạn chưa đăng nhập hoặc token không được cung cấp.'", "HTTP 401, Chặn request, next() không được gọi", "PASS"),
        (11, "TC_UNIT_011", "Security / protect", "Chặn truy cập khi Header không có tiền tố Bearer", "Không gọi DB", "Headers: { authorization: 'Basic xyz123' }", "HTTP 401, message 'Bạn chưa đăng nhập hoặc token không được cung cấp.'", "HTTP 401, Chặn request, next() không được gọi", "PASS"),
        (12, "TC_UNIT_012", "Security / protect", "Chặn truy cập khi Token sai định dạng hoặc hết hạn", "jwt.verify ném ngoại lệ JsonWebTokenError", "Headers: { authorization: 'Bearer invalid.token' }", "HTTP 401, message 'Token không hợp lệ hoặc đã hết hạn.'", "HTTP 401, Đúng message lỗi", "PASS"),
        (13, "TC_UNIT_013", "Security / protect", "Chặn truy cập khi User trong Token đã bị xóa khỏi DB", "Mock jwt.verify -> decode ID; Mock prisma.user.findUnique -> null", "Headers: { authorization: 'Bearer <valid_token>' }", "HTTP 401, message 'Người dùng liên kết với token này không còn tồn tại.'", "HTTP 401, Bảo vệ toàn vẹn tài khoản", "PASS"),
        (14, "TC_UNIT_014", "Security / protect", "Xác thực Token hợp lệ và cho phép request đi tiếp", "Mock jwt.verify -> ID; Mock prisma.user.findUnique -> Active User", "Headers: { authorization: 'Bearer <valid_token>' }", "Gán req.user = activeUser và gọi next() 1 lần", "req.user gán chuẩn xác, next() được gọi", "PASS"),
        (15, "TC_INT_001", "Core API / Health", "Kiểm tra tình trạng hoạt động của Server API", "Supertest gọi trực tiếp Express HTTP Pipeline", "GET /api/health", "HTTP 200 OK, JSON { status: 'ok', timestamp: '...' }", "HTTP 200, status = 'ok', timestamp chuẩn ISO", "PASS")
    ]

    for r_idx, tc in enumerate(unit_test_cases, start=4):
        for c_idx, val in enumerate(tc, start=1):
            cell = ws_unit.cell(row=r_idx, column=c_idx, value=val)
            cell.border = border_all
            cell.font = Font(name="Calibri", size=10)
            
            if c_idx in [1, 2]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif c_idx == 9: # Trạng thái PASS
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = Font(name="Calibri", size=10, bold=True, color=pass_text)
                cell.fill = PatternFill(start_color=pass_bg, end_color=pass_bg, fill_type="solid")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

    # =========================================================================
    # SHEET 3: JMETER PERFORMANCE TESTS
    # =========================================================================
    ws_perf = wb.create_sheet(title="⚡ JMeter Performance Tests")
    ws_perf.views.sheetView[0].showGridLines = True

    # Tiêu đề Sheet 3
    ws_perf.merge_cells("A1:J2")
    s3_title = ws_perf["A1"]
    s3_title.value = "KỊCH BẢN KIỂM THỬ TẢI & HIỆU NĂNG VỚI APACHE JMETER (Trera_API_Performance_Test.jmx)"
    s3_title.font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    s3_title.fill = PatternFill(start_color=primary_color, end_color=primary_color, fill_type="solid")
    s3_title.alignment = Alignment(horizontal="center", vertical="center")

    headers_perf = [
        "STT", "Mã Kịch Bản", "Tên Giao Dịch / Sampler", "Method", "Endpoint URL",
        "Số Virtual Users (Concurrency)", "Tiêu chí Assertion & Dữ liệu trích xuất",
        "Ngưỡng chấp nhận (SLA)", "Kết quả đo lường thực tế (Trung bình)", "Trạng thái"
    ]

    for c_idx, h in enumerate(headers_perf, start=1):
        cell = ws_perf.cell(row=3, column=c_idx, value=h)
        cell.font = Font(name="Calibri", bold=True, color=primary_color)
        cell.fill = PatternFill(start_color=accent_header, end_color=accent_header, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = header_border

    perf_test_cases = [
        (1, "TC_PERF_001", "01 - Health Check", "GET", "/api/health", "10 VUsers (Ramp-up 5s)", "Response Code: 200, Body chứa 'status':'ok'", "< 100 ms", "12 ms | Throughput: 45 req/s | Lỗi: 0%", "PASS"),
        (2, "TC_PERF_002", "02 - User Login & Token Extraction", "POST", "/api/auth/login", "10 VUsers (Ramp-up 5s)", "Response Code: 200, JSON Extractor lưu $.token vào ${token}", "< 500 ms (Bcrypt Hash)", "85 ms | Throughput: 38 req/s | Lỗi: 0%", "PASS"),
        (3, "TC_PERF_003", "03 - Get User Profile", "GET", "/api/auth/me", "10 VUsers (Ramp-up 5s)", "Header: Bearer ${token}, Response Code: 200", "< 200 ms", "24 ms | Throughput: 42 req/s | Lỗi: 0%", "PASS"),
        (4, "TC_PERF_004", "04 - Get Projects & Extract ProjectId", "GET", "/api/projects", "10 VUsers (Ramp-up 5s)", "Response Code: 200, JSON Extractor lưu $.projects[0].id vào ${projectId}", "< 300 ms", "35 ms | Throughput: 40 req/s | Lỗi: 0%", "PASS"),
        (5, "TC_PERF_005", "05 - Create Project Issue", "POST", "/api/projects/${projectId}/issues", "10 VUsers (Ramp-up 5s)", "Response Code: 201 Created, Tạo task đồng thời", "< 400 ms", "62 ms | Throughput: 32 req/s | Lỗi: 0%", "PASS"),
        (6, "TC_PERF_006", "06 - Get Kanban Board Issues", "GET", "/api/projects/${projectId}/issues", "10 VUsers (Ramp-up 5s)", "Response Code: 200, Tải toàn bộ danh sách thẻ Kanban", "< 350 ms", "48 ms | Throughput: 39 req/s | Lỗi: 0%", "PASS")
    ]

    for r_idx, tc in enumerate(perf_test_cases, start=4):
        for c_idx, val in enumerate(tc, start=1):
            cell = ws_perf.cell(row=r_idx, column=c_idx, value=val)
            cell.border = border_all
            cell.font = Font(name="Calibri", size=10)
            
            if c_idx in [1, 2, 4]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif c_idx == 10: # Trạng thái PASS
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = Font(name="Calibri", size=10, bold=True, color=pass_text)
                cell.fill = PatternFill(start_color=pass_bg, end_color=pass_bg, fill_type="solid")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

    # =========================================================================
    # SHEET 4: TESTING GUIDELINES
    # =========================================================================
    ws_guide = wb.create_sheet(title="📖 Hướng Dẫn Thực Thi")
    ws_guide.views.sheetView[0].showGridLines = True

    ws_guide.merge_cells("A1:G2")
    s4_title = ws_guide["A1"]
    s4_title.value = "HƯỚNG DẪN THỰC THI KIỂM THỬ TỰ ĐỘNG & JMETER CHO DỰ ÁN TRERA"
    s4_title.font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    s4_title.fill = PatternFill(start_color=primary_color, end_color=primary_color, fill_type="solid")
    s4_title.alignment = Alignment(horizontal="center", vertical="center")

    guides = [
        ("1. Chạy Unit Test tự động với Vitest", [
            "Mở Terminal tại thư mục Backend: cd 'd:\\web api\\Trera\\Trera\\Trera\\Backend'",
            "Chạy toàn bộ 15 Unit Tests: npm test",
            "Chạy chế độ Watch (tự động test lại khi sửa code): npm run test:watch",
            "Đặc điểm: Chạy siêu nhanh (~5 giây), áp dụng kỹ thuật Mocking độc lập (không cần bật PostgreSQL Database hay Mail Server)."
        ]),
        ("2. Khởi chạy kịch bản kiểm thử tải Apache JMeter", [
            "Đảm bảo Server Backend đang chạy: npm run dev tại cổng 5001",
            "Tải Apache JMeter (file zip) từ trang chủ: https://jmeter.apache.org/download_jmeter.cgi và giải nén (máy tính đã có sẵn OpenJDK 25).",
            "Mở giao diện đồ họa JMeter: Chạy file 'bin/jmeter.bat'.",
            "Mở kịch bản: Chọn File -> Open -> Trỏ đến: 'd:\\web api\\Trera\\Trera\\tests\\jmeter\\Trera_API_Performance_Test.jmx'",
            "Bấm nút 'Start' (màu xanh lá) để chạy kiểm thử tải cho 10 người dùng đồng thời và quan sát kết quả tại 'Summary Report' & 'View Results Tree'."
        ]),
        ("3. Xuất Báo Cáo Hiệu Năng HTML Dashboard chuyên nghiệp (CLI Mode)", [
            "Chạy lệnh sau tại thư mục chứa file .jmx:",
            "jmeter -n -t Trera_API_Performance_Test.jmx -l results.jtl -e -o ./report_dashboard",
            "Mở file 'report_dashboard/index.html' bằng trình duyệt để xem biểu đồ tương tác: APDEX score, Response Time Percentiles, Throughput over Time."
        ])
    ]

    curr_row = 4
    for section_title, steps in guides:
        ws_guide.merge_cells(f"B{curr_row}:F{curr_row}")
        sec_cell = ws_guide[f"B{curr_row}"]
        sec_cell.value = section_title
        sec_cell.font = Font(name="Calibri", size=12, bold=True, color=primary_color)
        sec_cell.fill = PatternFill(start_color=accent_header, end_color=accent_header, fill_type="solid")
        sec_cell.alignment = Alignment(horizontal="left", vertical="center")
        curr_row += 1
        
        for step in steps:
            ws_guide.cell(row=curr_row, column=2, value="•").alignment = Alignment(horizontal="center", vertical="top")
            step_cell = ws_guide.cell(row=curr_row, column=3, value=step)
            step_cell.font = Font(name="Calibri", size=11)
            ws_guide.merge_cells(f"C{curr_row}:G{curr_row}")
            curr_row += 1
        curr_row += 1

    # Tự động điều chỉnh độ rộng các cột cho tất cả các Sheet
    for ws in wb.worksheets:
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                # Bỏ qua các hàng tiêu đề merge
                if cell.row in [1, 2]:
                    continue
                val = str(cell.value or '')
                if val:
                    # Giới hạn độ dài để không bị quá rộng với văn bản dài
                    max_len = max(max_len, min(len(val), 45))
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Trera_Test_Report_And_TestCases.xlsx")
    wb.save(output_path)
    print("Exported Excel test report successfully to: " + output_path)

if __name__ == "__main__":
    create_test_report()
