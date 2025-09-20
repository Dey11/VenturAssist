# import os
# import psycopg2
# from PyPDF2 import PdfReader
# from sentence_transformers import SentenceTransformer
# import numpy as np

# # -----------------------
# # CONFIG
# # -----------------------
# from dotenv import load_dotenv
# import os
# import psycopg2
# from PyPDF2 import PdfReader
# from sentence_transformers import SentenceTransformer
# from dotenv import load_dotenv
# # Load .env variables
# load_dotenv()

# POSTGRES_URL = os.getenv("POSTGRES_URL")
# VECTOR_DB_URL = os.getenv("VECTOR_DB_URL")

# UPLOADS_FOLDER = "uploads"
# CHUNK_SIZE = 500  # characters per chunk

# # -----------------------
# # Load embedding model (local Hugging Face)
# # -----------------------
# model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# # -----------------------
# # FUNCTIONS
# # -----------------------
# def extract_pdf_text(file_path):
#     try:
#         reader = PdfReader(file_path)
#         text = ""
#         for page in reader.pages:
#             page_text = page.extract_text()
#             if page_text:
#                 text += page_text + "\n"
#         return text.strip()
#     except Exception as e:
#         print(f"❌ PDF extraction failed: {file_path}: {e}")
#         return ""

# def chunk_text(text, size=CHUNK_SIZE):
#     chunks = []
#     for i in range(0, len(text), size):
#         chunks.append(text[i:i+size])
#     return chunks

# def embed_text(text):
#     return model.encode(text).tolist()  # convert numpy array to list for pgvector

# def save_to_postgres(startup_name, filename, content, embedding):
#     try:
#         conn = psycopg2.connect(POSTGRES_URL)
#         cur = conn.cursor()
#         # Ensure table names match your schema
#         cur.execute(
#             """
#             INSERT INTO "Document" (startupId, content, embedding)
#             VALUES (%s, %s, %s)
#             """,
#             (startup_name, content, embedding)
#         )
#         conn.commit()
#         cur.close()
#         conn.close()
#     except Exception as e:
#         print(f"❌ DB insert failed for {filename}: {e}")

# # -----------------------
# # MAIN LOOP
# # -----------------------
# for startup in os.listdir(UPLOADS_FOLDER):
#     startup_path = os.path.join(UPLOADS_FOLDER, startup)
#     if not os.path.isdir(startup_path):
#         continue

#     print(f"🟢 Ingesting startup: {startup}")

#     for file_name in os.listdir(startup_path):
#         if not file_name.lower().endswith(".pdf"):
#             continue

#         file_path = os.path.join(startup_path, file_name)
#         text = extract_pdf_text(file_path)
#         if not text:
#             print(f"❌ Skipping empty PDF: {file_path}")
#             continue

#         # Chunk and embed
#         chunks = chunk_text(text)
#         for idx, chunk in enumerate(chunks):
#             try:
#                 embedding = embed_text(chunk)
#                 save_to_postgres(startup, f"{file_name}-chunk{idx}", chunk, embedding)
#             except Exception as e:
#                 print(f"❌ Error processing chunk from {file_path}: {e}")

import os
import psycopg2
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# -----------------------
# CONFIG
# -----------------------
load_dotenv()

POSTGRES_URL = os.getenv("POSTGRES_URL")
UPLOADS_FOLDER = "uploads"
CHUNK_SIZE = 500  # characters per chunk

# -----------------------
# Load embedding model (local Hugging Face)
# -----------------------
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# -----------------------
# FUNCTIONS
# -----------------------
def extract_pdf_text(file_path):
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"❌ PDF extraction failed: {file_path}: {e}")
        return ""

def chunk_text(text, size=CHUNK_SIZE):
    return [text[i:i+size] for i in range(0, len(text), size)]

def embed_text(text):
    return model.encode(text).tolist()  # convert numpy array to list for pgvector

def save_to_postgres(startup_name, filename, content, embedding):
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO "Document" (startupId, content, embedding)
            VALUES (%s, %s, %s)
            """,
            (startup_name, content, embedding)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ DB insert failed for {filename}: {e}")

def fetch_first_two_chunks(startup_name):
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        cur.execute(
            """
            SELECT content, embedding
            FROM "Document"
            WHERE startupId = %s
            ORDER BY createdAt
            LIMIT 2
            """,
            (startup_name,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        print(f"❌ Error fetching chunks for {startup_name}: {e}")
        return []

# -----------------------
# MAIN LOOP
# -----------------------
for startup in os.listdir(UPLOADS_FOLDER):
    startup_path = os.path.join(UPLOADS_FOLDER, startup)
    if not os.path.isdir(startup_path):
        continue

    print(f"🟢 Ingesting startup: {startup}")

    for file_name in os.listdir(startup_path):
        if not file_name.lower().endswith(".pdf"):
            continue

        file_path = os.path.join(startup_path, file_name)
        text = extract_pdf_text(file_path)
        if not text:
            print(f"❌ Skipping empty PDF: {file_path}")
            continue

        chunks = chunk_text(text)
        for idx, chunk in enumerate(chunks):
            try:
                embedding = embed_text(chunk)
                save_to_postgres(startup, f"{file_name}-chunk{idx}", chunk, embedding)
            except Exception as e:
                print(f"❌ Error processing chunk from {file_path}: {e}")

    # After processing startup, fetch & print first 2 chunks
    first_chunks = fetch_first_two_chunks(startup)
    print(f"🔹 First 2 chunks for {startup}:")
    for i, (content, embedding) in enumerate(first_chunks):
        preview = content[:50].replace("\n", " ")  # first 50 chars, clean line breaks
        print(f"  Chunk {i}: preview='{preview}...', length={len(content)}, embedding_dim={len(embedding)}")
