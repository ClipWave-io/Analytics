import { NextResponse } from 'next/server';
import { getFileBuffer } from '@/lib/s3';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runId = url.searchParams.get('run');
  const type = url.searchParams.get('type'); // 'keyframe' or 'scene'
  const file = url.searchParams.get('file');

  if (!runId || !type || !file) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  // Validate to prevent path traversal
  if (!/^[a-f0-9-]+$/.test(runId) || !/^[\w.]+$/.test(file)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const folder = type === 'keyframe' ? 'keyframes' : 'scenes';
  const key = `seedance/${runId}/${folder}/${file}`;
  const buffer = await getFileBuffer(key);

  if (!buffer) {
    return new NextResponse('Not found', { status: 404 });
  }

  const contentType = file.endsWith('.mp4') ? 'video/mp4' : 'image/png';
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
