import { Logger, NotFoundException } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProfileExtractProcessor } from './profile-extract.processor';
import type { ProfileExtractPayload } from './profile-extract.processor';
import { AuthorsService } from '../authors/authors.service';
import { ScrapeCreatorsService } from '../scrapecreators/scrapecreators.service';

type Social = { value: string; synchronize: boolean };

/**
 * Chainable Drizzle mock covering exactly what the processor calls:
 *   insert(t).values(v).onConflictDoUpdate(c).returning(cols)  -> [{ id }]
 *   insert(t).values(rows)                                      -> awaited (links)
 *   delete(t).where(cond)                                       -> awaited
 */
function makeDb(profileId = 'profile-1') {
  const returning = jest.fn().mockResolvedValue([{ id: profileId }]);
  const onConflictDoUpdate = jest.fn(() => ({ returning }));
  // values() is awaitable (links insert) AND chainable (profile upsert).
  const values = jest.fn((..._args: unknown[]) => ({
    onConflictDoUpdate,
    then: (resolve: (v: unknown) => unknown) => resolve(undefined),
  }));
  const insert = jest.fn(() => ({ values }));
  const where = jest.fn().mockResolvedValue(undefined);
  const del = jest.fn(() => ({ where }));
  return {
    db: { insert, delete: del } as any,
    spies: { insert, values, onConflictDoUpdate, returning, del, where },
  };
}

function makeAuthor(socials: Record<string, Social>, name = 'Jane') {
  return { id: 'author-1', name, socials };
}

function jobFor(data: ProfileExtractPayload): Job<ProfileExtractPayload> {
  return { id: 'job-1', data } as unknown as Job<ProfileExtractPayload>;
}

