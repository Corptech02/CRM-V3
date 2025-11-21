import logging
import os
import sys

from selenium import webdriver
import sqlite3

from lead_scraper import LeadScraper

# Add parent directory to path to import modules from parent directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

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


class ScraperScheduler:
    def __init__(self):
        self.driver = None
        self.scraper = LeadScraper()
        self.db_path = os.path.join(os.path.dirname(__file__), 'ids.db')

    def setup_driver(self):
        """Initialize the WebDriver"""
        options = webdriver.FirefoxOptions()
        options.add_argument('--headless')

        self.driver = webdriver.Firefox(options=options)
        self.driver.implicitly_wait(5)
        return self.driver

    def setup_db_connection(self):
        """Initialize the SQLite database connection"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create the table if it doesn't exist
        cursor.execute('''
                       CREATE TABLE IF NOT EXISTS ids
                       (
                           id TEXT PRIMARY KEY
                       )
                       ''')
        conn.commit()
        return conn, cursor

    @staticmethod
    def get_all_processed_ids(cursor):
        """Get all processed IDs from the database"""
        cursor.execute("SELECT id FROM ids")
        return {row[0] for row in cursor.fetchall()}

    @staticmethod
    async def mark_lead_as_processed(lead_id, conn, cursor):
        """Mark a lead as processed in the database"""
        cursor.execute("INSERT INTO ids (id) VALUES (?)", (lead_id,))
        conn.commit()

    async def run(self):
        """Main execution method"""
        conn = None
        try:
            # Setup database connection
            conn, cursor = self.setup_db_connection()

            # Get all processed IDs in the database
            processed_ids = self.get_all_processed_ids(cursor)
            # logger.info(f"Found {len(processed_ids)} already processed IDs in the database")

            # Setup WebDriver
            self.scraper.setup_driver()
            self.scraper.setup_deepgram()
            await self.scraper.create_audio_folder()

            # Get all list IDs
            list_ids = await self.scraper.get_list_ids()
            # logger.info(f"Found {len(list_ids)} list IDs")

            # Process each list
            for list_id in list_ids:
                # Get lead IDs for this list
                lead_ids = await self.scraper.get_lead_ids_inside_list(list_id)

                # Process each lead
                for lead_id in lead_ids:
                    # Check if the lead ID has already been processed
                    if lead_id not in processed_ids:
                        try:
                            # Process the lead details
                            success = await self.scraper.process_lead_details(lead_id)

                            if success:
                                # Mark as processed
                                await self.mark_lead_as_processed(lead_id, conn, cursor)
                                processed_ids.add(lead_id)  # Add to in-memory set
                                # logger.info(f"Successfully processed lead {lead_id}")
                            else:
                                logger.warning(f"Failed to process lead {lead_id}")
                        except Exception as e:
                            logger.error(f"Error processing lead {lead_id}: {e}")
                    else:
                        # logger.info(f"Lead {lead_id} already processed, skipping")
                        pass
        except Exception as e:
            logger.error(f"Scheduler encountered an error: {e}")
        finally:
            if hasattr(self, 'conn') and 'conn' in locals():
                conn.close()
                # logger.info("Database connection closed")

            if self.scraper.driver:
                self.scraper.driver.quit()
                # logger.info("WebDriver closed")

            self.scraper.surefire_connection.quit_driver()

            await self.scraper.delete_audio_folder()


async def main():
    scheduler = ScraperScheduler()
    await scheduler.run()


if __name__ == '__main__':
    import asyncio

    asyncio.run(main())
