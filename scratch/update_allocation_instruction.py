import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

service_path = r"c:\Users\ADMIN\Desktop\TICH HOP AI\KHBD-KHXH - NGU VAN\src\services\geminiService.ts"

if not os.path.exists(service_path):
    print("geminiService.ts not found")
    sys.exit(1)

with open(service_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF during processing
original_endings = "\r\n" if "\r\n" in content else "\n"
content = content.replace("\r\n", "\n")

old_text = """    III. TIẾN TRÌNH DẠY HỌC
    - PHÂN BỔ TIẾT HỌC: Nếu KHBD có nhiều tiết, hãy chia rõ nội dung cho từng tiết. Mỗi tiết bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (viết hoa, in đậm, căn giữa)."""

new_text = """    III. TIẾN TRÌNH DẠY HỌC
    - PHÂN BỔ TIẾT HỌC CHI TIẾT: Đầu mục này chỉ nêu tên các tiết học và tóm tắt kiến thức trọng tâm của các tiết đó một cách khái quát trong ngoặc đơn, TUYỆT ĐỐI KHÔNG liệt kê chi tiết các Hoạt động 1, Hoạt động 2, Nội dung 1, Nội dung 2 hay các tiểu mục 2.1, 2.2,... ở phần phân bổ này để tránh làm rối mắt giáo viên (vì các hoạt động học cụ thể đã được triển khai chi tiết ở bên dưới).
      Ví dụ mẫu chuẩn:
      * TIẾT 1: KHỞI ĐỘNG CHUNG CHO CỤM BÀI HỌC. ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC (BỐI CẢNH LỊCH SỬ - XÃ HỘI, TÁC GIẢ VŨ TRỌNG PHỤNG, THỂ LOẠI TIỂU THUYẾT TRÀO PHÚNG, CỐT TRUYỆN VÀ NHÂN VẬT XUÂN TÓC ĐỎ).
      * TIẾT 2: ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC (NGHỆ THUẬT TRÀO PHÚNG, CÁC NHÂN VẬT PHỤ BIẾM HỌA, THÁI ĐỘ PHÊ PHÁN CỦA NHÀ VĂN).
    - Mỗi tiết học khi đi vào chi tiết bên dưới vẫn bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (viết hoa, in đậm, căn giữa)."""

if old_text in content:
    content = content.replace(old_text, new_text)
    print("Successfully replaced PHÂN BỔ TIẾT HỌC instruction in geminiService.ts")
else:
    print("Failed to find old text in geminiService.ts")
    sys.exit(1)

# Restore original endings
if original_endings == "\r\n":
    content = content.replace("\n", "\r\n")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully!")
