import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Comprehensive MIME type map
const MIME_TYPES: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.m4v': 'video/x-m4v',
  '.ogv': 'video/ogg',
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.rtf': 'application/rtf',
  // Archives
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
};

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === '1';
    const customFilename = searchParams.get('filename') || '';

    const params = await context.params;
    const pathSegments = params?.path || [];

    if (pathSegments.length === 0) {
      return new NextResponse('Path is required', { status: 400 });
    }

    // Resolve base upload directory
    const uploadsBaseDir = path.resolve(process.cwd(), 'public', 'uploads');
    
    // Resolve target file path and prevent directory traversal
    const targetFilePath = path.resolve(uploadsBaseDir, ...pathSegments);

    if (!targetFilePath.startsWith(uploadsBaseDir)) {
      return new NextResponse('Forbidden: Invalid path', { status: 403 });
    }

    if (!fs.existsSync(targetFilePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const stat = fs.statSync(targetFilePath);
    if (stat.isDirectory()) {
      return new NextResponse('Forbidden: Path is a directory', { status: 403 });
    }

    const fileSize = stat.size;
    const ext = path.extname(targetFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const originalFileName = customFilename || path.basename(targetFilePath);
    const encodedFileName = encodeURIComponent(originalFileName);
    const asciiFileName = originalFileName.replace(/[^\x20-\x7E]/g, '_');

    const dispositionType = isDownload ? 'attachment' : 'inline';
    const disposition = `${dispositionType}; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`;

    // Handle HTTP Range Requests (206 Partial Content) for streaming media
    const range = request.headers.get('range');
    if (range && !isDownload) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(targetFilePath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunksize),
          'Content-Type': contentType,
          'Content-Disposition': disposition,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Standard Full File Response
    const fileBuffer = fs.readFileSync(targetFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Upload catch-all route error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
