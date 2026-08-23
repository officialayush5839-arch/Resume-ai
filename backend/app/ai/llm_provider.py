from abc import ABC, abstractmethod
from typing import Dict, Any

class LLMProvider(ABC):
    @abstractmethod
    def parse_resume(self, text: str, initial_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

class NoneProvider(LLMProvider):
    def parse_resume(self, text: str, initial_data: Dict[str, Any]) -> Dict[str, Any]:
        # Just returns the regex/NLP extracted data without LLM enrichment
        return initial_data

class OllamaProvider(LLMProvider):
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name
        
    def parse_resume(self, text: str, initial_data: Dict[str, Any]) -> Dict[str, Any]:
        # Placeholder for Ollama API call
        # e.g., requests.post('http://localhost:11434/api/generate', ...)
        # Merge initial_data with LLM extracted data
        return initial_data
