import datetime
import logging

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

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
CREATE_LEAD_URL = "http://67.211.213.162:5000/Leads/Create"


class SurefireConnection:
    def __init__(self):
        self.driver = self.setup_driver()

    def setup_driver(self):
        """Initialize the WebDriver"""
        options = webdriver.FirefoxOptions()
        options.add_argument('--headless')

        self.driver = webdriver.Firefox(options=options)
        self.driver.implicitly_wait(5)
        return self.driver

    def quit_driver(self):
        """Quit the WebDriver"""
        self.driver.quit()

    async def check_for_login_page(self):
        """Check if a page with a submitbtn appears and click it if found"""
        try:
            wait = WebDriverWait(self.driver, 5)
            submit_button = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "submitbtn")))

            # logger.info("Login page appeared - clicking submit button to proceed")
            submit_button.click()
            return True
        except TimeoutException:
            return False
        except Exception as e:
            logger.error(f"Error while checking for conditional page: {e}")
            return False

    async def create_new_lead(self, transcript, formatted_transcript: str, lead_info_json):
        """Create a new lead in Surefire"""
        try:
            # logger.info("Navigating to create lead page")
            self.driver.get(CREATE_LEAD_URL)

            # Check for the login page
            await self.check_for_login_page()

            wait = WebDriverWait(self.driver, 5)

            company_textbox = wait.until(EC.presence_of_element_located((By.ID, "companyName")))
            company_textbox.send_keys(lead_info_json['company_name'])

            company_textbox = wait.until(EC.presence_of_element_located((By.ID, "contactName")))
            company_textbox.send_keys(lead_info_json['contact_name'])

            phone_textbox = wait.until(EC.presence_of_element_located((By.ID, "phoneNumber")))
            phone_textbox.send_keys(lead_info_json['phone'])

            email_textbox = wait.until(EC.presence_of_element_located((By.ID, "email")))
            email_textbox.send_keys(lead_info_json['email'])

            operations_textbox = wait.until(EC.presence_of_element_located((By.ID, "operations")))
            formatted_operations_textbox_value = f"{lead_info_json['address_2']}, {lead_info_json['address_3']}, {lead_info_json['state']}, {lead_info_json['comments'] if 'comments' in lead_info_json else ' '}"
            operations_textbox.send_keys(formatted_operations_textbox_value)

            select_stage_textbox = wait.until(EC.presence_of_element_located(
                (By.XPATH, "/html/body/div[2]/main/article/div[2]/div/form/div/div[2]/div[1]")))
            select_stage_textbox.send_keys("N")

            notes_textbox = wait.until(EC.presence_of_element_located((By.ID, "notes")))
            formatted_transcript = formatted_transcript.replace("    ", "&nbsp;&nbsp;&nbsp;&nbsp;")
            combined_transcripts = f"{formatted_transcript}<br><br><br>{transcript}"
            combined_transcripts = combined_transcripts.replace("\n", "<br>\n")
            notes_textbox.send_keys(combined_transcripts)

            select_product_textbox = wait.until(EC.presence_of_element_located(
                (By.XPATH, "/html/body/div[2]/main/article/div[2]/div/form/div/div[2]/div[4]/div")))
            select_product_textbox.send_keys("C")

            if 'vendor_id' in lead_info_json:
                try:
                    select_bind_date_textbox = wait.until(EC.presence_of_element_located(
                        (By.XPATH, "/html/body/div[2]/main/article/div[2]/div/form/div/div[2]/div[5]/input[1]")))
                    formatted_date = f"{lead_info_json['vendor_id'].split('/')[0].lstrip('0')}/{lead_info_json['vendor_id'].split('/')[1]}/{datetime.datetime.now().year}"
                    select_bind_date_textbox.send_keys(formatted_date)
                except Exception as e:
                    logger.error(f"Error while inputting bind date: {e}")

            submit_button = wait.until(
                EC.presence_of_element_located((By.XPATH, "/html/body/div[2]/main/article/div[2]/div/form/button")))
            submit_button.click()

            # logger.info("Lead created successfully")
        except TimeoutException:
            logger.error("Timeout waiting for page to load")
        except Exception as e:
            logger.error(f"Error while creating lead: {e}")
