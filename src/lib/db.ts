import { get, set, del, keys } from 'idb-keyval';
import { Project } from '../types';

const PROJECT_PREFIX = 'viz_project_';

export const db = {
  async getProjects(): Promise<Project[]> {
    const allKeys = await keys();
    const projectKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(PROJECT_PREFIX));
    
    const projects: Project[] = [];
    for (const key of projectKeys) {
      const p = await get<Project>(key);
      if (p) projects.push(p);
    }
    
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async saveProject(project: Project): Promise<void> {
    project.updatedAt = Date.now();
    await set(`${PROJECT_PREFIX}${project.id}`, project);
  },

  async getProject(id: string): Promise<Project | undefined> {
    return await get<Project>(`${PROJECT_PREFIX}${id}`);
  },

  async deleteProject(id: string): Promise<void> {
    await del(`${PROJECT_PREFIX}${id}`);
  }
};
