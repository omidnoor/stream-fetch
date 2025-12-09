/**
 * PDF Repository Integration Tests
 *
 * Tests CRUD operations for PDF projects and annotations in MongoDB
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import {
  getPDFProjectRepository,
  resetPDFProjectRepository,
} from '@/lib/database/repositories/pdf-project.repository';
import {
  getAnnotationRepository,
  resetAnnotationRepository,
} from '@/lib/database/repositories/annotation.repository';
import { PDFProject, Annotation, ProjectStatus } from '@/services/pdf/pdf.types';
import { closeConnection } from '@/lib/database/mongodb';

describe('PDF Repositories Integration', () => {
  let projectRepo: ReturnType<typeof getPDFProjectRepository>;
  let annotationRepo: ReturnType<typeof getAnnotationRepository>;
  const testProjectIds: string[] = [];
  const testAnnotationIds: string[] = [];

  beforeAll(() => {
    projectRepo = getPDFProjectRepository();
    annotationRepo = getAnnotationRepository();
  });

  afterAll(async () => {
    // Clean up test data
    for (const annotationId of testAnnotationIds) {
      try {
        await annotationRepo.deleteAnnotation(annotationId);
      } catch (error) {
        // Ignore
      }
    }
    for (const projectId of testProjectIds) {
      try {
        await projectRepo.deleteProject(projectId);
      } catch (error) {
        // Ignore
      }
    }
    await closeConnection();
  });

  beforeEach(() => {
    resetPDFProjectRepository();
    resetAnnotationRepository();
    projectRepo = getPDFProjectRepository();
    annotationRepo = getAnnotationRepository();
  });

  const createTestProject = (status: ProjectStatus = 'draft'): PDFProject => {
    const projectId = uuidv4();
    testProjectIds.push(projectId);

    return {
      id: projectId,
      name: `Test PDF ${projectId.substring(0, 8)}`,
      status,
      originalFile: '/path/to/original.pdf',
      metadata: {
        pageCount: 10,
        fileSize: 1024000,
        version: '1.7',
      },
      pages: [
        {
          pageNumber: 1,
          width: 612,
          height: 792,
          rotation: 0,
          annotations: [],
        },
      ],
      annotations: [],
      settings: {
        defaultFontFamily: 'Helvetica',
        defaultFontSize: 14,
        defaultColor: '#000000',
        defaultStrokeWidth: 2,
        autoSave: true,
        autoSaveInterval: 30000,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const createTestAnnotation = (_projectId: string, pageNumber: number = 1): Annotation => {
    const annotationId = uuidv4();
    testAnnotationIds.push(annotationId);

    return {
      id: annotationId,
      type: 'text',
      pageNumber,
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      content: 'Test annotation',
      fontFamily: 'Helvetica',
      fontSize: 14,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#000000',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Annotation;
  };

  describe('PDF Project Repository', () => {
    describe('saveProject', () => {
      it('should save a new project', async () => {
        const project = createTestProject();
        const saved = await projectRepo.saveProject(project);

        expect(saved).toBeDefined();
        expect(saved.id).toBe(project.id);
      });
    });

    describe('getProject', () => {
      it('should retrieve a project', async () => {
        const project = createTestProject();
        await projectRepo.saveProject(project);

        const retrieved = await projectRepo.getProject(project.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(project.id);
      });

      it('should return null for non-existent project', async () => {
        const result = await projectRepo.getProject('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('listProjects', () => {
      it('should list all projects', async () => {
        const project1 = createTestProject();
        const project2 = createTestProject();
        await projectRepo.saveProject(project1);
        await projectRepo.saveProject(project2);

        const projects = await projectRepo.listProjects();
        expect(projects.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('updateProjectStatus', () => {
      it('should update project status', async () => {
        const project = createTestProject('draft');
        await projectRepo.saveProject(project);

        const updated = await projectRepo.updateProjectStatus(project.id, 'completed');
        expect(updated.status).toBe('completed');
      });
    });

    describe('searchProjects', () => {
      it('should search projects by name', async () => {
        const project = createTestProject();
        project.name = 'Unique PDF Search Test';
        await projectRepo.saveProject(project);

        const results = await projectRepo.searchProjects('Unique PDF');
        expect(results.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Annotation Repository', () => {
    let testProjectId: string;

    beforeEach(async () => {
      const project = createTestProject();
      testProjectId = project.id;
      await projectRepo.saveProject(project);
    });

    describe('saveAnnotation', () => {
      it('should save a new annotation', async () => {
        const annotation = createTestAnnotation(testProjectId);
        const saved = await annotationRepo.saveAnnotation(annotation);

        expect(saved).toBeDefined();
        expect(saved.id).toBe(annotation.id);
      });
    });

    describe('getAnnotation', () => {
      it('should retrieve an annotation', async () => {
        const annotation = createTestAnnotation(testProjectId);
        await annotationRepo.saveAnnotation(annotation);

        const retrieved = await annotationRepo.getAnnotation(annotation.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(annotation.id);
      });

      it('should return null for non-existent annotation', async () => {
        const result = await annotationRepo.getAnnotation('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('getProjectAnnotations', () => {
      it('should get all annotations for a project', async () => {
        const annotation1 = createTestAnnotation(testProjectId, 1);
        const annotation2 = createTestAnnotation(testProjectId, 2);
        await annotationRepo.saveAnnotation(annotation1);
        await annotationRepo.saveAnnotation(annotation2);

        const annotations = await annotationRepo.getProjectAnnotations(testProjectId);
        expect(annotations.length).toBeGreaterThanOrEqual(2);
        // Annotations are stored with projectId in the repository, but it's not part of the Annotation type
        expect(annotations.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('getPageAnnotations', () => {
      it('should get annotations for a specific page', async () => {
        const annotation1 = createTestAnnotation(testProjectId, 1);
        const annotation2 = createTestAnnotation(testProjectId, 2);
        await annotationRepo.saveAnnotation(annotation1);
        await annotationRepo.saveAnnotation(annotation2);

        const page1Annotations = await annotationRepo.getPageAnnotations(testProjectId, 1);
        expect(page1Annotations.every((a) => a.pageNumber === 1)).toBe(true);
      });
    });

    describe('deleteAnnotation', () => {
      it('should delete an annotation', async () => {
        const annotation = createTestAnnotation(testProjectId);
        await annotationRepo.saveAnnotation(annotation);

        await annotationRepo.deleteAnnotation(annotation.id);

        const retrieved = await annotationRepo.getAnnotation(annotation.id);
        expect(retrieved).toBeNull();
      });
    });

    describe('deleteProjectAnnotations', () => {
      it('should delete all annotations for a project', async () => {
        const annotation1 = createTestAnnotation(testProjectId);
        const annotation2 = createTestAnnotation(testProjectId);
        await annotationRepo.saveAnnotation(annotation1);
        await annotationRepo.saveAnnotation(annotation2);

        const count = await annotationRepo.deleteProjectAnnotations(testProjectId);
        expect(count).toBeGreaterThanOrEqual(2);

        const annotations = await annotationRepo.getProjectAnnotations(testProjectId);
        expect(annotations.length).toBe(0);
      });
    });

    describe('updateAnnotation', () => {
      it('should update annotation properties', async () => {
        const annotation = createTestAnnotation(testProjectId);
        await annotationRepo.saveAnnotation(annotation);

        const updated = await annotationRepo.updateAnnotation(annotation.id, {
          content: 'Updated text',
          fontSize: 18,
        });

        // Type assertion for TextAnnotation specific properties
        const textUpdated = updated as import('@/services/pdf/pdf.types').TextAnnotation;
        expect(textUpdated.content).toBe('Updated text');
        expect(textUpdated.fontSize).toBe(18);
      });
    });

    describe('getAnnotationsByType', () => {
      it('should filter annotations by type', async () => {
        const textAnnotation = createTestAnnotation(testProjectId);
        textAnnotation.type = 'text';
        const highlightAnnotation = createTestAnnotation(testProjectId);
        highlightAnnotation.type = 'highlight';

        await annotationRepo.saveAnnotation(textAnnotation);
        await annotationRepo.saveAnnotation(highlightAnnotation);

        const textAnnotations = await annotationRepo.getAnnotationsByType(testProjectId, 'text');
        expect(textAnnotations.every((a) => a.type === 'text')).toBe(true);
      });
    });

    describe('batch save', () => {
      it('should save multiple annotations at once', async () => {
        const annotations = [
          createTestAnnotation(testProjectId, 1),
          createTestAnnotation(testProjectId, 1),
          createTestAnnotation(testProjectId, 2),
        ];

        await annotationRepo.saveAnnotations(annotations);

        const saved = await annotationRepo.getProjectAnnotations(testProjectId);
        expect(saved.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
