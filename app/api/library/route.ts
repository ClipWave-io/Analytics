import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { listRunFiles, listAllRunIds } from '@/lib/s3';

export async function GET() {
  try {
    // Get all runs from DB with user info
    const runs = await query(`
      SELECT ro.run_id, ro.user_id, ro.status, ro.source, ro.product_description,
             ro.video_format, ro.duration_target, ro.created_at,
             u.email, u.name as username
      FROM run_ownership ro
      LEFT JOIN users u ON ro.user_id = u.id
      ORDER BY ro.created_at DESC
    `);

    // Get all run IDs that have files in S3
    const s3RunIds = new Set(await listAllRunIds());

    // For each run, list its S3 files
    const results = await Promise.all(
      runs.rows.map(async (run: any) => {
        const hasFiles = s3RunIds.has(run.run_id);
        let keyframes: string[] = [];
        let scenes: string[] = [];

        if (hasFiles) {
          const files = await listRunFiles(run.run_id);
          keyframes = files
            .filter(f => f.key.includes('/keyframes/') && f.key.endsWith('.png'))
            .map(f => f.key.split('/').pop()!)
            .sort();
          scenes = files
            .filter(f => f.key.includes('/scenes/') && f.key.endsWith('.mp4'))
            .map(f => f.key.split('/').pop()!)
            .sort();
        }

        return {
          runId: run.run_id,
          userId: run.user_id,
          email: run.email || null,
          username: run.username || null,
          status: run.status,
          source: run.source,
          description: run.product_description || '',
          format: run.video_format,
          duration: run.duration_target,
          createdAt: run.created_at,
          hasFiles,
          keyframes,
          scenes,
        };
      })
    );

    return NextResponse.json(results);
  } catch (err: any) {
    console.error('[library]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
