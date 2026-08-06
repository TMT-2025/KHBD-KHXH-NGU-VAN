import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

service_path = r"c:\Users\ADMIN\Desktop\TICH HOP AI\KHBD-KHXH - NGU VAN\src\services\geminiService.ts"

if not os.path.exists(service_path):
    print("geminiService.ts not found")
    sys.exit(1)

with open(service_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to avoid CRLF vs LF issues during search
original_endings = "\r\n" if "\r\n" in content else "\n"
content = content.replace("\r\n", "\n")

# 1. Modify prompt content in integrateNLS
old_integrate_prompt_assess = """     4. Bổ sung mục "IV. KẾ HOẠCH ĐÁNH GIÁ":
        - Việc kiểm tra, đánh giá khi tích hợp AI tập trung vào các biểu hiện tư duy, thái độ và kỹ năng thực hành:
          * Kỹ năng tương tác, đặt câu hỏi (prompt) sâu sắc và hiệu quả cho AI.
          * Năng lực phân tích, nhận diện thiên kiến và kiểm chứng thông tin do AI cung cấp.
          * Khả năng lập luận, so sánh hợp lý giữa cách giải quyết của con người và máy móc.
          * Sự cẩn trọng, thái độ sử dụng AI có trách nhiệm, trung thực, biết trích dẫn nguồn và không sao chép máy móc."""

new_integrate_prompt_assess = "     ${assessmentInstruction}"

if old_integrate_prompt_assess in content:
    content = content.replace(old_integrate_prompt_assess, new_integrate_prompt_assess)
    print("Successfully replaced integrateNLS assessment block")
else:
    print("Failed to find old integrateNLS assessment block")
    sys.exit(1)

old_integrate_luyen_tap = 'bắt buộc bổ sung/duy trì hai mục lớn "V. HOẠT ĐỘNG LUYỆN TẬP" và "VI. HOẠT ĐỘNG VẬN DỤNG" được thiết kế đầy đủ'
new_integrate_luyen_tap = 'bắt buộc bổ sung/duy trì hai mục lớn "${luyenTapSection}" và "${vanDungSection}" được thiết kế đầy đủ'

if old_integrate_luyen_tap in content:
    content = content.replace(old_integrate_luyen_tap, new_integrate_luyen_tap)
    print("Successfully replaced integrateNLS luyen tap / van dung text")
else:
    print("Failed to find old integrateNLS luyen tap block")
    sys.exit(1)


# 2. Modify prompt content in generateLessonPlan
old_gen_assess = """    IV. KẾ HOẠCH ĐÁNH GIÁ (nếu có)
    - Xây dựng tiêu chí đánh giá tích hợp AI: kỹ năng tương tác prompt, kiểm chứng dữ liệu, phản biện thiên kiến, thái độ chịu trách nhiệm và trích dẫn trung thực."""

new_gen_assess = "    ${assessmentPromptPart}"

if old_gen_assess in content:
    content = content.replace(old_gen_assess, new_gen_assess)
    print("Successfully replaced generateLessonPlan assessment block")
else:
    print("Failed to find old generateLessonPlan assessment block")
    sys.exit(1)

content = content.replace("    V. HOẠT ĐỘNG LUYỆN TẬP", "    ${luyenTapHeader}")
content = content.replace("    VI. HOẠT ĐỘNG VẬN DỤNG", "    ${vanDungHeader}")
content = content.replace("    VII. CÁC PHIẾU HỌC TẬP", "    ${phieuHocTapHeader}")
print("Successfully replaced generateLessonPlan header templates")


# 3. Replace function headers to inject variables
old_integrate_header = """export async function integrateNLS(content: string, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

  const prompt = `"""

new_integrate_header = """export async function integrateNLS(content: string, subject: string, grade: string, modelName = "gemini-3.5-flash") {
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

  const prompt = `"""

if old_integrate_header in content:
    content = content.replace(old_integrate_header, new_integrate_header)
    print("Successfully replaced integrateNLS header")
else:
    print("Failed to find integrateNLS header")
    sys.exit(1)

old_gen_header = """export async function generateLessonPlan(lessonName: string, periods: number, subject: string, grade: string, modelName = "gemini-3.5-flash") {
  if (!API_KEY) {
    throw new Error("API Key không tồn tại. Vui lòng kiểm tra cấu hình.");
  }

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

  const prompt = `"""

if old_gen_header in content:
    content = content.replace(old_gen_header, new_gen_header)
    print("Successfully replaced generateLessonPlan header")
else:
    print("Failed to find generateLessonPlan header")
    sys.exit(1)

# Restore original endings
if original_endings == "\r\n":
    content = content.replace("\n", "\r\n")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("All replacements executed successfully!")
