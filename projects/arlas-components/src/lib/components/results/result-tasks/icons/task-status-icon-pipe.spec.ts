import { describe, expect, it } from 'vitest';
import { TaskStatusIconPipe } from './task-status-icon-pipe';

describe('TaskStatusIconPipe', () => {
  it('create an instance', () => {
    const pipe = new TaskStatusIconPipe();
    expect(pipe).toBeTruthy();
  });
});
