import os
import sys
import time
from google import genai
from google.genai import types

def transcribe_file(client, audio_path, output_path, label):
    print(f"[*] Uploading {audio_path}...")
    uploaded_file = client.files.upload(file=audio_path)
    print(f"[*] Uploaded as {uploaded_file.name}, state: {uploaded_file.state}")
    
    # Wait for processing if needed
    while uploaded_file.state == types.FileState.PROCESSING:
        print("Waiting for file to process...")
        time.sleep(5)
        uploaded_file = client.files.get(name=uploaded_file.name)
        
    if uploaded_file.state == types.FileState.FAILED:
        raise Exception(f"File processing failed: {uploaded_file.error}")
        
    print(f"[*] File active. Generating complete transcription for {label}...")
    prompt = """You are transcribing an important business & technical conversation between a developer/architect and a senior sir (mentor/boss/client) discussing a College ERP system.

Your task is:
1. Provide a COMPLETE, EXHAUSTIVE, WORD-BY-WORD (verbatim) transcript of everything said in this recording. Preserve all Punjabi, Hindi, and English words exactly as spoken. Attribute speakers (e.g., [Sir], [Guri / User]).
2. Provide an exhaustive, granular list of ALL REQUIREMENTS, architectural decisions, database tables, field definitions, UI rules, workflows, roles, edge cases, and specific instructions given by the Sir.
3. Highlight every specific detail: UID format, database choices, college codes, state codes, department handling, staff records, student records, partner portal, admissions CRM, telephony/calling, password recovery, UI look and feel, colors, headers, tables, etc.

Do not skip, summarize, or omit anything. Be as detailed as possible."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[uploaded_file, prompt],
        config=types.GenerateContentConfig(
            temperature=0.2,
        )
    )
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(response.text)
        
    print(f"[+] Saved transcription to {output_path}")

def main():
    client = genai.Client()
    
    os.makedirs("/root/college-erp-educore/audio", exist_ok=True)
    
    rec160 = "/root/college-erp-educore/audio/standardrecording160.mp3"
    rec161 = "/root/college-erp-educore/audio/standardrecording161.mp3"
    
    if os.path.exists(rec160):
        transcribe_file(client, rec160, "/root/college-erp-educore/audio/transcript_recording_160.md", "Recording 160")
    if os.path.exists(rec161):
        transcribe_file(client, rec161, "/root/college-erp-educore/audio/transcript_recording_161.md", "Recording 161")

if __name__ == "__main__":
    main()
