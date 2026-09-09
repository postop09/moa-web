---
description: 서브에이전트(.claude/agents)·스킬(.claude/skills) 작성 규칙
globs: .claude/agents/**,.claude/skills/**
alwaysApply: false
---

# 서브에이전트 & 스킬 컨벤션

## 서브에이전트 (`.claude/agents/*.md`)

### 파일/이름

- 파일명 = agent name, kebab-case (`code-reviewer.md`)
- frontmatter `name`은 파일명과 동일

### frontmatter

```yaml
---
name: agent-name
description: "역할과 하지 않는 일을 한국어 한두 문장으로. PROACTIVELY로 시작하면 자동 호출 후보가 됨"
tools: Read, Grep, Glob # 필요한 최소 tool만 명시
model: sonnet | opus
effort: high # 깊은 추론이 필요한 리뷰/기획 계열 agent만
permissionMode: acceptEdits # 파일을 직접 쓰는 agent만 (frontend-dev 등)
---
```

### 권한 최소화 원칙

- 코드를 **읽고 판단만** 하는 agent(researcher, planner, ui-ux-designer, code-reviewer)에는 `Write`/`Edit`를 부여하지 않는다.
- 실제로 파일을 생성/수정하는 agent(frontend-dev)만 `Write`, `Edit`, 필요시 `Bash`를 가진다.
- `git`/`gh` 조회 등 외부 상태를 **읽기만** 하는 동작이 필요한 읽기 전용 agent는 `Bash`를 추가로 부여하되, 상태를 바꾸는 명령(commit, push, checkout 등)은 agent 본문에서 금지 사항으로 명시한다.

### 역할 분리 원칙

- 하나의 agent는 파이프라인의 한 단계만 책임진다 (조사/기획/설계/구현/리뷰를 한 agent에 섞지 않는다).
- description과 본문에 "~하지 않습니다" 형태로 하지 않는 일을 명시해 역할 경계를 분명히 한다.

### 출력 형식

- 모든 agent는 마지막에 **고정된 마크다운 템플릿**으로 결과를 반환한다 (섹션 헤더 고정, 자유 서술 지양).
- 다음 단계에 넘길 정보(미해결 질문, 전달 노트 등)를 출력 템플릿의 마지막 섹션에 명시한다.
- 애매한 부분은 임의로 확정하지 않고 "가정:" 또는 "확인 필요"로 표시한다.

## 스킬 (`.claude/skills/<name>/SKILL.md`)

### 파일/이름

- 반드시 **디렉토리 + `SKILL.md`** 구조를 쓴다: `.claude/skills/<name>/SKILL.md`. `.claude/skills/<name>.md` 같은 단일 파일 형태는 쓰지 않는다.
- 디렉토리명 = 스킬 이름 (`/pr-review` → `.claude/skills/pr-review/SKILL.md`)
- 참고 자료(예시, 긴 규칙 전문 등)가 필요하면 같은 디렉토리 아래 `references/`, `examples/` 등 하위 파일로 두고 `SKILL.md`에서 상대 링크로 참조한다.

### frontmatter

```yaml
---
name: skill-name # 디렉토리명과 동일하게 맞춘다
description: 스킬이 하는 일 한 줄 요약 (스킬 목록에 노출됨)
---
```

### 본문 규칙

- `$ARGUMENTS`로 사용자 입력을 받고, 파싱 방법을 본문에 명시한다.
- 여러 서브에이전트를 순차 호출하는 파이프라인 스킬은 단계별로 **체크포인트**(사용자 확인)를 둔다. 되돌리기 어려운 단계(파일 쓰기, PR 코멘트 게시 등) 직전에는 반드시 확인받는다.
- 서브에이전트는 매번 새로 시작되어 이전 대화를 모른다 — 이전 단계 산출물은 요약하지 말고 **원문 그대로** 다음 프롬프트에 포함한다.
- 외부에 보이는 부수효과(GitHub 코멘트, 커밋 등)를 일으키는 스킬은 기본 동작을 "로컬 요약만"으로 하고, 실제 게시는 별도 플래그(`--comment` 등)로 명시적으로 요청받았을 때만 수행한다.

## 체크리스트

새 agent 추가 시:

1. 파이프라인에서 이 agent가 담당하는 **단일 책임**을 한 문장으로 정의한다.
2. 필요한 최소 tool만 부여한다 (Write/Edit는 실제로 파일을 써야 하는 agent에만).
3. 출력 템플릿에 다음 단계로 넘길 정보를 명시한다.
4. 이 agent를 사용하는 skill이 있다면 함께 갱신한다.

새 skill 추가 시:

1. `.claude/skills/<name>/SKILL.md` 구조로 만든다 (단일 파일 금지).
2. `$ARGUMENTS` 파싱 방법을 명시한다.
3. 호출할 agent와 전달할 컨텍스트를 정의한다.
4. 되돌리기 어려운 동작 앞에 체크포인트를 추가한다.
5. 외부 게시형 부수효과는 opt-in 플래그로 분리한다.
