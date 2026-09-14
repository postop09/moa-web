import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OnboardingFormLayout } from './OnboardingFormLayout';

describe('OnboardingFormLayout', () => {
  it('headline prop을 heading으로 렌더한다', () => {
    render(
      <OnboardingFormLayout
        headline="가계부를 만들어 주세요"
        description="함께 관리할 가계부 이름을 정합니다."
      >
        <div />
      </OnboardingFormLayout>,
    );

    expect(
      screen.getByRole('heading', { name: '가계부를 만들어 주세요' }),
    ).toBeInTheDocument();
  });

  it('description prop 텍스트를 렌더한다', () => {
    render(
      <OnboardingFormLayout
        headline="프로필을 만들어 주세요"
        description="가계부에서 사용할 닉네임을 입력합니다."
      >
        <div />
      </OnboardingFormLayout>,
    );

    expect(
      screen.getByText('가계부에서 사용할 닉네임을 입력합니다.'),
    ).toBeInTheDocument();
  });

  it('children으로 전달한 내용을 그대로 렌더한다', () => {
    render(
      <OnboardingFormLayout headline="headline" description="description">
        <label htmlFor="nickname">닉네임</label>
        <input id="nickname" />
        <button type="submit">시작하기</button>
      </OnboardingFormLayout>,
    );

    expect(screen.getByLabelText('닉네임')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '시작하기' }),
    ).toBeInTheDocument();
  });

  it('headline과 description을 함께 렌더한다', () => {
    render(
      <OnboardingFormLayout
        headline="headline-text"
        description="description-text"
      >
        <div />
      </OnboardingFormLayout>,
    );

    expect(
      screen.getByRole('heading', { name: 'headline-text' }),
    ).toBeInTheDocument();
    expect(screen.getByText('description-text')).toBeInTheDocument();
  });
});
