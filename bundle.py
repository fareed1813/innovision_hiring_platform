import os
import base64
import re

base_dir = r"innovision-hiring"

def get_file_content(path):
    with open(os.path.join(base_dir, path), 'r', encoding='utf-8') as f:
        return f.read()

def get_binary_base64(path):
    with open(os.path.join(base_dir, path), 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

# Read index.html
html = get_file_content('index.html')

# Inline CSS
css = get_file_content('css/styles.css')
html = html.replace('<link rel="stylesheet" href="css/styles.css"/>', f'<style>\n{css}\n</style>')

# Inline JS
js_files = ['js/data.js', 'js/lenis.js', 'js/smooth.js', 'js/auth.js', 'js/candidate.js', 'js/admin.js', 'js/questionbank.js', 'js/app.js']
bundled_js = ""
for js_file in js_files:
    bundled_js += f"\n// --- {js_file} ---\n"
    bundled_js += get_file_content(js_file)

# Remove old script tags and insert bundled JS before </body>
for js_file in js_files:
    html = html.replace(f'<script src="{js_file}"></script>', '')

html = html.replace('</body>', f'<script>\n{bundled_js}\n</script>\n</body>')

# Inline Logo (Base64)
logo_b64 = get_binary_base64('assets/logo.png')
logo_data_uri = f"data:image/png;base64,{logo_b64}"
html = html.replace('href="assets/logo.png"', f'href="{logo_data_uri}"')
html = html.replace('src="assets/logo.png"', f'src="{logo_data_uri}"')

# Write portable file
with open(os.path.join(base_dir, 'portable-innovision.html'), 'w', encoding='utf-8') as f:
    f.write(html)

print("Portable version created: innovision-hiring/portable-innovision.html")
