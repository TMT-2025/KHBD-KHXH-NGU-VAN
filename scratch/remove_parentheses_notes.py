import os
import sys
import re

service_path = r"c:\Users\ADMIN\Desktop\TICH HOP AI\KHBD-KHXH - NGU VAN\src\services\geminiService.ts"

if not os.path.exists(service_path):
    print("geminiService.ts not found")
    sys.exit(1)

with open(service_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF during processing
content = content.replace("\r\n", "\n")

# 1. Update integrateNLS prompt part (around line 143)
old_integrate_alloc = r"-\s+PHÂN\s+BỔ\s+TIẾT\s+HỌC\:\s+Nếu\s+KHBD\s+gốc\s+có\s+nhiều\s+tiết\,\s+hãy\s+chia\s+rõ\s+nội\s+dung\s+cho\s+từng\s+tiết\.\s+Mỗi\s+tiết\s+bắt\s+đầu\s+bằng\s+tiêu\s+đề\s+dòng\s+riêng\:\s+\*\*TIẾT\s+X\:\s+\[NỘI\s+DUNG\s+KIẾN\s+THỨC\s+BÀI\s+HỌC\]\*\*\s+\(hãy\s+viết\s+hoa\s+toàn\s+bộ\s+tên\s+bài\s+học\s+và\s+in\s+đậm\,\s+tuyệt\s+đối\s+không\s+được\s+ghi\s+thêm\s+các\s+chú\s+thích\s+kiểu\s+\"\(căn\s+giữa\,\s+viết\s+hoa\,\s+in\s+đậm\)\"\s+hay\s+\"\(viết\s+hoa\,\s+in\s+đậm\,\s+căn\s+giữa\)\"\s+vào\s+văn\s+bản\)\.\s*"

new_integrate_alloc = """- PHÂN BỔ TIẾT HỌC CHI TIẾT: Đầu mục này chỉ nêu tên và chủ đề chung của các tiết học trên dòng riêng (ví dụ: * TIẾT 1: KHỞI ĐỘNG CHUNG CHO CỤM BÀI HỌC. ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC; * TIẾT 2: ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC). TUYỆT ĐỐI KHÔNG được ghi nội dung mô tả chi tiết trong ngoặc đơn ở phần phân bổ này (ví dụ: KHÔNG ghi "... (BỐI CẢNH LỊCH SỬ, TÁC GIẢ...)") và KHÔNG liệt kê chi tiết các Hoạt động 1, Hoạt động 2, Nội dung 1, Nội dung 2 hay các tiểu mục 2.1, 2.2,... trong phần phân bổ tiết học này.
        - Mỗi tiết học khi đi vào chi tiết bên dưới vẫn bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (hãy viết hoa toàn bộ tên bài học và in đậm, tuyệt đối không được ghi thêm các chú thích kiểu "(căn giữa, viết hoa, in đậm)" hay "(viết hoa, in đậm, căn giữa)" vào văn bản). """

content, count1 = re.subn(old_integrate_alloc, new_integrate_alloc, content)
print(f"Replaced integrate allocation: {count1} matches")

# 2. Update generateLessonPlan prompt part (around line 400)
# Let's target the exact text of PHÂN BỔ TIẾT HỌC CHI TIẾT in generateLessonPlan
old_gen_alloc = r"-\s+PHÂN\s+BỔ\s+TIẾT\s+HỌC\s+CHI\s+TIẾT\:\s+Đầu\s+mục\s+này\s+chỉ\s+nêu\s+tên\s+các\s+tiết\s+học\s+và\s+tóm\s+tắt\s+kiến\s+thức\s+trọng\s+tâm\s+của\s+các\s+tiết\s+đó\s+một\s+cách\s+khái\s+quát\s+trong\s+ngoặc\s+đơn\,\s+TUYỆT\s+ĐỐI\s+KHÔNG\s+liệt\s+kê\s+chi\s+tiết\s+các\s+Hoạt\s+động\s+1\,\s+Hoạt\s+động\s+2\,\s+Nội\s+dung\s+1\,\s+Nội\s+dung\s+2\s+hay\s+các\s+tiểu\s+mục\s+2\.1\,\s+2\.2\,\.\.\.\s+ở\s+phần\s+phân\s+bổ\s+này\s+để\s+tránh\s+làm\s+rối\s+mắt\s+giáo\s+viên\s+\(vì\s+các\s+hoạt\s+động\s+học\s+cụ\s+thể\s+đã\s+được\s+triển\s+khai\s+chi\s+tiết\s+ở\s+bên\s+dưới\)\.\n\s*Ví\s+dụ\s+mẫu\s+chuẩn\:\n\s*\* TIẾT 1\: KHỞI ĐỘNG CHUNG CHO CỤM BÀI HỌC\. ĐỌC \- HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC \(BỐI CẢNH LỊCH SỬ \- XÃ HỘI\, TÁC GIẢ VŨ TRỌNG PHỤNG\, THỂ LOẠI TIỂU THUYẾT TRÀO PHÚNG\, CỐT TRUYỆN VÀ NHÂN VẬT XUÂN TÓC ĐỎ\)\.\n\s*\* TIẾT 2\: ĐỌC \- HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC \(NGHỆ THUẬT TRÀO PHÚNG\, CÁC NHÂN VẬT PHỤ BIẾM HỌA\, THÁI ĐỘ PHÊ PHÁN CỦA NHÀ VĂN\)\."

new_gen_alloc = """- PHÂN BỔ TIẾT HỌC CHI TIẾT: Đầu mục này chỉ nêu tên các tiết học và chủ đề chung của các tiết đó một cách khái quát trên dòng riêng. TUYỆT ĐỐI KHÔNG được ghi nội dung mô tả chi tiết trong ngoặc đơn ở phần phân bổ này (ví dụ: KHÔNG ghi "... (BỐI CẢNH LỊCH SỬ - XÃ HỘI, TÁC GIẢ Vũ Trọng Phụng...)") và TUYỆT ĐỐI KHÔNG liệt kê chi tiết các Hoạt động 1, Hoạt động 2, Nội dung 1, Nội dung 2 hay các tiểu mục 2.1, 2.2,... ở phần phân bổ này để tránh làm rối mắt giáo viên (vì các hoạt động học cụ thể đã được triển khai chi tiết ở bên dưới).
      Ví dụ mẫu chuẩn:
      * TIẾT 1: KHỞI ĐỘNG CHUNG CHO CỤM BÀI HỌC. ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC
      * TIẾT 2: ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC"""

content, count2 = re.subn(old_gen_alloc, new_gen_alloc, content)
print(f"Replaced generate allocation: {count2} matches")

if count1 == 0 or count2 == 0:
    print("Error: Replaces failed!")
    sys.exit(1)

# Restore CRLF if needed
if "\r\n" in open(service_path, "r", encoding="utf-8").read():
    content = content.replace("\n", "\r\n")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully!")
