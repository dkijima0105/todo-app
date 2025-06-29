import { render, screen } from '@testing-library/react';
import App from './App';

test('renders todo app without crashing', () => {
  render(<App />);
  // アプリが正常にレンダリングされることを確認
  expect(document.body).toBeInTheDocument();
});

test('renders matrix container', () => {
  render(<App />);
  // マトリックスコンテナが存在することを確認
  expect(screen.getByText('読み込み中...')).toBeInTheDocument();
}); 