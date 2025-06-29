import { render, screen } from '@testing-library/react';
import TaskItem from './TaskItem';

const mockTask = {
  id: 1,
  title: 'テストタスク',
  description: 'テスト用の説明',
  completed: false,
  urgency: 'urgent',
  importance: 'important',
  due_date: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockProps = {
  task: mockTask,
  onTaskUpdate: jest.fn(),
  onTaskDelete: jest.fn(),
  onTaskToggle: jest.fn(),
  onTaskClick: jest.fn()
};

test('renders task item', () => {
  render(<TaskItem {...mockProps} />);
  expect(screen.getByText('テストタスク')).toBeInTheDocument();
  expect(screen.getByText('テスト用の説明')).toBeInTheDocument();
});

test('renders task action buttons', () => {
  render(<TaskItem {...mockProps} />);
  expect(screen.getByText('完了にする')).toBeInTheDocument();
  expect(screen.getByText('編集')).toBeInTheDocument();
  expect(screen.getByText('削除')).toBeInTheDocument();
}); 