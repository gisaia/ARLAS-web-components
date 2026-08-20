import { describe, expect, it } from 'vitest';
import { DeltaTimePipe } from './delta-time.pipe';

describe('DeltaTimePipe', () => {
  it('create an instance', () => {
    const pipe = new DeltaTimePipe();
    expect(pipe).toBeTruthy();
  });
});
