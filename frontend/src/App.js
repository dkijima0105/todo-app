import React, { useState, useEffect } from 'react';
import './App.css';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import TaskDetail from './components/TaskDetail';
import CalendarView from './components/CalendarView';

function App() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('matrix'); // 'list', 'matrix', or 'calendar'
  const [selectedTask, setSelectedTask] = useState(null); // 選択されたタスクの詳細表示用
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1366); // モバイル・タブレット判定
  const [showTaskFormModal, setShowTaskFormModal] = useState(false); // モバイル用タスク追加モーダル
  const [showFilterModal, setShowFilterModal] = useState(false); // フィルターモーダル表示用
  const [prefilledTaskData, setPrefilledTaskData] = useState(null); // カレンダーからの事前設定データ
  const [currentEditingTask, setCurrentEditingTask] = useState(null); // リアルタイム編集用
  const [filters, setFilters] = useState({
    urgency: '',
    importance: '',
    completed: '',
    sort: ''
  });

  const urgencyOptions = [
    { value: 'urgent', label: '緊急', color: '#f44336' },
    { value: 'not_urgent', label: '緊急ではない', color: '#4caf50' }
  ];

  const importanceOptions = [
    { value: 'important', label: '重要', color: '#f44336' },
    { value: 'not_important', label: '重要ではない', color: '#4caf50' }
  ];

  // 画面サイズ変更の監視
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
      
      // モバイル → デスクトップ切り替え時に選択されたタスクがあれば保持
      // デスクトップ → モバイル切り替え時も選択状態を保持
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // タスクを取得する関数
  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tasks/');
      const data = await response.json();
      // Django REST frameworkのページネーション形式からresults配列を取得
      const tasksArray = data.results || [];
      setTasks(tasksArray);
      setFilteredTasks(tasksArray);
    } catch (error) {
      // エラーはユーザーに表示される
      console.error('タスクの取得に失敗しました:', error);
      setTasks([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // タスクを追加する関数
  const addTask = async (taskData) => {
    try {
      const response = await fetch('http://localhost:8000/api/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error) {
          alert(errorData.error);
          return false; // 失敗を示す
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newTask = await response.json();
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      // モバイル時はモーダルを閉じる
      if (isMobile) {
        setShowTaskFormModal(false);
      }
      
      // 事前設定データをクリア
      setPrefilledTaskData(null);
      setCurrentEditingTask(null);
      
      return true; // 成功を示す
    } catch (error) {
      console.error('Error adding task:', error);
      alert('タスクの追加中にエラーが発生しました');
      return false;
    }
  };

  // タスクを更新する関数
  const updateTask = async (taskId, taskData) => {
    try {
      const response = await fetch(`http://localhost:8000/api/tasks/${taskId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (response.ok) {
        const updatedTask = await response.json();
        
        // タスクリストを即座に更新
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
        );
        
        // 詳細表示中のタスクも更新
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(updatedTask);
        }
        

        return updatedTask;
      } else {
        const errorData = await response.json();
        console.error('更新エラー:', errorData);
        alert(`タスクの更新に失敗しました: ${JSON.stringify(errorData)}`);
        return null;
      }
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      alert('ネットワークエラー: タスクの更新に失敗しました');
      return null;
    }
  };

  // タスクを削除する関数
  const deleteTask = async (taskId) => {
    if (window.confirm('このタスクを削除しますか？')) {
      try {
        const response = await fetch(`http://localhost:8000/api/tasks/${taskId}/`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          fetchTasks(); // タスクリストを再取得
        } else {
          alert('タスクの削除に失敗しました');
        }
      } catch (error) {
        console.error('タスクの削除に失敗しました:', error);
        alert('タスクの削除に失敗しました');
      }
    }
  };

  // フィルタリング機能
  const applyFilters = (tasks, filters) => {
    // tasksが配列でない場合は空配列を使用
    if (!Array.isArray(tasks)) {
      return [];
    }
    let filtered = [...tasks];

    // 緊急度フィルター
    if (filters.urgency) {
      filtered = filtered.filter(task => task.urgency === filters.urgency);
    }

    // 重要度フィルター
    if (filters.importance) {
      filtered = filtered.filter(task => task.importance === filters.importance);
    }

    // 完了状態フィルター
    if (filters.completed !== '') {
      const isCompleted = filters.completed === 'true';
      filtered = filtered.filter(task => task.completed === isCompleted);
    }

    // ソート
    if (filters.sort) {
      switch (filters.sort) {
        case 'urgency':
          filtered.sort((a, b) => b.urgency_weight - a.urgency_weight);
          break;
        case 'importance':
          filtered.sort((a, b) => b.importance_weight - a.importance_weight);
          break;
        case 'due_date':
          filtered.sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
          });
          break;
        case 'created_at':
          filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
        case 'eisenhower':
          // アイゼンハウワーマトリクス順
          filtered.sort((a, b) => {
            const getQuadrant = (task) => {
              const urgentHigh = task.urgency === 'high';
              const importantHigh = task.importance === 'high';
              
              if (urgentHigh && importantHigh) return 1;
              if (!urgentHigh && importantHigh) return 2;
              if (urgentHigh && !importantHigh) return 3;
              return 4;
            };
            
            return getQuadrant(a) - getQuadrant(b);
          });
          break;
        default:
          break;
      }
    }

    return filtered;
  };

  // フィルター変更時の処理
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    const filtered = applyFilters(tasks, newFilters);
    setFilteredTasks(filtered);
  };

  // タスククリック時の処理（マトリックスから詳細表示など）
  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  // タスク詳細を閉じる処理
  const closeTaskDetail = () => {
    setSelectedTask(null);
  };

  // カレンダーの時間ブロッククリック処理
  const handleCalendarTimeSlotClick = (presetData) => {
    setPrefilledTaskData(presetData);
    
    // リアルタイム編集用の初期データを作成
    const initialEditingTask = {
      id: 'editing-current',
      title: '',
      description: '',
      due_date: presetData.due_date,
      is_all_day: presetData.is_all_day,
      importance: presetData.importance,
      urgency: presetData.urgency,
      completed: false,
      is_overdue: false,
      isEditing: true
    };
    
    setCurrentEditingTask(initialEditingTask);
    setShowTaskFormModal(true);
  };

  // 初回読み込み
  useEffect(() => {
    fetchTasks();
  }, []);

  // 画面サイズ変更時のモバイル・タブレット判定を更新
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1366;
      setIsMobile(mobile);
      
      // デスクトップに切り替わったときはモーダルを閉じる
      if (!mobile) {
        setShowTaskFormModal(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // タスクが更新されたときにフィルターを再適用
  useEffect(() => {
    const filtered = applyFilters(tasks, filters);
    setFilteredTasks(filtered);
  }, [tasks, filters]);

  return (
    <div className="app-container">
      <div className="container">
        <div className="main-content">
          {/* 横並びレイアウト */}
          <div className="layout-horizontal">
            {/* 左側: マトリックス/リスト表示 */}
            <div className="matrix-area">
              {loading ? (
                <div className="glass-card matrix-card">
                  <p>読み込み中...</p>
                </div>
              ) : (
                <div className="glass-card matrix-card">
                  <div className="view-controls">
                    {/* 表示方法切り替え */}
                    <div className="filter-group">
                      <label>表示方法:</label>
                      <div className="view-buttons">
                        <button 
                          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                          onClick={() => setViewMode('list')}
                        >
                          リスト表示
                        </button>
                        <button 
                          className={`view-btn ${viewMode === 'matrix' ? 'active' : ''}`}
                          onClick={() => setViewMode('matrix')}
                        >
                          マトリクス表示
                        </button>
                        <button 
                          className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                          onClick={() => setViewMode('calendar')}
                        >
                          カレンダー表示
                        </button>
                        {/* フィルタリングボタン（リスト表示時のみ） */}
                        {viewMode === 'list' && (
                          <button 
                            className="view-btn filter-btn-inline"
                            onClick={() => setShowFilterModal(true)}
                          >
                            🔍 フィルター・ソート
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 現在の設定を表示（リスト表示時のみ） */}
                    {viewMode === 'list' && (
                      <div className="current-filters">
                        {filters.urgency && <span className="filter-tag">緊急度: {urgencyOptions.find(opt => opt.value === filters.urgency)?.label}</span>}
                        {filters.importance && <span className="filter-tag">重要度: {importanceOptions.find(opt => opt.value === filters.importance)?.label}</span>}
                        {filters.completed !== '' && <span className="filter-tag">完了状態: {filters.completed === 'true' ? '完了' : '未完了'}</span>}
                        {filters.sort && <span className="filter-tag">ソート: {
                          filters.sort === 'urgency' ? '緊急度順' :
                          filters.sort === 'importance' ? '重要度順' :
                          filters.sort === 'due_date' ? '期限順' :
                          filters.sort === 'eisenhower' ? 'マトリクス順' : 'デフォルト'
                        }</span>}
                      </div>
                    )}
                  </div>

                  <div className="display-content">
                    {viewMode === 'list' ? (
                      <TaskList 
                        tasks={filteredTasks} 
                        onUpdate={updateTask} 
                        onDelete={deleteTask}
                        onTaskClick={handleTaskClick}
                      />
                    ) : viewMode === 'matrix' ? (
                      <EisenhowerMatrix 
                        tasks={filteredTasks} 
                        onTaskClick={handleTaskClick}
                        onTaskUpdate={async (updatedTask) => {
                          return await updateTask(updatedTask.id, updatedTask);
                        }}
                      />
                    ) : (
                      <CalendarView 
                        tasks={filteredTasks} 
                        onTaskClick={handleTaskClick}
                        onTaskUpdate={updateTask}
                        onTaskAdd={handleCalendarTimeSlotClick}
                        currentEditingTask={currentEditingTask}
                      />
                    )}
                    
                    {/* モバイル用タスク追加ボタン */}
                    {isMobile && (
                      <div className="mobile-add-task-container">
                        <button 
                          className="mobile-add-task-btn"
                          onClick={() => setShowTaskFormModal(true)}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 中央: タスク詳細表示（デスクトップのみ） */}
            {!isMobile && (
              <div className="task-detail-area">
                {selectedTask ? (
                  <div className="glass-card">
                    <TaskDetail
                      task={selectedTask}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      onClose={closeTaskDetail}
                      isModal={false}
                    />
                  </div>
                ) : (
                  <div className="glass-card no-selection">
                    <div className="no-selection-content">
                      <div className="no-selection-icon">📋</div>
                      <h3>タスク詳細</h3>
                      <p>タスクを選択すると詳細が表示されます</p>
                      <div className="no-selection-hint">
                        <small>🖱️ タスクカードをクリックしてください</small>
                        <small>📱 ドラッグ&ドロップで象限移動も可能です</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 右側: タスク作成フォーム（デスクトップのみ） */}
            {!isMobile && (
              <div className="control-area">
                <div className="glass-card">
                  <TaskForm 
                    onSubmit={addTask} 
                    prefilledData={prefilledTaskData}
                    onRealTimeUpdate={setCurrentEditingTask}
                  />
                </div>
              </div>
            )}
          </div>

          {/* モバイル時のタスク詳細モーダル */}
          {isMobile && selectedTask && (
            <TaskDetail
              task={selectedTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onClose={closeTaskDetail}
              isModal={true}
            />
          )}

          {/* モバイル時のタスク追加モーダル */}
          {isMobile && showTaskFormModal && (
            <div className="task-form-overlay">
              <div className="task-form-modal">
                <div className="task-form-header">
                  <h2>新しいタスクを追加</h2>
                  <button 
                    className="close-button"
                    onClick={() => {
                      setShowTaskFormModal(false);
                      setPrefilledTaskData(null);
                      setCurrentEditingTask(null);
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="task-form-content">
                  <TaskForm 
                    onSubmit={addTask} 
                    prefilledData={prefilledTaskData}
                    onRealTimeUpdate={setCurrentEditingTask}
                  />
                </div>
              </div>
            </div>
          )}

          {/* フィルター・ソート設定モーダル */}
          {showFilterModal && (
            <div className="task-form-overlay">
              <div className="task-form-modal filter-modal">
                <div className="task-form-header">
                  <h2>🔍 フィルター・ソート設定</h2>
                  <button 
                    className="close-button"
                    onClick={() => setShowFilterModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="task-form-content">
                  <div className="filters-section">
                    {/* 緊急度フィルター */}
                    <div className="filter-group">
                      <label>緊急度:</label>
                      <div className="filter-buttons">
                        <button
                          className={`filter-btn ${filters.urgency === '' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('urgency', '')}
                        >
                          全て
                        </button>
                        {urgencyOptions.map(option => (
                          <button
                            key={option.value}
                            className={`filter-btn small ${filters.urgency === option.value ? 'active' : ''}`}
                            style={{
                              backgroundColor: filters.urgency === option.value ? option.color : 'transparent',
                              borderColor: option.color
                            }}
                            onClick={() => handleFilterChange('urgency', option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 重要度フィルター */}
                    <div className="filter-group">
                      <label>重要度:</label>
                      <div className="filter-buttons">
                        <button
                          className={`filter-btn ${filters.importance === '' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('importance', '')}
                        >
                          全て
                        </button>
                        {importanceOptions.map(option => (
                          <button
                            key={option.value}
                            className={`filter-btn small ${filters.importance === option.value ? 'active' : ''}`}
                            style={{
                              backgroundColor: filters.importance === option.value ? option.color : 'transparent',
                              borderColor: option.color
                            }}
                            onClick={() => handleFilterChange('importance', option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 完了状態フィルター */}
                    <div className="filter-group">
                      <label>完了状態:</label>
                      <div className="filter-buttons">
                        <button
                          className={`filter-btn ${filters.completed === '' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('completed', '')}
                        >
                          全て
                        </button>
                        <button
                          className={`filter-btn ${filters.completed === 'false' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('completed', 'false')}
                        >
                          未完了
                        </button>
                        <button
                          className={`filter-btn ${filters.completed === 'true' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('completed', 'true')}
                        >
                          完了
                        </button>
                      </div>
                    </div>

                    {/* ソートオプション */}
                    <div className="filter-group">
                      <label>ソート:</label>
                      <div className="filter-buttons">
                        <button
                          className={`filter-btn ${filters.sort === '' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('sort', '')}
                        >
                          デフォルト
                        </button>
                        <button
                          className={`filter-btn ${filters.sort === 'urgency' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('sort', 'urgency')}
                        >
                          緊急度順
                        </button>
                        <button
                          className={`filter-btn ${filters.sort === 'importance' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('sort', 'importance')}
                        >
                          重要度順
                        </button>
                        <button
                          className={`filter-btn ${filters.sort === 'due_date' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('sort', 'due_date')}
                        >
                          期限順
                        </button>
                        <button
                          className={`filter-btn ${filters.sort === 'eisenhower' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('sort', 'eisenhower')}
                        >
                          マトリクス順
                        </button>
                      </div>
                    </div>

                    {/* リセットボタン */}
                    <div className="filter-actions-footer">
                      <button
                        className="reset-filters-btn"
                        onClick={() => {
                          setFilters({
                            urgency: '',
                            importance: '',
                            completed: '',
                            sort: ''
                          });
                        }}
                      >
                        全てリセット
                      </button>
                      <button
                        className="apply-filters-btn"
                        onClick={() => setShowFilterModal(false)}
                      >
                        設定を適用
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 