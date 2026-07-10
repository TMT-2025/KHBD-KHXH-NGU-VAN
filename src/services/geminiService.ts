import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * Helper to call Gemini API with retry logic for rate limiting (429), spikes in demand (503),
 * status UNAVAILABLE, and dynamic model fallback.
 */
async function callAIWithRetry(prompt: string, modelName = "gemini-3.5-flash", maxRetries = 6) {
  let lastError: any;
  let currentModel = modelName;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const config: any = {};
      // Set thinking level if the model is a standard Gemini 3/3.5/3.x series pro/flash model and not lite
      if (currentModel.startsWith("gemini-3") && !currentModel.includes("lite")) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: config,
      });
      return response;
    } catch (error: any) {
      lastError = error;
      const errorMessage = String(error?.message || "").toLowerCase();
      const errorStatus = String(error?.status || "").toLowerCase();
      const errorCode = String(error?.code || "");
      
      const isRateLimit = errorMessage.includes("429") || 
                          errorMessage.includes("resource_exhausted") || 
                          errorMessage.includes("quota") || 
                          errorMessage.includes("limit") ||
                          errorStatus.includes("resource_exhausted");
                          
      const isUnavailable = errorMessage.includes("503") || 
                             errorMessage.includes("unavailable") || 
                             errorMessage.includes("demand") || 
                             errorMessage.includes("clogged") ||
                             errorMessage.includes("busy") ||
                             errorMessage.includes("overload") ||
                             errorMessage.includes("temporary") ||
                             errorMessage.includes("try again") ||
                             errorStatus.includes("unavailable") ||
                             errorCode === "503";

      const isRetryable = isRateLimit || isUnavailable;
      
      if (isRetryable) {
        // If we are at attempt >= 2, fall back to help bypass queue limits/congestion
        if (i >= 2) {
          if (currentModel === "gemini-3.5-flash") {
            currentModel = "gemini-3.1-flash-lite"; // Lighter, high capacity, low latency
            console.warn(`Model ${modelName} is busy/overloaded. Falling back to robust model ${currentModel} to ensure completion...`);
          } else if (currentModel === "gemini-3.1-flash-lite") {
            currentModel = "gemini-3-flash-preview";
            console.warn(`Fallback model busy. Trying ${currentModel} as third alternative...`);
          }
        }
        
        // Calculate wait time with exponential backoff + random jitter
        const waitTime = Math.pow(2, i) * 1500 + Math.random() * 1500;
        console.warn(`Gemini API retryable error (${errorStatus || 'Status: ' + errorCode}). Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries}, Model: ${currentModel})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For non-retryable errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

export const NLS_FRAMEWORK = {
  domains: [
    { id: "1", name: "Khai thác dữ liệu và thông tin", sub: ["1.1. Duyệt, tìm kiếm và lọc", "1.2. Đánh giá dữ liệu", "1.3. Quản lý dữ liệu"] },
    { id: "2", name: "Giao tiếp và hợp tác trong môi trường số", sub: ["2.1. Tương tác", "2.2. Chia sẻ", "2.3. Trách nhiệm công dân", "2.4. Hợp tác", "2.5. Nghi thức số", "2.6. Danh tính số"] },
    { id: "3", name: "Sáng tạo nội dung số", sub: ["3.1. Phát triển nội dung", "3.2. Tích hợp và tái lập", "3.3. Bản quyền và giấy phép", "3.4. Lập trình"] },
    { id: "4", name: "An toàn", sub: ["4.1. Bảo vệ thiết bị", "4.2. Bảo vệ dữ liệu cá nhân", "4.3. Bảo vệ sức khỏe", "4.4. Bảo vệ môi trường"] },
    { id: "5", name: "Giải quyết vấn đề", sub: ["5.1. Giải quyết vấn đề kỹ thuật", "5.2. Xác định nhu cầu và giải pháp", "5.3. Sáng tạo công nghệ số", "5.4. Cải thiện năng lực số"] },
    { id: "6", name: "Ứng dụng trí tuệ nhân tạo", sub: ["6.1. Hiểu biết về AI", "6.2. Sử dụng AI có đạo đức", "6.3. Đánh giá công cụ AI"] }
  ],
  levelCode: "NC1", // Nâng cao 1 cho khối THPT
  levelName: "Nâng cao 1 (Lớp 10, 11, 12)"
};

export async function integrateNLS(content: string, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const prompt = `
    Bạn là một chuyên gia giáo dục và Trợ lý Giáo viên cấp cao tại Việt Nam, am hiểu Công văn 5512, Thông tư 02/2025/TT-BGDĐT quy định Khung năng lực số cho người học (trong đó AI là miền năng lực thứ sáu), Quyết định 3439/QĐ-BGDĐT ban hành Khung nội dung thí điểm giáo dục Trí tuệ nhân tạo cho học sinh phổ thông và Công văn 8334/BGDĐT-GDPT hướng dẫn triển khai thực hiện thí điểm nội dung giáo dục Trí tuệ nhân tạo cho học sinh phổ thông.
    
    Nhiệm vụ: Phân tích kế hoạch bài dạy (KHBD) môn ${subject} khối ${grade} dưới đây và bổ sung Tích hợp NNLS (Năng lực số) và Giáo dục AI (Trí tuệ nhân tạo) một cách logic, khả thi, bám sát các văn bản quy định.
    
    Hãy tuân thủ các chỉ dẫn tích hợp giáo dục AI cốt lõi:
    - Không làm thay đổi mục tiêu môn học, không gây quá tải cho học sinh, không dạy lập trình hay thuật toán chuyên sâu (không lạm dụng kỹ thuật) mà tập trung vào "Dạy cách đánh giá - kiểm soát - sử dụng AI", thể hiện rõ giáo dục AI theo hướng đạo đức và trách nhiệm.
    
    Các bổ sung cụ thể theo Công văn số 5512/BGDĐT-GDTrH:
    1. Trong "I. MỤC TIÊU": 
       - Giữ nguyên các năng lực đặc thù và phẩm chất môn học gốc.
       - Sửa đổi hoặc bổ sung mục "3. Năng lực số và Trí tuệ nhân tạo (AI)":
         + Liệt kê rõ các năng lực số miền sáu (6.1. Hiểu biết về AI, 6.2. Sử dụng AI có đạo đức, 6.3. Đánh giá công cụ AI) theo chuẩn chỉ báo [Mã miền].[Mã nhánh].${NLS_FRAMEWORK.levelCode}[a/b/c...]. Ví dụ: 6.1.${NLS_FRAMEWORK.levelCode}a, 6.2.${NLS_FRAMEWORK.levelCode}b.
         + BẮT BUỘC MÃ HÓA NĂNG LỰC AI THÀNH PHẦN CHI TIẾT theo Quyết định 3439 và Công văn 8334: Ghép [Khối_lớp].[Mã_chủ_đề][Biểu_hiện] (Ví dụ: 10.A1b, 11.C2a, 12.D2b). QUY TẮC PHẢI TUÂN THỦ: Toàn bộ các mã năng lực số và năng lực học liệu AI (ví dụ: 6.1.NC1a, 12.C2a...) luôn phải được viết dưới dạng văn bản thường bình thường hoàn toàn, tuyệt đối không được bao bọc trong và không sử dụng các dấu nháy ngược khép kín (\`...\`) hay định dạng code block inline.
           * Trong đó:
             - Mã khối lớp: 10, 11 hoặc 12 (ví dụ: học sinh lớp 11 dùng mã 11).
             - Thành phần năng lực đặc thù và mạch kiến thức/chủ đề cốt lõi (A, B, C, D) tương ứng: Ký hiệu là NLa - Chủ đề A (Nhận thức AI), NLb - Chủ đề B (Kiểm soát AI/Đạo đức), NLc - Chủ đề C (Ứng dụng AI), NLd - Chủ đề D (Thiết kế/Giải quyết vấn đề với AI).
             - Ví dụ các chủ đề con: A1, B1, C1, C2, D1, D2.
             - Biểu hiện chi tiết: Kí hiệu chữ cái thường (a, b, c...).
             - Giải thích chi tiết mã chỉ báo năng lực AI: Ví dụ "11.C2a" (hoặc 11C2a) chỉ định một biểu hiện chi tiết (kí hiệu "a") nằm trong Chủ đề C2 (Ứng dụng AI) dành cho học sinh lớp 11; "10.A1b" chỉ định biểu hiện "b" của Chủ đề A1 dành cho lớp 10; "12.D2b" chỉ định biểu hiện "b" của Chủ đề D2 dành cho học sinh lớp 12.
             - Việc ghi mã chi tiết đến từng chữ cái giúp giáo viên xác định chính xác mục tiêu giảng dạy, tổ chức thực hành, dự án AI và đánh giá học sinh sát sao nhất.
    2. Trong "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU":
       - Bổ sung thêm tiểu mục “Công cụ số và AI”. Trong phần này phải trình bày rõ:
         * Phương án triển khai: Học sinh sẽ thực hành sử dụng công cụ AI trực tiếp hay chỉ thảo luận thông qua các tình huống giả định (case study).
         * Học liệu/công cụ cụ thể: Liệt kê rõ tên phần mềm, nền tảng ứng dụng AI sẽ sử dụng (ví dụ: Google AI Studio, Gemini, Canva AI, Teachable Machine...), hoặc các bài báo, video phân tích, ảnh chụp màn hình, tình huống giả định đã chuẩn bị sẵn.
    3. Trong "III. TIẾN TRÌNH DẠY HỌC":
       - PHÂN BỔ TIẾT HỌC: Nếu KHBD gốc có nhiều tiết, hãy chia rõ nội dung cho từng tiết. Mỗi tiết bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (viết hoa, in đậm, căn giữa). 
       - QUY TẮC BẮT BUỘC CHO NHIỀU TIẾT: Đối với bài dạy nhiều tiết (ví dụ: bài học 2, 3, 4 tiết, hay thậm chí 11, 12, 15 tiết...), bạn phải thực hiện thiết kế chi tiết tất cả các hoạt động cho từng tiết. TUYỆT ĐỐI không tóm tắt sơ sài hay gom cụm các tiết sau. TẤT CẢ các hoạt động học ở tất cả các tiết (từ Tiết 1 đến Tiết cuối cùng) đều PHẢI ĐƯỢC THIẾT KẾ ĐẦY ĐỦ VÀ CHI TIẾT THEO CẤU TRÚC 4 PHẦN (a, b, c, d) DƯỚI ĐÂY.
        - CẤM TÓM TẮT HOẶC VIẾT GHI CHÚ LƯỢC BỚT: NGHIÊM CẤM TUYỆT ĐỐI việc viết các câu lược trích hoặc để ghi chú trống bằng tiếng Việt như: "(Do giới hạn dung lượng, tôi xin lược trích...)", "(Lưu ý: Giáo viên cần tự điều chỉnh thời lượng...)", hoặc bất kỳ câu nào khuyên giáo viên tự điền. Bạn BẮT BUỘC phải viết chi tiết đầy đủ 100% tất cả các tiết học từ Tiết 1 đến Tiết cuối cùng.
       - Đảm bảo thiết kế các hoạt động chi tiết cực kỳ chuẩn chỉ bám sát CV5512, thể hiện đầy đủ các mục cho TẤT CẢ các hoạt động trong mọi tiết học:
         a) Mục tiêu: Xác định rõ yêu cầu kiến thức/kỹ năng cần đạt của hoạt động đó.
         b) Nội dung: Giao nhiệm vụ, câu hỏi, bài tập cụ thể, nhiệm vụ học tập đầy đủ cho học sinh.
         c) Sản phẩm: Kết quả bài làm của học sinh (đáp án chi tiết, bảng biểu đã điền, ý kiến trả lời cụ thể, bài trình bày...), đảm bảo độ phân giải vật lý cao nhất của sản phẩm mẫu, tuyệt đối không viết chung chung đại khái.
                   d) Tổ chức thực hiện: Thiết kế bắt buộc dưới dạng bảng Markdown có cấu trúc 2 cột cụ thể như sau. Nhấn mạnh chỉ thay đổi ở mục d) Tổ chức thực hiện, các phần khác trong KHBD giữ nguyên.
              * QUY TẮC BẮT BUỘC 1: Ngay dưới tiêu đề "d) Tổ chức thực hiện:" và ngay phía trên bảng, phải ghi rõ phương pháp/kỹ thuật dạy học tích cực được áp dụng (ví dụ: Kỹ thuật KWL, Áp dụng Brainstorming, Think-Pair-Share, Khăn trải bàn, Mảnh ghép, Trạm xoay, PBL, Tranh luận, Bể cá...). Ví dụ: **[Phương pháp áp dụng: Khăn trải bàn & Trạm xoay]** hoặc **[Phương pháp áp dụng: Sơ đồ tư duy trên Bảng tương tác]**.
              * QUY TẮC BẮT BUỘC 2: Trong các bước Giao nhiệm vụ, Thực hiện nhiệm vụ, Báo cáo - thảo luận, phải ghi cụ thể hành động học sinh/giáo viên sử dụng bảng tương tác (Smart Board) và các ứng dụng trực tuyến như Kahoot!, Quizizz, Blooket, Padlet, Mentimeter... để thực hành/báo cáo sản phẩm.
              * QUY TẮC BẮT BUỘC 3: Bảng có đúng 2 cột mang tên: "Hoạt động của GV và HS" và "Sản phẩm dự kiến". Cột thứ nhất "Hoạt động của GV và HS" phải có đầy đủ 4 bước như mẫu dưới đây (sử dụng thẻ <br> để ngăn cách các dòng/ý hành động của giáo viên và học sinh trong ô):
                - **Bước 1: Chuyển giao nhiệm vụ học tập** <br> (GV giao nhiệm vụ cụ thể, câu hỏi/nhiệm vụ học tập, thời gian, học liệu số và hình thức làm việc. Ghi rõ cách GV sử dụng bảng tương tác hoặc các công cụ trực tuyến như Kahoot!, Quizizz, Blooket, Padlet, Mentimeter... để giao nhiệm vụ hoặc khởi động).
                - **Bước 2: Thực hiện nhiệm vụ** <br> (HS thực hiện nhiệm vụ cá nhân/cặp/nhóm; GV theo dõi, hỗ trợ. Tích hợp NLS và AI: Mô tả HS dùng công cụ số/AI để tra cứu dữ liệu, tương tác prompt, kiểm chứng thông tin với mã năng lực số NC1 và mã AI chi tiết (10.A1b, 11.C2a, 12.D2b...) viết dưới dạng văn bản thường không chứa dấu nháy ngược).
                - **Bước 3: Báo cáo kết quả và thảo luận** <br> HS trả lời câu hỏi. <br> Gv quan sát, hỗ trợ, tư vấn <br> (HS báo cáo kết quả thông qua sản phẩm số, phản hồi/trình bày trực tiếp trên bảng tương tác hoặc qua ứng dụng như Padlet, Mentimeter...; HS nhóm khác phản biện, thảo luận; GV điều hành).
                - **Bước 4: Nhận xét, đánh giá kết quả thực hiện nhiệm vụ** <br> GV: nhận xét đánh giá kết quả của các cá nhân, chuẩn hóa kiến thức. <br> (GV đánh giá tinh thần làm việc, sản phẩm của HS, chốt kiến thức cốt lõi và chuyển giao nhiệm vụ tiếp theo).
              * QUY TẮC BẮT BUỘC 4: Trong cột "Sản phẩm dự kiến", bạn PHẢI trình bày kết quả học tập THỰC TẾ, CỰC KỲ CHI TIẾT, HỆ THỐNG và TĂNG DUNG LƯỢNG NỘI DUNG/SỐ LƯỢNG CHỮ đến mức tối đa để làm tài liệu chuẩn mực cho giáo viên (tham khảo phong cách chi tiết của tài liệu TD.pdf). Tránh tuyệt đối viết ngắn gọn, khái quát, sơ sài hoặc hời hợt để giáo viên có thể dùng trực tiếp để dạy học thực tế trên lớp. Ví dụ: Phân tích hành động đốt đền của Tử Văn hay nhân vật phải được phân tích sâu sắc thành các luận điểm cụ thể, phân tích chi tiết ý nghĩa văn học với dung lượng chữ nhiều, đầy đủ lập luận nghệ thuật và nội dung. Thay vì viết "Sản phẩm trên Padlet: Viết đoạn văn ngắn 5-7 câu sử dụng ít nhất 3 từ Hán Việt.", bạn phải VIẾT RA ĐOẠN VĂN MẪU THỰC TẾ dài 5-7 câu có sử dụng ít nhất 3 từ Hán Việt đó. Nếu có bảng so sánh nhân vật (ví dụ: bảng so sánh Ngô Tử Văn và Hồn ma tên tướng giặc), bạn PHẢI viết đầy đủ nội dung đáp án chi tiết cho cột ý nghĩa/nội dung so sánh trực tiếp trong bảng của cột Sản phẩm dự kiến.
              * QUY TẮC BẮT BUỘC 5: Mỗi hoạt động học phải bắt đầu bằng tiêu đề Hoạt động độc lập bên ngoài bảng. Các mục a) Mục tiêu, b) Nội dung, c) Sản phẩm bắt buộc viết dưới dạng văn bản thông thường ngoài bảng, KHÔNG ĐƯỢC đưa vào trong bảng. Chỉ riêng mục d) Tổ chức thực hiện mới được trình bày dưới dạng bảng 2 cột.
              
              | Hoạt động của GV và HS | Sản phẩm dự kiến |
              | :--- | :--- |
              | **Bước 1: Chuyển giao nhiệm vụ học tập** <br> GV giao nhiệm vụ học tập rõ ràng, nêu yêu cầu, thời gian, học liệu số và hình thức làm việc. Nêu cách GV sử dụng bảng tương tác hoặc các công cụ trực tuyến (Kahoot!, Quizizz, Blooket, Padlet, Mentimeter...) để khởi động hoặc giao nhiệm vụ học tập. <br><br> **Bước 2: Thực hiện nhiệm vụ** <br> HS thực hiện nhiệm vụ (cá nhân/cặp/nhóm); GV theo dõi, hỗ trợ. [BẮT BUỘC Tích hợp NLS và AI: Mô tả HS dùng công cụ số/AI để tra cứu dữ liệu, tương tác prompt, kiểm chứng thông tin với mã năng lực số NC1 và mã AI chi tiết (10.A1b, 11.C2a, 12.D2b...) viết dưới dạng văn bản thường không chứa dấu nháy ngược]. <br><br> **Bước 3: Báo cáo kết quả và thảo luận** <br> HS trả lời câu hỏi. <br> Gv quan sát, hỗ trợ, tư vấn <br> HS báo cáo kết quả thông qua các sản phẩm số, phản hồi/trình bày trực tiếp trên bảng tương tác hoặc qua ứng dụng trực tuyến (như đăng sản phẩm lên Padlet, trả lời trên Mentimeter, thảo luận nhóm qua bảng thông minh); HS nhóm khác phản biện, thảo luận; GV điều hành. <br><br> **Bước 4: Nhận xét, đánh giá kết quả thực hiện nhiệm vụ** <br> GV: nhận xét đánh giá kết quả của các cá nhân, chuẩn hóa kiến thức. GV nhận xét, đánh giá tinh thần làm việc và sản phẩm của học sinh, chuẩn hóa kiến thức cốt lõi và chuyển giao nhiệm vụ tiếp theo. | [Đưa ra đáp án chi tiết, kết quả thực hiện bài tập, nội dung bảng biểu đã hoàn thành, viết trực tiếp đoạn văn mẫu đầy đủ, bài viết phân tích dài, hoặc câu trả lời rất chi tiết cho các yêu cầu ở cột bên trái để chốt kiến thức...] |
         - QUY TẮC BẮT BUỘC TRONG BẢNG: Trong cột "Hoạt động của GV và HS" và "Sản phẩm dự kiến", sau mỗi câu hoặc sau mỗi ý hành động lớn, bạn PHẢI tự động xuống hàng bằng cách chèn thẻ <br> ở cuối để phân tách rõ ràng các ý, giúp giáo viên dễ đọc. Tuyệt đối không viết liền tù tì thành một đoạn dài.
       - Thể hiện rõ các PHƯƠNG PHÁP và KỸ THUẬT DẠY HỌC TÍCH CỰC lồng ghép năng lực số (Kỹ thuật KWL, Áp dụng Brainstorming, Think-Pair-Share, Khăn trải bàn, Mảnh ghép, Trạm xoay, PBL - Học theo vấn đề, Tranh luận chuyên sâu, Bể cá (Fishbowl)... nhằm tối ưu hóa sự tương tác và hào hứng trong giờ học).
       - Thiết kế để dạy học tối ưu trên BẢNG TƯƠNG TÁC bằng việc lồng ghép thông minh các CÔNG CỤ TRỰC TUYẾN tương tác cao: Kahoot!, Quizizz, Blooket, Padlet, Mentimeter, v.v., khai thác tối đa tính năng tương tác của bảng thông minh có tại trường.
       - Thể hiện rõ Chu trình thực hành AI khi học sinh tương tác với AI: Học sinh tự học/làm trước -> AI hỗ trợ -> Học sinh đối chiếu, kiểm chứng chéo thông tin với nguồn học thuật/SGK và trích dẫn nguồn trung thực.
    4. Bổ sung mục "IV. KẾ HOẠCH ĐÁNH GIÁ":
       - Việc kiểm tra, đánh giá khi tích hợp AI tập trung vào các biểu hiện tư duy, thái độ và kỹ năng thực hành:
         * Kỹ năng tương tác, đặt câu hỏi (prompt) sâu sắc và hiệu quả cho AI.
         * Năng lực phân tích, nhận diện thiên kiến và kiểm chứng thông tin do AI cung cấp.
         * Khả năng lập luận, so sánh hợp lý giữa cách giải quyết của con người và máy móc.
         * Sự cẩn trọng, thái độ sử dụng AI có trách nhiệm, trung thực, biết trích dẫn nguồn và không sao chép máy móc.

        YÊU CẦU VỀ ĐỊNH DẠNG VÀ PHƯƠNG PHÁP CÁC MÔN XÃ HỘI & TIẾNG ANH:
     1. ĐỐI VỚI TIẾNG ANH (LANGUAGE & STRUCTURES):
        - Các bảng từ vựng (Vocabulary), cấu trúc (Structures) phải rõ ràng, phân biệt rõ cột Từ/Cụm từ, Từ loại, Phiên âm, Nghĩa và Câu ví dụ.
        - Tích hợp các công cụ luyện phát âm AI (như Elsa Speak), chatbot AI đóng vai (role-play), hoặc công cụ sửa lỗi ngữ pháp.
      2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
         - Trích dẫn các đoạn thơ, đoạn văn mẫu hoặc ngữ liệu văn học rõ ràng, căn lề thụt lề chuẩn.
         - Tích hợp AI trong việc phân tích cấu trúc văn bản, tóm tắt ý chính, nhận diện biện pháp nghệ thuật, hoặc tạo lập văn bản theo phong cách khác nhau.
         - BẮT BUỘC CHO HOẠT ĐỘNG 1: KHỞI ĐỘNG: Ưu tiên lựa chọn các kĩ thuật khởi động có khả năng khơi gợi cảm xúc, trải nghiệm, đồng cảm, giá trị nhân văn và hứng thú thẩm mĩ; giúp học sinh bước vào thế giới nghệ thuật của tác phẩm trước khi tìm hiểu nội dung.
           * Lựa chọn định hướng khơi gợi phù hợp với thể loại văn bản của bài học:
             + Khơi cảm xúc với: Thơ, truyện ngắn
             + Khơi trải nghiệm với: Văn nghị luận, truyện
             + Khơi bối cảnh với: Văn học trung đại, sử thi
             + Khơi xung đột với: Văn nghị luận, kịch
             + Khơi thẩm mỹ với: Thơ, tùy bút
           * Áp dụng đa dạng và không trùng lặp lặp đi lặp lại một kỹ thuật, chọn ngẫu nhiên một trong các kĩ thuật sau:
             + Đọc diễn cảm một đoạn văn, đoạn thơ hoặc lời dẫn giàu cảm xúc.
             + Nghe nhạc hoặc âm thanh phù hợp với không gian, chủ đề của tác phẩm.
             + Xem tranh, ảnh hoặc video ngắn để tạo bối cảnh nghệ thuật.
             + Kể một câu chuyện có thật hoặc một tình huống đời sống liên quan đến chủ đề tác phẩm.
             + Đọc một câu nói, danh ngôn hoặc lời tâm sự gợi suy ngẫm.
             + Viết nhanh một từ hoặc một câu thể hiện cảm xúc khi quan sát hình ảnh, nghe âm thanh hoặc đọc ngữ liệu.
             + Hoàn thành câu mở (Ví dụ: "Nếu em là...", "Điều khiến em xúc động nhất là...", "Em nhớ nhất...").
             + Nhật ký một phút: ghi lại một kỷ niệm hoặc cảm xúc liên quan đến chủ đề bài học.
             + Đóng vai nhân vật hoặc nhập vai người kể chuyện trong một tình huống ngắn.
             + Đọc tranh – Đọc ảnh (Visual Thinking): quan sát và chia sẻ cảm nhận, không tìm đáp án đúng sai.
             + Đoán chủ đề hoặc thông điệp qua hình ảnh, âm thanh, biểu tượng hoặc một đoạn trích.
             + Kết nối trải nghiệm cá nhân bằng câu hỏi mở ("Em đã từng...", "Em có cảm thấy...", "Nếu em ở trong hoàn cảnh đó...").
             + Lựa chọn biểu tượng cảm xúc (Emoji Check-in) để bày tỏ tâm trạng và giải thích ngắn.
             + Viết điều muốn gửi tới nhân vật hoặc tác giả trước khi học.
             + AI tạo không gian cảm xúc: sử dụng hình ảnh, âm nhạc hoặc lời dẫn do AI tạo để mở đầu bài học.
     3. ĐỐI VỚI LỊCH SỬ VÀ ĐỊA LÍ (HISTORY & GEOGRAPHY):
        - Thiết kế các hoạt động sử dụng bản đồ số (Google Maps, Google Earth), công cụ phục dựng hình ảnh/video bằng AI để trực quan hóa lịch sử, địa lý địa phương.
        - Hướng dẫn học sinh cách tìm kiếm thông tin lịch sử/địa lý trực tuyến và kiểm chứng chéo với các nguồn học thuật uy tín để nhận diện thiên kiến.
     4. ĐỐI VỚI GIÁO DỤC KINH TẾ VÀ PHÁP LUẬT (ECONOMICS & LAW):
        - Sử dụng các case study thực tế (luật pháp, kinh tế), dữ liệu thị trường biến động.
        - Hướng dẫn học sinh sử dụng AI để tóm tắt các điều luật phức tạp hoặc phân tích tình huống pháp lý giả định (case study).

    YÊU CẦU QUY TẮC ĐỊNH DẠNG KHÁC:
    - Mọi nội dung NLS và AI được bổ sung thêm PHẢI được bao bọc trong cặp thẻ <nls> và </nls> (ví dụ: <nls>- Năng lực 1.2: ...</nls> hoặc <nls>[Tích hợp giáo dục AI (NLa): ...]</nls>).
    - Giữ nguyên các nội dung chuyên môn gốc của bài dạy.

    Nội dung gốc:
    ${content}
  `;

  // Add a timeout of 120 seconds for integrated logic
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error("Yêu cầu quá thời gian xử lý (120s). Vui lòng thử lại với tệp tin ngắn hơn hoặc kiểm tra kết nối mạng.")), 120000)
  );

  try {
    const result = await Promise.race([callAIWithRetry(prompt, modelName), timeoutPromise]);
    const responseText = result.text;
    
    if (!responseText || responseText.trim().length < 10) {
      throw new Error("AI không thể tạo nội dung tích hợp. Vui lòng kiểm tra lại nội dung tệp tin gốc.");
    }
    
    return responseText;
  } catch (error: any) {
    console.error("Gemini API Error (Integrate):", error);
    const msg = error.message || "";
    if (msg.includes("120s")) throw error;
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Máy chủ AI đang quá tải (Hết lượt yêu cầu). Vui lòng chờ 30 giây rồi nhấn thử lại.");
    }
    throw new Error("Không thể kết nối với máy chủ AI hoặc nội dung bị từ chối. Vui lòng thử lại sau.");
  }
}

