const fs = require('fs');
let c = fs.readFileSync('src/app/actions.ts', 'utf8');

c = c.replace(/export async function uploadTool\(data: any\) \{[\s\S]*?return \{ success: true \};\n\}/, `export async function uploadTool(formData: FormData) {
  const type = formData.get('type') as string;
  const title = formData.get('title') as string;
  const category = formData.get('category') as string;
  let thumbnail = formData.get('thumbnail') as string;
  const file = formData.get('file') as File | null;
  let url = thumbnail;

  if (file && file.size > 0) {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.name) || '';
    const safeName = 'tool-' + Date.now() + ext;
    const filePath = path.join(uploadsDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    url = '/uploads/' + safeName;
    if (type === 'photo') {
      thumbnail = url;
    }
  }

  const uploadedAt = new Date().toISOString().split('T')[0];
  db_tools.push({ id: 'tool-' + Date.now(), uploadedAt, type, title, category, thumbnail, url });
  
  const { revalidatePath } = require('next/cache');
  revalidatePath('/super-admin');
  revalidatePath('/distributor');
  revalidatePath('/dist-sales');
  revalidatePath('/super-sales/[salesId]', 'page');
  return { success: true, toolUrl: url, thumbnail };
}`);

fs.writeFileSync('src/app/actions.ts', c);
