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

# 1. Update isDoc specific prompt in generateLessonPlan
old_doc_pattern = r"if\s*\(isDoc\)\s*\{\s*skillSpecificPrompt\s*=\s*`\s*HÌNH THỨC TRÌNH BÀY ĐỀ MỤC BẮT BUỘC ĐỐI VỚI TIẾT DẠY LIÊN QUAN KỸ NĂNG ĐỌC HIỂU VĂN BẢN \(DỰA THEO HÌNH THỨC CỦA FILE \"KHBD  DOC VAN BAN\.pdf\"\)\:"

new_doc_repl = """if (isDoc) {
      skillSpecificPrompt = `
    NGUỒN THAM KHẢO VÀ THỨ TỰ ƯU TIÊN KHI BIÊN SOẠN KỸ NĂNG ĐỌC HIỂU VĂN BẢN:
    - Khi biên soạn KHBD liên quan đến Kỹ năng đọc hiểu văn bản, bạn bắt buộc phải tham khảo 02 nguồn tài liệu theo thứ tự ưu tiên sau:
      + Thứ nhất: Sách Giáo Viên (SGV) Ngữ văn lớp 10, lớp 11, lớp 12 (bộ sách Kết nối tri thức với cuộc sống).
      + Thứ hai: Các giáo án lớp 10, lớp 11, lớp 12 trong thư mục "MON NGU VAN-NEW".

    HÌNH THỨC TRÌNH BÀY ĐỀ MỤC BẮT BUỘC ĐỐI VỚI TIẾT DẠY LIÊN QUAN KỸ NĂNG ĐỌC HIỂU VĂN BẢN (DỰA THEO HÌNH THỨC CỦA FILE "KHBD  DOC VAN BAN.pdf"):"""

content, count1 = re.subn(old_doc_pattern, new_doc_repl, content)
print(f"Replaced doc specific prompt: {count1} matches")

# 2. Update integrateNLS and generateLessonPlan literature references (both of them)
old_lit_pattern = r"2\.\s+ĐỐI\s+VỚI\s+NGỮ\s+VĂN\s+\(LITERATURE\s+&\s+READING\s+COMPREHENSION\)\:\n(\s*)-\s+BẮT\s+BUỘC\s+dựa\s+vào"

def replace_lit(match):
    indent = match.group(1)
    return f"""2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
{indent}- BẮT BUỘC dựa vào gợi ý hoạt động trong Sách giáo viên Ngữ văn lớp 10, lớp 11, lớp 12 (Bộ sách Kết nối tri thức với cuộc sống) để triển khai chi tiết cho các nội dung hoạt động cụ thể (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) theo đúng cấu trúc Công văn 5512.
{indent}- Khi biên soạn KHBD liên quan đến Kỹ năng đọc hiểu văn bản, bạn bắt buộc phải tham khảo 02 nguồn tài liệu theo thứ tự ưu tiên sau:
{indent}  + Thứ nhất: Sách Giáo Viên (SGV) Ngữ văn lớp 10, lớp 11, lớp 12 (bộ sách Kết nối tri thức với cuộc sống).
{indent}  + Thứ hai: Các giáo án lớp 10, lớp 11, lớp 12 trong thư mục "MON NGU VAN-NEW".
{indent}- BẮT BUỘC dựa vào""" # we keep the - BẮT BUỘC so it matches and doesn't duplicate the first bullet

# Wait, let's look at the original text around old_lit_pattern:
# "- BẮT BUỘC dựa vào gợi ý hoạt động... \n - Các hoạt động học tập phát triển..."
# So if we replace:
# "2. ĐỐI VỚI NGỮ VĂN... \n - BẮT BUỘC dựa vào"
# with:
# "2. ĐỐI VỚI NGỮ VĂN... \n - Khi biên soạn KHBD... \n - BẮT BUỘC dựa vào"
# It will insert our text cleanly!
# Let's do that:
old_lit_pattern = r"2\.\s+ĐỐI\s+VỚI\s+NGỮ\s+VĂN\s+\(LITERATURE\s+&\s+READING\s+COMPREHENSION\)\:\n(\s*)-\s+BẮT\s+BUỘC\s+dựa\s+vào"
new_lit_repl = r"""2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
\1- Khi biên soạn KHBD liên quan đến Kỹ năng đọc hiểu văn bản, bạn bắt buộc phải tham khảo 02 nguồn tài liệu theo thứ tự ưu tiên sau:
\1  + Thứ nhất: Sách Giáo Viên (SGV) Ngữ văn lớp 10, lớp 11, lớp 12 (bộ sách Kết nối tri thức với cuộc sống).
\1  + Thứ hai: Các giáo án lớp 10, lớp 11, lớp 12 trong thư mục "MON NGU VAN-NEW".
\1- BẮT BUỘC dựa vào"""

content, count2 = re.subn(old_lit_pattern, new_lit_repl, content)
print(f"Replaced literature references: {count2} matches")

if count1 == 0 or count2 == 0:
    print("Error: Replaces failed!")
    sys.exit(1)

# Restore CRLF if needed
if "\r\n" in open(service_path, "r", encoding="utf-8").read():
    content = content.replace("\n", "\r\n")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully with regex!")
