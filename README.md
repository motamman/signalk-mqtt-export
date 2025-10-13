# SignalK MQTT Export Manager

**Version 0.5.0-beta.2**

A comprehensive SignalK plugin and webapp that provides a web-based interface for managing selective export of SignalK data to MQTT brokers. This plugin serves as the inverse of the MQTT Import plugin, allowing you to export data from SignalK to MQTT topics with flexible source transformation.

***THIS REQUIRES A SEPARATELY INSTALLED MQTT BROKER***

Both have been tested with a local and remote Mosquitto broker. I run a local broker which bridges to the remote broker when I have connectivity on the boat. This assumes you want to export SignalK deltas to MQTT for external processing or bridging to other systems.

## Features

- **🌐 Web Interface**: Easy-to-use webapp for managing export rules with live updates
- **📋 Rule Management**: Create, edit, enable/disable export rules with auto-save
- **🎯 Selective Export**: Choose exactly which SignalK data to export to MQTT
- **📊 Real-time Status**: Monitor MQTT connection and message statistics
- **🏷️ Flexible Rules**: Configure export rules with context, path, and source filtering
- **🔍 Wildcard Support**: Use wildcards for path matching (e.g., `navigation.*`)
- **📦 Source Filtering**: Filter incoming data by specific SignalK sources
- **🏷️ Source Transformation**: Optionally replace the $source field in exported data
- **🚫 MMSI Exclusion**: Exclude specific vessels by MMSI
- **🔄 Change Detection**: Only send on value changes to reduce MQTT traffic
- **📍 Topic Templates**: Customize MQTT topic structure with variables
- **📤 Payload Formats**: Choose between full SignalK structure or value-only
- **⚡ QoS & Retain**: Full MQTT QoS and retain message support
- **🔁 Bidirectional Sync**: Works seamlessly with MQTT Import plugin

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

### Plugin Settings

Navigate to **SignalK Admin → Server → Plugin Config → SignalK MQTT Export Manager** for basic MQTT connection settings:

- **Enable MQTT Export**: Master enable/disable switch
- **MQTT Broker URL**: Connection string (e.g., `mqtt://localhost:1883`)
- **Client ID**: Unique identifier for the MQTT connection
- **Username/Password**: Optional authentication credentials
- **Topic Prefix**: Optional prefix for all MQTT topics

### Export Rules Management

**All export rules are managed through the web interface only.** This eliminates configuration conflicts and provides a better user experience.

### Export Rules

Each export rule defines:

- **Context**: SignalK context to subscribe to (e.g., `vessels.self`, `vessels.*`)
- **Path**: SignalK path pattern (supports wildcards like `navigation.*`, `*`)
- **Source Filter**: Optional filter for incoming data source (e.g., `pypilot`, `derived-data`)
  - Leave empty to accept data from all sources
  - Specify a source to only export data from that source
- **Source Label**: Optional custom $source for exported data
  - Leave empty to preserve the original source
  - Provide a label (e.g., `mqtt-export`, `remote-boat`) to replace the source field
  - Useful for identifying re-exported data when using with MQTT Import
- **Period**: Update frequency in milliseconds (100-60000ms)
- **QoS**: MQTT Quality of Service (0, 1, or 2)
- **Retain**: Whether to set MQTT retain flag on messages
- **Payload Format**:
  - `full` - Complete SignalK delta structure (preserves or replaces source)
  - `value-only` - Just the raw value
- **Send on Change**: Only publish when values change to reduce traffic
- **Topic Template**: Custom MQTT topic format using `{context}` and `{path}` variables
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

### Default Format
Without a topic template: `{prefix}/{context}/{path}`

Examples:
- `vessels/self/navigation/position`
- `vessels/urn:mrn:imo:mmsi:123456789/navigation/position`

### Custom Topic Templates
Topic templates support variables:
- `{context}` - Replaced with SignalK context (e.g., `vessels.self`)
- `{path}` - Replaced with SignalK path (e.g., `navigation.position`)
- All dots (`.`) are automatically converted to slashes (`/`)

**Template Examples:**

| Template | SignalK Data | Result Topic |
|----------|-------------|--------------|
| `marine/{context}/{path}` | `vessels.self` / `navigation.position` | `marine/vessels/self/navigation/position` |
| `boat/{path}` | `vessels.self` / `electrical.batteries.0.voltage` | `boat/electrical/batteries/0/voltage` |
| `{context}/data/{path}` | `vessels.self` / `navigation.speedOverGround` | `vessels/self/data/navigation/speedOverGround` |

## Web Interface

Access the management interface at:
- **http://your-signalk-server:3000/plugins/signalk-mqtt-export/**

### Interface Features:

- **📊 Status Overview** - Real-time MQTT connection status and rule statistics
- **📤 Export Rules Management** - Add, edit, delete, and toggle rules
- **⚡ Auto-Save** - Changes are automatically saved (no manual save button)
- **🔔 Toast Notifications** - Visual feedback for all operations
- **🗂️ Collapsible Sections** - Compact, organized interface
- **📝 Activity Log** - Real-time logging of export operations
- **🧪 MQTT Testing** - Test MQTT connection with a single click
- **🔄 Auto-Refresh** - Status updates every 10 seconds

### Creating Export Rules:

1. Click **"➕ Add Rule"** button
2. Configure rule parameters:
   - **Name**: Descriptive name for the rule
   - **Context**: Select vessel context
   - **Path**: Enter SignalK path (supports wildcards)
   - **Source Filter**: (Optional) Filter by incoming source
   - **Source Label**: (Optional) Custom $source for exports
   - **Payload Format**: Choose full or value-only
   - **Topic Template**: (Optional) Custom topic structure
3. Click **"Save Rule"** - automatically saved to server
4. Toggle rules on/off with the switch in the rules table

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

This plugin is designed to work seamlessly with the SignalK MQTT Import plugin for bidirectional data flow:

### Export → MQTT → Import Flow

1. **Export Plugin**: Publishes SignalK data to MQTT topics
2. **MQTT Broker**: Routes messages between systems
3. **Import Plugin**: Subscribes to MQTT topics and imports data back to SignalK

### Source Label Feature

The **Source Label** field enables proper source identification when re-importing data:

**Example Scenario:**
```
Boat A (Export):
  - Receives data from source: "pypilot"
  - Exports with Source Label: "boat-a-autopilot"
  - MQTT Topic: vessels/self/navigation/courseOverGroundTrue

Boat B (Import):
  - Imports from MQTT Topic: vessels/urn:mrn:signalk:uuid:boat-a/navigation/courseOverGroundTrue
  - SignalK sees source: "boat-a-autopilot" (not "pypilot")
  - Clear identification of data origin
```

### Use Cases

- **Bridge SignalK instances across networks** - Share data between remote locations
- **Multi-vessel data sharing** - Exchange navigation data between boats
- **Data processing pipelines** - Export to MQTT, process externally, re-import
- **Remote monitoring** - Export to cloud MQTT broker for monitoring
- **Backup/restore mechanisms** - Create data archives via MQTT
- **Source tracking** - Maintain clear data provenance when bridging systems

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