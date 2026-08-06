import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, CheckCircle2, Download, Loader2, ChevronRight, 
  BookOpen, GraduationCap, X, Sparkles, Lock, CreditCard, ShieldCheck, Copy, Check, QrCode 
} from 'lucide-react';
import mammoth from 'mammoth';
import { integrateNLS, generateLessonPlan } from './services/geminiService';
import { generateDocx } from './services/docxService';
import LessonPlanPreviewer from './components/LessonPlanPreviewer';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Payment configuration for MB Bank
const PAYMENT_CONFIG = {
  bankId: 'MB',
  accountNo: '0989618939', // Số tài khoản MB Bank mới
  accountName: 'TRAN MINH THANH', // Tên chủ tài khoản mới
  branch: 'Ngân hàng Quân Đội (MB Bank)',
  supportZalo: '0989618939', // Số điện thoại hỗ trợ Zalo
  adminBypassKey: 'TMT_KEYGEN_2026', // Khóa mở cổng Admin Keygen ẩn mới để tránh lộ cổng admin khi cấp key vĩnh viễn cho người dùng
  salt: 'TMT_2026_KHBD_SALT', // Muối băm mã kích hoạt bảo mật
  cassoApiKey: ''
};

const PAYMENT_PACKAGES = [
  { id: 'goi1', name: 'Gói 1 (Trải nghiệm)', price: 25000, credits: 5, label: '5 lượt tải - 5.000đ/lượt (Gemini 3.5 Flash)', prefix: 'VIP5' },
  { id: 'goi2', name: 'Gói 2 (Tiết kiệm)', price: 60000, credits: 15, label: '15 lượt tải - 4.000đ/lượt (Gemini 3.5 Flash)', prefix: 'VIP15' },
  { id: 'goi3', name: 'Gói 3 (Pro)', price: 140000, credits: 40, label: '40 lượt tải - 3.500đ/lượt (Gemini 3.5 Flash)', prefix: 'VIP40' }
];


const SUBJECTS = ['Ngữ văn'];
const GRADES = ['Lớp 10', 'Lớp 11', 'Lớp 12'];


// ==================== Ngữ văn ====================
const LITERATURE_10_LESSONS = [
  {
    "id": 5000,
    "name": "Bài 1. Sức hấp dẫn của truyện kể",
    "periods": 9.5
  },
  {
    "id": 5001,
    "name": "Đọc: Truyện về các vị thần sáng tạo thế giới (Thần thoại Việt Nam); Tản Viên từ Phán sự lục (Nguyễn Dữ); Chữ người tử tù (Nguyễn Tuân)",
    "periods": 5
  },
  {
    "id": 5002,
    "name": "Thực hành tiếng Việt: Sử dụng từ Hán Việt",
    "periods": 1
  },
  {
    "id": 5003,
    "name": "Viết: Viết văn bản nghị luận phân tích, đánh giá một tác phẩm truyện (Chủ đề, những nét đặc sắc về hình thức nghệ thuật)",
    "periods": 2
  },
  {
    "id": 5004,
    "name": "Nói và nghe: Giới thiệu, đánh giá về nội dung và nghệ thuật của một truyện",
    "periods": 1
  },
  {
    "id": 5005,
    "name": "Thực hành đọc: Tê-dê (Trích Thần thoại Hy Lạp, Ê-đi Ha-min-tơn kể)",
    "periods": 0.5
  },
  {
    "id": 5006,
    "name": "Bài 2. Vẻ đẹp của thơ ca",
    "periods": 10
  },
  {
    "id": 5007,
    "name": "Đọc: Chùm thơ hai-cư (haiku) Nhật Bản; Thu hứng (Đỗ Phủ); Mùa xuân chín (Hàn Mặc Tử); Bản hòa âm ngôn từ trong Tiếng thu của Lưu Trọng Lư (Chu Văn Sơn)",
    "periods": 5.5
  },
  {
    "id": 5008,
    "name": "Thực hành tiếng Việt: Lỗi dùng từ, lỗi về trật tự từ và cách sửa",
    "periods": 1
  },
  {
    "id": 5009,
    "name": "Viết: Viết văn bản nghị luận phân tích, đánh giá một tác phẩm thơ",
    "periods": 2
  },
  {
    "id": 5010,
    "name": "Nói và nghe: Giới thiệu, đánh giá về nội dung và nghệ thuật của một tác phẩm thơ",
    "periods": 1
  },
  {
    "id": 5011,
    "name": "Thực hành đọc: Cánh đồng (Ngân Hoa)",
    "periods": 0.5
  },
  {
    "id": 5012,
    "name": "Bài 3. Nghệ thuật thuyết phục trong văn bản nghị luận",
    "periods": 10
  },
  {
    "id": 5013,
    "name": "Đọc: Hiền tài là nguyên khí của quốc gia (Thân Nhân Trung); Yêu và đồng cảm (Phong Tử Khải); Chữ bầu lên nhà thơ (Lê Đạt)",
    "periods": 5.5
  },
  {
    "id": 5014,
    "name": "Kiểm tra giữa học kì 1",
    "periods": 2
  },
  {
    "id": 5015,
    "name": "Thực hành tiếng Việt: Lỗi về mạch lạc và liên kết trong đoạn văn, văn bản: Dấu hiệu nhận biết và cách chỉnh sửa",
    "periods": 1
  },
  {
    "id": 5016,
    "name": "Viết: Viết bài luận thuyết phục người khác từ bỏ thói quen hay một quan niệm",
    "periods": 2
  },
  {
    "id": 5017,
    "name": "Nói và nghe: Thảo luận về một vấn đề xã hội có ý kiến khác nhau",
    "periods": 1
  },
  {
    "id": 5018,
    "name": "Thực hành đọc: Thế giới mạng và tôi (Nguyễn Thị Hậu)",
    "periods": 0.5
  },
  {
    "id": 5019,
    "name": "Trả bài kiểm tra giữa học kì 1",
    "periods": 1
  },
  {
    "id": 5020,
    "name": "Bài 4. Sức sống của sử thi",
    "periods": 9
  },
  {
    "id": 5021,
    "name": "Đọc: Héc-to từ biệt Ăng-đrô-mác (Hô-me-rơ); Đăm Săn đi bắt Nữ Thần Mặt Trời (Sử thi Ê-đê)",
    "periods": 4.5
  },
  {
    "id": 5022,
    "name": "Thực hành tiếng Việt: Sử dụng trích dẫn, cước chú và cách đánh dấu phần bị tỉnh lược trong văn bản",
    "periods": 1
  },
  {
    "id": 5023,
    "name": "Viết: Viết báo cáo nghiên cứu về một vấn đề",
    "periods": 2
  },
  {
    "id": 5024,
    "name": "Nói và nghe: Trình bày kết quả báo cáo nghiên cứu về một vấn đề",
    "periods": 1
  },
  {
    "id": 5025,
    "name": "Thực hành đọc: Ra-ma buộc tội (Trích Ra-ma-ya-na – Van-mi-ki)",
    "periods": 0.5
  },
  {
    "id": 5026,
    "name": "Bài 5. Tích trò sân khấu dân gian",
    "periods": 7.5
  },
  {
    "id": 5027,
    "name": "Đọc: Xúy Vân giả dại (Kim Nham); Huyện đường (Nghêu, Sò, Ốc, Hến); Múa rối nước – hiện đại soi bóng tiền nhân (Phạm Thùy Dung)",
    "periods": 4
  },
  {
    "id": 5028,
    "name": "Viết: Viết báo cáo nghiên cứu (Về một vấn đề văn hóa truyền thống Việt Nam)",
    "periods": 2
  },
  {
    "id": 5029,
    "name": "Nói và nghe: Lắng nghe và phản hồi về một bài thuyết trình kết quả nghiên cứu",
    "periods": 1
  },
  {
    "id": 5030,
    "name": "Thực hành đọc: Hồn thiêng đưa đường (Trích tuồng Sơn Hậu)",
    "periods": 0.5
  },
  {
    "id": 5031,
    "name": "Ôn tập kiểm tra học kì 1",
    "periods": 2
  },
  {
    "id": 5032,
    "name": "Kiểm tra học kì 1",
    "periods": 2
  },
  {
    "id": 5033,
    "name": "Trả bài kiểm tra học kì 1",
    "periods": 1
  },
  {
    "id": 5034,
    "name": "Bài 6. Nguyễn Trãi – 'Dành còn để trợ dân này'",
    "periods": 10.5
  },
  {
    "id": 5035,
    "name": "Đọc: Tác gia Nguyễn Trãi; Bình Ngô đại cáo; Bảo kính cảnh giới (bài 43); Dục Thúy Sơn",
    "periods": 6
  },
  {
    "id": 5036,
    "name": "Thực hành tiếng Việt: Sử dụng từ Hán Việt (tiếp theo)",
    "periods": 1
  },
  {
    "id": 5037,
    "name": "Viết: Viết văn bản nghị luận về một vấn đề xã hội",
    "periods": 2
  },
  {
    "id": 5038,
    "name": "Nói và nghe: Thảo luận về một vấn đề xã hội có ý kiến khác nhau",
    "periods": 1
  },
  {
    "id": 5039,
    "name": "Thực hành đọc: Ngôn chí (bài 3); Bạch Đằng hải khẩu (Nguyễn Trãi)",
    "periods": 0.5
  },
  {
    "id": 5040,
    "name": "Bài 7. Quyền năng của người kể chuyện",
    "periods": 11.5
  },
  {
    "id": 5041,
    "name": "Đọc: Người cầm quyền khôi phục uy quyền (Vích-to Huy-gô); Dưới bóng hoàng lan (Thạch Lam); Một chuyện đùa nho nhỏ (An-tôn Sê-khốp)",
    "periods": 7
  },
  {
    "id": 5042,
    "name": "Thực hành tiếng Việt: Biện pháp chêm xen, biện pháp liệt kê",
    "periods": 1
  },
  {
    "id": 5043,
    "name": "Viết: Viết bài văn nghị luận phân tích, đánh giá một tác phẩm văn học (chủ đề và nhân vật trong tác phẩm truyện)",
    "periods": 2
  },
  {
    "id": 5044,
    "name": "Nói và nghe: Thảo luận về một vấn đề văn học có ý kiến khác nhau",
    "periods": 1
  },
  {
    "id": 5045,
    "name": "Thực hành đọc: Con khướu sổ lòng (Nguyễn Quang Sáng)",
    "periods": 0.5
  },
  {
    "id": 5046,
    "name": "Kiểm tra giữa kì 2",
    "periods": 2
  },
  {
    "id": 5047,
    "name": "Trả bài kiểm tra giữa kì 2",
    "periods": 1
  },
  {
    "id": 5048,
    "name": "Bài 8. Thế giới đa dạng của thông tin",
    "periods": 10.5
  },
  {
    "id": 5049,
    "name": "Đọc: Sự sống và cái chết (Trịnh Xuân Thuận); Nghệ thuật truyền thống của người Việt (Nguyễn Văn Huyên); Phục hồi tầng ozone: Thành công hiếm hoi của nỗ lực toàn cầu (Lê My)",
    "periods": 6
  },
  {
    "id": 5050,
    "name": "Thực hành tiếng Việt: Sử dụng phương tiện phi ngôn ngữ",
    "periods": 1
  },
  {
    "id": 5051,
    "name": "Viết: Viết một văn bản nội quy hoặc văn bản hướng dẫn nơi công cộng",
    "periods": 2
  },
  {
    "id": 5052,
    "name": "Nói và nghe: Thảo luận về văn bản nội quy hoặc văn bản hướng dẫn nơi công cộng",
    "periods": 1
  },
  {
    "id": 5053,
    "name": "Thực hành đọc: Tính cách của cây (Pê-tơ Vô-lơ-lê-ben)",
    "periods": 0.5
  },
  {
    "id": 5054,
    "name": "Bài 9. Hành trang cuộc sống",
    "periods": 10.5
  },
  {
    "id": 5055,
    "name": "Đọc: Về chính chúng ta (Các-lô Rô-ve-li); Con đường không chọn (Rô-bớt Phờ-rót); Một đời như kẻ tìm đường (Phan Văn Trường)",
    "periods": 6
  },
  {
    "id": 5056,
    "name": "Thực hành tiếng Việt: Sử dụng phương tiện phi ngôn ngữ (tiếp theo)",
    "periods": 1
  },
  {
    "id": 5057,
    "name": "Viết: Viết bài luận về bản thân",
    "periods": 2
  },
  {
    "id": 5058,
    "name": "Nói và nghe: Thuyết trình về một vấn đề xã hội có sử dụng kết hợp phương tiện ngôn ngữ và phương tiện giao tiếp phi ngôn ngữ",
    "periods": 1
  },
  {
    "id": 5059,
    "name": "Thực hành đọc: Mãi mãi tuổi hai mươi (Nguyễn Văn Thạc)",
    "periods": 0.5
  },
  {
    "id": 5060,
    "name": "Ôn tập kiểm tra học kì 2",
    "periods": 2
  },
  {
    "id": 5061,
    "name": "Kiểm tra cuối kì 2",
    "periods": 2
  },
  {
    "id": 5062,
    "name": "Trả bài Kiểm tra cuối kì 2",
    "periods": 1
  },
  {
    "id": 5063,
    "name": "Chuyên đề 1. Tập nghiên cứu và viết báo cáo về một vấn đề văn học dân gian",
    "periods": 10
  },
  {
    "id": 5064,
    "name": "Phần 1. Tập nghiên cứu (Xác định đề tài, thu thập thông tin, xử lí thông tin)",
    "periods": 4
  },
  {
    "id": 5065,
    "name": "Phần 2. Viết báo cáo nghiên cứu về một vấn đề văn học dân gian & Thuyết trình kết quả nghiên cứu",
    "periods": 5
  },
  {
    "id": 5066,
    "name": "Chuyên đề 2. Sân khấu hóa tác phẩm văn học",
    "periods": 15
  },
  {
    "id": 5067,
    "name": "Phần 1. Tìm hiểu về sân khấu hóa tác phẩm văn học (Đọc kịch bản, Xem vở diễn)",
    "periods": 5
  },
  {
    "id": 5068,
    "name": "Phần 2. Thực hành sân khấu hóa tác phẩm văn học (Đọc kịch bản, các nhân tố, các bước, thực hành)",
    "periods": 10
  },
  {
    "id": 5069,
    "name": "Chuyên đề 3. Đọc, viết và giới thiệu một tập thơ, một tập truyện ngắn hoặc một tiểu thuyết",
    "periods": 10
  },
  {
    "id": 5070,
    "name": "Phần 1. Đọc một tập thơ, một tập truyện ngắn hoặc một tiểu thuyết (Cách đọc, Thực hành)",
    "periods": 2
  },
  {
    "id": 5071,
    "name": "Phần 2. Viết bài về một tập thơ, một tập truyện ngắn hoặc một tiểu thuyết (Mục đích viết, Một số hướng viết, Thực hành viết, Báo cáo)",
    "periods": 4
  },
  {
    "id": 5072,
    "name": "Phần 3. Giới thiệu dưới hình thức nói về một tập thơ, một tập truyện ngắn hoặc một tiểu thuyết (Trình bày trước lớp, Tổ chức sự kiện)",
    "periods": 4
  }
];

