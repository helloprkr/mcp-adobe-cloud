/**
 * Premiere Pro adapter using ExtendScript
 */
import { AdobeAppType } from '../core/types';
import { logger } from '../utils/logger';

// ExtendScript communication interface 
export interface ExtendScriptInterface {
  evaluateScript(script: string): Promise<any>;
  evaluateScriptFile(filePath: string): Promise<any>;
  runAsyncTask(taskId: string, script: string): Promise<any>;
  cancelTask(taskId: string): Promise<boolean>;
}

// Project metadata
export interface PremiereProject {
  path: string;
  name: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  sequenceCount: number;
}

// Sequence metadata
export interface PremiereSequence {
  id: string;
  name: string;
  fps: number;
  duration: number;
  startTimecode: string;
  trackCount: {
    video: number;
    audio: number;
  };
}

// Clip metadata
export interface PremiereClip {
  id: string;
  name: string;
  type: string;
  path?: string;
  inPoint: number;
  outPoint: number;
  duration: number;
  startTime: number;
  trackNumber: number;
  trackType: 'video' | 'audio';
}

// Marker metadata
export interface PremiereMarker {
  id: string;
  name: string;
  time: number;
  comment?: string;
  type: string;
  duration?: number;
}

/**
 * Premiere Pro Adapter using ExtendScript
 */
export class PremiereProAdapter {
  private extendScript: ExtendScriptInterface;
  private taskCounter: number = 0;
  private activeTasks: Set<string> = new Set();

  constructor(extendScriptInterface: ExtendScriptInterface) {
    this.extendScript = extendScriptInterface;
  }

  /**
   * Get active project information
   */
  async getActiveProject(): Promise<PremiereProject> {
    const script = `
      var project = app.project;
      if (!project) {
        throw new Error("No project is currently open");
      }
      
      // Calculate total duration based on the active sequence
      var activeSequence = project.activeSequence;
      var duration = 0;
      if (activeSequence) {
        duration = activeSequence.end;
      }
      
      // Count sequences
      var sequenceCount = 0;
      for (var i = 0; i < project.sequences.numSequences; i++) {
        sequenceCount++;
      }
      
      // Return project info
      var projectInfo = {
        path: project.path,
        name: project.name,
        fps: activeSequence ? activeSequence.frameRate : 0,
        width: activeSequence ? activeSequence.frameSizeHorizontal : 0,
        height: activeSequence ? activeSequence.frameSizeVertical : 0,
        duration: duration,
        sequenceCount: sequenceCount
      };
      
      JSON.stringify(projectInfo);
    `;
    
    try {
      const result = await this.extendScript.evaluateScript(script);
      return JSON.parse(result);
    } catch (error) {
      logger.error('Error getting active project information', error);
      throw error;
    }
  }

  /**
   * Get all sequences in the project
   */
  async getSequences(): Promise<PremiereSequence[]> {
    const script = `
      var project = app.project;
      if (!project) {
        throw new Error("No project is currently open");
      }
      
      var sequences = [];
      for (var i = 0; i < project.sequences.numSequences; i++) {
        var seq = project.sequences[i];
        var videoTracks = 0;
        var audioTracks = 0;
        
        // Count tracks
        for (var t = 0; t < seq.videoTracks.numTracks; t++) {
          videoTracks++;
        }
        for (var t = 0; t < seq.audioTracks.numTracks; t++) {
          audioTracks++;
        }
        
        sequences.push({
          id: seq.sequenceID,
          name: seq.name,
          fps: seq.frameRate,
          duration: seq.end,
          startTimecode: seq.zeroPoint.toString(),
          trackCount: {
            video: videoTracks,
            audio: audioTracks
          }
        });
      }
      
      JSON.stringify(sequences);
    `;
    
    try {
      const result = await this.extendScript.evaluateScript(script);
      return JSON.parse(result);
    } catch (error) {
      logger.error('Error getting sequences', error);
      throw error;
    }
  }

