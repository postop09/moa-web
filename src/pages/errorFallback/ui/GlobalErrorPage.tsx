'use client';

// global-error는 루트 레이아웃 자체가 던질 때만 실행되며 그 레이아웃을 완전히 대체하므로,
// app/layout.tsx의 <html>/<body>와 globals.css를 상속받지 못한다. 그래서 인라인 스타일만 사용한다.
type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export const GlobalErrorPage = ({ reset }: Props) => {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif',
          background: '#f4f6f8',
          color: '#0f172a',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
          문제가 발생했습니다.
        </p>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: '#64748b' }}>
          페이지를 새로고침해도 문제가 계속되면 잠시 후 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.625rem 1.25rem',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
};
