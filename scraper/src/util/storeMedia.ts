import fs from 'fs';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { finished } from 'stream/promises';
import { Item } from 'wtcheap.shared';

import { MEDIA_PATH } from '../constants.js';

export const storeMedia = async (item: Item, prefix?: string): Promise<void> => {
  const path = `${MEDIA_PATH}/${item.id}`

  fs.mkdirSync(path, { recursive: true });

  if (item.poster) {
    const preflight = await fetch(`${prefix}${item.poster}`, { method: 'HEAD' });
    const contentType = preflight.headers.get('content-type');

    if (!contentType?.includes('image') && !contentType?.includes('video')) {
      return;
    }

    const name = item.poster.split('/').pop();

    const { body } = await fetch(`${prefix}${item.poster}`);

    if (body) {
      const stream = fs.createWriteStream(`${path}/${name}`);
      await finished(Readable.fromWeb(body as ReadableStream).pipe(stream));
    }
  }

  if (item.details?.media?.length) {
    for (const media of item.details.media) {
      const preflight = await fetch(`${prefix}${item.poster}`, { method: 'HEAD' });
      const contentType = preflight.headers.get('content-type');

      if (!contentType?.includes('image') && !contentType?.includes('video')) {
        return;
      }

      const name = media.split('/').pop();

      const { body } = await fetch(`${prefix}${media}`);

      if (body) {
        const stream = fs.createWriteStream(`${path}/${name}`);
        await finished(Readable.fromWeb(body as ReadableStream).pipe(stream));
      }
    }
  }
}
