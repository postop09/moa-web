---
name: commit
description: .claude/rules/git-convention.md의 Conventional Commits 규칙에 맞춰 커밋 메시지를 작성하고 커밋한다.
---

# /commit — 컨벤션에 맞춘 커밋

`$ARGUMENTS`가 있으면 커밋 타입/스코프/내용에 대한 힌트로 참고한다 (예: `/commit fix scope=pages/overview 빈 상태 버그 수정`).

## 절차

1. 다음을 **병렬로** 확인한다: `git status` (미추적 파일 포함, `-uall` 금지), `git diff` (unstaged), `git diff --staged`, `git log -5 --oneline`.
2. 변경 사항을 논리적 단위로 나눈다. 서로 무관한 변경(예: 기능 추가 + 무관한 리팩터)이 섞여 있으면 하나의 커밋에 넣지 말고 사용자에게 분리 여부를 확인한다.
3. `git add`는 관련 파일만 명시적으로 지정한다 (`git add -A`/`git add .` 금지). Stage 전후로 `git status`를 확인해 의도치 않은 파일(`.env`, credentials 등)이나 큰 바이너리가 포함되지 않았는지 점검한다.
4. `.claude/rules/git-convention.md` 형식에 맞춰 커밋 메시지를 작성한다: `<type>(<scope>): <description>` — description은 한글, 마침표 없음. 필요하면 본문에 "왜"를 bullet로 추가한다.
5. HEREDOC으로 커밋한다:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

6. `git status`로 커밋 성공을 확인한다.

## 하지 않는 것

- `--amend`, `--no-verify`, `--no-gpg-sign`은 사용자가 명시적으로 요청하지 않는 한 사용하지 않는다.
- 원격에 push하지 않는다 (요청 시에만).
- pre-commit 훅이 실패하면 원인을 고쳐 새 커밋으로 다시 시도한다. 실패로 인해 생성되지 않은 커밋에 `--amend`를 쓰지 않는다.
