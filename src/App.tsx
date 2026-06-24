import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, Download, Loader2, ChevronRight, BookOpen, GraduationCap, X } from 'lucide-react';
import mammoth from 'mammoth';
import { integrateNLS, generateLessonPlan } from './services/geminiService';
import { generateDocx } from './services/docxService';
import LessonPlanPreviewer from './components/LessonPlanPreviewer';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const SUBJECTS = ['Ngữ văn', 'Lịch sử', 'Địa lí', 'Giáo dục Kinh tế và Pháp luật', 'Tiếng Anh'];
const GRADES = ['Lớp 10', 'Lớp 11', 'Lớp 12'];


// ==================== Địa lí ====================
const GEOGRAPHY_10_LESSONS = [
  { id: 2000, name: "Bài 1. Môn Địa lí với định hướng nghề nghiệp", periods: 1 },
  { id: 2001, name: "Bài 2. Một số phương pháp biểu hiện các đối tượng địa lí trên bản đồ", periods: 1 },
  { id: 2002, name: "Bài 3. Sử dụng bản đồ trong học tập và đời sống, một số ứng dụng của GPS và bản đồ số trong đời sống", periods: 2 },
  { id: 2003, name: "Bài 4. Sự hình thành Trái Đất, vỏ Trái Đất và vật liệu cấu tạo vỏ Trái Đất", periods: 2 },
  { id: 2004, name: "Bài 5. Hệ quả địa lí các chuyển động của Trái Đất", periods: 3 },
  { id: 2005, name: "Bài 6. Thạch quyển, thuyết kiến tạo mảng", periods: 2 },
  { id: 2006, name: "Bài 7. Nội lực và ngoại lực", periods: 2 },
  { id: 2007, name: "Bài 8. Thực hành: Sự phân bố các vành đai động đất, núi lửa", periods: 1 },
  { id: 2008, name: "Bài 9. Khí quyển, các yếu tố khí hậu", periods: 4 },
  { id: 2009, name: "Ôn kiểm tra giữa kì I", periods: 1 },
  { id: 2010, name: "Kiểm tra giữa kì I", periods: 1 },
  { id: 2011, name: "Bài 10. Thực hành: Đọc bản đồ các đới và các kiểu khí hậu trên Trái Đất, phân tích biểu đồ một số kiểu khí hậu", periods: 1 },
  { id: 2012, name: "Bài 11. Thủy quyển, nước trên lục địa", periods: 2 },
  { id: 2013, name: "Bài 12. Nước biển và đại dương", periods: 2 },
  { id: 2014, name: "Bài 13. Thực hành: Phân tích chế độ nước của sông Hồng", periods: 1 },
  { id: 2015, name: "Bài 14. Đất trên Trái Đất", periods: 2 },
  { id: 2016, name: "Bài 15. Sinh quyển", periods: 2 },
  { id: 2017, name: "Bài 16. Thực hành: Tìm hiểu sự phân bố đất và sinh vật trên Trái Đất", periods: 2 },
  { id: 2018, name: "Ôn kiểm tra cuối kì I", periods: 1 },
  { id: 2019, name: "Kiểm tra cuối kì I", periods: 1 },
  { id: 2020, name: "Bài 17. Vỏ địa lí, quy luật thống nhất và hoàn chỉnh của vỏ địa lí", periods: 2 },
  { id: 2021, name: "Bài 18. Quy luật địa đới và quy luật phi địa đới", periods: 1 },
  { id: 2022, name: "Bài 19. Quy mô dân số, gia tăng dân số và cơ cấu dân số thế giới", periods: 3 },
  { id: 2023, name: "Bài 20. Phân bố dân cư và đô thị hóa trên thế giới", periods: 2 },
  { id: 2024, name: "Bài 21. Các nguồn lực phát triển kinh tế", periods: 1 },
  { id: 2025, name: "Bài 22. Cơ cấu kinh tế, tổng sản phẩm trong nước và tổng thu nhập quốc gia", periods: 2 },
  { id: 2026, name: "Bài 23. Vai trò, đặc điểm, các nhân tố ảnh hưởng tới phát triển và phân bố nông nghiệp, lâm nghiệp, thủy sản", periods: 2 },
  { id: 2027, name: "Bài 24. Địa lí ngành nông nghiệp", periods: 1 },
  { id: 2028, name: "Bài 25. Địa lí ngành lâm nghiệp và ngành thủy sản", periods: 1 },
  { id: 2029, name: "Bài 26. Tổ chức lãnh thổ nông nghiệp, một số vấn đề phát triển nông nghiệp hiện đại trên thế giới và định hướng phát triển nông nghiệp trong tương lai", periods: 1 },
  { id: 2030, name: "Bài 27. Thực hành: Vẽ và nhận xét biểu đồ về sản lượng lương thực của thế giới", periods: 1 },
  { id: 2031, name: "Bài 28. Vai trò, đặc điểm, cơ cấu ngành công nghiệp, các nhân tố ảnh hưởng tới sự phát triển và phân bố công nghiệp", periods: 1 },
  { id: 2032, name: "Bài 29. Địa lí một số ngành công nghiệp", periods: 2 },
  { id: 2033, name: "Ôn kiểm tra giữa kì II", periods: 1 },
  { id: 2034, name: "Kiểm tra giữa kì II", periods: 1 },
  { id: 2035, name: "Bài 30. Tổ chức lãnh thổ công nghiệp", periods: 1 },
  { id: 2036, name: "Bài 31. Tác động của công nghiệp đối với môi trường, phát triển năng lượng tái tạo, định hướng phát triển công nghiệp trong tương lai", periods: 1 },
  { id: 2037, name: "Bài 32. Thực hành: Viết báo cáo tìm hiểu một vấn đề về công nghiệp", periods: 1 },
  { id: 2038, name: "Bài 33. Cơ cấu, vai trò, đặc điểm, các nhân tố ảnh hưởng đến sự phát triển và phân bố dịch vụ", periods: 1 },
  { id: 2039, name: "Bài 34. Địa lí ngành giao thông vận tải", periods: 1 },
  { id: 2040, name: "Bài 35. Địa lí ngành bưu chính viễn thông", periods: 1 },
  { id: 2041, name: "Bài 36. Địa lí ngành du lịch", periods: 1 },
  { id: 2042, name: "Bài 37. Địa lí ngành thương mại và ngành tài chính ngân hàng", periods: 1 },
  { id: 2043, name: "Bài 38. Thực hành: Viết báo cáo tìm hiểu về một ngành dịch vụ", periods: 1 },
  { id: 2044, name: "Bài 39. Môi trường và tài nguyên thiên nhiên", periods: 2 },
  { id: 2045, name: "Bài 40. Phát triển bền vững và tăng trưởng xanh", periods: 1 },
  { id: 2046, name: "Ôn kiểm tra cuối kì II", periods: 1 },
  { id: 2047, name: "Kiểm tra cuối kì II", periods: 1 },
];

const GEOGRAPHY_11_LESSONS = [
  { id: 2100, name: "Bài 1. Sự khác biệt về trình độ phát triển kinh tế - xã hội của các nhóm nước", periods: 2 },
  { id: 2101, name: "Bài 2. Toàn cầu hoá, khu vực hoá kinh tế", periods: 3 },
  { id: 2102, name: "Bài 3. An ninh toàn cầu", periods: 1 },
  { id: 2103, name: "Bài 4. Thực hành: Tìm hiểu nền kinh tế tri thức", periods: 1 },
  { id: 2104, name: "Bài 5. Tự nhiên, dân cư và xã hội", periods: 3 },
  { id: 2105, name: "Bài 6. Kinh tế", periods: 2 },
  { id: 2106, name: "Bài 7. Thực hành: Tìm hiểu tình hình phát triển kinh tế - xã hội của Cộng hoà Liên bang Brasil (Bra-xin)", periods: 1 },
  { id: 2107, name: "Bài 8. EU – Một liên kết kinh tế khu vực lớn", periods: 1 },
  { id: 2108, name: "Ôn tập", periods: 1 },
  { id: 2109, name: "Kiểm tra giữa kỳ I", periods: 1 },
  { id: 2110, name: "Bài 9. Vị thế của EU trong nền kinh tế thế giới", periods: 3 },
  { id: 2111, name: "Bài 10. Thực hành: Tìm hiểu công nghiệp của Cộng hoà Liên bang Đức", periods: 1 },
  { id: 2112, name: "Bài 11. Tự nhiên, dân cư và xã hội", periods: 3 },
  { id: 2113, name: "Bài 12. Kinh tế", periods: 2 },
  { id: 2114, name: "Bài 13. Thực hành: Kinh tế Đông Nam Á", periods: 1 },
  { id: 2115, name: "Bài 14. Hiệp hội các quốc gia Đông Nam Á (ASEAN)", periods: 2 },
  { id: 2116, name: "Bài 15. Tự nhiên, dân cư và xã hội", periods: 2 },
  { id: 2117, name: "Bài 16. Kinh tế", periods: 2 },
  { id: 2118, name: "Bài 17. Vấn đề dầu mỏ", periods: 1 },
  { id: 2119, name: "Ôn tập", periods: 1 },
  { id: 2120, name: "Kiểm tra cuối học kỳ I", periods: 1 },
  { id: 2121, name: "Bài 18. Tự nhiên, dân cư và xã hội", periods: 3 },
  { id: 2122, name: "Bài 19. Kinh tế Hoa Kỳ", periods: 2 },
  { id: 2123, name: "Bài 20. Thực hành: Kinh tế Hoa Kỳ", periods: 1 },
  { id: 2124, name: "Bài 21. Tự nhiên, dân cư và xã hội", periods: 3 },
  { id: 2125, name: "Bài 22. Kinh tế Liên bang Nga", periods: 2 },
  { id: 2126, name: "Bài 23. Thực hành: Vẽ biểu đồ kinh tế của Liên Bang Nga", periods: 1 },
  { id: 2127, name: "Bài 24. Tự nhiên, dân cư và xã hội", periods: 2 },
  { id: 2128, name: "Bài 25. Kinh tế Nhật Bản", periods: 2 },
  { id: 2129, name: "Bài 26. Thực hành: Tìm hiểu hoạt động kinh tế đối ngoại của Nhật Bản", periods: 1 },
  { id: 2130, name: "Ôn tập", periods: 1 },
  { id: 2131, name: "Kiểm tra giữa kỳ II", periods: 1 },
  { id: 2132, name: "Bài 27. Tự nhiên, dân cư và xã hội", periods: 3 },
  { id: 2133, name: "Bài 28. Kinh tế Trung Quốc", periods: 3 },
  { id: 2134, name: "Bài 29. Thực hành: Tìm hiểu kinh tế tại vùng duyên hải Trung Quốc", periods: 1 },
  { id: 2135, name: "Bài 30. Kinh tế Australia", periods: 2 },
  { id: 2136, name: "Bài 31. Tự nhiên, dân cư và xã hội", periods: 2 },
  { id: 2137, name: "Bài 32. Kinh tế Cộng hoà Nam Phi", periods: 3 },
  { id: 2138, name: "Ôn tập", periods: 1 },
  { id: 2139, name: "Kiểm tra cuối học kỳ II", periods: 1 },
];

