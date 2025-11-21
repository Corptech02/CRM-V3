import json
import logging
import os

import requests
from deepgram import PrerecordedOptions, DeepgramClient
from deepgram.clients.common.v1 import BufferSource
from dotenv import load_dotenv
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

import format_transcript
import surefire_connection

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

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

# Configuration
USERNAME = os.getenv('VICIBOX_USERNAME')
PASSWORD = os.getenv('VICIBOX_PASSWORD')
AUTH_PREFIX = f"{USERNAME}:{PASSWORD}@"
LISTS_URL = f"https://{AUTH_PREFIX}204.13.233.29/vicidial/admin.php?ADD=100"
SEARCH_URL = f"https://{AUTH_PREFIX}204.13.233.29/vicidial/admin_search_lead.php?list_id={{list_id}}&status=SALE&called_count=1"
LEAD_DETAIL_URL = f"https://{AUTH_PREFIX}204.13.233.29/vicidial/admin_modify_lead.php?lead_id={{lead_id}}&archive_search=No&archive_log=0"

# Deepgram API key
DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')
if not DEEPGRAM_API_KEY:
    logger.error("Deepgram API key not found in environment variables")


class LeadScraper:
    def __init__(self):
        self.driver = None
        self.dg_client = None
        self.format_transcript = format_transcript.FormatTranscript()
        self.surefire_connection = surefire_connection.SurefireConnection()
        self.transcriptions = {}  # Store lead_id -> transcription

    def setup_driver(self):
        """Initialize the WebDriver"""
        options = webdriver.FirefoxOptions()
        options.add_argument('--headless')

        self.driver = webdriver.Firefox(options=options)
        self.driver.implicitly_wait(5)
        return self.driver

    def setup_deepgram(self):
        """Initialize the Deepgram client"""
        if DEEPGRAM_API_KEY:
            self.dg_client: DeepgramClient = DeepgramClient(DEEPGRAM_API_KEY)
            # logger.info("Deepgram client initialized")
        else:
            logger.error("Cannot initialize Deepgram - API key missing")

    async def transcribe_audio(self, audio_url, lead_id):
        """Transcribe audio using Deepgram API"""
        if not self.dg_client:
            logger.error("Deepgram client not initialized")
            return None

        try:
            # logger.info(f"Transcribing audio for lead ID {lead_id}")

            file_location = f"audio_files/{audio_url.split('/')[-1]}"

            with open(file_location, "rb") as file:
                buffer_data = file.read()

            payload: BufferSource = {
                "buffer": buffer_data,
            }

            options = PrerecordedOptions(model="nova-3", smart_format=True, diarize=True, punctuate=True)

            response = self.dg_client.listen.rest.v("1").transcribe_file(payload, options)

            transcript = response.to_json(indent=4)

            if transcript:
                # logger.info(f"Transcription obtained for lead ID {lead_id}")
                return transcript
            else:
                logger.warning(f"No transcription obtained for lead ID {lead_id}")
                return None

        except Exception as e:
            logger.error(f"Error transcribing audio for lead ID {lead_id}: {e}")
            return None

    async def get_lead_details(self, lead_id):
        """Get details for a specific lead ID"""
        try:
            lead_info = {}

            # logger.info(f"Getting miscellaneous lead details for lead ID {lead_id}")
            detail_url = LEAD_DETAIL_URL.format(lead_id=lead_id)

            self.driver.get(detail_url)

            wait = WebDriverWait(self.driver, 5)

            vendor_id_textbox_value = wait.until(
                EC.presence_of_element_located((By.ID, "vendor_lead_code"))).get_attribute("value")
            if vendor_id_textbox_value:
                lead_info['vendor_id'] = vendor_id_textbox_value

            first_name_textbox_value = wait.until(EC.presence_of_element_located((By.ID, "first_name"))).get_attribute(
                "value")
            lead_info['contact_name'] = first_name_textbox_value

            last_name_textbox_value = wait.until(EC.presence_of_element_located((By.ID, "last_name"))).get_attribute(
                "value")
            lead_info['company_name'] = last_name_textbox_value

            address_2_textbox_value = wait.until(EC.presence_of_element_located((By.ID, "address2"))).get_attribute(
                "value")
            lead_info['address_2'] = address_2_textbox_value

            address_3_textbox_value = wait.until(EC.presence_of_element_located((By.ID, "address3"))).get_attribute(
                "value")
            lead_info['address_3'] = address_3_textbox_value

            state_textbox_value = wait.until(EC.presence_of_element_located((By.ID, "state"))).get_attribute("value")
            lead_info['state'] = state_textbox_value

            phone_textbox_value = wait.until(EC.presence_of_element_located((By.ID, "phone_number"))).get_attribute(
                "value")
            lead_info['phone'] = phone_textbox_value

            email_textbox_value = wait.until(EC.presence_of_element_located((By.NAME, "email"))).get_attribute("value")
            lead_info['email'] = email_textbox_value

            comments_textbox_value = wait.until(EC.presence_of_element_located((By.ID, "comments"))).get_attribute(
                "value")
            if comments_textbox_value:
                lead_info['comments'] = comments_textbox_value

            return lead_info
        except TimeoutException:
            logger.error("Timeout waiting for lead details to load")
            return {}
        except Exception as e:
            logger.error(f"Error getting lead miscellaneous lead details: {e}")
            return {}

    async def get_list_ids(self):
        """Scrape list IDs from the search page"""
        try:
            # logger.info("Navigating to lists")
            self.driver.get(LISTS_URL)

            wait = WebDriverWait(self.driver, 5)
            table = wait.until(EC.presence_of_element_located((By.XPATH,
                                                               "/html/body/center/table[1]/tbody/tr[1]/td[2]/table/tbody/tr[4]/td/table/tbody/tr/td/font/center/table/tbody")))

            return await self.get_ids_from_table(table, 0)
        except TimeoutException:
            # logger.error("Timeout waiting for table to load")
            return []
        except Exception as e:
            logger.error(f"Error getting lead IDs: {e}")
            return []

    async def get_lead_ids_inside_list(self, list_id):
        """Scrape lead IDs from the search results table"""
        try:
            # logger.info("Navigating to search page")

            search_url = SEARCH_URL.format(list_id=list_id)
            self.driver.get(search_url)

            wait = WebDriverWait(self.driver, 5)
            table = wait.until(EC.presence_of_element_located((By.XPATH, "//center/table//table//table")))

            return await self.get_ids_from_table(table, 1)
        except TimeoutException:
            # logger.error("Timeout waiting for table to load")
            return []
        except Exception as e:
            logger.error(f"Error getting lead IDs: {e}")
            return []

    async def process_lead_details(self, lead_id):
        """Process details for a specific lead ID"""
        try:
            detail_url = LEAD_DETAIL_URL.format(lead_id=lead_id)
            # logger.info(f"Processing lead ID {lead_id}")

            self.driver.get(detail_url)

            WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

            # Find audio source element
            audio_source = self.driver.find_element(By.XPATH,
                                                    "//span[@id='agent_status_stats']//table//tr//td//font//audio//source")
            audio_url = audio_source.get_attribute('src')
            # logger.info(f"Found audio URL: {audio_url}")

            if await self.download_audio_file(audio_url):
                # logger.info(f"Audio file downloaded successfully for lead ID {lead_id}")
                pass
            else:
                logger.error(f"Error downloading audio file for lead ID {lead_id}")

            # Get the other lead info on the page
            lead_info = await self.get_lead_details(lead_id)

            # Transcribe the audio
            transcript = await self.transcribe_audio(audio_url, lead_id)

            if transcript:
                # Extract transcription
                extracted_transcript = await self.extract_transcript(transcript)

                # Call OpenAI to format transcript
                formatted_transcript = await self.format_transcript.format_transcript(extracted_transcript)

                # Create SureFire lead
                await self.surefire_connection.create_new_lead(extracted_transcript, formatted_transcript, lead_info)

                # logger.info(f"Stored transcription for lead ID {lead_id}")

                # Delete the local audio file
                return await self.delete_audio_file(audio_url)
            else:
                logger.warning(f"No transcription obtained for lead ID {lead_id}")
                return False

        except Exception as e:
            logger.error(f"Error processing lead ID {lead_id}: {e}")
            return False

    async def run(self):
        """Main execution method"""
        try:
            self.setup_driver()
            self.setup_deepgram()
            await self.create_audio_folder()

            list_ids = await self.get_list_ids()

            for list_id in list_ids:
                lead_ids = await self.get_lead_ids_inside_list(list_id)

                success_count = 0
                for index, lead_id in enumerate(lead_ids):
                    # logger.info(f"Processing lead {index + 1} of {len(lead_ids)}")
                    if await self.process_lead_details(lead_id):
                        success_count += 1

                    # logger.info(f"Completed processing {success_count} out of {len(lead_ids)} leads")
        except Exception as e:
            logger.error(f"Scraper encountered an error: {e}")
        finally:
            if self.driver:
                self.driver.quit()
                # logger.info("WebDriver closed")

            self.surefire_connection.quit_driver()

            await self.delete_audio_folder()

    @staticmethod
    async def get_ids_from_table(table, column_index):
        """Extract IDs from a table"""
        try:
            rows = table.find_elements(By.TAG_NAME, "tr")

            if not rows:
                logger.warning("No rows found in the table")
                return []

            ids = []
            for row in rows[1:]:  # Skip header row
                try:
                    cells = row.find_elements(By.TAG_NAME, "td")
                    if cells and len(cells) > column_index:
                        column_id = cells[column_index].text.strip()
                        if column_id:
                            ids.append(column_id)
                except Exception as e:
                    logger.error(f"Error extracting lead ID from row: {e}")

            # logger.info(f"Found {len(ids)} IDs")
            return ids
        except TimeoutException:
            # logger.error("Timeout waiting for table to load")
            return []
        except Exception as e:
            logger.error(f"Error getting IDs: {e}")
            return []

    @staticmethod
    async def download_audio_file(audio_url):
        """Download an audio file to the audio_files directory from lead id"""

        # Creates audio_files directory if it doesn't exist
        if not os.path.exists("audio_files"):
            os.makedirs("audio_files")

        response = requests.get(audio_url, params={"downloadformat": "mp3"})
        if response.ok:
            with open(f"audio_files/{audio_url.split('/')[-1]}", "wb") as f:
                f.write(response.content)
            # logger.info(f"Audio file downloaded successfully: {audio_url}")
            return True
        else:
            logger.error(f"Error downloading audio file: {response.status_code}")
            return False

    @staticmethod
    async def delete_audio_file(audio_url):
        """Delete an audio file from the audio_files directory"""
        try:
            os.remove(f"audio_files/{audio_url.split('/')[-1]}")
            # logger.info(f"Audio file deleted successfully: {audio_url}")
            return True
        except Exception as e:
            logger.error(f"Error deleting audio file: {e}")
            return False

    @staticmethod
    async def create_audio_folder():
        """Create the audio_files directory"""
        try:
            if not os.path.exists("audio_files"):
                os.makedirs("audio_files")
                # logger.info("Audio files folder created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating audio files folder: {e}")
            return False

    @staticmethod
    async def delete_audio_folder():
        """Delete the audio_files directory"""
        try:
            os.rmdir("audio_files")
            # logger.info("Audio files folder deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Error deleting audio files folder: {e}")
            return False

    @staticmethod
    async def extract_transcript(transcript):
        """Extract transcript from Deepgram JSON response"""
        try:
            transcript = json.loads(transcript)
            return transcript['results']['channels'][0]['alternatives'][0]['paragraphs']['transcript']
        except (KeyError, IndexError) as e:
            print(f"Error extracting transcript: {e}")
            return None


async def main():
    scraper = LeadScraper()
    await scraper.run()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
