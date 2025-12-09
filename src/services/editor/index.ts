/**
 * Editor Service Module
 *
 * Barrel export for video editor service
 */

export { EditorService } from "./editor.service";
export { EditorValidator } from "./editor.validator";
export { EditorRepository } from "./editor.repository";
export { EditorMapper } from "./editor.mapper";
export {
  getEditorService,
  getEditorServiceWithoutCache,
  resetEditorService,
  createEditorService,
  initializeEditorService,
} from "./editor.factory";

export {
  MediaService,
  getMediaService,
  resetMediaService,
} from "./media.service";

export type {
  VideoProject,
  ProjectDto,
  CreateProjectDto,
  UpdateProjectDto,
  AddClipDto,
  AddTextDto,
  ExportProjectDto,
  ExportJobDto,
  VideoClip,
  AudioTrack,
  TextOverlay,
  Effect,
  Transition,
  TimelineData,
  ProjectSettings,
  ExportSettings,
  VideoMetadata,
  VideoFormat,
  VideoQuality,
  ProjectStatus,
  EffectType,
  TransitionType,
  EditorServiceOptions,
} from "./editor.types";
