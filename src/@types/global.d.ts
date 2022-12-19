import { Player } from 'discord-player';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_AUTH_TOKEN: string;
      NODE_ENV: 'development' | 'production';
      CLIENT_TOKEN: string;
      OPEN_AI_TOKEN?: string;
    }
  }
  // var player: Player;
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