const GEOGRAPHY_12_LESSONS = [
  { id: 2200, name: "Bài 1. Vị trí địa lí và phạm vi lãnh thổ", periods: 2 },
  { id: 2201, name: "Bài 2. Thiên nhiên nhiệt đới ẩm gió mùa", periods: 2 },
  { id: 2202, name: "Bài 3. Sự phân hoá đa dạng của thiên nhiên", periods: 4 },
  { id: 2203, name: "Bài 4. Thực hành: Viết báo cáo về sự phân hoá tự nhiên Việt Nam", periods: 3 },
  { id: 2204, name: "Bài 5. Vấn đề sử dụng hợp lí tài nguyên thiên nhiên và bảo vệ môi trường", periods: 1 },
  { id: 2205, name: "Bài 6. Dân số Việt Nam", periods: 2 },
  { id: 2206, name: "Bài 7. Lao động và việc làm", periods: 1 },
  { id: 2207, name: "Bài 8. Đô thị hoá", periods: 1 },
  { id: 2208, name: "Bài 9. Thực hành: Viết báo cáo về một chủ đề dân cư ở Việt Nam", periods: 1 },
  { id: 2209, name: "Ôn tập kiểm tra giữa kì I", periods: 1 },
  { id: 2210, name: "Kiểm tra giữa kì I", periods: 1 },
  { id: 2211, name: "Bài 10. Chuyển dịch cơ cấu kinh tế", periods: 2 },
  { id: 2212, name: "Bài 11. Vấn đề phát triển ngành nông nghiệp", periods: 3 },
  { id: 2213, name: "Bài 12. Vấn đề phát triển ngành lâm nghiệp và ngành thuỷ sản", periods: 2 },
  { id: 2214, name: "Bài 13. Tổ chức lãnh thổ nông nghiệp", periods: 1 },
  { id: 2215, name: "Bài 14. Thực hành: Tìm hiểu vai trò ngành nông nghiệp, lâm nghiệp và thuỷ sản; vẽ biểu đồ và nhận xét về ngành nông nghiệp, lâm nghiệp và thuỷ sản", periods: 1 },
  { id: 2216, name: "Bài 15. Chuyển dịch cơ cấu ngành công nghiệp", periods: 1 },
  { id: 2217, name: "Bài 16. Một số ngành công nghiệp", periods: 3 },
  { id: 2218, name: "Bài 17. Tổ chức lãnh thổ công nghiệp", periods: 1 },
  { id: 2219, name: "Bài 18. Thực hành: Vẽ biểu đồ, nhận xét và giải thích tình hình phát triển ngành công nghiệp", periods: 1 },
  { id: 2220, name: "Ôn tập kiểm tra cuối kì I", periods: 1 },
  { id: 2221, name: "Kiểm tra cuối kì I", periods: 1 },
  { id: 2222, name: "Bài 19. Vai trò, các nhân tố ảnh hưởng đến sự phát triển và phân bố các ngành dịch vụ", periods: 1 },
  { id: 2223, name: "Bài 20. Giao thông vận tải và bưu chính viễn thông", periods: 2 },
  { id: 2224, name: "Bài 21. Thương mại và du lịch", periods: 2 },
  { id: 2225, name: "Bài 22. Thực hành: Tìm hiểu sự phát triển một số ngành dịch vụ", periods: 1 },
  { id: 2226, name: "Bài 23. Khai thác thế mạnh ở Trung du và miền núi Bắc Bộ", periods: 2 },
  { id: 2227, name: "Bài 24. Phát triển kinh tế - xã hội ở Đồng bằng sông Hồng", periods: 2 },
  { id: 2228, name: "Bài 26. Phát triển nông nghiệp, lâm nghiệp và thuỷ sản ở Bắc Trung Bộ", periods: 2 },
  { id: 2229, name: "Bài 27. Phát triển kinh tế biển ở Duyên hải Nam Trung Bộ", periods: 1 },
  { id: 2230, name: "Bài 25. Thực hành: Viết báo cáo về ý nghĩa của phát triển kinh tế biển đối với quốc phòng an ninh", periods: 1 },
  { id: 2231, name: "Ôn tập kiểm tra giữa kì II", periods: 1 },
  { id: 2232, name: "Kiểm tra giữa kì II", periods: 1 },
  { id: 2233, name: "Bài 28. Khai thác thế mạnh để phát triển kinh tế ở Tây Nguyên", periods: 2 },
  { id: 2234, name: "Bài 29. Phát triển kinh tế – xã hội ở Đông Nam Bộ", periods: 3 },
  { id: 2235, name: "Bài 30. Sử dụng hợp lí tự nhiên để phát triển kinh tế ở vùng Đồng bằng sông Cửu Long", periods: 3 },
  { id: 2236, name: "Bài 31. Thực hành: Viết báo cáo về biến đổi khí hậu ở Đồng bằng sông Cửu Long", periods: 1 },
  { id: 2237, name: "Bài 32. Phát triển các vùng kinh tế trọng điểm", periods: 3 },
  { id: 2238, name: "Bài 33. Phát triển kinh tế và đảm bảo quốc phòng an ninh ở Biển Đông và các đảo, quần đảo", periods: 2 },
  { id: 2239, name: "Bài 34. Thực hành: Viết báo cáo tuyên truyền về bảo vệ chủ quyền biển đảo của Việt Nam", periods: 1 },
  { id: 2240, name: "Bài 35. Thực hành: Tìm hiểu địa lí địa phương", periods: 2 },
  { id: 2241, name: "Kiểm tra cuối kì II", periods: 1 },
];


// ==================== Giáo dục Kinh tế và Pháp luật ====================
const KTPL_10_LESSONS = [
  { id: 3000, name: "Bài 1. Các hoạt động kinh tế cơ bản trong đời sống xã hội", periods: 3 },
  { id: 3001, name: "Bài 2. Các chủ thể của nền kinh tế", periods: 3 },
  { id: 3002, name: "Bài 3. Thị trường", periods: 3 },
  { id: 3003, name: "Bài 4. Cơ chế thị trường", periods: 3 },
  { id: 3004, name: "Bài 5. Ngân sách nhà nước", periods: 3 },
  { id: 3005, name: "Kiểm tra giữa kì I", periods: 1 },
  { id: 3006, name: "Bài 6. Thuế", periods: 3 },
  { id: 3007, name: "Bài 7. Sản xuất kinh doanh và các mô hình sản xuất kinh doanh", periods: 3 },
  { id: 3008, name: "Bài 8. Tín dụng và vai trò của tín dụng trong đời sống", periods: 2 },
  { id: 3009, name: "Bài 9. Dịch vụ tín dụng", periods: 4 },
  { id: 3010, name: "Bài 10. Lập kế hoạch tài chính cá nhân", periods: 4 },
  { id: 3011, name: "Bài 11. Khái niệm, đặc điểm và vai trò của pháp luật", periods: 2 },
  { id: 3012, name: "Kiểm tra cuối kì I", periods: 1 },
  { id: 3013, name: "Bài 12. Hệ thống pháp luật và văn bản pháp luật Việt Nam", periods: 2 },
  { id: 3014, name: "Bài 13. Thực hiện pháp luật", periods: 2 },
  { id: 3015, name: "Bài 14. Giới thiệu về Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam", periods: 2 },
  { id: 3016, name: "Bài 15. Nội dung cơ bản của Hiến pháp Việt Nam về chế độ chính trị", periods: 3 },
  { id: 3017, name: "Bài 16. Quyền con người, quyền và nghĩa vụ cơ bản của công dân trong Hiến pháp", periods: 3 },
  { id: 3018, name: "Bài 17. Nội dung cơ bản của Hiến pháp về kinh tế, văn hóa, xã hội, giáo dục, khoa học, công nghệ, môi trường", periods: 5 },
  { id: 3019, name: "Kiểm tra giữa kì II", periods: 1 },
  { id: 3020, name: "Bài 18. Nội dung cơ bản của Hiến pháp về bộ máy nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam", periods: 3 },
  { id: 3021, name: "Bài 19. Đặc điểm, cấu trúc và nguyên tắc hoạt động của hệ thống chính trị Việt Nam", periods: 3 },
  { id: 3022, name: "Bài 20. Đặc điểm, nguyên tắc tổ chức và hoạt động của bộ máy nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam", periods: 3 },
  { id: 3023, name: "Bài 21. Quốc hội, Chủ tịch nước, Chính phủ nước Cộng hòa xã hội chủ nghĩa Việt Nam", periods: 3 },
  { id: 3024, name: "Bài 22. Tòa án nhân dân và Viện kiểm sát nhân dân", periods: 2 },
  { id: 3025, name: "Bài 23. Hội đồng nhân dân và Ủy ban nhân dân", periods: 2 },
  { id: 3026, name: "Kiểm tra cuối kì II", periods: 1 },
];

