# Ultra Image + PiD
### All-in-One ComfyUI Image Generation & PixelDiT Upscaling
### 다양한 이미지 모델 생성 · 모델별 설정 기억 · 선택형 PiD 업스케일

**하나의 ComfyUI 노드로 6개 이미지 모델 계열을 선택해 생성하고, 모델별 설정을 기억하며, 지원되는 계열에서는 PiD(PixelDiT) 업스케일까지 처리합니다.** 모델을 바꿀 때마다 복잡한 생성 노드를 다시 구성할 필요가 없도록 설계한 독립 커스텀 노드입니다.

**One standalone ComfyUI node for six image-model families, per-family last-used settings, and optional PixelDiT (PiD) upscaling.** Switch between supported generation families without rebuilding a large model-specific graph each time.

**지원 / Supported:** **Krea 2 · Z-Image · Anima · Qwen Image · Qwen Image 2.1 (including Turbo) · MOSS-Image**

> **한국어·영어 UI 자동 연동 / Automatic Korean–English UI:** 노드 제목·입출력 이름·설정 항목 및 노드 전용 UI는 ComfyUI 언어 설정을 따릅니다. 한국어(ko)에서는 한국어, 영어(en)에서는 영어로 표시되며 별도 전환 버튼이 필요 없습니다. / Node labels, inputs/outputs, and its custom UI follow the ComfyUI language preference (KO/EN); no separate language switch is required.

