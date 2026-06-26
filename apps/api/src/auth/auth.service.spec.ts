import * as bcrypt from 'bcrypt';

describe('bcrypt round-trip', () => {
  it('compare returns true for correct password', async () => {
    const hash = await bcrypt.hash('hunter2', 10);
    expect(await bcrypt.compare('hunter2', hash)).toBe(true);
  });

  it('compare returns false for wrong password', async () => {
    const hash = await bcrypt.hash('hunter2', 10);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });
});
