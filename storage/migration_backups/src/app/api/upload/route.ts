import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const templeId = formData.get('templeId') as string;
    const uploadType = formData.get('type') as string; // 'logo' or 'banner'

    if (!file || !templeId) {
      return NextResponse.json({ success: false, message: 'Missing file or templeId' }, { status: 400 });
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create target directory public/uploads/temples/[templeId]
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'temples', templeId);
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename to avoid caching issues
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${uploadType}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Write file to disk
    await fs.writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/temples/${templeId}/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
