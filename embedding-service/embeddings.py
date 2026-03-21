import os
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

MODEL = "text-embedding-3-small"


async def get_embedding(text: str) -> list[float]:
    response = await client.embeddings.create(input=text, model=MODEL)
    return response.data[0].embedding
