import * as fs from 'fs-extra';
import * as path from 'path';
import { Router } from 'express';
import { connect, MqttClient } from 'mqtt';
import {
  SignalKApp,
  SignalKPlugin,
  MQTTExportConfig,
  ExportRule,
  SignalKDelta,
  SignalKUpdate,
  SignalKValue,
  PluginState,
  TypedRequest,
  TypedResponse,
  RulesApiResponse,
  MQTTStatusApiResponse,
  ApiResponse,
  RuleUpdateRequest,
  MQTTClientOptions,
  SignalKSubscription,
  PayloadFormat,
  DefaultRuleConfig,
  ValueChangeResult,
  ContextGroup
} from './types';

// Global plugin state
let appInstance: SignalKApp;

export = function(app: SignalKApp): SignalKPlugin {
  // Store app instance for global access
  appInstance = app;
  
  const plugin: SignalKPlugin = {
    id: 'signalk-mqtt-export',
    name: 'SignalK MQTT Export Manager',
    description: 'Selectively export SignalK data to MQTT with webapp management interface',
    schema: {},
    start: () => {},
    stop: () => {},
    registerWithRouter: undefined
  };

  // Plugin state
  const state: PluginState = {
    mqttClient: null,
    exportRules: [],
    activeSubscriptions: new Map<string, ExportRule[]>(),
    lastSentValues: new Map<string, any>(),
    currentConfig: undefined,
    unsubscribes: []
  };

  plugin.start = function(options: Partial<MQTTExportConfig>): void {
    app.debug('Starting SignalK MQTT Export Manager plugin');
    
    const config: MQTTExportConfig = {
      mqttBroker: options?.mqttBroker || 'mqtt://localhost:1883',
      mqttClientId: options?.mqttClientId || 'signalk-mqtt-export',
      mqttUsername: options?.mqttUsername || '',
      mqttPassword: options?.mqttPassword || '',
      topicPrefix: options?.topicPrefix || '',
      enabled: options?.enabled !== false,
      exportRules: options?.exportRules || getDefaultExportRules()
    };

    state.currentConfig = config;
    plugin.config = config;
    state.exportRules = config.exportRules;

    if (!config.enabled) {
      app.debug('MQTT Export plugin disabled');
      return;
    }

    // Initialize MQTT client
    initializeMQTTClient(config);

    // Set up SignalK subscriptions based on export rules
    updateSubscriptions();

    app.debug('SignalK MQTT Export Manager plugin started');
  };

  plugin.stop = function(): void {
    app.debug('Stopping SignalK MQTT Export Manager plugin');
    
    // Disconnect MQTT client
    if (state.mqttClient) {
      state.mqttClient.end();
      state.mqttClient = null;
    }

    // Unsubscribe from all SignalK subscriptions
    state.unsubscribes.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    state.unsubscribes = [];
    
    state.activeSubscriptions.clear();
    state.lastSentValues.clear();
    app.debug('SignalK MQTT Export Manager plugin stopped');
  };

  // Initialize MQTT client
  function initializeMQTTClient(config: MQTTExportConfig): void {
    try {
      const mqttOptions: MQTTClientOptions = {
        clientId: config.mqttClientId,
        clean: true,
        reconnectPeriod: 5000,
        keepalive: 60
      };

      if (config.mqttUsername && config.mqttPassword) {
        mqttOptions.username = config.mqttUsername;
        mqttOptions.password = config.mqttPassword;
      }

      state.mqttClient = connect(config.mqttBroker, mqttOptions);

      state.mqttClient.on('connect', () => {
        app.debug(`✅ Connected to MQTT broker: ${config.mqttBroker}`);
      });

      state.mqttClient.on('error', (error: Error) => {
        app.debug(`❌ MQTT client error: ${error.message}`);
      });

      state.mqttClient.on('close', () => {
        app.debug('🔌 MQTT client disconnected');
      });

      state.mqttClient.on('reconnect', () => {
        app.debug('🔄 MQTT client reconnecting...');
      });

    } catch (error) {
      app.debug(`Failed to initialize MQTT client: ${(error as Error).message}`);
    }
  }

  // Update SignalK subscriptions based on export rules
  function updateSubscriptions(): void {
    // Clear existing subscriptions
    state.unsubscribes.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    state.unsubscribes = [];
    state.activeSubscriptions.clear();

    // Group export rules by context for efficient subscriptions
    const contextGroups = new Map<string, ExportRule[]>();
    state.exportRules.filter(rule => rule.enabled).forEach(rule => {
      const context = rule.context || 'vessels.self';
      if (!contextGroups.has(context)) {
        contextGroups.set(context, []);
      }
      contextGroups.get(context)!.push(rule);
    });

    // Create subscriptions for each context group
    contextGroups.forEach((rules, context) => {
      const subscription: SignalKSubscription = {
        context: context,
        subscribe: rules.map(rule => ({
          path: rule.path,
          period: rule.period || 1000
        }))
      };

      app.debug(`Creating subscription for context ${context} with ${rules.length} paths`);

      app.subscriptionmanager.subscribe(
        subscription,
        state.unsubscribes,
        (subscriptionError) => {
          app.debug(`Subscription error for ${context}:`, subscriptionError);
        },
        (delta) => {
          handleSignalKData(delta, rules);
        }
      );

      state.activeSubscriptions.set(context, rules);
    });

    app.debug(`Active subscriptions: ${state.activeSubscriptions.size} contexts, ${state.exportRules.filter(r => r.enabled).length} total rules`);
  }

  // Handle incoming SignalK data
  function handleSignalKData(delta: SignalKDelta, contextRules: ExportRule[]): void {
    if (!delta.updates || !state.mqttClient || !state.mqttClient.connected) {
      return;
    }

    delta.updates.forEach(update => {
      if (!update.values) return;

      update.values.forEach(valueUpdate => {
        // Find matching export rule
        const rule = contextRules.find(r => {
          if (!r.enabled) return false;
          
          // Check path match (support wildcards)
          let pathMatch = false;
          if (r.path === '*') {
            pathMatch = true;
          } else if (r.path === valueUpdate.path) {
            pathMatch = true;
          } else if (r.path.endsWith('*')) {
            // Handle wildcard patterns like "navigation*"
            const prefix = r.path.slice(0, -1);
            pathMatch = valueUpdate.path.startsWith(prefix);
          }
          
          if (!pathMatch) {
            return false;
          }
          
          // Check source match
          const sourceMatch = !r.source || !r.source.trim() || r.source === (update.$source || update.source?.label);
          if (!sourceMatch) return false;
          
          // Check MMSI exclusion list
          if (r.excludeMMSI && r.excludeMMSI.trim() && delta.context) {
            const excludedMMSIs = r.excludeMMSI.split(',').map(mmsi => mmsi.trim());
            const contextHasExcludedMMSI = excludedMMSIs.some(mmsi => 
              delta.context.includes(mmsi)
            );
            if (contextHasExcludedMMSI) {
              return false;
            }
          }
          
          return true;
        });

        if (rule) {
          publishToMQTT(delta, update, valueUpdate, rule);
        }
      });
    });
  }

  // Publish data to MQTT
  function publishToMQTT(delta: SignalKDelta, update: SignalKUpdate, valueUpdate: SignalKValue, rule: ExportRule): void {
    try {
      const context = delta.context || 'vessels.self';
      const path = valueUpdate.path;
      const value = valueUpdate.value;

      // Check if we should only send on change
      if (rule.sendOnChange) {
        const changeResult = checkValueChange(context, path, value);
        if (!changeResult.hasChanged) {
          return; // Value hasn't changed, don't send
        }
      }

      // Build MQTT topic
      let topic = '';
      if (state.currentConfig?.topicPrefix) {
        topic = `${state.currentConfig.topicPrefix}/`;
      }
      
      if (rule.topicTemplate) {
        // Use custom topic template
        topic += rule.topicTemplate
          .replace('{context}', context)
          .replace('{path}', path)
          .replace(/\./g, '/');
      } else {
        // Default topic structure: context/path
        topic += `${context}/${path}`.replace(/\./g, '/');
      }

      // Build payload
      let payload: string;
      if (rule.payloadFormat === 'value-only') {
        payload = typeof value === 'object' ? JSON.stringify(value) : String(value);
      } else {
        // Default: use original SignalK delta structure (preserves all source info)
        payload = JSON.stringify(delta);
      }

      // Publish to MQTT
      state.mqttClient!.publish(topic, payload, { qos: (rule.qos || 0) as 0 | 1 | 2, retain: rule.retain || false }, (err) => {
        if (err) {
          app.debug(`MQTT publish error: ${err.message}`);
        } else {
          app.debug(`✅ Published to MQTT: ${topic} = ${payload.substring(0, 100)}${payload.length > 100 ? '...' : ''}`);
        }
      });

    } catch (error) {
      app.debug(`Error publishing to MQTT: ${(error as Error).message}`);
    }
  }

  // Check if value has changed
  function checkValueChange(context: string, path: string, value: any): ValueChangeResult {
    const valueKey = `${context}:${path}`;
    const lastValue = state.lastSentValues.get(valueKey);
    
    // Compare values (handle objects and primitives)
    const currentValueString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    // If we have a previous value, compare it
    if (lastValue !== undefined) {
      const lastValueString = typeof lastValue === 'object' ? JSON.stringify(lastValue) : String(lastValue);
      
      if (currentValueString === lastValueString) {
        // Value hasn't changed
        return {
          hasChanged: false,
          currentValue: value,
          previousValue: lastValue
        };
      }
    }
    
    // Store new value for next comparison (either first time or value changed)
    state.lastSentValues.set(valueKey, value);
    
    return {
      hasChanged: true,
      currentValue: value,
      previousValue: lastValue
    };
  }

  // Get default export rules (based on actual SignalK data sources)
  function getDefaultExportRules(): ExportRule[] {
    return [
      {
        id: 'all-navigation',
        name: 'All Navigation Data',
        context: 'vessels.self',
        path: 'navigation*',
        source: '', // All sources
        enabled: true,
        period: 1000,
        qos: 0,
        retain: false,
        payloadFormat: 'full',
        sendOnChange: true
      },
      {
        id: 'derived-data',
        name: 'Derived Data',
        context: 'vessels.self',
        path: '*',
        source: 'derived-data',
        enabled: true,
        period: 1000,
        qos: 0,
        retain: false,
        payloadFormat: 'full',
        sendOnChange: true
      },
      {
        id: 'pypilot',
        name: 'PyPilot Data',
        context: 'vessels.self',
        path: '*',
        source: 'pypilot',
        enabled: true,
        period: 1000,
        qos: 0,
        retain: false,
        payloadFormat: 'full',
        sendOnChange: true
      },
      {
        id: 'anchoralarm',
        name: 'Anchor Alarm',
        context: 'vessels.self',
        path: '*',
        source: 'anchoralarm',
        enabled: true,
        period: 1000,
        qos: 0,
        retain: false,
        payloadFormat: 'full',
        sendOnChange: true
      },
      {
        id: 'all-vessels',
        name: 'All Vessels (AIS)',
        context: 'vessels.*',
        path: '*',
        source: '', // All sources
        excludeMMSI: '368396230', // Exclude own vessel
        enabled: true,
        period: 1000,
        qos: 0,
        retain: false,
        payloadFormat: 'full',
        sendOnChange: true
      },
      {
        id: 'ais-vessels',
        name: 'AIS Vessels',
        context: 'vessels.urn:*',
        path: '*',
        source: '', // All sources
        excludeMMSI: '368396230', // Exclude own vessel
        enabled: true,
        period: 1000,
        qos: 0,
        retain: false,
        payloadFormat: 'full',
        sendOnChange: true
      }
    ];
  }

  // Plugin webapp routes
  plugin.registerWithRouter = function(router: Router): void {
    const express = require('express');
    
    app.debug('registerWithRouter called for MQTT export manager');
    
    // API Routes
    
    // Get current export rules
    router.get('/api/rules', (_: TypedRequest, res: TypedResponse<RulesApiResponse>) => {
      res.json({
        success: true,
        rules: state.exportRules,
        activeSubscriptions: state.activeSubscriptions.size,
        mqttConnected: state.mqttClient ? state.mqttClient.connected : false
      });
    });

    // Update export rules
    router.post('/api/rules', (req: TypedRequest<RuleUpdateRequest>, res: TypedResponse<ApiResponse>) => {
      try {
        const newRules = req.body.rules;
        if (!Array.isArray(newRules)) {
          return res.status(400).json({ success: false, error: 'Rules must be an array' });
        }

        state.exportRules = newRules;
        if (plugin.config) {
          plugin.config.exportRules = newRules;
        }
        
        // Save configuration to persistent storage
        app.savePluginOptions(plugin.config, (err) => {
          if (err) {
            app.debug('Error saving plugin configuration:', err);
            return res.status(500).json({ success: false, error: 'Failed to save configuration' });
          }
          
          // Update subscriptions with new rules
          updateSubscriptions();
          
          res.json({ success: true, message: 'Export rules updated and saved' });
        });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Get MQTT connection status
    router.get('/api/mqtt-status', (_: TypedRequest, res: TypedResponse<MQTTStatusApiResponse>) => {
      res.json({
        success: true,
        connected: state.mqttClient ? state.mqttClient.connected : false,
        broker: state.currentConfig?.mqttBroker,
        clientId: state.currentConfig?.mqttClientId
      });
    });

    // Test MQTT connection
    router.post('/api/test-mqtt', (_: TypedRequest, res: TypedResponse<ApiResponse>) => {
      try {
        if (!state.mqttClient || !state.mqttClient.connected) {
          return res.status(503).json({ success: false, error: 'MQTT not connected' });
        }

        const testTopic = `${state.currentConfig?.topicPrefix || 'test'}/signalk-mqtt-export-test`;
        const testPayload = JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: 'Test message from SignalK MQTT Export Manager'
        });

        state.mqttClient.publish(testTopic, testPayload, { qos: 0 });
        res.json({ success: true, message: 'Test message published', topic: testTopic });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Serve static files
    const publicPath = path.join(__dirname, '../public');
    if (fs.existsSync(publicPath)) {
      router.use(express.static(publicPath));
      app.debug('Static files served from:', publicPath);
    }

    app.debug('MQTT Export Manager web routes registered');
  };

  // Configuration schema
  plugin.schema = {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        title: 'Enable MQTT Export',
        description: 'Enable/disable the MQTT export functionality',
        default: true
      },
      mqttBroker: {
        type: 'string',
        title: 'MQTT Broker URL',
        description: 'MQTT broker connection string (e.g., mqtt://localhost:1883)',
        default: 'mqtt://localhost:1883'
      },
      mqttClientId: {
        type: 'string',
        title: 'MQTT Client ID',
        description: 'Unique client identifier for MQTT connection',
        default: 'signalk-mqtt-export'
      },
      mqttUsername: {
        type: 'string',
        title: 'MQTT Username',
        description: 'Username for MQTT authentication (optional)',
        default: ''
      },
      mqttPassword: {
        type: 'string',
        title: 'MQTT Password',
        description: 'Password for MQTT authentication (optional)',
        default: ''
      },
      topicPrefix: {
        type: 'string',
        title: 'Topic Prefix',
        description: 'Optional prefix for all MQTT topics',
        default: ''
      },
    }
  };

  return plugin;
};