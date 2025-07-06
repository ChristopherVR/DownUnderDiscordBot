import { Command } from './models/discord.js';

let commands: Command<any>[] = [];
let miscCommands: string[] = [];
let musicCommands: string[] = [];

export function setCommands(allCommands: Command<any>[], misc: string[], music: string[]) {
  commands = allCommands;
  miscCommands = misc;
  musicCommands = music;
}

export function getCommands(): Command<any>[] {
  return commands;
}

export function getMiscCommands(): string[] {
  return miscCommands;
}

export function getMusicCommands(): string[] {
  return musicCommands;
}

export function findCommand(commandName: string): Command<any> | undefined {
  return commands.find((c) => c.name === commandName);
}
