# SignalK MQTT Export Manager

**Version 0.5.0-beta.1**

A comprehensive SignalK plugin and webapp provides a web-based interface for managing selective export of SignalK data to MQTT brokers. This plugin serves as the inverse of the MQTT Import plugin, allowing you to export data from SignalK to MQTT topics.

***THIS REQUIRES A SEPARATELY INSTALLED MQTT BROKER***

Both have been tested with a local and remote Mosquitto broker. I run a local broker which bridges to the remote broker when I have connectivity on the boat. This assumes you want to export SignalK deltas to MQTT for external processing or bridging to other systems.

## Features

- **🌐 Web Interface**: Easy-to-use webapp for managing export rules
- **📋 Rule Management**: Create, edit, enable/disable export rules
- **🎯 Selective Export**: Choose exactly which SignalK data to export to MQTT
- **📊 Real-time Status**: Monitor MQTT connection and message statistics
- **🏷️ Flexible Rules**: Configure export rules with context, path, and source filtering
- **🔍 Wildcard Support**: Use wildcards for path matching (e.g., `navigation.*`)
- **📦 Source Filtering**: Filter by specific SignalK data sources
- **🚫 MMSI Exclusion**: Exclude specific vessels by MMSI
- **🔄 Change Detection**: Only send on value changes to reduce MQTT traffic
- **🏷️ Topic Templates**: Customize MQTT topic structure
- **📤 Payload Formats**: Choose between full SignalK structure or value-only
- **⚡ QoS & Retain**: Full MQTT QoS and retain message support
- **🔧 TypeScript**: Fully typed for reliability and maintainability

## Installation

### Method: NPM Installation
```bash
npm install signalk-mqtt-export
sudo systemctl restart signalk
```

### Method: NPM Installation from GitHub repo
```bash
cd ~/.signalk/node_modules
npm install motamman/signalk-mqtt-export
sudo systemctl restart signalk
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/motamman/signalk-mqtt-export.git
cd signalk-mqtt-export

# Install dependencies
npm install

# Build TypeScript
npm run build

# Development mode (watch for changes)
npm run dev
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
- **http://your-signalk-server:3000/plugins/signalk-mqtt-export/**

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

### Project Structure

```
signalk-mqtt-export/
├── src/
│   ├── index.ts        # Main plugin file (TypeScript)
│   └── types.ts        # TypeScript type definitions
├── dist/               # Compiled JavaScript output
├── public/             # Web interface files
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## API Endpoints

- `GET /api/rules` - Get current export rules
- `POST /api/rules` - Update export rules
- `GET /api/mqtt-status` - Get MQTT connection status
- `POST /api/test-mqtt` - Test MQTT connection

## Integration with Import Plugin

This plugin is designed to work seamlessly with the SignalK MQTT Import plugin:

1. **Export Plugin**: Publishes SignalK data to MQTT topics
2. **Import Plugin**: Subscribes to MQTT topics and imports data back to SignalK

This allows you to:
- Bridge SignalK instances across networks
- Share data between different vessels
- Implement data processing pipelines
- Create backup/restore mechanisms

## TypeScript Features

### Key Interfaces
- `ExportRule`: Export rule configuration
- `MQTTExportConfig`: Plugin configuration
- `SignalKDelta`: SignalK delta message structure
- `ApiResponse<T>`: Generic API response typing
- `PluginState`: Internal plugin state management

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **MQTT Connection Failed**
   - Check MQTT broker URL and credentials
   - Ensure network connectivity
   - Verify firewall settings

2. **No Data Being Exported**
   - Check if export rules are enabled
   - Verify SignalK paths match your data
   - Review MQTT topic patterns
   - Check SignalK debug logs

3. **TypeScript Compilation Issues**
   - Ensure all dependencies are installed: `npm install`
   - Check TypeScript version compatibility
   - Review tsconfig.json settings

4. **High MQTT Traffic**
   - Enable "Send on Change" option
   - Adjust update periods for rules
   - Use more specific path filters

### Debug Mode
Enable debug logging in SignalK admin to see detailed export processing:
```
[DEBUG] 📤 Exporting data on topic: vessels/self/navigation/position
[DEBUG] ✅ Rule matched: "Navigation Data" for path: navigation.position
[DEBUG] 📡 Successfully published to MQTT: vessels/self/navigation/position
```

## Support

For issues, questions, or feature requests, please open an issue on GitHub.