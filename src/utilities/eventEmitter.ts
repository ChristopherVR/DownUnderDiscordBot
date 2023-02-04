import EventEmitter from 'events';

const eventHandler = new EventEmitter();

eventHandler.on('performBackgroundTask', () => {
  console.log('activity log');
});

export default {
  // emit: (args: unknown[]) => eventHandler.emit('performBackgroundTask', args);
};
