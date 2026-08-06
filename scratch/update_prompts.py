import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

service_path = r"c:\Users\ADMIN\Desktop\TICH HOP AI\KHBD-KHXH - NGU VAN\src\services\geminiService.ts"

if not os.path.exists(service_path):
    print("geminiService.ts not found")
    sys.exit(1)

with open(service_path, "r", encoding="utf-8") as f:
    content = f.read()

# ----------------- REPLACE 1: integrateNLS -----------------
orig_integrate_start = 'export async function integrateNLS(content: string, subject: string, grade: string, modelName = "gemini-3.5-flash") {\n  if (!API_KEY) {'
new_integrate_start = '''export async function integrateNLS(content: string, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const isLiterature = subject === 'Ngữ văn';
  const assessmentInstruction = isLiterature ? "" : `
     4. Bổ sung mục "IV. KẾ HOẠCH ĐÁNH GIÁ":
        - Việc kiểm tra, đánh giá khi tích hợp AI tập trung vào các biểu hiện tư duy, thái độ và kỹ năng thực hành:
          * Kỹ năng tương tác, đặt câu hỏi (prompt) sâu sắc và hiệu quả cho AI.
          * Năng lực phân tích, nhận diện thiên kiến và kiểm chứng thông tin do AI cung cấp.
          * Khả năng lập luận, so sánh hợp lý giữa cách giải quyết của con người và máy móc.
          * Sự cẩn trọng, thái độ sử dụng AI có trách nhiệm, trung thực, biết trích dẫn nguồn và không sao chép máy móc.
  `;
  const luyenTapSection = isLiterature ? "IV. HOẠT ĐỘNG LUYỆN TẬP" : "V. HOẠT ĐỘNG LUYỆN TẬP";
  const vanDungSection = isLiterature ? "V. HOẠT ĐỘNG VẬN DỤNG" : "VI. HOẠT ĐỘNG VẬN DỤNG";'''

# We also need to strip out the 'throw new Error' check since we put it in new_integrate_start
# Let's search for the whole block of integrateNLS function start
# Let's see:
integrate_func_header = '''export async function integrateNLS(content: string, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const prompt = `'''

integrate_replaced_header = '''export async function integrateNLS(content: string, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const isLiterature = subject === 'Ngữ văn';
  const assessmentInstruction = isLiterature ? "" : `
     4. Bổ sung mục "IV. KẾ HOẠCH ĐÁNH GIÁ":
        - Việc kiểm tra, đánh giá khi tích hợp AI tập trung vào các biểu hiện tư duy, thái độ và kỹ năng thực hành:
          * Kỹ năng tương tác, đặt câu hỏi (prompt) sâu sắc và hiệu quả cho AI.
          * Năng lực phân tích, nhận diện thiên kiến và kiểm chứng thông tin do AI cung cấp.
          * Khả năng lập luận, so sánh hợp lý giữa cách giải quyết của con người và máy móc.
          * Sự cẩn trọng, thái độ sử dụng AI có trách nhiệm, trung thực, biết trích dẫn nguồn và không sao chép máy móc.
  `;
  const luyenTapSection = isLiterature ? "IV. HOẠT ĐỘNG LUYỆN TẬP" : "V. HOẠT ĐỘNG LUYỆN TẬP";
  const vanDungSection = isLiterature ? "V. HOẠT ĐỘNG VẬN DỤNG" : "VI. HOẠT ĐỘNG VẬN DỤNG";

  const prompt = `'''

if integrate_func_header in content:
    content = content.replace(integrate_func_header, integrate_replaced_header)
else:
    # Try with \r\n
    integrate_func_header_crlf = integrate_func_header.replace('\n', '\r\n')
    integrate_replaced_header_crlf = integrate_replaced_header.replace('\n', '\r\n')
    if integrate_func_header_crlf in content:
        content = content.replace(integrate_func_header_crlf, integrate_replaced_header_crlf)
    else:
        print("Could not find integrateNLS function header")
        sys.exit(1)

# Now replace the assessment block inside the prompt for integrateNLS
old_assessment_block = '''     4. Bổ sung mục "IV. KẾ HOẠCH ĐÁNH GIÁ":
        - Việc kiểm tra, đánh giá khi tích hợp AI tập trung vào các biểu hiện tư duy, thái độ và kỹ năng thực hành:
          * Kỹ năng tương tác, đặt câu hỏi (prompt) sâu sắc và hiệu quả cho AI.
          * Năng lực phân tích, nhận diện thiên kiến và kiểm chứng thông tin do AI cung cấp.
          * Khả năng lập luận, so sánh hợp lý giữa cách giải quyết của con người và máy móc.
          * Sự cẩn trọng, thái độ sử dụng AI có trách nhiệm, trung thực, biết trích dẫn nguồn và không sao chép máy móc.'''

