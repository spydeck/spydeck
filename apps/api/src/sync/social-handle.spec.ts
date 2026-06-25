import {
  isUsername,
  normalizeHandle,
  youtubeProfileParams,
} from './social-handle';

describe('social-handle', () => {
  describe('isUsername', () => {
    it.each(['nateherk', '@nateherk', 'jane.doe', 'a_b-c', '@MrBeast'])(
      'accepts username %s',
      (v) => expect(isUsername(v)).toBe(true),
    );

    it.each([
      'https://www.youtube.com/@nateherk',
      'http://instagram.com/jane',
      'youtube.com/@x', // has a slash
      'jane doe', // whitespace
      '', // empty
    ])('rejects URL/invalid %s', (v) => expect(isUsername(v)).toBe(false));
  });

  describe('normalizeHandle', () => {
    it('strips a leading @ and trims', () => {
      expect(normalizeHandle('  @jane ')).toBe('jane');
      expect(normalizeHandle('jane')).toBe('jane');
    });
  });

  describe('youtubeProfileParams', () => {
    it('routes a channel id to channelId', () => {
      expect(youtubeProfileParams('UCX6OQ3DkcsbYNE6H8uQQuVA')).toEqual({
        channelId: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
      });
    });

    it('routes a name/@handle to handle with @', () => {
      expect(youtubeProfileParams('nateherk')).toEqual({ handle: '@nateherk' });
      expect(youtubeProfileParams('@nateherk')).toEqual({
        handle: '@nateherk',
      });
    });
  });
});
