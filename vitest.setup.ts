import '@testing-library/jest-dom/vitest';

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest.config.mts에서 test.globals를 켜지 않아 afterEach가 전역으로 주입되지 않는다.
// @testing-library/react는 전역 afterEach가 있을 때만 자동으로 cleanup을 등록하므로,
// 여기서 명시적으로 등록해 각 테스트 종료 후 렌더된 DOM을 정리한다.
afterEach(() => {
  cleanup();
});
