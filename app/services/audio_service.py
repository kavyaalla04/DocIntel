"""Audio & Text-to-Speech (TTS) Generation Service"""
import os
import logging
import uuid
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class AudioService:
    """Audio generation service for structured document briefings"""

    def __init__(self):
        self.audio_dir = os.path.join(settings.UPLOAD_DIR, "audio")
        os.makedirs(self.audio_dir, exist_ok=True)

    async def generate_audio_briefing(
        self,
        summary_id: str,
        text_script: str,
        language: str = "en",
        speed: float = 1.0
    ) -> Dict[str, Any]:
        """Generate audio MP3 file from summary script using gTTS with graceful fallback"""
        audio_filename = f"briefing_{summary_id}_{uuid.uuid4().hex[:6]}.mp3"
        audio_path = os.path.join(self.audio_dir, audio_filename)

        lang_code_map = {
            "english": "en",
            "hindi": "hi",
            "tamil": "ta",
            "spanish": "es",
            "french": "fr",
            "german": "de",
            "japanese": "ja",
            "arabic": "ar"
        }
        lang_code = lang_code_map.get(language.lower(), "en")

        try:
            from gtts import gTTS
            tts = gTTS(text=text_script[:1500], lang=lang_code, slow=(speed < 0.9))
            tts.save(audio_path)
            has_file = True
            logger.info(f"✓ Audio briefing generated at {audio_path}")
        except Exception as e:
            logger.warning(f"gTTS audio generation notice ({e}). Utilizing Web Speech API payload fallback.")
            has_file = False

        duration_est = max(10, int(len(text_script.split()) / 2.5))
        return {
            "audioUrl": f"/api/v1/audio/stream/{audio_filename}" if has_file else None,
            "filename": audio_filename,
            "durationSeconds": duration_est,
            "language": language,
            "script": text_script,
            "hasAudioFile": has_file
        }


audio_service = AudioService()
