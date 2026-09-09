---
name: pr-review
description: PR(또는 브랜치)의 diff를 code-reviewer 서브에이전트로 리뷰한다. 기본은 로컬 요약만 출력하고, --comment를 붙이면 GitHub PR에 리뷰 코멘트를 게시한다.
---

# /pr-review — PR 코드 리뷰

`$ARGUMENTS`를 파싱해 리뷰 대상과 옵션을 정한다:

- 숫자만 있으면 PR 번호로 취급 (`/pr-review 12`)
- `--comment` 플래그가 포함되면 리뷰 후 실제로 GitHub에 코멘트를 남긴다 (기본은 게시하지 않음)
- 그 외 인자가 없으면 현재 브랜치에 연결된 열린 PR을 사용한다

## 1. 대상 PR 확인

```bash
gh pr view <number-또는-생략> --json number,title,body,url,baseRefName,headRefName,headRefOid
```

- 열린 PR을 찾지 못하면 사용자에게 알리고 중단한다 (PR 번호를 직접 지정하도록 안내).
- `headRefOid`(PR 최신 커밋 SHA)를 확보해둔다 — agent가 `git show <sha>:<path>`로 PR 시점의 전체 파일을 조회할 때 사용한다.

## 2. diff 조회

```bash
gh pr diff <number>
```

로컬 브랜치를 전환하지 않는다 (작업 트리를 건드리지 않기 위해). PR의 objects가 로컬에 없으면 먼저 `git fetch origin pull/<number>/head`로 받아온다.

## 3. code-reviewer 서브에이전트 호출

`subagent_type: code-reviewer`로 호출하며 프롬프트에 다음을 **원문 그대로** 포함한다:

- PR 번호/제목/설명, base/head 브랜치, `headRefOid`
- 2단계에서 가져온 diff 전체
- "필요하면 `git show <headRefOid>:<path>`로 PR 시점 전체 파일을 읽고, `.claude/rules/`의 규칙과 대조해 리뷰하라"는 지시

## 4. 결과 표시

code-reviewer의 리포트를 사용자에게 그대로 보여준다. 이 시점에는 GitHub에 아무것도 게시하지 않는다.

## 5. `--comment`가 있는 경우에만 게시

- 게시할 코멘트 본문(리뷰 리포트 전체 또는 요약)을 사용자에게 다시 한번 보여주고 게시 직전임을 알린다.
- High 심각도 문제가 하나라도 있으면 코멘트 게시 전에 "그래도 게시할까요?"를 다시 확인한다.
- 승인/변경요청 결정은 사람의 몫이므로 항상 중립 리뷰로 남긴다:

```bash
gh pr review <number> --comment --body-file <스크래치패드-임시파일>
```

- 임시 파일은 세션 스크래치패드 디렉토리에 작성한다.
- 게시 후 코멘트 URL(`gh pr view --json url` 등)을 사용자에게 알려준다.

## 주의

- `gh pr review --approve` / `--request-changes`는 사용하지 않는다 (사람이 최종 판단).
- 커밋, 브랜치 변경, 파일 수정 등 리뷰 이외의 부수효과를 일으키지 않는다.
