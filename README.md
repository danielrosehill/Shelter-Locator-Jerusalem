# Jerusalem Shelter Locator

A responsive web application for finding the nearest emergency shelters in Jerusalem based on user location.

## 🚨 Important Disclaimer

**This application is not a substitute for official emergency information and should not be relied upon as the sole source for emergency shelter locations. The data used in this application was imported from the Jerusalem Municipality website on September 19th, 2025.**

**For the most current and official emergency information, always consult official government sources and emergency services.**

## 🌟 Features

- **📍 Location-based Search**: Use current GPS location or enter an address
- **🎯 Nearest Shelters**: Find the 10 closest emergency shelters
- **📱 Mobile Responsive**: Optimized for both desktop and mobile devices
- **🗺️ Navigation Integration**: Direct links to Google Maps for directions
- **⚡ Fast Performance**: Lightweight and efficient design
- **🔒 Privacy Focused**: No data collection or tracking

## 🛠️ Technology Stack

- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **Styling**: Modern CSS with Flexbox and Grid
- **Geolocation**: Browser Geolocation API
- **Geocoding**: OpenStreetMap Nominatim API
- **Maps Integration**: Google Maps
- **Deployment**: Netlify

## 📊 Data Source

The shelter data is sourced from the Jerusalem Municipality website and includes:
- Shelter locations with precise coordinates
- Capacity information
- Operating organizations
- Address details
- Navigation links

## 🚀 Deployment

The application is deployed at: [shelterfinder.bydanielrosehill.com](https://shelterfinder.bydanielrosehill.com)

### Local Development

1. Clone the repository
2. Serve the files using a local web server (due to CORS restrictions)
3. Open `index.html` in your browser

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## 📁 Project Structure

```
├── index.html          # Main application page
├── styles.css          # Responsive CSS styles
├── app.js             # Application logic
├── netlify.toml       # Netlify deployment configuration
├── data/
│   ├── shelters.csv   # Shelter data in CSV format
│   ├── shelters.geojson # Shelter data in GeoJSON format
│   └── shelters_with_gmaps.json # Processed data for web app
├── convert_links.py   # Script to convert Waze to Google Maps links
└── convert_to_json.py # Script to convert GeoJSON to JSON
```

## 🔧 Development Scripts

- `convert_links.py`: Converts Waze navigation links to Google Maps links
- `convert_to_json.py`: Converts GeoJSON data to regular JSON format for web consumption

## 📱 Usage

1. **Allow Location Access**: Grant permission for the app to access your location
2. **Find Shelters**: The app will automatically find the 10 nearest shelters
3. **Get Directions**: Click "Get Directions" to open Google Maps navigation
4. **Manual Search**: Alternatively, enter an address manually
 
 

## ⚠️ Limitations

- Requires internet connection for geocoding and maps
- Shelter data accuracy depends on municipal updates
- GPS accuracy may vary by device and location
- Not a replacement for official emergency services
