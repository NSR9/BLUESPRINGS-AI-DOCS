from typing import AsyncGenerator, List, Dict
import asyncio, requests
from settings import OLLAMA_BASE_URL
from .base import Provider

class OllamaProvider(Provider):
    name = "ollama"

    async def stream(self, messages: List[Dict], model: str, max_output_tokens: int) -> AsyncGenerator[str, None]:
        # Stream from local Ollama HTTP API
        prompt = ""
        for m in messages:
            prefix = "User:" if m["role"] == "user" else "Assistant:"
            prompt += f"{prefix} {m['content']}\n"
        with requests.post(f"{OLLAMA_BASE_URL}/api/generate",
                           json={"model": model, "prompt": prompt, "stream": True},
                           stream=True) as r:
            for line in r.iter_lines():
                if not line:
                    continue
                # lines are JSON with 'response' key; keep parsing simple
                try:
                    import json
                    payload = json.loads(line.decode())
                    if "response" in payload:
                        yield payload["response"]
                except Exception:
                    continue
