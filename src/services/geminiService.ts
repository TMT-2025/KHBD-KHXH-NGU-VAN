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
    { id: "6", name: "Năng lực Trí tuệ nhân tạo", sub: ["6.1. Tư duy lấy con người làm trung tâm", "6.2. Đạo đức AI", "6.3. Sư phạm AI", "6.4. AI cho phát triển chuyên môn"] }
  ],
  levelCode: "NC1", // Nâng cao 1 cho khối THPT
  levelName: "Nâng cao 1 (Lớp 10, 11, 12)"
};

export async function integrateNLS(content: string, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const assessmentInstruction = `
     4. Bổ sung mục "IV. KẾ HOẠCH ĐÁNH GIÁ":
        - Việc kiểm tra, đánh giá khi tích hợp AI tập trung vào đánh giá quá trình (Process-based assessment) và năng lực tư duy thực chất của học sinh thông qua các biểu hiện:
          * Kỹ năng tương tác: Cách đặt câu hỏi, tinh chỉnh prompt hiệu quả cho AI.
          * Kỹ năng kiểm chứng: Khả năng phát hiện lỗi sai, thiên kiến hoặc ảo giác thông tin (hallucination) của AI bằng cách đối chiếu với nguồn dữ liệu chính thống.
          * Sử dụng có trách nhiệm: Ý thức tự giác khai báo mức độ sử dụng AI, trích dẫn nguồn học liệu hợp pháp và không đạo văn (ví dụ: trích dẫn AI như một Collaborator).
  `;
  const luyenTapSection = "V. HOẠT ĐỘNG LUYỆN TẬP";
  const vanDungSection = "VI. HOẠT ĐỘNG VẬN DỤNG";

  const prompt = `
    Bạn là một chuyên gia giáo dục và Trợ lý Giáo viên cấp cao tại Việt Nam, am hiểu Công văn 5512, Thông tư 18/2026/TT-BGDĐT quy định Khung năng lực số cho người học (trong đó AI là miền năng lực thứ sáu), Quyết định số 2422/QĐ-BGDĐT ngày 18/08/2026 ban hành Khung giáo dục AI và Công văn số 5588/BGDĐT-GDPT ngày 19/08/2026 hướng dẫn triển khai thực hiện giáo dục Trí tuệ nhân tạo từ năm học 2026-2027.
    
    Nhiệm vụ: Phân tích kế hoạch bài dạy (KHBD) môn ${subject} khối ${grade} dưới đây và bổ sung Tích hợp NNLS (Năng lực số) và Giáo dục AI (Trí tuệ nhân tạo) một cách logic, khả thi, bám sát các văn bản quy định.
    
    Hãy tuân thủ các chỉ dẫn tích hợp giáo dục AI cốt lõi theo "ĐỊNH HƯỚNG TÍCH HỢP AI TRONG KHBD THEO TỪNG NHÓM MÔN HỌC":
    - Đối với môn học khác ngoài môn Tin học (như môn ${subject} ở đây): Tuyệt đối không dạy kiến thức kỹ thuật chuyên sâu hay lập trình AI. Sử dụng AI như một công cụ hỗ trợ để học sinh tìm kiếm thông tin, tóm tắt tư liệu, lập dàn ý, dịch thuật hoặc mô phỏng.
    - Tập trung vào các hoạt động tư duy bậc cao: Hướng dẫn học sinh phản biện, tranh biện, thảo luận về các vấn đề đạo đức (đạo văn, thiên kiến dữ liệu, quyền riêng tư) và đánh giá độ tin cậy của thông tin do AI cung cấp nhằm tránh phụ thuộc hoàn toàn vào công nghệ.
    - Trọng tâm năng lực phát triển: NLa (Tư duy lấy con người làm trung tâm) và NLb (Đạo đức AI).
    
    Các bổ sung cụ thể theo Công văn số 5512/BGDĐT-GDTrH:
    1. Trong "I. MỤC TIÊU": 
       - Giữ nguyên các năng lực đặc thù và phẩm chất môn học gốc.
       - Sửa đổi hoặc bổ sung mục "3. Năng lực số và Trí tuệ nhân tạo (AI)":
         + Liệt kê rõ các năng lực số miền sáu (6.1. Tư duy lấy con người làm trung tâm, 6.2. Đạo đức AI, 6.3. Sư phạm AI, 6.4. AI cho phát triển chuyên môn) theo chuẩn chỉ báo [Mã miền].[Mã nhánh].${NLS_FRAMEWORK.levelCode}[a/b/c...]. Ví dụ: 6.1.${NLS_FRAMEWORK.levelCode}a, 6.2.${NLS_FRAMEWORK.levelCode}b.
         + BẮT BUỘC MÃ HÓA NĂNG LỰC AI THÀNH PHẦN CHI TIẾT theo Quyết định số 2422/QĐ-BGDĐT và Công văn số 5588/BGDĐT-GDPT: bằng cách ghép [Khối_lớp].[Mã_chủ_đề].[Chỉ_số] (Ví dụ: 10.A1.1, 11.C1.1, 12.C4.MR1, 12.A2.1). QUY TẮC PHẢI TUÂN THỦ: Toàn bộ các mã năng lực số và năng lực học liệu AI (ví dụ: 6.1.NC1a, 10.A1.1...) luôn phải được viết dưới dạng văn bản thường bình thường hoàn toàn, tuyệt đối không được bao bọc trong và không sử dụng các dấu nháy ngược khép kín (\`...\`) hay định dạng code block inline.
           * Bên cạnh mục tiêu phẩm chất, năng lực môn học, phải xác định cụ thể yêu cầu cần đạt về AI mà học sinh sẽ hình thành trong tiết học:
             - Về Nhận thức (NLa): Học sinh nhận ra vai trò, giới hạn hoặc rủi ro của AI trong nội dung bài học.
             - Về Trách nhiệm (NLb): Ý thức, hành vi trung thực học thuật, không sao chép máy móc sản phẩm do AI tạo ra.
             - Giải thích chi tiết mã chỉ báo năng lực AI: Ví dụ "11.C1.1" chỉ định chỉ số 1 nằm trong Chủ đề C1 (Dữ liệu & Logic) dành cho học sinh lớp 11; "10.A1.1" chỉ định chỉ số 1 của Chủ đề A1 dành cho lớp 10; "12.C4.MR1" chỉ định chỉ số nâng cao MR1 của Chủ đề C4 dành cho học sinh lớp 12.
             - Việc ghi mã chi tiết đến từng chữ cái giúp giáo viên xác định chính xác mục tiêu giảng dạy, tổ chức thực hành, dự án AI và đánh giá học sinh sát sao nhất.
    2. Trong "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU":
       - Bổ sung thêm tiểu mục “Công cụ số và AI”. Trong phần này phải trình bày rõ:
         * Phương án triển khai: Nhà trường sử dụng tình huống giả định (nếu không có máy tính/Internet) hay cho học sinh tương tác trực tiếp với công cụ AI.
         * Học liệu/công cụ cụ thể: Viết rõ tên phần mềm, nền tảng ứng dụng AI miễn phí, trực quan, không yêu cầu tài khoản trả phí (ví dụ: Google AI Studio, Gemini, Canva AI, Teachable Machine, NotebookLM...), hoặc các bài báo, video phân tích, ảnh chụp màn hình, tình huống giả định đã chuẩn bị sẵn.
    3. Trong "III. TIẾN TRÌNH DẠY HỌC":
       - Đảm bảo các hoạt động học có nội dung AI được thiết kế linh hoạt, xuất hiện tự nhiên tại các hoạt động (Khởi động, Hình thành kiến thức, Luyện tập hoặc Vận dụng). Tiến trình thực hiện phải bám sát chu trình chuẩn: Học sinh tự làm → AI hỗ trợ → Học sinh đối chiếu, phản biện và đánh giá. Giáo viên đóng vai trò điều phối, đặt các câu hỏi dẫn dắt gợi mở, hướng dẫn học sinh kỹ năng đặt câu lệnh (prompt) hiệu quả và giám sát để học sinh không sử dụng AI thay thế hoàn toàn cho tư duy độc lập.
       - PHÂN BỔ TIẾT HỌC CHI TIẾT: Đầu mục này chỉ nêu tên và chủ đề chung của các tiết học trên dòng riêng (ví dụ: * TIẾT 1: KHỞI ĐỘNG CHUNG CHO CỤM BÀI HỌC. ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC; * TIẾT 2: ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC). TUYỆT ĐỐI KHÔNG được ghi nội dung mô tả chi tiết trong ngoặc đơn ở phần phân bổ này (ví dụ: KHÔNG ghi "... (BỐI CẢNH LỊCH SỬ, TÁC GIẢ...)") và KHÔNG liệt kê chi tiết các Hoạt động 1, Hoạt động 2, Nội dung 1, Nội dung 2 hay các tiểu mục 2.1, 2.2,... trong phần phân bổ tiết học này.
        - Mỗi tiết học khi đi vào chi tiết bên dưới vẫn bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (hãy viết hoa toàn bộ tên bài học và in đậm, tuyệt đối không được ghi thêm các chú thích kiểu "(căn giữa, viết hoa, in đậm)" hay "(viết hoa, in đậm, căn giữa)" vào văn bản). - QUY TẮC BẮT BUỘC CHO NHIỀU TIẾT: Đối với bài dạy nhiều tiết (ví dụ: bài học 2, 3, 4 tiết, hay thậm chí 11, 12, 15 tiết...), bạn phải thực hiện thiết kế chi tiết tất cả các hoạt động cho từng tiết. TUYỆT ĐỐI không tóm tắt sơ sài hay gom cụm các tiết sau. TẤT CẢ các hoạt động học ở tất cả các tiết (từ Tiết 1 đến Tiết cuối cùng) đều PHẢI ĐƯỢC THIẾT KẾ ĐẦY ĐỦ VÀ CHI TIẾT THEO CẤU TRÚC 4 PHẦN (a, b, c, d) DƯỚI ĐÂY.
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
                - **Bước 2: Thực hiện nhiệm vụ** <br> (HS thực hiện nhiệm vụ cá nhân/cặp/nhóm; GV theo dõi, hỗ trợ. Tích hợp NLS và AI: Mô tả HS dùng công cụ số/AI để tra cứu dữ liệu, tương tác prompt, kiểm chứng thông tin với mã năng lực số NC1 và mã AI chi tiết (10.A1.1, 11.C1.1, 12.C4.MR1, 12.A2.1...) viết dưới dạng văn bản thường không chứa dấu nháy ngược).
                - **Bước 3: Báo cáo kết quả và thảo luận** <br> HS trả lời câu hỏi. <br> Gv quan sát, hỗ trợ, tư vấn <br> (HS báo cáo kết quả thông qua sản phẩm số, phản hồi/trình bày trực tiếp trên bảng tương tác hoặc qua ứng dụng như Padlet, Mentimeter...; HS nhóm khác phản biện, thảo luận; GV điều hành).
                - **Bước 4: Nhận xét, đánh giá kết quả thực hiện nhiệm vụ** <br> GV: nhận xét đánh giá kết quả của các cá nhân, chuẩn hóa kiến thức. <br> (GV đánh giá tinh thần làm việc, sản phẩm của HS, chốt kiến thức cốt lõi và chuyển giao nhiệm vụ tiếp theo).
              * QUY TẮC BẮT BUỘC 4: Trong cột "Sản phẩm dự kiến", bạn PHẢI trình bày kết quả học tập THỰC TẾ, CỰC KỲ CHI TIẾT, HỆ THỐNG và TĂNG DUNG LƯỢNG NỘI DUNG/SỐ LƯỢNG CHỮ đến mức tối đa để làm tài liệu chuẩn mực cho giáo viên (tham khảo phong cách chi tiết của tài liệu TD.pdf). Tránh tuyệt đối viết ngắn gọn, khái quát, sơ sài hoặc hời hợt để giáo viên có thể dùng trực tiếp để dạy học thực tế trên lớp.
                - KHÔNG được ghi tiêu đề hoặc tên sản phẩm chung chung. Ví dụ: KHÔNG chỉ ghi "Dàn ý chi tiết của học sinh đạt chuẩn, có sự sáng tạo trong dùng từ ngữ phê bình văn học" mà PHẢI trình bày Dàn ý chi tiết thực tế có thể có của học sinh; KHÔNG chỉ ghi "Đoạn văn mẫu viết hoàn chỉnh có cấu trúc rõ ràng, diễn đạt lưu loát, giàu cảm xúc." mà PHẢI tạo ra một đoạn văn hoàn chỉnh thực tế.
                - Đối với các bảng biểu so sánh hoặc phân tích nhân vật, PHẢI viết đầy đủ nội dung đáp án chi tiết và toàn diện cho tất cả các cột và các ô trong cột Sản phẩm dự kiến, tuyệt đối không được để trống hoặc dùng dấu ba chấm "..." để giáo viên hay học sinh tự điền.
                - Phân tích nhân vật hoặc văn bản phải được phân tích sâu sắc thành các luận điểm cụ thể, phân tích chi tiết ý nghĩa văn học với dung lượng chữ nhiều, đầy đủ lập luận nghệ thuật và nội dung.
              * QUY TẮC BẮT BUỘC 5: Mỗi hoạt động học phải bắt đầu bằng tiêu đề Hoạt động độc lập bên ngoài bảng. Các mục a) Mục tiêu, b) Nội dung, c) Sản phẩm bắt buộc viết dưới dạng văn bản thông thường ngoài bảng, KHÔNG ĐƯỢC đưa vào trong bảng. Chỉ riêng mục d) Tổ chức thực hiện mới được trình bày dưới dạng bảng 2 cột.
              
              | Hoạt động của GV và HS | Sản phẩm dự kiến |
              | :--- | :--- |
              | **Bước 1: Chuyển giao nhiệm vụ học tập** <br> GV giao nhiệm vụ học tập rõ ràng, nêu yêu cầu, thời gian, học liệu số và hình thức làm việc. Nêu cách GV sử dụng bảng tương tác hoặc các công cụ trực tuyến (Kahoot!, Quizizz, Blooket, Padlet, Mentimeter...) để khởi động hoặc giao nhiệm vụ học tập. <br><br> **Bước 2: Thực hiện nhiệm vụ** <br> HS thực hiện nhiệm vụ (cá nhân/cặp/nhóm); GV theo dõi, hỗ trợ. [BẮT BUỘC Tích hợp NLS và AI: Mô tả HS dùng công cụ số/AI để tra cứu dữ liệu, tương tác prompt, kiểm chứng thông tin với mã năng lực số NC1 và mã AI chi tiết (10.A1.1, 11.C1.1, 12.C4.MR1, 12.A2.1...) viết dưới dạng văn bản thường không chứa dấu nháy ngược]. <br><br> **Bước 3: Báo cáo kết quả và thảo luận** <br> HS trả lời câu hỏi. <br> Gv quan sát, hỗ trợ, tư vấn <br> HS báo cáo kết quả thông qua các sản phẩm số, phản hồi/trình bày trực tiếp trên bảng tương tác hoặc qua ứng dụng trực tuyến (như đăng sản phẩm lên Padlet, trả lời trên Mentimeter, thảo luận nhóm qua bảng thông minh); HS nhóm khác phản biện, thảo luận; GV điều hành. <br><br> **Bước 4: Nhận xét, đánh giá kết quả thực hiện nhiệm vụ** <br> GV: nhận xét đánh giá kết quả của các cá nhân, chuẩn hóa kiến thức. GV nhận xét, đánh giá tinh thần làm việc và sản phẩm của học sinh, chuẩn hóa kiến thức cốt lõi và chuyển giao nhiệm vụ tiếp theo. | [Đưa ra đáp án chi tiết, kết quả thực hiện bài tập, nội dung bảng biểu đã hoàn thành, viết trực tiếp đoạn văn mẫu đầy đủ, bài viết phân tích dài, hoặc câu trả lời rất chi tiết cho các yêu cầu ở cột bên trái để chốt kiến thức...] |
         - QUY TẮC BẮT BUỘC TRONG BẢNG: Trong cột "Hoạt động của GV và HS" và "Sản phẩm dự kiến", sau mỗi câu hoặc sau mỗi ý hành động lớn, bạn PHẢI tự động xuống hàng bằng cách chèn thẻ <br> ở cuối để phân tách rõ ràng các ý, giúp giáo viên dễ đọc. Tuyệt đối không viết liền tù tì thành một đoạn dài.
       - Thể hiện rõ các PHƯƠNG PHÁP và KỸ THUẬT DẠY HỌC TÍCH CỰC lồng ghép năng lực số (Kỹ thuật KWL, Áp dụng Brainstorming, Think-Pair-Share, Khăn trải bàn, Mảnh ghép, Trạm xoay, PBL - Học theo vấn đề, Tranh luận chuyên sâu, Bể cá (Fishbowl)... nhằm tối ưu hóa sự tương tác và hào hứng trong giờ học).
       - Thiết kế để dạy học tối ưu trên BẢNG TƯƠNG TÁC bằng việc lồng ghép thông minh các CÔNG CỤ TRỰC TUYẾN tương tác cao: Kahoot!, Quizizz, Blooket, Padlet, Mentimeter, v.v., khai thác tối đa tính năng tương tác của bảng thông minh có tại trường.
       - Thể hiện rõ Chu trình thực hành AI khi học sinh tương tác với AI: Học sinh tự học/làm trước -> AI hỗ trợ -> Học sinh đối chiếu, kiểm chứng chéo thông tin với nguồn học thuật/SGK và trích dẫn nguồn trung thực.
     ${assessmentInstruction}

        YÊU CẦU VỀ ĐỊNH DẠNG VÀ PHƯƠNG PHÁP CÁC MÔN XÃ HỘI & TIẾNG ANH:
     1. ĐỐI VỚI TIẾNG ANH (LANGUAGE & STRUCTURES):
        - Các bảng từ vựng (Vocabulary), cấu trúc (Structures) phải rõ ràng, phân biệt rõ cột Từ/Cụm từ, Từ loại, Phiên âm, Nghĩa và Câu ví dụ.
        - Tích hợp các công cụ luyện phát âm AI (như Elsa Speak), chatbot AI đóng vai (role-play), hoặc công cụ sửa lỗi ngữ pháp.
      2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
          - Khi biên soạn KHBD liên quan đến Kỹ năng đọc hiểu văn bản, bạn bắt buộc phải tham khảo 02 nguồn tài liệu theo thứ tự ưu tiên sau:
            + Thứ nhất: Sách Giáo Viên (SGV) Ngữ văn lớp 10, lớp 11, lớp 12 (bộ sách Kết nối tri thức với cuộc sống).
            + Thứ hai: Các giáo án lớp 10, lớp 11, lớp 12 trong thư mục "MON NGU VAN-NEW".
          - BẮT BUỘC dựa vào gợi ý hoạt động trong Sách giáo viên Ngữ văn lớp 10, lớp 11, lớp 12 (Bộ sách Kết nối tri thức với cuộc sống) để triển khai chi tiết cho các nội dung hoạt động cụ thể (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) theo đúng cấu trúc Công văn 5512.
          - Các hoạt động học tập phát triển kỹ năng: Đọc văn bản, Thực hành tiếng Việt, Viết, Nói và Nghe trong KHBD phải bảo đảm biên soạn đúng theo các Yêu cầu cần đạt được quy định trong chương trình GDPT 2018 môn Ngữ văn đối với từng khối lớp tương ứng (đáp ứng đúng đặc trưng thể loại đọc hiểu, kiểu văn bản viết, và chuẩn kiến thức tiếng Việt, nói nghe).
          - Ngoài ra, bắt buộc bổ sung/duy trì hai mục lớn "${luyenTapSection}" và "${vanDungSection}" được thiết kế đầy đủ theo cấu trúc 4 phần của Công văn 5512 (a - Mục tiêu, b - Nội dung, c - Sản phẩm chi tiết, d - Tổ chức thực hiện dưới dạng bảng 2 cột). Trong đó, phần Luyện tập phải đa dạng hóa hình thức (viết kết nối đọc, thực hành ngôn ngữ, sơ đồ tư duy...), phần Vận dụng định hướng hành động (có thể sử dụng/chuyển hóa từ câu hỏi tự luận SGV); cả hai phần đều bám sát Sách giáo viên Ngữ văn 10, 11, 12 bộ Kết nối tri thức và bắt buộc cung cấp sản phẩm thực tế mẫu hoàn chỉnh cực kỳ chi tiết.
         - Cột "Sản phẩm dự kiến" PHẢI tạo ra sản phẩm hoàn chỉnh cực kỳ chi tiết (viết ra đoạn văn hoàn chỉnh mẫu, dàn ý chi tiết mẫu, điền đầy đủ nội dung bảng so sánh và phân tích, các câu trả lời đầy đủ), tuyệt đối không chỉ ghi tiêu đề hoặc ghi qua loa đại khái.
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
    - TUYỆT ĐỐI KHÔNG sử dụng ký hiệu 5 hoặc 6 dấu thăng ("#####" hoặc "######") trong toàn bộ văn bản.
    - TUYỆT ĐỐI KHÔNG ghi các từ chú thích định dạng như "(Căn giữa, viết hoa, in đậm)", "(viết hoa, in đậm, căn giữa)", hoặc bất kỳ chỉ dẫn định dạng nào khác vào nội dung bài dạy.

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

  const assessmentPromptPart = `
    IV. KẾ HOẠCH ĐÁNH GIÁ
    - Đánh giá năng lực thực chất (Process-based assessment): Tập trung đánh giá năng lực tư duy của học sinh thông qua:
      * Kỹ năng tương tác: Cách đặt câu hỏi, tinh chỉnh prompt hiệu quả cho AI (như cấu trúc Role-Context-Constraint).
      * Kỹ năng kiểm chứng: Khả năng phát hiện lỗi sai, thiên kiến hoặc ảo giác thông tin (hallucination) của AI bằng cách đối chiếu với nguồn dữ liệu gốc hoặc SGK chính thống.
      * Sử dụng có trách nhiệm: Ý thức tự giác khai báo mức độ sử dụng AI, trích dẫn nguồn học liệu hợp pháp và không đạo văn (sử dụng tiêu chuẩn trích dẫn AI Attribution Standards).
  `;
  const luyenTapHeader = "V. HOẠT ĐỘNG LUYỆN TẬP";
  const vanDungHeader = "VI. HOẠT ĐỘNG VẬN DỤNG";
  const phieuHocTapHeader = "VII. CÁC PHIẾU HỌC TẬP";

  const isDoc = lessonName.toLowerCase().includes('đọc:') || (lessonName.toLowerCase().includes('đọc') && !lessonName.toLowerCase().includes('thực hành đọc'));
  const isTiengViet = lessonName.toLowerCase().includes('tiếng việt');
  const isViet = lessonName.toLowerCase().includes('viết');
  const isNoiNghe = lessonName.toLowerCase().includes('nói và nghe');
  const isThucHanhDoc = lessonName.toLowerCase().includes('thực hành đọc');

  let skillSpecificPrompt = "";
  if (isLiterature) {
    if (isDoc) {
      skillSpecificPrompt = `
    NGUỒN THAM KHẢO VÀ THỨ TỰ ƯU TIÊN KHI BIÊN SOẠN KỸ NĂNG ĐỌC HIỂU VĂN BẢN:
    - Khi biên soạn KHBD liên quan đến Kỹ năng đọc hiểu văn bản, bạn bắt buộc phải tham khảo 02 nguồn tài liệu theo thứ tự ưu tiên sau:
      + Thứ nhất: Sách Giáo Viên (SGV) Ngữ văn lớp 10, lớp 11, lớp 12 (bộ sách Kết nối tri thức với cuộc sống).
      + Thứ hai: Các giáo án lớp 10, lớp 11, lớp 12 trong thư mục "MON NGU VAN-NEW".

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

  const prompt = `
    Bạn là một chuyên gia giáo dục và Trợ lý Giáo viên cấp cao tại Việt Nam, am hiểu Công văn 5512, Thông tư 18/2026/TT-BGDĐT quy định Khung năng lực số cho người học (trong đó AI là miền năng lực thứ sáu), Quyết định số 2422/QĐ-BGDĐT ngày 18/08/2026 ban hành Khung giáo dục AI và Công văn số 5588/BGDĐT-GDPT ngày 19/08/2026 hướng dẫn triển khai thực hiện giáo dục Trí tuệ nhân tạo từ năm học 2026-2027.

    Nhiệm vụ: Tạo một Kế hoạch bài dạy (KHBD) hoàn chỉnh cho bài học sau theo đúng mẫu Công văn 5512:
    - Tên bài: ${lessonName}
    - Số tiết: ${periods} tiết
    - Môn học: ${subject}
    - Khối lớp: ${grade}
    
    ${skillSpecificPrompt}
    
    LƯU Ý ĐẶC BIỆT KHI LỒNG GHÉP NĂNG LỰC SỐ VÀ GIÁO DỤC AI:
    - AI được tích hợp một cách linh hoạt trong tiến trình dạy học thích hợp, không tách thành phần riêng. 
    - Hãy tuân thủ các chỉ dẫn tích hợp giáo dục AI cốt lõi theo "ĐỊNH HƯỚNG TÍCH HỢP AI TRONG KHBD THEO TỪNG NHÓM MÔN HỌC":
      * Đối với môn học khác ngoài môn Tin học (như môn ${subject} ở đây): Tuyệt đối không dạy kiến thức kỹ thuật chuyên sâu hay lập trình AI. Sử dụng AI như một công cụ hỗ trợ để học sinh tìm kiếm thông tin, tóm tắt tư liệu, lập dàn ý, dịch thuật hoặc mô phỏng.
      * Tập trung vào các hoạt động tư duy bậc cao: Hướng dẫn học sinh phản biện, tranh biện, thảo luận về các vấn đề đạo đức (đạo văn, thiên kiến dữ liệu, quyền riêng tư) và đánh giá độ tin cậy của thông tin do AI cung cấp nhằm tránh phụ thuộc hoàn toàn vào công nghệ.
      * Trọng tâm năng lực phát triển: NLa (Tư duy lấy con người làm trung tâm) và NLb (Đạo đức AI).
    - ĐẢM BẢO THỜI LƯỢNG: Thiết kế nội dung chi tiết phủ kín ${periods} tiết học (45 phút/tiết).
    - Ôn tập/Luyện tập: Nếu tên bài là "Ôn tập chương X", hãy tập trung hệ thống hóa kiến thức dùng sơ đồ tư duy và thiết lập hệ thống bài tập phong phú (phần IV phiếu học tập có tối thiểu 15 câu trắc nghiệm và 5 bài tập tự luận).
    - Nội dung bám sát Chương trình GDPT 2018 và SGK Bộ sách Kết nối tri thức.

    Yêu cầu cấu trúc Công văn 5512 tích hợp NLS và AI:
    I. MỤC TIÊU
    1. Kiến thức
    2. Năng lực (Năng lực chung, Năng lực đặc thù của môn học)
    3. Năng lực số và Trí tuệ nhân tạo (AI):
       - Liệt kê các mã chỉ báo NLS chuẩn [Mã miền].[Mã nhánh].${NLS_FRAMEWORK.levelCode}[a/b/c...]. Ví dụ: 6.1.${NLS_FRAMEWORK.levelCode}a, 6.2.${NLS_FRAMEWORK.levelCode}b.
       - BẮT BUỘC MÃ HÓA NĂNG LỰC AI THÀNH PHẦN CHI TIẾT theo Quyết định số 2422/QĐ-BGDĐT và Công văn số 5588/BGDĐT-GDPT bằng cách ghép: [Khối_lớp].[Mã_chủ_đề][Biểu_hiện] (Ví dụ: 10.A1.1, 11.C1.1, 12.C4.MR1, 12.A2.1). QUY TẮC BẮT BUỘC: Toàn bộ các mã năng lực số và năng lực học liệu AI (ví dụ: 6.1.NC1a, 10.A1.1...) luôn phải được viết dưới dạng văn bản thường bình thường hoàn toàn, tuyệt đối không được bao bọc trong và không sử dụng các dấu nháy ngược khép kín (\`...\`) hay định dạng khối mã code block inline.
         * Bên cạnh mục tiêu phẩm chất, năng lực môn học, phải xác định cụ thể yêu cầu cần đạt về AI mà học sinh sẽ hình thành trong tiết học:
           - Về Nhận thức (NLa): Học sinh nhận ra vai trò, giới hạn hoặc rủi ro của AI trong nội dung bài học.
           - Về Trách nhiệm (NLb): Ý thức, hành vi trung thực học thuật, không sao chép máy móc sản phẩm do AI tạo ra.
         * Giải thích chi tiết mã chỉ báo năng lực AI: Ví dụ "11.C1.1" chỉ định chỉ số 1 nằm trong Chủ đề C1 (Dữ liệu & Logic) dành cho học sinh lớp 11; "10.A1.1" chỉ định chỉ số 1 của Chủ đề A1 dành cho lớp 10; "12.C4.MR1" chỉ định chỉ số nâng cao MR1 của Chủ đề C4 dành cho học sinh lớp 12.
         * Việc ghi chính xác mã đến từng chữ cái giúp giáo viên xác định chính xác mục tiêu giảng dạy, tổ chức thực hành, dự án AI và đánh giá học sinh sát sao nhất.
    4. Phẩm chất (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm)
    
    II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
    - Bổ sung mục “Công cụ số và AI”:
      * Phương án triển khai: Nhà trường sử dụng tình huống giả định (nếu không có máy tính/Internet) hay cho học sinh tương tác trực tiếp với công cụ AI.
      * Học liệu/công cụ cụ thể: Viết rõ tên nền tảng miễn phí, trực quan, không yêu cầu tài khoản trả phí (Gemini, Google AI Studio, Canva, Teachable Machine, NotebookLM...) hoặc các tài liệu cụ thể như các tệp dữ liệu giả định, bài báo, video thảo luận, ảnh chụp thiết kế...
    
    III. TIẾN TRÌNH DẠY HỌC
    - Đảm bảo các hoạt động học có nội dung AI được thiết kế linh hoạt, xuất hiện tự nhiên tại các hoạt động (Khởi động, Hình thành kiến thức, Luyện tập hoặc Vận dụng). Tiến trình thực hiện phải bám sát chu trình chuẩn: Học sinh tự làm → AI hỗ trợ → Học sinh đối chiếu, phản biện và đánh giá. Giáo viên đóng vai trò điều phối, đặt các câu hỏi dẫn dắt gợi mở, hướng dẫn học sinh kỹ năng đặt câu lệnh (prompt) hiệu quả và giám sát để học sinh không sử dụng AI thay thế hoàn toàn cho tư duy độc lập.
    - PHÂN BỔ TIẾT HỌC CHI TIẾT: Đầu mục này chỉ nêu tên các tiết học và chủ đề chung của các tiết đó một cách khái quát trên dòng riêng. TUYỆT ĐỐI KHÔNG được ghi nội dung mô tả chi tiết trong ngoặc đơn ở phần phân bổ này (ví dụ: KHÔNG ghi "... (BỐI CẢNH LỊCH SỬ - XÃ HỘI, TÁC GIẢ Vũ Trọng Phụng...)") và TUYỆT ĐỐI KHÔNG liệt kê chi tiết các Hoạt động 1, Hoạt động 2, Nội dung 1, Nội dung 2 hay các tiểu mục 2.1, 2.2,... ở phần phân bổ này để tránh làm rối mắt giáo viên (vì các hoạt động học cụ thể đã được triển khai chi tiết ở bên dưới).
      Ví dụ mẫu chuẩn:
      * TIẾT 1: KHỞI ĐỘNG CHUNG CHO CỤM BÀI HỌC. ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC
      * TIẾT 2: ĐỌC - HIỂU VĂN BẢN XUÂN TÓC ĐỎ CỨU QUỐC
    - Mỗi tiết học khi đi vào chi tiết bên dưới vẫn bắt đầu bằng tiêu đề dòng riêng: **TIẾT X: [NỘI DUNG KIẾN THỨC BÀI HỌC]** (hãy viết hoa toàn bộ tên bài học và in đậm, tuyệt đối không được ghi thêm các chú thích kiểu "(căn giữa, viết hoa, in đậm)" hay "(viết hoa, in đậm, căn giữa)" vào văn bản). 
    - QUY TẮC BẮT BUỘC CHO NHIỀU TIẾT: Đối với bài học thiết kế cho nhiều tiết (ví dụ: bài học 2, 3, 4 tiết, hay thậm chí 11, 12, 15 tiết...), bạn phải thực hiện thiết kế chi tiết tất cả các hoạt động cho từng tiết. TUYỆT ĐỐI không tóm tắt sơ sài hay gom cụm các tiết sau. TẤT CẢ các hoạt động học ở tất cả các tiết (từ Tiết 1 đến Tiết cuối cùng) đều PHẢI ĐƯỢC THIẾT KẾ ĐẦY ĐỦ VÀ CHI TIẾT THEO CẤU TRÚC 4 PHẦN (a, b, c, d) DƯỚI ĐÂY.
    - CẤM TÓM TẮT HOẶC VIẾT GHI CHÚ LƯỢC BỚT: NGHIÊM CẤM TUYỆT ĐỐI việc viết các câu lược trích hoặc để ghi chú trống bằng tiếng Việt như: "(Do giới hạn dung lượng, tôi xin lược trích...)", "(Lưu ý: Giáo viên cần tự điều chỉnh thời lượng...)", hoặc bất kỳ câu nào gợi ý giáo viên tự điền. Bạn BẮT BUỘC phải phân chia các hoạt động phù hợp (ví dụ: chia thành 4-5 hoạt động lớn phủ đều các nhóm tiết như Hoạt động 1: Tiết 1-2, Hoạt động 2: Tiết 3-5, Hoạt động 3: Tiết 6-8, Hoạt động 4: Tiết 9-11) và viết chi tiết đầy đủ 100% tất cả các tiết học từ Tiết 1 đến Tiết cuối cùng để phủ kín toàn bộ ${periods} tiết học của bài học.
    - Hoạt động 1 (của Tiết 1) PHẢI là hoạt động khởi động bám sát các kĩ thuật khơi gợi cảm xúc, bối cảnh, thẩm mĩ và kết nối trải nghiệm đặc thù của môn Ngữ văn phù hợp với thể loại văn bản (Không kiểm tra bài cũ). Tránh lạm dụng các công cụ tương tác số như Kahoot!, Mentimeter... nếu chúng làm giảm tính nghệ thuật và sự đồng cảm với tác phẩm.
    - Cân bằng giữa thảo luận và thực hành. Áp dụng linh hoạt các KỸ THUẬT DẠY HỌC TÍCH CỰC (Kỹ thuật KWL, Áp dụng Brainstorming, Think-Pair-Share, Khăn trải bàn, Mảnh ghép, Trạm xoay, PBL - Học theo vấn đề, Tranh luận chuyên sâu, Bể cá (Fishbowl)... nhằm tối ưu hóa sự tương tác, chiếm lĩnh cách học và kiến thức bài học của học sinh).
    - Thiết kế bài dạy để dạy học tối ưu trên BẢNG TƯƠNG TÁC (Smart Board), lồng ghép kịch bản dùng trực tiếp các CÔNG CỤ TRỰC TUYẾN: Kahoot!, Quizizz, Blooket, Padlet, Mentimeter... Hãy viết rõ các bước tương tác nơi học sinh sử dụng bảng tại trường và các ứng dụng này phản hồi trực tiếp.
    - Đảm bảo thiết kế các hoạt động chi tiết cực kỳ chuẩn chỉ bám sát CV5512, thể hiện đầy đủ các mục cho TẤT CẢ các hoạt động trong mọi tiết học:
      a) Mục tiêu: Xác định rõ yêu cầu kiến thức/kỹ năng cần đạt của hoạt động đó.
      b) Nội dung: Giao nhiệm vụ, câu hỏi, bài tập cụ thể, nhiệm vụ học tập đầy đủ cho học sinh.
      c) Sản phẩm: Kết quả bài làm của học sinh (đáp án chi tiết, bảng biểu đã điền, ý kiến trả lời cụ thể, bài trình bày...), đảm bảo độ phân giải vật lý cao nhất của sản phẩm mẫu, tuyệt đối không viết chung chung đại khái.
      d) Tổ chức thực hiện: Thiết kế bắt buộc dưới dạng bảng Markdown có cấu trúc 2 cột cụ thể như sau. Nhấn mạnh chỉ thay đổi ở mục d) Tổ chức thực hiện, các phần khác trong KHBD giữ nguyên.
           * QUY TẮC BẮT BUỘC 1: Ngay dưới tiêu đề "d) Tổ chức thực hiện:" và ngay phía trên bảng, phải ghi rõ phương pháp/kỹ thuật dạy học tích cực được áp dụng (ví dụ: Kỹ thuật KWL, Áp dụng Brainstorming, Think-Pair-Share, Khăn trải bàn, Mảnh ghép, Trạm xoay, PBL, Tranh luận, Bể cá...). Ví dụ: **[Phương pháp áp dụng: Khăn trải bàn & Trạm xoay]** hoặc **[Phương pháp áp dụng: Sơ đồ tư duy trên Bảng tương tác]**.
           * QUY TẮC BẮT BUỘC 2: Trong các bước Giao nhiệm vụ, Thực hiện nhiệm vụ, Báo cáo - thảo luận, phải ghi cụ thể hành động học sinh/giáo viên sử dụng bảng tương tác (Smart Board) và các ứng dụng trực tuyến như Kahoot!, Quizizz, Blooket, Padlet, Mentimeter... để thực hành/báo cáo sản phẩm.
           * QUY TẮC BẮT BUỘC 3: Bảng có đúng 2 cột mang tên: "Hoạt động của GV và HS" và "Sản phẩm dự kiến". Cột thứ nhất "Hoạt động của GV và HS" phải có đầy đủ 4 bước như mẫu dưới đây (sử dụng thẻ <br> để ngăn cách các dòng/ý hành động của giáo viên và học sinh trong ô):
             - **Bước 1: Chuyển giao nhiệm vụ học tập** <br> (GV giao nhiệm vụ cụ thể, câu hỏi/nhiệm vụ học tập, thời gian, học liệu số và hình thức làm việc. Ghi rõ cách GV sử dụng bảng tương tác hoặc các công cụ trực tuyến như Kahoot!, Quizizz, Blooket, Padlet, Mentimeter... để giao nhiệm vụ hoặc khởi động).
             - **Bước 2: Thực hiện nhiệm vụ** <br> (HS thực hiện nhiệm vụ cá nhân/cặp/nhóm; GV theo dõi, hỗ trợ. Tích hợp NLS và AI: Mô tả HS dùng công cụ số/AI để tra cứu dữ liệu, tương tác prompt, kiểm chứng thông tin với mã năng lực số NC1 và mã AI chi tiết (10.A1.1, 11.C1.1, 12.C4.MR1, 12.A2.1...) viết dưới dạng văn bản thường không chứa dấu nháy ngược).
             - **Bước 3: Báo cáo kết quả và thảo luận** <br> HS trả lời câu hỏi. <br> Gv quan sát, hỗ trợ, tư vấn <br> (HS báo cáo kết quả thông qua sản phẩm số, phản hồi/trình bày trực tiếp trên bảng tương tác hoặc qua ứng dụng như Padlet, Mentimeter...; HS nhóm khác phản biện, thảo luận; GV điều hành).
             - **Bước 4: Nhận xét, đánh giá kết quả thực hiện nhiệm vụ** <br> GV: nhận xét đánh giá kết quả của các cá nhân, chuẩn hóa kiến thức. <br> (GV đánh giá tinh thần làm việc, sản phẩm của HS, chốt kiến thức cốt lõi và chuyển giao nhiệm vụ tiếp theo).
           * QUY TẮC BẮT BUỘC 4: Trong cột "Sản phẩm dự kiến", bạn PHẢI trình bày kết quả học tập THỰC TẾ, CỰC KỲ CHI TIẾT, HỆ THỐNG và TĂNG DUNG LƯỢNG NỘI DUNG/SỐ LƯỢNG CHỮ đến mức tối đa để làm tài liệu chuẩn mực cho giáo viên (tham khảo phong cách chi tiết của tài liệu TD.pdf). Tránh tuyệt đối viết ngắn gọn, khái quát, sơ sài hoặc hời hợt để giáo viên có thể dùng trực tiếp để dạy học thực tế trên lớp.
             - KHÔNG được ghi tiêu đề hoặc tên sản phẩm chung chung. Ví dụ: KHÔNG chỉ ghi "Dàn ý chi tiết của học sinh đạt chuẩn, có sự sáng tạo trong dùng từ ngữ phê bình văn học" mà PHẢI trình bày Dàn ý chi tiết thực tế có thể có của học sinh; KHÔNG chỉ ghi "Đoạn văn mẫu viết hoàn chỉnh có cấu trúc rõ ràng, diễn đạt lưu loát, giàu cảm xúc." mà PHẢI tạo ra một đoạn văn hoàn chỉnh thực tế.
             - Đối với các bảng biểu so sánh hoặc phân tích nhân vật, PHẢI viết đầy đủ nội dung đáp án chi tiết và toàn diện cho tất cả các cột và các ô trong cột Sản phẩm dự kiến, tuyệt đối không được để trống hoặc dùng dấu ba chấm "..." để giáo viên hay học sinh tự điền.
             - Phân tích nhân vật hoặc văn bản phải được phân tích sâu sắc thành các luận điểm cụ thể, phân tích chi tiết ý nghĩa văn học với dung lượng chữ nhiều, đầy đủ lập luận nghệ thuật và nội dung.
           * QUY TẮC BẮT BUỘC 5: Mỗi hoạt động học phải bắt đầu bằng tiêu đề Hoạt động độc lập bên ngoài bảng. Các mục a) Mục tiêu, b) Nội dung, c) Sản phẩm bắt buộc viết dưới dạng văn bản thông thường ngoài bảng, KHÔNG ĐƯỢC đưa vào trong bảng. Chỉ riêng mục d) Tổ chức thực hiện mới được trình bày dưới dạng bảng 2 cột.
           
           | Hoạt động của GV và HS | Sản phẩm dự kiến |
           | :--- | :--- |
           | **Bước 1: Chuyển giao nhiệm vụ học tập** <br> GV giao nhiệm vụ học tập rõ ràng, nêu yêu cầu, thời gian, học liệu số và hình thức làm việc. Nêu cách GV sử dụng bảng tương tác hoặc các công cụ trực tuyến (Kahoot!, Quizizz, Blooket, Padlet, Mentimeter...) để khởi động hoặc giao nhiệm vụ học tập. <br><br> **Bước 2: Thực hiện nhiệm vụ** <br> HS thực hiện nhiệm vụ (cá nhân/cặp/nhóm); GV theo dõi, hỗ trợ. [BẮT BUỘC Tích hợp NLS và AI: Mô tả HS dùng công cụ số/AI để tra cứu dữ liệu, tương tác prompt, kiểm chứng thông tin với mã năng lực số NC1 và mã AI chi tiết (10.A1.1, 11.C1.1, 12.C4.MR1, 12.A2.1...) viết dưới dạng văn bản thường không chứa dấu nháy ngược]. <br><br> **Bước 3: Báo cáo kết quả và thảo luận** <br> HS trả lời câu hỏi. <br> Gv quan sát, hỗ trợ, tư vấn <br> HS báo cáo kết quả thông qua các sản phẩm số, phản hồi/trình bày trực tiếp trên bảng tương tác hoặc qua ứng dụng trực tuyến (như đăng sản phẩm lên Padlet, trả lời trên Mentimeter, thảo luận nhóm qua bảng thông minh); HS nhóm khác phản biện, thảo luận; GV điều hành. <br><br> **Bước 4: Nhận xét, đánh giá kết quả thực hiện nhiệm vụ** <br> GV: nhận xét đánh giá kết quả của các cá nhân, chuẩn hóa kiến thức. GV nhận xét, đánh giá tinh thần làm việc và sản phẩm của học sinh, chuẩn hóa kiến thức cốt lõi và chuyển giao nhiệm vụ tiếp theo. | [Đưa ra đáp án chi tiết, kết quả thực hiện bài tập, nội dung bảng biểu đã hoàn thành, viết trực tiếp đoạn văn mẫu đầy đủ, bài viết phân tích dài, hoặc câu trả lời rất chi tiết cho các yêu cầu ở cột bên trái để chốt kiến thức...] |
      - QUY TẮC BẮT BUỘC TRONG BẢNG: Trong cột "Hoạt động của GV và HS" và "Sản phẩm dự kiến", sau mỗi câu hoặc sau mỗi ý hành động lớn, bạn PHẢI tự động xuống hàng bằng cách chèn thẻ <br> ở cuối để phân tách rõ ràng các ý, giúp giáo viên dễ đọc. Tuyệt đối không viết liền tù tì thành một đoạn dài.
 
     ${assessmentPromptPart}

     ${luyenTapHeader}
    - Hoạt động luyện tập phải được thiết kế và triển khai đầy đủ theo cấu trúc 4 phần của Công văn 5512:
      a) Mục tiêu: Xác định rõ yêu cầu kiến thức/kỹ năng cần đạt của hoạt động luyện tập.
      b) Nội dung: Giao nhiệm vụ, bài tập cụ thể cho học sinh (đa dạng hóa hình thức luyện tập như thực hành ngôn ngữ, viết sáng tạo, viết kết nối với đọc, sơ đồ tư duy... dựa vào gợi ý hoạt động trong Sách giáo viên Ngữ văn lớp 10, 11, 12 bộ Kết nối tri thức với cuộc sống).
      c) Sản phẩm: Trình bày chi tiết, đầy đủ các yêu cầu của hoạt động (BẮT BUỘC viết hoàn chỉnh đoạn văn mẫu, lập dàn ý chi tiết mẫu đầy đủ, câu trả lời phân tích văn học mẫu đầy đủ ý nghĩa, giàu cảm xúc; tuyệt đối không chỉ ghi tiêu đề hoặc ghi qua loa đại khái, không chỉ ghi "Đoạn văn mẫu..." hay "Gợi ý đáp án...").
      d) Tổ chức thực hiện: Trình bày dưới dạng bảng 2 cột "Hoạt động của GV và HS" và "Sản phẩm dự kiến" gồm đầy đủ 4 bước tiêu chuẩn của CV 5512 (Chuyển giao, Thực hiện, Báo cáo thảo luận, Nhận xét đánh giá) tương tự như cấu trúc bảng ở phần III.

    VI. HOẠT ĐỘNG VẬN DỤNG
    - Hoạt động vận dụng phải được thiết kế và triển khai đầy đủ theo cấu trúc 4 phần của Công văn 5512:
      a) Mục tiêu: Xác định rõ yêu cầu năng lực vận dụng thực tế cần đạt.
      b) Nội dung: Giao nhiệm vụ vận dụng mang tính thực tiễn và định hướng hành động (có thể sử dụng hoặc chuyển hóa từ các câu hỏi/bài tập tự luận trong Sách giáo viên Ngữ văn lớp 10, 11, 12 bộ Kết nối tri thức với cuộc sống).
      c) Sản phẩm: Trình bày chi tiết, đầy đủ các yêu cầu của hoạt động (BẮT BUỘC cung cấp sản phẩm mẫu hoàn chỉnh cực kỳ chi tiết như văn bản mẫu hoàn chỉnh, định hướng dự án học tập chi tiết, hướng dẫn hành động thực tế chi tiết; tuyệt đối không ghi chung chung đại khái hoặc để trống).
      d) Tổ chức thực hiện: Trình bày dưới dạng bảng 2 cột "Hoạt động của GV và HS" và "Sản phẩm dự kiến" gồm đầy đủ 4 bước tiêu chuẩn của CV 5512 (Chuyển giao, Thực hiện, Báo cáo thảo luận, Nhận xét đánh giá) tương tự như cấu trúc bảng ở phần III.

    VII. CÁC PHIẾU HỌC TẬP (Đặt ở cuối bài dạy)
    - Xây dựng đầy đủ nội dung chi tiết Phiếu học tập số 1, số 2, số 3... phục vụ các hoạt động học ở mục III. Tiêu đề "PHIẾU HỌC TẬP SỐ X: [Tên]" phải nằm độc lập trên 1 dòng riêng.
    - Hệ thống câu hỏi luyện tập và vận dụng để giáo viên nạp liệu cho Kahoot!, Quizizz hoặc Liveworksheets.
    - Yêu cầu số lượng câu hỏi trắc nghiệm: Đúng 10 câu trắc nghiệm (đối với bài học kiến thức mới) hoặc 15 câu (đối với bài ôn tập/luyện tập). Các phương án A, B, C, D trình bày ở dòng riêng biệt. Bao bọc đáp án đúng bằng thẻ <correct>...</correct>. Ví dụ: <correct>A. Na2SO4</correct>. KHÔNG viết câu "Đáp án đúng là..." mà chỉ dùng thẻ <correct>.
    - Các bài tập tự luận, tính toán (tối thiểu 3-5 bài tập tự luận). Đối với tất cả các bài tập tự luận hay câu hỏi tự luận, yêu cầu AI trình bày câu trả lời/đáp án hoàn chỉnh dưới dạng đoạn văn hoặc văn bản đầy đủ ý nghĩa, giàu cảm xúc và phân tích sâu sắc nghệ thuật. Tuyệt đối KHÔNG được chỉ ghi các từ khóa, gạch đầu dòng các ý chính, gạch đầu dòng sơ sài hay để nhãn "Gợi ý đáp án" mà không viết hoàn chỉnh.
    - BẮT BUỘC PHẢI VIẾT ĐẦY ĐỦ NỘI DUNG ĐÁP ÁN CHI TIẾT: Đối với tất cả các bảng biểu so sánh, phân loại, thảo luận nhóm trong phần "VII. CÁC PHIẾU HỌC TẬP" (ví dụ: PHIẾU HỌC TẬP SỐ 1: BẢNG SO SÁNH NHÂN VẬT), bạn BẮT BUỘC phải điền đầy đủ nội dung cho tất cả các cột (bao gồm cột "Ý nghĩa" hay bất cứ cột nội dung nào khác), tuyệt đối không được để trống hoặc dùng dấu ba chấm "..." để học sinh điền. Giáo viên Ngữ văn yêu cầu nội dung được hiển thị rõ ràng, đầy đủ và chi tiết nhất để có thể dùng giảng dạy trực tiếp trên thực tế.

    YÊU CẦU VỀ ĐỊNH DẠNG VÀ PHƯƠNG PHÁP CÁC MÔN XÃ HỘI & TIẾNG ANH:
    1. ĐỐI VỚI TIẾNG ANH (LANGUAGE & STRUCTURES):
       - Các bảng từ vựng (Vocabulary), cấu trúc (Structures) phải rõ ràng, phân biệt rõ cột Từ/Cụm từ, Từ loại, Phiên âm, Nghĩa và Câu ví dụ.
       - Tích hợp các công cụ luyện phát âm AI (như Elsa Speak), chatbot AI đóng vai (role-play), hoặc công cụ sửa lỗi ngữ pháp.
     2. ĐỐI VỚI NGỮ VĂN (LITERATURE & READING COMPREHENSION):
        - Khi biên soạn KHBD liên quan đến Kỹ năng đọc hiểu văn bản, bạn bắt buộc phải tham khảo 02 nguồn tài liệu theo thứ tự ưu tiên sau:
          + Thứ nhất: Sách Giáo Viên (SGV) Ngữ văn lớp 10, lớp 11, lớp 12 (bộ sách Kết nối tri thức với cuộc sống).
          + Thứ hai: Các giáo án lớp 10, lớp 11, lớp 12 trong thư mục "MON NGU VAN-NEW".
        - BẮT BUỘC dựa vào gợi ý hoạt động trong Sách giáo viên Ngữ văn lớp 10, lớp 11, lớp 12 (Bộ sách Kết nối tri thức với cuộc sống) để triển khai chi tiết cho các nội dung hoạt động cụ thể (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) theo đúng cấu trúc Công văn 5512.
        - Các hoạt động học tập phát triển kỹ năng: Đọc văn bản, Thực hành tiếng Việt, Viết, Nói và Nghe trong KHBD phải bảo đảm biên soạn đúng theo các Yêu cầu cần đạt được quy định trong chương trình GDPT 2018 môn Ngữ văn đối với từng khối lớp tương ứng (đáp ứng đúng đặc trưng thể loại đọc hiểu, kiểu văn bản viết, và chuẩn kiến thức tiếng Việt, nói nghe).
        - Cột "Sản phẩm dự kiến" PHẢI tạo ra sản phẩm hoàn chỉnh cực kỳ chi tiết (viết ra đoạn văn hoàn chỉnh mẫu, dàn ý chi tiết mẫu, điền đầy đủ nội dung bảng so sánh và phân tích, các câu trả lời đầy đủ), tuyệt đối không chỉ ghi tiêu đề hoặc ghi qua loa đại khái.
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

    LƯU Ý QUAN TRỌNG:
    - Mọi nội dung NLS và giáo dục AI được bổ sung thêm PHẢI được bao bọc trong cặp thẻ <nls> và </nls>.
    - Không viết tắt tự ý ngoài các thuật ngữ chuẩn và mã hóa năng lực trong hướng dẫn.
    - Trả về toàn bộ nội dung giáo án hoàn chỉnh, phong phú và chi tiết.
    - TUYỆT ĐỐI KHÔNG sử dụng ký hiệu 5 hoặc 6 dấu thăng ("#####" hoặc "######") trong toàn bộ văn bản.
    - TUYỆT ĐỐI KHÔNG ghi các từ chú thích định dạng như "(Căn giữa, viết hoa, in đậm)", "(viết hoa, in đậm, căn giữa)", hoặc bất kỳ chỉ dẫn định dạng nào khác vào nội dung bài dạy.
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