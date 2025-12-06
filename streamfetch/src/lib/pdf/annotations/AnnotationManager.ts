/**
 * Annotation Manager
 *
 * Manages Fabric.js canvas and annotation operations
 */

import {
  Canvas,
  Circle,
  IText,
  Rect,
  Path,
  FabricObject,
} from 'fabric';
import type {
  Annotation,
  AnnotationType,
  TextAnnotation,
  HighlightAnnotation,
  DrawingAnnotation,
  ShapeAnnotation,
  AnnotationToolConfig,
  FabricAnnotationObject,
} from './types';

export class AnnotationManager {
  private canvas: Canvas | null = null;
  private currentPageNumber: number = 1;
  private annotations: Map<number, Annotation[]> = new Map();
  private toolConfig: AnnotationToolConfig = this.getDefaultToolConfig();
  private isDrawing: boolean = false;
  private drawingPath: Path | null = null;
  private activeTool: AnnotationType | null = null;
  private shapeStartPos: { x: number; y: number } | null = null;
  private isDrawingShape: boolean = false;

  /**
   * Initialize Fabric.js canvas
   */
  initialize(canvasElement: HTMLCanvasElement, width: number, height: number): void {
    // Only initialize once - if canvas exists, just resize it
    if (this.canvas) {
      this.resize(width, height);
      return;
    }

    this.canvas = new Canvas(canvasElement, {
      width,
      height,
      selection: true,
      preserveObjectStacking: true,
    });

    this.setupEventHandlers();
  }

  /**
   * Get default tool configuration
   */
  private getDefaultToolConfig(): AnnotationToolConfig {
    return {
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textColor: '#000000',
      highlightColor: '#FFFF00',
      highlightOpacity: 0.3,
      strokeWidth: 2,
      strokeColor: '#FF0000',
      drawingOpacity: 1,
      shapeStrokeColor: '#0000FF',
      shapeStrokeWidth: 2,
      shapeFillColor: '#0000FF',
      shapeFillOpacity: 0.1,
    };
  }

