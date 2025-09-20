# import os
# from PyPDF2 import PdfReader
# import google.generativeai as genai

# # Configure Gemini API
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# genai.configure(api_key=GEMINI_API_KEY)

# def extract_pdf_text(file_path: str) -> str:
#     """Extract text from a PDF file."""
#     try:
#         reader = PdfReader(file_path)
#         text = ""
#         for page in reader.pages:
#             text += page.extract_text() or ""
#         return text.strip()
#     except Exception as e:
#         print(f"❌ PDF extraction failed: {file_path}: {e}")
#         return ""

# def chunk_text(text: str, chunk_size: int = 1000):
#     """Split text into smaller chunks."""
#     return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

# def embed_text_gemini(text: str):
#     """Generate embeddings using Gemini API."""
#     if not text.strip():
#         raise ValueError("Content cannot be empty for embedding")
#     response = genai.embeddings.create(
#         model="text-embedding-gecko-001",
#         input=text
#     )
#     return response.data[0].embedding

import os
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer

# Load embedding model locally
MODEL = SentenceTransformer('all-MiniLM-L6-v2')

def extract_pdf_text(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        print(f"❌ PDF extraction failed: {file_path}: {e}")
        return ""

def chunk_text(text: str, chunk_size: int = 1000):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def embed_text_local(text: str):
    if not text.strip():
        raise ValueError("Content cannot be empty for embedding")
    return MODEL.encode(text).tolist()  # returns list of floats

