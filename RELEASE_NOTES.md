# Ultra Image + PiD v1.0.5 — What's New / 주요 변경 사항

Changes since v1.0.4 / v1.0.4 이후 변경 사항

## 한국어

- **MiniMax H3 Image 생성 지원:** 공식 `MiniMaxH3ImageConditioning`으로 Positive와 5D latent를 구성하고, 체크포인트의 `pdd_sigmas`를 활용합니다.
- **샘플링 선택:** 6 Steps / Euler / simple을 기본 권장합니다. Steps·Sampler·Scheduler 변경을 허용하며 다른 조합은 실험적입니다.
- **H3 전용 제약:** CFG 1·Denoise 1·Batch 1을 고정하고 SageAttention과 PiD는 사용하지 않습니다. 해상도는 32픽셀 배수로 정렬하며 네이티브 약 16MP 생성이 가능합니다.
- **CFG++ 호환:** H3에서 사용자 Negative Prompt 및 Zero Conditioning 설정은 적용하지 않지만, CFG++ 샘플러가 요구하는 내부 `ConditioningZeroOut(positive)`를 제공합니다. 빈 이미지 보조는 사용하지 않습니다.
- **기존 기능 유지:** 저장된 LoRA 설정과 워크플로우 연결을 유지하며, Krea 2·Z-Image·Anima·Qwen 계열·MOSS의 생성 및 PiD 동작은 변경하지 않았습니다.

## English

- **MiniMax H3 Image generation:** Uses native `MiniMaxH3ImageConditioning` with positive conditioning, a 5D latent, and checkpoint `pdd_sigmas`.
- **Sampling controls:** Recommends 6 steps / Euler / simple. Other user-selected steps, samplers, and schedulers are experimental.
- **H3-specific settings:** Keeps CFG 1, Denoise 1, Batch 1, SageAttention/PiD OFF, 32px-aligned dimensions, and native generation up to approximately 16MP.
- **CFG++ support:** User Negative Prompt text and the Zero Conditioning setting are not applied to H3. Internal `ConditioningZeroOut(positive)` supports CFG++ samplers without any blank-image assistance.
- **Existing features:** Preserves LoRA choices and workflow connections. Krea 2, Z-Image, Anima, Qwen, and MOSS generation/PiD behavior is unchanged.