new_assessment_block = '     ${assessmentInstruction}'

if old_assessment_block in content:
    content = content.replace(old_assessment_block, new_assessment_block)
else:
    old_assessment_block_crlf = old_assessment_block.replace('\n', '\r\n')
    new_assessment_block_crlf = new_assessment_block.replace('\n', '\r\n')
    if old_assessment_block_crlf in content:
        content = content.replace(old_assessment_block_crlf, new_assessment_block_crlf)
    else:
        print("Could not find old assessment block in integrateNLS")
        sys.exit(1)

# Replace the Luyen Tap / Van Dung section naming in integrateNLS prompt
old_luyen_tap_block = 'bắt buộc bổ sung/duy trì hai mục lớn "V. HOẠT ĐỘNG LUYỆN TẬP" và "VI. HOẠT ĐỘNG VẬN DỤNG" được thiết kế đầy đủ'
new_luyen_tap_block = 'bắt buộc bổ sung/duy trì hai mục lớn "${luyenTapSection}" và "${vanDungSection}" được thiết kế đầy đủ'

if old_luyen_tap_block in content:
    content = content.replace(old_luyen_tap_block, new_luyen_tap_block)
else:
    print("Could not find old luyen tap block in integrateNLS")
    sys.exit(1)


# ----------------- REPLACE 2: generateLessonPlan -----------------
gen_func_header = '''export async function generateLessonPlan(lessonName: string, periods: number, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const prompt = `'''

gen_replaced_header = '''export async function generateLessonPlan(lessonName: string, periods: number, subject: string, grade: string, modelName = "gemini-3.5-flash") {
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

  const prompt = `'''

if gen_func_header in content:
    content = content.replace(gen_func_header, gen_replaced_header)
else:
    gen_func_header_crlf = gen_func_header.replace('\n', '\r\n')
    gen_replaced_header_crlf = gen_replaced_header.replace('\n', '\r\n')
    if gen_func_header_crlf in content:
        content = content.replace(gen_func_header_crlf, gen_replaced_header_crlf)
    else:
        print("Could not find generateLessonPlan function header")
        sys.exit(1)

# Replace the assessment part and luyen tap part in generateLessonPlan prompt
old_gen_assessment_block = '''     IV. KẾ HOẠCH ĐÁNH GIÁ (nếu có)
     - Xây dựng tiêu chí đánh giá tích hợp AI: kỹ năng tương tác prompt, kiểm chứng dữ liệu, phản biện thiên kiến, thái độ chịu trách nhiệm và trích dẫn trung thực.
  
     V. HOẠT ĐỘNG LUYỆN TẬP'''

new_gen_assessment_block = '''     ${assessmentPromptPart}
  
     ${luyenTapHeader}'''

# Note: check space differences or CRLF
if old_gen_assessment_block in content:
    content = content.replace(old_gen_assessment_block, new_gen_assessment_block)
else:
    old_gen_assessment_block_crlf = old_gen_assessment_block.replace('\n', '\r\n')
    new_gen_assessment_block_crlf = new_gen_assessment_block.replace('\n', '\r\n')
    if old_gen_assessment_block_crlf in content:
        content = content.replace(old_gen_assessment_block_crlf, new_gen_assessment_block_crlf)
    else:
        # Let's try searching for a simpler segment to replace
        print("Could not find old gen assessment block, trying simpler search...")
        
        # Let's look for exactly the lines in generateLessonPlan:
        # IV. KẾ HOẠCH ĐÁNH GIÁ (nếu có)
        # - Xây dựng tiêu chí đánh giá tích hợp AI: kỹ năng tương tác prompt, kiểm chứng dữ liệu, phản biện thiên kiến, thái độ chịu trách nhiệm và trích dẫn trung thực.
        # 
        # V. HOẠT ĐỘNG LUYỆN TẬP
        # (check spaces)
        
        # Let's print out what is there
        idx = content.find("IV. KẾ HOẠCH ĐÁNH GIÁ (nếu có)")
        if idx != -1:
            print("Found 'IV. KẾ HOẠCH ĐÁNH GIÁ (nếu có)' at", idx)
            snippet = content[idx:idx+300]
            print("Snippet:")
            print(repr(snippet))
        sys.exit(1)

# Now replace VI and VII headers in generateLessonPlan prompt
content = content.replace("     VI. HOẠT ĐỘNG VẬN DỤNG", "     ${vanDungHeader}")
content = content.replace("     VII. CÁC PHIẾU HỌC TẬP", "     ${phieuHocTapHeader}")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement successful!")
