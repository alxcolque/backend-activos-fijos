import { ProjectStatus } from '../enums/project-status.enum';

export interface Project {
  id: string;
  name: string;
  address: string | null;
  responsible: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
