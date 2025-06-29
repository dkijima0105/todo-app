import { render, screen } from '@testing-library/react';
import TaskForm from './TaskForm';

const mockProps = {
  onTaskCreate: jest.fn()
};

test('renders task form', () => {
  render(<TaskForm {...mockProps} />);
  expect(screen.getByText('新しいタスクを追加')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('タスクのタイトル')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('タスクの説明（オプション）')).toBeInTheDocument();
});

test('renders urgency and importance options', () => {
  render(<TaskForm {...mockProps} />);
  
  expect(screen.getByText('緊急度')).toBeInTheDocument();
  expect(screen.getByText('重要度')).toBeInTheDocument();
  expect(screen.getByText('緊急')).toBeInTheDocument();
  expect(screen.getByText('重要')).toBeInTheDocument();
});

test('renders submit button', () => {
  render(<TaskForm {...mockProps} />);
  expect(screen.getByText('タスクを追加')).toBeInTheDocument();
}); 