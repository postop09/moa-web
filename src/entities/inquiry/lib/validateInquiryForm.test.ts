import { describe, it, expect } from 'vitest';
import { validateInquiryForm } from './validateInquiryForm';
import {
  INQUIRY_TITLE_MIN,
  INQUIRY_TITLE_MAX,
  INQUIRY_BODY_MIN,
  INQUIRY_BODY_MAX,
} from '../config/limits';

const validBody = 'a'.repeat(INQUIRY_BODY_MIN);
const validTitle = 'a'.repeat(INQUIRY_TITLE_MIN);

describe('validateInquiryForm (new)', () => {
  it('제목·내용이 모두 조건을 만족하면 valid', () => {
    expect(
      validateInquiryForm({ title: validTitle, body: validBody, mode: 'new' }),
    ).toEqual({
      valid: true,
      errors: {},
    });
  });

  it.each([
    [INQUIRY_TITLE_MIN - 1, false],
    [INQUIRY_TITLE_MIN, true],
    [INQUIRY_TITLE_MAX, true],
    [INQUIRY_TITLE_MAX + 1, false],
  ])('제목 %i자 -> valid=%s', (len, ok) => {
    const r = validateInquiryForm({
      title: 'a'.repeat(len),
      body: validBody,
      mode: 'new',
    });
    expect(r.valid).toBe(ok);
    expect(Boolean(r.errors.title)).toBe(!ok);
    expect(r.errors.body).toBeUndefined();
  });

  it.each([
    [INQUIRY_BODY_MIN - 1, false],
    [INQUIRY_BODY_MIN, true],
    [INQUIRY_BODY_MAX, true],
    [INQUIRY_BODY_MAX + 1, false],
  ])('내용 %i자 -> valid=%s', (len, ok) => {
    const r = validateInquiryForm({
      title: validTitle,
      body: 'a'.repeat(len),
      mode: 'new',
    });
    expect(r.valid).toBe(ok);
    expect(Boolean(r.errors.body)).toBe(!ok);
    expect(r.errors.title).toBeUndefined();
  });

  it('내용이 짧으면 안내 문구를 반환한다', () => {
    const r = validateInquiryForm({
      title: validTitle,
      body: 'a'.repeat(9),
      mode: 'new',
    });
    expect(r.errors.body).toBe('내용을 10자 이상 적어주세요.');
  });

  it('공백만 있는 제목·내용은 빈 값으로 취급한다', () => {
    const r = validateInquiryForm({
      title: '     ',
      body: '          \n   ',
      mode: 'new',
    });
    expect(r.valid).toBe(false);
    expect(r.errors.title).toBeTruthy();
    expect(r.errors.body).toBeTruthy();
  });

  it('앞뒤 공백은 trim 후 글자 수를 센다', () => {
    const short = validateInquiryForm({
      title: ' a ',
      body: ` ${'a'.repeat(9)} `,
      mode: 'new',
    });
    expect(short.errors.title).toBeTruthy();
    expect(short.errors.body).toBeTruthy();
    const ok = validateInquiryForm({
      title: ' aa ',
      body: ` ${'a'.repeat(10)} `,
      mode: 'new',
    });
    expect(ok.valid).toBe(true);
  });

  it('trim 후 상한을 넘지 않으면 공백 포함 길이가 상한을 넘어도 valid', () => {
    const r = validateInquiryForm({
      title: ` ${'a'.repeat(INQUIRY_TITLE_MAX)} `,
      body: ` ${'a'.repeat(INQUIRY_BODY_MAX)} `,
      mode: 'new',
    });
    expect(r.valid).toBe(true);
  });
});

