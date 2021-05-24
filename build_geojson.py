import json
import os

from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials


SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']


def get_data_from_google_sheet():
    creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('sheets', 'v4', credentials=creds)

    sheet = service.spreadsheets()
    result = sheet.values().get(spreadsheetId=os.environ['DAVID_SWIMS_SPREADSHEET_ID'],
                                range=os.environ['DAVID_SWIMS_DATA_RANGE']).execute()
    values = result.get('values', [])

    headers = values.pop(0)

    for row in values:
        yield {k: v for k, v in zip(headers, row)}


def convert_row_to_geojson(row):

    lat, lon = row['Coordinates'].split(",")
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
            "coordinates": [float(lon), float(lat)]  # lon, lat
        }
    }
    return swim_geojson


def get_swims_geojson():
    yield from (convert_row_to_geojson(row) for row in get_data_from_google_sheet())


def main():
    raw_data = get_data_from_google_sheet()
    swims_geojson = (convert_row_to_geojson(row) for row in raw_data)

    geojson = {
        "type": "FeatureCollection",
        "features": list(swims_geojson)
    }

    with open('./site-content/swims.geojson', 'w') as f:
        json.dump(geojson, f)


if __name__ == '__main__':
    main()
