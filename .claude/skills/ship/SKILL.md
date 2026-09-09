---
name: ship
description: 브랜치 생성 → 구현 → 논리 단위 커밋 → code-reviewer 자체 점검 → PR 생성까지 한 번에 진행하는 작업 파이프라인. push/PR 생성 직전 단 한 번만 확인받고 나머지는 자동으로 진행한다.
---

# /ship — 브랜치부터 PR까지 자동 진행

`$ARGUMENTS`를 작업 요청 내용으로 받는다 (예: `/ship 거래 내역에 정렬 옵션 추가`). 브랜치 생성부터 PR 생성까지 진행한다. 2단계에서 `new-feature` 파이프라인을 타는 경우 그 안의 단계별 확인(체크포인트 1~4)은 그대로 유지되고, 그 외에는 **5단계(push/PR 생성 직전) 단 한 번만** 확인받고 나머지 단계는 자동으로 진행한다.

## 0. 사전 점검

- `git status`로 작업 트리를 확인한다. 커밋되지 않은 변경이 있으면 사용자에게 알리고 어떻게 처리할지 확인한다(포함/스태시/중단) — 남의 작업을 실수로 새 브랜치에 섞어 넣지 않기 위한 안전장치이므로, "push/PR 직전에만 확인"과 별개로 이 경우는 확인한다.
- 기본 브랜치를 확인한다: `git remote show origin | grep "HEAD branch"`.
- 현재 브랜치가 기본 브랜치면 최신 상태로 맞춘다(`git pull`). 이미 다른 브랜치에 있다면 그 브랜치를 베이스로 계속 진행하되, 어느 브랜치에서 새 브랜치를 파는지 사용자에게 짧게 알린다(확인을 구하지는 않음).

## 1. 브랜치 생성

- 작업 요청 내용에서 `.claude/rules/git-convention.md`의 커밋 타입(`feat`/`fix`/`refactor`/`docs`/`chore` 등) 하나와 영문 kebab-case 슬러그를 짧게 도출한다.
- 브랜치명: `<type>/<slug>` (예: `feat/history-sort-option`). 브랜치명은 영문으로 짓는다(커밋 description은 한글이어도 무방).
- `git checkout -b <branch>`로 새 브랜치를 만든다.

## 2. 구현

- 리서치·기획·설계가 필요한 신규 기능/화면이면 `new-feature` 스킬을 그대로(처음부터 끝까지) 실행한다 — **이때는 `new-feature`에 정의된 단계별 확인(체크포인트 1~4, 5단계 자체 점검 여부 포함)을 생략하지 않고 그대로 거친다.** `ship`이 "확인은 5단계 한 번뿐"이라고 자동 진행하는 것은 이 구현 단계 자체를 건너뛰라는 뜻이 아니다.
- 단순 수정·버그 픽스처럼 리서치~설계가 필요 없는 작업이라면 확인 없이 직접 구현한다.
- 작업 중 `.claude/rules/`의 FSD 규칙이 항상 적용된다.

## 3. 논리 단위 커밋

- 전체 작업이 끝날 때까지 기다리지 않고, **논리적 단위가 끝날 때마다 그 자리에서** 커밋한다.
- 커밋 방법은 `commit` 스킬(`.claude/skills/commit/SKILL.md`)의 절차를 그대로 따른다: 관련 파일만 명시적으로 `git add`(`-A`/`.` 금지), `git-convention.md` 형식(`<type>(<scope>): <description>`)으로 메시지 작성, HEREDOC으로 커밋.
- 서로 무관한 변경이 섞여 있으면 커밋을 분리한다.

## 4. code-reviewer 자체 점검

- 계획한 구현과 마지막 커밋까지 모두 마친 뒤, `subagent_type: code-reviewer`를 호출해 이번 브랜치 전체 변경 사항을 리뷰시킨다. 프롬프트에 이번 작업의 배경(무엇을 만들려 했는지)과 `git diff <base-branch>...HEAD` 전체를 원문 그대로 포함한다.
- 2단계에서 `new-feature`의 5단계(자체 점검)를 이미 실행해 문제 없음을 확인했다면, 그 사이에 추가 커밋이 없는 한 다시 호출하지 않고 그 결과를 재사용한다.
- **High 심각도 문제**가 있으면 직접 고치고 새 커밋을 추가한다(기존 커밋에 `--amend` 금지). 고친 뒤 필요하면 code-reviewer를 다시 호출해 재확인한다.
- Medium/Low는 고치지 않고 다음 단계 보고에 포함한다.

## 5. 체크포인트 — push/PR 생성 직전 (ship 자체의 마지막 확인)

- 이번 브랜치의 커밋 로그(`git log --oneline <base-branch>..HEAD`)와 code-reviewer의 최종 리뷰 결과를 사용자에게 보여준다.
- "이 브랜치를 push하고 PR을 생성할까요?"를 명확히 확인받는다. 승인 전에는 6단계로 진행하지 않는다.
- 사용자가 수정을 요청하면 반영하고(필요하면 3~4단계 반복) 다시 확인받는다.

## 6. push & PR 생성 (승인 후에만)

- `git push -u origin <branch>`.
- 커밋 로그를 근거로 PR 제목/본문을 작성해 `gh pr create`로 생성한다(Summary/Test plan 형식의 body를 HEREDOC으로 전달).
- 생성된 PR URL을 사용자에게 알려준다.

## 하지 않는 것

- `git push --force`, 기본 브랜치에 직접 커밋.
- `gh pr merge`, `gh pr review --approve`/`--request-changes` (병합·승인은 사람의 몫).
- `--amend`, `--no-verify`는 사용자가 명시적으로 요청한 경우에만 사용한다.
- 5단계 확인 없이 6단계(push/PR 생성)로 넘어가지 않는다.
