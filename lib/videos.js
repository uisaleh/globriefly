import fs from 'node:fs';
import path from 'node:path';

// Videos collected by the agent from official news channels (see agent/videos.mjs).
export function getVideos(limit = 24) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'videos.json'), 'utf8'));
    return (data.videos || []).slice(0, limit);
  } catch {
    return [];
  }
}