const LITERATURE_11_LESSONS = [
  {
    "id": 5100,
    "name": "Bài 1. Câu chuyện và điểm nhìn trong truyện kể",
    "periods": 10
  },
  {
    "id": 5101,
    "name": "Đọc văn bản: Vợ nhặt (Kim Lân) & Chí Phèo (Nam Cao)",
    "periods": 5.5
  },
  {
    "id": 5102,
    "name": "Thực hành tiếng Việt: Đặc điểm cơ bản của ngôn ngữ nói và ngôn ngữ viết",
    "periods": 1
  },
  {
    "id": 5103,
    "name": "Viết văn bản nghị luận về tác phẩm truyện (những đặc điểm trong cách kể của tác giả)",
    "periods": 2
  },
  {
    "id": 5104,
    "name": "Nói và nghe: Thuyết trình về nghệ thuật kể chuyện trong một tác phẩm truyện",
    "periods": 1
  },
  {
    "id": 5105,
    "name": "Củng cố mở rộng - Thực hành đọc: Cải ơi! (Nguyễn Ngọc Tư)",
    "periods": 0.5
  },
  {
    "id": 5106,
    "name": "Bài 2. Cấu tứ và hình ảnh trong thơ trữ tình",
    "periods": 10
  },
  {
    "id": 5107,
    "name": "Đọc văn bản: Nhớ đồng (Tố Hữu), Tràng giang (Huy Cận), Con đường mùa đông (Pushkin)",
    "periods": 5.5
  },
  {
    "id": 5108,
    "name": "Thực hành tiếng Việt: Một số hiện tượng phá vỡ những quy tắc ngôn ngữ thông thường: đặc điểm và tác dụng",
    "periods": 1
  },
  {
    "id": 5109,
    "name": "Viết văn bản nghị luận về tác phẩm thơ (Tìm hiểu cấu tứ và hình ảnh của tác phẩm)",
    "periods": 2
  },
  {
    "id": 5110,
    "name": "Nói và nghe: Giới thiệu một tác phẩm nghệ thuật",
    "periods": 1
  },
  {
    "id": 5111,
    "name": "Củng cố mở rộng - Thực hành đọc: Thời gian (Văn Cao)",
    "periods": 0.5
  },
  {
    "id": 5112,
    "name": "Bài 3. Cấu trúc của văn bản nghị luận",
    "periods": 10
  },
  {
    "id": 5113,
    "name": "Đọc văn bản: Chiếu cầu hiền (Ngô Thì Nhậm), Tôi có một ước mơ (M. L. King), Một thời đại trong thi ca (Hoài Thanh)",
    "periods": 5.5
  },
  {
    "id": 5114,
    "name": "Kiểm tra giữa học kỳ I",
    "periods": 2
  },
  {
    "id": 5115,
    "name": "Thực hành tiếng Việt: Đặc điểm cơ bản của ngôn ngữ nói và ngôn ngữ viết (tiếp theo)",
    "periods": 1
  },
  {
    "id": 5116,
    "name": "Viết văn bản nghị luận về một vấn đề xã hội (Con người với cuộc sống xung quanh)",
    "periods": 2
  },
  {
    "id": 5117,
    "name": "Nói và nghe: Trình bày ý kiến đánh giá, bình luận về một vấn đề xã hội",
    "periods": 1
  },
  {
    "id": 5118,
    "name": "Củng cố, mở rộng - Thực hành đọc: Tiếp xúc với tác phẩm (Thái Bá Vân)",
    "periods": 0.5
  },
  {
    "id": 5119,
    "name": "Trả bài kiểm tra giữa kỳ I",
    "periods": 1
  },
  {
    "id": 5120,
    "name": "Bài 4. Tự sự trong truyện thơ dân gian và trong thơ trữ tình",
    "periods": 9
  },
  {
    "id": 5121,
    "name": "Đọc văn bản: Lời tiễn dặn, Dương phụ hành (Cao Bá Quát), Thuyền và biển (Xuân Quỳnh)",
    "periods": 4.5
  },
  {
    "id": 5122,
    "name": "Thực hành tiếng Việt: Lỗi về thành phần câu và cách sửa",
    "periods": 1
  },
  {
    "id": 5123,
    "name": "Viết bài văn nghị luận về một vấn đề xã hội (hình thành lối sống tích cực trong xã hội hiện đại)",
    "periods": 2
  },
  {
    "id": 5124,
    "name": "Nói và nghe: Trình bày ý kiến đánh giá, bình luận về vấn đề xã hội",
    "periods": 1
  },
  {
    "id": 5125,
    "name": "Củng cố mở rộng - Thực hành đọc: Nàng Ờm nhắn nhủ",
    "periods": 0.5
  },
  {
    "id": 5126,
    "name": "Bài 5. Nhân vật và xung đột trong bi kịch",
    "periods": 8
  },
  {
    "id": 5127,
    "name": "Đọc văn bản: Sống hay không sống - đó là vấn đề (Shakespeare), Vĩnh biệt Cửu Trùng Đài (Nguyễn Huy Tưởng), Prô-mê-tê bị xiềng",
    "periods": 4.5
  },
  {
    "id": 5128,
    "name": "Viết báo cáo nghiên cứu về một vấn đề tự nhiên, xã hội",
    "periods": 2
  },
  {
    "id": 5129,
    "name": "Nói và nghe: Trình bày báo cáo kết quả nghiên cứu về một vấn đề đáng quan tâm",
    "periods": 1
  },
  {
    "id": 5130,
    "name": "Củng cố mở rộng - Thực hành đọc: Prô-mê-tê bị xiềng (Ét-sin)",
    "periods": 0.5
  },
  {
    "id": 5131,
    "name": "Ôn tập học kì 1",
    "periods": 1
  },
  {
    "id": 5132,
    "name": "Kiểm tra cuối kì 1",
    "periods": 2
  },
  {
    "id": 5133,
    "name": "Trả bài cuối kỳ 1",
    "periods": 1
  },
  {
    "id": 5134,
    "name": "Bài 6. Nguyễn Du – Những điều còn thấy mà đau đớn lòng",
    "periods": 11
  },
  {
    "id": 5135,
    "name": "Đọc văn bản: Tác giả Nguyễn Du, Trao duyên (Nguyễn Du), Độc Tiểu Thanh kí (Nguyễn Du)",
    "periods": 6
  },
  {
    "id": 5136,
    "name": "Thực hành tiếng Việt: Biện pháp tu từ lặp cấu trúc, biện pháp tu từ đối",
    "periods": 1
  },
  {
    "id": 5137,
    "name": "Viết văn bản thuyết minh về một tác phẩm văn học",
    "periods": 2
  },
  {
    "id": 5138,
    "name": "Nghe và nói: Giới thiệu về một tác phẩm văn học. Thực hành đọc: Chí khí anh hùng, Mộng đắc thái liên",
    "periods": 2
  },
  {
    "id": 5139,
    "name": "Bài 7. Ghi chép và tưởng tượng trong ký",
    "periods": 11
  },
  {
    "id": 5140,
    "name": "Đọc văn bản: Ai đã đặt tên cho dòng sông (Hoàng Phủ Ngọc Tường), Và tôi vẫn muốn mẹ, Cà Mau quê xứ",
    "periods": 6.5
  },
  {
    "id": 5141,
    "name": "Thực hành tiếng Việt: Một số hiện tượng phá vỡ quy tắc ngôn ngữ thông thường: đặc điểm và tác dụng",
    "periods": 1
  },
  {
    "id": 5142,
    "name": "Viết văn bản thuyết minh về một sự vật, hiện tượng trong đời sống xã hội",
    "periods": 2
  },
  {
    "id": 5143,
    "name": "Nói và nghe: Thảo luận tranh luận về một vấn đề trong đời sống",
    "periods": 1
  },
  {
    "id": 5144,
    "name": "Củng cố, mở rộng - Thực hành đọc: Cây diêm cuối cùng (Cao Huy Thuần)",
    "periods": 0.5
  },
  {
    "id": 5145,
    "name": "Kiểm tra giữa kỳ 2",
    "periods": 2
  },
  {
    "id": 5146,
    "name": "Bài 8. Cấu trúc của văn bản thông tin",
    "periods": 10
  },
  {
    "id": 5147,
    "name": "Đọc văn bản: Nữ phóng viên đầu tiên, Trí thông minh nhân tạo, Pa-ra-lim-pích một lịch sử chữa lành những vết thương",
    "periods": 5.5
  },
  {
    "id": 5148,
    "name": "Trả bài giữa kì 2",
    "periods": 1
  },
  {
    "id": 5149,
    "name": "Thực hành tiếng Việt: Sử dụng phương tiện phi ngôn ngữ",
    "periods": 1
  },
  {
    "id": 5150,
    "name": "Viết bài văn thuyết minh về một sự vật, hiện tượng trong tự nhiên",
    "periods": 2
  },
  {
    "id": 5151,
    "name": "Nói và nghe: Tranh biện về một vấn đề trong đời sống",
    "periods": 1
  },
  {
    "id": 5152,
    "name": "Củng cố, mở rộng - Thực hành đọc: Ca nhạc ở miệt vườn (Sơn Nam)",
    "periods": 0.5
  },
  {
    "id": 5153,
    "name": "Bài 9. Lựa chọn và hành động",
    "periods": 11
  },
  {
    "id": 5154,
    "name": "Đọc văn bản: Bài ca ngất ngưởng (Nguyễn Công Trứ), Văn tế nghĩa sĩ Cần Giuộc (Nguyễn Đình Chiểu), Cộng đồng và cá thể (Albert Einstein)",
    "periods": 6.5
  },
  {
    "id": 5155,
    "name": "Thực hành tiếng Việt: Cách giải thích nghĩa của từ",
    "periods": 1
  },
  {
    "id": 5156,
    "name": "Viết văn bản nghị luận về một tác phẩm nghệ thuật",
    "periods": 2
  },
  {
    "id": 5157,
    "name": "Nói và nghe: Giới thiệu một tác phẩm nghệ thuật",
    "periods": 1
  },
  {
    "id": 5158,
    "name": "Củng cố, mở rộng - Thực hành đọc: \"Làm việc\" cũng là \"làm người\" (Giản Tư Trung)",
    "periods": 0.5
  },
  {
    "id": 5159,
    "name": "Ôn tập cuối kì 2",
    "periods": 2
  },
  {
    "id": 5160,
    "name": "Kiểm tra cuối học kỳ II",
    "periods": 2
  },
  {
    "id": 5161,
    "name": "Trả bài kiểm tra cuối học kỳ II",
    "periods": 1
  },
  {
    "id": 5162,
    "name": "Chuyên đề 1. Tập nghiên cứu và viết báo cáo về một vấn đề văn học trung đại Việt Nam",
    "periods": 10
  },
  {
    "id": 5163,
    "name": "Phần thứ nhất: Tập nghiên cứu một vấn đề văn học trung đại Việt Nam",
    "periods": 4
  },
  {
    "id": 5164,
    "name": "Phần thứ hai: Viết báo cáo nghiên cứu một vấn đề văn học trung đại Việt Nam",
    "periods": 4
  },
  {
    "id": 5165,
    "name": "Thuyết trình giới thiệu về một vấn đề văn học trung đại",
    "periods": 2
  },
  {
    "id": 5166,
    "name": "Chuyên đề 2. Tìm hiểu ngôn ngữ trong đời sống xã hội hiện đại",
    "periods": 15
  },
  {
    "id": 5167,
    "name": "Phần thứ nhất: Bản chất xã hội - văn hóa của ngôn ngữ",
    "periods": 6
  },
  {
    "id": 5168,
    "name": "Phần thứ hai: Sự phát triển của ngôn ngữ trong đời sống xã hội",
    "periods": 5
  },
  {
    "id": 5169,
    "name": "Phần thứ ba: Cách vận dụng yếu tố mới của ngôn ngữ đương đại trong giao tiếp",
    "periods": 4
  },
  {
    "id": 5170,
    "name": "Chuyên đề 3. Đọc, viết và giới thiệu về một tác giả văn học",
    "periods": 10
  },
  {
    "id": 5171,
    "name": "Phần thứ nhất: Đọc về một tác giả văn học",
    "periods": 5
  },
  {
    "id": 5172,
    "name": "Phần thứ hai: Viết về một tác giả văn học",
    "periods": 4
  },
  {
    "id": 5173,
    "name": "Phần thứ ba: Thuyết trình giới thiệu về một tác giả văn học",
    "periods": 2
  }
];

