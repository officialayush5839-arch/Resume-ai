import re

def clean_text(text: str) -> str:
    # Remove zero-width spaces and non-printable characters
    text = re.sub(r'[\u200b\u200e\u200f]', '', text)
    # Replace multiple spaces with a single space
    text = re.sub(r' +', ' ', text)
    # Replace multiple newlines with a double newline
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip leading/trailing whitespace
    return text.strip()