  /**
   * Get active sequence information
   */
  async getActiveSequence(): Promise<PremiereSequence | null> {
    const script = `
      var project = app.project;
      if (!project) {
        throw new Error("No project is currently open");
      }
      
      var activeSequence = project.activeSequence;
      if (!activeSequence) {
        JSON.stringify(null);
      } else {
        var videoTracks = 0;
        var audioTracks = 0;
        
        // Count tracks
        for (var t = 0; t < activeSequence.videoTracks.numTracks; t++) {
          videoTracks++;
        }
        for (var t = 0; t < activeSequence.audioTracks.numTracks; t++) {
          audioTracks++;
        }
        
        var sequenceInfo = {
          id: activeSequence.sequenceID,
          name: activeSequence.name,
          fps: activeSequence.frameRate,
          duration: activeSequence.end,
          startTimecode: activeSequence.zeroPoint.toString(),
          trackCount: {
            video: videoTracks,
            audio: audioTracks
          }
        };
        
        JSON.stringify(sequenceInfo);
      }
    `;
    
    try {
      const result = await this.extendScript.evaluateScript(script);
      return result !== "null" ? JSON.parse(result) : null;
    } catch (error) {
      logger.error('Error getting active sequence information', error);
      throw error;
    }
  }

  /**
   * Get clips in a sequence
   */
  async getClips(sequenceId?: string): Promise<PremiereClip[]> {
    const script = `
      var project = app.project;
      if (!project) {
        throw new Error("No project is currently open");
      }
      
      var targetSequence;
      var sequenceId = "${sequenceId || ''}";
      
      // If sequenceId is provided, find that sequence
      if (sequenceId) {
        for (var i = 0; i < project.sequences.numSequences; i++) {
          if (project.sequences[i].sequenceID === sequenceId) {
            targetSequence = project.sequences[i];
            break;
          }
        }
      } else {
        // Otherwise use active sequence
        targetSequence = project.activeSequence;
      }
      
      if (!targetSequence) {
        throw new Error("Target sequence not found");
      }
      
      var clips = [];
      
      // Process video tracks
      for (var v = 0; v < targetSequence.videoTracks.numTracks; v++) {
        var track = targetSequence.videoTracks[v];
        
        // Process clips in track
        for (var c = 0; c < track.clips.numItems; c++) {
          var clip = track.clips[c];
          
          clips.push({
            id: clip.nodeId,
            name: clip.name,
            type: clip.type.toString(),
            path: clip.projectItem ? clip.projectItem.getMediaPath() : undefined,
            inPoint: clip.inPoint.seconds,
            outPoint: clip.outPoint.seconds,
            duration: clip.duration.seconds,
            startTime: clip.start.seconds,
            trackNumber: v,
            trackType: "video"
          });
        }
      }
      
      // Process audio tracks
      for (var a = 0; a < targetSequence.audioTracks.numTracks; a++) {
        var track = targetSequence.audioTracks[a];
        
        // Process clips in track
        for (var c = 0; c < track.clips.numItems; c++) {
          var clip = track.clips[c];
          
          clips.push({
            id: clip.nodeId,
            name: clip.name,
            type: clip.type.toString(),
            path: clip.projectItem ? clip.projectItem.getMediaPath() : undefined,
            inPoint: clip.inPoint.seconds,
            outPoint: clip.outPoint.seconds,
            duration: clip.duration.seconds,
            startTime: clip.start.seconds,
            trackNumber: a,
            trackType: "audio"
          });
        }
      }
      
      JSON.stringify(clips);
    `.replace('${sequenceId || \'\'}', sequenceId || '');
    
    try {
      const result = await this.extendScript.evaluateScript(script);
      return JSON.parse(result);
    } catch (error) {
      logger.error('Error getting clips', error);
      throw error;
    }
  }

