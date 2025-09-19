#!/usr/bin/env python3
"""
Convert GeoJSON to regular JSON format for web application.
"""

import json

def convert_geojson_to_json():
    """Convert the GeoJSON file to a regular JSON format."""
    
    # Read the GeoJSON file
    with open('data/shelters.geojson', 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    # The GeoJSON is already in the correct format for our JavaScript
    # We just need to copy it as a JSON file
    with open('data/shelters_with_gmaps.json', 'w', encoding='utf-8') as f:
        json.dump(geojson_data, f, indent=2, ensure_ascii=False)
    
    print("Converted GeoJSON to JSON format successfully!")
    print(f"Features count: {len(geojson_data['features'])}")

if __name__ == "__main__":
    convert_geojson_to_json()
