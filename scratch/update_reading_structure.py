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

old_doc_part = """    if (isDoc) {
      skillSpecificPrompt = `
    CẤU TRÚC BẮT BUỘC ĐỐI VỚI BÀI DẠY KỸ NĂNG ĐỌC (ĐỌC HIỂU VĂN BẢN):
    Tiến trình dạy học phải bám sát Sách giáo viên Ngữ văn và quy trình 5512 với các hoạt động lớn sau dưới mục "III. TIẾN TRÌNH DẠY HỌC":
    - 1. Hoạt động Khởi động: Thiết kế câu hỏi gợi mở, huy động trải nghiệm, bối cảnh để tạo tâm thế vào bài học.
    - 2. Hoạt động Đọc văn bản: Hướng dẫn học sinh đọc trực tiếp và vận dụng các chiến lược đọc (theo dõi, dự đoán, hình dung, suy luận) qua các hộp chỉ dẫn ở lề phải trang sách.
    - 3. Hoạt động Khám phá văn bản (sau khi đọc): Phân tích chi tiết bám sát câu hỏi SGK, bắt buộc phải chia rõ thành 3 đề mục con bên trong hoạt động:
      + Tìm hiểu chung: Tác giả, tác phẩm, thể loại.
      + Phân tích chi tiết: Chia nhỏ theo các khía cạnh nội dung và đặc trưng hình thức thể loại.
      + Tổng kết: Giá trị nội dung và nghệ thuật của văn bản.
    - 4. Hoạt động Kết nối đọc - viết: Hướng dẫn học sinh viết đoạn văn ngắn khoảng 150 chữ chia sẻ cảm nhận hoặc bàn về một chi tiết ý nghĩa trong văn bản vừa đọc.
      `;"""

new_doc_part = """    if (isDoc) {
      skillSpecificPrompt = `
    HÌNH THỨC TRÌNH BÀY ĐỀ MỤC BẮT BUỘC ĐỐI VỚI TIẾT DẠY LIÊN QUAN KỸ NĂNG ĐỌC HIỂU VĂN BẢN (DỰA THEO HÌNH THỨC CỦA FILE "KHBD  DOC VAN BAN.pdf"):
    Trong mục "III. TIẾN TRÌNH DẠY HỌC", cấu trúc các hoạt động và đề mục phải được trình bày chính xác như sau:
    
    1) Hoạt động 1: Khởi động (gồm các phần a, b, c, d)
    
    2) Hoạt động 2: Đọc và Khám phá văn bản (hoặc Đọc và Tìm hiểu khái quát bối cảnh, tác giả, tác phẩm)
       Bên trong Hoạt động 2, chia thành các Nội dung sau:
       
       - Nội dung 1: Tìm hiểu tri thức ngữ văn (nếu bài học có phần giới thiệu tri thức thể loại/kiến thức mới cần tìm hiểu riêng, bao gồm các phần a, b, c, d)
       
       - Nội dung 2: Đọc văn bản
         Nội dung này bắt buộc phải chia rõ thành 3 tiểu mục con với các đề mục và nội dung cụ thể sau:
         
         2.1. Tìm hiểu khái quát
         a) Mục tiêu: Nắm bắt được các kiến thức chung về tác giả, hoàn cảnh xã hội đương thời, bối cảnh ra đời của tác phẩm/đoạn trích và chuẩn bị các điều kiện cần thiết để đọc hiểu văn bản, hướng dẫn đọc và rèn luyện các chiến thuật đọc.
         b) Nội dung: HS sử dụng SGK, chắt lọc kiến thức để tiến hành trả lời câu hỏi liên quan đến nội dung bài học.
         c) Sản phẩm: HS tiếp thu kiến thức và câu trả lời của GV.
         d) Tổ chức thực hiện: Tổ chức hoạt động dạy học theo quy trình 4 bước (Chuyển giao nhiệm vụ -> Thực hiện nhiệm vụ -> Báo cáo, thảo luận -> Đánh giá, kết luận).
         
         2.2. Khám phá văn bản
         a) Mục tiêu: Chỉ ra và phân tích được một số nét đặc trưng của thể loại (ví dụ: nghệ thuật trào phúng, tình huống và nhân vật trào phúng, điểm nhìn người kể chuyện, miêu tả đặc thù ngôn ngữ nhân vật...) thể hiện qua văn bản.
         b) Nội dung: Tập trung làm rõ các khía cạnh phân tích chi tiết văn bản (như Câu chuyện, sự kiện, tình huống, nhân vật, người kể chuyện, điểm nhìn, ngôn ngữ, nghệ thuật phong cách tác giả) qua các nhiệm vụ cụ thể.
         c) Sản phẩm: Kết quả thực hiện của học sinh được ghi vào vở học hoặc phiếu học tập.
         d) Tổ chức thực hiện: Tổ chức hoạt động dạy học theo quy trình 4-bước 5512.
         
         2.3. Tổng kết
         a) Mục tiêu: Nhận biết và phân tích được chủ đề, giá trị hiện thực/nhân đạo, các nét nghệ thuật đặc sắc của đoạn trích/văn bản và rút ra phương pháp đọc hiểu văn bản theo thể loại đó.
         b) Nội dung: HS trả lời các câu hỏi tổng kết về chủ đề, giá trị nghệ thuật, các dấu hiệu thể loại đặc trưng và cách đọc hiểu văn bản thể loại đó.
         c) Sản phẩm: Bảng tổng kết, sơ đồ tư duy hoặc câu trả lời của học sinh được ghi vào vở.
         d) Tổ chức thực hiện: Tổ chức hoạt động dạy học theo quy trình 4-bước 5512.
         
    3) Hoạt động 3: Kết nối đọc - viết (gồm các phần a, b, c, d hướng dẫn học sinh viết đoạn văn ngắn khoảng 150 chữ chia sẻ cảm nhận hoặc bàn về một chi tiết ý nghĩa trong văn bản).
      `;"""

if old_doc_part in content:
    content = content.replace(old_doc_part, new_doc_part)
    print("Successfully updated isDoc prompt structure in geminiService.ts")
else:
    print("Failed to find old isDoc prompt block in geminiService.ts")
    sys.exit(1)

# Restore original endings
if original_endings == "\r\n":
    content = content.replace("\n", "\r\n")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully!")