const LITERATURE_12_LESSONS = [
  {
    "id": 5200,
    "name": "Bài 1. Khả năng lớn lao của tiểu thuyết",
    "periods": 10
  },
  {
    "id": 5201,
    "name": "Đọc: Xuân tóc đỏ cứu quốc (Trích Số đỏ - Vũ Trọng Phụng); Mùa lá rụng trong vườn (Trích Ma Văn Kháng)",
    "periods": 5.5
  },
  {
    "id": 5202,
    "name": "Thực hành tiếng Việt: Biện pháp tu từ nói mỉa, nghịch ngữ",
    "periods": 1
  },
  {
    "id": 5203,
    "name": "Viết: Viết bài văn nghị luận so sánh, đánh giá hai tác phẩm truyện",
    "periods": 2
  },
  {
    "id": 5204,
    "name": "Nói và nghe: Trình bày kết quả so sánh, đánh giá hai tác phẩm truyện",
    "periods": 1
  },
  {
    "id": 5205,
    "name": "Củng cố mở rộng - Thực hành đọc: Trên xuồng cứu nạn (Trích Cuộc đời của Pi)",
    "periods": 0.5
  },
  {
    "id": 5206,
    "name": "Bài 2. Những thế giới thơ",
    "periods": 10
  },
  {
    "id": 5207,
    "name": "Đọc: Cảm hoài (Đặng Dung); Tây tiến (Quang Dũng); Đàn ghi-ta của Lor-ca (Thanh Thảo)",
    "periods": 5.5
  },
  {
    "id": 5208,
    "name": "Thực hành tiếng Việt: Tác dụng của một số biện pháp tu từ trong thơ",
    "periods": 1
  },
  {
    "id": 5209,
    "name": "Viết: Viết bài văn nghị luận so sánh, đánh giá hai tác phẩm thơ",
    "periods": 2
  },
  {
    "id": 5210,
    "name": "Nói và nghe: Trình bày kết quả so sánh, đánh giá hai tác phẩm thơ",
    "periods": 1
  },
  {
    "id": 5211,
    "name": "Củng cố mở rộng - Thực hành đọc: Bài thơ số 28 (Ra-bin-đơ-ra-nát Ta-go)",
    "periods": 0.5
  },
  {
    "id": 5212,
    "name": "Bài 3. Lập luận trong văn bản nghị luận",
    "periods": 10
  },
  {
    "id": 5213,
    "name": "Đọc: Nhìn về vốn văn hóa dân tộc (Trần Đình Hượu); Năng lực sáng tạo (Phan Đình Diệu); Mấy ý nghĩ về thơ (Nguyễn Đình Thi)",
    "periods": 5.5
  },
  {
    "id": 5214,
    "name": "Kiểm tra giữa học kì I",
    "periods": 2
  },
  {
    "id": 5215,
    "name": "Thực hành tiếng Việt: Lỗi logic của câu; Lỗi câu mơ hồ",
    "periods": 1
  },
  {
    "id": 5216,
    "name": "Viết: Viết bài văn nghị luận về một vấn đề liên quan đến tuổi trẻ (hoài bão, ước mơ)",
    "periods": 2
  },
  {
    "id": 5217,
    "name": "Nói và nghe: Thuyết trình về một vấn đề liên quan đến tuổi trẻ",
    "periods": 1
  },
  {
    "id": 5218,
    "name": "Củng cố mở rộng - Thực hành đọc: Cảm hứng và sáng tạo (Nguyễn Trần Bạt)",
    "periods": 0.5
  },
  {
    "id": 5219,
    "name": "Trả bài kiêm tra giữa kì I",
    "periods": 1
  },
  {
    "id": 5220,
    "name": "Bài 4. Yếu tố kì ảo trong truyện kể",
    "periods": 9
  },
  {
    "id": 5221,
    "name": "Đọc: Hải khẩu linh từ (Đoàn Thị Điểm); Muối của rừng (Nguyễn Huy Thiệp)",
    "periods": 4.5
  },
  {
    "id": 5222,
    "name": "Thực hành tiếng Việt: Nghệ thuật sử dụng điển cố trong tác phẩm văn học",
    "periods": 1
  },
  {
    "id": 5223,
    "name": "Viết: Viết bài văn nghị luận về việc vay mượn – cải biến – sáng tạo trong một tác phẩm văn học",
    "periods": 2
  },
  {
    "id": 5224,
    "name": "Nói và nghe: Trình bày về việc vay mượn – cải biến – sáng tạo trong một tác phẩm văn học",
    "periods": 1
  },
  {
    "id": 5225,
    "name": "Củng cố mở rộng - Thực hành đọc: Bến trần gian (Lưu Sơn Minh)",
    "periods": 0.5
  },
  {
    "id": 5226,
    "name": "Bài 5. Tiếng cười hài kịch",
    "periods": 8
  },
  {
    "id": 5227,
    "name": "Đọc: Nhân vật quan trọng (Trích Quan thanh tra - Nikôlai Gôgôi); Giấu của (Trích Quẫn - Lộng Chương)",
    "periods": 4.5
  },
  {
    "id": 5228,
    "name": "Viết: Viết báo cáo nghiên cứu về một vấn đề tự nhiên hoặc xã hội",
    "periods": 2
  },
  {
    "id": 5229,
    "name": "Nói và nghe: Trình bày báo cáo kết quả nghiên cứu về một vấn đề tự nhiên hoặc xã hội",
    "periods": 1
  },
  {
    "id": 5230,
    "name": "Củng cố mở rộng - Thực hành đọc: Cẩn thận hão (Trích Thợ cạo thành Xê-vin)",
    "periods": 0.5
  },
  {
    "id": 5231,
    "name": "Ôn tập học kì I",
    "periods": 1
  },
  {
    "id": 5232,
    "name": "Kiểm tra cuối học kì I",
    "periods": 2
  },
  {
    "id": 5233,
    "name": "Trả bài cuối kỳ I",
    "periods": 1
  },
  {
    "id": 5234,
    "name": "Bài 6. Hồ Chí Minh - \"Văn hoá phải soi đường cho quốc dân đi\"",
    "periods": 11
  },
  {
    "id": 5235,
    "name": "Đọc: Tác gia Hồ Chí Minh; Tuyên ngôn độc lập; Mộ (Chiều tối); Nguyên tiêu (Rằm tháng giêng); Những trò lố hay là Va-ren và Phan Bội Châu",
    "periods": 6
  },
  {
    "id": 5236,
    "name": "Thực hành tiếng Việt: Một số biện pháp làm tăng tính khẳng định, phủ định trong văn bản nghị luận",
    "periods": 1
  },
  {
    "id": 5237,
    "name": "Viết: Viết báo cáo kết quả của bài tập dự án",
    "periods": 2
  },
  {
    "id": 5238,
    "name": "Nói và nghe: Trình bày kết quả của bài tập dự án / Củng cố mở rộng - Thực hành đọc: Vọng nguyệt, Cảnh khuya",
    "periods": 2
  },
  {
    "id": 5239,
    "name": "Bài 7. Sự thật trong tác phẩm kí",
    "periods": 11
  },
  {
    "id": 5240,
    "name": "Đọc: Nghệ thuật băm thịt gà (Ngô Tất Tố); Bước vào đời (Đào Duy Anh)",
    "periods": 6.5
  },
  {
    "id": 5241,
    "name": "Thực hành tiếng Việt: Ngôn ngữ trang trọng và ngôn ngữ thân mật",
    "periods": 1
  },
  {
    "id": 5242,
    "name": "Viết: Viết bài văn nghị luận về một vấn đề liên quan đến tuổi trẻ (cách ứng xử trong mối quan hệ gia đình, xã hội)",
    "periods": 2
  },
  {
    "id": 5243,
    "name": "Nói và nghe: Trình bày quan điểm về một vấn đề liên quan đến tuổi trẻ",
    "periods": 1
  },
  {
    "id": 5244,
    "name": "Củng cố mở rộng - Thực hành đọc: Vĩ tuyến 17 (Xuân Phượng)",
    "periods": 0.5
  },
  {
    "id": 5245,
    "name": "Kiểm tra giữa kì II",
    "periods": 2
  },
  {
    "id": 5246,
    "name": "Bài 8. Dữ liệu trong văn bản thông tin",
    "periods": 10
  },
  {
    "id": 5247,
    "name": "Đọc: Pa-ra-na; Giáo dục khai phóng ở Việt Nam nhìn từ Đông Kinh Nghĩa Thục; Đời muối",
    "periods": 5.5
  },
  {
    "id": 5248,
    "name": "Trả bài giữa kì II",
    "periods": 1
  },
  {
    "id": 5249,
    "name": "Thực hành tiếng Việt: Tôn trọng và bảo vệ quyền sở hữu trí tuệ",
    "periods": 1
  },
  {
    "id": 5250,
    "name": "Viết: Viết thư trao đổi về công việc hoặc một vấn đề đáng quan tâm",
    "periods": 2
  },
  {
    "id": 5251,
    "name": "Nói và nghe: Tranh biện về một vấn đề đời sống",
    "periods": 1
  },
  {
    "id": 5252,
    "name": "Củng cố mở rộng - Thực hành đọc: Sách thay đổi lịch sử loài người",
    "periods": 0.5
  },
  {
    "id": 5253,
    "name": "Bài 9. Văn học và cuộc đời",
    "periods": 11
  },
  {
    "id": 5254,
    "name": "Đọc: Vội vàng (Xuân Diệu); Trở về (Ơ-nít Hê-minh-uê); Hồn Trương Ba, da hàng thịt (Lưu Quang Vũ)",
    "periods": 6.5
  },
  {
    "id": 5255,
    "name": "Thực hành tiếng Việt: Giữ gìn và phát triển tiếng Việt; Cách giải thích nghĩa của từ",
    "periods": 1
  },
  {
    "id": 5256,
    "name": "Viết: Viết bài phát biểu trong lễ phát động một phong trào hoặc một hoạt động xã hội",
    "periods": 2
  },
  {
    "id": 5257,
    "name": "Nói và nghe: Thuyết trình về một vấn đề liên quan đến cơ hội và thử thách đối với đất nước",
    "periods": 1
  },
  {
    "id": 5258,
    "name": "Củng cố mở rộng - Thực hành đọc: Khúc đồng quê (Đặng Thị Hạnh)",
    "periods": 0.5
  },
  {
    "id": 5259,
    "name": "Ôn tập học kì II",
    "periods": 2
  },
  {
    "id": 5260,
    "name": "Kiểm tra cuối học kỳ II",
    "periods": 2
  },
  {
    "id": 5261,
    "name": "Trả bài kiểm tra cuối học kỳ II",
    "periods": 1
  },
  {
    "id": 5262,
    "name": "Chuyên đề 1. Tập nghiên cứu và viết báo cáo về một vấn đề văn học hiện đại",
    "periods": 10
  },
  {
    "id": 5263,
    "name": "Phần 1. Tìm hiểu một số hướng nghiên cứu văn học hiện đại",
    "periods": 3
  },
  {
    "id": 5264,
    "name": "Phần 2. Viết báo cáo nghiên cứu về một vấn đề văn học hiện đại",
    "periods": 4
  },
  {
    "id": 5265,
    "name": "Phần 3. Thuyết trình về kết quả của báo cáo nghiên cứu",
    "periods": 3
  },
  {
    "id": 5266,
    "name": "Chuyên đề 2. Tìm hiểu về một tác phẩm nghệ thuật chuyển thể từ văn học",
    "periods": 15
  },
  {
    "id": 5267,
    "name": "Phần 1. Thưởng thức một tác phẩm nghệ thuật được chuyển thể từ văn học",
    "periods": 4
  },
  {
    "id": 5268,
    "name": "Phần 2. Viết bài phân tích, giới thiệu và thuyết trình về một tác phẩm nghệ thuật được chuyển thể từ văn học",
    "periods": 7
  },
  {
    "id": 5269,
    "name": "Phần 3. Thực hành chuyển thể tác phẩm văn học",
    "periods": 4
  },
  {
    "id": 5270,
    "name": "Chuyên đề 3. Tìm hiểu phong cách sáng tác của một trường phái văn học: Cổ điển, hiện thực hoặc lãng mạn",
    "periods": 10
  },
  {
    "id": 5271,
    "name": "Phần 1. Tìm hiểu cách nghiên cứu phong cách sáng tác của một trường phái văn học",
    "periods": 3
  },
  {
    "id": 5272,
    "name": "Phần 2. Viết bài giới thiệu về phong cách sáng tác của một trường phái văn học được thể hiện qua những tác phẩm cụ thể",
    "periods": 4
  },
  {
    "id": 5273,
    "name": "Phần 3. Thuyết trình về phong cách sáng tác của một trường phái văn học",
    "periods": 3
  }
];


