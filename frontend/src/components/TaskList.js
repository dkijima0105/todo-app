import React from 'react';
import TaskItem from './TaskItem';

function TaskList({ tasks, onToggle, onUpdate, onDelete, onTaskClick }) {
  // tasksが配列でない場合は空配列として扱う
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  if (tasksArray.length === 0) {
    return (
      <div className="empty-state">
        <p>タスクがありません</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasksArray.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}

export default TaskList; 