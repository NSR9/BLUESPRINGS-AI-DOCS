from typing import AsyncGenerator, List, Dict
from anthropic import AsyncAnthropic
from settings import ANTHROPIC_API_KEY
from .base import Provider

class AnthropicProvider(Provider):
    name = "anthropic"

    def __init__(self):
        self.client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

    async def stream(self, messages: List[Dict], model: str, max_output_tokens: int) -> AsyncGenerator[str, None]:
        # Convert OpenAI-style history -> Anthropic
        # User/assistant pairs; system prompt optional
        content = []
        for m in messages:
            if m["role"] == "user":
                content.append({"role": "user", "content": m["content"]})
            elif m["role"] == "assistant":
                content.append({"role": "assistant", "content": m["content"]})
        with self.client.messages.stream(
            model=model,
            max_tokens=max_output_tokens,
            messages=content
        ) as stream:
            async for event in stream:
                if event.type == "content.delta":
                    yield event.delta
