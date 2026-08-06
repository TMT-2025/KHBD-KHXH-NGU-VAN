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

old_gen_header = """export async function generateLessonPlan(lessonName: string, periods: number, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const isLiterature = subject === 'Ngữ văn';
  const assessmentPromptPart = isLiterature ? "" : `
    IV. KẾ HOẠCH ĐÁNH GIÁ (nếu có)
    - Xây dựng tiêu chí đánh giá tích hợp AI: kỹ năng tương tác prompt, kiểm chứng dữ liệu, phản biện thiên kiến, thái độ chịu trách nhiệm và trích dẫn trung thực.
  `;
  const luyenTapHeader = isLiterature ? "IV. HOẠT ĐỘNG LUYỆN TẬP" : "V. HOẠT ĐỘNG LUYỆN TẬP";
  const vanDungHeader = isLiterature ? "V. HOẠT ĐỘNG VẬN DỤNG" : "VI. HOẠT ĐỘNG VẬN DỤNG";
  const phieuHocTapHeader = isLiterature ? "VI. CÁC PHIẾU HỌC TẬP" : "VII. CÁC PHIẾU HỌC TẬP";

  const prompt = `"""

new_gen_header = """export async function generateLessonPlan(lessonName: string, periods: number, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const isLiterature = subject === 'Ngữ văn';
  const assessmentPromptPart = isLiterature ? "" : `
    IV. KẾ HOẠCH ĐÁNH GIÁ (nếu có)
    - Xây dựng tiêu chí đánh giá tích hợp AI: kỹ năng tương tác prompt, kiểm chứng dữ liệu, phản biện thiên kiến, thái độ chịu trách nhiệm và trích dẫn trung thực.
  `;
  const luyenTapHeader = isLiterature ? "IV. HOẠT ĐỘNG LUYỆN TẬP" : "V. HOẠT ĐỘNG LUYỆN TẬP";
  const vanDungHeader = isLiterature ? "V. HOẠT ĐỘNG VẬN DỤNG" : "VI. HOẠT ĐỘNG VẬN DỤNG";
  const phieuHocTapHeader = isLiterature ? "VI. CÁC PHIẾU HỌC TẬP" : "VII. CÁC PHIẾU HỌC TẬP";

  const isDoc = lessonName.toLowerCase().includes('đọc:') || (lessonName.toLowerCase().includes('đọc') && !lessonName.toLowerCase().includes('thực hành đọc'));
  const isTiengViet = lessonName.toLowerCase().includes('tiếng việt');
  const isViet = lessonName.toLowerCase().includes('viết');
  const isNoiNghe = lessonName.toLowerCase().includes('nói và nghe');
  const isThucHanhDoc = lessonName.toLowerCase().includes('thực hành đọc');

  let skillSpecificPrompt = "";
  if (isLiterature) {
    if (isDoc) {
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
      `;
    } else if (isTiengViet) {
      skillSpecificPrompt = `
    CẤU TRÚC BẮT BUỘC ĐỐI VỚI BÀI DẠY THỰC HÀNH TIẾNG VIỆT:
    Tiến trình tổ chức hoạt động dạy học phải bám sát các hoạt động lớn sau dưới mục "III. TIẾN TRÌNH DẠY HỌC":
    - 1. Hoạt động Củng cố / Hình thành kiến thức mới: Hướng dẫn học sinh nhắc lại lý thuyết tiếng Việt đã học ở phần Tri thức ngữ văn hoặc trong khung định nghĩa của SGK.
    - 2. Hoạt động Luyện tập (Hệ thống bài tập SGK): Thiết kế các hoạt động chi tiết tương ứng với từng bài tập trong sách giáo khoa (Bài tập 1, Bài tập 2, 3, 4...).
    - 3. Hoạt động Vận dụng: Thiết kế nhiệm vụ viết đoạn văn ngắn hoặc chỉ ra các lỗi tiếng Việt trong giao tiếp hàng ngày.
      `;
    } else if (isViet) {
      skillSpecificPrompt = `
    CẤU TRÚC BẮT BUỘC ĐỐI VỚI BÀI DẠY KỸ NĂNG VIẾT:
    KHBD phải bám sát quy trình tạo lập văn bản thực tế gồm các mục lớn sau:
    - I. MỤC TIÊU (Kiến thức, Năng lực, Phẩm chất)
    - II. NHỮNG LƯU Ý VỀ YÊU CẦU ĐỐI VỚI KIỂU BÀI (Hệ thống các tiêu chuẩn cốt lõi bắt buộc của kiểu bài như bố cục, luận điểm, lí lẽ, bằng chứng).
    - III. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU (Bao gồm công cụ số và AI)
    - IV. TIẾN TRÌNH DẠY VIẾT (bám sát quy trình Viết của SGK):
      + Hoạt động 1: Tìm hiểu yêu cầu của kiểu bài (nhận diện đặc điểm kiểu bài qua phần Yêu cầu trong SGK).
      + Hoạt động 2: Đọc và phân tích bài viết tham khảo (phân tích bài viết mẫu để học tập cách tổ chức luận điểm và diễn đạt).
      + Hoạt động 3: Thực hành viết theo các bước (Quy trình 4 bước):
        * Bước 1: Chuẩn bị viết (Lựa chọn đề tài, mục đích, người đọc, thu thập thông tin).
        * Bước 2: Tìm ý và lập dàn ý (Mở bài, Thân bài, Kết bài).
        * Bước 3: Viết bài (Thực hành viết nháp bám sát dàn ý).
        * Bước 4: Chỉnh sửa, hoàn thiện (rà soát lỗi theo tiêu chí đối chiếu).
      + Hoạt động 4: Trả bài (Nhận xét và sửa lỗi): Nhận xét ưu - khuyết điểm chung và hướng dẫn học sinh sửa lỗi cụ thể.
      `;
    } else if (isNoiNghe) {
      skillSpecificPrompt = `
    CẤU TRÚC BẮT BUỘC ĐỐI VỚI BÀI DẠY KỸ NĂNG NÓI VÀ NGHE:
    Tiến trình tổ chức phải thể hiện rõ sự tương tác và vai trò tích cực của cả người nói lẫn người nghe với các hoạt động lớn sau dưới mục "III. TIẾN TRÌNH DẠY HỌC":
    - Hoạt động 1: Chuẩn bị nói và nghe:
      + Chuẩn bị của người nói (Lựa chọn đề tài, lập dàn ý tóm lược, từ khóa, phương tiện hỗ trợ slide, tranh ảnh).
      + Chuẩn bị của người nghe (Tìm hiểu chủ đề, tâm thế lắng nghe tích cực, sẵn sàng ghi chép ý chính và câu hỏi phản hồi).
    - Hoạt động 2: Thực hành nói và nghe:
      + Người nói trình bày bài nói sinh động kết hợp phi ngôn ngữ (cử chỉ, điệu bộ, ánh mắt...).
      + Người nghe lắng nghe, ghi chép ý chính, đánh giá tính thuyết phục.
    - Hoạt động 3: Trao đổi, thảo luận và đánh giá:
      + Trao đổi: Người nghe đặt câu hỏi, người nói phản hồi/giải trình xây dựng.
      + Đánh giá: Tự đánh giá và đánh giá chéo dựa trên bảng tiêu chí (Rubric) trong SGK.
      `;
    } else if (isThucHanhDoc) {
      skillSpecificPrompt = `
    CẤU TRÚC BẮT BUỘC ĐỐI VỚI BÀI DẠY THỰC HÀNH ĐỌC:
    KHBD trình bày ngắn gọn hướng dẫn tự học theo các mục lớn sau:
    - I. MỤC TIÊU
    - II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
    - III. TIẾN TRÌNH THỰC HÀNH ĐỌC (bám sát hướng dẫn tự học của SGK):
      + 1. Xác định định hướng tự đọc: Giúp học sinh tự đọc văn bản cùng thể loại để rèn luyện tính độc lập.
      + 2. Một số điều cần lưu ý khi đọc văn bản: Giáo viên đưa ra các gợi dẫn khái quát (vị trí đoạn trích, cốt truyện, nhân vật, ngôn ngữ...) và thiết kế Phiếu học tập định hướng tự đọc để học sinh tự hoàn thành hoặc thảo luận nhóm nhanh.
      + 3. Nghiệm thu sản phẩm đọc: Tổ chức cho học sinh chia sẻ kết quả tự đọc và phản hồi khái quát, tránh phân tích chi tiết bài bản như văn bản đọc chính.
      `;
    }
  }

  const prompt = `"""

