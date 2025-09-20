import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Make sure this environment variable is set
DB_URL = os.getenv("POSTGRES_URL")

def fetch_chunks():
    try:
        conn = psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)
        cur = conn.cursor()

        # Fetch all startups
        cur.execute('SELECT id, name FROM "Startup" ORDER BY name;')
        startups = cur.fetchall()

        for startup in startups:
            print(f"\n🟢 Startup: {startup['name']} (ID: {startup['id']})")
            
            # Fetch chunks for this startup
            cur.execute(
                'SELECT id, content, createdAt FROM "Document" WHERE "startupId" = %s ORDER BY "createdAt";',
                (startup['id'],)
            )
            chunks = cur.fetchall()
            
            if not chunks:
                print("  No chunks found.")
                continue

            for i, chunk in enumerate(chunks, 1):
                print(f"  Chunk {i}: {chunk['content'][:150]}...")  # first 150 chars

        cur.close()
        conn.close()
    except Exception as e:
        print("❌ Error fetching chunks:", e)

if __name__ == "__main__":
    fetch_chunks()
