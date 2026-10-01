import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveInquiryDraft,
  loadInquiryDraft,
  clearInquiryDraft,
} from './inquiryDraftStorage';

describe('inquiryDraftStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('저장한 초안을 그대로 불러온다', () => {
    saveInquiryDraft('k', { title: '제목', body: '내용입니다 내용' });
    expect(loadInquiryDraft('k')).toEqual({
      title: '제목',
      body: '내용입니다 내용',
    });
  });

  it('저장된 값이 없으면 null', () => {
    expect(loadInquiryDraft('missing')).toBeNull();
  });

  it('키별로 독립적으로 저장된다', () => {
    saveInquiryDraft('a', { title: 'A', body: 'aaa' });
    saveInquiryDraft('b', { title: 'B', body: 'bbb' });
    expect(loadInquiryDraft('a')).toEqual({ title: 'A', body: 'aaa' });
    expect(loadInquiryDraft('b')).toEqual({ title: 'B', body: 'bbb' });
  });

  it('같은 키에 다시 저장하면 덮어쓴다', () => {
    saveInquiryDraft('k', { title: '1', body: '1' });
    saveInquiryDraft('k', { title: '2', body: '2' });
    expect(loadInquiryDraft('k')).toEqual({ title: '2', body: '2' });
  });

  it('clear 후에는 null이고 다른 키는 유지된다', () => {
    saveInquiryDraft('a', { title: 'A', body: 'aaa' });
    saveInquiryDraft('b', { title: 'B', body: 'bbb' });
    clearInquiryDraft('a');
    expect(loadInquiryDraft('a')).toBeNull();
    expect(loadInquiryDraft('b')).not.toBeNull();
  });

  it('깨진 JSON이면 null', () => {
    // 구현이 쓰는 실제 키를 모르므로 모든 getItem을 깨진 값으로 대체한다
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{not json');
    expect(loadInquiryDraft('k')).toBeNull();
  });

  it('JSON이지만 형태가 틀려도 throw하지 않는다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('123');
    expect(() => loadInquiryDraft('k')).not.toThrow();
  });

  it('localStorage가 throw해도 save/load/clear 모두 크래시하지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() =>
      saveInquiryDraft('k', { title: 't', body: 'b' }),
    ).not.toThrow();
    expect(loadInquiryDraft('k')).toBeNull();
    expect(() => clearInquiryDraft('k')).not.toThrow();
  });
});
