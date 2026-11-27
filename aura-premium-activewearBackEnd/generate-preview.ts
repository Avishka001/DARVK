import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const b64 = fs.readFileSync(path.join(__dirname, 'logo_b64.txt'), 'utf8').trim();
const logoSrc = `data:image/png;base64,${b64}`;

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Logo Preview</title></head>
<body style="background:#f9fafb;margin:0;padding:40px;font-family:sans-serif;">
  <h2 style="color:#111;">Email Logo Preview — on dark header background:</h2>
  <div style="background:#050505;padding:28px 40px;text-align:center;border-radius:8px;max-width:500px;">
    <img src="${logoSrc}" alt="DARVK Premium Activewear" width="180" 
         style="display:block;margin:0 auto;max-width:180px;height:auto;" />
    <p style="margin:8px 0 0 0;color:#9ca3af;font-size:11px;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;">
      Premium Activewear
    </p>
  </div>
  <p style="color:green;margin-top:20px;"><strong>✅ If you see the DARVK logo above on black background — it's working!</strong></p>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'logo_test_preview.html'), html, 'utf8');
console.log('✅ Preview saved: logo_test_preview.html');
