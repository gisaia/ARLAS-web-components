import { describe, expect, it } from 'vitest';
import { BboxFormErrorPipe } from './bbox-form-error.pipe';

describe('BboxFormErrorPipe', () => {
  it('create an instance', () => {
    const pipe = new BboxFormErrorPipe();
    expect(pipe).toBeTruthy();
  });
});
