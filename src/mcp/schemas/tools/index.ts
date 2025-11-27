import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export { discoveryTools } from './discovery-tools.js';
export { playbackTools } from './playback-tools.js';
export { queueTools } from './queue-tools.js';
export { volumeTools } from './volume-tools.js';
export { groupTools } from './group-tools.js';
export { libraryTools } from './library-tools.js';
export { alarmTools } from './alarm-tools.js';
export { snapshotTools } from './snapshot-tools.js';
export { eventTools } from './event-tools.js';
export { musicServiceTools } from './music-service-tools.js';
export { agentTools } from './agent-tools.js';

import { discoveryTools } from './discovery-tools.js';
import { playbackTools } from './playback-tools.js';
import { queueTools } from './queue-tools.js';
import { volumeTools } from './volume-tools.js';
import { groupTools } from './group-tools.js';
import { libraryTools } from './library-tools.js';
import { alarmTools } from './alarm-tools.js';
import { snapshotTools } from './snapshot-tools.js';
import { eventTools } from './event-tools.js';
import { musicServiceTools } from './music-service-tools.js';
import { agentTools } from './agent-tools.js';

export const allTools: Tool[] = [
    ...discoveryTools,
    ...playbackTools,
    ...queueTools,
    ...volumeTools,
    ...groupTools,
    ...libraryTools,
    ...alarmTools,
    ...snapshotTools,
    ...eventTools,
    ...musicServiceTools,
    ...agentTools,
];
