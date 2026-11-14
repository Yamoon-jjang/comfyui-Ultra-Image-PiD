# Ultra Image + PiD v1.0.3 — MiniMax H3 Image

## 한국어

- **MiniMax H3 Image 지원:** ComfyUI 공식 워크플로우(`image_minimax_h3_image_t2i`)와 같은 경로로 생성합니다. 전용 MiniMax H3 Image Conditioning이 Positive와 latent를 함께 만들고, Negative는 Zero-out으로 처리합니다.
- **공식 고정값:** Steps 6 / CFG 1 / euler / simple / Denoise 1 / Batch 1. MiniMax에서는 이 값과 PiD·SageAttention이 잠깁니다. 다른 계열로 돌아가면 저장한 설정을 복원합니다.
- **해상도:** 가로·세로는 32의 배수(위젯도 32px 단위로 조절). 공식 네이티브 약 16MP 크기(4096×4096, 4736×3552, 5024×3360, 5472×3072, 6272×2688, 세로형 포함)까지 PiD 없이 생성합니다. 첫 선택 시 2048×2048.
- **첫 선택 추천:** 설치된 `int8_convrot` 모델·인코더와 MiniMax VAE를 자동 추천합니다. 이미 저장한 모델 선택은 바꾸지 않습니다.
- **설정 기억:** 모델별 마지막 생성 설정 기억은 그대로이며, 큐 등록이 실패한 경우에는 저장하지 않습니다. 같은 세션에서 생성하지 않고 바꾼 값도 모델 전환 후 돌아오면 유지됩니다.
- **PiD:** MiniMax는 PiD 미지원으로 잠기며, 표에 없는 계열이 PiD 지원처럼 보이던 문제를 고쳤습니다.
- 기존 6개 계열의 생성 동작은 바뀌지 않았습니다. MiniMax H3 Image 사용에는 최신 ComfyUI(공식 MiniMax H3 노드 포함)가 필요합니다.

## English

- **MiniMax H3 Image:** generates through the same graph as the official ComfyUI workflow (`image_minimax_h3_image_t2i`). The native MiniMax H3 Image Conditioning provides both the positive conditioning and the latent; the negative is zeroed out.
- **Official fixed values:** 6 steps / CFG 1 / euler / simple / denoise 1 / batch 1. These, PiD and SageAttention are locked for MiniMax; switching back restores your saved settings for other families.
- **Resolution:** width and height in multiples of 32 (the widgets step by 32). Native ~16 MP sizes (4096×4096, 4736×3552, 5024×3360, 5472×3072, 6272×2688, and portrait) are generated without PiD. First use starts at 2048×2048.
- **First-use suggestions:** installed `int8_convrot` model/encoder and the MiniMax VAE are preselected; saved model choices are never replaced.
- **Settings memory:** per-family last-generation memory is unchanged, and a failed queue no longer records settings. Unsent edits are kept for the session when you switch families and come back.
- **PiD:** locked OFF for MiniMax; a family missing from the table no longer appears PiD-capable.
- Generation for the six existing families is unchanged. MiniMax H3 Image requires a current ComfyUI that includes the native MiniMax H3 nodes.
