# SignalK MQTT Export Manager

A TypeScript-based SignalK plugin for selectively exporting SignalK data to MQTT with a comprehensive webapp management interface.

## Features

- **Selective Export**: Choose exactly which SignalK data to export to MQTT
- **Flexible Rules**: Configure export rules with context, path, and source filtering
- **Wildcard Support**: Use wildcards for path matching (e.g., `navigation.*`)
- **Source Filtering**: Filter by specific SignalK data sources
- **MMSI Exclusion**: Exclude specific vessels by MMSI
- **Change Detection**: Only send on value changes to reduce MQTT traffic
- **Topic Templates**: Customize MQTT topic structure
- **Payload Formats**: Choose between full SignalK structure or value-only
- **QoS & Retain**: Full MQTT QoS and retain message support
- **Web Interface**: Comprehensive webapp for managing export rules
- **TypeScript**: Fully typed for reliability and maintainability

## Installation

Install directly from GitHub:

```bash
npm install motamman/signalk-mqtt-export
```

Or clone and install locally:

```bash
git clone https://github.com/motamman/signalk-mqtt-export.git
cd signalk-mqtt-export
npm install
npm run build
```

## Configuration

The plugin can be configured through the SignalK web interface or by editing the configuration directly.

### Basic MQTT Settings

- **MQTT Broker**: Connection string (e.g., `mqtt://localhost:1883`)
- **Client ID**: Unique identifier for the MQTT connection
- **Username/Password**: Optional authentication credentials
- **Topic Prefix**: Optional prefix for all published topics

### Export Rules

Each export rule defines:

- **Context**: SignalK context to subscribe to (e.g., `vessels.self`, `vessels.*`)
- **Path**: SignalK path pattern (supports wildcards like `navigation.*`)
- **Source**: Optional source filter (e.g., `pypilot`, `derived-data`)
- **Period**: Update frequency in milliseconds
- **QoS**: MQTT Quality of Service (0, 1, or 2)
- **Retain**: Whether to set MQTT retain flag
- **Payload Format**: `full` (complete SignalK delta) or `value-only`
- **Send on Change**: Only publish when values change
- **Topic Template**: Custom MQTT topic format
- **Exclude MMSI**: Comma-separated list of MMSI numbers to exclude

## Default Export Rules

The plugin comes with sensible defaults:

1. **All Navigation Data** - Exports all navigation data from self vessel
2. **Derived Data** - Exports computed/derived values
3. **PyPilot Data** - Exports autopilot data
4. **Anchor Alarm** - Exports anchor alarm status
5. **All Vessels (AIS)** - Exports AIS data from other vessels
6. **AIS Vessels** - Exports URN-formatted vessel data

## MQTT Topic Structure

Default topic format: `{prefix}/{context}/{path}`

Examples:
- `vessels/self/navigation/position`
- `vessels/urn:mrn:imo:mmsi:123456789/navigation/position`

Custom topic templates support variables:
- `{context}` - SignalK context
- `{path}` - SignalK path
- `marine/{context}/{path}` - Custom prefix

## Web Interface

Access the management interface at:
`http://your-signalk-server/plugins/signalk-mqtt-export/`

Features:
- Real-time status monitoring
- Visual rule management
- MQTT connection testing
- Activity logging
- Rule import/export

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Project Structure

```
src/
├── index.ts      # Main plugin logic
└── types.ts      # TypeScript interfaces
public/
├── index.html    # Web interface
└── mqtt_export.png
dist/             # Compiled JavaScript (generated)
```

## API Endpoints

- `GET /api/rules` - Get current export rules
- `POST /api/rules` - Update export rules
- `GET /api/mqtt-status` - Get MQTT connection status
- `POST /api/test-mqtt` - Test MQTT connection

## TypeScript Support

This plugin is written in TypeScript with comprehensive type definitions for:
- SignalK data structures
- MQTT client interfaces
- Export rule configurations
- API request/response types
- Plugin state management

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues, questions, or feature requests, please open an issue on GitHub.