import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

app_path = r"c:\Users\ADMIN\Desktop\TICH HOP AI\KHBD-KHXH - NGU VAN\src\App.tsx"

if not os.path.exists(app_path):
    print("App.tsx not found")
    sys.exit(1)

with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF during processing
original_endings = "\r\n" if "\r\n" in content else "\n"
content = content.replace("\r\n", "\n")

# 1. Delete top subject arrays (Geography, KTPL, English)
# We find: // ==================== Địa lí ====================
# and end right before: // ==================== Ngữ văn ====================
idx_geo = content.find("// ==================== Địa lí ====================")
if idx_geo == -1:
    print("Could not find '// ==================== Địa lí ===================='")
    sys.exit(1)

idx_lit = content.find("// ==================== Ngữ văn ====================")
if idx_lit == -1:
    print("Could not find '// ==================== Ngữ văn ===================='")
    sys.exit(1)

content = content[:idx_geo] + content[idx_lit:]
print("Successfully deleted Geography, KTPL, and English arrays from top")

# 2. Delete history arrays from bottom
# We find: // ==================== Lịch sử ====================
# and end right before: export default function App()
idx_his = content.find("// ==================== Lịch sử ====================")
if idx_his == -1:
    print("Could not find '// ==================== Lịch sử ===================='")
    sys.exit(1)

idx_app = content.find("export default function App()")
if idx_app == -1:
    print("Could not find 'export default function App()'")
    sys.exit(1)

content = content[:idx_his] + content[idx_app:]
print("Successfully deleted History arrays from bottom")

# 3. Simplify useEffect (selected lesson update handler)
old_use_effect = """  // Update selected lesson when grade or subject changes
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
  }, [grade, subject]);"""

new_use_effect = """  // Update selected lesson when grade changes
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
  }, [grade]);"""

if old_use_effect in content:
    content = content.replace(old_use_effect, new_use_effect)
    print("Successfully simplified useEffect hook")
else:
    # Let's try to find it by lines
    print("Failed to find exact old useEffect block, trying search...")
    idx_ue = content.find("React.useEffect(() => {\n    let lessons = [];\n    if (subject === 'Ngữ văn') {")
    if idx_ue != -1:
        print("Found hook at", idx_ue)
        # Find end of hook
        end_ue = content.find("}, [grade, subject]);", idx_ue)
        if end_ue != -1:
            content = content[:idx_ue] + new_use_effect + content[end_ue + len("}, [grade, subject]);"):]
            print("Successfully simplified useEffect hook via range search")
        else:
            print("Failed to find end of useEffect hook")
            sys.exit(1)
    else:
        print("Failed to find useEffect hook")
        sys.exit(1)

# 4. Simplify onChange handler in the JSX select tag
idx_oc = content.find("onChange={(e) => {\n                      let lessons = [];\n                      if (subject === 'Ngữ văn') {")
if idx_oc == -1:
    idx_oc = content.find("onChange={(e) => {\n                      let lessons = [];\n                      if (subject === 'Ngữ văn')")
if idx_oc == -1:
    print("Failed to find select onChange handler")
    sys.exit(1)

end_oc = content.find("className=\"w-full p-3 rounded-lg border border-slate-200 bg-slate-50", idx_oc)
if end_oc == -1:
    print("Failed to find classname marker after onChange handler")
    sys.exit(1)

# Look backwards from end_oc to find the closing "}}" of the onChange handler
close_oc = content.rfind("}}", idx_oc, end_oc)
if close_oc == -1:
    print("Failed to find closing }} for onChange handler")
    sys.exit(1)

new_onChange_code = """onChange={(e) => {
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
                    }}"""

content = content[:idx_oc] + new_onChange_code + content[close_oc + 2:]
print("Successfully simplified select onChange handler")

# 5. Simplify options mapping in select options
idx_opts_start = content.find("{subject === 'Ngữ văn' && grade === 'Lớp 10' && LITERATURE_10_LESSONS")
if idx_opts_start == -1:
    print("Failed to find options select list start")
    sys.exit(1)

idx_opts_end = content.find("ENGLISH_12_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}")
if idx_opts_end == -1:
    print("Failed to find options select list end")
    sys.exit(1)

# Find the end of option line
real_end = content.find("\n", idx_opts_end)

new_options_code = """{grade === 'Lớp 10' && LITERATURE_10_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {grade === 'Lớp 11' && LITERATURE_11_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {grade === 'Lớp 12' && LITERATURE_12_LESSONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}"""

content = content[:idx_opts_start] + new_options_code + content[real_end:]
print("Successfully simplified select option list rendering")

# Restore original endings
if original_endings == "\r\n":
    content = content.replace("\n", "\r\n")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)

print("All cleaning steps executed successfully!")
