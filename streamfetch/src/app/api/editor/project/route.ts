import { NextRequest, NextResponse } from "next/server";

// In-memory storage for demo purposes
// In production, this would be a database
const getProjects = () => {
  if (!(global as any).projects) {
    (global as any).projects = [];
  }
  return (global as any).projects;
};

const setProjects = (projects: any[]) => {
  (global as any).projects = projects;
};

// GET /api/editor/project - List all projects
export async function GET(request: NextRequest) {
  try {
    const projects = getProjects();
    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}

// POST /api/editor/project - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newProject = {
      id: `project-${Date.now()}`,
      name: body.name || "Untitled Project",
      description: body.description || "",
      status: "draft" as const,
      duration: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbnail: body.thumbnail || null,
    };

    const projects = getProjects();
    projects.push(newProject);
    setProjects(projects);

    return NextResponse.json({
      success: true,
      data: newProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project",
      },
      { status: 500 }
    );
  }
}
