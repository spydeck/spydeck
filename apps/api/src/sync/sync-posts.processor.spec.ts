import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SyncPostsProcessor } from './sync-posts.processor';
import type { SyncPostsPayload } from './sync-posts.processor';
import { AuthorsService } from '../authors/authors.service';
import { ScrapeCreatorsService } from '../scrapecreators/scrapecreators.service';
import { SyncService } from './sync.service';

type Social = { value: string; synchronize: boolean };

/**
 * Chainable Drizzle mock covering what the processor calls:
 *   select({ count }).from(posts).where(cond)  -> [{ count: N }]
 *   insert(posts).values(rows)                 -> awaited
 */
function makeDb(existingCount = 0) {
  // select chain: select().from().where() -> [{ count }]
  const where = jest.fn().mockResolvedValue([{ count: existingCount }]);
  const from = jest.fn(() => ({ where }));
  const select = jest.fn(() => ({ from }));

  // insert chain: insert().values() -> awaited (no .returning needed)
  const insertValues = jest.fn().mockResolvedValue(undefined);
  const insert = jest.fn(() => ({ values: insertValues }));

  return {
    db: { select, insert } as any,
    spies: { select, from, where, insert, insertValues },
  };
}

function makeAuthor(socials: Record<string, Social>, name = 'Jane') {
  return { id: 'author-1', name, socials };
}

function jobFor(data: SyncPostsPayload): Job<SyncPostsPayload> {
  return { id: 'job-1', data } as unknown as Job<SyncPostsPayload>;
}

// Minimal TikTok response with two items
const tiktokResponse = {
  itemList: [
    {
      desc: 'My first video',
      createTime: 1700000000,
      stats: { diggCount: 100, commentCount: 10, playCount: 1000, shareCount: 5 },
      video: { cover: 'https://cdn/cover1.jpg' },
    },
    {
      desc: 'My second video',
      createTime: 1700100000,
      stats: { diggCount: 200, commentCount: 20, playCount: 2000, shareCount: 10 },
      video: { cover: 'https://cdn/cover2.jpg' },
    },
  ],
};

// Minimal Instagram response
const instagramResponse = {
  data: {
    user: {
      edge_owner_to_timeline_media: {
        edges: [
          {
            node: {
              edge_media_to_caption: { edges: [{ node: { text: 'IG caption' } }] },
              taken_at_timestamp: 1700000000,
              thumbnail_src: 'https://cdn/ig.jpg',
              edge_liked_by: { count: 50 },
              edge_media_to_comment: { count: 5 },
              video_view_count: 0,
            },
          },
        ],
      },
    },
  },
};

// Minimal YouTube response
const youtubeResponse = {
  items: [
    {
      snippet: {
        title: 'My YT Video',
        publishedAt: '2023-11-15T00:00:00Z',
        thumbnails: { default: { url: 'https://cdn/yt.jpg' } },
      },
      statistics: { viewCount: '5000', likeCount: '300', commentCount: '25' },
    },
  ],
};

