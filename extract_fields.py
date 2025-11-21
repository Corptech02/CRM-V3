#!/usr/bin/env python3
"""Extract exact field positions from ACORD 25 fillable PDF"""

import PyPDF2
import json
from PyPDF2 import PdfReader

def extract_field_info():
    """Extract all form field information from the PDF"""

    pdf_path = '/var/www/vanguard/ACORD_25_fillable.pdf'

    try:
        # Open the PDF
        with open(pdf_path, 'rb') as file:
            reader = PdfReader(file)

            # Get the first page (ACORD 25 is single page)
            page = reader.pages[0]

            # Get page dimensions
            page_width = float(page.mediabox.width)
            page_height = float(page.mediabox.height)

            print(f"Page dimensions: {page_width} x {page_height} points")
            print(f"Page dimensions: {page_width/72:.1f} x {page_height/72:.1f} inches")
            print("\n" + "="*50 + "\n")

            # Get form fields if they exist
            if '/AcroForm' in reader.trailer['/Root']:
                fields = reader.get_fields()

                field_list = []

                for field_name, field_obj in fields.items():
                    field_info = {
                        'name': field_name,
                        'type': field_obj.get('/FT', 'Unknown')
                    }

                    # Get field rectangle (position and size)
                    if '/Rect' in field_obj:
                        rect = field_obj['/Rect']
                        # rect is [x1, y1, x2, y2] where (x1,y1) is bottom-left and (x2,y2) is top-right
                        x1, y1, x2, y2 = [float(x) for x in rect]

                        # Convert to top-left origin for web (PDF uses bottom-left)
                        # Also scale for our canvas at 1.3x
                        scale = 1.3

                        field_info['x'] = round(x1 * scale)
                        field_info['y'] = round((page_height - y2) * scale)  # Flip Y coordinate
                        field_info['width'] = round((x2 - x1) * scale)
                        field_info['height'] = round((y2 - y1) * scale)

                        # Store original PDF coordinates too
                        field_info['pdf_coords'] = {
                            'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2
                        }

                    # Get default value if exists
                    if '/V' in field_obj:
                        field_info['default_value'] = str(field_obj['/V'])

                    # Check if it's a checkbox
                    if field_obj.get('/FT') == '/Btn':
                        field_info['type'] = 'checkbox'
                    elif field_obj.get('/FT') == '/Tx':
                        field_info['type'] = 'text'
                        # Check if multiline
                        if field_obj.get('/Ff', 0) & 4096:  # Multiline flag
                            field_info['type'] = 'textarea'

                    field_list.append(field_info)

                # Sort by Y position (top to bottom) then X (left to right)
                field_list.sort(key=lambda f: (f.get('y', 0), f.get('x', 0)))

                # Print formatted output
                print("EXTRACTED FORM FIELDS (scaled for 1.3x canvas):\n")
                print("```javascript")
                print("const fields = [")

                for i, field in enumerate(field_list):
                    if 'x' in field:
                        type_str = f"type: '{field['type']}', " if field['type'] != 'text' else ""
                        print(f"    {{ id: '{field['name']}', x: {field['x']}, y: {field['y']}, "
                              f"width: {field['width']}, height: {field['height']}, {type_str}"),

                        # Add default value if exists
                        if 'default_value' in field and field['default_value']:
                            print(f"value: '{field['default_value']}', "),

                        print("},")

                        # Also print readable description
                        print(f"    // {field['name']} at ({field['x']}, {field['y']}) size {field['width']}x{field['height']}")

                print("];")
                print("```\n")

                # Save to JSON file
                with open('/var/www/vanguard/acord_fields.json', 'w') as f:
                    json.dump(field_list, f, indent=2)
                print(f"\nSaved {len(field_list)} fields to acord_fields.json")

            else:
                print("No form fields found in PDF")

                # Try alternative method - look for annotations
                if '/Annots' in page:
                    print("\nFound annotations on page:")
                    annots = page['/Annots']
                    for annot in annots:
                        annot_obj = annot.get_object()
                        if '/Rect' in annot_obj:
                            rect = annot_obj['/Rect']
                            print(f"  Annotation: {rect}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    extract_field_info()