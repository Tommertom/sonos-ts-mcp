import { AVTransportService } from './av-transport.js';
import { RenderingControlService } from './rendering-control.js';
import { ZoneGroupTopologyService } from './zone-topology.js';
import type { SonosDevice } from '../types/sonos.js';

export interface DeviceSnapshot {
    // Transport state
    transportState: string;
    trackUri: string;
    trackMetadata: string;
    trackPosition: string;
    playMode: string;

    // Volume state
    volume: number;
    mute: boolean;
    bass: number;
    treble: number;
    loudness: boolean;

    // Group state
    wasCoordinator: boolean;
    groupMembers: string[];

    // Timestamp
    timestamp: number;
}

export class SnapshotService {
    constructor(private device: SonosDevice) { }

    /**
     * Take a snapshot of the current device state
     * @returns DeviceSnapshot object containing all relevant state
     */
    async snapshot(): Promise<DeviceSnapshot> {
        try {
            const avTransport = new AVTransportService(this.device);
            const renderingControl = new RenderingControlService(this.device);
            const zoneTopology = new ZoneGroupTopologyService(this.device);

            // Gather transport state
            const transportInfo = await avTransport.getTransportInfo();
            const positionInfo = await avTransport.getPositionInfo();

            // Gather volume/EQ state
            const volume = await renderingControl.getVolume() ?? 0;
            const mute = await renderingControl.getMute() ?? false;
            const bass = await renderingControl.getBass() ?? 0;
            const treble = await renderingControl.getTreble() ?? 0;
            const loudness = await renderingControl.getLoudness() ?? false;

            // Gather group state
            const isCoordinator = await zoneTopology.isCoordinator();
            const group = await zoneTopology.getGroup();

            // Get play mode
            const playMode = await avTransport.getPlayMode() ?? 'NORMAL';

            return {
                transportState: transportInfo?.state ?? 'STOPPED',
                trackUri: positionInfo?.track?.uri ?? '',
                trackMetadata: '', // Would need to extract from position info
                trackPosition: positionInfo?.position ?? '0:00:00',
                playMode,
                volume,
                mute,
                bass,
                treble,
                loudness,
                wasCoordinator: isCoordinator,
                groupMembers: group?.members ?? [],
                timestamp: Date.now(),
            };
        } catch (error) {
            throw new Error(`Failed to create snapshot: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Restore a previously saved snapshot
     * @param snapshot The snapshot to restore
     * @param fade Whether to fade volume up (only if playing)
     */
    async restore(snapshot: DeviceSnapshot, fade = false): Promise<boolean> {
        const avTransport = new AVTransportService(this.device);
        const renderingControl = new RenderingControlService(this.device);

        try {
            // Restore volume/EQ settings (do this first, while stopped)
            await renderingControl.setMute(snapshot.mute);
            await renderingControl.setBass(snapshot.bass);
            await renderingControl.setTreble(snapshot.treble);
            await renderingControl.setLoudness(snapshot.loudness);

            // Set volume
            if (fade && snapshot.transportState === 'PLAYING') {
                // Start at 0 and fade up
                await renderingControl.setVolume(0);
            } else {
                await renderingControl.setVolume(snapshot.volume);
            }

            // Restore play mode
            const validPlayModes = ['NORMAL', 'REPEAT_ALL', 'REPEAT_ONE', 'SHUFFLE_NOREPEAT', 'SHUFFLE'];
            if (validPlayModes.includes(snapshot.playMode)) {
                await avTransport.setPlayMode(snapshot.playMode as 'NORMAL' | 'REPEAT_ALL' | 'REPEAT_ONE' | 'SHUFFLE_NOREPEAT' | 'SHUFFLE');
            }

            // Restore transport state
            if (snapshot.trackUri) {
                await avTransport.setAVTransportURI(snapshot.trackUri, snapshot.trackMetadata);

                // Restore position
                if (snapshot.trackPosition && snapshot.trackPosition !== '0:00:00') {
                    await avTransport.seek('REL_TIME', snapshot.trackPosition);
                }

                // Restore playback state
                if (snapshot.transportState === 'PLAYING') {
                    await avTransport.play();

                    // Fade volume up if requested
                    if (fade) {
                        await renderingControl.rampToVolume(snapshot.volume);
                    }
                } else if (snapshot.transportState === 'PAUSED_PLAYBACK') {
                    await avTransport.pause();
                }
            }

            return true;
        } catch (error) {
            console.error('Failed to restore snapshot:', error);
            return false;
        }
    }

    /**
     * Quick snapshot and restore - useful for temporary interruptions
     * @param action Async function to run between snapshot and restore
     * @param fade Whether to fade volume on restore
     */
    async withSnapshot<T>(
        action: () => Promise<T>,
        fade = false
    ): Promise<{ result: T; restored: boolean }> {
        const snapshot = await this.snapshot();

        try {
            const result = await action();
            const restored = await this.restore(snapshot, fade);
            return { result, restored };
        } catch (error) {
            // Try to restore even if action fails
            await this.restore(snapshot, fade);
            throw error;
        }
    }
}
