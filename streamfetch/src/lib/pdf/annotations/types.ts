/**
 * Annotation Types
 *
 * Type definitions for PDF annotations using Fabric.js
 */

import type { FabricObject } from 'fabric';

/**
 * Base annotation interface
 */
export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  createdAt: string;
  updatedAt: string;
  author?: string;
}

/**
 * Annotation types
 */
export enum AnnotationType {
  TEXT = 'text',
  HIGHLIGHT = 'highlight',
  AREA_MARKER = 'areaMarker', // Area-based highlighting (draw a rectangle)
  DRAWING = 'drawing',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  ARROW = 'arrow',
  POLYGON = 'polygon',
}

/**
 * Text annotation
 */
export interface TextAnnotation extends BaseAnnotation {
  type: AnnotationType.TEXT;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor?: string;
}

/**
 * Highlight annotation
 */
export interface HighlightAnnotation extends BaseAnnotation {
  type: AnnotationType.HIGHLIGHT;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

/**
 * Drawing annotation (free-hand)
 */
export interface DrawingAnnotation extends BaseAnnotation {
  type: AnnotationType.DRAWING;
  path: string; // SVG path data
  strokeWidth: number;
  strokeColor: string;
  opacity: number;
}

/**
 * Shape annotation (rectangle, circle, etc.)
 */
export interface ShapeAnnotation extends BaseAnnotation {
  type: AnnotationType.RECTANGLE | AnnotationType.CIRCLE | AnnotationType.ARROW | AnnotationType.POLYGON;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  fillOpacity?: number;
  // For arrows
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  // For polygons
  points?: { x: number; y: number }[];
}

/**
 * Union type for all annotations
 */
export type Annotation =
  | TextAnnotation
  | HighlightAnnotation
  | DrawingAnnotation
  | ShapeAnnotation;

/**
 * Annotation tool configuration
 */
export interface AnnotationToolConfig {
  // Text tool
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textColor?: string;

  // Highlight tool
  highlightColor?: string;
  highlightOpacity?: number;

  // Drawing tool
  strokeWidth?: number;
  strokeColor?: string;
  drawingOpacity?: number;

  // Shape tools
  shapeStrokeColor?: string;
  shapeStrokeWidth?: number;
  shapeFillColor?: string;
  shapeFillOpacity?: number;
}

/**
 * Annotation state
 */
export interface AnnotationState {
  annotations: Map<number, Annotation[]>; // Page number -> annotations
  selectedAnnotationId: string | null;
  activeTool: AnnotationType | null;
  toolConfig: AnnotationToolConfig;
}

/**
 * Fabric.js object with annotation metadata
 */
export interface FabricAnnotationObject extends FabricObject {
  annotationId?: string;
  annotationType?: AnnotationType;
  pageNumber?: number;
}
