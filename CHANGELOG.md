# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0-beta.2] - 2025-10-13

### Added
- **Custom Source Label Feature**: New `sourceLabel` field allows overriding the `$source` field in exported SignalK deltas
  - Automatically replaces source when sourceLabel is provided in "Full" payload format
  - Preserves original source when sourceLabel is empty
  - Enables clear data provenance when bridging between SignalK systems
- **Toast Notifications**: Floating notification system for visual feedback
  - Success, error, and info notifications
  - Auto-dismiss with configurable duration
  - Smooth slide-in animations
- **Collapsible Card Sections**: All major sections can now be collapsed/expanded
  - Status Overview, Export Rules, and Activity Log sections
  - Animated expand/collapse transitions
  - Persists state during session

### Changed
- **UI Styling**: Complete redesign to match signalk-mqtt-import appearance
  - More compact spacing (8px padding vs 25px)
  - Smaller toggle switches (44x24px vs 60x34px)
  - Reduced font sizes throughout interface
  - Fixed-height activity log (150px vs 300px max-height)
  - Smaller buttons and form elements
- **Auto-Save Behavior**: All changes now auto-save immediately
  - Removed "Save Changes" button
  - Toggle rule enabled/disabled saves automatically
  - Add/edit/delete operations save on submission
  - Error handling with automatic revert on failure
- **Type Safety**: Replaced all `any` types with proper TypeScript types
  - `Map<string, any>` → `Map<string, unknown>`
  - Proper SignalK type imports and usage
  - Better type inference throughout codebase

### Fixed
- **TypeScript Compilation**: Resolved type compatibility issues
  - Fixed Update type assertions for values property
  - Added proper type guards for SignalK data structures
  - Fixed subscription context type casting
- **Code Quality**: Cleaned up unused imports and variables
  - Removed unused `MqttClient`, `PayloadFormat`, `DefaultRuleConfig`, `ContextGroup` imports
  - Removed unused `appInstance` variable
  - All ESLint warnings resolved (18 → 0)

### Developer Experience
- **Linting**: Zero ESLint warnings or errors
- **Formatting**: All code properly formatted with Prettier
- **Build**: Clean TypeScript compilation with no errors

## [0.5.0-beta.1] - 2024-08-14

### Added
- **TypeScript Implementation**: Complete migration from JavaScript to TypeScript
  - Full type definitions for SignalK data structures
  - Enhanced IDE support with IntelliSense
  - Compile-time type checking
- **SignalK Server API Integration**: Import types directly from `@signalk/server-api`
  - Proper Delta, Update, and PathValue types
  - Context and Path type safety
- **ESLint & Prettier**: Code quality and formatting tools
  - TypeScript-specific ESLint rules
  - Automated code formatting
  - CI pipeline for code quality checks
- **Build Scripts**: Improved build and development workflow
  - `npm run build` - TypeScript compilation
  - `npm run watch` - Development mode with auto-rebuild
  - `npm run lint` and `npm run format` - Code quality tools
  - `npm run ci` - Full CI check (format + lint)

### Changed
- **Project Structure**: Reorganized for TypeScript
  - `/src` - TypeScript source files
  - `/dist` - Compiled JavaScript output
  - Separate type definitions in `types.ts`
- **Header Gradient**: Updated web interface header with improved gradient styling
- **Documentation**: Enhanced README with clearer explanations and troubleshooting section

### Fixed
- Type safety improvements throughout codebase
- Better error handling and validation

## [0.5.0-beta.0] - Initial Release

### Added
- Core export functionality
- Basic web interface for rule management
- MQTT broker connection support
- Export rule configuration
- Context and path filtering
- Source filtering
- Wildcard path matching
- MMSI exclusion
- Topic template support
- Payload format options (full/value-only)
- QoS and retain message support
- Send on change detection
- Real-time status monitoring
- Activity logging
- Manual save/refresh buttons

### Features
- Plugin configuration via SignalK admin panel
- Default export rules for common use cases
- MQTT connection testing
- Rule enable/disable toggles

## Links
- Repository: https://github.com/motamman/signalk-mqtt-export
- Issues: https://github.com/motamman/signalk-mqtt-export/issues

---

## Version History Summary

- **0.5.0-beta.2** (2025-10-13): Custom source labels, UI redesign, auto-save
- **0.5.0-beta.1**: TypeScript migration, enhanced features
