import { useState, useCallback, useMemo } from 'react';
import { generateUUID } from '../utils/uuid';

interface Project {
  id: string;
  name: string;
  description?: string;
  address?: string;
}

export function useHomeViewModel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');

  const canCreate = useMemo(
    () => newName.trim().length > 0,
    [newName],
  );

  const createProject = useCallback(async () => {
    if (!canCreate) return;

    const newProject: Project = {
      id: generateUUID(),
      name: newName.trim(),
    };
    setProjects((prev) => [newProject, ...prev]);
    setNewName('');
    setShowNewProject(false);
  }, [canCreate, newName]);

  const openNewProject = useCallback(() => setShowNewProject(true), []);
  const closeNewProject = useCallback(() => {
    setShowNewProject(false);
    setNewName('');
  }, []);

  return {
    projects,
    showNewProject,
    newName,
    canCreate,
    setNewName,
    createProject,
    openNewProject,
    closeNewProject,
  };
}