// Minimal Twitter response
const twitterResponse = {
  data: {
    timeline_v2: {
      timeline: {
        instructions: [
          {
            entries: [
              {
                content: {
                  itemContent: {
                    tweet_results: {
                      result: {
                        legacy: {
                          full_text: 'Hello twitter',
                          created_at: 'Wed Nov 15 00:00:00 +0000 2023',
                          favorite_count: 42,
                          reply_count: 3,
                          retweet_count: 7,
                        },
                        views: { count: '1000' },
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    },
  },
};

describe('SyncPostsProcessor', () => {
  let scrape: jest.Mocked<
    Pick<
      ScrapeCreatorsService,
      | 'tiktokProfileVideos'
      | 'instagramPosts'
      | 'youtubeChannelVideos'
      | 'twitterTweets'
    >
  >;
  let authorsMock: { findOne: jest.Mock };
  let syncMock: { getSyncConfig: jest.Mock };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    scrape = {
      tiktokProfileVideos: jest.fn(),
      instagramPosts: jest.fn(),
      youtubeChannelVideos: jest.fn(),
      twitterTweets: jest.fn(),
    } as any;
    authorsMock = { findOne: jest.fn() };
    syncMock = { getSyncConfig: jest.fn().mockResolvedValue(undefined) };
  });

  function build(db: any) {
    return new SyncPostsProcessor(
      authorsMock as unknown as AuthorsService,
      scrape as unknown as ScrapeCreatorsService,
      syncMock as unknown as SyncService,
      db,
    );
  }

  it('first sync with no config → fetches and inserts up to 9 tiktok posts', async () => {
    const { db, spies } = makeDb(0);
    authorsMock.findOne.mockResolvedValue(
      makeAuthor({ tiktok: { value: 'janedoe', synchronize: true } }),
    );
    scrape.tiktokProfileVideos.mockResolvedValue(tiktokResponse);

    const processor = build(db);
    await processor.process(jobFor({ authorId: 'author-1' }));

    expect(scrape.tiktokProfileVideos).toHaveBeenCalledWith({ handle: 'janedoe' });
    expect(spies.insertValues).toHaveBeenCalledTimes(1);
    const rows = spies.insertValues.mock.calls[0][0];
    // 2 items in fixture, both fit within DEFAULT_POST_COUNT=9
    expect(rows).toHaveLength(2);
    expect(rows[0].platform).toBe('tiktok');
    expect(rows[0].text).toBe('My first video');
    expect(rows[0].engagement.likes).toBe(100);
    expect(rows[0].status).toBe('draft');
  });

  it('already has posts → returns early without fetching', async () => {
    const { db } = makeDb(5);
    authorsMock.findOne.mockResolvedValue(
      makeAuthor({ tiktok: { value: 'janedoe', synchronize: true } }),
    );

    const processor = build(db);
    const result = await processor.process(jobFor({ authorId: 'author-1' }));

    expect(result).toMatchObject({ skipped: true });
    expect(scrape.tiktokProfileVideos).not.toHaveBeenCalled();
    expect(scrape.instagramPosts).not.toHaveBeenCalled();
  });

  it('config present with count=1 → respects limit', async () => {
    const { db, spies } = makeDb(0);
    authorsMock.findOne.mockResolvedValue(
      makeAuthor({ tiktok: { value: 'janedoe', synchronize: true } }),
    );
    scrape.tiktokProfileVideos.mockResolvedValue(tiktokResponse);
    syncMock.getSyncConfig.mockResolvedValue({
      mode: 'count',
      postCount: 1,
      fromDate: null,
      toDate: null,
    });

    const processor = build(db);
    await processor.process(jobFor({ authorId: 'author-1' }));

    const rows = spies.insertValues.mock.calls[0][0];
    // tiktokResponse has 2 items but count=1 limits to 1
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe('My first video');
  });

  it('maps instagram posts correctly', async () => {
    const { db, spies } = makeDb(0);
    authorsMock.findOne.mockResolvedValue(
      makeAuthor({ instagram: { value: 'jane', synchronize: true } }),
    );
    scrape.instagramPosts.mockResolvedValue(instagramResponse);

    const processor = build(db);
    await processor.process(jobFor({ authorId: 'author-1' }));

    expect(scrape.instagramPosts).toHaveBeenCalledWith({ handle: 'jane' });
    const rows = spies.insertValues.mock.calls[0][0];
    expect(rows[0].platform).toBe('instagram');
    expect(rows[0].text).toBe('IG caption');
    expect(rows[0].mediaUrl).toBe('https://cdn/ig.jpg');
    expect(rows[0].engagement.likes).toBe(50);
  });

  it('maps youtube posts correctly', async () => {
    const { db, spies } = makeDb(0);
    // youtubeProfileParams: UC + 22 chars = treated as channelId
    const channelId = 'UCmychannelABCDEFGHIJKL';
    authorsMock.findOne.mockResolvedValue(
      makeAuthor({ youtube: { value: channelId, synchronize: true } }),
    );
    scrape.youtubeChannelVideos.mockResolvedValue(youtubeResponse);

    const processor = build(db);
    await processor.process(jobFor({ authorId: 'author-1' }));

    expect(scrape.youtubeChannelVideos).toHaveBeenCalledWith({ channelId });
    const rows = spies.insertValues.mock.calls[0][0];
    expect(rows[0].platform).toBe('youtube');
    expect(rows[0].text).toBe('My YT Video');
    expect(rows[0].engagement.views).toBe(5000);
  });

  it('maps twitter posts correctly', async () => {
    const { db, spies } = makeDb(0);
    authorsMock.findOne.mockResolvedValue(
      makeAuthor({ x: { value: '@janex', synchronize: true } }),
    );
    scrape.twitterTweets.mockResolvedValue(twitterResponse);

    const processor = build(db);
    await processor.process(jobFor({ authorId: 'author-1' }));

    expect(scrape.twitterTweets).toHaveBeenCalledWith({ handle: 'janex' });
    const rows = spies.insertValues.mock.calls[0][0];
    expect(rows[0].platform).toBe('x');
    expect(rows[0].text).toBe('Hello twitter');
    expect(rows[0].engagement.shares).toBe(7);
  });

  it('skips platforms with no handle value', async () => {
    const { db, spies } = makeDb(0);
    authorsMock.findOne.mockResolvedValue(
      makeAuthor({
        tiktok: { value: '', synchronize: true },
        instagram: { value: 'jane', synchronize: true },
      }),
    );
    scrape.instagramPosts.mockResolvedValue(instagramResponse);

    const processor = build(db);
    await processor.process(jobFor({ authorId: 'author-1' }));

    expect(scrape.tiktokProfileVideos).not.toHaveBeenCalled();
    expect(spies.insertValues).toHaveBeenCalledTimes(1);
  });

  it('rethrows errors so BullMQ can retry', async () => {
    const { db } = makeDb(0);
    authorsMock.findOne.mockRejectedValue(new Error('DB down'));

    const processor = build(db);
    await expect(processor.process(jobFor({ authorId: 'author-1' }))).rejects.toThrow(
      'DB down',
    );
  });
});
