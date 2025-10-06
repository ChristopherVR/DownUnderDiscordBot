/**
 * Manual verification script for error message integration
 * This can be run in the browser console to verify localized error handling
 */

import { ErrorMessageService } from './errorMessages';
import { ErrorHandler } from './errorHandler';
import type { TFunction } from 'i18next';

// Mock translation function for testing
const mockT = ((
  key: string,
  fallbackOrOptions?: string | Record<string, unknown>,
  legacyOptions?: Record<string, unknown>,
) => {
  const translations: Record<string, string> = {
    'errors.generic': 'An unexpected error occurred. Please try again.',
    'errors.fallback': 'Error details are not available.',
    'errors.connection.failed': 'Connection failed. Please check your network and try again.',
    'errors.connection.timeout': 'Connection timeout. Please try again.',
    'errors.connection.websocket.failed': 'WebSocket connection failed. Real-time updates may not work.',
    'errors.command.unauthorized': "You don't have permission to execute this command.",
    'errors.command.invalid': 'Invalid command. Please check the command syntax.',
    'errors.player.trackNotFound': 'Track not found or unavailable.',
    'errors.player.voice.notConnected': 'Bot is not connected to a voice channel.',
    'errors.upload.fileTooBig': 'File is too large. Maximum size is {{maxSize}}MB.',
    'errors.upload.invalidFormat': 'Invalid file format. Supported formats: {{formats}}.',
    'errors.api.notFound': 'The requested resource was not found.',
    'errors.retry': 'Try Again',
    'errors.guidance.musicPlayer.play': 'Make sure the bot is connected to a voice channel and try again.',
    'errors.guidance.commandExecutor.execute': 'Verify all required fields are filled and try again.',
    'ui.error': 'Error',
    'ui.component': 'Component',
  };

  let fallback: string | undefined;
  if (typeof fallbackOrOptions === 'string') {
    fallback = fallbackOrOptions;
  } else if (
    fallbackOrOptions &&
    typeof fallbackOrOptions === 'object' &&
    'defaultValue' in fallbackOrOptions &&
    typeof fallbackOrOptions.defaultValue === 'string'
  ) {
    fallback = fallbackOrOptions.defaultValue;
  }

  const interpolationSource: Record<string, unknown> | undefined =
    fallbackOrOptions && typeof fallbackOrOptions === 'object'
      ? fallbackOrOptions
      : legacyOptions;

  const interpolationEntries =
    interpolationSource && typeof interpolationSource === 'object'
      ? (Object.entries(interpolationSource) as Array<[string, unknown]>).flatMap(([prop, value]) =>
          typeof value === 'string' && prop !== 'defaultValue' && prop !== 'ns' ? [[prop, value]] : [],
        )
      : [];

  const template = translations[key] ?? fallback ?? key;

  if (interpolationEntries.length > 0) {
    // Simple template replacement
    return interpolationEntries.reduce((acc, [prop, value]) => {
      return acc.replace(new RegExp(`\\{\\{${prop}\\}\\}`, 'g'), value);
    }, template);
  }

  return template;
}) as unknown as TFunction;

export function verifyErrorIntegration() {
  console.log('🔍 Verifying Error Message Integration...\n');

  const messageService = new ErrorMessageService(mockT);
  const errorHandler = new ErrorHandler(mockT);

  // Test 1: Basic error message localization
  console.log('✅ Test 1: Basic Error Message Localization');
  const basicError = messageService.getErrorMessage('connection.failed');
  console.log(`  Input: 'connection.failed'`);
  console.log(`  Output: '${basicError}'`);
  console.log(`  Expected: 'Connection failed. Please check your network and try again.'`);
  console.log(
    `  ✓ ${basicError === 'Connection failed. Please check your network and try again.' ? 'PASS' : 'FAIL'}\n`,
  );

  // Test 2: Component-specific error handling
  console.log('✅ Test 2: Component-Specific Error Handling');
  const componentError = messageService.getErrorMessage(new Error('track not found'), { component: 'MusicPlayer' });
  console.log(`  Input: Error('track not found') with component 'MusicPlayer'`);
  console.log(`  Output: '${componentError}'`);
  console.log(`  Expected: 'Track not found or unavailable.'`);
  console.log(`  ✓ ${componentError === 'Track not found or unavailable.' ? 'PASS' : 'FAIL'}\n`);

  // Test 3: Error guidance
  console.log('✅ Test 3: Contextual Error Guidance');
  const guidance = messageService.getErrorGuidance('play_failed', {
    component: 'MusicPlayer',
    action: 'play',
  });
  console.log(`  Input: 'play_failed' with MusicPlayer/play context`);
  console.log(`  Output: '${guidance}'`);
  console.log(`  Expected: 'Make sure the bot is connected to a voice channel and try again.'`);
  console.log(
    `  ✓ ${guidance === 'Make sure the bot is connected to a voice channel and try again.' ? 'PASS' : 'FAIL'}\n`,
  );

  // Test 4: Fallback mechanism
  console.log('✅ Test 4: Fallback Mechanism');
  const fallbackError = messageService.getErrorMessage('unknown.nonexistent.error');
  console.log(`  Input: 'unknown.nonexistent.error'`);
  console.log(`  Output: '${fallbackError}'`);
  console.log(`  Expected: 'An unexpected error occurred. Please try again.'`);
  console.log(`  ✓ ${fallbackError === 'An unexpected error occurred. Please try again.' ? 'PASS' : 'FAIL'}\n`);

  // Test 5: HTTP status code handling
  console.log('✅ Test 5: HTTP Status Code Handling');
  const httpError = messageService.getErrorMessage(new Error('401 unauthorized'));
  console.log(`  Input: Error('401 unauthorized')`);
  console.log(`  Output: '${httpError}'`);
  console.log(`  Expected: 'You don't have permission to execute this command.'`);
  console.log(`  ✓ ${httpError === "You don't have permission to execute this command." ? 'PASS' : 'FAIL'}\n`);

  // Test 6: Template variable replacement
  console.log('✅ Test 6: Template Variable Replacement');
  const templateError = messageService.getErrorMessage('upload.fileTooBig');
  console.log(`  Input: 'upload.fileTooBig'`);
  console.log(`  Output: '${templateError}'`);
  console.log(`  Expected: Contains 'File is too large'`);
  console.log(`  ✓ ${templateError.includes('File is too large') ? 'PASS' : 'FAIL'}\n`);

  // Test 7: Error normalization (using public handleError method)
  console.log('✅ Test 7: Error Normalization');
  const networkError = new Error('fetch failed');
  console.log(`  Input: Error('fetch failed') with API component`);
  const normalized = messageService.getErrorMessage(networkError);
  errorHandler.handleError(networkError, { component: 'NetworkLayer', action: 'fetch' });
  console.log(`  Output: '${normalized}'`);
  console.log(`  Expected: 'Connection failed. Please check your network and try again.'`);
  console.log(
    `  ✓ ${
      normalized === 'Connection failed. Please check your network and try again.' ? 'PASS' : 'FAIL'
    }\n`,
  );

  console.log('🎉 Error Integration Verification Complete!');

  return {
    basicError,
    componentError,
    guidance,
    fallbackError,
    httpError,
    templateError,
  };
}

// Export for use in browser console
declare global {
  interface Window {
    verifyErrorIntegration?: typeof verifyErrorIntegration;
  }
}

if (typeof window !== 'undefined') {
  window.verifyErrorIntegration = verifyErrorIntegration;
}
