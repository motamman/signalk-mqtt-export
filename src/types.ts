import { Request, Response } from 'express';
import { MqttClient } from 'mqtt';

// SignalK App interface
export interface SignalKApp {
  debug: (message: string, ...args: any[]) => void;
  subscriptionmanager: {
    subscribe: (
      subscription: SignalKSubscription,
      unsubscribes: (() => void)[],
      errorCallback: (error: any) => void,
      deltaCallback: (delta: SignalKDelta) => void
    ) => void;
  };
  savePluginOptions: (options: any, callback: (error?: Error) => void) => void;
  getSelfPath: (path: string) => string;
  selfId?: string;
  getDataDirPath: () => string;
}

// SignalK Plugin interface
export interface SignalKPlugin {
  id: string;
  name: string;
  description: string;
  schema: any;
  start: (options: Partial<MQTTExportConfig>) => void;
  stop: () => void;
  registerWithRouter?: (router: any) => void;
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

// SignalK Delta structure
export interface SignalKDelta {
  context: string;
  updates: SignalKUpdate[];
}

// SignalK Update structure
export interface SignalKUpdate {
  source: SignalKSource;
  timestamp: string;
  values: SignalKValue[];
  $source?: string;
}

// SignalK Source structure
export interface SignalKSource {
  label: string;
  type?: string;
  bus?: string;
  src?: string;
}

// SignalK Value structure
export interface SignalKValue {
  path: string;
  value: any;
  timestamp?: string;
}

// SignalK Subscription structure
export interface SignalKSubscription {
  context: string;
  subscribe: SignalKSubscriptionItem[];
}

// SignalK Subscription item
export interface SignalKSubscriptionItem {
  path: string;
  period: number;
  format?: string;
  policy?: string;
  minPeriod?: number;
}

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
export type MqttConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

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