---
alwaysApply: true
---

# Git 커밋 컨벤션

## 형식

```
<type>(<scope>): <description>

<body>

<footer>
```

- `scope`, `body`, `footer`는 선택
- `description`은 영어, 소문자로 시작, 명령형(imperative), 마침표 없음
- 제목 줄은 72자 이내 권장

## type

| type       | 용도                                          |
| ---------- | --------------------------------------------- |
| `feat`     | 새로운 기능 추가                              |
| `fix`      | 버그 수정                                     |
| `refactor` | 동작 변경 없는 코드 구조 개선                 |
| `style`    | 포맷팅, 세미콜론 등 동작에 영향 없는 변경     |
| `docs`     | 문서만 변경 (README, 주석 등)                 |
| `test`     | 테스트 추가/수정                              |
| `perf`     | 성능 개선                                     |
| `build`    | 빌드 시스템, 의존성 변경 (package.json 등)    |
| `ci`       | CI 설정 변경                                  |
| `chore`    | 위 항목에 속하지 않는 잡무 (설정 파일 등)     |
| `revert`   | 이전 커밋 되돌리기                            |

## scope

변경 범위를 괄호로 표기 (선택). FSD 레이어/슬라이스명을 권장한다.

```
feat(entities/session): add getSessionDetail api
fix(pages/overview): correct duration chart empty state
chore(claude): add code-reviewer agent
```

## 기존 컨벤션과의 관계

이 프로젝트는 이전에 `feat`/`mod`/`docs`/`refactor`/`setting` + 한글 설명 형태를 사용했다. 이 문서가 추가된 시점 이후의 새 커밋부터 Conventional Commits로 전환한다. 과거 커밋 로그는 다시 쓰지 않는다.

| 기존 접두사 | 대체                                              |
| ----------- | ------------------------------------------------- |
| `feat:`     | `feat:` (동일)                                    |
| `mod:`      | 동작 변경이면 `fix:`, 단순 조정이면 `refactor:`/`style:` |
| `docs:`     | `docs:` (동일)                                    |
| `refactor:` | `refactor:` (동일)                                |
| `setting:`  | `chore:` 또는 `build:`                            |

## 커밋 단위

- 하나의 커밋은 하나의 논리적 변경만 포함한다 (기능 추가 + 무관한 리팩터를 한 커밋에 섞지 않는다).
- FSD 레이어를 넘나드는 변경은 가능하면 레이어/슬라이스별로 커밋을 분리한다.

## 금지 사항

- `git commit --amend`, `git push --force`는 사용자가 명시적으로 요청한 경우에만 사용한다.
- `--no-verify`로 훅을 건너뛰지 않는다.