const KTPL_11_LESSONS = [
  { id: 3100, name: "Bài 1. Cạnh tranh trong nền kinh tế thị trường", periods: 3 },
  { id: 3101, name: "Bài 2. Cung – cầu trong nền kinh tế thị trường", periods: 3 },
  { id: 3102, name: "Bài 3. Lạm phát", periods: 3 },
  { id: 3103, name: "Bài 4. Thất nghiệp", periods: 3 },
  { id: 3104, name: "Bài 5. Thị trường lao động và việc làm", periods: 4 },
  { id: 3105, name: "Ôn tập kiểm tra giữa học kì I", periods: 1 },
  { id: 3106, name: "Kiểm tra giữa học kì I", periods: 1 },
  { id: 3107, name: "Bài 6. Ý tưởng, cơ hội kinh doanh và các năng lực cần thiết của người kinh doanh", periods: 6 },
  { id: 3108, name: "Bài 7. Đạo đức kinh doanh", periods: 5 },
  { id: 3109, name: "Bài 8. Văn hóa tiêu dùng", periods: 3 },
  { id: 3110, name: "Ôn tập kiểm tra cuối học kì I", periods: 1 },
  { id: 3111, name: "Kiểm tra cuối học kì I", periods: 1 },
  { id: 3112, name: "Bài 8. Văn hóa tiêu dùng (tiếp theo)", periods: 2 },
  { id: 3113, name: "Bài 9. Quyền bình đẳng của công dân trước pháp luật", periods: 3 },
  { id: 3114, name: "Bài 10. Bình đẳng giới trong các lĩnh vực", periods: 3 },
  { id: 3115, name: "Bài 11. Quyền bình đẳng giữa các dân tộc", periods: 2 },
  { id: 3116, name: "Bài 12. Quyền bình đẳng giữa các tôn giáo", periods: 2 },
  { id: 3117, name: "Bài 13. Quyền và nghĩa vụ cơ bản của công dân trong tham gia quản lí nhà nước và xã hội", periods: 2 },
  { id: 3118, name: "Bài 14. Quyền và nghĩa vụ của công dân về bầu cử và ứng cử", periods: 2 },
  { id: 3119, name: "Ôn tập kiểm tra giữa học kì II", periods: 1 },
  { id: 3120, name: "Kiểm tra giữa học kì II", periods: 1 },
  { id: 3121, name: "Bài 15. Quyền và nghĩa vụ của công dân về khiếu nại, tố cáo", periods: 3 },
  { id: 3122, name: "Bài 16. Quyền và nghĩa vụ của công dân về bảo vệ Tổ quốc", periods: 2 },
  { id: 3123, name: "Bài 17. Quyền bất khả xâm phạm về thân thể và quyền được pháp luật bảo hộ về tính mạng, sức khỏe, danh dự, nhân phẩm của công dân.", periods: 3 },
  { id: 3124, name: "Bài 18. Quyền bất khả xâm phạm về chỗ ở của công dân.", periods: 2 },
  { id: 3125, name: "Bài 19. Quyền được đảm bảo an toàn và bí mật, thư tín, điện thoại, điện tín của công dân.", periods: 2 },
  { id: 3126, name: "Bài 20. Quyền và nghĩa vụ của công dân về tự do ngôn luận, báo chí và tiếp cận thông tin.", periods: 2 },
  { id: 3127, name: "Ôn tập kiểm tra cuối học kì II", periods: 1 },
  { id: 3128, name: "Kiểm tra cuối học kì II", periods: 1 },
  { id: 3129, name: "Bài 21. Quyền và nghĩa vụ của công dân về tự do tín ngưỡng và tôn giáo.", periods: 2 },
];

const KTPL_12_LESSONS = [
  { id: 3200, name: "Bài 1. Tăng trưởng và phát triển kinh tế", periods: 5 },
  { id: 3201, name: "Bài 2. Hội nhập kinh tế quốc tế", periods: 5 },
  { id: 3202, name: "Bài 3. Bảo hiểm", periods: 3 },
  { id: 3203, name: "Bài 4. An sinh xã hội", periods: 3 },
  { id: 3204, name: "Ôn tập kiểm tra giữa học kì I", periods: 1 },
  { id: 3205, name: "Kiểm tra giữa học kì I", periods: 1 },
  { id: 3206, name: "Bài 5. Lập kế hoạch kinh doanh", periods: 5 },
  { id: 3207, name: "Bài 6. Trách nhiệm xã hội của doanh nghiệp", periods: 5 },
  { id: 3208, name: "Bài 7. Quản lí thu, chi trong gia đình", periods: 5 },
  { id: 3209, name: "Ôn tập kiểm tra cuối học kì I", periods: 1 },
  { id: 3210, name: "Kiểm tra cuối học kì I", periods: 1 },
  { id: 3211, name: "Bài 8. Quyền và nghĩa vụ của công dân về kinh doanh và nộp thuế", periods: 1 },
  { id: 3212, name: "Bài 8. Quyền và nghĩa vụ của công dân về kinh doanh và nộp thuế (tiếp theo)", periods: 2 },
  { id: 3213, name: "Bài 9. Quyền và nghĩa vụ của công dân về sở hữu tài sản và tôn trọng tài sản của người khác", periods: 3 },
  { id: 3214, name: "Bài 10. Quyền và nghĩa vụ của công dân trong hôn nhân và gia đình", periods: 3 },
  { id: 3215, name: "Bài 11. Quyền và nghĩa vụ của công dân trong học tập", periods: 2 },
  { id: 3216, name: "Bài 12. Quyền và nghĩa vụ của công dân trong bảo vệ, chăm sóc sức khoẻ; bảo đảm an sinh xã hội", periods: 3 },
  { id: 3217, name: "Bài 13. Quyền và nghĩa vụ của công dân trong bảo vệ di sản văn hoá, môi trường và tài nguyên thiên nhiên", periods: 3 },
  { id: 3218, name: "Ôn tập kiểm tra giữa học kì II", periods: 1 },
  { id: 3219, name: "Kiểm tra giữa học kì II", periods: 1 },
  { id: 3220, name: "Bài 14. Một số vấn đề chung về pháp luật quốc tế", periods: 2 },
  { id: 3221, name: "Bài 15. Công pháp quốc tế về dân cư, lãnh thổ và chủ quyền quốc gia", periods: 6 },
  { id: 3222, name: "Bài 16. Nguyên tắc cơ bản của Tổ chức Thương mại thế giới và hợp đồng thương mại quốc tế", periods: 4 },
  { id: 3223, name: "Ôn tập kiểm tra cuối học kì II", periods: 1 },
  { id: 3224, name: "Kiểm tra cuối học kì II", periods: 1 },
  { id: 3225, name: "Bài 16. Nguyên tắc cơ bản của Tổ chức Thương mại thế giới và hợp đồng thương mại quốc tế (tiếp theo)", periods: 2 },
  { id: 3226, name: "Chuyên đề 1. Phát triển kinh tế và sự biến đổi văn hoá, xã hội", periods: 10 },
  { id: 3227, name: "Chuyên đề 2. Một số vấn đề về Luật Doanh nghiệp", periods: 10 },
  { id: 3228, name: "Chuyên đề 3. Việt Nam trong tiến trình hội nhập kinh tế quốc tế", periods: 15 },
];


// ==================== Tiếng Anh ====================
const ENGLISH_10_LESSONS = [
  { id: 4000, name: "Unit 1 - Getting started", periods: 1 },
  { id: 4001, name: "Language", periods: 1 },
  { id: 4002, name: "Reading", periods: 1 },
  { id: 4003, name: "Speaking", periods: 1 },
  { id: 4004, name: "Listening", periods: 1 },
  { id: 4005, name: "Writing", periods: 1 },
  { id: 4006, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4007, name: "Looking back & Project", periods: 1 },
  { id: 4008, name: "Unit 2 - Getting started", periods: 1 },
  { id: 4009, name: "Language", periods: 1 },
  { id: 4010, name: "Reading", periods: 1 },
  { id: 4011, name: "Speaking", periods: 1 },
  { id: 4012, name: "Listening", periods: 1 },
  { id: 4013, name: "Writing", periods: 1 },
  { id: 4014, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4015, name: "Looking back & Project", periods: 1 },
  { id: 4016, name: "Unit 3 - Getting started", periods: 1 },
  { id: 4017, name: "Language", periods: 1 },
  { id: 4018, name: "Reading", periods: 1 },
  { id: 4019, name: "Speaking", periods: 1 },
  { id: 4020, name: "Listening", periods: 1 },
  { id: 4021, name: "Writing", periods: 1 },
  { id: 4022, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4023, name: "Looking back & Project", periods: 1 },
  { id: 4024, name: "Review 1 - Language", periods: 1 },
  { id: 4025, name: "Skills (1)", periods: 1 },
  { id: 4026, name: "Skills (2)", periods: 1 },
  { id: 4027, name: "Mid-term test", periods: 1 },
  { id: 4028, name: "Unit 4 - Getting started", periods: 1 },
  { id: 4029, name: "Language", periods: 1 },
  { id: 4030, name: "Reading", periods: 1 },
  { id: 4031, name: "Speaking", periods: 1 },
  { id: 4032, name: "Listening", periods: 1 },
  { id: 4033, name: "Writing", periods: 1 },
  { id: 4034, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4035, name: "Looking back & Project", periods: 1 },
  { id: 4036, name: "Unit 5 - Getting started", periods: 1 },
  { id: 4037, name: "Language", periods: 1 },
  { id: 4038, name: "Reading", periods: 1 },
  { id: 4039, name: "Speaking", periods: 1 },
  { id: 4040, name: "Listening", periods: 1 },
  { id: 4041, name: "Writing", periods: 1 },
  { id: 4042, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4043, name: "Looking back & Project", periods: 1 },
  { id: 4044, name: "Review 2 - Language", periods: 1 },
  { id: 4045, name: "Skills (1)", periods: 1 },
  { id: 4046, name: "Skills (2)", periods: 1 },
  { id: 4047, name: "Revision for end-of-term test", periods: 1 },
  { id: 4048, name: "End-of-term test", periods: 1 },
  { id: 4049, name: "Feedback and correction", periods: 1 },
  { id: 4050, name: "In reserve", periods: 1 },
  { id: 4051, name: "Unit 6 - Getting started", periods: 1 },
  { id: 4052, name: "Language", periods: 1 },
  { id: 4053, name: "Reading", periods: 1 },
  { id: 4054, name: "Unit 6 - Speaking", periods: 1 },
  { id: 4055, name: "Listening", periods: 1 },
  { id: 4056, name: "Writing", periods: 1 },
  { id: 4057, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4058, name: "Looking back & Project", periods: 1 },
  { id: 4059, name: "Unit 7 - Getting started", periods: 1 },
  { id: 4060, name: "Language", periods: 1 },
  { id: 4061, name: "Reading", periods: 1 },
  { id: 4062, name: "Speaking", periods: 1 },
  { id: 4063, name: "Listening", periods: 1 },
  { id: 4064, name: "Writing", periods: 1 },
  { id: 4065, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4066, name: "Looking back & Project", periods: 1 },
  { id: 4067, name: "Unit 8 - Getting started", periods: 1 },
  { id: 4068, name: "Language", periods: 1 },
  { id: 4069, name: "Reading", periods: 1 },
  { id: 4070, name: "Speaking", periods: 1 },
  { id: 4071, name: "Listening", periods: 1 },
  { id: 4072, name: "Writing", periods: 1 },
  { id: 4073, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4074, name: "Looking back & Project", periods: 1 },
  { id: 4075, name: "Review 3 - Language", periods: 1 },
  { id: 4076, name: "Skills (1)", periods: 1 },
  { id: 4077, name: "Skills (2)", periods: 1 },
  { id: 4078, name: "Mid-term test", periods: 1 },
  { id: 4079, name: "Unit 9 - Getting started", periods: 1 },
  { id: 4080, name: "Language", periods: 1 },
  { id: 4081, name: "Reading", periods: 1 },
  { id: 4082, name: "Speaking", periods: 1 },
  { id: 4083, name: "Listening", periods: 1 },
  { id: 4084, name: "Writing", periods: 1 },
  { id: 4085, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4086, name: "Looking back & Project", periods: 1 },
  { id: 4087, name: "Unit 10 - Getting started", periods: 1 },
  { id: 4088, name: "Language", periods: 1 },
  { id: 4089, name: "Reading", periods: 1 },
  { id: 4090, name: "Speaking", periods: 1 },
  { id: 4091, name: "Listening", periods: 1 },
  { id: 4092, name: "Writing", periods: 1 },
  { id: 4093, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4094, name: "Looking back & Project", periods: 1 },
  { id: 4095, name: "Review 4 - Language", periods: 1 },
  { id: 4096, name: "Skills (1)", periods: 1 },
  { id: 4097, name: "Skills (2)", periods: 1 },
  { id: 4098, name: "Revision for end-of-term test", periods: 1 },
  { id: 4099, name: "End-of-term test", periods: 1 },
  { id: 4100, name: "Feedback and correction", periods: 1 },
  { id: 4101, name: "In reserve", periods: 1 },
  { id: 4102, name: "In reserve", periods: 1 },
  { id: 4103, name: "In reserve", periods: 1 },
  { id: 4104, name: "In reserve", periods: 1 },
];

