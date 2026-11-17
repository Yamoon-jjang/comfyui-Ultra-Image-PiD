# Ultra Image + PiD v1.0.7 — What's New / 주요 변경 사항

Changes since v1.0.6 / v1.0.6 이후 변경 사항

## 한국어

- **모델별 높이 기억 개선:** 모델 계열마다 전체 노드 높이 대신 사용자가 늘려 둔 여유 공간을 기억합니다. 다른 모델에 있는 동안 LoRA 행이나 PiD 행 수가 달라져도 돌아오면 같은 여유 공간으로 복원됩니다.
- **빠른 모델 전환 보호:** 모델 설정 복원(LoRA 목록 확인)이 끝나기 전에 모델을 연속으로 바꿔도 다른 모델의 높이가 잘못 기록되지 않습니다. 워크플로우 다시 불러오기나 복원 오류 뒤에 이전 전환 정보가 남지 않습니다.
- **LoRA 버튼 표시 수정:** "＋ LoRA 추가" 버튼과 LoRA 행이 가끔 노드 폭보다 좁게 그려지던 현상을 수정했습니다.
- **기존 기록 호환:** v1.0.6에서 저장된 모델별 높이 기록을 그대로 읽어 이어서 사용합니다.
- **생성 기능 유지:** 모델 로딩, 생성 프롬프트, 샘플링, LoRA, PiD, CFG++ 및 연결 동작은 v1.0.6과 동일합니다.

## English

- **Better per-family height memory:** Each model family now remembers the extra space you added instead of the total node height, so returning to a family restores the same spacing even if LoRA or PiD rows changed meanwhile.
- **Rapid switching:** Switching families again before settings finish restoring (LoRA list lookup) no longer records one family's height under another; stale transitions are cleared after a workflow reload or a restore error.
- **LoRA button drawing:** Fixed the "+ Add LoRA" button and LoRA rows occasionally being drawn narrower than the node.
- **Compatible:** Height records saved by v1.0.6 are read and carried forward.
- **Generation unchanged:** Model loading, prompting, sampling, LoRA, PiD, CFG++ support, and connections retain v1.0.6 behavior.
