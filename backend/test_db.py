import sys
import os

# Add the current directory to sys.path so we can import from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import WidgetConfig

db = SessionLocal()
try:
    widgets = db.query(WidgetConfig).all()
    print("SUCCESS")
    print(f"Found {len(widgets)} widgets")
    for w in widgets:
        print(f"Widget {w.id}: is_active={w.is_active}")
except Exception as e:
    print("FAILED")
    print(e)
finally:
    db.close()
