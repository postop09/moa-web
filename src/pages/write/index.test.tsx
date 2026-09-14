import { describe, expect, it } from 'vitest';

import * as writePageModule from './index';

describe('pages/write index public API', () => {
  it('WritePage를 계속 export한다', () => {
    expect(writePageModule.WritePage).toBeDefined();
  });

  it('WriteEditPage를 re-export한다', () => {
    expect(writePageModule.WriteEditPage).toBeDefined();
  });
});
