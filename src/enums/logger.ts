export const enum DefaultLoggerMessage {
  GuildIsNotDefined = 'Discord player was unable to find a Guild (Discord Server).',
  GuildNotAvailableInteraction = 'Guild not available on interaction.',
  NoClientToken = 'Unable to start this discord bot. There is no Discord client token. Check if the environment specifies the CLIENT_TOKEN value.',
  NoExtractorsRegistered = 'No extractors registered. Unable to use this discord bot.',
  UnableToFindChannelToControl = 'Unable to find channel to control.',
  UnableToRetrieveCurrentQueueTimestamp = 'Unable to retrieve the current queue`s timestamp.',
  SomethingWentWrongTryingToFindTrack = 'Something went wrong trying to find tracks. Object: ',
  UnableToFindSlashCommand = 'Unable to find slash command with name - ',
  UnableToHandleCommand = 'An error occurred trying to handle the command. Error: ',
  InternalServerError = 'An internal server error occurred. Unable to handle request.',
  LocaleInstanceNotAvailable = 'Failed to retrieve localization value. The global localization instance is not available.',
}
