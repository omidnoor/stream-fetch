/**
 * Annotation Context
 *
 * React context for managing PDF annotations state
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AnnotationManager } from './AnnotationManager';
import type {
  Annotation,
  AnnotationType,
  AnnotationToolConfig,
} from './types';

interface AnnotationContextValue {
  // Manager instance
  manager: AnnotationManager | null;
  initializeManager: (canvas: HTMLCanvasElement, width: number, height: number) => void;

  // State
  annotations: Map<number, Annotation[]>;
  selectedAnnotationId: string | null;
  activeTool: AnnotationType | null;
  toolConfig: AnnotationToolConfig;

  // Actions
  setActiveTool: (tool: AnnotationType | null) => void;
  updateToolConfig: (config: Partial<AnnotationToolConfig>) => void;
  setPage: (pageNumber: number) => void;

  // Annotation operations
  addTextAnnotation: (x: number, y: number, text?: string) => void;
  addHighlightAnnotation: (x: number, y: number, width: number, height: number) => void;
  addRectangleAnnotation: (x: number, y: number, width: number, height: number) => void;
  addCircleAnnotation: (x: number, y: number, radius: number) => void;
  enableDrawingMode: () => void;
  disableDrawingMode: () => void;
  deleteSelectedAnnotation: () => void;
  clearPage: () => void;

  // Persistence
  loadAnnotations: (annotations: Map<number, Annotation[]>) => void;
  getAllAnnotations: () => Map<number, Annotation[]>;
}

const AnnotationContext = createContext<AnnotationContextValue | null>(null);

/**
 * Annotation Provider
 */
export function AnnotationProvider({ children }: { children: React.ReactNode }) {
  const managerRef = useRef<AnnotationManager | null>(null);
  const [annotations, setAnnotations] = useState<Map<number, Annotation[]>>(new Map());
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [activeTool, setActiveToolState] = useState<AnnotationType | null>(null);
  const [toolConfig, setToolConfig] = useState<AnnotationToolConfig>({
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
  });

  /**
   * Initialize annotation manager
   */
  const initializeManager = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
    if (!managerRef.current) {
      managerRef.current = new AnnotationManager();
    }

    const manager = managerRef.current;
    manager.initialize(canvas, width, height);

    // Setup event callbacks
    manager.onAnnotationSelected = (annotationId: string | null) => {
      setSelectedAnnotationId(annotationId);
    };

    manager.onAnnotationsChanged = (updatedAnnotations: Map<number, Annotation[]>) => {
      setAnnotations(new Map(updatedAnnotations));
    };
  }, []);

  /**
   * Set active tool - updates both React state and manager
   */
  const setActiveTool = useCallback((tool: AnnotationType | null) => {
    setActiveToolState(tool);

    // Tell the manager which tool is active so it can handle mouse events
    if (managerRef.current) {
      managerRef.current.setActiveTool(tool);
    }
  }, []);

  /**
   * Update tool configuration
   */
  const updateToolConfig = useCallback((config: Partial<AnnotationToolConfig>) => {
    setToolConfig((prev) => ({ ...prev, ...config }));
    managerRef.current?.updateToolConfig(config);
  }, []);

  /**
   * Set current page
   */
  const setPage = useCallback((pageNumber: number) => {
    managerRef.current?.setPage(pageNumber);
  }, []);

  /**
   * Add text annotation
   */
  const addTextAnnotation = useCallback((x: number, y: number, text?: string) => {
    managerRef.current?.addTextAnnotation(x, y, text);
  }, []);

  /**
   * Add highlight annotation
   */
  const addHighlightAnnotation = useCallback((x: number, y: number, width: number, height: number) => {
    managerRef.current?.addHighlightAnnotation(x, y, width, height);
  }, []);

  /**
   * Add rectangle annotation
   */
  const addRectangleAnnotation = useCallback((x: number, y: number, width: number, height: number) => {
    managerRef.current?.addRectangleAnnotation(x, y, width, height);
  }, []);

  /**
   * Add circle annotation
   */
  const addCircleAnnotation = useCallback((x: number, y: number, radius: number) => {
    managerRef.current?.addCircleAnnotation(x, y, radius);
  }, []);

  /**
   * Enable drawing mode
   */
  const enableDrawingMode = useCallback(() => {
    managerRef.current?.enableDrawingMode();
  }, []);

  /**
   * Disable drawing mode
   */
  const disableDrawingMode = useCallback(() => {
    managerRef.current?.disableDrawingMode();
  }, []);

  /**
   * Delete selected annotation
   */
  const deleteSelectedAnnotation = useCallback(() => {
    managerRef.current?.deleteSelectedAnnotation();
  }, []);

  /**
   * Clear current page
   */
  const clearPage = useCallback(() => {
    managerRef.current?.clearPage();
  }, []);

  /**
   * Load annotations
   */
  const loadAnnotations = useCallback((loadedAnnotations: Map<number, Annotation[]>) => {
    managerRef.current?.loadAnnotations(loadedAnnotations);
    setAnnotations(new Map(loadedAnnotations));
  }, []);

  /**
   * Get all annotations
   */
  const getAllAnnotations = useCallback(() => {
    return managerRef.current?.getAllAnnotations() || new Map();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      managerRef.current?.dispose();
    };
  }, []);

  const value: AnnotationContextValue = {
    manager: managerRef.current,
    initializeManager,
    annotations,
    selectedAnnotationId,
    activeTool,
    toolConfig,
    setActiveTool,
    updateToolConfig,
    setPage,
    addTextAnnotation,
    addHighlightAnnotation,
    addRectangleAnnotation,
    addCircleAnnotation,
    enableDrawingMode,
    disableDrawingMode,
    deleteSelectedAnnotation,
    clearPage,
    loadAnnotations,
    getAllAnnotations,
  };

  return (
    <AnnotationContext.Provider value={value}>
      {children}
    </AnnotationContext.Provider>
  );
}

/**
 * Hook to use annotation context
 */
export function useAnnotations() {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error('useAnnotations must be used within an AnnotationProvider');
  }
  return context;
}