![Ultra Image + PiD — ComfyUI node interface, model generation and PiD upscale](https://github.com/Yamoon-jjang/comfyui-Ultra-Image-PiD/raw/main/assets/ultra-image-pid.png)

*Ultra Image + PiD 노드 인터페이스와 주요 기능 및 이미지 출력 예시 / Interface overview, main features, and image output example.*

| 핵심 기능 / Highlights | 설명 / What you get |
| --- | --- |
| **6개 이미지 모델 계열 / Six model families** | Krea 2, Z-Image, Anima, Qwen Image, Qwen Image 2.1, MOSS-Image |
| **모델별 설정 기억 / Per-family settings memory** | 모델·VAE·해상도·샘플링·LoRA·PiD 설정을 계열별로 보관 / Restore family-specific generation settings |
| **한글·영문 자동 UI / Automatic KO–EN UI** | ComfyUI의 언어 설정을 따름 / Follows the ComfyUI locale |
| **생성 + 업스케일 / Generation + upscaling** | 하나의 노드에서 원본과 선택적 PiD 결과를 출력 / Original and optional PiD outputs |
| **동적 LoRA / Dynamic LoRA stack** | LoRA 행 추가, 활성화, 순서, 강도 조절 / Add, enable, reorder, and adjust LoRAs |
| **독립 설치 / Standalone package** | 다른 Ultra Tools 패키지 설치 불필요 / No Ultra Tools bundle required |

---

## 🇰🇷 한국어 안내

### 왜 Ultra Image + PiD를 사용하나요?

**1. 서로 다른 이미지 모델을 한 노드에서 사용**

Krea 2, Z-Image, Anima, Qwen Image, Qwen Image 2.1(Turbo 포함), MOSS-Image의 **6개 계열**을 지원합니다. 사용자는 모델 계열과 해당 확산 모델·텍스트 인코더·VAE를 선택하면 됩니다. 계열에 따른 텍스트 인코딩, latent 종류, 샘플링 경로 등은 노드 내부에서 구분해 처리하므로 모델마다 별도의 복잡한 생성 그래프를 반복해서 구성할 필요가 줄어듭니다.

지원 목록에 없는 모든 이미지 모델까지 자동 호환된다는 뜻은 아닙니다. 실제 사용할 모델 파일과 ComfyUI 코어 기능이 선택한 계열에 맞아야 합니다.

**2. 모델 계열별 마지막 생성 설정 자동 기억**

예를 들어 **Krea 2에서 생성 → Z-Image로 전환해 생성 → 다시 Krea 2 선택** 순서로 작업해도, 각 계열에서 마지막으로 사용한 주요 설정을 별도로 불러올 수 있습니다. 매번 해상도나 샘플러, LoRA를 다시 맞출 필요가 줄어듭니다.

- **기억 대상:** 확산 모델, 텍스트 인코더, VAE, 가로·세로 해상도, 배치 크기, Steps, CFG, Sampler, Scheduler, Denoise, Zero Conditioning, PiD 관련 설정, SageAttention, LoRA 목록·순서·강도 등
- **기억하지 않는 대상:** Positive / Negative 프롬프트 텍스트 및 Seed
- **저장 시점:** 해당 노드의 **생성 요청이 ComfyUI 큐에 정상 접수된 이후**입니다. 위젯만 바꾼 상태는 아직 새로운 마지막 생성 설정으로 확정되지 않습니다.
- **저장 위치:** 현재 브라우저와 ComfyUI 접속 주소에 연결된 `localStorage`입니다. 다른 브라우저·다른 주소·시크릿 모드·사이트 데이터 삭제 시 설정이 공유되거나 유지되지 않을 수 있습니다.

모델 계열을 변경하면 기억된 설정을 복원하며, 새 노드에도 이전 설정 일부를 적용할 수 있습니다. 다만 **새로 추가한 노드는 안전하게 PiD가 OFF인 상태로 시작할 수 있습니다.** 저장된 워크플로우를 다시 열 때는 **워크플로우 자체에 저장된 노드 설정이 우선**하므로, 마지막 사용 설정 때문에 기존 워크플로우 값이 임의로 덮어써지지 않도록 구분합니다.

**3. ComfyUI 언어 설정에 따른 한국어·영어 자동 전환**

한국어로 설정한 ComfyUI에서는 한국어 메뉴와 안내를, 영어로 설정하면 영어 메뉴를 사용합니다. 노드 전용 LoRA/옵션 UI도 언어 상태를 반영합니다. 별도 언어팩 설치나 노드 내부의 KO/EN 스위치를 조작할 필요가 없습니다.

**4. 필요할 때만 실행하는 PiD 업스케일**

호환되는 모델 계열에서는 원본을 생성한 뒤, **같은 노드에서 PiD를 ON**으로 설정해 업스케일할 수 있습니다. 별도의 PiD 서브그래프를 직접 연결하지 않아도 노드가 PiD conditioning, 전용 인코더 경로, context window, 출력 해상도와 색상 보정(Reinhard Lab)을 내부에서 처리합니다.

- **PiD OFF:** PiD 모델을 불러오지 않고 원본 이미지만 생성합니다. `PiD Image` 출력에는 원본이 그대로 전달됩니다.
- **PiD ON:** 지원되는 계열의 PiD 모델을 사용해 기본 **4배(x4)** 결과 또는 **2배(x2)** 최종 결과를 출력할 수 있습니다. x2는 x4 처리 뒤 축소하는 방식입니다.
- **출력 2개:** `Original Image`와 `PiD Image`를 따로 연결해 비교하거나 각각 저장할 수 있습니다.

예: `1024×1024` 원본 → PiD x4 `4096×4096` 또는 PiD x2 `2048×2048`.

PiD는 단순한 확대가 아니라 세부 내용을 재생성하므로 원본의 세부 형태가 달라질 수 있습니다. 특히 4배 처리 시 GPU 메모리 부담이 크므로 **먼저 Batch Size 1로 테스트**하세요.

**5. 생성 작업에 편리한 부가 기능**

- **동적 LoRA:** `+ Add LoRA`로 여러 LoRA를 추가하고 사용 여부·강도·순서를 각각 지정합니다. LoRA는 메인 생성 모델에 적용되고 텍스트 인코더에는 적용되지 않습니다.
- **선택적 STRING 프롬프트 입력:** 외부 텍스트 노드를 `Positive Prompt` / `Negative Prompt`에 연결할 수 있습니다. Positive가 비어 있어도 임의의 고정 프롬프트를 삽입하지 않습니다.
- **Zero Conditioning:** ON이면 모델 계열에 맞는 무조건 conditioning을 사용하며 연결된 Negative 텍스트는 무시합니다. Negative 프롬프트를 적용하려면 OFF로 바꿉니다.
- **선택적 SageAttention:** 호환되는 KJNodes를 설치한 경우 메인 생성 모델에 적용할 수 있습니다. OFF 상태에서는 KJNodes/SageAttention이 필요하지 않습니다.
- **모델별 특수 경로:** Qwen Image 2.1 Turbo는 파일명에 Turbo가 포함된 경우 전용 고정 sigma/CFG 1 경로를 사용하며, MOSS-Image에는 필요한 Skip Layer Guidance를 내부 적용합니다.

### 지원 모델 및 PiD 호환성

| 이미지 생성 계열 | PiD 체크포인트 계열 | 비고 |
| --- | --- | --- |
| **Krea 2** | `pid_qwenimage_...` | PiD 지원 |
| **Anima** | `pid_qwenimage_...` | PiD 지원 |
| **Qwen Image** | `pid_qwenimage_...` | PiD 지원 |
| **Z-Image** | `pid_flux1_...` | PiD 지원 |
| **MOSS-Image** | `pid_flux2_...` | PiD 지원; 해상도 16의 배수 |
| **Qwen Image 2.1 (Turbo 포함)** | — | **원본 이미지 생성 지원, PiD는 OFF로 잠금**; 해상도 16의 배수 |

Qwen Image 2.1과 MOSS-Image의 가로·세로는 16의 배수여야 합니다. 다른 지원 계열은 최소 8의 배수 기준을 따릅니다. PiD 모델은 **원본 모델 파일명이 아니라 위 호환 계열**에 맞춰 선택해야 합니다.

### 빠른 시작

1. 아래 설치 방법으로 노드를 설치한 후 ComfyUI를 재시작합니다.
2. 노드 검색에서 **Ultra Image + PiD**를 추가하거나 [예제 워크플로우](예제/Ultra_Image_PiD_Standalone.json)를 엽니다.
3. `Model Family`를 선택한 다음 해당 계열에 맞는 `Diffusion Model`, `Text Encoder`, `VAE`를 선택합니다.
4. `Width / Height`, `Steps`, `CFG`, `Sampler / Scheduler`를 설정하고 필요하면 `Positive Prompt`에 STRING을 연결합니다.
5. **Queue Prompt**를 실행합니다. 정상 큐 접수 이후 해당 모델 계열의 마지막 설정이 기억됩니다. PiD를 사용하려면 아래의 전용 파일을 설치하고 PiD ON으로 전환합니다.

원본과 PiD 결과는 각각 `IMAGE` 출력이므로 실제 파일 저장에는 일반적인 ComfyUI `Save Image` 노드를 연결하세요.

### PiD 사용 전 준비

모델 가중치는 ZIP에 포함되어 있지 않습니다. PiD ON으로 사용할 때는 **선택 모델에 맞는 PiD diffusion 체크포인트**와 **PiD 전용 Gemma ELM 텍스트 인코더 1개**가 추가로 필요합니다.

| 필요한 파일 | 공식 다운로드 | 설치 폴더 |
| --- | --- | --- |
| PiD diffusion checkpoint | [Comfy-Org / PixelDiT diffusion_models](https://huggingface.co/Comfy-Org/PixelDiT/tree/main/diffusion_models) | `ComfyUI/models/diffusion_models/` |
| PiD Gemma ELM text encoder | [Comfy-Org / PixelDiT text_encoders](https://huggingface.co/Comfy-Org/PixelDiT/tree/main/text_encoders) | `ComfyUI/models/text_encoders/` |

Gemma ELM은 `gemma_2_2b_it_elm_fp8_scaled.safetensors` 또는 `gemma_2_2b_it_elm_bf16.safetensors` 중 하나를 설치합니다. **`pixel_space`는 ComfyUI 코어의 가상 VAE 항목**이므로 별도의 `pixel_space` 파일을 받을 필요가 없습니다. 원본 생성용 VAE는 해당 모델에 맞춰 별도로 선택해야 합니다.

처음 시도할 때는 PiD Sampler `lcm`, Steps `4`, Degrade Sigma `0.0`을 참고하세요. Scheduler는 코어에서 지원하면 `sgm_uniform`, 그렇지 않으면 `simple` 등의 대체값을 사용합니다. 설정값과 체크포인트에 따라 결과는 달라지며 모든 환경에서 품질을 보장하지 않습니다.

---

## 🇬🇧 English Guide

### Why use Ultra Image + PiD?

**1. One node for six different image-model families**

Work with **Krea 2, Z-Image, Anima, Qwen Image, Qwen Image 2.1 (including Turbo), and MOSS-Image** in a single standalone node. Choose the model family and its corresponding diffusion checkpoint, text encoder, and VAE. The node routes model-specific text encoding, latent creation, and sampling internally, reducing the need to build and maintain separate generation graphs for each supported family.

This is support for the **six listed families**, not a claim that every diffusion model or checkpoint is universally compatible. A sufficiently recent ComfyUI core and correctly matched model assets are still required.

**2. Remember the last-used settings separately for each model family**

Switch from **Krea 2 → Z-Image → Krea 2** without manually reconstructing the previous Krea 2 configuration every time.

- **Remembered:** diffusion model, text encoder, VAE, dimensions, batch size, steps, CFG, sampler, scheduler, denoise, Zero Conditioning, PiD controls, SageAttention, and LoRA files/order/strength, among other node settings.
- **Not remembered in per-family settings:** Positive/Negative prompt text or Seed.
- **When saved:** only **after the generation request is successfully accepted into the ComfyUI queue**. Merely changing a widget does not commit a new last-generated configuration.
- **Where saved:** browser `localStorage` for the current browser and ComfyUI origin. Switching browsers/addresses, clearing site data, or using a private window may result in different or missing saved settings.

Changing model families restores available family-specific settings. Newly added nodes can also reuse remembered values, although a **fresh node may start with PiD safely OFF**. Importantly, **saved workflows retain their own serialized node values**; loading a workflow does not blindly replace its settings with a recently used preset.

**3. Automatic Korean and English interface**

The node follows ComfyUI's **KO/EN locale setting** for its labels and custom UI. Korean users see localized controls, while English users receive English controls. There is **no extra language selector** or separately installed language pack to manage.

**4. Optional integrated PixelDiT upscale**

For supported model families, generate a base image and enable **PiD within the same node**. The node handles the PiD conditioning path, Gemma text encoding, context windows, latent sizing, and Reinhard Lab color matching, without requiring you to manually wire a separate PiD subgraph.

- **PiD OFF:** skip PiD model loading; `PiD Image` passes through the original output.
- **PiD ON:** generate an **x4** upscale, or choose **x2** final output (processed at x4 then downscaled).
- **Two IMAGE outputs:** `Original Image` and `PiD Image`, useful for side-by-side comparison or separate Save Image nodes.

For example: `1024×1024` → `4096×4096` (x4) or `2048×2048` (x2).

PixelDiT can reconstruct or change fine details rather than simply resizing pixels. Upscaling is also VRAM-intensive, so start with **Batch Size 1**.

**5. Practical controls for image-generation workflows**

- **Dynamic LoRAs:** add multiple model-only LoRAs, toggle individual rows, adjust strength, and reorder them.
- **Optional STRING prompt sockets:** connect external text-producing nodes to Positive/Negative Prompt; an empty Positive does not inject any invented default prompt.
- **Zero Conditioning:** ON uses the appropriate unconditional path for the selected model family and ignores the Negative input; turn it OFF to encode a provided Negative prompt.
- **Optional SageAttention:** can apply KJNodes Patch Sage Attention to the main generation model when installed. With the switch OFF, **KJNodes is not required**.
- **Specialized model handling:** Qwen Image 2.1 models whose filenames identify them as Turbo use their fixed-sigma/CFG 1 route; MOSS-Image receives its required Skip Layer Guidance.

### Model and PiD compatibility

| Generation family | PiD checkpoint family | Support |
| --- | --- | --- |
| **Krea 2** | `pid_qwenimage_...` | Generation + PiD |
| **Anima** | `pid_qwenimage_...` | Generation + PiD |
| **Qwen Image** | `pid_qwenimage_...` | Generation + PiD |
| **Z-Image** | `pid_flux1_...` | Generation + PiD |
| **MOSS-Image** | `pid_flux2_...` | Generation + PiD; dimensions divisible by 16 |
| **Qwen Image 2.1 (including Turbo)** | — | **Generation supported; PiD locked OFF**; dimensions divisible by 16 |

Both dimensions must be multiples of **16** for Qwen Image 2.1 and MOSS-Image; the other supported families use a minimum multiple of **8**. Select your PiD model by the compatible **latent/PiD family**, not merely by the name of the original generator checkpoint.

### Quick start

1. Install the standalone node using the instructions below and restart ComfyUI.
2. Add **Ultra Image + PiD** from the node search or open the [example workflow](예제/Ultra_Image_PiD_Standalone.json).
3. Choose `Model Family`, then matching `Diffusion Model`, `Text Encoder`, and `VAE` files.
4. Adjust dimensions, sampling settings, and (optionally) connect a STRING to `Positive Prompt`.
5. Submit **Queue Prompt**. After the queue accepts it, the last-used settings for that family are recorded. To upscale, install the additional PiD assets and enable PiD.

Connect either `IMAGE` output to a normal ComfyUI `Save Image` node to write an image file.

### PiD prerequisites

**Model weights are not included in the ZIP.** Enabling PiD requires a matching PiD diffusion checkpoint plus one PiD-specific Gemma ELM text encoder:

| Asset | Official download | Folder |
| --- | --- | --- |
| PiD diffusion checkpoint | [Comfy-Org / PixelDiT diffusion_models](https://huggingface.co/Comfy-Org/PixelDiT/tree/main/diffusion_models) | `ComfyUI/models/diffusion_models/` |
| PiD Gemma ELM text encoder | [Comfy-Org / PixelDiT text_encoders](https://huggingface.co/Comfy-Org/PixelDiT/tree/main/text_encoders) | `ComfyUI/models/text_encoders/` |

Install either `gemma_2_2b_it_elm_fp8_scaled.safetensors` **or** `gemma_2_2b_it_elm_bf16.safetensors`. The `pixel_space` VAE used for PiD is a **virtual entry supplied by ComfyUI core**, not a separate weight file. A matching ordinary VAE is still required for original-image generation.

For an initial test, try PiD sampler `lcm`, `4` steps, and Degrade Sigma `0.0`. The scheduler uses `sgm_uniform` when available, or a fallback such as `simple`. Actual performance and image quality depend on your checkpoint, GPU, and ComfyUI version.

---

## 설치 / Installation

### Git clone / Git으로 설치

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Yamoon-jjang/comfyui-Ultra-Image-PiD.git
```

### Manual ZIP / ZIP 수동 설치

[GitHub Releases](https://github.com/Yamoon-jjang/comfyui-Ultra-Image-PiD/releases)에서 ZIP을 다운로드하여 다음 위치에 압축을 풉니다. / Download the ZIP from Releases and extract it into:

```text
ComfyUI/
└── custom_nodes/
    └── comfyui-Ultra-Image-PiD/
        ├── __init__.py
        ├── ultra_image_pid.py
        ├── web/
        ├── locales/
        ├── manual.txt
        └── 예제/
```

**중요 / Important:** `__init__.py`는 표시된 폴더 바로 아래에 있어야 합니다. 설치한 뒤 ComfyUI를 완전히 재시작하고, 필요하면 브라우저에서 `Ctrl+F5`로 새로고침하세요. / Avoid an extra nested directory. Restart ComfyUI completely, and hard-refresh the browser if necessary.

**ComfyUI Manager:** Registry에 버전이 게시되어도 **Active 상태가 되기 전**에는 Manager의 일반 설치가 제한될 수 있습니다. 해당 경우 Git 또는 ZIP 설치를 이용하세요. / A published Registry entry may not yet be installable through Manager until it becomes Active; use Git or ZIP when necessary.

이 노드는 **독립 패키지**로서 기존 `comfyui-Ultra-Tools`가 필요하지 않습니다. 다만 새 노드 ID는 `UltraStandaloneImagePiD`로, 구 `UltraImagePiD`와 달라 **이전 Ultra Tools 워크플로우가 자동 변환되지는 않습니다.** / This is a standalone package: no separate Ultra Tools installation is needed. Its ID `UltraStandaloneImagePiD` differs from the legacy `UltraImagePiD`, so old workflows are **not automatically migrated**.

## 문제 해결 / Troubleshooting

| 증상 / Symptom | 확인 사항 / What to check |
| --- | --- |
| 노드가 검색되지 않음 / Node not found | 폴더 이중 중첩 여부, `__init__.py` 위치, ComfyUI 시작 콘솔 오류 및 재시작 / Folder nesting, file placement, startup errors, restart |
| 모델 목록에 파일이 없음 / Missing model | 맞는 `models/*` 폴더와 모델 목록 새로고침 / Correct model folder and model-list refresh |
| PiD 모델을 선택할 수 없음 / PiD model unavailable | 선택한 생성 계열과 `qwenimage` / `flux1` / `flux2` 체크포인트 호환성 / PiD family mapping |
| PiD Gemma 오류 / PiD Gemma error | 공식 Gemma ELM 인코더 파일 설치 여부 / Install one supported Gemma ELM text encoder |
| GPU 메모리 부족 / Out of memory | PiD OFF로 먼저 생성, Batch 1, 원본 해상도 낮추기 / Try PiD OFF, batch 1, smaller source resolution |
| Negative Prompt가 무시됨 / Negative ignored | `Zero Conditioning` OFF 여부와 해당 모델의 CFG 동작 / Disable Zero Conditioning and check CFG |
| SageAttention 오류 / SageAttention error | SageAttention을 OFF로 두거나 호환 KJNodes 설치 / Disable it or install compatible KJNodes |
| 언어 또는 설정 복원 문제 / Locale or saved-settings issue | ComfyUI 언어 설정, `Ctrl+F5`, 정상 큐 접수, 브라우저 `localStorage` 확인 / Check locale, refresh, queue acceptance, browser storage |

## 문서·예제 / Documentation & Example

- **[한국어·영어 통합 사용 설명서 / Full bilingual manual](manual.txt)** — 모델 준비, PiD 설정, LoRA, 설정 기억 및 문제 해결 / Model setup, PiD, LoRA, saved settings, troubleshooting
- **[예제 워크플로우 / Example workflow](예제/Ultra_Image_PiD_Standalone.json)** — ComfyUI에서 열어 시작 / Open in ComfyUI to get started
- **[릴리즈 / Releases](https://github.com/Yamoon-jjang/comfyui-Ultra-Image-PiD/releases)** — 배포 ZIP 및 버전 정보 / Packages and version information

### 호환성·라이선스 / Compatibility & License

최신 모델별 기능을 제공하는 **호환 ComfyUI 코어**가 필요합니다. 확산 모델·인코더·VAE·PiD 가중치는 배포 ZIP에 포함되지 않으며 외부 모델 라이선스를 따릅니다. 정적 코드/패키지 검증은 모든 GPU에서의 생성·업스케일 성공을 보증하지 않습니다.

A compatible recent **ComfyUI core** is required for the relevant model-specific features. Diffusion, encoder, VAE, and PiD weights are **not bundled**, and their respective model licenses apply. Syntax/package checks do **not** guarantee successful inference or upscaling on every GPU/setup.

**소스 라이선스 / Source license:** [GPL-3.0](LICENSE).
