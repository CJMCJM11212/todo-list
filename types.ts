
export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyTasks {
  [date: string]: Task[];
}

export enum FilterType {
  ALL,
  REMAINING,
  ONE,
}

export interface DeletedItem {
  task: Task;
  originalDate: string;
}
