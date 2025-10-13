import { DidlMusicTrack } from '../dist/didl/index.js';

console.log('Creating track with artist="Test Artist" and album="Test Album"');

const track = new DidlMusicTrack({
  title: 'Test Song',
  parentId: '1',
  itemId: '123',
  artist: 'Test Artist',
  album: 'Test Album',
});

console.log('\n=== After construction ===');
console.log('Title:', track.title);
console.log('Artist:', track.artist);
console.log('Album:', track.album);

// Check if properties exist
console.log('\n=== Property check ===');
console.log(
  'track.hasOwnProperty("artist"):',
  Object.prototype.hasOwnProperty.call(track, 'artist')
);
console.log('track.hasOwnProperty("album"):', Object.prototype.hasOwnProperty.call(track, 'album'));

// Get property descriptor
console.log('\n=== Property descriptors ===');
console.log('artist descriptor:', Object.getOwnPropertyDescriptor(track, 'artist'));
console.log('album descriptor:', Object.getOwnPropertyDescriptor(track, 'album'));

console.log('\n=== Translation ===');
console.log('Translation keys:', Object.keys(track.getTranslation()));
console.log('Has artist in translation:', 'artist' in track.getTranslation());

console.log('\n=== toDict output ===');
console.log(JSON.stringify(track.toDict(), null, 2));
