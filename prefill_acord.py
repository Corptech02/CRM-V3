#!/usr/bin/env python3
"""
ACORD 25 PDF Prefiller
Adds "Grant Corp" as Authorized Representative to the ACORD 25 form
"""

from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
import sys
import os

def create_overlay():
    """Create a transparent overlay with Grant Corp text"""
    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)

    # Set font for the text
    can.setFont("Helvetica-Bold", 10)

    # Add "Grant Corp" at the Authorized Representative position
    # ACORD 25 form - Authorized Representative field is at bottom right
    # Adjusted coordinates for better visibility
    can.drawString(420, 115, "Grant Corp")  # Bottom right area, more visible position

    # Add producer information
    can.setFont("Helvetica", 9)
    can.drawString(45, 640, "Vanguard Insurance Agency")
    can.drawString(45, 628, "123 Insurance Blvd, Suite 100")
    can.drawString(45, 616, "New York, NY 10001")

    # Producer contact info
    can.drawString(230, 640, "(555) 123-4567")  # Phone
    can.drawString(230, 628, "(555) 123-4568")  # Fax

    can.save()
    packet.seek(0)
    return PdfReader(packet)

def prefill_acord(input_path, output_path):
    """Prefill the ACORD 25 form with Grant Corp"""
    try:
        # Read the existing PDF
        existing_pdf = PdfReader(open(input_path, "rb"))
        output = PdfWriter()

        # Create the overlay
        overlay_pdf = create_overlay()
        overlay_page = overlay_pdf.pages[0]

        # Merge overlay with first page
        page = existing_pdf.pages[0]
        page.merge_page(overlay_page)
        output.add_page(page)

        # Add remaining pages if any
        for i in range(1, len(existing_pdf.pages)):
            output.add_page(existing_pdf.pages[i])

        # Write the output
        with open(output_path, "wb") as output_stream:
            output.write(output_stream)

        print(f"Successfully created prefilled ACORD at: {output_path}")
        return True

    except Exception as e:
        print(f"Error prefilling ACORD: {e}")
        return False

if __name__ == "__main__":
    input_file = "/var/www/vanguard/ACORD_25_fillable.pdf"
    output_file = "/var/www/vanguard/ACORD_25_prefilled.pdf"

    if os.path.exists(input_file):
        success = prefill_acord(input_file, output_file)
        if success:
            print("✅ ACORD 25 prefilled with Grant Corp")
        else:
            print("❌ Failed to prefill ACORD 25")
    else:
        print(f"❌ Input file not found: {input_file}")