# Ultra Image + PiD v1.0.2 — Executed prompt record / 실제 프롬프트 기록

## 한국어
- **실제 프롬프트 기록:** 노드가 실제로 인코딩한 긍정/부정 프롬프트를 이미지 메타데이터(`ultra_generation_prompts`)에 기록합니다. 번역기·LLM 노드 등을 거쳐 연결선으로 들어온 프롬프트도 변환 후 문장이 남습니다.
- **Ultra Exif Reader v4.12 이상**에서 Final CLIP 프롬프트로 표시됩니다.
- 캐시로 노드 실행이 생략돼도 기록이 유지되며, 기록 실패가 생성을 멈추지 않습니다.
- 이미지 생성 동작과 노드 입력·설정은 바뀌지 않았습니다.
- 설치: Git clone 또는 ZIP 안의 `comfyui-Ultra-Image-PiD` 폴더를 `ComfyUI/custom_nodes/`에 넣고 ComfyUI를 재시작합니다.

## English
- **Executed prompt record:** the node writes the positive/negative prompt it actually encoded into the saved image metadata (`ultra_generation_prompts`). Prompts that arrive through a translator or LLM link are kept as the converted text.
- **Ultra Exif Reader v4.12+** shows it as the Final CLIP prompt.
- Cached re-runs keep the record; a failed record never stops generation.
- Generation behaviour, node inputs and settings are unchanged.
- Install by Git clone, or extract the ZIP's `comfyui-Ultra-Image-PiD` folder into `ComfyUI/custom_nodes/` and restart ComfyUI.