export async function generateLessonPlan(lessonName: string, periods: number, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const prompt = `
    Bạn là một chuyên gia giáo dục và Trợ lý Giáo viên cấp cao tại Việt Nam, am hiểu Công văn 5512, Thông tư 02/2025/TT-BGDĐT quy định Khung năng lực số cho người học (trong đó AI là miền năng lực thứ sáu), Quyết định 3439/QĐ-BGDĐT ban hành Khung nội dung thí điểm giáo dục Trí tuệ nhân tạo cho học sinh phổ thông và Công văn 8334/BGDĐT-GDPT hướng dẫn triển khai thực hiện thí điểm nội dung giáo dục Trí tuệ nhân tạo cho học sinh phổ thông.

    Nhiệm vụ: Tạo một Kế hoạch bài dạy (KHBD) hoàn chỉnh cho bài học sau theo đúng mẫu Công văn 5512:
    - Tên bài: ${lessonName}
    - Số tiết: ${periods} tiết
    - Môn học: ${subject}
    - Khối lớp: ${grade}
    
    LƯU Ý ĐẶC BIỆT KHI LỒNG GHÉP NĂNG LỰC SỐ VÀ GIÁO DỤC AI:
    - AI được tích hợp một cách linh hoạt trong tiến trình dạy học thích hợp, không tách thành phần riêng. Phát huy giáo dục AI theo hướng "Đánh giá - kiểm soát - sử dụng AI" và đạo đức - trách nhiệm của học sinh. Không làm thay đổi mục tiêu cốt lõi của môn học và không dạy lập trình/thuật toán phức tạp gây quá tải cho học sinh.
    - ĐẢM BẢO THỜI LƯỢNG: Thiết kế nội dung chi tiết phủ kín ${periods} tiết học (45 phút/tiết).
    - Ôn tập/Luyện tập: Nếu tên bài là "Ôn tập chương X", hãy tập trung hệ thống hóa kiến thức dùng sơ đồ tư duy và thiết lập hệ thống bài tập phong phú (phần IV phiếu học tập có tối thiểu 15 câu trắc nghiệm và 5 bài tập tự luận).
    - Nội dung bám sát Chương trình GDPT 2018 và SGK Bộ sách Kết nối tri thức.

    Yêu cầu cấu trúc Công văn 5512 tích hợp NLS và AI:
    I. MỤC TIÊU
    1. Kiến thức
    2. Năng lực (Năng lực chung, Năng lực đặc thù của môn học)
    3. Năng lực số và Trí tuệ nhân tạo (AI):
       - Liệt kê các mã chỉ báo NLS chuẩn [Mã miền].[Mã nhánh].${NLS_FRAMEWORK.levelCode}[a/b/c...]. Ví dụ: 6.1.${NLS_FRAMEWORK.levelCode}a, 6.2.${NLS_FRAMEWORK.levelCode}b.
       - BẮT BUỘC MÃ HÓA NĂNG LỰC AI THÀNH PHẦN CHI TIẾT theo Quyết định 3439 và Công văn 8334 bằng cách ghép: [Khối_lớp].[Mã_chủ_đề][Biểu_hiện] (Ví dụ: 10.A1b, 11.C2a, 12.D2b). QUY TẮC BẮT BUỘC: Toàn bộ các mã năng lực số và năng lực học liệu AI (ví dụ: 6.1.NC1a, 12.C2a...) luôn phải được viết dưới dạng văn bản thường bình thường hoàn toàn, tuyệt đối không được bao bọc trong và không sử dụng các dấu nháy ngược khép kín (\`...\`) hay định dạng khối mã code block inline.
         * Trong đó:
           - Mã khối lớp: 10, 11 hoặc 12 (ví dụ: học sinh lớp 11 dùng mã 11).
           - Thành phần năng lực đặc thù và mạch kiến thức/chủ đề cốt lõi (A, B, C, D) tương ứng: Ký hiệu là NLa - Chủ đề A (Nhận thức AI), NLb - Chủ đề B (Kiểm soát AI/Đạo đức), NLc - Chủ đề C (Ứng dụng AI), NLd - Chủ đề D (Thiết kế/Giải quyết vấn đề với AI).
           - Ví dụ các chủ đề con: A1, B1, C1, C2, D1, D2.
           - Biểu hiện chi tiết: Kí hiệu chữ cái thường (a, b, c...).
           - Giải thích chi tiết mã chỉ báo năng lực AI: Ví dụ "11.C2a" (hoặc 11C2a) chỉ định một biểu hiện chi tiết (kí hiệu "a") nằm trong Chủ đề C2 (Ứng dụng AI) dành cho học sinh lớp 11; "10.A1b" chỉ định biểu hiện "b" của Chủ đề A1 dành cho lớp 10; "12.D2b" chỉ định biểu hiện "b" của Chủ đề D2 dành cho học sinh lớp 12.
           - Việc ghi chính xác mã đến từng chữ cái giúp giáo viên xác định chính xác mục tiêu giảng dạy, tổ chức thực hành, dự án AI và đánh giá học sinh sát sao nhất.
    4. Phẩm chất (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm)
    
    II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
    - Bổ sung mục “Công cụ số và AI”:
      * Phương án triển khai: Cho học sinh thực hành sử dụng AI trực tiếp hay thảo luận qua tình huống giả định (case study).
      * Học liệu/công cụ cụ thể: Viết rõ tên nền tảng (Gemini, Google AI Studio, Canva, Teachable Machine, PhET Simulations, Desmos, GeoGebra...) hoặc các tài liệu cụ thể như các tệp dữ liệu giả định, bài báo, video thảo luận, ảnh chụp thiết kế...
    
    III. TIẾN TRÌNH DẠY HỌC
    - PHÂN BỔ TIẾT HỌC: Nếu KHBD có nhiều tiết, hãy chia rõ nội dung cho từng tiết. Mỗi tiết bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (viết hoa, in đậm, căn giữa). 
    - QUY TẮC BẮT BUỘC CHO NHIỀU TIẾT: Đối với bài học thiết kế cho nhiều tiết (ví dụ: bài học 2, 3, 4 tiết, hay thậm chí 11, 12, 15 tiết...), bạn phải thực hiện thiết kế chi tiết tất cả các hoạt động cho từng tiết. TUYỆT ĐỐI không tóm tắt sơ sài hay gom cụm các tiết sau. TẤT CẢ các hoạt động học ở tất cả các tiết (từ Tiết 1 đến Tiết cuối cùng) đều PHẢI ĐƯỢC THIẾT KẾ ĐẦY ĐỦ VÀ CHI TIẾT THEO CẤU TRÚC 4 PHẦN (a, b, c, d) DƯỚI ĐÂY.
    - CẤM TÓM TẮT HOẶC VIẾT GHI CHÚ LƯỢC BỚT: NGHIÊM CẤM TUYỆT ĐỐI việc viết các câu lược trích hoặc để ghi chú trống bằng tiếng Việt như: "(Do giới hạn dung lượng, tôi xin lược trích...)", "(Lưu ý: Giáo viên cần tự điều chỉnh thời lượng...)", hoặc bất kỳ câu nào gợi ý giáo viên tự điền. Bạn BẮT BUỘC phải phân chia các hoạt động phù hợp (ví dụ: chia thành 4-5 hoạt động lớn phủ đều các nhóm tiết như Hoạt động 1: Tiết 1-2, Hoạt động 2: Tiết 3-5, Hoạt động 3: Tiết 6-8, Hoạt động 4: Tiết 9-11) và viết chi tiết đầy đủ 100% tất cả các tiết học từ Tiết 1 đến Tiết cuối cùng để phủ kín toàn bộ ${periods} tiết học của bài học.
    - Hoạt động 1 (của Tiết 1) PHẢI là hoạt động khởi động bám sát các kĩ thuật khơi gợi cảm xúc, bối cảnh, thẩm mĩ và kết nối trải nghiệm đặc thù của môn Ngữ văn phù hợp với thể loại văn bản (Không kiểm tra bài cũ). Tránh lạm dụng các công cụ tương tác số như Kahoot!, Mentimeter... nếu chúng làm giảm tính nghệ thuật và sự đồng cảm với tác phẩm.
    - Cân bằng giữa thảo luận và thực hành. Áp dụng linh hoạt các KỸ THUẬT DẠY HỌC TÍCH CỰC (Kỹ thuật KWL, Áp dụng Brainstorming, Think-Pair-Share, Khăn trải bàn, Mảnh ghép, Trạm xoay, PBL - Học theo vấn đề, Tranh luận chuyên sâu, Bể cá (Fishbowl)... nhằm tối ưu hóa sự tương tác, chiếm lĩnh cách học và kiến thức bài học của học sinh).
    - Thiết kế bài dạy để dạy học tối ưu trên BẢNG TƯƠNG TÁC (Smart Board), lồng ghép kịch bản dùng trực tiếp các CÔNG CỤ TRỰC TUYẾN: Kahoot!, Quizizz, Blooket, Padlet, Mentimeter... Hãy viết rõ các bước tương tác nơi học sinh sử dụng bảng tại trường và các ứng dụng này phản hồi trực tiếp để kích thích tinh thần tương tác của bảng tương tác.
    - Thể hiện Chu trình thực hành AI khi học sinh tương tác với AI: Học sinh tự học/làm trước -> AI hỗ trợ -> Học sinh đối chiếu, kiểm chứng chéo thông tin với nguồn học thuật/SGK và trích dẫn nguồn trung thực.
    - BẮT BUỘC: Mỗi hoạt động học trong TẤT CẢ CÁC TIẾT phải được THIẾT KẾ CỰC KỲ CHI TIẾT theo đúng CV5512, tuân thủ nghiêm ngặt cấu trúc sau:
      a) Mục tiêu: Mô tả rõ ràng kiến thức, kỹ năng, năng lực cần đạt được trong hoạt động này.
      b) Nội dung: Giao nhiệm vụ, câu hỏi, bài tập cụ thể, kịch bản hành động chi tiết đầy đủ cho học sinh (ghi rõ nội dung câu hỏi/nhiệm vụ trong phiếu học tập).
      c) Sản phẩm: Ghi rõ ĐÁP ÁN CHI TIẾT, kết quả tính toán cụ thể, các nội dung điền khuyết trên bảng biểu, câu trả lời mẫu đầy đủ nhất của học sinh (đảm bảo độ phủ chuyên môn cao, không viết mơ hồ "Học sinh hiểu bài" hay "Trả lời câu hỏi").
                d) Tổ chức thực hiện: Thiết kế bắt buộc dưới dạng bảng Markdown có cấu trúc 2 cột cụ thể như sau. Nhấn mạnh chỉ thay đổi ở mục d) Tổ chức thực hiện, các phần khác trong KHBD giữ nguyên.
              * QUY TẮC BẮT BUỘC 1: Ngay dưới tiêu đề "d) Tổ chức thực hiện:" và ngay phía trên bảng, phải ghi rõ phương pháp/kỹ thuật dạy học tích cực được áp dụng (ví dụ: Kỹ thuật KWL, Áp dụng Brainstorming, Think-Pair-Share, Khăn trải bàn, Mảnh ghép, Trạm xoay, PBL, Tranh luận, Bể cá...). Ví dụ: **[Phương pháp áp dụng: Khăn trải bàn & Trạm xoay]** hoặc **[Phương pháp áp dụng: Sơ đồ tư duy trên Bảng tương tác]**.
              * QUY TẮC BẮT BUỘC 2: Trong các bước Giao nhiệm vụ, Thực hiện nhiệm vụ, Báo cáo - thảo luận, phải ghi cụ thể hành động học sinh/giáo viên sử dụng bảng tương tác (Smart Board) và các ứng dụng trực tuyến như Kahoot!, Quizizz, Blooket, Padlet, Mentimeter... để thực hành/báo cáo sản phẩm.
              * QUY TẮC BẮT BUỘC 3: Bảng có đúng 2 cột mang tên: "Hoạt động của GV và HS" và "Sản phẩm dự kiến". Cột thứ nhất "Hoạt động của GV và HS" phải có đầy đủ 4 bước như mẫu dưới đây (sử dụng thẻ <br> để ngăn cách các dòng/ý hành động của giáo viên và học sinh trong ô):
                - **Bước 1: Chuyển giao nhiệm vụ học tập** <br> (GV giao nhiệm vụ cụ thể, câu hỏi/nhiệm vụ học tập, thời gian, học liệu số và hình thức làm việc. Ghi rõ cách GV sử dụng bảng tương tác hoặc các công cụ trực tuyến như Kahoot!, Quizizz, Blooket, Padlet, Mentimeter... để giao nhiệm vụ hoặc khởi động).
                - **Bước 2: Thực hiện nhiệm vụ** <br> (HS thực hiện nhiệm vụ cá nhân/cặp/nhóm; GV theo dõi, hỗ trợ. Tích hợp NLS và AI: Mô tả HS dùng công cụ số/AI để tra cứu dữ liệu, tương tác prompt, kiểm chứng thông tin với mã năng lực số NC1 và mã AI chi tiết (10.A1b, 11.C2a, 12.D2b...) viết dưới dạng văn bản thường không chứa dấu nháy ngược).
                - **Bước 3: Báo cáo kết quả và thảo luận** <br> HS trả lời câu hỏi. <br> Gv quan sát, hỗ trợ, tư vấn <br> (HS báo cáo kết quả thông qua sản phẩm số, phản hồi/trình bày trực tiếp trên bảng tương tác hoặc qua ứng dụng như Padlet, Mentimeter...; HS nhóm khác phản biện, thảo luận; GV điều hành).
                - **Bước 4: Nhận xét, đánh giá kết quả thực hiện nhiệm vụ** <br> GV: nhận xét đánh giá kết quả của các cá nhân, chuẩn hóa kiến thức. <br> (GV đánh giá tinh thần làm việc, sản phẩm của HS, chốt kiến thức cốt lõi và chuyển giao nhiệm vụ tiếp theo).
              * QUY TẮC BẮT BUỘC 4: Trong cột "Sản phẩm dự kiến", bạn PHẢI trình bày kết quả học tập THỰC TẾ, CỰC KỲ CHI TIẾT, HỆ THỐNG và TĂNG DUNG LƯỢNG NỘI DUNG/SỐ LƯỢNG CHỮ đến mức tối đa để làm tài liệu chuẩn mực cho giáo viên (tham khảo phong cách chi tiết của tài liệu TD.pdf). Tránh tuyệt đối viết ngắn gọn, khái quát, sơ sài hoặc hời hợt để giáo viên có thể dùng trực tiếp để dạy học thực tế trên lớp. Ví dụ: Phân tích hành động đốt đền của Tử Văn hay nhân vật phải được phân tích sâu sắc thành các luận điểm cụ thể, phân tích chi tiết ý nghĩa văn học với dung lượng chữ nhiều, đầy đủ lập luận nghệ thuật và nội dung. Thay vì viết "Sản phẩm trên Padlet: Viết đoạn văn ngắn 5-7 câu sử dụng ít nhất 3 từ Hán Việt.", bạn phải VIẾT RA ĐOẠN VĂN MẪU THỰC TẾ dài 5-7 câu có sử dụng ít nhất 3 từ Hán Việt đó. Nếu có bảng so sánh nhân vật (ví dụ: bảng so sánh Ngô Tử Văn và Hồn ma tên tướng giặc), bạn PHẢI viết đầy đủ nội dung đáp án chi tiết cho cột ý nghĩa/nội dung so sánh trực tiếp trong bảng của cột Sản phẩm dự kiến.
              * QUY TẮC BẮT BUỘC 5: Mỗi hoạt động học phải bắt đầu bằng tiêu đề Hoạt động độc lập bên ngoài bảng. Các mục a) Mục tiêu, b) Nội dung, c) Sản phẩm bắt buộc viết dưới dạng văn bản thông thường ngoài bảng, KHÔNG ĐƯỢC đưa vào trong bảng. Chỉ riêng mục d) Tổ chức thực hiện mới được trình bày dưới dạng bảng 2 cột.
              
              | Hoạt động của GV và HS | Sản phẩm dự kiến |
              | :--- | :--- |
              | **Bước 1: Chuyển giao nhiệm vụ học tập** <br> GV giao nhiệm vụ học tập rõ ràng, nêu yêu cầu, thời gian, học liệu số và hình thức làm việc. Nêu cách GV sử dụng bảng tương tác hoặc các công cụ trực tuyến (Kahoot!, Quizizz, Blooket, Padlet, Mentimeter...) để khởi động hoặc giao nhiệm vụ học tập. <br><br> **Bước 2: Thực hiện nhiệm vụ** <br> HS thực hiện nhiệm vụ (cá nhân/cặp/nhóm); GV theo dõi, hỗ trợ. [BẮT BUỘC Tích hợp NLS và AI: Mô tả HS dùng công cụ số/AI để tra cứu dữ liệu, tương tác prompt, kiểm chứng thông tin với mã năng lực số NC1 và mã AI chi tiết (10.A1b, 11.C2a, 12.D2b...) viết dưới dạng văn bản thường không chứa dấu nháy ngược]. <br><br> **Bước 3: Báo cáo kết quả và thảo luận** <br> HS trả lời câu hỏi. <br> Gv quan sát, hỗ trợ, tư vấn <br> HS báo cáo kết quả thông qua các sản phẩm số, phản hồi/trình bày trực tiếp trên bảng tương tác hoặc qua ứng dụng trực tuyến (như đăng sản phẩm lên Padlet, trả lời trên Mentimeter, thảo luận nhóm qua bảng thông minh); HS nhóm khác phản biện, thảo luận; GV điều hành. <br><br> **Bước 4: Nhận xét, đánh giá kết quả thực hiện nhiệm vụ** <br> GV: nhận xét đánh giá kết quả của các cá nhân, chuẩn hóa kiến thức. GV nhận xét, đánh giá tinh thần làm việc và sản phẩm của học sinh, chuẩn hóa kiến thức cốt lõi và chuyển giao nhiệm vụ tiếp theo. | [Đưa ra đáp án chi tiết, kết quả thực hiện bài tập, nội dung bảng biểu đã hoàn thành, viết trực tiếp đoạn văn mẫu đầy đủ, bài viết phân tích dài, hoặc câu trả lời rất chi tiết cho các yêu cầu ở cột bên trái để chốt kiến thức...] |
         - QUY TẮC BẮT BUỘC TRONG BẢNG: Trong cột "Hoạt động của GV và HS" và "Sản phẩm dự kiến", sau mỗi câu hoặc sau mỗi ý hành động lớn, bạn PHẢI tự động xuống hàng bằng cách chèn thẻ <br> ở cuối để phân tách rõ ràng các ý, giúp giáo viên dễ đọc. Tuyệt đối không viết liền tù tì thành một đoạn dài.
    
    IV. KẾ HOẠCH ĐÁNH GIÁ (nếu có)
    - Xây dựng tiêu chí đánh giá tích hợp AI: kỹ năng tương tác prompt, kiểm chứng dữ liệu, phản biện thiên kiến, thái độ chịu trách nhiệm và trích dẫn trung thực.

    V. CÁC PHIẾU HỌC TẬP (Đặt ở cuối bài dạy)
    - Xây dựng đầy đủ nội dung chi tiết Phiếu học tập số 1, số 2, số 3... phục vụ các hoạt động học ở mục III. Tiêu đề "PHIẾU HỌC TẬP SỐ X: [Tên]" phải nằm độc lập trên 1 dòng riêng.
    - Hệ thống câu hỏi luyện tập và vận dụng để giáo viên nạp liệu cho Kahoot!, Quizizz hoặc Liveworksheets.
    - Yêu cầu số lượng câu hỏi trắc nghiệm: Đúng 10 câu trắc nghiệm (đối với bài học kiến thức mới) hoặc 15 câu (đối với bài ôn tập/luyện tập). Các phương án A, B, C, D trình bày ở dòng riêng biệt. Bao bọc đáp án đúng bằng thẻ <correct>...</correct>. Ví dụ: <correct>A. Na2SO4</correct>. KHÔNG viết câu "Đáp án đúng là..." mà chỉ dùng thẻ <correct>.
    - Các bài tập tự luận, tính toán (tối thiểu 3-5 bài tập tự luận).
    - BẮT BUỘC PHẢI VIẾT ĐẦY ĐỦ NỘI DUNG ĐÁP ÁN CHI TIẾT: Đối với tất cả các bảng biểu so sánh, phân loại, thảo luận nhóm trong phần "V. CÁC PHIẾU HỌC TẬP" (ví dụ: PHIẾU HỌC TẬP SỐ 1: BẢNG SO SÁNH NHÂN VẬT), bạn BẮT BUỘC phải điền đầy đủ nội dung cho tất cả các cột (bao gồm cột "Ý nghĩa" hay bất cứ cột nội dung nào khác), tuyệt đối không được để trống hoặc dùng dấu ba chấm "..." để học sinh điền. Giáo viên Ngữ văn yêu cầu nội dung được hiển thị rõ ràng, đầy đủ và chi tiết nhất để có thể dùng giảng dạy trực tiếp trên thực tế.

    YÊU CẦU VỀ ĐỊNH DẠNG VÀ PHƯƠNG PHÁP CÁC MÔN XÃ HỘI & TIẾNG ANH:
    1. ĐỐI VỚI TIẾNG ANH (LANGUAGE & STRUCTURES):
       - Các bảng từ vựng (Vocabulary), cấu trúc (Structures) phải rõ ràng, phân biệt rõ cột Từ/Cụm từ, Từ loại, Phiên âm, Nghĩa và Câu ví dụ.
       - Tích hợp các công cụ luyện phát âm AI (như Elsa Speak), chatbot AI đóng vai (role-play), hoặc công cụ sửa lỗi ngữ pháp.
     2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
        - Trích dẫn các đoạn thơ, đoạn văn mẫu hoặc ngữ liệu văn học rõ ràng, căn lề thụt lề chuẩn.
        - Tích hợp AI trong việc phân tích cấu trúc văn bản, tóm tắt ý chính, nhận diện biện pháp nghệ thuật, hoặc tạo lập văn bản theo phong cách khác nhau.
        - BẮT BUỘC CHO HOẠT ĐỘNG 1: KHỞI ĐỘNG: Ưu tiên lựa chọn các kĩ thuật khởi động có khả năng khơi gợi cảm xúc, trải nghiệm, đồng cảm, giá trị nhân văn và hứng thú thẩm mĩ; giúp học sinh bước vào thế giới nghệ thuật của tác phẩm trước khi tìm hiểu nội dung.
          * Lựa chọn định hướng khơi gợi phù hợp với thể loại văn bản của bài học:
            + Khơi cảm xúc với: Thơ, truyện ngắn
            + Khơi trải nghiệm với: Văn nghị luận, truyện
            + Khơi bối cảnh với: Văn học trung đại, sử thi
            + Khơi xung đột với: Văn nghị luận, kịch
            + Khơi thẩm mỹ với: Thơ, tùy bút
          * Áp dụng đa dạng và không trùng lặp lặp đi lặp lại một kỹ thuật, chọn ngẫu nhiên một trong các kĩ thuật sau:
            + Đọc diễn cảm một đoạn văn, đoạn thơ hoặc lời dẫn giàu cảm xúc.
            + Nghe nhạc hoặc âm thanh phù hợp với không gian, chủ đề của tác phẩm.
            + Xem tranh, ảnh hoặc video ngắn để tạo bối cảnh nghệ thuật.
            + Kể một câu chuyện có thật hoặc một tình huống đời sống liên quan đến chủ đề tác phẩm.
            + Đọc một câu nói, danh ngôn hoặc lời tâm sự gợi suy ngẫm.
            + Viết nhanh một từ hoặc một câu thể hiện cảm xúc khi quan sát hình ảnh, nghe âm thanh hoặc đọc ngữ liệu.
            + Hoàn thành câu mở (Ví dụ: "Nếu em là...", "Điều khiến em xúc động nhất là...", "Em nhớ nhất...").
            + Nhật ký một phút: ghi lại một kỷ niệm hoặc cảm xúc liên quan đến chủ đề bài học.
            + Đóng vai nhân vật hoặc nhập vai người kể chuyện trong một tình huống ngắn.
            + Đọc tranh – Đọc ảnh (Visual Thinking): quan sát và chia sẻ cảm nhận, không tìm đáp án đúng sai.
            + Đoán chủ đề hoặc thông điệp qua hình ảnh, âm thanh, biểu tượng hoặc một đoạn trích.
            + Kết nối trải nghiệm cá nhân bằng câu hỏi mở ("Em đã từng...", "Em có cảm thấy...", "Nếu em ở trong hoàn cảnh đó...").
            + Lựa chọn biểu tượng cảm xúc (Emoji Check-in) để bày tỏ tâm trạng và giải thích ngắn.
            + Viết điều muốn gửi tới nhân vật hoặc tác giả trước khi học.
            + AI tạo không gian cảm xúc: sử dụng hình ảnh, âm nhạc hoặc lời dẫn do AI tạo để mở đầu bài học.
    3. ĐỐI VỚI LỊCH SỬ VÀ ĐỊA LÍ (HISTORY & GEOGRAPHY):
       - Thiết kế các hoạt động sử dụng bản đồ số (Google Maps, Google Earth), công cụ phục dựng hình ảnh/video bằng AI để trực quan hóa lịch sử, địa lý địa phương.
       - Hướng dẫn học sinh cách tìm kiếm thông tin lịch sử/địa lý trực tuyến và kiểm chứng chéo với các nguồn học thuật uy tín để nhận diện thiên kiến.
    4. ĐỐI VỚI GIÁO DỤC KINH TẾ VÀ PHÁP LUẬT (ECONOMICS & LAW):
       - Sử dụng các case study thực tế (luật pháp, kinh tế), dữ liệu thị trường biến động.
       - Hướng dẫn học sinh sử dụng AI để tóm tắt các điều luật phức tạp hoặc phân tích tình huống pháp lý giả định (case study).

    LƯU Ý QUÂN TRỌNG:
    - Mọi nội dung NLS và giáo dục AI được bổ sung thêm PHẢI được bao bọc trong cặp thẻ <nls> và </nls>.
    - Không viết tắt tự ý ngoài các thuật ngữ chuẩn và mã hóa năng lực trong hướng dẫn.
    - Trả về toàn bộ nội dung giáo án hoàn chỉnh, phong phú và chi tiết.
  `;

  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error("Yêu cầu quá thời gian xử lý (120s).")), 120000)
  );

  try {
    const result = await Promise.race([callAIWithRetry(prompt, modelName), timeoutPromise]);
    return result.text;
  } catch (error: any) {
    console.error("Gemini API Error (Generate):", error);
    const msg = error.message || "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Hệ thống đang bận do lượt yêu cầu cao. Vui lòng thử lại sau 30 giây.");
    }
    throw new Error("Không thể tạo KHBD mới. Vui lòng kiểm tra kết nối hoặc thử lại sau.");
  }
}
