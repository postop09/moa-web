export type InquiryDraft = { title: string; body: string };

const PREFIX = 'inquiry-draft:';

export const saveInquiryDraft = (key: string, draft: InquiryDraft): void => {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(draft));
  } catch {
    // 저장 실패(용량·프라이빗 모드)는 무시한다
  }
};

export const loadInquiryDraft = (key: string): InquiryDraft | null => {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as InquiryDraft).title === 'string' &&
      typeof (parsed as InquiryDraft).body === 'string'
    ) {
      const { title, body } = parsed as InquiryDraft;
      return { title, body };
    }
    return null;
  } catch {
    return null;
  }
};

export const clearInquiryDraft = (key: string): void => {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // 무시
  }
};
