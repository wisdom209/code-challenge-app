import React from 'react';
import { Task } from '../../types';
import { Link } from 'react-router-dom';
import { DIFFICULTY_COLORS, DIFFICULTY_BG } from '../../utils/constants';

interface TaskListProps {
  tasks: Task[];
  title?: string;
  showLanguage?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  title,
  showLanguage = true 
}) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-6 bg-dark-800 rounded-full flex items-center justify-center">
          <span className="text-4xl">📭</span>
        </div>
        <h3 className="text-2xl font-display font-bold text-gray-400 mb-2">
          No tasks found
        </h3>
        <p className="text-gray-500 font-mono text-sm">
          Try selecting a different category
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-display font-bold text-white">
            {title}
            <span className="ml-3 text-neon-cyan">({tasks.length})</span>
          </h2>
        </div>
      )}

      {/* Table/List View */}
      <div className="bg-dark-800 border-2 border-dark-700 rounded-lg overflow-hidden">
        <div className="hidden grid-cols-[3fr,1fr,1fr,1fr] gap-4 px-6 py-4 bg-dark-700 border-b-2 border-dark-600 font-mono font-semibold text-gray-400 text-sm">
          <div>Task</div>
          <div>Difficulty</div>
          <div>{showLanguage ? 'Language' : 'Category'}</div>
          <div>Status</div>
        </div>

        <div className="divide-y divide-dark-700">
          {tasks.map((task) => (
            <Link 
              key={task._id} 
              to={`/task/${task._id}`}
              className="block hover:bg-dark-700/50 transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-[3fr,1fr,1fr,1fr] gap-4 p-4 md:p-6 items-center">
                {/* Task Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📝</span>
                    <h3 className="text-lg font-display font-bold text-white hover:text-neon-cyan transition-colors">
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-gray-400 font-mono text-sm line-clamp-2 md:line-clamp-1">
                    {task.description}
                  </p>
                </div>

                {/* Difficulty */}
                <div className="flex justify-start md:justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border whitespace-nowrap ${
                      DIFFICULTY_BG[task.difficulty]
                    } ${DIFFICULTY_COLORS[task.difficulty]}`}
                  >
                    {task.difficulty.toUpperCase()}
                  </span>
                </div>

                {/* Language/Category */}
                <div className="flex justify-start md:justify-center">
                  <span className="text-sm font-mono text-neon-cyan font-semibold">
                    {showLanguage 
                      ? (task.configs[0].language || 'unknown').toUpperCase()
                      : task.category
                    }
                  </span>
                </div>

                {/* Status */}
                <div className="flex justify-start md:justify-center">
                  <span className="px-3 py-1 bg-dark-700 border border-neon-purple/30 rounded-full text-xs font-mono text-neon-purple">
                    Not Started
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

