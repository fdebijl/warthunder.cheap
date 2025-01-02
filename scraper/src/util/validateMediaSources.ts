import { LOGLEVEL } from '@fdebijl/clog';

import { clog } from '../index.js';

export const validateMediaSources = async (media: string[]): Promise<string[]> => {
  const validatedMedia = [];

  for (const source of media) {
    let fixedSource = source;

    if (source.startsWith('/')) {
      fixedSource = `https://static-store.gaijin.net${source}`;
    }

    try {
      const response = await fetch(fixedSource, { method: 'HEAD' });
      if (response.ok) {
        validatedMedia.push(fixedSource);
      } else {
        clog.log(`Source ${fixedSource} returned ${response.status}, removing`, LOGLEVEL.DEBUG);
      }
    } catch (e) {
      clog.log(`Error fetching source ${fixedSource}: ${e}`, LOGLEVEL.ERROR);
    }
  }

  return validatedMedia;
};