  /**
   * Get markers from a sequence
   */
  async getMarkers(sequenceId?: string): Promise<PremiereMarker[]> {
    const script = `
      var project = app.project;
      if (!project) {
        throw new Error("No project is currently open");
      }
      
      var targetSequence;
      var sequenceId = "${sequenceId || ''}";
      
      // If sequenceId is provided, find that sequence
      if (sequenceId) {
        for (var i = 0; i < project.sequences.numSequences; i++) {
          if (project.sequences[i].sequenceID === sequenceId) {
            targetSequence = project.sequences[i];
            break;
          }
        }
      } else {
        // Otherwise use active sequence
        targetSequence = project.activeSequence;
      }
      
      if (!targetSequence) {
        throw new Error("Target sequence not found");
      }
      
      var markers = [];
      var markerCollection = targetSequence.markers;
      
      // Process markers
      for (var i = 0; i < markerCollection.numMarkers; i++) {
        var marker = markerCollection.getMarkerAt(i);
        
        markers.push({
          id: marker.guid,
          name: marker.name,
          time: marker.start.seconds,
          comment: marker.comments,
          type: marker.type.toString(),
          duration: marker.end ? (marker.end.seconds - marker.start.seconds) : undefined
        });
      }
      
      JSON.stringify(markers);
    `.replace('${sequenceId || \'\'}', sequenceId || '');
    
    try {
      const result = await this.extendScript.evaluateScript(script);
      return JSON.parse(result);
    } catch (error) {
      logger.error('Error getting markers', error);
      throw error;
    }
  }

  /**
   * Create a marker in a sequence
   */
  async createMarker(
    options: {
      sequenceId?: string;
      time: number;
      name: string;
      comment?: string;
      type?: string;
      duration?: number;
    }
  ): Promise<PremiereMarker> {
    const script = `
      var project = app.project;
      if (!project) {
        throw new Error("No project is currently open");
      }
      
      var targetSequence;
      var sequenceId = "${options.sequenceId || ''}";
      
      // If sequenceId is provided, find that sequence
      if (sequenceId) {
        for (var i = 0; i < project.sequences.numSequences; i++) {
          if (project.sequences[i].sequenceID === sequenceId) {
            targetSequence = project.sequences[i];
            break;
          }
        }
      } else {
        // Otherwise use active sequence
        targetSequence = project.activeSequence;
      }
      
      if (!targetSequence) {
        throw new Error("Target sequence not found");
      }
      
      // Create time object
      var markerTime = new Time();
      markerTime.seconds = ${options.time};
      
      // Set marker properties
      var markerProps = {
        name: "${options.name}",
        comments: "${options.comment || ''}",
        type: "${options.type || 'Comment'}"
      };
      
      // Add duration if provided
      if (${options.duration ? 'true' : 'false'}) {
        var endTime = new Time();
        endTime.seconds = ${options.time} + ${options.duration || 0};
        markerProps.end = endTime;
      }
      
      // Create marker
      var marker = targetSequence.markers.createMarker(markerTime, markerProps);
      
      // Return created marker
      var result = {
        id: marker.guid,
        name: marker.name,
        time: marker.start.seconds,
        comment: marker.comments,
        type: marker.type.toString(),
        duration: marker.end ? (marker.end.seconds - marker.start.seconds) : undefined
      };
      
      JSON.stringify(result);
    `
      .replace('${options.sequenceId || \'\'}', options.sequenceId || '')
      .replace('${options.time}', options.time.toString())
      .replace('${options.name}', options.name)
      .replace('${options.comment || \'\'}', options.comment || '')
      .replace('${options.type || \'Comment\'}', options.type || 'Comment')
      .replace('${options.time} + ${options.duration || 0}', `${options.time} + ${options.duration || 0}`);
    
    try {
      const result = await this.extendScript.evaluateScript(script);
      return JSON.parse(result);
    } catch (error) {
      logger.error('Error creating marker', error);
      throw error;
    }
  }

  /**
   * Perform an asynchronous task in Premiere
   */
  async runAsyncTask(script: string): Promise<string> {
    const taskId = `premiere_task_${++this.taskCounter}`;
    this.activeTasks.add(taskId);
    
    try {
      const result = await this.extendScript.runAsyncTask(taskId, script);
      return result;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  /**
   * Cancel all active tasks
   */
  async cancelAllTasks(): Promise<void> {
    const promises = Array.from(this.activeTasks).map(taskId => 
      this.extendScript.cancelTask(taskId)
    );
    
    await Promise.all(promises);
    this.activeTasks.clear();
  }

  /**
   * Get app type
   */
  getAppType(): AdobeAppType {
    return AdobeAppType.PREMIERE_PRO;
  }
}