// Auto-generated translation key types for type safety
// These types ensure that translation keys are valid at compile time

export interface CommonTranslations {
  'dashboard.title': string;
  'dashboard.subtitle': string;
  'dashboard.navigation.dashboard': string;
  'dashboard.navigation.auditLogs': string;
  'dashboard.navigation.commandInvocation': string;
  'dashboard.navigation.musicPlayer': string;
  'dashboard.navigation.botManagement': string;
  'dashboard.navigation.settings': string;
  'dashboard.navigation.help': string;
  'dashboard.status.online': string;
  'dashboard.status.offline': string;
  'dashboard.status.connected': string;
  'dashboard.status.disconnected': string;
  'dashboard.status.connecting': string;
  'dashboard.status.reconnecting': string;
  'dashboard.status.ready': string;
  'dashboard.status.error': string;
  'dashboard.health.healthy': string;
  'dashboard.health.degraded': string;
  'dashboard.health.critical': string;
  'dashboard.health.unknown': string;
  'buttons.play': string;
  'buttons.pause': string;
  'buttons.stop': string;
  'buttons.next': string;
  'buttons.previous': string;
  'buttons.search': string;
  'buttons.upload': string;
  'buttons.execute': string;
  'buttons.retry': string;
  'buttons.cancel': string;
  'buttons.save': string;
  'buttons.delete': string;
  'buttons.edit': string;
  'buttons.view': string;
  'buttons.close': string;
  'buttons.back': string;
  'buttons.refresh': string;
  'buttons.clear': string;
  'buttons.reset': string;
  'buttons.apply': string;
  'buttons.confirm': string;
  'buttons.dismiss': string;
  'buttons.copy': string;
  'buttons.download': string;
  'buttons.export': string;
  'buttons.import': string;
  'buttons.connect': string;
  'buttons.disconnect': string;
  'buttons.enable': string;
  'buttons.disable': string;
  'buttons.start': string;
  'buttons.restart': string;
  'buttons.configure': string;
  [key: string]: string;
}

export interface ErrorTranslations {
  'connection.failed': string;
  'connection.lost': string;
  'connection.timeout': string;
  'connection.websocket.failed': string;
  'connection.websocket.disconnected': string;
  'connection.websocket.reconnecting': string;
  'connection.websocket.reconnected': string;
  'connection.discord.apiError': string;
  'connection.discord.rateLimited': string;
  'connection.discord.unauthorized': string;
  'command.invalid': string;
  'command.unauthorized': string;
  'command.failed': string;
  'command.notFound': string;
  'command.validation.required': string;
  'command.validation.invalidType': string;
  'command.validation.outOfRange': string;
  'command.validation.invalidChoice': string;
  'command.execution.timeout': string;
  'command.execution.botNotReady': string;
  'command.execution.channelNotFound': string;
  'command.execution.permissionDenied': string;
  'upload.fileTooBig': string;
  'upload.invalidFormat': string;
  'upload.failed': string;
  'upload.processing.failed': string;
  'upload.processing.corrupted': string;
  'upload.processing.unsupported': string;
  'upload.storage.full': string;
  'upload.storage.permission': string;
  'upload.storage.diskSpace': string;
  'player.trackNotFound': string;
  'player.playbackFailed': string;
  'player.queueEmpty': string;
  'player.voice.notConnected': string;
  'player.voice.connectionFailed': string;
  'player.voice.permissionDenied': string;
  'player.voice.channelFull': string;
  'player.source.unavailable': string;
  'player.source.geoblocked': string;
  'player.source.ageRestricted': string;
  'player.source.copyright': string;
  'bot.notConnected': string;
  'bot.instanceNotFound': string;
  'bot.commandFailed': string;
  'bot.management.setActiveFailed': string;
  'bot.management.instanceOffline': string;
  'bot.management.multipleInstances': string;
  'bot.management.noInstances': string;
  'bot.state.syncFailed': string;
  'bot.state.outdated': string;
  'bot.state.unavailable': string;
  generic: string;
  fallback: string;
  [key: string]: string;
}

export interface UITranslations {
  'dashboard.title': string;
  'dashboard.welcome': string;
  'dashboard.botInstances': string;
  'dashboard.connectionStatus': string;
  'dashboard.currentActivity': string;
  'dashboard.quickActions': string;
  'dashboard.recentActivity': string;
  'dashboard.systemHealth': string;
  'musicPlayer.title': string;
  'musicPlayer.currentTrack': string;
  'musicPlayer.noTrack': string;
  'musicPlayer.queue': string;
  'musicPlayer.emptyQueue': string;
  'musicPlayer.uploadFiles': string;
  'musicPlayer.dragDrop': string;
  'musicPlayer.supportedFormats': string;
  'musicPlayer.controls.play': string;
  'musicPlayer.controls.pause': string;
  'musicPlayer.controls.stop': string;
  'musicPlayer.controls.next': string;
  'musicPlayer.controls.previous': string;
  'musicPlayer.controls.shuffle': string;
  'musicPlayer.controls.repeat': string;
  'musicPlayer.controls.volume': string;
  'musicPlayer.controls.mute': string;
  'musicPlayer.controls.seek': string;
  [key: string]: string;
}

export interface CommandTranslations {
  'play.name': string;
  'play.description': string;
  'play.options.query': string;
  'play.options.playlist': string;
  'play.options.file': string;
  'play.responses.success': string;
  'play.responses.queued': string;
  'play.responses.notFound': string;
  'play.responses.error': string;
  'pause.name': string;
  'pause.description': string;
  'pause.responses.success': string;
  'pause.responses.notPlaying': string;
  'pause.responses.error': string;
  [key: string]: string;
}

// Union type for all translation namespaces
export type TranslationKey =
  | keyof CommonTranslations
  | keyof ErrorTranslations
  | keyof UITranslations
  | keyof CommandTranslations;

// Helper type for translation function parameters
export interface TranslationOptions {
  [key: string]: string | number | boolean;
}

// Type-safe translation function signature
export type TranslationFunction = (key: TranslationKey, options?: TranslationOptions) => string;
