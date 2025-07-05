import pino from 'pino';

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
      level: process.env.PINO_LOG_LEVEL || 'info',
    },
    {
      target: 'pino/file',
      options: {
        destination: `./logs/all.log`,
        mkdir: true,
      },
      level: process.env.PINO_LOG_LEVEL || 'info',
    },
  ],
});

export const logger = pino(
  {
    level: process.env.PINO_LOG_LEVEL || 'info',
    redact: {
      paths: ['name', 'password', 'profile.address', 'profile.phone'],
      remove: true,
    },
  },
  transport,
);
