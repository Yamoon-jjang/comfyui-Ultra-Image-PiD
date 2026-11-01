# Ultra Image + PiD v1.0.0 — Initial Standalone Release / 독립판 첫 배포

## 한국어

**Ultra Tools의 Image + PiD를 독립 커스텀 노드로 분리하여 처음 공개하는 버전입니다.** 기존 통합 Ultra Tools(12개 유틸리티 노드)와 별도로 설치·업데이트할 수 있습니다.

- 지원 모델: Krea 2, Z-Image, Anima, Qwen Image, Qwen Image 2.1(Turbo 포함), MOSS-Image
- 지원 PiD: Krea 2/Anima/Qwen Image → `qwenimage`; Z-Image → `flux1`; MOSS-Image → `flux2`. Qwen Image 2.1은 PiD 비지원
- 기존 기능: 기본 생성, 동적 LoRA, Negative/Zero Conditioning, 옵션 PiD, 모델별 설정 기억, 한국어/영어 UI, SageAttention(선택)
- 노드 ID: **`UltraStandaloneImagePiD`** (이전 Ultra Tools의 `UltraImagePiD`와 다름)
- **기존 워크플로우 자동 마이그레이션 없음:** 새 노드를 배치하여 기존 외부 입출력·모델 옵션을 확인 후 연결해 주세요.
- PiD 가중치 및 Gemma ELM 인코더는 별도 다운로드: https://huggingface.co/Comfy-Org/PixelDiT
- 설치: `ComfyUI/custom_nodes/` 경로에 설치 ZIP 내부 폴더 `comfyui-Ultra-Image-PiD`를 넣거나 Git으로 clone합니다.
- 상세 사용법은 루트 `manual.txt`의 한국어/영어 안내를 확인하세요.

**Registry/Manager 주의:** GitHub/Registry 게시가 성공해도 Comfy Registry 심사가 Active가 되기 전에는 Manager에서 설치되지 않을 수 있습니다. 이 경우 Git 또는 ZIP 직접 설치가 가능합니다.

실제 NVIDIA GPU 및 모든 모델의 전체 실기기 실행을 검증했다고 주장하지 않습니다.

## English

**First standalone release of Ultra Image + PiD**, separated from the 12-node Ultra Tools utility collection.

- Generation: Krea 2, Z-Image, Anima, Qwen Image, Qwen Image 2.1 (Turbo), MOSS-Image
- PixelDiT support: `qwenimage` for Krea 2/Anima/Qwen Image; `flux1` for Z-Image; `flux2` for MOSS-Image. No PiD support for Qwen Image 2.1 in this node
- Features: dynamic LoRA, external negative/zero conditioning, optional PiD, per-family saved settings, KO/EN labels, optional SageAttention
- New internal ID **`UltraStandaloneImagePiD`**; legacy `UltraImagePiD` workflows are **not automatically migrated**
- PiD weights and Gemma ELM encoder downloaded separately from https://huggingface.co/Comfy-Org/PixelDiT
- Install by Git clone or extract the ZIP's `comfyui-Ultra-Image-PiD` folder into `ComfyUI/custom_nodes/`
- Consult `manual.txt` for detailed usage in Korean and English.

**ComfyUI Manager:** Registry submission does not guarantee an immediately Active, installable version. Use Git or ZIP pending approval.

Tests are not a guarantee of GPU execution across all model installations.
