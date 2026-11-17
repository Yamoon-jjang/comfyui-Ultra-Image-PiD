# Ultra Image + PiD v1.0.6 — What's New / 주요 변경 사항

Changes since v1.0.5 / v1.0.5 이후 변경 사항

## 한국어

- **모델별 노드 높이 기억:** Krea 2, Z-Image, Anima, Qwen, MOSS, MiniMax H3 등 각 모델 계열에서 사용자가 조절한 노드 높이를 기억하고 다시 선택하면 복원합니다.
- **너비 유지:** 모델을 전환해도 모델별 너비 기억값을 적용하지 않고 현재 노드 너비를 유지합니다. ComfyUI가 요구하는 최소 너비는 지킵니다.
- **MiniMax H3 레이아웃:** 다른 모델에서 H3로 바꿀 때 보이지 않는 설정 행 때문에 노드 하단에 불필요한 빈 공간이 남는 현상을 개선했습니다. 사용자가 추가한 높이는 보존합니다.
- **안정적인 전환:** 모델 설정 변경이 완료된 뒤 최종 크기를 한 번 적용하여 불필요한 하단 테두리 움직임을 방지합니다. 저장된 워크플로우의 사용자 크기를 유지하고 이전 테스트 형태의 높이 기록도 이어받습니다.
- **생성 기능 유지:** 모델 로딩, 생성 프롬프트, 샘플링, LoRA, PiD, CFG++ 및 연결 동작은 v1.0.5와 동일합니다.

## English

- **Per-family node height:** Remembers each image-model family's user-adjusted node height and restores it when switching back.
- **Stable width:** Keeps the current manually adjusted width across model changes rather than restoring a family-specific width; respects ComfyUI's minimum width.
- **MiniMax H3 layout:** Removes unnecessary empty space left below the H3 controls after switching from a family with more visible rows, while preserving intentionally added height.
- **Smooth model switching:** Applies the final size once after model settings settle, preserves the user-sized workflow layout, and imports previously stored height values when present.
- **Generation unchanged:** Model loading, prompting, sampling, LoRA, PiD, CFG++ support, and connections retain v1.0.5 behavior.