const ENGLISH_11_LESSONS = [
  { id: 4100, name: "Unit 1 - Getting started", periods: 1 },
  { id: 4101, name: "Language", periods: 1 },
  { id: 4102, name: "Reading", periods: 1 },
  { id: 4103, name: "Speaking", periods: 1 },
  { id: 4104, name: "Listening", periods: 1 },
  { id: 4105, name: "Writing", periods: 1 },
  { id: 4106, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4107, name: "Looking back & Project", periods: 1 },
  { id: 4108, name: "Unit 2 - Getting started", periods: 1 },
  { id: 4109, name: "Language", periods: 1 },
  { id: 4110, name: "Reading", periods: 1 },
  { id: 4111, name: "Speaking", periods: 1 },
  { id: 4112, name: "Listening", periods: 1 },
  { id: 4113, name: "Writing", periods: 1 },
  { id: 4114, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4115, name: "Looking back & Project", periods: 1 },
  { id: 4116, name: "Unit 3 - Getting started", periods: 1 },
  { id: 4117, name: "Language", periods: 1 },
  { id: 4118, name: "Reading", periods: 1 },
  { id: 4119, name: "Speaking", periods: 1 },
  { id: 4120, name: "Listening", periods: 1 },
  { id: 4121, name: "Writing", periods: 1 },
  { id: 4122, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4123, name: "Looking back & Project", periods: 1 },
  { id: 4124, name: "Review 1 - Language", periods: 1 },
  { id: 4125, name: "Skills (1)", periods: 1 },
  { id: 4126, name: "Skills (2)", periods: 1 },
  { id: 4127, name: "Mid-term test", periods: 1 },
  { id: 4128, name: "Unit 4 - Getting started", periods: 1 },
  { id: 4129, name: "Language", periods: 1 },
  { id: 4130, name: "Reading", periods: 1 },
  { id: 4131, name: "Speaking", periods: 1 },
  { id: 4132, name: "Listening", periods: 1 },
  { id: 4133, name: "Writing", periods: 1 },
  { id: 4134, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4135, name: "Looking back & Project", periods: 1 },
  { id: 4136, name: "Unit 5 - Getting started", periods: 1 },
  { id: 4137, name: "Language", periods: 1 },
  { id: 4138, name: "Reading", periods: 1 },
  { id: 4139, name: "Speaking", periods: 1 },
  { id: 4140, name: "Listening", periods: 1 },
  { id: 4141, name: "Writing", periods: 1 },
  { id: 4142, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4143, name: "Looking back & Project", periods: 1 },
  { id: 4144, name: "Review 2 - Language", periods: 1 },
  { id: 4145, name: "Skills (1)", periods: 1 },
  { id: 4146, name: "Skills (2)", periods: 1 },
  { id: 4147, name: "Revision for end-of-term test", periods: 1 },
  { id: 4148, name: "End-of-term test", periods: 1 },
  { id: 4149, name: "Feedback and correction", periods: 1 },
  { id: 4150, name: "In reserve", periods: 1 },
  { id: 4151, name: "Unit 6 - Getting started", periods: 1 },
  { id: 4152, name: "Language", periods: 1 },
  { id: 4153, name: "Reading", periods: 1 },
  { id: 4154, name: "Unit 6 - Speaking", periods: 1 },
  { id: 4155, name: "Listening", periods: 1 },
  { id: 4156, name: "Writing", periods: 1 },
  { id: 4157, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4158, name: "Looking back & Project", periods: 1 },
  { id: 4159, name: "Unit 7 - Getting started", periods: 1 },
  { id: 4160, name: "Language", periods: 1 },
  { id: 4161, name: "Reading", periods: 1 },
  { id: 4162, name: "Speaking", periods: 1 },
  { id: 4163, name: "Listening", periods: 1 },
  { id: 4164, name: "Writing", periods: 1 },
  { id: 4165, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4166, name: "Looking back & Project", periods: 1 },
  { id: 4167, name: "Unit 8 - Getting started", periods: 1 },
  { id: 4168, name: "Language", periods: 1 },
  { id: 4169, name: "Reading", periods: 1 },
  { id: 4170, name: "Speaking", periods: 1 },
  { id: 4171, name: "Listening", periods: 1 },
  { id: 4172, name: "Writing", periods: 1 },
  { id: 4173, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4174, name: "Looking back & Project", periods: 1 },
  { id: 4175, name: "Review 3 - Language", periods: 1 },
  { id: 4176, name: "Skills (1)", periods: 1 },
  { id: 4177, name: "Skills (2)", periods: 1 },
  { id: 4178, name: "Mid-term test", periods: 1 },
  { id: 4179, name: "Unit 9 - Getting started", periods: 1 },
  { id: 4180, name: "Language", periods: 1 },
  { id: 4181, name: "Reading", periods: 1 },
  { id: 4182, name: "Speaking", periods: 1 },
  { id: 4183, name: "Listening", periods: 1 },
  { id: 4184, name: "Writing", periods: 1 },
  { id: 4185, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4186, name: "Looking back & Project", periods: 1 },
  { id: 4187, name: "Unit 10 - Getting started", periods: 1 },
  { id: 4188, name: "Language", periods: 1 },
  { id: 4189, name: "Reading", periods: 1 },
  { id: 4190, name: "Speaking", periods: 1 },
  { id: 4191, name: "Listening", periods: 1 },
  { id: 4192, name: "Writing", periods: 1 },
  { id: 4193, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4194, name: "Looking back & Project", periods: 1 },
  { id: 4195, name: "Review 4 - Language", periods: 1 },
  { id: 4196, name: "Skills (1)", periods: 1 },
  { id: 4197, name: "Skills (2)", periods: 1 },
  { id: 4198, name: "Revision for end-of-term test", periods: 1 },
  { id: 4199, name: "End-of-term test", periods: 1 },
  { id: 4200, name: "Feedback and correction", periods: 1 },
  { id: 4201, name: "In reserve", periods: 1 },
  { id: 4202, name: "In reserve", periods: 1 },
  { id: 4203, name: "In reserve", periods: 1 },
  { id: 4204, name: "In reserve", periods: 1 },
];