describe('validateInquiryForm (유니코드 코드포인트 길이)', () => {
  const run = (title: string, body: string) =>
    validateInquiryForm({ title, body, mode: 'new' });

  it('이모지 5개 본문은 5자로 세어 너무 짧다', () => {
    const r = run(validTitle, '\u{1F600}'.repeat(5));
    expect(r.valid).toBe(false);
    expect(r.errors.body).toBeTruthy();
  });

  it('이모지 10개 본문은 10자로 세어 valid', () => {
    expect(run(validTitle, '\u{1F600}'.repeat(10)).valid).toBe(true);
  });

  it('이모지 상한(2000개)은 valid, 2001개는 invalid', () => {
    expect(run(validTitle, '\u{1F600}'.repeat(INQUIRY_BODY_MAX)).valid).toBe(
      true,
    );
    const over = run(validTitle, '\u{1F600}'.repeat(INQUIRY_BODY_MAX + 1));
    expect(over.valid).toBe(false);
    expect(over.errors.body).toBeTruthy();
  });

  it('제목도 코드포인트로 센다: 이모지 1개는 짧고 2개는 valid', () => {
    const short = run('\u{1F600}', validBody);
    expect(short.valid).toBe(false);
    expect(short.errors.title).toBeTruthy();
    expect(run('\u{1F600}'.repeat(INQUIRY_TITLE_MIN), validBody).valid).toBe(
      true,
    );
  });

  it('제목 이모지 상한 경계: MAX개 valid, MAX+1개 invalid', () => {
    expect(run('\u{1F600}'.repeat(INQUIRY_TITLE_MAX), validBody).valid).toBe(
      true,
    );
    const over = run('\u{1F600}'.repeat(INQUIRY_TITLE_MAX + 1), validBody);
    expect(over.valid).toBe(false);
    expect(over.errors.title).toBeTruthy();
  });
});

describe('validateInquiryForm (trim은 DB btrim과 동일: 공백/탭/CR/LF만)', () => {
  const run = (title: string, body: string) =>
    validateInquiryForm({ title, body, mode: 'new' });

  it("본문 'a'*1995 + 개행 10개는 trim 후 1995자로 valid", () => {
    expect(
      run(validTitle, 'a'.repeat(INQUIRY_BODY_MAX - 5) + '\n'.repeat(10)).valid,
    ).toBe(true);
  });

  it('탭·CR·LF·공백은 앞뒤에서 제거된다', () => {
    const r = run(validTitle, ` \t\r\n${'a'.repeat(9)}\n\r\t `);
    expect(r.valid).toBe(false);
    expect(r.errors.body).toBeTruthy();
    expect(run(validTitle, ` \t\r\n${'a'.repeat(10)}\n\r\t `).valid).toBe(true);
  });

  it("전각 공백 '\u3000'은 trim되지 않는다: a*9 + 전각공백 = 10자 valid", () => {
    expect(run(validTitle, 'a'.repeat(9) + '\u3000').valid).toBe(true);
  });

  it("NBSP '\u00a0'도 trim되지 않는다", () => {
    expect(run(validTitle, 'a'.repeat(9) + '\u00a0').valid).toBe(true);
  });

  it('제목도 동일: a + 전각공백은 2자 valid, a + 개행은 1자 invalid', () => {
    expect(run('a\u3000', validBody).valid).toBe(true);
    const r = run('a\n', validBody);
    expect(r.valid).toBe(false);
    expect(r.errors.title).toBeTruthy();
  });

  it('전각 공백만 있는 본문은 빈 값이 아니다(길이로만 판정)', () => {
    expect(run(validTitle, '\u3000'.repeat(10)).valid).toBe(true);
  });
});

describe('validateInquiryForm (followUp)', () => {
  it('제목이 비어 있어도 내용만 맞으면 valid', () => {
    expect(
      validateInquiryForm({ title: '', body: validBody, mode: 'followUp' }),
    ).toEqual({
      valid: true,
      errors: {},
    });
  });

  it('제목 에러는 절대 내지 않는다', () => {
    const r = validateInquiryForm({
      title: '',
      body: 'short',
      mode: 'followUp',
    });
    expect(r.valid).toBe(false);
    expect(r.errors.title).toBeUndefined();
    expect(r.errors.body).toBe('내용을 10자 이상 적어주세요.');
  });

  it('내용 경계값은 동일하게 적용된다', () => {
    expect(
      validateInquiryForm({
        title: '',
        body: 'a'.repeat(INQUIRY_BODY_MAX),
        mode: 'followUp',
      }).valid,
    ).toBe(true);
    expect(
      validateInquiryForm({
        title: '',
        body: 'a'.repeat(INQUIRY_BODY_MAX + 1),
        mode: 'followUp',
      }).valid,
    ).toBe(false);
  });
});
