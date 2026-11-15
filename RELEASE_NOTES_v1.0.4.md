# Ultra Image + PiD v1.0.4 — MiniMax H3 Image Resolution Fix

## 한국어

이번 패치에서는 MiniMax H3 Image 생성 시 해상도 선택기 또는 이전에 저장된 설정이 32픽셀 배수와 맞지 않아 실행 전 오류가 발생하던 문제를 해결했습니다.

- **실행 전 32배수 정렬:** MiniMax H3에 한해 가로·세로를 가장 가까운 32픽셀 배수로 보정합니다. 예: `1680 × 1032 → 1696 × 1024`.
- **모든 정상 입력 경로 지원:** 직접 입력, 저장된 워크플로우/모델별 설정 복원, 외부 8·16픽셀 단위 해상도 선택기 연결을 모두 처리합니다.
- **화면의 값과 실행값 일치:** 내부 가로·세로 위젯에 직접 입력하거나 기존 값을 복원하면 노드 화면에도 정렬된 크기를 표시합니다. 외부 노드와 연결된 입력은 원본 노드의 값을 수정하지 않고 실행 크기만 보정하며, 보정 내역은 ComfyUI 로그에 남깁니다.
- **안전 검사 유지:** 숫자가 아니거나 64~16384픽셀 범위를 벗어난 입력은 계속 오류로 처리합니다.
- **다른 모델 영향 없음:** 기존 6개 모델의 해상도 동작, 모델별 설정 기억, 프롬프트, LoRA, PiD, 모델 로딩·샘플링 설정을 변경하지 않았습니다.

MiniMax H3 Image의 Steps 6, CFG 1, euler/simple, Denoise 1, Batch 1 및 PiD·SageAttention 미지원 잠금 규칙은 v1.0.3과 같습니다.

### 검증

공식 32픽셀 격자 규칙과 대조하고, 보고된 오류값 재현, 20,000건 무작위 해상도, 모델별 전환/복원/수동 입력 UI, Python 실행 직전 파라미터, 기존 모델의 설정 유지, Python/JavaScript 문법 및 배포 ZIP 무결성을 검사했습니다. **실제 GPU를 이용한 이미지 생성은 별도 확인이 필요합니다.**

## English

This patch fixes a MiniMax H3 Image preflight failure when a saved dimension or upstream resolution selector supplied a value outside the model's 32-pixel canvas grid.

- **32px execution alignment:** H3 width and height are rounded to the nearest multiple of 32; for example, `1680 × 1032 → 1696 × 1024`.
- **All valid input paths:** manual dimensions, restored workflow/per-family settings, and connected selectors using 8px or 16px increments are handled.
- **Visible values match:** the H3 node's own dimensions reflect the aligned size. Connected upstream nodes retain their original values; any execution-time adjustment is logged.
- **Validation preserved:** malformed values and dimensions outside 64–16384px remain errors.
- **No legacy regression:** resolution behavior and remembered profiles for the other six model families, prompts, LoRAs, PiD, loading and sampling paths are unchanged.

H3 fixed sampling controls and unsupported PiD/SageAttention locks are unchanged from v1.0.3.

### Verification

Validated against the official 32px grid, reproduced the reported failure, tested 20,000 randomized resolutions, family switching and restored/manual widget settings, execution-time parameters, legacy settings isolation, Python/JavaScript syntax, and packaged ZIP integrity. **Actual GPU generation still requires user-side verification.**