const ENGLISH_12_LESSONS = [
  { id: 4200, name: "Unit 1 - Getting started", periods: 1 },
  { id: 4201, name: "Language", periods: 1 },
  { id: 4202, name: "Reading", periods: 1 },
  { id: 4203, name: "Speaking", periods: 1 },
  { id: 4204, name: "Listening", periods: 1 },
  { id: 4205, name: "Writing", periods: 1 },
  { id: 4206, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4207, name: "Looking back & Project", periods: 1 },
  { id: 4208, name: "Unit 2 - Getting started", periods: 1 },
  { id: 4209, name: "Language", periods: 1 },
  { id: 4210, name: "Reading", periods: 1 },
  { id: 4211, name: "Speaking", periods: 1 },
  { id: 4212, name: "Listening", periods: 1 },
  { id: 4213, name: "Writing", periods: 1 },
  { id: 4214, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4215, name: "Looking back & Project", periods: 1 },
  { id: 4216, name: "Unit 3 - Getting started", periods: 1 },
  { id: 4217, name: "Language", periods: 1 },
  { id: 4218, name: "Reading", periods: 1 },
  { id: 4219, name: "Speaking", periods: 1 },
  { id: 4220, name: "Listening", periods: 1 },
  { id: 4221, name: "Writing", periods: 1 },
  { id: 4222, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4223, name: "Looking back & Project", periods: 1 },
  { id: 4224, name: "Review 1 - Language", periods: 1 },
  { id: 4225, name: "Skills (1)", periods: 1 },
  { id: 4226, name: "Skills (2)", periods: 1 },
  { id: 4227, name: "Mid-term test", periods: 1 },
  { id: 4228, name: "Unit 4 - Getting started", periods: 1 },
  { id: 4229, name: "Language", periods: 1 },
  { id: 4230, name: "Reading", periods: 1 },
  { id: 4231, name: "Speaking", periods: 1 },
  { id: 4232, name: "Listening", periods: 1 },
  { id: 4233, name: "Writing", periods: 1 },
  { id: 4234, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4235, name: "Looking back & Project", periods: 1 },
  { id: 4236, name: "Unit 5 - Getting started", periods: 1 },
  { id: 4237, name: "Language", periods: 1 },
  { id: 4238, name: "Reading", periods: 1 },
  { id: 4239, name: "Speaking", periods: 1 },
  { id: 4240, name: "Listening", periods: 1 },
  { id: 4241, name: "Writing", periods: 1 },
  { id: 4242, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4243, name: "Looking back & Project", periods: 1 },
  { id: 4244, name: "Review 2 - Language", periods: 1 },
  { id: 4245, name: "Skills (1)", periods: 1 },
  { id: 4246, name: "Skills (2)", periods: 1 },
  { id: 4247, name: "Revision for end-of-term test", periods: 1 },
  { id: 4248, name: "End-of-term test", periods: 1 },
  { id: 4249, name: "Feedback and correction", periods: 1 },
  { id: 4250, name: "In reserve (Dự phòng)", periods: 1 },
  { id: 4251, name: "Unit 6 - Getting started", periods: 1 },
  { id: 4252, name: "Language", periods: 1 },
  { id: 4253, name: "Reading", periods: 1 },
  { id: 4254, name: "Unit 6 - Speaking", periods: 1 },
  { id: 4255, name: "Listening", periods: 1 },
  { id: 4256, name: "Writing", periods: 1 },
  { id: 4257, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4258, name: "Looking back & Project", periods: 1 },
  { id: 4259, name: "Unit 7 - Getting started", periods: 1 },
  { id: 4260, name: "Language", periods: 1 },
  { id: 4261, name: "Reading", periods: 1 },
  { id: 4262, name: "Speaking", periods: 1 },
  { id: 4263, name: "Listening", periods: 1 },
  { id: 4264, name: "Writing", periods: 1 },
  { id: 4265, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4266, name: "Looking back & Project", periods: 1 },
  { id: 4267, name: "Unit 8 - Getting started", periods: 1 },
  { id: 4268, name: "Language", periods: 1 },
  { id: 4269, name: "Reading", periods: 1 },
  { id: 4270, name: "Speaking", periods: 1 },
  { id: 4271, name: "Listening", periods: 1 },
  { id: 4272, name: "Writing", periods: 1 },
  { id: 4273, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4274, name: "Looking back & Project", periods: 1 },
  { id: 4275, name: "Review 3 - Language", periods: 1 },
  { id: 4276, name: "Skills (1)", periods: 1 },
  { id: 4277, name: "Skills (2)", periods: 1 },
  { id: 4278, name: "Mid-term test", periods: 1 },
  { id: 4279, name: "Unit 9 - Getting started", periods: 1 },
  { id: 4280, name: "Language", periods: 1 },
  { id: 4281, name: "Reading", periods: 1 },
  { id: 4282, name: "Speaking", periods: 1 },
  { id: 4283, name: "Listening", periods: 1 },
  { id: 4284, name: "Writing", periods: 1 },
  { id: 4285, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4286, name: "Looking back & Project", periods: 1 },
  { id: 4287, name: "Unit 10 - Getting started", periods: 1 },
  { id: 4288, name: "Language", periods: 1 },
  { id: 4289, name: "Reading", periods: 1 },
  { id: 4290, name: "Speaking", periods: 1 },
  { id: 4291, name: "Listening", periods: 1 },
  { id: 4292, name: "Writing", periods: 1 },
  { id: 4293, name: "Communication & Culture/ CLIL", periods: 1 },
  { id: 4294, name: "Looking back & Project", periods: 1 },
  { id: 4295, name: "Review 4 - Language", periods: 1 },
  { id: 4296, name: "Skills (1)", periods: 1 },
  { id: 4297, name: "Skills (2)", periods: 1 },
  { id: 4298, name: "Revision for end-of-term test", periods: 1 },
  { id: 4299, name: "End-of-term test", periods: 1 },
  { id: 4300, name: "Feedback and correction", periods: 1 },
  { id: 4301, name: "In reserve (Dự phòng)", periods: 1 },
  { id: 4302, name: "In reserve (Dự phòng)", periods: 1 },
  { id: 4303, name: "In reserve (Dự phòng)", periods: 1 },
  { id: 4304, name: "In reserve (Dự phòng)", periods: 1 },
];


// ==================== Ngữ văn ====================
const LITERATURE_10_LESSONS = [
  { id: 5000, name: "Bài 1. Sức hấp dẫn của truyện kể", periods: 11 },
  { id: 5001, name: "Đọc VB 1,2,3. Truyện về các vị thần sáng tạo thế giới", periods: 2 },
  { id: 5002, name: "Đọc VB 4. Tản Viên từ Phán sự lục", periods: 2 },
  { id: 5003, name: "Đọc VB 5. Chữ người tử tù", periods: 3 },
  { id: 5004, name: "Thực hành tiếng Việt. Sử dụng từ Hán Việt", periods: 1 },
  { id: 5005, name: "Viết. Viết VB nghị luận phân tích đánh giá một tác phẩm truyện (Chủ đề, những nét đặc sắc về hình thức nghệ thuật)", periods: 1 },
  { id: 5006, name: "Nói và nghe. Giới thiệu, đánh giá nội dung, nghệ thuật của một tác phẩm truyện", periods: 1 },
  { id: 5007, name: "Bài 2. Vẻ đẹp của thơ ca", periods: 11 },
  { id: 5008, name: "Đọc VB 1,2,3. Chùm thơ hai-cư", periods: 1 },
  { id: 5009, name: "Đọc VB 4. Thu hứng", periods: 2 },
  { id: 5010, name: "Đọc VB 5. Mùa xuân chín", periods: 2 },
  { id: 5011, name: "Đọc VB 6. Bản hoà âm ngôn từ trong Tiếng thu của Lưu Trọng Lư", periods: 1 },
  { id: 5012, name: "Thực hành tiếng Việt. Lỗi dùng từ, lỗi về trật tự từ và cách sửa", periods: 1 },
  { id: 5013, name: "Viết. Viết VB nghị luận phân tích đánh giá một tác phẩm thơ", periods: 2 },
  { id: 5014, name: "Nói và nghe. Giới thiệu, đánh giá nội dung, nghệ thuật của một tác phẩm thơ", periods: 1 },
  { id: 5015, name: "Bài 3. Nghệ thuật thuyết phục trong văn nghị luận", periods: 11 },
  { id: 5016, name: "Đọc VB 1. Hiền tài là nguyên khí của quốc gia", periods: 2 },
  { id: 5017, name: "Đọc VB 2. Yêu và đồng cảm", periods: 2 },
  { id: 5018, name: "Đọc VB 3. Chữ bầu lên nhà thơ", periods: 2 },
  { id: 5019, name: "Thực hành tiếng Việt. Lỗi về mạch lạc và liên kết trong đoạn văn, văn bản", periods: 1 },
  { id: 5020, name: "Viết. Viết bài luận thuyết phục người khác từ bỏ một thói quen hay một quan niệm", periods: 1 },
  { id: 5021, name: "Nói và nghe. Thảo luận về một vấn đề xã hội có ý kiến khác nhau", periods: 1 },
  { id: 5022, name: "Bài 4. Sức sống của sử thi", periods: 9 },
  { id: 5023, name: "Đọc VB 1. Héc-to từ biệt Ăng-đrô-mác", periods: 3 },
  { id: 5024, name: "Đọc VB 2. Đăm Săn đi bắt Nữ Thần Mặt Trời", periods: 2 },
  { id: 5025, name: "Thực hành tiếng Việt. Sử dụng trích dẫn, cước chú và đánh dấu phần bị tỉnh lược trong VB", periods: 1 },
  { id: 5026, name: "Viết. Viết báo cáo nghiên cứu về một vấn đề", periods: 1 },
  { id: 5027, name: "Nói và nghe. Trình bày báo cáo kết quả nghiên cứu về một vấn đề", periods: 1 },
  { id: 5028, name: "Bài 5. Tích trò sân khấu dân gian", periods: 7 },
  { id: 5029, name: "Đọc VB 1. Xuý Vân giả dại", periods: 2 },
  { id: 5030, name: "Đọc VB 2. Huyện đường", periods: 1 },
  { id: 5031, name: "Đọc VB 3. Hiện đại soi bóng tiền nhân", periods: 1 },
  { id: 5032, name: "Viết. Viết báo cáo nghiên cứu (Về một vấn đề văn hoá truyền thống Việt Nam)", periods: 1 },
  { id: 5033, name: "Nói và nghe. Lắng nghe và phản hồi về kết quả thuyết trình một bài nghiên cứu", periods: 1 },
  { id: 5034, name: "Bài 6. Nguyễn Trãi – Dành còn để trợ dân này", periods: 12 },
  { id: 5035, name: "Đọc VB 1. Tác gia Nguyễn Trãi", periods: 2 },
  { id: 5036, name: "Đọc VB 2. Bình Ngô đại cáo", periods: 3 },
  { id: 5037, name: "Đọc VB 3. Bảo kính cảnh giới (Bài 43)", periods: 1 },
  { id: 5038, name: "Đọc VB 4. Dục Thuý sơn", periods: 1 },
  { id: 5039, name: "Viết. Viết VB nghị luận về một vấn đề xã hội", periods: 2 },
  { id: 5040, name: "Thực hành tiếng Việt. Sử dụng từ Hán Việt", periods: 1 },
  { id: 5041, name: "Nói và nghe. Thảo luận về một vấn đề xã hội có ý kiến khác nhau", periods: 1 },
  { id: 5042, name: "Bài 7. Quyền năng của người kể chuyện", periods: 12 },
  { id: 5043, name: "Đọc VB 1. Người cầm quyền khôi phục uy quyền", periods: 3 },
  { id: 5044, name: "Đọc VB 2. Dưới bóng hoàng lan", periods: 2 },
  { id: 5045, name: "Đọc VB 3. Một chuyện đùa nho nhỏ", periods: 2 },
  { id: 5046, name: "Thực hành tiếng Việt. Biện pháp chêm xen, biện pháp liệt kê", periods: 1 },
  { id: 5047, name: "Viết. Viết VB nghị luận phân tích đánh giá một tác phẩm văn học (Chủ đề, nhân vật trong tác phẩm truyện)", periods: 1 },
  { id: 5048, name: "Nói và nghe. Thảo luận về một vấn đề văn học có ý kiến khác nhau", periods: 1 },
  { id: 5049, name: "Bài 8. Thế giới đa dạng của thông tin", periods: 11 },
  { id: 5050, name: "Đọc VB 1. Sự sống và cái chết", periods: 2 },
  { id: 5051, name: "Đọc VB 2. Nghệ thuật truyền thống của người Việt", periods: 2 },
  { id: 5052, name: "Đọc VB 3. Phục hồi tầng ozone: Thành công hiếm hoi của nỗ lực toàn cầu", periods: 2 },
  { id: 5053, name: "Viết. Viết một văn bản nội quy hoặc văn bản hướng dẫn nơi công cộng", periods: 2 },
  { id: 5054, name: "Thực hành tiếng Việt. Sử dụng phương tiện phi ngôn ngữ", periods: 1 },
  { id: 5055, name: "Nói và nghe. Thảo luận về văn bản nội quy hoặc văn bản hướng dẫn nơi công cộng", periods: 1 },
  { id: 5056, name: "Bài 9. Hành trang cuộc sống", periods: 11 },
  { id: 5057, name: "Đọc VB 1. Về chính chúng ta", periods: 2 },
  { id: 5058, name: "Đọc VB 2. Con đường không chọn", periods: 2 },
  { id: 5059, name: "Đọc VB 3. Một đời như kẻ tìm đường", periods: 2 },
  { id: 5060, name: "Thực hành tiếng Việt. Sử dụng phương tiện phi ngôn ngữ (tiếp)", periods: 1 },
  { id: 5061, name: "Viết. Viết bài luận về bản thân", periods: 2 },
  { id: 5062, name: "Nói và nghe. Thuyết trình về một vấn đề xã hội có sử dụng kết hợp phương tiện ngôn ngữ và phi ngôn ngữ", periods: 1 },
  { id: 5063, name: "CĐ 1. Tập nghiên cứu và viết báo cáo về một vấn đề văn học dân gian", periods: 10 },
  { id: 5064, name: "Tìm hiểu về nghiên cứu một vấn đề văn học dân gian", periods: 1 },
  { id: 5065, name: "Thực hành nghiên cứu", periods: 1 },
  { id: 5066, name: "Tìm hiểu việc viết báo cáo về một vấn đề văn học dân gian", periods: 1 },
  { id: 5067, name: "Thực hành viết báo cáo", periods: 1 },
  { id: 5068, name: "CĐ 2. Sân khấu hoá tác phẩm văn học", periods: 15 },
  { id: 5069, name: "Tìm hiểu về sân khấu hoá tác phẩm văn học: Đọc VB", periods: 1 },
  { id: 5070, name: "Tìm hiểu về sân khấu hoá tác phẩm văn học: Xem vở diễn", periods: 1 },
  { id: 5071, name: "Thực hành sân khấu hoá tác phẩm văn học: Dựng kịch bản", periods: 1 },
  { id: 5072, name: "Thực hành sân khấu hoá tác phẩm văn học: Luyện tập & Biểu diễn", periods: 1 },
  { id: 5073, name: "CĐ 3. Đọc, viết, giới thiệu một tập thơ, một tập truyện ngắn hoặc một tiểu thuyết", periods: 15 },
  { id: 5074, name: "Tìm hiểu về cách đọc và Thực hành đọc", periods: 1 },
  { id: 5075, name: "Tìm hiểu một số hướng viết bài và Thực hành viết", periods: 1 },
  { id: 5076, name: "Tìm hiểu yêu cầu của hoạt động giới thiệu (thuyết trình) và Thực hành giới thiệu (thuyết trình)", periods: 1 },
];

