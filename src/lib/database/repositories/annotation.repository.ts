/**
 * Annotation Repository
 *
 * MongoDB-based persistence for PDF annotations.
 * Stored in a separate collection for better query performance.
 */

import { Collection, Filter, Document, AnyBulkWriteOperation } from 'mongodb';
import { getCollection, Collections } from '../mongodb';
import { Annotation } from '@/services/pdf/pdf.types';

export class AnnotationRepository {
  private async getCollection(): Promise<Collection<Annotation>> {
    return getCollection<Annotation>(Collections.ANNOTATIONS);
  }

  /**
   * Save annotation
   */
  async saveAnnotation(annotation: Annotation): Promise<Annotation> {
    const collection = await this.getCollection();

    try {
      // Update timestamp
      annotation.updatedAt = new Date();

      // Upsert: update if exists, insert if not
      await collection.updateOne(
        { id: annotation.id } as Filter<Document>,
        { $set: annotation } as Filter<Document>,
        { upsert: true }
      );

      console.log(`[AnnotationRepository] Saved annotation: ${annotation.id}`);
      return annotation;
    } catch (error) {
      console.error('[AnnotationRepository] Save failed:', error);
      throw new Error(`Failed to save annotation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get annotation by ID
   */
  async getAnnotation(annotationId: string): Promise<Annotation | null> {
    const collection = await this.getCollection();

    try {
      const annotation = await collection.findOne({ id: annotationId } as Filter<Document>);
      return annotation as Annotation | null;
    } catch (error) {
      console.error('[AnnotationRepository] Get failed:', error);
      throw new Error(`Failed to get annotation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all annotations for a project
   */
  async getProjectAnnotations(projectId: string): Promise<Annotation[]> {
    const collection = await this.getCollection();

    try {
      const cursor = collection
        .find({ projectId } as Filter<Document>)
        .sort({ createdAt: 1 }); // Oldest first

      const annotations = await cursor.toArray();
      return annotations as Annotation[];
    } catch (error) {
      console.error('[AnnotationRepository] Get project annotations failed:', error);
      throw new Error(`Failed to get project annotations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get annotations for a specific page
   */
  async getPageAnnotations(projectId: string, pageNumber: number): Promise<Annotation[]> {
    const collection = await this.getCollection();

    try {
      const cursor = collection
        .find({ projectId, pageNumber } as Filter<Document>)
        .sort({ createdAt: 1 });

      const annotations = await cursor.toArray();
      return annotations as Annotation[];
    } catch (error) {
      console.error('[AnnotationRepository] Get page annotations failed:', error);
      throw new Error(`Failed to get page annotations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(annotationId: string): Promise<void> {
    const collection = await this.getCollection();

    try {
      const result = await collection.deleteOne({ id: annotationId } as Filter<Document>);

      if (result.deletedCount === 0) {
        throw new Error(`Annotation ${annotationId} not found`);
      }

      console.log(`[AnnotationRepository] Deleted annotation: ${annotationId}`);
    } catch (error) {
      console.error('[AnnotationRepository] Delete failed:', error);
      throw new Error(`Failed to delete annotation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all annotations for a project
   */
  async deleteProjectAnnotations(projectId: string): Promise<number> {
    const collection = await this.getCollection();

    try {
      const result = await collection.deleteMany({ projectId } as Filter<Document>);
      console.log(`[AnnotationRepository] Deleted ${result.deletedCount} annotations for project: ${projectId}`);
      return result.deletedCount;
    } catch (error) {
      console.error('[AnnotationRepository] Delete project annotations failed:', error);
      throw new Error(`Failed to delete project annotations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update annotation
   */
  async updateAnnotation(
    annotationId: string,
    updates: Partial<Annotation>
  ): Promise<Annotation> {
    const collection = await this.getCollection();

    try {
      const result = await collection.findOneAndUpdate(
        { id: annotationId } as Filter<Document>,
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error(`Annotation ${annotationId} not found`);
      }

      console.log(`[AnnotationRepository] Updated annotation: ${annotationId}`);
      return result as Annotation;
    } catch (error) {
      console.error('[AnnotationRepository] Update failed:', error);
      throw new Error(`Failed to update annotation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if annotation exists
   */
  async annotationExists(annotationId: string): Promise<boolean> {
    const collection = await this.getCollection();

    try {
      const count = await collection.countDocuments({ id: annotationId } as Filter<Document>);
      return count > 0;
    } catch (error) {
      console.error('[AnnotationRepository] Exists check failed:', error);
      return false;
    }
  }

  /**
   * Get total annotations count for a project
   */
  async getProjectAnnotationCount(projectId: string): Promise<number> {
    const collection = await this.getCollection();

    try {
      return await collection.countDocuments({ projectId } as Filter<Document>);
    } catch (error) {
      console.error('[AnnotationRepository] Count failed:', error);
      throw new Error(`Failed to count annotations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get annotations by type
   */
  async getAnnotationsByType(
    projectId: string,
    type: Annotation['type']
  ): Promise<Annotation[]> {
    const collection = await this.getCollection();

    try {
      const cursor = collection
        .find({ projectId, type } as Filter<Document>)
        .sort({ createdAt: 1 });

      const annotations = await cursor.toArray();
      return annotations as Annotation[];
    } catch (error) {
      console.error('[AnnotationRepository] Get by type failed:', error);
      throw new Error(`Failed to get annotations by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch save annotations (for performance)
   */
  async saveAnnotations(annotations: Annotation[]): Promise<void> {
    const collection = await this.getCollection();

    try {
      const operations = annotations.map((annotation) => ({
        updateOne: {
          filter: { id: annotation.id },
          update: { $set: { ...annotation, updatedAt: new Date() } },
          upsert: true,
        },
      }));

      if (operations.length > 0) {
        await collection.bulkWrite(operations as unknown as AnyBulkWriteOperation<Annotation>[]);
        console.log(`[AnnotationRepository] Batch saved ${annotations.length} annotations`);
      }
    } catch (error) {
      console.error('[AnnotationRepository] Batch save failed:', error);
      throw new Error(`Failed to batch save annotations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all annotations (for testing)
   */
  async clearAll(): Promise<void> {
    const collection = await this.getCollection();

    try {
      await collection.deleteMany({});
      console.log('[AnnotationRepository] Cleared all annotations');
    } catch (error) {
      console.error('[AnnotationRepository] Clear all failed:', error);
      throw new Error(`Failed to clear annotations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
let instance: AnnotationRepository | null = null;

export function getAnnotationRepository(): AnnotationRepository {
  if (!instance) {
    instance = new AnnotationRepository();
  }
  return instance;
}

export function resetAnnotationRepository(): void {
  instance = null;
}