describe('ProfileExtractProcessor', () => {
  let authors: { findOne: jest.Mock };
  let scrape: jest.Mocked<
    Pick<
      ScrapeCreatorsService,
      'tiktokProfile' | 'instagramProfile' | 'youtubeChannel' | 'twitterProfile'
    >
  >;

  beforeAll(() => {
    // Silence expected error/log noise from the catch block.
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  // Default fetch mock: returns a small valid JPEG so avatar embedding succeeds.
  const fakeImageBuf = Buffer.from('fakejpeg');
  const mockFetchOk = () =>
    jest.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (h: string) =>
          h === 'content-type' ? 'image/jpeg' : h === 'content-length' ? String(fakeImageBuf.length) : null,
      },
      arrayBuffer: () => Promise.resolve(fakeImageBuf.buffer),
    });

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = mockFetchOk() as any;

    authors = { findOne: jest.fn() };
    scrape = {
      tiktokProfile: jest.fn(),
      instagramProfile: jest.fn(),
      youtubeChannel: jest.fn(),
      twitterProfile: jest.fn(),
    } as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function build(db: any) {
    return new ProfileExtractProcessor(
      authors as unknown as AuthorsService,
      scrape as unknown as ScrapeCreatorsService,
      db,
    );
  }

  it('extracts a TikTok profile and upserts normalized columns', async () => {
    authors.findOne.mockResolvedValue(
      makeAuthor({ tiktok: { value: 'jane', synchronize: true } }),
    );
    scrape.tiktokProfile.mockResolvedValue({
      user: {
        id: '123',
        nickname: 'Jane T',
        avatarLarger: 'https://cdn/avatar.jpg',
        signature: 'hello',
        bioLink: { link: 'https://jane.co' },
        verified: true,
      },
      stats: {
        followerCount: 1000,
        followingCount: 50,
        heart: 9999,
        videoCount: 42,
      },
    } as any);

    const { db, spies } = makeDb();
    const result = await build(db).process(
      jobFor({ authorId: 'author-1', platform: 'tiktok' }),
    );

    expect(scrape.tiktokProfile).toHaveBeenCalledWith({ handle: 'jane' });
    // Mapped values land in the upsert payload.
    const upsertValues = spies.values.mock.calls[0][0];
    expect(upsertValues).toMatchObject({
      authorId: 'author-1',
      platform: 'tiktok',
      handle: 'jane',
      platformId: '123',
      displayName: 'Jane T',
      followerCount: 1000,
      tiktokLikeCount: 9999,
      tiktokVideoCount: 42,
      verified: true,
    });
    // TikTok has no links -> no delete/link insert.
    expect(spies.del).not.toHaveBeenCalled();
    expect(spies.insert).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ platform: 'tiktok', handle: 'jane' });
  });

  it('extracts an Instagram profile and replaces bio links', async () => {
    authors.findOne.mockResolvedValue(
      makeAuthor({ instagram: { value: 'jane_ig', synchronize: true } }),
    );
    scrape.instagramProfile.mockResolvedValue({
      data: {
        user: {
          id: 'ig1',
          full_name: 'Jane IG',
          biography: 'bio',
          is_verified: false,
          edge_followed_by: { count: 200 },
          edge_follow: { count: 10 },
          bio_links: [
            { url: 'https://a.com', title: 'A' },
            { url: 'https://b.com' },
            { url: '' }, // dropped
          ],
        },
      },
    } as any);

    const { db, spies } = makeDb();
    await build(db).process(jobFor({ authorId: 'author-1' }));

    expect(scrape.instagramProfile).toHaveBeenCalledWith({ handle: 'jane_ig' });
    // delete old links, then insert the two valid ones.
    expect(spies.del).toHaveBeenCalledTimes(1);
    const linkRows = spies.values.mock.calls[1][0];
    expect(linkRows).toEqual([
      { profileId: 'profile-1', url: 'https://a.com', title: 'A', sortOrder: 0 },
      {
        profileId: 'profile-1',
        url: 'https://b.com',
        title: null,
        sortOrder: 1,
      },
    ]);
  });

  it('maps YouTube nested avatar + links', async () => {
    authors.findOne.mockResolvedValue(
      makeAuthor({ youtube: { value: 'janetube', synchronize: true } }),
    );
    scrape.youtubeChannel.mockResolvedValue({
      channelId: 'UC123',
      name: 'Jane Tube',
      description: 'desc',
      subscriberCount: 5000,
      avatar: { image: { sources: [{ url: 'https://yt/a.jpg' }] } },
      links: ['https://l1.com'],
    } as any);

    const { db, spies } = makeDb();
    await build(db).process(jobFor({ authorId: 'author-1', platform: 'youtube' }));

    const v = spies.values.mock.calls[0][0];
    expect(v).toMatchObject({
      platformId: 'UC123',
      displayName: 'Jane Tube',
      followerCount: 5000,
    });
    // avatarUrl is now a data URI (embedded by toAvatarDataUri).
    expect(v.avatarUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(spies.values.mock.calls[1][0]).toEqual([
      { profileId: 'profile-1', url: 'https://l1.com', title: null, sortOrder: 0 },
    ]);
  });

  it('maps X/Twitter legacy fields', async () => {
    authors.findOne.mockResolvedValue(
      makeAuthor({ x: { value: 'jane_x', synchronize: true } }),
    );
    scrape.twitterProfile.mockResolvedValue({
      rest_id: 'x99',
      is_blue_verified: true,
      legacy: {
        name: 'Jane X',
        profile_image_url_https: 'https://x/a.jpg',
        description: 'tweets',
        followers_count: 300,
        friends_count: 20,
        location: 'NYC',
        statuses_count: 1234,
      },
    } as any);

    const { db, spies } = makeDb();
    await build(db).process(jobFor({ authorId: 'author-1', platform: 'x' }));

    expect(spies.values.mock.calls[0][0]).toMatchObject({
      platformId: 'x99',
      displayName: 'Jane X',
      verified: true,
      followerCount: 300,
      xLocation: 'NYC',
      xTweetCount: 1234,
    });
  });

  it('auto-selects the first synchronized social when no platform given', async () => {
    authors.findOne.mockResolvedValue(
      makeAuthor({
        facebook: { value: 'fb', synchronize: false },
        tiktok: { value: 'jane_tt', synchronize: true },
      }),
    );
    scrape.tiktokProfile.mockResolvedValue({ user: {}, stats: {} } as any);

    const { db } = makeDb();
    const result = await build(db).process(jobFor({ authorId: 'author-1' }));

    expect(scrape.tiktokProfile).toHaveBeenCalledWith({ handle: 'jane_tt' });
    expect(result).toMatchObject({ platform: 'tiktok' });
  });

  it('throws NotFoundException when the author has no socials', async () => {
    authors.findOne.mockResolvedValue(makeAuthor({}));
    const { db } = makeDb();
    await expect(
      build(db).process(jobFor({ authorId: 'author-1' })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an unsupported platform', async () => {
    authors.findOne.mockResolvedValue(
      makeAuthor({ facebook: { value: 'fb', synchronize: true } }),
    );
    const { db } = makeDb();
    await expect(
      build(db).process(jobFor({ authorId: 'author-1' })),
    ).rejects.toThrow(/Unsupported platform 'facebook'/);
  });

  it('embeds avatar as data URI when fetch returns an OK image', async () => {
    authors.findOne.mockResolvedValue(
      makeAuthor({ tiktok: { value: 'jane', synchronize: true } }),
    );
    scrape.tiktokProfile.mockResolvedValue({
      user: {
        id: '1',
        nickname: 'Jane',
        avatarLarger: 'https://cdn/avatar.jpg',
      },
      stats: {},
    } as any);

    const { db, spies } = makeDb();
    await build(db).process(jobFor({ authorId: 'author-1', platform: 'tiktok' }));

    const upsertValues = spies.values.mock.calls[0][0];
    expect(upsertValues.avatarUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('keeps original avatarUrl (non-fatal) when avatar fetch fails', async () => {
    authors.findOne.mockResolvedValue(
      makeAuthor({ tiktok: { value: 'jane', synchronize: true } }),
    );
    scrape.tiktokProfile.mockResolvedValue({
      user: {
        id: '1',
        nickname: 'Jane',
        avatarLarger: 'https://cdn/avatar.jpg',
      },
      stats: {},
    } as any);
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;

    const { db, spies } = makeDb();
    // Job must complete without throwing.
    await expect(
      build(db).process(jobFor({ authorId: 'author-1', platform: 'tiktok' })),
    ).resolves.toBeDefined();

    // Falls back to original URL.
    const upsertValues = spies.values.mock.calls[0][0];
    expect(upsertValues.avatarUrl).toBe('https://cdn/avatar.jpg');
  });

  it('logs and rethrows when the ScrapeCreators fetch fails', async () => {
    authors.findOne.mockResolvedValue(
      makeAuthor({ tiktok: { value: 'jane', synchronize: true } }),
    );
    const boom = new Error('upstream 500');
    scrape.tiktokProfile.mockRejectedValue(boom);
    const errorSpy = jest.spyOn(Logger.prototype, 'error');

    const { db, spies } = makeDb();
    await expect(
      build(db).process(jobFor({ authorId: 'author-1', platform: 'tiktok' })),
    ).rejects.toBe(boom);

    expect(spies.insert).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