if old_gen_header in content:
    content = content.replace(old_gen_header, new_gen_header)
    print("Successfully replaced generateLessonPlan header and added skill detection logic")
else:
    print("Failed to find old generateLessonPlan header")
    sys.exit(1)

# Now insert ${skillSpecificPrompt} inside the prompt string right after the task description
old_task_desc = """    Nhiệm vụ: Tạo một Kế hoạch bài dạy (KHBD) hoàn chỉnh cho bài học sau theo đúng mẫu Công văn 5512:
    - Tên bài: ${lessonName}
    - Số tiết: ${periods} tiết
    - Môn học: ${subject}
    - Khối lớp: ${grade}"""

new_task_desc = """    Nhiệm vụ: Tạo một Kế hoạch bài dạy (KHBD) hoàn chỉnh cho bài học sau theo đúng mẫu Công văn 5512:
    - Tên bài: ${lessonName}
    - Số tiết: ${periods} tiết
    - Môn học: ${subject}
    - Khối lớp: ${grade}
    
    ${skillSpecificPrompt}"""

if old_task_desc in content:
    content = content.replace(old_task_desc, new_task_desc)
    print("Successfully inserted skillSpecificPrompt placeholder in the prompt")
else:
    print("Failed to find old task description inside the prompt")
    sys.exit(1)

# Restore original endings
if original_endings == "\r\n":
    content = content.replace("\n", "\r\n")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("All prompt updates executed successfully!")
