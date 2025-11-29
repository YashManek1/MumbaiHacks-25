import pandas as pd
import pytesseract
from PIL import Image
import io
from datetime import date
import re


# --- 1. Categorization Logic ---
def simple_categorize(description: str) -> str:
    """
    Rule-based categorization tailored for the Indian Context.
    """
    desc = description.lower()

    # Housing & Utilities
    if any(
        x in desc
        for x in [
            "rent",
            "electricity",
            "bill",
            "wifi",
            "broadband",
            "maintenance",
            "gas",
            "bses",
            "mahavitaran",
        ]
    ):
        return "Housing & Utilities"

    # Transportation
    elif any(
        x in desc
        for x in [
            "uber",
            "ola",
            "fuel",
            "petrol",
            "diesel",
            "metro",
            "auto",
            "irctc",
            "fastag",
        ]
    ):
        return "Transportation"

    # Groceries (Indian Context) - Updated List
    elif any(
        x in desc
        for x in [
            "grocery",
            "mart",
            "vegetable",
            "milk",
            "dairy",
            "kirana",
            "bigbasket",
            "blinkit",
            "zepto",
            "dmart",
            "big bazaar",  # FIX: Added
            "reliance",  # FIX: Added
            "star bazaar",  # FIX: Added
            "spencers",  # FIX: Added
            "more",  # FIX: Added (More Retail)
            "nature's basket",  # FIX: Added
        ]
    ):
        return "Groceries & Essentials"

    # Dining & Lifestyle
    elif any(
        x in desc
        for x in [
            "restaurant",
            "food",
            "burger",
            "pizza",
            "coffee",
            "swiggy",
            "zomato",
            "cafe",
            "bar",
            "cinema",
            "bookmyshow",
        ]
    ):
        return "Dining & Lifestyle"

    # Domestic Help
    elif any(
        x in desc for x in ["maid", "cook", "cleaner", "helper", "salary", "driver"]
    ):
        return "Domestic Help"

    # Health
    elif any(
        x in desc
        for x in [
            "pharmacy",
            "medical",
            "doctor",
            "hospital",
            "1mg",
            "apollo",
            "medplus",
            "lab",
        ]
    ):
        return "Health & Medical"

    # Investments & Savings
    elif any(
        x in desc
        for x in [
            "sip",
            "mutual fund",
            "zerodha",
            "groww",
            "stocks",
            "ppf",
            "lic",
            "insurance",
            "premium",
        ]
    ):
        return "Savings & Investments"

    return "Miscellaneous"


# --- 2. CSV Parser ---
def parse_csv(file_content: bytes) -> list[dict]:
    """
    Parses a CSV file and returns a list of dicts ready for the Transaction model.
    """
    try:
        df = pd.read_csv(io.BytesIO(file_content))
        transactions = []
        for _, row in df.iterrows():
            desc = row.get("description", "Unknown")
            transactions.append(
                {
                    "transaction_date": pd.to_datetime(
                        row.get("transaction_date", date.today())
                    ).date(),
                    "description": desc,
                    "amount": float(row.get("amount", 0.0)),
                    "category": simple_categorize(desc),
                    "source": "csv",
                }
            )
        return transactions
    except Exception as e:
        print(f"Error parsing CSV: {e}")
        return []


# --- 3. OCR Parser ---
def parse_receipt_image(file_content: bytes) -> dict:
    """
    Uses OCR to extract amount from an image.
    """
    try:
        image = Image.open(io.BytesIO(file_content))
        text = pytesseract.image_to_string(image)

        matches = re.findall(r"(?:₹|\$)?(\d+(?:\.\d{1,2})?)", text)
        amount = 0.0
        if matches:
            # Take the largest number found as the probable total
            amount = float(sorted([float(m) for m in matches])[-1])

        return {
            "transaction_date": date.today(),
            "description": "OCR Receipt Scan",
            "amount": amount,
            "category": "Uncategorized",  # User should update categorization manually if OCR fails context
            "source": "image",
        }
    except Exception as e:
        print(f"Error parsing Image: {e}")
        return None
