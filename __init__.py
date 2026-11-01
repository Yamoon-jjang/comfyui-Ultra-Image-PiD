"""Ultra Image + PiD standalone ComfyUI package."""

from .ultra_image_pid import UltraImagePiD

NODE_CLASS_MAPPINGS = {"UltraStandaloneImagePiD": UltraImagePiD}
NODE_DISPLAY_NAME_MAPPINGS = {"UltraStandaloneImagePiD": "Ultra Image + PiD"}
WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
