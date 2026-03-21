from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from embeddings import get_embedding

app = FastAPI(title="NayaGhar Embedding Service")


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]


@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    embedding = await get_embedding(request.text)
    return EmbedResponse(embedding=embedding)


@app.get("/health")
async def health():
    return {"status": "ok"}
