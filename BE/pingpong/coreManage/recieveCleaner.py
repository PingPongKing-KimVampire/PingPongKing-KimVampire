import html
import json
from typing import Any, Union
import bleach
import re

class ReceiveCleaner:
    ALLOWED_TAGS = []
    ALLOWED_ATTRIBUTES = {}

    @staticmethod
    def clean(content: Any) -> Any:
        if isinstance(content, str):
            return ReceiveCleaner._clean_string(content)
        elif isinstance(content, dict):
            return ReceiveCleaner._clean_dict(content)
        elif isinstance(content, list):
            return ReceiveCleaner._clean_list(content)
        else:
            return content

    @staticmethod
    def _clean_string(s: str) -> str:
        decoded = html.unescape(s)
        cleaned = bleach.clean(decoded, tags=ReceiveCleaner.ALLOWED_TAGS, attributes=ReceiveCleaner.ALLOWED_ATTRIBUTES, strip=True)
        return ReceiveCleaner._remove_potential_xss(cleaned)

    @staticmethod
    def _remove_potential_xss(s: str) -> str:
        s = re.sub(r'javascript:', '', s, flags=re.IGNORECASE)
        s = re.sub(r'on\w+\s*=', '', s, flags=re.IGNORECASE)
        return s.replace('<', '').replace('>', '')

    @staticmethod
    def _clean_dict(d: dict) -> dict:
        return {ReceiveCleaner._clean_string(str(k)): ReceiveCleaner.clean(v) for k, v in d.items()}

    @staticmethod
    def _clean_list(l: list) -> list:
        return [ReceiveCleaner.clean(item) for item in l]

    @staticmethod
    def clean_json(json_string: str) -> Union[dict, list, str]:
        try:
            content = json.loads(json_string)
            return ReceiveCleaner.clean(content)
        except json.JSONDecodeError:
            return ReceiveCleaner._clean_string(json_string)