const LITERATURE_11_LESSONS = [
  { id: 5100, name: "Bài 1. Câu chuyện và điểm nhìn trong truyện kể", periods: 11 },
  { id: 5101, name: "Bài 2. Cấu tứ và hình ảnh trong thơ trữ tình", periods: 11 },
  { id: 5102, name: "Bài 3. Cấu trúc của văn bản nghị luận", periods: 10 },
  { id: 5103, name: "Bài 4. Tự sự trong truyện thơ dân gian và trong thơ trữ tình", periods: 9 },
  { id: 5104, name: "Bài 5. Nhân vật và xung đột trong bi kịch", periods: 8 },
  { id: 5105, name: "Bài 6. Nguyễn Du – “Những điều trông thấy mà đau đớn lòng”", periods: 12 },
  { id: 5106, name: "Bài 7. Ghi chép và tưởng tượng trong kí", periods: 11 },
  { id: 5107, name: "Bài 8. Cấu trúc của văn bản thông tin", periods: 11 },
  { id: 5108, name: "Bài 9. Lựa chọn và hành động", periods: 11 },
];

const LITERATURE_12_LESSONS = [
  { id: 5200, name: "Bài 1. Khả năng lớn lao của tiểu thuyết", periods: 11 },
  { id: 5201, name: "Đọc. Xuân Tóc Đỏ cứu quốc (Trích Số Đỏ - Vũ Trọng Phụng)", periods: 3 },
  { id: 5202, name: "Đọc. Nỗi buồn chiến tranh (Trích - Bảo Ninh)", periods: 3 },
  { id: 5203, name: "Thực hành tiếng Việt. Biện pháp tu từ nói mỉa, nghịch ngữ. Đặc điểm và tác dụng", periods: 1 },
  { id: 5204, name: "Viết. Viết văn bản nghị luận so sánh, đánh giá hai tác phẩm truyện", periods: 2 },
  { id: 5205, name: "Nói và nghe. Trình bày kết quả so sánh, đánh giá hai tác phẩm truyện", periods: 1 },
  { id: 5206, name: "Đọc thực hành. Trên xuồng cứu nạn (Trích Cuộc đời của Pi - Yann Martel)", periods: 1 },
  { id: 5207, name: "Bài 2. Những thế giới thơ", periods: 11 },
  { id: 5208, name: "Đọc. Tri thức Ngữ văn; Cảm hoài (Nỗi lòng - Đặng Dung)", periods: 2 },
  { id: 5209, name: "Đọc. Tây Tiến (Quang Dũng)", periods: 2 },
  { id: 5210, name: "Đọc. Đàn Ghi-ta của Lor-ca (Thanh Thảo)", periods: 2 },
  { id: 5211, name: "Thực hành tiếng Việt. Tác dụng của một số biện pháp tu từ trong thơ", periods: 1 },
  { id: 5212, name: "Viết. Viết bài văn nghị luận so sánh, đánh giá hai tác phẩm thơ", periods: 2 },
  { id: 5213, name: "Nói và nghe. Trình bày kết quả so sánh, đánh giá hai tác phẩm thơ", periods: 1 },
  { id: 5214, name: "Đọc thực hành. Bài thơ số 28 (Rabindranath Tagore)", periods: 1 },
  { id: 5215, name: "Bài 3. Lập luận trong văn nghị luận", periods: 10 },
  { id: 5216, name: "Đọc. Nhìn về vốn văn hóa dân tộc (Trích - Trần Đình Hượu)", periods: 2 },
  { id: 5217, name: "Đọc. Năng lực sáng tạo (Trích - Phan Đình Diệu)", periods: 2 },
  { id: 5218, name: "Đọc. Mấy ý nghĩ về thơ (Trích - Nguyễn Đình Thi)", periods: 2 },
  { id: 5219, name: "Thực hành tiếng Việt. Lỗi logic, lỗi câu mơ hồ và cách sửa", periods: 1 },
  { id: 5220, name: "Viết. Viết bài văn nghị luận về một vấn đề liên quan đến tuổi trẻ (những hoài bão ước mơ)", periods: 2 },
  { id: 5221, name: "Nói và nghe. Thuyết minh về một vấn đề liên quan đến tuổi trẻ", periods: 1 },
  { id: 5222, name: "Đọc thực hành. Cảm hứng và sáng tạo (Trích - Nguyễn Trần Bạt)", periods: 1 },
  { id: 5223, name: "Bài 4. Yếu tố kì ảo trong truyện kể", periods: 9 },
  { id: 5224, name: "Đọc. Hải khẩu linh từ - Đền thiêng cửa biển (Trích - Đoàn Thị Điểm)", periods: 2 },
  { id: 5225, name: "Đọc. Muối của rừng (Trích - Nguyễn Huy Thiệp)", periods: 2 },
  { id: 5226, name: "Thực hành tiếng Việt. Nghệ thuật sử dụng điển cố trong tác phẩm văn học", periods: 1 },
  { id: 5227, name: "Viết. Viết bài văn nghị luận về việc vay mượn - cải biến - sáng tạo trong một tác phẩm văn học", periods: 2 },
  { id: 5228, name: "Nói và nghe. Trình bày việc vay mượn - cải biến - sáng tạo trong một tác phẩm văn học", periods: 1 },
  { id: 5229, name: "Đọc thực hành. Bến trần gian (Trích - Lưu Sơn Minh)", periods: 1 },
  { id: 5230, name: "Bài 5. Tiếng cười của hài kịch", periods: 9 },
  { id: 5231, name: "Đọc. Nhân vật quan trọng (Trích Quan thanh tra - Nikolai Gogol)", periods: 3 },
  { id: 5232, name: "Đọc. Giấu của (Trích Quẫn - Lộng Chương)", periods: 2 },
  { id: 5233, name: "Viết. Viết báo cáo nghiên cứu về một vấn đề tự nhiên, xã hội", periods: 2 },
  { id: 5234, name: "Nói và nghe. Trình bày báo cáo kết quả nghiên cứu tự nhiên, xã hội", periods: 1 },
  { id: 5235, name: "Đọc thực hành. Cẩn thận hão (Trích Thợ cạo thành Xê-vin - Beaumarchais)", periods: 1 },
  { id: 5236, name: "Bài 6. Hồ Chí Minh - \"Văn hóa phải soi đường cho quốc dân đi\"", periods: 12 },
  { id: 5237, name: "Đọc. Tác gia Hồ Chí Minh", periods: 2 },
  { id: 5238, name: "Đọc. Tuyên ngôn độc lập (Hồ Chí Minh)", periods: 2 },
  { id: 5239, name: "Đọc. Mộ (Chiều tối - Hồ Chí Minh)", periods: 1 },
  { id: 5240, name: "Đọc. Nguyên tiêu (Rằm tháng giêng - Hồ Chí Minh)", periods: 1 },
  { id: 5241, name: "Đọc. Những trò lố hay là Va-ren và Phan Bội Châu (Nguyễn Ái Quốc)", periods: 2 },
  { id: 5242, name: "Thực hành tiếng Việt. Một số biện pháp làm tăng tính khẳng định, phủ định trong văn bản nghị luận", periods: 1 },
  { id: 5243, name: "Viết. Viết báo cáo kết quả của bài tập dự án", periods: 2 },
  { id: 5244, name: "Nói và nghe. Trình bày kết quả của bài tập dự án", periods: 1 },
  { id: 5245, name: "Đọc thực hành. Vọng nguyệt (Ngắm trăng - Hồ Chí Minh); Cảnh khuya (Hồ Chí Minh)", periods: 1 },
  { id: 5246, name: "Bài 7. Sự thật trong tác phẩm kí", periods: 10 },
  { id: 5247, name: "Đọc. Tri thức ngữ văn; Nghệ thuật băm thịt gà (Trích Việc làng - Ngô Tất Tố)", periods: 3 },
  { id: 5248, name: "Đọc. Bước vào đời (Trích Nghĩ nhớ chiều hôm - Đào Duy Anh)", periods: 2 },
  { id: 5249, name: "Thực hành tiếng Việt. Ngôn ngữ trang trọng và ngôn ngữ thân mật", periods: 1 },
  { id: 5250, name: "Viết. Viết bài văn nghị luận về một vấn đề liên quan đến tuổi trẻ (Cách ứng xử về các mối quan hệ gia đình, xã hội)", periods: 2 },
  { id: 5251, name: "Nói và nghe. Trình bày một vấn đề liên quan đến tuổi trẻ (Cách ứng xử về các mối quan hệ gia đình, xã hội)", periods: 1 },
  { id: 5252, name: "Đọc thực hành. Vĩ tuyến 17 (Trích Gánh gánh. gồng gồng. - Xuân Phượng)", periods: 1 },
  { id: 5253, name: "Bài 8. Dữ liệu trong văn bản thông tin", periods: 12 },
  { id: 5254, name: "Đọc. Pa-ra-na (Trích Nhiệt đới buồn - Claude Lévi-Strauss)", periods: 2 },
  { id: 5255, name: "Đọc. Giáo dục khai phóng ở Việt Nam nhìn từ Đông Kinh Nghĩa Thục (Nguyễn Nam)", periods: 2 },
  { id: 5256, name: "Đọc. Đời Muối (Trích: Đời muối - Mark Kurlansky)", periods: 2 },
  { id: 5257, name: "Thực hành tiếng Việt. Tôn trọng và bảo vệ quyền sở hữu trí tuệ", periods: 1 },
  { id: 5258, name: "Viết. Viết thư trao đổi về công việc hoặc một vấn đề đáng quan tâm", periods: 2 },
  { id: 5259, name: "Nói và nghe. Tranh biện về một vấn đề trong đời sống", periods: 2 },
  { id: 5260, name: "Đọc thực hành. Sách thay đổi lịch sử loài người (Vũ Đức Liêm)", periods: 1 },
  { id: 5261, name: "Bài 9. Văn học và cuộc đời", periods: 11 },
  { id: 5262, name: "Đọc. Tri thức Ngữ văn; Vội Vàng (Xuân Diệu)", periods: 3 },
  { id: 5263, name: "Đọc. Trở về (Trích Ông già và biển cả - Ernest Hemingway)", periods: 2 },
  { id: 5264, name: "Đọc. Hồn Trương Ba, da hàng thịt (Trích - Lưu Quang Vũ)", periods: 2 },
  { id: 5265, name: "Thực hành tiếng Việt. Giữ gìn và phát triển tiếng Việt", periods: 1 },
  { id: 5266, name: "Viết. Viết bài phát biểu trong lễ phát động một phong trào hoặc một hoạt động xã hội", periods: 2 },
  { id: 5267, name: "Nói và nghe. Thuyết trình một vấn đề liên quan đến cơ hội và thách thức đối với đất nước", periods: 2 },
  { id: 5268, name: "Đọc thực hành. Khúc đồng quê (Trích Cô bé nhìn mưa - Đặng Thị Hạnh)", periods: 1 },
];


