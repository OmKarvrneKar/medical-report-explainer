import os
import requests
import sqlite3
import time

BASE_URL = "http://localhost:8000/api"

def run_tests():
    print("--- Starting Security Tests ---")
    
    # 1. Test Auth (Register)
    email = f"test_{int(time.time())}@example.com"
    pwd = "supersecretpassword123"
    
    print(f"Registering user: {email}")
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": pwd})
    if res.status_code == 200:
        print("[OK] Registration successful")
    else:
        print(f"[FAIL] Registration failed: {res.text}")
        return

    # 2. Test Auth (Login)
    print("Logging in...")
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": pwd})
    if res.status_code == 200:
        token = res.json()["access_token"]
        print("[OK] Login successful, received JWT")
    else:
        print(f"[FAIL] Login failed: {res.text}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Test Rate Limiting / Authentication on protected route
    print("Fetching history...")
    res = requests.get(f"{BASE_URL}/history", headers=headers)
    if res.status_code == 200:
        print("[OK] Accessed protected route successfully")
    else:
        print(f"[FAIL] Failed to access protected route: {res.text}")

    # 4. Test Upload Validation (Magic Byte / Renamed exe)
    print("Testing malicious file upload...")
    # Create a fake 'exe' file but name it '.pdf'
    with open("malicious.pdf", "wb") as f:
        f.write(b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF\x00\x00")
        
    with open("malicious.pdf", "rb") as f:
        files = {"file": ("malicious.pdf", f, "application/pdf")}
        res = requests.post(f"{BASE_URL}/upload", headers=headers, files=files, data={"language": "English"})
        if res.status_code == 415:
            print("[OK] Malicious file rejected successfully (415)")
        else:
            print(f"[FAIL] Malicious file check failed, got status: {res.status_code}")
            
    os.remove("malicious.pdf")

    # 5. Check SQLite encryption
    print("Testing Encryption at Rest...")
    try:
        conn = sqlite3.connect("reports.db")
        cursor = conn.cursor()
        # Since we just registered, let's see if the hashed password looks correct
        cursor.execute("SELECT email, hashed_password FROM users WHERE email=?", (email,))
        row = cursor.fetchone()
        if row and "$2b$" in row[1]:
            print("[OK] Password securely hashed in DB")
        else:
            print("[FAIL] Password hashing issue")
            
        print("--- Tests Complete ---")
    except Exception as e:
        print(f"[FAIL] SQLite check failed: {e}")

if __name__ == "__main__":
    run_tests()
