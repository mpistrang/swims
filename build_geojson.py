import json
import os

from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2 import service_account


SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


def get_google_credentials():
    """
    Load Google service account credentials.

    Priority:
    1. GOOGLE_SERVICE_ACCOUNT_JSON (JSON string)
    2. GOOGLE_APPLICATION_CREDENTIALS (path to JSON file)

    Returns:
        google.oauth2.service_account.Credentials
    """
    # 1️⃣ JSON in env var (CI / preferred)
    json_env = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if json_env:
        try:
            info = json.loads(json_env)
        except json.JSONDecodeError as e:
            raise RuntimeError(
                "GOOGLE_SERVICE_ACCOUNT_JSON is set but is not valid JSON"
            ) from e

        return service_account.Credentials.from_service_account_info(
            info,
            scopes=SCOPES,
        )

    # 2️⃣ File path fallback
    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if path:
        if not os.path.exists(path):
            raise RuntimeError(f"GOOGLE_APPLICATION_CREDENTIALS file not found: {path}")

        return service_account.Credentials.from_service_account_file(
            path,
            scopes=SCOPES,
        )

    # 3️⃣ Nothing configured
    raise RuntimeError(
        "No Google credentials found. "
        "Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS."
    )


def get_data_from_google_sheet():
    creds = get_google_credentials()

    service = build("sheets", "v4", credentials=creds)

    sheet = service.spreadsheets()
    result = (
        sheet.values()
        .get(
            spreadsheetId=os.environ["DAVID_SWIMS_SPREADSHEET_ID"],
            range=os.environ["DAVID_SWIMS_DATA_RANGE"],
        )
        .execute()
    )
    values = result.get("values", [])

    headers = values.pop(0)

    for row in values:
        yield {k: v for k, v in zip(headers, row)}


def convert_row_to_geojson(row):

    try:
        lat, lon = row["Coordinates"].split(",")
    except Exception as e:
        print(f"Swim {row['Swim #']} is invalid, skipping.")
        return None
    swim_geojson = {
        "type": "Feature",
        "properties": {
            "year": int(row["Year"]),
            "month": row["Month"],
            "day": int(row["Day"]),
            "number": int(row["Swim #"]),
        },
        "geometry": {
            "type": "Point",
            "coordinates": [float(lon), float(lat)],  # lon, lat
        },
    }
    return swim_geojson


def get_swims_geojson():
    rows = (convert_row_to_geojson(row) for row in get_data_from_google_sheet())
    filtered_rows = filter(lambda x: x, rows)
    yield from filtered_rows


def main():
    raw_data = get_data_from_google_sheet()
    swims_geojson = (convert_row_to_geojson(row) for row in raw_data)

    geojson = {"type": "FeatureCollection", "features": list(swims_geojson)}

    with open("./site-content/swims.geojson", "w") as f:
        json.dump(geojson, f)


if __name__ == "__main__":
    main()
