import asyncio
from typing import AsyncGenerator, List, Dict
from openai import AsyncOpenAI
from settings import OPENAI_API_KEY

from .base import Provider

class OpenAIProvider(Provider):
    name = "openai"

    def __init__(self):
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def stream(self, messages: List[Dict], model: str, max_output_tokens: int) -> AsyncGenerator[str, None]:
        # messages = [{"role":"user","content":"..."} ...]
        # OpenAI v1 streaming
        stream = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            max_tokens=max_output_tokens,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield delta
        return
