import React from 'react';
import { Link } from 'react-router-dom';
import { Task } from '../../types';
import { DIFFICULTY_COLORS, DIFFICULTY_BG } from '../../utils/constants';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return (
    <Link to={`/task/${task._id}`}>
      <div className="group bg-dark-800 border-2 border-dark-600 hover:border-neon-cyan/50 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-neon-cyan/20 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-display font-bold text-white group-hover:text-neon-cyan transition-colors">
            {task.title}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
              DIFFICULTY_BG[task.difficulty]
            } ${DIFFICULTY_COLORS[task.difficulty]}`}
          >
            {(task.difficulty || 'unknown').toUpperCase()}
          </span>
        </div>

        <p className="text-gray-400 font-mono text-sm mb-4 line-clamp-2">
          {task.description}
        </p>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Language:</span>
            <span className="text-neon-cyan font-semibold">
              {(task.configs[0].language || 'unknown').toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Category:</span>
            <span className="text-neon-purple font-semibold">
              {task.category}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dark-600">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-mono">
              Click to start challenge →
            </span>
            <div className="w-8 h-8 rounded-full bg-dark-700 border-2 border-neon-cyan/30 flex items-center justify-center group-hover:bg-neon-cyan/10 group-hover:border-neon-cyan transition-all">
              <svg
                className="w-4 h-4 text-neon-cyan transform group-hover:translate-x-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