export default function App() {
  const [mode, setMode] = useState<'integrate' | 'generate'>('generate');
  const [subject, setSubject] = useState('Ngữ văn');
  const [grade, setGrade] = useState('Lớp 10');
  const [selectedLesson, setSelectedLesson] = useState(LITERATURE_10_LESSONS[0]);
  const [periods, setPeriods] = useState(LITERATURE_10_LESSONS[0].periods);
  const [customPeriods, setCustomPeriods] = useState<number | null>(null);

  const effectivePeriods = customPeriods !== null ? customPeriods : periods;
  const defaultPeriods = selectedLesson?.periods || 1;
  const displayPeriods = Array.from(new Set([1, 2, 3, 4, 5, 6, defaultPeriods])).sort((a, b) => a - b);

  // Paywall & Premium State
  const [deviceId, setDeviceId] = useState<string>('');
  const [credits, setCredits] = useState<number>(2);
  const [tier, setTier] = useState<'free' | 'vip' | 'pro'>('free');
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [paywallTab, setPaywallTab] = useState<'pay' | 'activate'>('pay');
  const [activationKeyInput, setActivationKeyInput] = useState<string>('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<boolean>(false);

  // Selected package for payment QR code
  const [selectedPackage, setSelectedPackage] = useState(PAYMENT_PACKAGES[1]); // Default to Goi 2 (Tiết kiệm)

  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [adminTargetDevice, setAdminTargetDevice] = useState<string>('');
  const [adminSelectedPrefix, setAdminSelectedPrefix] = useState<string>('VIP15'); // Default prefix for 15 credits
  const [adminGeneratedKey, setAdminGeneratedKey] = useState<string>('');
  const [adminCassoKeyInput, setAdminCassoKeyInput] = useState<string>(() => localStorage.getItem('khbd_casso_api_key') || '');
  const [adminPayosClientIdInput, setAdminPayosClientIdInput] = useState<string>(() => localStorage.getItem('khbd_payos_client_id') || '');
  const [adminPayosApiKeyInput, setAdminPayosApiKeyInput] = useState<string>(() => localStorage.getItem('khbd_payos_api_key') || '');
  const [adminPayosChecksumKeyInput, setAdminPayosChecksumKeyInput] = useState<string>(() => localStorage.getItem('khbd_payos_checksum_key') || '');

  // payOS real-time transaction detection states
  // NOTE: payOS clientId/apiKey/checksumKey are no longer known or stored on the client at all.
  // They now live exclusively in the server's environment variables and are used only inside
  // api/create-payment.js and api/check-payment.js. `payosClientId` here is kept only as a
  // simple boolean-style flag (payOS feature enabled/available) to drive UI gating below —
  // it intentionally holds no real secret.
  const [payosClientId] = useState<string>('server-configured');
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // payOS order and checkout states
  const [currentOrderCode, setCurrentOrderCode] = useState<number | null>(null);
  const [currentCheckoutUrl, setCurrentCheckoutUrl] = useState<string | null>(null);
  const [currentQrCode, setCurrentQrCode] = useState<string | null>(null);
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState<boolean>(false);
  const [shouldGenerateQR, setShouldGenerateQR] = useState<boolean>(false);

  // Reset QR generation state when paywall closed
  React.useEffect(() => {
    if (!showPaywall) {
      setShouldGenerateQR(false);
    }
  }, [showPaywall]);

  React.useEffect(() => {
    // Generate or load Device ID
    let storedDeviceId = localStorage.getItem('khbd_device_id');
    if (!storedDeviceId) {
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      storedDeviceId = `KHBD-NGUVAN-${rand}`;
      localStorage.setItem('khbd_device_id', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    // Load Credits & Tier
    const storedCredits = localStorage.getItem('khbd_credits');
    const storedTier = localStorage.getItem('khbd_tier') as 'free' | 'vip' | 'pro' | null;

    if (storedCredits !== null && storedTier !== null) {
      setCredits(parseInt(storedCredits, 10));
      setTier(storedTier);
    } else {
      // Migrate from old version
      const storedPremium = localStorage.getItem('khbd_is_premium');
      if (storedPremium === 'true' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setCredits(9999);
        setTier('pro');
        localStorage.setItem('khbd_credits', '9999');
        localStorage.setItem('khbd_tier', 'pro');
      } else {
        setCredits(2);
        setTier('free');
        localStorage.setItem('khbd_credits', '2');
        localStorage.setItem('khbd_tier', 'free');
      }
    }
  }, []);

  // Create payOS payment link when paywall opens or package changes (with debounce to prevent race condition)
  React.useEffect(() => {
    if (!showPaywall || !selectedPackage || !payosClientId || !shouldGenerateQR) return;

    let isMounted = true;
    const timerId = setTimeout(async () => {
      setIsCreatingPaymentLink(true);
      setCurrentOrderCode(null);
      setCurrentCheckoutUrl(null);
      setCurrentQrCode(null);
      try {
        const response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            deviceId,
            packageId: selectedPackage.id,
            cancelUrl: window.location.href,
            returnUrl: window.location.href
          })
        });

        if (!response.ok) {
          throw new Error('Không thể tạo link thanh toán payOS');
        }

        const resData = await response.json();
        if (resData.code === '00' && isMounted) {
          setCurrentOrderCode(resData.data.orderCode);
          setCurrentCheckoutUrl(resData.data.checkoutUrl);
          setCurrentQrCode(resData.data.qrCode);
        } else {
          console.error('payOS Error:', resData.desc);
        }
      } catch (err) {
        console.error('Generate payment link error:', err);
      } finally {
        if (isMounted) {
          setIsCreatingPaymentLink(false);
        }
      }
    }, 450); // 450ms debounce to prevent race conditions

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [showPaywall, selectedPackage, deviceId, payosClientId, shouldGenerateQR]);

  // payOS Polling for Automatic Activation
  React.useEffect(() => {
    if (!showPaywall || !currentOrderCode || !payosClientId) return;

    let intervalId: any;
    let isPolling = false;

    const checkPaymentStatus = async () => {
      if (isPolling) return;
      isPolling = true;
      setIsCheckingPayment(true);
      try {
        const response = await fetch(`/api/check-order-status?orderCode=${currentOrderCode}&deviceId=${deviceId}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`order check error: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'paid' && !result.already_claimed && result.credits > 0) {
          const addedCredits = result.credits;
          let newTier: 'vip' | 'pro' = 'vip';
          let packageName = '';

          if (result.packageId === 'goi3') {
            newTier = 'pro';
            packageName = 'Gói 3 (Pro) - 40 lượt';
          } else if (result.packageId === 'goi2') {
            newTier = 'vip';
            packageName = 'Gói 2 (Tiết kiệm) - 15 lượt';
          } else if (result.packageId === 'goi1') {
            newTier = 'vip';
            packageName = 'Gói 1 (Trải nghiệm) - 5 lượt';
          }

          const oldCredits = tier === 'free' ? 0 : credits;
          const nextCredits = oldCredits + addedCredits;
          setCredits(nextCredits);
          setTier(newTier);
          localStorage.setItem('khbd_credits', nextCredits.toString());
          localStorage.setItem('khbd_tier', newTier);

          setPaymentSuccessMessage(
            `Giao dịch thành công! Đã thanh toán ${packageName}.\n` +
            `• Được cộng thêm: +${addedCredits} lượt tải\n` +
            `• Số dư cũ: ${oldCredits} lượt\n` +
            `• Tổng số dư mới: ${nextCredits} lượt`
          );
          
          setTimeout(() => {
            setShowPaywall(false);
            setPaymentSuccessMessage(null);
            setCurrentOrderCode(null);
          }, 4000);
        }
      } catch (err) {
        console.error("order check error:", err);
      } finally {
        isPolling = false;
        setIsCheckingPayment(false);
      }
    };

    checkPaymentStatus();
    intervalId = setInterval(checkPaymentStatus, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [showPaywall, currentOrderCode, payosClientId, credits, tier, selectedPackage, deviceId]);


  // Helper to generate key for a specific Device ID
  const getActivationCode = (devId: string): string => {
    const salt = PAYMENT_CONFIG.salt;
    let hash = 0;
    const combined = devId.trim() + salt;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const absHash = Math.abs(hash).toString(36).toUpperCase();
    return `${absHash.substring(0, 4)}-${absHash.substring(4, 8)}-${absHash.substring(8, 12) || 'KHBD'}`;
  };

  const handleActivate = () => {
    setActivationError(null);
    const key = activationKeyInput.trim().toUpperCase();
    if (!key) {
      setActivationError('Vui lòng nhập mã kích hoạt.');
      return;
    }

    // Nhập mã ADMIN_1, ADMIN_2, ADMIN_3 để kích hoạt nhanh các gói
    if (key === 'ADMIN_1') {
      const oldCredits = tier === 'free' ? 0 : credits;
      const nextCredits = oldCredits + 5;
      setCredits(nextCredits);
      setTier('vip');
      localStorage.setItem('khbd_credits', nextCredits.toString());
      localStorage.setItem('khbd_tier', 'vip');
      setActivationSuccess(true);
      setActivationKeyInput('');
      setActivationError(null);
      setTimeout(() => {
        setShowPaywall(false);
        setActivationSuccess(false);
      }, 2500);
      return;
    }

    if (key === 'ADMIN_2') {
      const oldCredits = tier === 'free' ? 0 : credits;
      const nextCredits = oldCredits + 15;
      setCredits(nextCredits);
      setTier('vip');
      localStorage.setItem('khbd_credits', nextCredits.toString());
      localStorage.setItem('khbd_tier', 'vip');
      setActivationSuccess(true);
      setActivationKeyInput('');
      setActivationError(null);
      setTimeout(() => {
        setShowPaywall(false);
        setActivationSuccess(false);
      }, 2500);
      return;
    }

    if (key === 'ADMIN_3') {
      const oldCredits = tier === 'free' ? 0 : credits;
      const nextCredits = oldCredits + 40;
      setCredits(nextCredits);
      setTier('pro');
      localStorage.setItem('khbd_credits', nextCredits.toString());
      localStorage.setItem('khbd_tier', 'pro');
      setActivationSuccess(true);
      setActivationKeyInput('');
      setActivationError(null);
      setTimeout(() => {
        setShowPaywall(false);
        setActivationSuccess(false);
      }, 2500);
      return;
    }

    if (key === PAYMENT_CONFIG.adminBypassKey) {
      setShowAdminPanel(true);
      setActivationKeyInput('');
      setActivationError(null);
      return;
    }

    // Determine package type and prefix
    let cleanKey = '';
    let addedCredits = 0;
    let newTier: 'free' | 'vip' | 'pro' = 'vip';
    let packageName = '';

    if (key.startsWith('VIP5-')) {
      cleanKey = key.substring(5);
      addedCredits = 5;
      newTier = 'vip';
      packageName = 'Gói 1 (Trải nghiệm) - 5 lượt';
    } else if (key.startsWith('VIP15-')) {
      cleanKey = key.substring(6);
      addedCredits = 15;
      newTier = 'vip';
      packageName = 'Gói 2 (Tiết kiệm) - 15 lượt';
    } else if (key.startsWith('VIP40-')) {
      cleanKey = key.substring(6);
      addedCredits = 40;
      newTier = 'pro';
      packageName = 'Gói 3 (Pro) - 40 lượt';
    } else {
      setActivationError('Mã kích hoạt không đúng hoặc không hợp lệ.');
      return;
    }

    const expectedHash = getActivationCode(deviceId);
    if (cleanKey === expectedHash) {
      const nextCredits = (tier === 'free' ? 0 : credits) + addedCredits;
      setCredits(nextCredits);
      setTier(newTier);
      localStorage.setItem('khbd_credits', nextCredits.toString());
      localStorage.setItem('khbd_tier', newTier);
      setActivationSuccess(true);
      setActivationKeyInput('');
      setTimeout(() => {
        setShowPaywall(false);
        setActivationSuccess(false);
      }, 2500);
    } else {
      setActivationError('Mã kích hoạt không đúng cho thiết bị này. Vui lòng kiểm tra lại.');
    }
  };

  const handleAdminGenerateKey = () => {
    if (!adminTargetDevice.trim()) {
      return;
    }
    const hash = getActivationCode(adminTargetDevice.trim());
    setAdminGeneratedKey(`${adminSelectedPrefix}-${hash}`);
  };

  // Helper to determine which model to route the request to
  const getModelForRequest = (periodsCount: number, currentTier: string, currentCredits: number) => {
    return 'gemini-3.5-flash';
  };


  // Update selected lesson when grade changes
  React.useEffect(() => {
    let lessons = [];
    if (grade === 'Lớp 10') lessons = LITERATURE_10_LESSONS;
    else if (grade === 'Lớp 11') lessons = LITERATURE_11_LESSONS;
    else if (grade === 'Lớp 12') lessons = LITERATURE_12_LESSONS;
    
    if (lessons.length > 0) {
      setSelectedLesson(lessons[0]);
      setPeriods(lessons[0].periods);
      setCustomPeriods(null);
    }
  }, [grade]);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (result || error) {
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [result, error]);

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed", e.target.files);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Chỉ hỗ trợ tệp .docx hoặc .pdf');
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    console.log("File dropped", e.dataTransfer.files);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.docx') || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Chỉ hỗ trợ tệp .docx hoặc .pdf');
      }
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async () => {
    if (credits <= 0) {
      setShowPaywall(true);
      return;
    }

    if (mode === 'integrate' && !file) {
      setError('Vui lòng tải lên tệp tin.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let integratedContent = '';
      const modelToUse = getModelForRequest(effectivePeriods, tier, credits);
      console.log("Routing generation request to Gemini model:", modelToUse);

      if (mode === 'integrate' && file) {
        let text = '';
        if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
          
          if (!text || text.trim().length < 10) {
            throw new Error("Tệp tin không có nội dung văn bản hoặc quá ngắn để xử lý.");
          }
        } else if (file.name.endsWith('.pdf')) {
          setError('Hiện tại hệ thống ưu tiên xử lý tệp .docx để đảm bảo định dạng.');
          setIsProcessing(false);
          return;
        }

        console.log("Starting file integration...");
        integratedContent = await integrateNLS(text, subject, grade, modelToUse);
      } else {
        console.log("Starting lesson generation...");
        integratedContent = await generateLessonPlan(selectedLesson.name, effectivePeriods, subject, grade, modelToUse);
      }
      
      if (!integratedContent || integratedContent.trim().length === 0) {
        throw new Error("Không nhận được nội dung phản hồi từ AI. Vui lòng thử lại.");
      }

      console.log("Processing complete, updating UI.");
      setResult(integratedContent);
    } catch (err) {
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = async () => {
    if (result) {
      if (credits <= 0) {
        setShowPaywall(true);
        return;
      }
      try {
        const fileName = mode === 'integrate' && file ? file.name.split('.')[0] : selectedLesson.name;
        await generateDocx(result, fileName, effectivePeriods);
        
        // Deduct 1 credit if not unlimited (credits >= 9000 is used for unlimited/localhost)
        if (credits < 9000) {
          const nextCredits = Math.max(0, credits - 1);
          setCredits(nextCredits);
          localStorage.setItem('khbd_credits', nextCredits.toString());
          
          // Update tier to free if credits reach 0
          if (nextCredits === 0) {
            setTier('free');
            localStorage.setItem('khbd_tier', 'free');
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải file DOCX:", err);
        setError(err instanceof Error ? `Lỗi tải file Word: ${err.message}` : "Không thể tạo file Word. Vui lòng kiểm tra lại nội dung.");
      }
    }
  };

  const exportDesignSpecs = async () => {
    const specsContent = `
# I. QUY CHUẨN CẤU TRÚC KẾ HOẠCH BÀI DẠY (KHBD)
1. Cấu trúc tổng thể: Tuân thủ nghiêm ngặt Công văn 5512 với các mục chính:
- I. MỤC TIÊU (Kiến thức, Năng lực chung, Năng lực đặc thù, Năng lực số, Phẩm chất).
- II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU (Bao gồm học liệu số).
- III. TIẾN TRÌNH DẠY HỌC (Chi tiết các hoạt động).
- IV. KẾ HOẠCH ĐÁNH GIÁ (nếu có).
- V. HOẠT ĐỘNG LUYỆN TẬP.
- VI. HOẠT ĐỘNG VẬN DỤNG.
- VII. CÁC PHIẾU HỌC TẬP (Nằm ở cuối tài liệu).

2. Cấu trúc mỗi hoạt động: Gồm 4 bước chuẩn:
- a) Mục tiêu: Xác định rõ kết quả học sinh cần đạt.
- b) Nội dung: Mô tả nhiệm vụ, dẫn chiếu đến Phiếu học tập.
- c) Sản phẩm: Trình bày chi tiết đáp án, công thức, kết quả dự kiến.
- d) Tổ chức thực hiện: Mô tả chi tiết cách thức giáo viên dẫn dắt và học sinh tương tác.

# II. ĐỊNH DẠNG VĂN BẢN VÀ MÀU SẮC (DOCX)
1. Quy tắc màu sắc và In đậm:
- Tiêu đề mục lớn (I, II, III, IV...): In đậm, màu Đỏ (Red).
- Hoạt động dạy học: Định dạng "1) Hoạt động 1", in đậm, màu Xanh dương (Blue).
- Các mục con (1., 2...): In đậm, màu Xanh dương (Blue).
- Tiêu đề Phiếu học tập: "PHIẾU HỌC TẬP SỐ X", in đậm, màu Xanh dương, nằm trên dòng riêng.
- Nhãn hoạt động 4 bước: "a) Mục tiêu:", "b) Nội dung:", "c) Sản phẩm:", "d) Tổ chức thực hiện:" được in đậm.
- Nội dung bên trong Phiếu học tập: Chữ thường, màu Đen.

2. Xử lý ký tự và kỹ thuật:
- Loại bỏ tất cả dấu sao (*) dư thừa từ quá trình tạo nội dung.
- Tự động định dạng chỉ số dưới cho các công thức hóa học (ví dụ: H2O -> H₂O).
- Font chữ: Times New Roman, cỡ 13pt.
- Căn lề: Trái 3cm, còn lại 2cm.

# III. CHIẾN LƯỢC SƯ PHẠM VÀ CÔNG NGHỆ SỐ
1. Kỹ thuật dạy học tích cực:
- Áp dụng linh hoạt: KWL, Brainstorming, Think-Pair-Share, Khăn trải bàn, Mảnh ghép, Trạm xoay, PBL (Học theo vấn đề), Tranh luận, Bể cá.
- Thí nghiệm: Thí nghiệm khám phá, mô hình hóa phân tử.

2. Tích hợp Năng lực số (NLS) và Giáo dục AI:
- Mã chỉ báo chuẩn NC1 theo Thông tư 02/2025/TT-BGDĐT, Quyết định 3439/QĐ-BGDĐT và Công văn 8334/BGDĐT-GDPT.
- Sử dụng công cụ trực tuyến: Kahoot!, Quizizz, Blooket, Padlet, Mentimeter khai thác tối đa bảng tương tác.
- Hoạt động 1: Luôn là hoạt động khởi động vui tươi, không kiểm tra bài cũ.

3. Phiếu học tập: Tích hợp đầy đủ câu hỏi trắc nghiệm, đúng/sai, bảng thảo luận cuối bài để giáo viên nạp liệu nhanh vào các nền tảng dạy học.
    `;
    await generateDocx(specsContent, "Dac_ta_Thiet_ke_KHBD_Digital");
  };

  return (
    <div className="flex flex-col min-h-screen bg-prof-slate-bg">
      {/* Header */}
      <header className="bg-prof-blue-dark text-white px-10 py-5 shadow-md flex-shrink-0 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biên soạn Kế hoạch Bài dạy (KHBD) Tích hợp NLS & Giáo dục AI</h1>
          <p className="text-[11px] opacity-80 uppercase tracking-widest mt-1 font-medium">
            Hệ thống tích hợp Năng lực số & Giáo dục AI — Theo TT 02/2025/TT-BGDĐT, CV 5512, Quyết định 3439/QĐ-BGDĐT & Công văn 8334/BGDĐT-GDPT
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tier === 'pro' ? (
            <button
              onClick={() => { setPaywallTab('pay'); setShowPaywall(true); }}
              className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 border border-amber-300 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-900 animate-pulse" />
              PRO: {credits >= 9000 ? 'Vô hạn' : `${credits} lượt tải`}
            </button>
          ) : tier === 'vip' ? (
            <button
              onClick={() => { setPaywallTab('pay'); setShowPaywall(true); }}
              className="bg-gradient-to-r from-prof-blue-primary to-cyan-500 text-white px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-prof-blue-primary/20 border border-prof-blue-light transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white animate-pulse" />
              VIP: {credits} lượt tải
            </button>
          ) : (
            <button 
              onClick={() => { setPaywallTab('pay'); setShowPaywall(true); }}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              Dùng thử: {credits} lượt tải
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-grow p-6 md:p-10 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 overflow-y-auto relative">
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-prof-slate-border flex flex-col items-center gap-6 max-w-sm text-center animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-prof-blue-light/20 border-t-prof-blue-primary rounded-full animate-spin" />
                <Loader2 className="w-6 h-6 text-prof-blue-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-prof-slate-text mb-2">
                  {mode === 'integrate' ? 'Đang tích hợp Năng lực số...' : 'Đang tạo KHBD mới...'}
                </h3>
                <p className="text-sm text-prof-slate-muted">Quá trình này có thể mất 30-60 giây tùy thuộc vào độ dài nội dung.</p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-prof-blue-primary h-full animate-progress" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <aside className="h-fit lg:sticky lg:top-10">
          <div className="card p-8">
            <div className="section-title text-base mb-6">Cấu hình hệ thống</div>
            
            <div className="space-y-6">

              <div className="form-group">
                <label className="block text-[13px] font-bold text-prof-slate-label mb-2 uppercase tracking-wider">Môn học</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:border-prof-blue-primary outline-none transition-all cursor-pointer appearance-none"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-[13px] font-bold text-prof-slate-label mb-2 uppercase tracking-wider">Khối lớp</label>
                <select 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:border-prof-blue-primary outline-none transition-all cursor-pointer appearance-none"
                >
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {mode === 'generate' && (
                <div className="form-group animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[13px] font-bold text-prof-slate-label mb-2 uppercase tracking-wider">Chọn bài dạy</label>
                  <select 
                    value={selectedLesson.id}
                    onChange={(e) => {
                      let lessons = [];
                      if (grade === 'Lớp 10') lessons = LITERATURE_10_LESSONS;
                      else if (grade === 'Lớp 11') lessons = LITERATURE_11_LESSONS;
                      else if (grade === 'Lớp 12') lessons = LITERATURE_12_LESSONS;
                      
                      const lesson = lessons.find(l => l.id === parseInt(e.target.value));
                      if (lesson) {
                        setSelectedLesson(lesson);
                        setPeriods(lesson.periods);
                        setCustomPeriods(null);
                      }
                    }}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:border-prof-blue-primary outline-none transition-all cursor-pointer appearance-none"
                  >
                    {grade === 'Lớp 10' && LITERATURE_10_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {grade === 'Lớp 11' && LITERATURE_11_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {grade === 'Lớp 12' && LITERATURE_12_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold text-prof-slate-label mb-2 uppercase tracking-wider">Số tiết thực hiện</label>
                    <div className="flex gap-2 flex-wrap">
                      {displayPeriods.map((p) => (
                        <div
                          key={p}
                          className={cn(
                            "px-3 py-2 rounded-lg border-2 font-bold text-sm text-center select-none min-w-[36px]",
                            effectivePeriods === p 
                              ? "border-prof-blue-primary bg-prof-blue-primary text-white shadow-md" 
                              : "border-slate-200 bg-white text-slate-400 opacity-60"
                          )}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-[11px] font-bold text-prof-slate-label mb-2 uppercase tracking-wider">Chọn lại số tiết</label>
                    <div className="flex gap-2 flex-wrap">
                      {displayPeriods.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCustomPeriods(customPeriods === p ? null : p)}
                          className={cn(
                            "px-3 py-2 rounded-lg border-2 transition-all font-bold text-sm cursor-pointer min-w-[36px]",
                            customPeriods === p 
                              ? "border-prof-blue-primary bg-prof-blue-primary text-white shadow-md" 
                              : "border-slate-200 bg-white text-slate-500 hover:border-prof-blue-light"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group font-sans">
                <label className="block text-[13px] font-bold text-prof-slate-label mb-2 uppercase tracking-wider">Tiêu chuẩn tích hợp</label>
                <div className="flex flex-wrap gap-1">
                  <span className="ref-badge px-3 py-1.5 text-[10px]">CV 5512</span>
                  <span className="ref-badge px-3 py-1.5 text-[10px]">TT 02/2025</span>
                  <span className="ref-badge px-3 py-1.5 text-[10px]">QĐ 3439/QĐ-BGDĐT</span>
                  <span className="ref-badge px-3 py-1.5 text-[10px]">CV 8334/BGDĐT-GDPT</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="stat-box p-5">
                  <div className="text-[11px] text-prof-slate-muted uppercase font-bold tracking-widest mb-1">Mức độ</div>
                  <div className="text-2xl font-bold text-prof-blue-dark">Mức 3</div>
                </div>
                <div className="stat-box p-5">
                  <div className="text-[11px] text-prof-slate-muted uppercase font-bold tracking-widest mb-1">Công cụ</div>
                  <div className="text-2xl font-bold text-prof-blue-dark">AI-02</div>
                </div>
              </div>


            </div>
          </div>
        </aside>

        {/* Center Panel */}
        <section className="flex flex-col">
          <div className="card h-fit flex flex-col p-8 mb-10">
            <div className="section-title text-base mb-6 flex items-center gap-2">
              {mode === 'integrate' ? <Upload className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              {mode === 'integrate' ? 'Tải lên tài liệu gốc' : 'Gợi ý nội dung bài dạy'}
            </div>
            <p className="text-sm text-prof-slate-muted -mt-3 mb-8 leading-relaxed">
              {mode === 'integrate' 
                ? 'Hệ thống sẽ tự động quét nội dung, giữ nguyên định dạng, công thức hóa học và hình ảnh để bổ sung các mục Năng lực số tương ứng.'
                : `Dựa trên gợi ý tổ chức hoạt động dạy học từ SGK ${subject} ${grade} Kết nối tri thức, hệ thống sẽ tạo KHBD mới hoàn chỉnh tích hợp Năng lực số.`}
            </p>

            {result === null ? (
              <div className="flex flex-col">
                {mode === 'integrate' ? (
                  <div 
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                      "upload-zone py-12 md:py-20 flex flex-col items-center justify-center gap-6 border-3 transition-all duration-200 relative",
                      file ? "bg-blue-50/50 border-prof-blue-light" : "border-slate-200",
                      isDragging ? "border-prof-blue-primary bg-blue-50 scale-[0.99] shadow-inner" : ""
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      accept=".docx,.pdf"
                    />
                    <div className={cn(
                      "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-sm transition-all duration-300",
                      file ? "bg-prof-blue-primary text-white" : "bg-slate-100 text-slate-400",
                      isDragging ? "scale-110 rotate-3 bg-prof-blue-light text-white" : ""
                    )}>
                      {file ? <FileText className="w-8 h-8 md:w-10 md:h-10" /> : <Upload className="w-8 h-8 md:w-10 md:h-10" />}
                    </div>
                    <div className="text-center space-y-2 px-4">
                      <p className="text-base md:text-lg font-bold text-slate-800 break-all">
                        {file ? file.name : (isDragging ? "Thả tệp vào đây" : "Kéo thả file .docx hoặc .pdf vào đây")}
                      </p>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                        Dung lượng tối đa: 25MB
                      </p>
                    </div>

                    <div className="mt-2 bg-white text-prof-blue-primary border-2 border-prof-blue-primary px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-prof-blue-primary hover:text-white transition-all shadow-sm flex items-center gap-2 relative z-0">
                      <Upload className="w-4 h-4" />
                      Chọn tệp từ máy tính
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center text-center gap-6">
                    <div className="w-20 h-20 bg-prof-blue-light/10 text-prof-blue-primary rounded-full flex items-center justify-center">
                      <GraduationCap className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">{selectedLesson.name}</h3>
                      <p className="text-sm text-slate-500 max-w-sm">
                        Hệ thống sẽ tạo KHBD chi tiết theo Công văn 5512, tích hợp các hoạt động phát triển Năng lực số phù hợp với nội dung bài học.
                      </p>
                    </div>
                    <button 
                      onClick={processFile}
                      disabled={isProcessing}
                      className="btn-primary px-10 py-4 text-base flex items-center gap-3"
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                      Bắt đầu tạo KHBD mới
                    </button>
                  </div>
                )}

                <div className="mt-8">
                  <div className="section-title">Xem trước cấu trúc tích hợp</div>
                  <div className="bg-slate-50 border border-prof-slate-border rounded-md p-5 space-y-3">
                    <div className="flex items-center text-xs text-prof-slate-label font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                      Khung NL số: Khai thác dữ liệu & thông tin (Component 1.1)
                    </div>
                    <div className="flex items-center text-xs text-prof-slate-label font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                      Kỹ thuật: Sử dụng phần mềm mô phỏng (Phet, ChemDraw)
                    </div>
                    <div className="flex items-center text-xs text-prof-slate-label font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                      Kiểm tra: Đánh giá số hóa qua LMS/Quizizz
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-grow min-h-[500px] w-full">
                <LessonPlanPreviewer 
                  content={result}
                  subject={subject}
                  grade={grade}
                  lessonName={mode === 'integrate' && file ? file.name.split('.')[0] : selectedLesson.name}
                  periods={effectivePeriods}
                  onDownload={downloadResult}
                  onReset={() => setResult(null)}
                />
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-md flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Actions */}
      <footer className="bg-white border-top border-prof-slate-border px-10 py-5 flex justify-end items-center gap-5 flex-shrink-0">
        <button 
          onClick={reset}
          className="btn-secondary"
        >
          Hủy bỏ
        </button>
        
        {result === null ? (
          <button
            disabled={(mode === 'integrate' && !file) || isProcessing}
            onClick={processFile}
            className="btn-primary flex items-center gap-3"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>{mode === 'integrate' ? 'Tích hợp Năng lực số' : 'Tạo KHBD mới'}</>
            )}
          </button>
        ) : (
          <button
            onClick={downloadResult}
            className="btn-primary flex items-center gap-3 bg-green-600 hover:bg-green-700 shadow-green-200"
          >
            <Download className="w-4 h-4" />
            Tải về File DOCX
          </button>
        )}
      </footer>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-8"
            >
              {/* Header */}
              <div className="bg-prof-blue-dark text-white p-6 relative flex-shrink-0">
                <button 
                  onClick={() => {
                    if (credits > 0) {
                      setShowPaywall(false);
                      setShowAdminPanel(false);
                    } else {
                      alert("Vui lòng kích hoạt gói học tập để tiếp tục soạn bài giảng!");
                    }
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                    <Sparkles className="w-6 h-6 fill-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">Kích hoạt Tài khoản KHBD</h3>
                      <span className="text-[9px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded font-black uppercase">v1.1.2</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {tier === 'free' ? 'Bạn đang sử dụng gói dùng thử miễn phí' : `Tài khoản: Gói ${tier.toUpperCase()}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs selector */}
              {!showAdminPanel && (
                <div className="flex border-b border-slate-100 bg-slate-50 p-1">
                  <button 
                    onClick={() => setPaywallTab('pay')}
                    className={cn(
                      "flex-1 py-3 text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2",
                      paywallTab === 'pay' ? "bg-white text-prof-blue-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <CreditCard className="w-4 h-4" />
                    Đăng ký gói lượt tải
                  </button>
                  <button 
                    onClick={() => setPaywallTab('activate')}
                    className={cn(
                      "flex-1 py-3 text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2",
                      paywallTab === 'activate' ? "bg-white text-prof-blue-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Lock className="w-4 h-4" />
                    Nhập mã kích hoạt
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="p-6 overflow-y-auto max-h-[60vh] flex-grow">
                {paymentSuccessMessage && (
                  <div 
                    onClick={() => window.location.reload()}
                    className="p-5 mb-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-center space-y-2 animate-bounce cursor-pointer hover:bg-green-100 transition-all border-dashed"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                    <h4 className="font-bold text-base">Thanh toán Thành công!</h4>
                    <p className="text-xs whitespace-pre-line text-left max-w-sm mx-auto">{paymentSuccessMessage}</p>
                    <p className="text-[10px] text-green-600 font-bold underline mt-2">Bấm vào đây để tải lại trang ngay</p>
                  </div>
                )}

                {showAdminPanel ? (
                  // Admin panel UI
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-purple-800 text-xs">
                      <h4 className="font-bold mb-1">CỔNG ADMIN - TẠO MÃ KÍCH HOẠT & CẤU HÌNH</h4>
                      <p>Hệ thống hỗ trợ tạo mã kích hoạt theo từng gói lượt tải.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Mã thiết bị khách hàng</label>
                      <input 
                        type="text"
                        value={adminTargetDevice}
                        onChange={(e) => setAdminTargetDevice(e.target.value)}
                        placeholder="Ví dụ: KHBD-NGUVAN-XXXXXX"
                        className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold uppercase focus:border-prof-blue-primary outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Chọn gói kích hoạt</label>
                      <select 
                        value={adminSelectedPrefix}
                        onChange={(e) => setAdminSelectedPrefix(e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-200 bg-white text-sm font-semibold focus:border-prof-blue-primary outline-none"
                      >
                        <option value="VIP5">Gói 1 (Trải nghiệm): 5 lượt tải - Gemini 3.5 Flash (Prefix VIP5-)</option>
                        <option value="VIP15">Gói 2 (Tiết kiệm): 15 lượt tải - Gemini 3.5 Flash (Prefix VIP15-)</option>
                        <option value="VIP40">Gói 3 (Pro): 40 lượt tải - Gemini 3.5 Flash (Prefix VIP40-)</option>
                      </select>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Cấu hình cổng payOS (Casso)</label>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500">Client ID:</span>
                        <input 
                          type="text"
                          value={adminPayosClientIdInput}
                          onChange={(e) => setAdminPayosClientIdInput(e.target.value)}
                          placeholder="Nhập Client ID..."
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono focus:border-prof-blue-primary outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500">API Key:</span>
                        <input 
                          type="text"
                          value={adminPayosApiKeyInput}
                          onChange={(e) => setAdminPayosApiKeyInput(e.target.value)}
                          placeholder="Nhập API Key..."
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono focus:border-prof-blue-primary outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500">Checksum Key:</span>
                        <input 
                          type="text"
                          value={adminPayosChecksumKeyInput}
                          onChange={(e) => setAdminPayosChecksumKeyInput(e.target.value)}
                          placeholder="Nhập Checksum Key..."
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono focus:border-prof-blue-primary outline-none transition-all"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const cid = adminPayosClientIdInput.trim();
                          const akey = adminPayosApiKeyInput.trim();
                          const csk = adminPayosChecksumKeyInput.trim();

                          localStorage.setItem('khbd_payos_client_id', cid);
                          localStorage.setItem('khbd_payos_api_key', akey);
                          localStorage.setItem('khbd_payos_checksum_key', csk);

                          alert("Đã lưu cấu hình payOS thành công!");
                        }}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Lưu cấu hình payOS
                      </button>
                    </div>

                    <button 
                      onClick={handleAdminGenerateKey}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      Tạo mã kích hoạt
                    </button>

                    {adminGeneratedKey && (
                      <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl space-y-3">
                        <div className="text-xs text-slate-400 font-bold uppercase">Mã kích hoạt tương ứng:</div>
                        <div className="flex items-center justify-between gap-3">
                          <code className="text-sm font-mono font-bold text-green-400 select-all tracking-wider">{adminGeneratedKey}</code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(adminGeneratedKey);
                              alert("Đã sao chép mã kích hoạt!");
                            }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          setCredits(9999);
                          setTier('pro');
                          localStorage.setItem('khbd_credits', '9999');
                          localStorage.setItem('khbd_tier', 'pro');
                          alert("Đã kích hoạt chế độ VIP Vô hạn cho thiết bị này!");
                          setShowPaywall(false);
                          setShowAdminPanel(false);
                        }}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
                      >
                        Kích hoạt thiết bị này
                      </button>
                      <button 
                        onClick={() => {
                          setShowAdminPanel(false);
                          setPaywallTab('activate');
                        }}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all cursor-pointer"
                      >
                        Thoát chế độ Admin
                      </button>
                    </div>
                  </div>
                ) : paywallTab === 'pay' ? (
                  // Payment Info UI
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {credits <= 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 space-y-1">
                          <p className="font-bold">Lượt tải của thiết bị đã hết (0 lượt)</p>
                          <p>Vui lòng đăng ký gói tải hoặc mua thêm lượt để tiếp tục tải file giáo án Word.</p>
                        </div>
                      </div>
                    )}

                    {/* Package Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 1: Chọn gói lượt tải phù hợp</label>
                      <div className="grid grid-cols-1 gap-2.5">
                        {PAYMENT_PACKAGES.map((pkg) => (
                          <div 
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg)}
                            className={cn(
                              "border-2 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all",
                              selectedPackage.id === pkg.id 
                                ? "border-prof-blue-primary bg-prof-blue-light/5 shadow-md shadow-prof-blue-light/5" 
                                : "border-slate-100 bg-slate-50 hover:bg-slate-100/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="radio" 
                                checked={selectedPackage.id === pkg.id}
                                onChange={() => setSelectedPackage(pkg)}
                                className="accent-prof-blue-primary w-4 h-4"
                              />
                              <div>
                                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{pkg.name}</h4>
                                <p className="text-[10px] text-slate-400 font-semibold">{pkg.label}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-slate-800 text-sm sm:text-base">
                                {pkg.price.toLocaleString('vi-VN')}đ
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* QR Code Tabs */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 2: Quét mã QR thanh toán</label>
                      
                      <div className="flex bg-slate-50 p-4 rounded-2xl items-center gap-4 justify-between border border-slate-100 min-h-[160px]">
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Gói đã chọn</div>
                          <div className="text-sm font-bold text-slate-800">{selectedPackage.name}</div>
                          <div className="text-lg font-black text-prof-blue-primary font-mono">
                            {selectedPackage.price.toLocaleString('vi-VN')} đ
                          </div>
                        </div>

                        {/* Dynamic VietQR or Button */}
                        {!shouldGenerateQR ? (
                          <button
                            type="button"
                            onClick={() => setShouldGenerateQR(true)}
                            className="py-3 px-5 bg-prof-blue-primary hover:bg-prof-blue-dark text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.97] hover:scale-[1.02] flex items-center gap-2"
                          >
                            <QrCode className="w-4 h-4" />
                            Tạo mã QR thanh toán
                          </button>
                        ) : (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center flex-shrink-0">
                            {isCreatingPaymentLink ? (
                              <div className="w-32 h-32 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-100">
                                <Loader2 className="w-6 h-6 text-prof-blue-primary animate-spin" />
                                <span className="text-[8px] text-slate-400 mt-2 font-bold uppercase">Đang tạo mã...</span>
                              </div>
                            ) : (
                              <img 
                                src={currentQrCode 
                                  ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentQrCode)}`
                                  : `https://img.vietqr.io/image/${PAYMENT_CONFIG.bankId}-${PAYMENT_CONFIG.accountNo}-vietqr.png?amount=${selectedPackage.price}&addInfo=TMT%20${deviceId.replace(/-/g, '%20')}&accountName=${encodeURIComponent(PAYMENT_CONFIG.accountName)}`
                                }
                                alt="VietQR Dynamic Link"
                                className="w-32 h-32 object-contain animate-fade-in"
                              />
                            )}
                            <span className="text-[8px] text-slate-400 font-black mt-1 uppercase text-center mt-1">Quét mã Tự động điền</span>
                          </div>
                        )}
                      </div>

                      {/* Static QR Modal view fallback if they want school account image */}
                      <details className="text-xs text-slate-500 cursor-pointer">
                        <summary className="font-bold text-prof-blue-primary hover:underline">Hiển thị mã QR ngân hàng gốc (Ảnh hóa đơn gốc)</summary>
                        <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                          <img 
                            src="/qr_payment.jpg" 
                            alt="Mã QR Gốc MB Bank" 
                            className="max-w-[200px] rounded-lg shadow-sm border border-slate-200"
                          />
                          <p className="text-[9px] text-slate-400 font-bold mt-2 text-center uppercase">Vui lòng nhập đúng số tiền {selectedPackage.price.toLocaleString('vi-VN')}đ và Nội dung chuyển khoản bên dưới</p>
                        </div>
                      </details>
                    </div>

                    {/* Manual Bank details table */}
                    <div className="space-y-2 text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5 uppercase">Thông tin tài khoản nhận</h4>
                      
                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-50 text-xs">
                        <div className="text-slate-400 font-medium">Ngân hàng</div>
                        <div className="col-span-2 font-bold text-slate-800">MB BANK (NGÂN HÀNG QUÂN ĐỘI)</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-50 text-xs">
                        <div className="text-slate-400 font-medium">Số tài khoản</div>
                        <div className="col-span-2 font-bold text-slate-800 flex items-center justify-between">
                          <span>{PAYMENT_CONFIG.accountNo}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(PAYMENT_CONFIG.accountNo);
                              alert("Đã sao chép số tài khoản!");
                            }}
                            className="text-[10px] text-prof-blue-primary font-bold hover:underline cursor-pointer"
                          >
                            Sao chép
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-50 text-xs">
                        <div className="text-slate-400 font-medium">Chủ tài khoản</div>
                        <div className="col-span-2 font-bold text-slate-800 uppercase">{PAYMENT_CONFIG.accountName}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-50 text-xs">
                        <div className="text-slate-400 font-medium">Nội dung CK</div>
                        <div className="col-span-2 font-bold text-red-600 flex items-center justify-between bg-red-50 p-1.5 rounded border border-red-100">
                          <span className="font-mono">TMT {deviceId}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`TMT ${deviceId}`);
                              alert("Đã sao chép nội dung chuyển khoản!");
                            }}
                            className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                          >
                            Sao chép
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Auto Check Loader / payOS status Indicator */}
                    {payosClientId ? (
                      <div 
                        onClick={paymentSuccessMessage ? () => window.location.reload() : undefined}
                        className={cn(
                          "p-3 rounded-xl flex items-center justify-between gap-3 text-xs transition-all duration-300",
                          paymentSuccessMessage 
                            ? "bg-green-600 text-white cursor-pointer hover:bg-green-700 active:scale-[0.98]" 
                            : "bg-slate-900 text-white"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {paymentSuccessMessage ? (
                            <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                          ) : isCheckingPayment ? (
                            <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                          )}
                          <span className="font-medium text-slate-300">
                            {paymentSuccessMessage 
                              ? "Chuyển tiền thành công! Mời bạn tạo tiếp KHBD. Click vào đây để tải lại trang." 
                              : isCheckingPayment 
                                ? "Đang dò tìm chuyển khoản..." 
                                : "Hệ thống tự động kích hoạt đang chạy..."}
                          </span>
                        </div>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded uppercase font-black",
                          paymentSuccessMessage ? "bg-green-800 text-green-100" : "bg-slate-800 text-slate-400"
                        )}>
                          {paymentSuccessMessage ? "Tải lại" : "MB Auto-Check"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-lg leading-relaxed font-medium">
                        💡 <strong>Hướng dẫn</strong>: Sau khi chuyển khoản đúng số tiền và nội dung, bạn chụp màn hình gửi Zalo cho Admin kèm theo <strong>Mã thiết bị</strong> để được hỗ trợ kích hoạt thủ công nhanh nhất.
                      </div>
                    )}
                  </div>
                ) : (
                  // Activation code input UI
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="text-xs text-slate-400 font-medium">Mã thiết bị của bạn (gửi cho Admin):</div>
                      <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                        <code className="text-xs font-mono font-bold text-slate-800 tracking-wider select-all">{deviceId}</code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(deviceId);
                            alert("Đã sao chép mã thiết bị!");
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Nhập mã kích hoạt (VIP Key)</label>
                      <input 
                        type="text"
                        value={activationKeyInput}
                        onChange={(e) => setActivationKeyInput(e.target.value)}
                        placeholder="VIP5-XXXX-XXXX"
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm font-semibold uppercase tracking-widest text-center focus:border-prof-blue-primary outline-none transition-all"
                      />
                    </div>

                    {activationError && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-medium">
                        ⚠️ {activationError}
                      </div>
                    )}

                    {activationSuccess && (
                      <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-xs rounded-lg font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Kích hoạt gói thành công! Hệ thống đang cập nhật...
                      </div>
                    )}

                    <button 
                      onClick={handleActivate}
                      disabled={activationSuccess}
                      className="w-full py-3.5 bg-prof-blue-primary hover:bg-prof-blue-dark text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-prof-blue-light/10"
                    >
                      Xác nhận kích hoạt VIP
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 flex-shrink-0">
                <span>Thiết bị ID: <strong className="font-mono text-[10px] text-slate-700">{deviceId}</strong></span>
                <span className="flex items-center gap-1 font-medium">
                  Hỗ trợ Zalo: 
                  <a 
                    href={`https://zalo.me/${PAYMENT_CONFIG.supportZalo}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-bold text-prof-blue-primary hover:underline"
                  >
                    {PAYMENT_CONFIG.supportZalo}
                  </a>
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
