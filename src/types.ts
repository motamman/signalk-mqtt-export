import { Request, Response } from 'express';
import { MqttClient } from 'mqtt';
import {
  ServerAPI,
  Plugin,
  Delta,
  Update,
  PathValue,
  Context,
  Path,
  Timestamp,
} from '@signalk/server-api';

// Re-export SignalK types for convenience
export type SignalKApp = ServerAPI;
export type SignalKDelta = Delta;
export type SignalKUpdate = Update;
export type SignalKValue = PathValue;
export type SignalKContext = Context;
export type SignalKPath = Path;
export type SignalKTimestamp = Timestamp;

// Extended Plugin interface for our needs
export interface SignalKPlugin extends Plugin {
  config?: MQTTExportConfig;
}

// MQTT Export Configuration
export interface MQTTExportConfig {
  enabled: boolean;
  mqttBroker: string;
  mqttClientId: string;
  mqttUsername: string;
  mqttPassword: string;
  topicPrefix: string;
  exportRules: ExportRule[];
}

// Export Rule definition
export interface ExportRule {
  id: string;
  name: string;
  context: string;
  path: string;
  source?: string;
  enabled: boolean;
  period: number;
  qos: number;
  retain: boolean;
  payloadFormat: PayloadFormat;
  sendOnChange: boolean;
  topicTemplate?: string;
  excludeMMSI?: string;
}

// Payload format options
export type PayloadFormat = 'full' | 'value-only';

// SignalK types are now imported from @signalk/server-api

// SignalK subscription types are now handled by @signalk/server-api

// Plugin state
export interface PluginState {
  mqttClient: MqttClient | null;
  exportRules: ExportRule[];
  activeSubscriptions: Map<string, ExportRule[]>;
  lastSentValues: Map<string, any>;
  currentConfig?: MQTTExportConfig;
  unsubscribes: (() => void)[];
}

// MQTT Client options
export interface MQTTClientOptions {
  clientId: string;
  clean: boolean;
  reconnectPeriod: number;
  keepalive: number;
  username?: string;
  password?: string;
}

// API Request/Response types
export interface TypedRequest<T = any> extends Request {
  body: T;
}

export interface TypedResponse<T = any> extends Response {
  json: (obj: T) => this;
}

// API Response types
export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  topic?: string;
}

export interface RulesApiResponse extends ApiResponse {
  rules: ExportRule[];
  activeSubscriptions: number;
  mqttConnected: boolean;
}

export interface MQTTStatusApiResponse extends ApiResponse {
  connected: boolean;
  broker?: string;
  clientId?: string;
}

export interface RuleUpdateRequest {
  rules: ExportRule[];
}

// Default rule configuration
export interface DefaultRuleConfig {
  id: string;
  name: string;
  context: string;
  path: string;
  source: string;
  enabled: boolean;
  period: number;
  qos: number;
  retain: boolean;
  payloadFormat: PayloadFormat;
  sendOnChange: boolean;
  excludeMMSI?: string;
}

// MQTT publish result
export interface MqttPublishResult {
  topic: string;
  payload: string;
  rule: ExportRule;
  success: boolean;
  error?: string;
}

// Context group for subscription management
export interface ContextGroup {
  context: string;
  rules: ExportRule[];
}

// Value change detection
export interface ValueChangeResult {
  hasChanged: boolean;
  currentValue: any;
  previousValue?: any;
}

// MQTT topic template variables
export interface TopicTemplateVariables {
  context: string;
  path: string;
  source?: string;
}

// Export rule validation result
export interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
}

// Plugin statistics
export interface PluginStats {
  totalRules: number;
  enabledRules: number;
  activeSubscriptions: number;
  mqttConnected: boolean;
  messagesPublished: number;
  lastPublishTime?: string;
}

// MQTT connection state
export type MqttConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

// SignalK subscription error
export interface SubscriptionError {
  context: string;
  path: string;
  error: string;
}

// Rule processing result
export interface RuleProcessingResult {
  rule: ExportRule;
  matched: boolean;
  published: boolean;
  topic?: string;
  payload?: string;
  error?: string;
}
