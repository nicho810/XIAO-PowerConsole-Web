# Power Monitor Web Application

A pure frontend web-based power monitor that uses the Web Serial API to read JSON data from a serial port and display real-time charts for voltage, current, and power measurements.

## Features

- **Real-time Data Visualization**: Live line charts for voltage (mV), current (mA), and power (mW) across multiple channels
- **Web Serial API Integration**: Direct serial port communication without backend requirements
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Toggleable theme with persistent settings
- **Debug Console**: Collapsible console for monitoring raw JSON data
- **Multi-channel Support**: Supports up to 4 channels with distinct color coding
- **Modern UI**: Clean, intuitive interface with smooth animations

## Browser Requirements

The Web Serial API is currently supported in:
- **Chrome** (version 89+)
- **Edge** (version 89+)
- **Opera** (version 76+)

**Note**: Firefox and Safari do not support the Web Serial API.

## Data Format

The application expects JSON data in the following format:

```json
{
  "cS": [
    {
      "ch": 0,
      "v_mV": 1234,
      "c_mA": 123,
      "p_mW": 12345,
      "ts": 1234567890
    }
  ]
}
```

### Data Fields:
- `cS`: Array of channel data objects
- `ch`: Channel number (0-3)
- `v_mV`: Voltage in millivolts
- `c_mA`: Current in milliamps
- `p_mW`: Power in milliwatts
- `ts`: Timestamp in Unix epoch format (seconds)

## Hosting on GitHub Pages

### Method 1: Direct Upload (Recommended)

1. **Fork or Clone this Repository**
   ```bash
   git clone https://github.com/yourusername/power-monitor.git
   cd power-monitor
   ```

2. **Upload Files to GitHub**
   - Create a new repository on GitHub
   - Upload the following files to the root of your repository:
     - `index.html`
     - `styles.css`
     - `script.js`
     - `README.md`

3. **Enable GitHub Pages**
   - Go to your repository settings
   - Scroll down to "GitHub Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

4. **Access Your Site**
   - Your site will be available at: `https://yourusername.github.io/repository-name`

### Method 2: Using GitHub CLI

1. **Initialize Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**
   ```bash
   gh repo create power-monitor --public
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   ```bash
   gh repo edit --enable-pages
   ```

## Usage Instructions

### Connecting to Serial Device

1. **Open the Application**
   - Navigate to your hosted GitHub Pages URL
   - Ensure you're using a supported browser (Chrome/Edge)

2. **Connect to Device**
   - Click the "Connect" button in the left panel
   - Select your serial device from the browser's port selection dialog
   - The application will automatically start reading data

3. **Monitor Data**
   - Real-time charts will update as data arrives
   - Each channel is displayed with a distinct color
   - Use the debug console to monitor raw JSON data

### Features

- **Theme Toggle**: Click the sun/moon icon to switch between light and dark modes
- **Console**: Click "Show/Hide" to toggle the debug console
- **Responsive**: Works on mobile devices with touch-friendly controls

## Technical Details

### Architecture
- **Pure Frontend**: No server-side code required
- **Web Serial API**: Direct serial port communication
- **Chart.js**: Lightweight charting library for data visualization
- **CSS Grid/Flexbox**: Modern responsive layout
- **Local Storage**: Theme persistence across sessions

### Performance
- **Data Limiting**: Maximum 100 data points per chart to prevent memory issues
- **Efficient Updates**: Chart updates use 'none' animation mode for smooth performance
- **Memory Management**: Automatic cleanup of old console messages

### Error Handling
- **Connection Errors**: Graceful handling of serial port connection issues
- **Data Parsing**: Robust JSON parsing with error logging
- **Browser Compatibility**: Clear error messages for unsupported browsers

## Troubleshooting

### Common Issues

1. **"Web Serial API not supported"**
   - Solution: Use Chrome, Edge, or Opera browser

2. **"No ports available"**
   - Solution: Ensure your device is connected and drivers are installed
   - Check that no other application is using the serial port

3. **"Permission denied"**
   - Solution: Allow port access when prompted by the browser
   - Check browser settings for serial port permissions

4. **Charts not updating**
   - Solution: Check the debug console for data reception
   - Verify JSON format matches expected structure

### Debug Tips

- **Enable Console**: Use the debug console to monitor raw data
- **Browser DevTools**: Check browser console for JavaScript errors
- **Serial Monitor**: Use Arduino IDE or similar to verify data format

## Development

### Local Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/power-monitor.git
   cd power-monitor
   ```

2. **Serve Locally**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Access Application**
   - Open `http://localhost:8000` in Chrome/Edge
   - Note: HTTPS may be required for Web Serial API in some cases

### Customization

- **Chart Colors**: Modify `channelColors` array in `script.js`
- **Data Points**: Adjust `maxDataPoints` for memory/performance balance
- **Baud Rate**: Change baud rate in `connect()` method if needed
- **Styling**: Modify CSS variables in `styles.css` for theme customization

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section above
- Review browser compatibility requirements
- Ensure your device sends data in the correct JSON format