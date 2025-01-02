import fs from 'fs';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { finished } from 'stream/promises';
import { Item } from 'wtcheap.shared';

import { MEDIA_PATH } from '../constants.js';
import { milliseconds } from '@fdebijl/pog';
import { clog } from '../index.js';
import { LOGLEVEL } from '@fdebijl/clog';

let processing = false;

const queue: { item: Item; prefix?: string }[] = [];
const processqueue = async () => {
  processing = true;

  while (queue.length) {
    const { item, prefix } = queue.shift()!;

    try {
      await storeMedia(item, prefix);
      await milliseconds(15_000);
    } catch (error) {
      clog.log(error, LOGLEVEL.WARN);

      await milliseconds(60_000);
      await storeMedia(item, prefix);
      await milliseconds(15_000);
    }
  }

  processing = false;
}

export const enqueueStoreMedia = async (item: Item, prefix?: string): Promise<void> => {
  queue.push({ item, prefix });

  if (queue.length === 1 && !processing) {
    processqueue();
  }

  return;
}

export const storeMedia = async (item: Item, prefix?: string): Promise<void> => {
  const path = `${MEDIA_PATH}/${item.id}`

  fs.mkdirSync(path, { recursive: true });

  if (item.poster) {
    const name = item.poster.split('/').pop();

    if (fs.existsSync(`${path}/${name}`)) {
      return;
    }

    const preflight = await fetch(`${prefix}${item.poster}`, { method: 'HEAD', referrer: item.href });
    const contentType = preflight.headers.get('content-type');

    if (!contentType?.includes('image') && !contentType?.includes('video')) {
      return;
    }


    const { body } = await fetch(`${prefix}${item.poster}`, { referrer: item.href });

    if (body) {
      const stream = fs.createWriteStream(`${path}/${name}`);
      await finished(Readable.fromWeb(body as ReadableStream).pipe(stream));
    }
  }

  if (item.details?.media?.length) {
    for (const media of item.details.media) {
      const name = media.split('/').pop();

      if (fs.existsSync(`${path}/${name}`)) {
        return;
      }

      const preflight = await fetch(`${prefix}${item.poster}`, { method: 'HEAD', referrer: item.href });
      const contentType = preflight.headers.get('content-type');

      if (!contentType?.includes('image') && !contentType?.includes('video')) {
        return;
      }


      const { body } = await fetch(`${prefix}${media}`, { referrer: item.href });

      if (body) {
        const stream = fs.createWriteStream(`${path}/${name}`);
        await finished(Readable.fromWeb(body as ReadableStream).pipe(stream));
      }
    }
  }
}
