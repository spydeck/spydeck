import { Logger } from '@nestjs/common';
import { SyncService } from './sync.service';
import type { SyncConfigItemDto } from './sync.dto';

/**
 * Chainable Drizzle mock for:
 *   insert(t).values(v).onConflictDoUpdate(c).returning()  -> [row]
 */
function makeDb(returnRow = { id: 'cfg-1' }) {
  const returning = jest.fn().mockResolvedValue([returnRow]);
  const onConflictDoUpdate = jest.fn(() => ({ returning }));
  const values = jest.fn(() => ({ onConflictDoUpdate }));
  const insert = jest.fn(() => ({ values }));
  const query = { authorSyncConfigs: { findFirst: jest.fn() } };
  return {
    db: { insert, query } as any,
    spies: { insert, values, onConflictDoUpdate, returning },
  };
}

function build(db: any) {
  // SyncService requires the BullMQ queues; pass minimal stubs
  const queue = { add: jest.fn() } as any;
  const syncPostsQueue = { add: jest.fn() } as any;
  const adDetailQueue = { add: jest.fn() } as any;
  return new SyncService(queue, syncPostsQueue, adDetailQueue, db);
}

beforeAll(() => {
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});

describe('SyncService.saveSyncConfigs', () => {
  it('upserts a full-mode config with nulled count/date fields', async () => {
    const { db, spies } = makeDb();
    const items: SyncConfigItemDto[] = [
      { platform: 'instagram', mode: 'full' },
    ];
    await build(db).saveSyncConfigs('author-1', items);

    const inserted = spies.values.mock.calls[0][0];
    expect(inserted).toMatchObject({
      authorId: 'author-1',
      platform: 'instagram',
      mode: 'full',
      postCount: null,
      fromDate: null,
      toDate: null,
    });
  });

  it('maps count → postCount and nulls date fields for count mode', async () => {
    const { db, spies } = makeDb();
    const items: SyncConfigItemDto[] = [
      { platform: 'tiktok', mode: 'count', count: 30 },
    ];
    await build(db).saveSyncConfigs('author-1', items);

    const inserted = spies.values.mock.calls[0][0];
    expect(inserted).toMatchObject({
      mode: 'count',
      postCount: 30,
      fromDate: null,
      toDate: null,
    });
  });

  it('maps from/to → fromDate/toDate and nulls postCount for range mode', async () => {
    const { db, spies } = makeDb();
    const items: SyncConfigItemDto[] = [
      { platform: 'x', mode: 'range', from: '2024-01-01', to: '2024-06-01' },
    ];
    await build(db).saveSyncConfigs('author-1', items);

    const inserted = spies.values.mock.calls[0][0];
    expect(inserted).toMatchObject({
      mode: 'range',
      postCount: null,
      fromDate: '2024-01-01',
      toDate: '2024-06-01',
    });
  });

  it('returns the flattened rows from all upserts', async () => {
    const { db } = makeDb({ id: 'cfg-x' });
    const items: SyncConfigItemDto[] = [
      { platform: 'instagram', mode: 'full' },
      { platform: 'tiktok', mode: 'count', count: 10 },
    ];
    const result = await build(db).saveSyncConfigs('author-1', items);
    expect(result).toEqual([{ id: 'cfg-x' }, { id: 'cfg-x' }]);
  });

  it('logs and rethrows on db error', async () => {
    const { db } = makeDb();
    const boom = new Error('db down');
    db.insert = jest.fn(() => {
      throw boom;
    });
    const errorSpy = jest.spyOn(Logger.prototype, 'error');

    await expect(
      build(db).saveSyncConfigs('author-1', [
        { platform: 'youtube', mode: 'full' },
      ]),
    ).rejects.toBe(boom);

    expect(errorSpy).toHaveBeenCalled();
  });
});
