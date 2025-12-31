import { ProjectWorkspace } from "@/components/dashboard/project-view";
import { getProjectById } from "@/lib/supabase/projects-server";
import { getTasksByProjectId } from "@/lib/supabase/tasks-server";
import { getCurriculumByProjectId } from "@/lib/supabase/curriculum-server";

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ projectId: string }>
}) {
    const { projectId } = await params;

    const [projectData, tasksData, curriculumData] = await Promise.all([
        getProjectById(projectId),
        getTasksByProjectId(projectId),
        getCurriculumByProjectId(projectId),
    ]);

    if (projectData.error) {
        return <div>Error: {projectData.error.message}</div>;
    }
    if (!projectData.data) {
        return <div>Project not found</div>;
    }

    return (
        <ProjectWorkspace 
            project={projectData.data} 
            tasks={tasksData.data || []}
            tasksError={tasksData.error}
            curriculum={curriculumData.data}
        />
    );
}