  /**
   * Setup canvas event handlers
   */
  private setupEventHandlers(): void {
    if (!this.canvas) return;

    // Object selection
    this.canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0] as FabricAnnotationObject;
      if (selected?.annotationId) {
        this.onAnnotationSelected?.(selected.annotationId);
      }
    });

    this.canvas.on('selection:updated', (e) => {
      const selected = e.selected?.[0] as FabricAnnotationObject;
      if (selected?.annotationId) {
        this.onAnnotationSelected?.(selected.annotationId);
      }
    });

    this.canvas.on('selection:cleared', () => {
      this.onAnnotationSelected?.(null);
    });

    // Object modification
    this.canvas.on('object:modified', (e) => {
      const obj = e.target as FabricAnnotationObject;
      if (obj?.annotationId) {
        this.updateAnnotationFromFabricObject(obj);
      }
    });

    // Mouse down - start shape drawing or add text
    this.canvas.on('mouse:down', (e) => {
      if (!this.activeTool || !e.pointer) return;

      // If clicking on an existing object, let Fabric.js handle selection/resize/move
      // Don't create new annotations when interacting with existing ones
      if (e.target) {
        return;
      }

      const { x, y } = e.pointer;

      // Text tool - add text immediately on click (only on empty canvas)
      if (this.activeTool === 'text') {
        this.addTextAnnotation(x, y, 'Click to edit');
        return;
      }

      // Shape tools - start drawing (only on empty canvas)
      // Note: 'highlight' is handled via text selection in AnnotatablePDFViewer
      // 'areaMarker' can be used for area-based highlighting
      if (this.activeTool === 'areaMarker' || this.activeTool === 'rectangle' || this.activeTool === 'circle') {
        this.isDrawingShape = true;
        this.shapeStartPos = { x, y };
      }
    });

    // Mouse up - finish shape drawing
    this.canvas.on('mouse:up', (e) => {
      if (!this.activeTool || !this.isDrawingShape || !this.shapeStartPos || !e.pointer) {
        return;
      }

      const { x, y } = e.pointer;
      const width = Math.abs(x - this.shapeStartPos.x);
      const height = Math.abs(y - this.shapeStartPos.y);
      const startX = Math.min(x, this.shapeStartPos.x);
      const startY = Math.min(y, this.shapeStartPos.y);

      // Only create if shape has meaningful size
      if (width > 5 && height > 5) {
        if (this.activeTool === 'areaMarker') {
          // Area marker uses highlight styling
          this.addHighlightAnnotation(startX, startY, width, height);
        } else if (this.activeTool === 'rectangle') {
          this.addRectangleAnnotation(startX, startY, width, height);
        } else if (this.activeTool === 'circle') {
          const radius = Math.min(width, height) / 2;
          this.addCircleAnnotation(startX + width / 2, startY + height / 2, radius);
        }
      }

      this.isDrawingShape = false;
      this.shapeStartPos = null;
    });
  }

  /**
   * Set the active annotation tool
   */
  setActiveTool(tool: AnnotationType | null): void {
    this.activeTool = tool;

    if (!this.canvas) return;

    // Disable drawing mode when switching tools
    if (tool !== 'drawing') {
      this.canvas.isDrawingMode = false;
    }

    // Enable drawing mode for freehand
    if (tool === 'drawing') {
      this.enableDrawingMode();
    }

    // Disable selection when a tool is active (except for no tool)
    this.canvas.selection = tool === null;
  }

  /**
   * Get current active tool
   */
  getActiveTool(): AnnotationType | null {
    return this.activeTool;
  }

  /**
   * Set active page
   */
  setPage(pageNumber: number): void {
    if (this.currentPageNumber === pageNumber) return;

    // Save current page annotations
    this.saveCurrentPageAnnotations();

    // Load new page annotations
    this.currentPageNumber = pageNumber;
    this.loadPageAnnotations(pageNumber);
  }

  /**
   * Save current page annotations to memory
   */
  private saveCurrentPageAnnotations(): void {
    if (!this.canvas) return;

    const pageAnnotations: Annotation[] = [];
    const objects = this.canvas.getObjects() as FabricAnnotationObject[];

    objects.forEach((obj) => {
      if (obj.annotationId && obj.annotationType) {
        const annotation = this.fabricObjectToAnnotation(obj);
        if (annotation) {
          pageAnnotations.push(annotation);
        }
      }
    });

    this.annotations.set(this.currentPageNumber, pageAnnotations);
  }

  /**
   * Load annotations for specific page
   */
  private loadPageAnnotations(pageNumber: number): void {
    if (!this.canvas) return;

    // Clear canvas
    this.canvas.clear();

    // Load annotations
    const pageAnnotations = this.annotations.get(pageNumber) || [];
    pageAnnotations.forEach((annotation) => {
      this.addAnnotationToCanvas(annotation);
    });

    this.canvas.renderAll();
  }

  /**
   * Convert Fabric object to annotation
   */
  private fabricObjectToAnnotation(obj: FabricAnnotationObject): Annotation | null {
    if (!obj.annotationId || !obj.annotationType) return null;

    const baseAnnotation = {
      id: obj.annotationId,
      type: obj.annotationType,
      pageNumber: this.currentPageNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    switch (obj.annotationType) {
      case 'text': {
        const textObj = obj as any;
        return {
          ...baseAnnotation,
          type: 'text' as AnnotationType.TEXT,
          text: textObj.text || '',
          x: textObj.left || 0,
          y: textObj.top || 0,
          fontSize: textObj.fontSize || 16,
          fontFamily: textObj.fontFamily || 'Arial',
          fontWeight: (textObj.fontWeight === 'bold' ? 'bold' : 'normal') as 'normal' | 'bold',
          fontStyle: (textObj.fontStyle === 'italic' ? 'italic' : 'normal') as 'normal' | 'italic',
          color: (textObj.fill as string) || '#000000',
        } as TextAnnotation;
      }

      case 'highlight': {
        const rectObj = obj as any;
        return {
          ...baseAnnotation,
          type: 'highlight' as AnnotationType.HIGHLIGHT,
          x: rectObj.left || 0,
          y: rectObj.top || 0,
          width: rectObj.width || 0,
          height: rectObj.height || 0,
          color: (rectObj.fill as string) || '#FFFF00',
          opacity: rectObj.opacity || 0.3,
        } as HighlightAnnotation;
      }

      case 'drawing': {
        const pathObj = obj as any;
        return {
          ...baseAnnotation,
          type: 'drawing' as AnnotationType.DRAWING,
          path: pathObj.path?.toString() || '',
          strokeWidth: pathObj.strokeWidth || 2,
          strokeColor: (pathObj.stroke as string) || '#FF0000',
          opacity: pathObj.opacity || 1,
        } as DrawingAnnotation;
      }

      case 'rectangle':
      case 'circle': {
        const shapeObj = obj as any;
        return {
          ...baseAnnotation,
          type: obj.annotationType as AnnotationType.RECTANGLE | AnnotationType.CIRCLE,
          x: shapeObj.left || 0,
          y: shapeObj.top || 0,
          width: shapeObj.width || 0,
          height: shapeObj.height || 0,
          strokeColor: (shapeObj.stroke as string) || '#0000FF',
          strokeWidth: shapeObj.strokeWidth || 2,
          fillColor: (shapeObj.fill as string) || undefined,
          fillOpacity: shapeObj.opacity || 0.1,
        } as ShapeAnnotation;
      }

      default:
        return null;
    }
  }

  /**
   * Add annotation to canvas
   */
  private addAnnotationToCanvas(annotation: Annotation): void {
    if (!this.canvas) return;

    let fabricObj: FabricAnnotationObject | null = null;

    switch (annotation.type) {
      case 'text': {
        const textAnnotation = annotation as TextAnnotation;
        fabricObj = new IText(textAnnotation.text, {
          left: textAnnotation.x,
          top: textAnnotation.y,
          fontSize: textAnnotation.fontSize,
          fontFamily: textAnnotation.fontFamily,
          fontWeight: textAnnotation.fontWeight,
          fontStyle: textAnnotation.fontStyle,
          fill: textAnnotation.color,
        }) as any;
        break;
      }

      case 'highlight': {
        const highlightAnnotation = annotation as HighlightAnnotation;
        fabricObj = new Rect({
          left: highlightAnnotation.x,
          top: highlightAnnotation.y,
          width: highlightAnnotation.width,
          height: highlightAnnotation.height,
          fill: highlightAnnotation.color,
          opacity: highlightAnnotation.opacity,
          selectable: true,
        }) as any;
        break;
      }

      case 'drawing': {
        const drawingAnnotation = annotation as DrawingAnnotation;
        fabricObj = new Path(drawingAnnotation.path, {
          stroke: drawingAnnotation.strokeColor,
          strokeWidth: drawingAnnotation.strokeWidth,
          opacity: drawingAnnotation.opacity,
          fill: '',
        }) as any;
        break;
      }

      case 'rectangle': {
        const shapeAnnotation = annotation as ShapeAnnotation;
        fabricObj = new Rect({
          left: shapeAnnotation.x,
          top: shapeAnnotation.y,
          width: shapeAnnotation.width,
          height: shapeAnnotation.height,
          stroke: shapeAnnotation.strokeColor,
          strokeWidth: shapeAnnotation.strokeWidth,
          fill: shapeAnnotation.fillColor || '',
          opacity: shapeAnnotation.fillOpacity || 0.1,
        }) as any;
        break;
      }

      case 'circle': {
        const shapeAnnotation = annotation as ShapeAnnotation;
        fabricObj = new Circle({
          left: shapeAnnotation.x,
          top: shapeAnnotation.y,
          radius: Math.min(shapeAnnotation.width, shapeAnnotation.height) / 2,
          stroke: shapeAnnotation.strokeColor,
          strokeWidth: shapeAnnotation.strokeWidth,
          fill: shapeAnnotation.fillColor || '',
          opacity: shapeAnnotation.fillOpacity || 0.1,
        }) as any;
        break;
      }
    }

    if (fabricObj) {
      fabricObj.annotationId = annotation.id;
      fabricObj.annotationType = annotation.type;
      fabricObj.pageNumber = annotation.pageNumber;
      this.canvas.add(fabricObj as unknown as FabricObject);
    }
  }

  /**
   * Update annotation from modified Fabric object
   */
  private updateAnnotationFromFabricObject(obj: FabricAnnotationObject): void {
    const annotation = this.fabricObjectToAnnotation(obj);
    if (!annotation) return;

    const pageAnnotations = this.annotations.get(this.currentPageNumber) || [];
    const index = pageAnnotations.findIndex((a) => a.id === annotation.id);

    if (index >= 0) {
      pageAnnotations[index] = annotation;
      this.annotations.set(this.currentPageNumber, pageAnnotations);
      this.onAnnotationsChanged?.(this.getAllAnnotations());
    }
  }

  /**
   * Add text annotation
   */
  addTextAnnotation(x: number, y: number, text: string = 'Text'): void {
    if (!this.canvas) return;

    const id = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const textObj = new IText(text, {
      left: x,
      top: y,
      fontSize: this.toolConfig.fontSize,
      fontFamily: this.toolConfig.fontFamily,
      fontWeight: this.toolConfig.fontWeight,
      fontStyle: this.toolConfig.fontStyle,
      fill: this.toolConfig.textColor,
    }) as any;

    textObj.annotationId = id;
    textObj.annotationType = 'text' as AnnotationType.TEXT;
    textObj.pageNumber = this.currentPageNumber;

    this.canvas.add(textObj);
    this.canvas.setActiveObject(textObj);
    this.canvas.renderAll();

    this.saveCurrentPageAnnotations();
    this.onAnnotationsChanged?.(this.getAllAnnotations());
  }

  /**
   * Add highlight annotation
   */
  addHighlightAnnotation(x: number, y: number, width: number, height: number): void {
    if (!this.canvas) return;

    const id = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const rectObj = new Rect({
      left: x,
      top: y,
      width,
      height,
      fill: this.toolConfig.highlightColor,
      opacity: this.toolConfig.highlightOpacity,
    }) as any;

    rectObj.annotationId = id;
    rectObj.annotationType = 'highlight' as AnnotationType.HIGHLIGHT;
    rectObj.pageNumber = this.currentPageNumber;

    this.canvas.add(rectObj);
    this.canvas.renderAll();

    this.saveCurrentPageAnnotations();
    this.onAnnotationsChanged?.(this.getAllAnnotations());
  }

  /**
   * Enable free-hand drawing mode
   */
  enableDrawingMode(): void {
    if (!this.canvas) return;

    this.canvas.isDrawingMode = true;
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = this.toolConfig.strokeWidth || 2;
      this.canvas.freeDrawingBrush.color = this.toolConfig.strokeColor || '#FF0000';
    }
  }

  /**
   * Disable drawing mode
   */
  disableDrawingMode(): void {
    if (!this.canvas) return;
    this.canvas.isDrawingMode = false;
  }

  /**
   * Add rectangle annotation
   */
  addRectangleAnnotation(x: number, y: number, width: number, height: number): void {
    if (!this.canvas) return;

    const id = `rectangle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const rectObj = new Rect({
      left: x,
      top: y,
      width,
      height,
      stroke: this.toolConfig.shapeStrokeColor,
      strokeWidth: this.toolConfig.shapeStrokeWidth,
      fill: this.toolConfig.shapeFillColor || '',
      opacity: this.toolConfig.shapeFillOpacity,
    }) as any;

    rectObj.annotationId = id;
    rectObj.annotationType = 'rectangle' as AnnotationType.RECTANGLE;
    rectObj.pageNumber = this.currentPageNumber;

    this.canvas.add(rectObj);
    this.canvas.renderAll();

    this.saveCurrentPageAnnotations();
    this.onAnnotationsChanged?.(this.getAllAnnotations());
  }

  /**
   * Add circle annotation
   */
  addCircleAnnotation(x: number, y: number, radius: number): void {
    if (!this.canvas) return;

    const id = `circle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const circleObj = new Circle({
      left: x,
      top: y,
      radius,
      stroke: this.toolConfig.shapeStrokeColor,
      strokeWidth: this.toolConfig.shapeStrokeWidth,
      fill: this.toolConfig.shapeFillColor || '',
      opacity: this.toolConfig.shapeFillOpacity,
    }) as any;

    circleObj.annotationId = id;
    circleObj.annotationType = 'circle' as AnnotationType.CIRCLE;
    circleObj.pageNumber = this.currentPageNumber;

    this.canvas.add(circleObj);
    this.canvas.renderAll();

    this.saveCurrentPageAnnotations();
    this.onAnnotationsChanged?.(this.getAllAnnotations());
  }

  /**
   * Delete selected annotation
   */
  deleteSelectedAnnotation(): void {
    if (!this.canvas) return;

    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      this.canvas.remove(activeObject);
      this.canvas.renderAll();
      this.saveCurrentPageAnnotations();
      this.onAnnotationsChanged?.(this.getAllAnnotations());
    }
  }

  /**
   * Clear all annotations on current page
   */
  clearPage(): void {
    if (!this.canvas) return;
    this.canvas.clear();
    this.annotations.set(this.currentPageNumber, []);
    this.onAnnotationsChanged?.(this.getAllAnnotations());
  }

  /**
   * Get all annotations
   */
  getAllAnnotations(): Map<number, Annotation[]> {
    this.saveCurrentPageAnnotations();
    return new Map(this.annotations);
  }

  /**
   * Load annotations from external source
   */
  loadAnnotations(annotations: Map<number, Annotation[]>): void {
    this.annotations = new Map(annotations);
    this.loadPageAnnotations(this.currentPageNumber);
  }

  /**
   * Update tool configuration
   */
  updateToolConfig(config: Partial<AnnotationToolConfig>): void {
    this.toolConfig = { ...this.toolConfig, ...config };
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    if (!this.canvas) return;
    this.canvas.setWidth(width);
    this.canvas.setHeight(height);
    this.canvas.renderAll();
  }

  /**
   * Dispose of canvas
   */
  dispose(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }

  // Event callbacks
  onAnnotationSelected?: (annotationId: string | null) => void;
  onAnnotationsChanged?: (annotations: Map<number, Annotation[]>) => void;
}
