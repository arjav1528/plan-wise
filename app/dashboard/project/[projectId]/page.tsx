import { ProjectWorkspace } from "@/components/dashboard/project-view";

export default async function ProjectPage({
    params,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: Promise<{ projectId: string }>
}) {
    const { projectId } = await params;

    // Here we would fetch project data using projectId
    const mockProject = {
        id: projectId,
        title: projectId === "1" ? "Learn Spanish" : "Marathon Training",
        deadline: projectId === "1" ? "Dec 31, 2025" : "Oct 15, 2025",
        status: (projectId === "1" ? "on-track" : "behind") as "on-track" | "behind" | "ahead",
    };

    return <ProjectWorkspace project={mockProject} />;
}
