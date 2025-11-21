import os
import logging
from dotenv import load_dotenv
from openai import OpenAI
from ai_prompts import formatting_system_prompt

load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class FormatTranscript:
    def __init__(self):
        self.client = None
        self.setup_openai()

    def setup_openai(self):
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            logger.error("OpenAI API key not found in environment variables")
        self.client = OpenAI(api_key=openai_api_key)

    async def format_transcript(self, transcript):
        """Format the transcript using OpenAI's GPT-4o-mini model."""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": formatting_system_prompt},
                {"role": "user", "content": transcript}
            ]
        )

        return response.choices[0].message.content
