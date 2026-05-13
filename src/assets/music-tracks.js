import trackNames from './trakc-names.json';

const trackModules = import.meta.glob('/public/audio/tracks/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default'
});

const TRACK_KEY_ALIASES = {
  trarck2: 'track2'
};

const getTrackKey = (path) => {
  const fileName = path.split('/').pop() || '';
  return fileName.replace(/\.[^.]+$/, '');
};

const humanizeTrackKey = (key) => key
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getTrackSortValue = (key) => {
  const match = key.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
};

export const musicTracks = Object.entries(trackModules)
  .map(([path, url]) => {
    const key = getTrackKey(path);
    const displayKey = TRACK_KEY_ALIASES[key] || key;

    return {
      id: key,
      title: trackNames[displayKey] || humanizeTrackKey(displayKey),
      src: url
    };
  })
  .sort((a, b) => getTrackSortValue(a.id) - getTrackSortValue(b.id) || a.title.localeCompare(b.title));
