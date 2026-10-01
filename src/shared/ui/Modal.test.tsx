import { useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

const pressTab = (shiftKey = false) =>
  fireEvent.keyDown(document.activeElement ?? document.body, {
    key: 'Tab',
    shiftKey,
  });

const getDialog = () => screen.getByRole('dialog', { name: '제목' });

describe('Modal - 초기 포커스', () => {
  it('열리면 패널 안의 첫 번째 포커스 가능 요소로 포커스가 이동한다 (백드롭이 아니다)', () => {
    render(
      <Modal title="제목" onClose={() => {}}>
        <button type="button">첫째</button>
        <button type="button">둘째</button>
      </Modal>,
    );

    expect(screen.getByRole('button', { name: '첫째' })).toHaveFocus();
    expect(screen.getByRole('button', { name: '닫기' })).not.toHaveFocus();
  });

  it('initialFocus ref 가 가리키는 요소로 포커스한다', () => {
    const Harness = () => {
      const secondRef = useRef<HTMLButtonElement>(null);

      return (
        <Modal title="제목" onClose={() => {}} initialFocus={secondRef}>
          <button type="button">첫째</button>
          <button type="button" ref={secondRef}>
            둘째
          </button>
        </Modal>
      );
    };
    render(<Harness />);

    expect(screen.getByRole('button', { name: '둘째' })).toHaveFocus();
  });

  it('role=dialog, aria-modal, 제목으로 이름이 붙는다', () => {
    render(
      <Modal title="제목" onClose={() => {}}>
        <button type="button">확인</button>
      </Modal>,
    );

    expect(getDialog()).toHaveAttribute('aria-modal', 'true');
  });
});

describe('Modal - 백드롭 닫기 버튼', () => {
  it('tabIndex -1 이라 탭 순서에 없지만 클릭으로 닫을 수 있다', () => {
    const onClose = vi.fn();
    render(
      <Modal title="제목" onClose={onClose}>
        <button type="button">확인</button>
      </Modal>,
    );

    const backdrop = screen.getByRole('button', { name: '닫기' });
    expect(backdrop).toHaveAttribute('tabindex', '-1');

    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Modal - 포커스 트랩', () => {
  const renderTrap = () =>
    render(
      <Modal title="제목" onClose={() => {}}>
        <button type="button">첫째</button>
        <button type="button">둘째</button>
        <button type="button">셋째</button>
      </Modal>,
    );

  it('마지막 요소에서 Tab 을 누르면 첫 요소로 순환한다', () => {
    renderTrap();
    screen.getByRole('button', { name: '셋째' }).focus();

    pressTab();

    expect(screen.getByRole('button', { name: '첫째' })).toHaveFocus();
  });

  it('첫 요소에서 Shift+Tab 을 누르면 마지막 요소로 순환한다', () => {
    renderTrap();
    screen.getByRole('button', { name: '첫째' }).focus();

    pressTab(true);

    expect(screen.getByRole('button', { name: '셋째' })).toHaveFocus();
  });

  it('포커스가 패널 밖(body)에 있을 때 Tab 을 누르면 패널 안으로 들어온다', () => {
    renderTrap();
    (document.activeElement as HTMLElement | null)?.blur();
    expect(document.body).toHaveFocus();

    pressTab();

    expect(getDialog()).toContainElement(document.activeElement as HTMLElement);
  });

  it('포커스가 패널 밖에 있을 때 Shift+Tab 을 누르면 패널 안으로 들어온다', () => {
    renderTrap();
    (document.activeElement as HTMLElement | null)?.blur();

    pressTab(true);

    expect(getDialog()).toContainElement(document.activeElement as HTMLElement);
  });

  it('패널 밖 요소로 포커스가 새지 않는다 (Tab 을 여러 번 눌러도 패널 안)', () => {
    render(
      <>
        <button type="button">바깥</button>
        <Modal title="제목" onClose={() => {}}>
          <button type="button">첫째</button>
          <button type="button">둘째</button>
        </Modal>
      </>,
    );
    screen.getByRole('button', { name: '둘째' }).focus();

    pressTab();
    expect(screen.getByRole('button', { name: '첫째' })).toHaveFocus();
    screen.getByRole('button', { name: '둘째' }).focus();
    pressTab();

    expect(screen.getByRole('button', { name: '바깥' })).not.toHaveFocus();
  });
});

describe('Modal - 닫기', () => {
  it('Escape 로 닫는다', () => {
    const onClose = vi.fn();
    render(
      <Modal title="제목" onClose={onClose}>
        <button type="button">확인</button>
      </Modal>,
    );

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeDisabled 이면 Escape 로 닫히지 않는다', () => {
    const onClose = vi.fn();
    render(
      <Modal title="제목" onClose={onClose} closeDisabled>
        <button type="button">확인</button>
      </Modal>,
    );

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Modal - 포커스 복원', () => {
  const Harness = () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          열기
        </button>
        {open ? (
          <Modal title="제목" onClose={() => setOpen(false)}>
            <button type="button" onClick={() => setOpen(false)}>
              닫기 버튼
            </button>
          </Modal>
        ) : null}
      </>
    );
  };

  it('닫히면 열기 전에 포커스돼 있던 요소로 포커스를 되돌린다', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: '열기' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('button', { name: '닫기 버튼' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: '닫기 버튼' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('Escape 로 닫아도 포커스가 복원된다', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: '열기' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('button', { name: '닫기 버튼' })).toHaveFocus();

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
    });
    // Harness 의 onClose 는 setOpen(false)

    expect(trigger).toHaveFocus();
  });
});
