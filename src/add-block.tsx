import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { getAccessToken } from "./oauth";

type Values = {
  textfield: string;
  textarea: string;
  datepicker: Date;
  checkbox: boolean;
  dropdown: string;
  tokeneditor: string[];
};

type Project = {
  id: number;
  name: string;
  userId: string;
  description: string | null;
  clientName: string | null;
  status: string;
  priority: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectsResponse = {
  projects: Project[];
};

const API_BASE_URL = "http://localhost:3000";

export default function Command() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/api/projects`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.status}`);
        }

        const data = (await response.json()) as ProjectsResponse;
        console.log("Projects API response:", data);

        // Handle different response structures
        let projectsArray: Project[] = [];
        if (data && Array.isArray(data.projects)) {
          projectsArray = data.projects;
        } else {
          console.warn("Unexpected projects response structure:", data);
        }

        setProjects(projectsArray);
      } catch (error) {
        console.error("Error fetching projects:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load projects",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
        setProjects([]); // Set empty array on error
      } finally {
        setIsLoadingProjects(false);
      }
    }

    fetchProjects();
  }, []);

  async function handleSubmit(values: Values) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Adding block...",
    });

    try {
      // Get OAuth access token
      const accessToken = await getAccessToken();

      const response = await fetch(`${API_BASE_URL}/api/blocks/intake`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          text: values.textfield,
          projectId: values.dropdown,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { success?: boolean; received?: string };
      console.log("Response:", data);

      toast.style = Toast.Style.Success;
      toast.title = "Block added successfully";
      toast.message = data.received || "Block created";
    } catch (error) {
      console.error("Error adding block:", error);
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to add block";
      toast.message = error instanceof Error ? error.message : "Unknown error occurred";
    }
  }

  return (
    <Form
      isLoading={isLoadingProjects}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Add Block" />
        </ActionPanel>
      }
    >
      <Form.Description text="Add a new block to Dozli via the intake API." />
      <Form.TextField
        id="textfield"
        title="Block Content"
        placeholder="Enter your message or task"
        autoFocus
      />
      <Form.Dropdown id="dropdown" title="Project" storeValue>
        {projects.length === 0 && !isLoadingProjects ? (
          <Form.Dropdown.Item value="" title="No projects found" />
        ) : (
          projects.map((project) => (
            <Form.Dropdown.Item key={project.id} value={String(project.id)} title={project.name} />
          ))
        )}
      </Form.Dropdown>
      {/* <Form.TextArea id="textarea" title="Text area" placeholder="Enter multi-line text" />
      <Form.Separator />
      <Form.DatePicker id="datepicker" title="Date picker" />
      <Form.Checkbox id="checkbox" title="Checkbox" label="Checkbox Label" storeValue />
      <Form.TagPicker id="tokeneditor" title="Tag picker">
        <Form.TagPicker.Item value="tagpicker-item" title="Tag Picker Item" />
      </Form.TagPicker> */}
    </Form>
  );
}
