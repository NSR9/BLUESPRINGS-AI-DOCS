from typing import AsyncGenerator, List, Dict
import google.generativeai as genai
import asyncio
from settings import GEMINI_API_KEY
from .base import Provider

class GeminiProvider(Provider):
    name = "gemini"

    def __init__(self):
        genai.configure(api_key=GEMINI_API_KEY)

    async def stream(self, messages: List[Dict], model: str, max_output_tokens: int) -> AsyncGenerator[str, None]:
        # Merge history to one prompt (simple baseline)
        # For production, use the official chat history API.
        prompt = ""
        for m in messages:
            prefix = "User:" if m["role"] == "user" else "Assistant:"
            prompt += f"{prefix} {m['content']}\n"
        model_obj = genai.GenerativeModel(model_name=model)
        resp = await asyncio.to_thread(model_obj.generate_content, prompt, stream=True, generation_config={"max_output_tokens": max_output_tokens})
        for chunk in resp:
            text = getattr(chunk, "text", "") or ""
            if text:
                yield text