// ==================== Lịch sử ====================
const HISTORY_10_LESSONS = [
  { id: 8000, name: "Bài 1. Lịch sử hiện thực và nhận thức lịch sử 2 Tu ần 1,", periods: 2 },
  { id: 8001, name: "Bài 2. Tri thức lịch sử và cuộc sống", periods: 2 },
  { id: 8002, name: "Bài 3. Sử học v ới các l ĩnh v ực khoa học khác", periods: 2 },
  { id: 8003, name: "Bài 4. Sử học v ới m ột s ố l ĩnh v ực, ng ành nghề hiện đại 2 Tu ần 4,", periods: 2 },
  { id: 8004, name: "Bài 5. Khái niệm văn minh. M ột s ố n ền văn minh phương", periods: 2 },
  { id: 8005, name: "Bài 6. Một s ố n ền văn minh phương Tây thời kì cổ trung", periods: 2 },
  { id: 8006, name: "Bài 7. Các cuộc cách mạng công nghiệp thời kì cận đại 3 Tu ần 13, 14,", periods: 2 },
  { id: 8007, name: "Bài 8. Các cuộc cách mạng công nghiệp thời k ì hiện đại 1 Tu ần", periods: 2 },
  { id: 8008, name: "Bài 9. Cơ s ở hình thành văn minh Đông Nam Á thời kì cổ", periods: 2 },
  { id: 8009, name: "Bài 10. Hành trình phát tri ển và thành tựu văn minh Đông", periods: 2 },
  { id: 8010, name: "Bài 11. Một s ố n ền văn minh cổ trên đất nước Vi ệt Nam", periods: 2 },
  { id: 8011, name: "Bài 12. Văn minh Đại Vi ệt 7 Tu ần 26, 27,", periods: 2 },
  { id: 8012, name: "Bài 13. Đời sống v ật ch ất và tinh th ần c ủa c ộng đồ ng các", periods: 2 },
  { id: 8013, name: "Bài 14. Kh ối đại đoàn k ết dân tộc trong lịch sử Vi ệt Nam", periods: 2 },
];

const HISTORY_11_LESSONS = [
  { id: 8100, name: "Bài 1. Một s ố v ấn đề", periods: 2 },
  { id: 8101, name: "Bài 2. Sự xác lập và phát tri ển c ủa ch ủ nghĩa t ư b ản", periods: 2 },
  { id: 8102, name: "Bài 3. Sự hình thành Liên bang Cộng hoà xã h ội ch ủ", periods: 2 },
  { id: 8103, name: "Bài 4. Sự phát tri ển c ủa ch ủ nghĩa xã h ội t ừ sau Chiến", periods: 2 },
  { id: 8104, name: "Bài 5. Quá trình xâm lược và cai trị c ủa ch ủ nghĩa thực", periods: 2 },
  { id: 8105, name: "Bài 6. Hành trình đi đến độc lập dân tộc ở Đông Nam Á", periods: 3 },
  { id: 8106, name: "Bài 7. Chiến tranh bảo vệ T ổ quốc trong lịch sử Vi ệt", periods: 2 },
  { id: 8107, name: "Bài 8. Một s ố cuộc khởi nghĩa và chiến tranh giải phóng", periods: 2 },
  { id: 8108, name: "Bài 9. Cu ộc cải cách c ủa Hồ Quý Ly và triều Hồ ( đầu thế", periods: 2 },
  { id: 8109, name: "Bài 10. Cu ộc cải cách c ủa L ê Thánh Tông (thế kỉ XV)", periods: 2 },
  { id: 8110, name: "Bài 11. Cu ộc cải cách c ủa Minh M ạng (n ửa đầu thế kỉ", periods: 2 },
  { id: 8111, name: "Bài 12. Vị trí và t ầm quan tr ọng c ủa Bi ển Đông", periods: 2 },
  { id: 8112, name: "Bài 13. Vi ệt Nam và Bi ển Đông", periods: 4 },
];

