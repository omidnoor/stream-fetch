/**
 * Annotation Toolbar Component
 *
 * Provides UI for selecting and using annotation tools
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Type,
  Highlighter,
  Pencil,
  Square,
  Circle,
  Trash2,
  BoxSelect,
} from 'lucide-react';
import { useAnnotations } from '@/lib/pdf/annotations';
import { AnnotationType } from '@/lib/pdf/annotations/types';

export function AnnotationToolbar() {
  const { activeTool, setActiveTool, deleteSelectedAnnotation, selectedAnnotationId } =
    useAnnotations();

  const tools = [
    {
      type: AnnotationType.TEXT,
      icon: Type,
      label: 'Text',
      description: 'Add text annotations',
    },
    {
      type: AnnotationType.HIGHLIGHT,
      icon: Highlighter,
      label: 'Highlight',
      description: 'Select text to highlight',
    },
    {
      type: AnnotationType.AREA_MARKER,
      icon: BoxSelect,
      label: 'Area Marker',
      description: 'Draw highlight area',
    },
    {
      type: AnnotationType.DRAWING,
      icon: Pencil,
      label: 'Draw',
      description: 'Free-hand drawing',
    },
    {
      type: AnnotationType.RECTANGLE,
      icon: Square,
      label: 'Rectangle',
      description: 'Draw rectangles',
    },
    {
      type: AnnotationType.CIRCLE,
      icon: Circle,
      label: 'Circle',
      description: 'Draw circles',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white mb-4">Annotation Tools</h3>

      {/* Tool Buttons */}
      <div className="space-y-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.type;

          return (
            <Button
              key={tool.type}
              variant={isActive ? 'default' : 'outline'}
              className={`w-full justify-start ${
                isActive
                  ? 'bg-primary text-white'
                  : 'border-gray-700 hover:bg-gray-800 text-gray-300'
              }`}
              onClick={() => {
                setActiveTool(isActive ? null : tool.type);
              }}
              title={tool.description}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tool.label}
            </Button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-700">
        <Button
          variant="outline"
          className="w-full justify-start border-gray-700 hover:bg-red-900/20 hover:border-red-700 text-red-400"
          onClick={deleteSelectedAnnotation}
          disabled={!selectedAnnotationId}
          title="Delete selected annotation"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected
        </Button>
      </div>
    </div>
  );
}
