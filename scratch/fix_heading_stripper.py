import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

service_path = r"c:\Users\ADMIN\Desktop\TICH HOP AI\KHBD-KHXH - NGU VAN\src\services\docxService.ts"

if not os.path.exists(service_path):
    print("docxService.ts not found")
    sys.exit(1)

with open(service_path, "r", encoding="utf-8") as f:
    content = f.read()

# Normalize line endings to LF during processing
original_endings = "\r\n" if "\r\n" in content else "\n"
content = content.replace("\r\n", "\n")

old_heading_block = """    // Detect markdown headings
    if (text.startsWith('# ')) {
      heading = HeadingLevel.HEADING_1 as "Heading1";
      text = text.replace(/^#+\s*/, '');
      contentPart = text;
      bold = true;
    } else if (text.startsWith('## ')) {
      heading = HeadingLevel.HEADING_2 as "Heading2";
      text = text.replace(/^#+\s*/, '');
      contentPart = text;
      bold = true;
    } else if (text.startsWith('### ')) {
      heading = HeadingLevel.HEADING_3 as "Heading3";
      text = text.replace(/^#+\s*/, '');
      contentPart = text;
      bold = true;
    } else if (text.startsWith('#### ')) {
      // Treating #### as bold section but not a word heading to keep text size consistent
      text = text.replace(/^#+\s*/, '');
      contentPart = text;
      bold = true;
    }"""

new_heading_block = """    // Detect markdown headings
    if (text.startsWith('#')) {
      const headingMatch = text.match(/^(#+)\s*(.*)/);
      if (headingMatch) {
        const hashes = headingMatch[1];
        const headingText = headingMatch[2];
        text = headingText;
        contentPart = headingText;
        bold = true;
        
        if (hashes.length === 1) {
          heading = HeadingLevel.HEADING_1 as "Heading1";
        } else if (hashes.length === 2) {
          heading = HeadingLevel.HEADING_2 as "Heading2";
        } else if (hashes.length === 3) {
          heading = HeadingLevel.HEADING_3 as "Heading3";
        }
      }
    }"""

if old_heading_block in content:
    content = content.replace(old_heading_block, new_heading_block)
    print("Successfully updated heading parser in docxService.ts")
else:
    print("Failed to find old heading block in docxService.ts")
    sys.exit(1)

# Restore original endings
if original_endings == "\r\n":
    content = content.replace("\n", "\r\n")

with open(service_path, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully!")
