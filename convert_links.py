#!/usr/bin/env python3
"""
Script to convert Waze links to Google Maps links in shelter data.
Extracts coordinates from Waze URLs and creates corresponding Google Maps URLs.
"""

import csv
import json
import re
from urllib.parse import unquote

def extract_coordinates_from_waze_url(waze_url):
    """Extract latitude and longitude from Waze URL."""
    if not waze_url:
        return None, None
    
    # Decode HTML entities
    waze_url = waze_url.replace('&amp;', '&')
    
    # Pattern to match ll=lat,lon in Waze URL
    pattern = r'll=([0-9.-]+),([0-9.-]+)'
    match = re.search(pattern, waze_url)
    
    if match:
        lat = float(match.group(1))
        lon = float(match.group(2))
        return lat, lon
    
    return None, None

def create_google_maps_url(lat, lon, destination_name=""):
    """Create Google Maps URL for navigation."""
    if lat is None or lon is None:
        return ""
    
    # Google Maps URL format for navigation
    base_url = "https://www.google.com/maps/dir//"
    coords = f"{lat},{lon}"
    
    if destination_name:
        # URL encode the destination name
        destination_name = destination_name.replace(" ", "+")
        return f"{base_url}{coords}+({destination_name})"
    else:
        return f"{base_url}{coords}"

def process_csv_file():
    """Process the CSV file and add Google Maps links."""
    input_file = 'data/shelters.csv'
    output_file = 'data/shelters_with_gmaps.csv'
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames + ['google_maps_link']
        
        with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for row in reader:
                waze_url = row.get('waze_link', '')
                lat, lon = extract_coordinates_from_waze_url(waze_url)
                
                # Use existing coordinates if Waze extraction fails
                if lat is None or lon is None:
                    lat = float(row.get('latitude', 0)) if row.get('latitude') else None
                    lon = float(row.get('longiude', 0)) if row.get('longiude') else None  # Note: typo in original data
                
                # Create destination name from address or shelter info
                destination = row.get('address_label', '') or f"Shelter {row.get('shelter_no', '')}"
                
                google_maps_url = create_google_maps_url(lat, lon, destination)
                row['google_maps_link'] = google_maps_url
                
                writer.writerow(row)
    
    print(f"Processed CSV file. Output saved to: {output_file}")

def process_geojson_file():
    """Process the GeoJSON file and add Google Maps links."""
    input_file = 'data/shelters.geojson'
    output_file = 'data/shelters_with_gmaps.geojson'
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        data = json.load(infile)
    
    for feature in data['features']:
        properties = feature['properties']
        coordinates = feature['geometry']['coordinates']
        
        # GeoJSON uses [longitude, latitude] format
        lon, lat = coordinates[0], coordinates[1]
        
        # Create destination name
        destination = properties.get('address_label', '') or f"Shelter {properties.get('shelter_no', '')}"
        
        google_maps_url = create_google_maps_url(lat, lon, destination)
        properties['google_maps_link'] = google_maps_url
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(data, outfile, indent=2, ensure_ascii=False)
    
    print(f"Processed GeoJSON file. Output saved to: {output_file}")

def main():
    """Main function to process both files."""
    print("Converting Waze links to Google Maps links...")
    
    try:
        process_csv_file()
        process_geojson_file()
        print("Conversion completed successfully!")
        
        # Show some examples
        print("\nExample conversions:")
        with open('data/shelters.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= 3:  # Show first 3 examples
                    break
                
                waze_url = row.get('waze_link', '')
                lat, lon = extract_coordinates_from_waze_url(waze_url)
                if lat and lon:
                    destination = row.get('address_label', '') or f"Shelter {row.get('shelter_no', '')}"
                    google_url = create_google_maps_url(lat, lon, destination)
                    
                    print(f"\nShelter: {destination}")
                    print(f"Waze: {waze_url}")
                    print(f"Google Maps: {google_url}")
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Make sure the data files exist in the 'data' directory.")
    except Exception as e:
        print(f"Error processing files: {e}")

if __name__ == "__main__":
    main()