const HISTORY_12_LESSONS = [
  { id: 8200, name: "Bài 1. Liên h ợp quốc", periods: 2 },
  { id: 8201, name: "Bài 2. Tr ật tự thế giới trong Chiến tranh l ạnh", periods: 2 },
  { id: 8202, name: "Bài 3. Tr ật tự thế giới sau Chiến tranh l ạnh", periods: 2 },
  { id: 8203, name: "Bài 4. Sự ra đời và phát tri ển c ủa Hi ệp h ội các quốc gia", periods: 2 },
  { id: 8204, name: "Bài 5. Cộng đồ ng ASEAN: T ừ ý t ưởng đế n hiện thực", periods: 2 },
  { id: 8205, name: "Bài 6. Cách mạng tháng Tám n ăm", periods: 2 },
  { id: 8206, name: "Bài 7. Cu ộc kháng chiến chống thực dân Pháp (1945 –", periods: 2 },
  { id: 8207, name: "Bài 8. Cu ộc kháng chiến chống M ỹ, c ứu nước (1954 –", periods: 2 },
  { id: 8208, name: "Bài 9. Đấu tranh bảo vệ T ổ quốc t ừ sau tháng 4 –", periods: 2 },
  { id: 8209, name: "Bài 10. Khái quát v ề công cuộc Đổ i mới ở Vi ệt Nam t ừ", periods: 2 },
  { id: 8210, name: "Bài 11. Thành tựu c ơ b ản và bài học c ủa công cuộc Đổ i", periods: 2 },
  { id: 8211, name: "Bài 12. Ho ạt độ ng đố i ngo ại c ủa Vi ệt Nam trong đấ u tranh", periods: 2 },
  { id: 8212, name: "Bài 13. Ho ạt độ ng đố i ngo ại c ủa Vi ệt Nam trong kháng", periods: 2 },
  { id: 8213, name: "Bài 14. Ho ạt độ ng đố i ngo ại c ủa Vi ệt Nam t ừ n ăm", periods: 2 },
  { id: 8214, name: "Bài 15. Khái quát cuộc đời và s ự nghiệp c ủa Hồ Chí Minh", periods: 2 },
  { id: 8215, name: "Bài 16. Hồ Chí Minh –", periods: 2 },
  { id: 8216, name: "Bài 17. Dấu ấn Hồ Chí Minh trong lòng nhân dân thế giới", periods: 2 },
];


export default function App() {
  const [mode, setMode] = useState<'integrate' | 'generate'>('generate');
  const [subject, setSubject] = useState('Ngữ văn');
  const [grade, setGrade] = useState('Lớp 10');
  const [selectedLesson, setSelectedLesson] = useState(LITERATURE_10_LESSONS[0]);
  const [periods, setPeriods] = useState(11);
  const [customPeriods, setCustomPeriods] = useState<number | null>(null);

  const effectivePeriods = customPeriods !== null ? customPeriods : periods;

  // Update selected lesson when grade or subject changes
  React.useEffect(() => {
    let lessons = [];
    if (subject === 'Ngữ văn') {
      if (grade === 'Lớp 10') lessons = LITERATURE_10_LESSONS;
      else if (grade === 'Lớp 11') lessons = LITERATURE_11_LESSONS;
      else if (grade === 'Lớp 12') lessons = LITERATURE_12_LESSONS;
    } else if (subject === 'Lịch sử') {
      if (grade === 'Lớp 10') lessons = HISTORY_10_LESSONS;
      else if (grade === 'Lớp 11') lessons = HISTORY_11_LESSONS;
      else if (grade === 'Lớp 12') lessons = HISTORY_12_LESSONS;
    } else if (subject === 'Địa lí') {
      if (grade === 'Lớp 10') lessons = GEOGRAPHY_10_LESSONS;
      else if (grade === 'Lớp 11') lessons = GEOGRAPHY_11_LESSONS;
      else if (grade === 'Lớp 12') lessons = GEOGRAPHY_12_LESSONS;
    } else if (subject === 'Giáo dục Kinh tế và Pháp luật') {
      if (grade === 'Lớp 10') lessons = KTPL_10_LESSONS;
      else if (grade === 'Lớp 11') lessons = KTPL_11_LESSONS;
      else if (grade === 'Lớp 12') lessons = KTPL_12_LESSONS;
    } else if (subject === 'Tiếng Anh') {
      if (grade === 'Lớp 10') lessons = ENGLISH_10_LESSONS;
      else if (grade === 'Lớp 11') lessons = ENGLISH_11_LESSONS;
      else if (grade === 'Lớp 12') lessons = ENGLISH_12_LESSONS;
    }
    
    if (lessons.length > 0) {
      setSelectedLesson(lessons[0]);
      setPeriods(lessons[0].periods);
      setCustomPeriods(null);
    }
  }, [grade, subject]);
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
    if (mode === 'integrate' && !file) {
      setError('Vui lòng tải lên tệp tin.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let integratedContent = '';

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
        integratedContent = await integrateNLS(text, subject, grade);
      } else {
        console.log("Starting lesson generation...");
        integratedContent = await generateLessonPlan(selectedLesson.name, effectivePeriods, subject, grade);
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
      const fileName = mode === 'integrate' && file ? file.name.split('.')[0] : selectedLesson.name;
      await generateDocx(result, fileName, effectivePeriods);
    }
  };

  const exportDesignSpecs = async () => {
    const specsContent = `
# I. QUY CHUẨN CẤU TRÚC KẾ HOẠCH BÀI DẠY (KHBD)
1. Cấu trúc tổng thể: Tuân thủ nghiêm ngặt Công văn 5512 với 4 mục chính:
- I. MỤC TIÊU (Kiến thức, Năng lực chung, Năng lực đặc thù, Năng lực số, Phẩm chất).
- II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU (Bao gồm học liệu số).
- III. TIẾN TRÌNH DẠY HỌC (Chi tiết các hoạt động).
- IV. CÁC PHIẾU HỌC TẬP (Nằm ở cuối tài liệu).

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
      <header className="bg-prof-blue-dark text-white px-10 py-5 shadow-md flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Biên soạn Kế hoạch Bài dạy (KHBD) Tích hợp NLS & Giáo dục AI</h1>
        <p className="text-[11px] opacity-80 uppercase tracking-widest mt-1 font-medium">
          Hệ thống tích hợp Năng lực số & Giáo dục AI — Theo TT 02/2025/TT-BGDĐT, CV 5512, Quyết định 3439/QĐ-BGDĐT & Công văn 8334/BGDĐT-GDPT
        </p>
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
              <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                <button 
                  onClick={() => { setMode('integrate'); setResult(null); }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                    mode === 'integrate' ? "bg-white shadow-sm text-prof-blue-primary" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Tích hợp file
                </button>
                <button 
                  onClick={() => { setMode('generate'); setResult(null); }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                    mode === 'generate' ? "bg-white shadow-sm text-prof-blue-primary" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Tạo mới KHBD
                </button>
              </div>

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
                      if (subject === 'Ngữ văn') {
                        if (grade === 'Lớp 10') lessons = LITERATURE_10_LESSONS;
                        else if (grade === 'Lớp 11') lessons = LITERATURE_11_LESSONS;
                        else if (grade === 'Lớp 12') lessons = LITERATURE_12_LESSONS;
                      } else if (subject === 'Ngữ văn') {
                        if (grade === 'Lớp 10') lessons = LITERATURE_10_LESSONS;
                        else if (grade === 'Lớp 11') lessons = LITERATURE_11_LESSONS;
                        else if (grade === 'Lớp 12') lessons = LITERATURE_12_LESSONS;
                      } else if (subject === 'Lịch sử') {
                        if (grade === 'Lớp 10') lessons = HISTORY_10_LESSONS;
                        else if (grade === 'Lớp 11') lessons = HISTORY_11_LESSONS;
                        else if (grade === 'Lớp 12') lessons = HISTORY_12_LESSONS;
                      } else if (subject === 'Địa lí') {
                        if (grade === 'Lớp 10') lessons = GEOGRAPHY_10_LESSONS;
                        else if (grade === 'Lớp 11') lessons = GEOGRAPHY_11_LESSONS;
                        else if (grade === 'Lớp 12') lessons = GEOGRAPHY_12_LESSONS;
                      } else if (subject === 'Giáo dục Kinh tế và Pháp luật') {
                        if (grade === 'Lớp 10') lessons = KTPL_10_LESSONS;
                        else if (grade === 'Lớp 11') lessons = KTPL_11_LESSONS;
                        else if (grade === 'Lớp 12') lessons = KTPL_12_LESSONS;
                      } else if (subject === 'Tiếng Anh') {
                        if (grade === 'Lớp 10') lessons = ENGLISH_10_LESSONS;
                        else if (grade === 'Lớp 11') lessons = ENGLISH_11_LESSONS;
                        else if (grade === 'Lớp 12') lessons = ENGLISH_12_LESSONS;
                      }
                      
                      const lesson = lessons.find(l => l.id === parseInt(e.target.value));
                      if (lesson) {
                        setSelectedLesson(lesson);
                        setPeriods(lesson.periods);
                        setCustomPeriods(null);
                      }
                    }}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:border-prof-blue-primary outline-none transition-all cursor-pointer appearance-none"
                  >
                    {subject === 'Ngữ văn' && grade === 'Lớp 10' && LITERATURE_10_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Ngữ văn' && grade === 'Lớp 11' && LITERATURE_11_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Ngữ văn' && grade === 'Lớp 12' && LITERATURE_12_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Lịch sử' && grade === 'Lớp 10' && HISTORY_10_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Lịch sử' && grade === 'Lớp 11' && HISTORY_11_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Lịch sử' && grade === 'Lớp 12' && HISTORY_12_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Địa lí' && grade === 'Lớp 10' && GEOGRAPHY_10_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Địa lí' && grade === 'Lớp 11' && GEOGRAPHY_11_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Địa lí' && grade === 'Lớp 12' && GEOGRAPHY_12_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Giáo dục Kinh tế và Pháp luật' && grade === 'Lớp 10' && KTPL_10_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Giáo dục Kinh tế và Pháp luật' && grade === 'Lớp 11' && KTPL_11_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Giáo dục Kinh tế và Pháp luật' && grade === 'Lớp 12' && KTPL_12_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Tiếng Anh' && grade === 'Lớp 10' && ENGLISH_10_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Tiếng Anh' && grade === 'Lớp 11' && ENGLISH_11_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {subject === 'Tiếng Anh' && grade === 'Lớp 12' && ENGLISH_12_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold text-prof-slate-label mb-2 uppercase tracking-wider">Số tiết thực hiện</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6].map((p) => (
                        <div
                          key={p}
                          className={cn(
                            "flex-1 py-2 rounded-lg border-2 font-bold text-sm text-center select-none",
                            periods === p 
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
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCustomPeriods(customPeriods === p ? null : p)}
                          className={cn(
                            "flex-1 py-2 rounded-lg border-2 transition-all font-bold text-sm cursor-pointer",
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
    </div>
  );
}
