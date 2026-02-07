import os
import json
import re
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Try to import Google GenAI
try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    logging.warning("google-genai library not found. Running in Heuristic Mode.")

class JarvisBrain:
    def __init__(self, api_key=None, model_name="gemini-2.0-flash"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.model_name = model_name
        self.client = None
        
        if self.api_key and HAS_GENAI:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logging.info(f"JarvisBrain initialized with {model_name}")
            except Exception as e:
                logging.error(f"Failed to initialize GenAI client: {e}")
        else:
            logging.info("JarvisBrain initialized in Fallback Mode (No API Key or Library)")

    def route_intent(self, user_text, context_history=None):
        """
        Routes user text to a structured intent.
        
        Args:
            user_text (str): The latest user command.
            context_history (list): Optional list of recent conversation turns [{"role": "user", "text": "..."}]
        """
        logging.info(f"Routing intent for: '{user_text}'")
        
        if self.client:
            return self._route_llm(user_text, context_history)
        else:
            return self._route_heuristic(user_text)

    def _route_llm(self, text, history):
        history_str = ""
        if history:
            history_str = "Context:\n" + "\n".join([f"{msg['role']}: {msg['text']}" for msg in history[-5:]])
        
        prompt = f"""
        You are the Brain of JARVIS, an advanced AI Operating System.
        Your job is to classify the User's intent into a JSON structure.
        
        AVAILABLE INTENTS:
        - analyze_video: Run ML models on video (FP analysis, tracking).
        - deploy_code: Deploy web apps, scripts, or infrastructure.
        - system_control: Manage background processes, batch jobs, or local files.
        - web_research: Search the web for information.
        - voice_chat: Initiate or manage voice calls.
        - general_chat: Casual conversation or simple questions.
        - project_omega: Specific to Math Viz / Quadratic function app.
        
        {history_str}
        
        User Request: "{text}"
        
        Return JSON with:
        - intent: (string) One of the above.
        - parameters: (dict) Extracted entities (e.g., video_id, url, code_path).
        - confidence: (float) 0.0 to 1.0.
        - reasoning: (string) Brief explanation.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except Exception as e:
            logging.error(f"LLM Routing failed: {e}")
            return self._route_heuristic(text)

    def _route_heuristic(self, text):
        """Robust fallback for when LLM is unavailable."""
        text = text.lower()
        
        intent = "general_chat"
        parameters = {}
        confidence = 0.5
        
        # Heuristic Rules
        if any(w in text for w in ["analyze", "fp", "false positive", "detection"]):
            intent = "analyze_video"
            confidence = 0.85
            # Extract potential ID
            match = re.search(r'\d{6,}', text) # IDs are usually long
            if match:
                parameters["video_id"] = match.group(0)
                
        elif any(w in text for w in ["deploy", "start server", "run app"]):
            intent = "deploy_code"
            confidence = 0.8
            if "omega" in text or "math" in text:
                intent = "project_omega"
                parameters["action"] = "deploy"
                
        elif "omega" in text or "niji" in text:
            intent = "project_omega"
            confidence = 0.9
            
        elif any(w in text for w in ["call", "voice", "speak"]):
            intent = "voice_chat"
            confidence = 0.9
            
        elif any(w in text for w in ["search", "google", "find"]):
            intent = "web_research"
            parameters["query"] = text.replace("search", "").strip()
            confidence = 0.8
            
        return {
            "intent": intent,
            "parameters": parameters,
            "confidence": confidence,
            "reasoning": "Heuristic match"
        }

if __name__ == "__main__":
    # Test CLI
    brain = JarvisBrain()
    
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "Check the status of Project Omega deployment"
        
    result = brain.route_intent(query)
    print(json.dumps(result, indent=2))
