import argparse
import csv
import json

TAB_DELIMITER = '	'


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


def get_swims_geojson(filename):
    with open(filename, 'r') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=TAB_DELIMITER)
        for row in reader:
            row['Year'] = "2003"  # hardcoded for now
            yield convert_row_to_geojson(row)


def main():
    parser = argparse.ArgumentParser(
        description='Convert tab-seperated tsv into geojson.')
    parser.add_argument('filename', type=str,
                        help='Filename of the .tsv to load')
    args = parser.parse_args()

    swims_geojson = get_swims_geojson(args.filename)

    geojson = {
        "type": "FeatureCollection",
        "features": list(swims_geojson)
    }

    with open('./docs/swims.geojson', 'w') as f:
        json.dump(geojson, f, indent=4)


if __name__ == '__main__':
    main()
