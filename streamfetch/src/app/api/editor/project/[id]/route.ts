import { NextRequest, NextResponse } from "next/server";

// In-memory storage reference (shared with parent route)
// In production, this would be a database
const getProjects = () => {
  // This is a workaround for in-memory storage
  // In production, you'd query the database
  return (global as any).projects || [];
};

const setProjects = (projects: any[]) => {
  (global as any).projects = projects;
};

// Initialize if not exists
if (!(global as any).projects) {
  (global as any).projects = [];
}

// GET /api/editor/project/[id] - Get specific project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projects = getProjects();
    const project = projects.find((p: any) => p.id === params.id);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project",
      },
      { status: 500 }
    );
  }
}

// PUT /api/editor/project/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const projects = getProjects();
    const projectIndex = projects.findIndex((p: any) => p.id === params.id);

    if (projectIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    const updatedProject = {
      ...projects[projectIndex],
      ...body,
      id: params.id, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };

    projects[projectIndex] = updatedProject;
    setProjects(projects);

    return NextResponse.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update project",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/editor/project/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projects = getProjects();
    const projectIndex = projects.findIndex((p: any) => p.id === params.id);

    if (projectIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    projects.splice(projectIndex, 1);
    setProjects(projects);

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete project",
      },
      { status: 500 }
    );
  }
}
