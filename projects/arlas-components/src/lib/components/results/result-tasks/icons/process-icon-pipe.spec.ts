import { describe, expect, it } from 'vitest';
import { ProcessIconPipe } from './process-icon-pipe';

describe('ProcessIconPipe', () => {
  it('create an instance', () => {
    const pipe = new ProcessIconPipe();
    expect(pipe).toBeTruthy();
  });
});
