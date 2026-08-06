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

# 1. Update isDoc specific prompt in generateLessonPlan
old_doc_part = """    if (isDoc) {
      skillSpecificPrompt = `
    HÌNH THỨC TRÌNH BÀY ĐỀ MỤC BẮT BUỘC ĐỐI VỚI TIẾT DẠY LIÊN QUAN KỸ NĂNG ĐỌC HIỂU VĂN BẢN (DỰA THEO HÌNH THỨC CỦA FILE "KHBD  DOC VAN BAN.pdf"):
    Trong mục "III. TIẾN TRÌNH DẠY HỌC", cấu trúc các hoạt động và đề mục phải được trình bày chính xác như sau:"""

new_doc_part = """    if (isDoc) {
      skillSpecificPrompt = `
    NGUỒN THAM KHẢO VÀ THỨ TỰ ƯU TIÊN KHI BIÊN SOẠN KỸ NĂNG ĐỌC HIỂU VĂN BẢN:
    - Khi biên soạn KHBD liên quan đến Kỹ năng đọc hiểu văn bản, bạn bắt buộc phải tham khảo 02 nguồn tài liệu theo thứ tự ưu tiên sau:
      + Thứ nhất: Sách Giáo Viên (SGV) Ngữ văn lớp 10, lớp 11, lớp 12 (bộ sách Kết nối tri thức với cuộc sống).
      + Thứ hai: Các giáo án lớp 10, lớp 11, lớp 12 trong thư mục "MON NGU VAN-NEW".

    HÌNH THỨC TRÌNH BÀY ĐỀ MỤC BẮT BUỘC ĐỐI VỚI TIẾT DẠY LIÊN QUAN KỸ NĂNG ĐỌC HIỂU VĂN BẢN (DỰA THEO HÌNH THỨC CỦA FILE "KHBD  DOC VAN BAN.pdf"):
    Trong mục "III. TIẾN TRÌNH DẠY HỌC", cấu trúc các hoạt động và đề mục phải được trình bày chính xác như sau:"""

if old_doc_part in content:
    content = content.replace(old_doc_part, new_doc_part)
    print("Updated doc specific prompt in generateLessonPlan")
else:
    print("Failed to find old_doc_part")
    sys.exit(1)

# 2. Update integrateNLS literature references
old_nls_lit = """      2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
          - BẮT BUỘC dựa vào gợi ý hoạt động trong Sách giáo viên Ngữ văn lớp 10, lớp 11, lớp 12 (Bộ sách Kết nối tri thức với cuộc sống) để triển khai chi tiết cho các nội dung hoạt động cụ thể (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) theo đúng cấu trúc Công văn 5512.
          - Các hoạt động học tập phát triển kỹ năng: Đọc văn bản, Thực hành tiếng Việt, Viết, Nói và Nghe trong KHBD phải bảo đảm biên soạn đúng theo các Yêu cầu cần đạt được quy định trong chương trình GDPT 2018 môn Ngữ văn đối với từng khối lớp tương ứng (đáp ứng đúng đặc trưng thể loại đọc hiểu, kiểu văn bản viết, và chuẩn kiến thức tiếng Việt, nói nghe)."""

new_nls_lit = """      2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
          - BẮT BUỘC dựa vào gợi ý hoạt động trong Sách giáo viên Ngữ văn lớp 10, lớp 11, lớp 12 (Bộ sách Kết nối tri thức với cuộc sống) để triển khai chi tiết cho các nội dung hoạt động cụ thể (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) theo đúng cấu trúc Công văn 5512.
          - Khi biên soạn KHBD liên quan đến Kỹ năng đọc hiểu văn bản, bạn bắt buộc phải tham khảo 02 nguồn tài liệu theo thứ tự ưu tiên sau:
            + Thứ nhất: Sách Giáo Viên (SGV) Ngữ văn lớp 10, lớp 11, lớp 12 (bộ sách Kết nối tri thức với cuộc sống).
            + Thứ hai: Các giáo án lớp 10, lớp 11, lớp 12 trong thư mục "MON NGU VAN-NEW".
          - Các hoạt động học tập phát triển kỹ năng: Đọc văn bản, Thực hành tiếng Việt, Viết, Nói và Nghe trong KHBD phải bảo đảm biên soạn đúng theo các Yêu cầu cần đạt được quy định trong chương trình GDPT 2018 môn Ngữ văn đối với từng khối lớp tương ứng (đáp ứng đúng đặc trưng thể loại đọc hiểu, kiểu văn bản viết, và chuẩn kiến thức tiếng Việt, nói nghe)."""

if old_nls_lit in content:
    content = content.replace(old_nls_lit, new_nls_lit)
    print("Updated integrateNLS literature references")
else:
    print("Failed to find old_nls_lit")
    sys.exit(1)

# 3. Update generateLessonPlan literature references
old_gen_lit = """      2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
         - BẮT BUỘC dựa vào gợi ý hoạt động trong Sách giáo viên Ngữ văn lớp 10, lớp 11, lớp 12 (Bộ sách Kết nối tri thức với cuộc sống) để triển khai chi tiết cho các nội dung hoạt động cụ thể (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) theo đúng cấu trúc Công văn 5512.
         - Các hoạt động học tập phát triển kỹ năng: Đọc văn bản, Thực hành tiếng Việt, Viết, Nói và Nghe trong KHBD phải bảo đảm biên soạn đúng theo các Yêu cầu cần đạt được quy định trong chương trình GDPT 2018 môn Ngữ văn đối với từng khối lớp tương ứng (đáp ứng đúng đặc trưng thể loại đọc hiểu, kiểu văn bản viết, và chuẩn kiến thức tiếng Việt, nói nghe)."""

new_gen_lit = """      2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
         - BẮT BUỘC dựa vào gợi ý hoạt động trong Sách giáo viên Ngữ văn lớp 10, lớp 11, lớp 12 (Bộ sách Kết nối tri thức với cuộc sống) để triển khai chi tiết cho các nội dung hoạt động cụ thể (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) theo đúng cấu trúc Công văn 5512.
         - Khi biên soạn KHBD liên quan đến Kỹ năng đọc hiểu văn bản, bạn bắt buộc phải tham khảo 02 nguồn tài liệu theo thứ tự ưu tiên sau:
           + Thứ nhất: Sách Giáo Viên (SGV) Ngữ văn lớp 10, lớp 11, lớp 12 (bộ sách Kết nối tri thức với cuộc sống).
           + Thứ hai: Các giáo án lớp 10, lớp 11, lớp 12 trong thư mục "MON NGU VAN-NEW".
         - Các hoạt động học tập phát triển kỹ năng: Đọc văn bản, Thực hành tiếng Việt, Viết, Nói và Nghe trong KHBD phải bảo đảm biên soạn đúng theo các Yêu cầu cần đạt được quy định trong chương trình GDPT 2018 môn Ngữ văn đối với từng khối lớp tương ứng (đáp ứng đúng đặc trưng thể loại đọc hiểu, kiểu văn bản viết, và chuẩn kiến thức tiếng Việt, nói nghe)."""

if old_gen_lit in content:
    content = content.replace(old_gen_lit, new_gen_lit)
    print("Updated generateLessonPlan literature references")
else:
    print("Failed to find old_gen_lit")
    sys.exit(1)

# Restore original endings
if original_endings == "\r\n":
    content = content.replace("\n", "\r\n")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully!")
