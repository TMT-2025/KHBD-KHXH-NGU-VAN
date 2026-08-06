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

# 1. replace PHÂN BỔ TIẾT HỌC part in integrateNLS
old_allocation_nls = """       - PHÂN BỔ TIẾT HỌC: Nếu KHBD gốc có nhiều tiết, hãy chia rõ nội dung cho từng tiết. Mỗi tiết bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (viết hoa, in đậm, căn giữa). """
new_allocation_nls = """       - PHÂN BỔ TIẾT HỌC: Nếu KHBD gốc có nhiều tiết, hãy chia rõ nội dung cho từng tiết. Mỗi tiết bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (hãy viết hoa toàn bộ tên bài học và in đậm, tuyệt đối không được ghi thêm các chú thích kiểu "(căn giữa, viết hoa, in đậm)" hay "(viết hoa, in đậm, căn giữa)" vào văn bản). """

if old_allocation_nls in content:
    content = content.replace(old_allocation_nls, new_allocation_nls)
    print("Replaced old_allocation_nls")
else:
    print("Failed to find old_allocation_nls")
    sys.exit(1)

# 2. replace PHÂN BỔ TIẾT HỌC part in generateLessonPlan
old_allocation_gen = """    - Mỗi tiết học khi đi vào chi tiết bên dưới vẫn bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (viết hoa, in đậm, căn giữa). """
new_allocation_gen = """    - Mỗi tiết học khi đi vào chi tiết bên dưới vẫn bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (hãy viết hoa toàn bộ tên bài học và in đậm, tuyệt đối không được ghi thêm các chú thích kiểu "(căn giữa, viết hoa, in đậm)" hay "(viết hoa, in đậm, căn giữa)" vào văn bản). """

if old_allocation_gen in content:
    content = content.replace(old_allocation_gen, new_allocation_gen)
    print("Replaced old_allocation_gen")
else:
    print("Failed to find old_allocation_gen")
    sys.exit(1)

# 3. Add negative formatting constraints in integrateNLS
old_formatting_nls = """    YÊU CẦU QUY TẮC ĐỊNH DẠNG KHÁC:
    - Mọi nội dung NLS và AI được bổ sung thêm PHẢI được bao bọc trong cặp thẻ <nls> và </nls> (ví dụ: <nls>- Năng lực 1.2: ...</nls> hoặc <nls>[Tích hợp giáo dục AI (NLa): ...]</nls>).
    - Giữ nguyên các nội dung chuyên môn gốc của bài dạy."""

new_formatting_nls = """    YÊU CẦU QUY TẮC ĐỊNH DẠNG KHÁC:
    - Mọi nội dung NLS và AI được bổ sung thêm PHẢI được bao bọc trong cặp thẻ <nls> và </nls> (ví dụ: <nls>- Năng lực 1.2: ...</nls> hoặc <nls>[Tích hợp giáo dục AI (NLa): ...]</nls>).
    - Giữ nguyên các nội dung chuyên môn gốc của bài dạy.
    - TUYỆT ĐỐI KHÔNG sử dụng ký hiệu 5 hoặc 6 dấu thăng ("#####" hoặc "######") trong toàn bộ văn bản.
    - TUYỆT ĐỐI KHÔNG ghi các từ chú thích định dạng như "(Căn giữa, viết hoa, in đậm)", "(viết hoa, in đậm, căn giữa)", hoặc bất kỳ chỉ dẫn định dạng nào khác vào nội dung bài dạy."""

if old_formatting_nls in content:
    content = content.replace(old_formatting_nls, new_formatting_nls)
    print("Replaced old_formatting_nls")
else:
    print("Failed to find old_formatting_nls")
    sys.exit(1)

# 4. Add negative formatting constraints in generateLessonPlan
old_formatting_gen = """    LƯU Ý QUÂN TRỌNG:
    - Mọi nội dung NLS và giáo dục AI được bổ sung thêm PHẢI được bao bọc trong cặp thẻ <nls> và </nls>.
    - Không viết tắt tự ý ngoài các thuật ngữ chuẩn và mã hóa năng lực trong hướng dẫn.
    - Trả về toàn bộ nội dung giáo án hoàn chỉnh, phong phú và chi tiết."""

new_formatting_gen = """    LƯU Ý QUAN TRỌNG:
    - Mọi nội dung NLS và giáo dục AI được bổ sung thêm PHẢI được bao bọc trong cặp thẻ <nls> và </nls>.
    - Không viết tắt tự ý ngoài các thuật ngữ chuẩn và mã hóa năng lực trong hướng dẫn.
    - Trả về toàn bộ nội dung giáo án hoàn chỉnh, phong phú và chi tiết.
    - TUYỆT ĐỐI KHÔNG sử dụng ký hiệu 5 hoặc 6 dấu thăng ("#####" hoặc "######") trong toàn bộ văn bản.
    - TUYỆT ĐỐI KHÔNG ghi các từ chú thích định dạng như "(Căn giữa, viết hoa, in đậm)", "(viết hoa, in đậm, căn giữa)", hoặc bất kỳ chỉ dẫn định dạng nào khác vào nội dung bài dạy."""

if old_formatting_gen in content:
    content = content.replace(old_formatting_gen, new_formatting_gen)
    print("Replaced old_formatting_gen")
else:
    print("Failed to find old_formatting_gen")
    sys.exit(1)

# Restore original endings
if original_endings == "\r\n":
    content = content.replace("\n", "\r\n")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully!")
