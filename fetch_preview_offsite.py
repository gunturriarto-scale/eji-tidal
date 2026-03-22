import pandas as pd
import sys

sheet_id = '1jl0wFIfNEWYofEHN27Wb9UM1bdmoxzt5e2NUGyFijHY'
url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet=OFFSITE"

try:
    print(f"--- OFFSITE ---")
    df = pd.read_csv(url)
    print("Columns:", list(df.columns))
    print("First row:\n", df.head(1).to_dict('records')[0])
    print("\n")
except Exception as e:
    print("Error:", e)

