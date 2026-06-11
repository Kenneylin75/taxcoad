import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, context: { params: Promise<{ filename: string }> }) {
  const params = await context.params;
  // Extract filename safely
  const filename = Array.isArray(params?.filename) ? params.filename[0] : params?.filename;

  if (!filename) {
    return new NextResponse('Filename is required', { status: 400 });
  }

  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);

    // Basic mime type detection
    let contentType = 'application/octet-stream';
    const ext = path.extname(safeFilename).toLowerCase();
    
    if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.webm') contentType = 'video/webm';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.doc' || ext === '.docx') contentType = 'application/msword';
    else if (ext === '.zip') contentType = 'application/zip';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        // Inline allows previewing videos and images in browser instead of forcing download
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
