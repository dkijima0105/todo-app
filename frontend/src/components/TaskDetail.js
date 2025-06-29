import React, { useState } from 'react';

function TaskDetail({ task, onUpdate, onDelete, onClose, isModal = true }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    urgency: task.urgency,
    importance: task.importance,
    due_year: '',
    due_month: '',
    due_day: '',
    due_hour: '',
    due_minute: '',
    estimated_hours: task.estimated_hours ? task.estimated_hours.toString() : '',
    is_all_day: task.is_all_day || false
  });

  const urgencyOptions = [
    { value: 'urgent', label: '緊急', color: '#f44336' },
    { value: 'not_urgent', label: '緊急ではない', color: '#4caf50' }
  ];

  const importanceOptions = [
    { value: 'important', label: '重要', color: '#f44336' },
    { value: 'not_important', label: '重要ではない', color: '#4caf50' }
  ];

  const estimatedHoursOptions = [
    { value: '0.25', label: '15分' },
    { value: '0.5', label: '30分' },
    { value: '1', label: '60分' },
    { value: '1.5', label: '90分' },
    { value: '2', label: '120分' }
  ];

  // 年・月・日のオプション
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear + 1];
  const monthOptions = Array.from({length: 12}, (_, i) => i + 1);
  const dayOptions = Array.from({length: 31}, (_, i) => i + 1);

  // 期限日時を分割してセット
  React.useEffect(() => {
    if (task.due_date) {
      const date = new Date(task.due_date);
      setEditData(prev => ({
        ...prev,
        due_year: date.getFullYear().toString(),
        due_month: (date.getMonth() + 1).toString(),
        due_day: date.getDate().toString(),
        due_hour: task.is_all_day ? '' : date.getHours().toString(),
        due_minute: task.is_all_day ? '' : date.getMinutes().toString(),
        is_all_day: task.is_all_day || false
      }));
    } else {
      // 期限が設定されていない場合は今日をデフォルトに
      const today = new Date();
      setEditData(prev => ({
        ...prev,
        due_year: today.getFullYear().toString(),
        due_month: (today.getMonth() + 1).toString(),
        due_day: today.getDate().toString(),
        due_hour: task.is_all_day ? '' : '8',
        due_minute: task.is_all_day ? '' : '0',
        is_all_day: task.is_all_day || false
      }));
    }
  }, [task.due_date, task.is_all_day]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowSuccessMessage(false);
    setEditData({
      title: task.title,
      description: task.description,
      urgency: task.urgency,
      importance: task.importance,
      due_year: '',
      due_month: '',
      due_day: '',
      due_hour: '',
      due_minute: '',
      estimated_hours: task.estimated_hours ? task.estimated_hours.toString() : '',
      is_all_day: task.is_all_day || false
    });
  };

  const showSuccessNotification = () => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000); // 3秒後に消す
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // 終日チェックボックスの変更を特別処理
    if (name === 'is_all_day') {
      if (checked) {
        // 終日ONの場合: 時刻フィールドを空にする
        setEditData({
          ...editData,
          is_all_day: true,
          due_hour: '',
          due_minute: ''
        });
      } else {
        // 終日OFFの場合: デフォルト時刻を設定
        setEditData({
          ...editData,
          is_all_day: false,
          due_hour: editData.due_hour || '8',
          due_minute: editData.due_minute || '0'
        });
      }
    } else {
      setEditData({
        ...editData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleOptionSelect = (field, value) => {
    setEditData({
      ...editData,
      [field]: value
    });
  };

  const constructDateTime = () => {
    const { due_year, due_month, due_day, due_hour, due_minute, is_all_day } = editData;
    if (due_year && due_month && due_day) {
      if (is_all_day) {
        const dateStr = `${due_year}-${due_month.padStart(2, '0')}-${due_day.padStart(2, '0')}T23:59:59`;
        return new Date(dateStr).toISOString();
      } else {
        const hour = due_hour || '8';
        const minute = due_minute || '0';
        const dateStr = `${due_year}-${due_month.padStart(2, '0')}-${due_day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
        return new Date(dateStr).toISOString();
      }
    }
    return null;
  };

  const handleSave = async () => {
    const due_date = constructDateTime();
    const updateData = {
      title: editData.title,
      description: editData.description,
      urgency: editData.urgency,
      importance: editData.importance,
      due_date: due_date,
      estimated_hours: editData.estimated_hours ? parseFloat(editData.estimated_hours) : null,
      is_all_day: editData.is_all_day
    };

    // データの更新処理を実行

    const result = await onUpdate(task.id, updateData);
    if (result) {
      setIsEditing(false);
      showSuccessNotification();
    }
  };

  const handleComplete = async () => {
    setIsUpdating(true);
    try {
      const updatedTask = await onUpdate(task.id, { completed: !task.completed });
      if (updatedTask) {
        showSuccessNotification();
      }
    } catch (error) {
      console.error('完了状態の更新に失敗しました:', error);
      alert('完了状態の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('このタスクを削除しますか？')) {
      onDelete(task.id);
      onClose();
    }
  };

  const formatDate = (dateString, isAllDay = false) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    
    if (isAllDay) {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getUrgencyColor = (urgency) => {
    const colors = { urgent: '#f44336', not_urgent: '#4caf50' };
    return colors[urgency] || '#ddd';
  };

  const getImportanceColor = (importance) => {
    const colors = { important: '#f44336', not_important: '#4caf50' };
    return colors[importance] || '#ddd';
  };

  return (
    <div className={isModal ? "task-detail-overlay" : "task-detail-inline"}>
      <div className={isModal ? "task-detail-panel" : "task-detail-content-wrapper"}>
        <div className="task-detail-header">
          <h2>タスク詳細</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {showSuccessMessage && (
          <div className="success-message">
            <span>✓ 保存しました</span>
          </div>
        )}

        {isEditing ? (
          <div className="task-detail-content editing">
            <div className="form-group">
              <label>タイトル</label>
              <input
                type="text"
                name="title"
                value={editData.title}
                onChange={handleChange}
                className="detail-input"
              />
            </div>
            
            <div className="form-group">
              <label>説明</label>
              <textarea
                name="description"
                value={editData.description}
                onChange={handleChange}
                className="detail-textarea"
                rows="3"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>緊急度</label>
                <div className="criteria-help">
                  <small>
                    <strong>緊急:</strong> 今すぐ対応が必要、締切が迫っている<br/>
                    <strong>緊急ではない:</strong> 時間に余裕がある、計画的に取り組める
                  </small>
                </div>
                <div className="option-buttons">
                  {urgencyOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className={`option-btn small ${editData.urgency === option.value ? 'active' : ''}`}
                      style={{
                        backgroundColor: editData.urgency === option.value ? option.color : 'transparent',
                        borderColor: option.color
                      }}
                      onClick={() => handleOptionSelect('urgency', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>重要度</label>
                <div className="criteria-help">
                  <small>
                    <strong>重要:</strong> 目標達成に直結する、影響が大きい<br/>
                    <strong>重要ではない:</strong> やらなくても大きな影響がない
                  </small>
                </div>
                <div className="option-buttons">
                  {importanceOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className={`option-btn small ${editData.importance === option.value ? 'active' : ''}`}
                      style={{
                        backgroundColor: editData.importance === option.value ? option.color : 'transparent',
                        borderColor: option.color
                      }}
                      onClick={() => handleOptionSelect('importance', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>期限</label>
              <div className="datetime-container compact">
                <div className="datetime-section">
                  <div className="datetime-section-label">日付</div>
                  <div className="datetime-row date-row">
                    <div className="datetime-field">
                      <select name="due_year" value={editData.due_year} onChange={handleChange} className="date-select small">
                        {yearOptions.map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                        ))}
                      </select>
                      <span className="datetime-field-label">年</span>
                    </div>
                    <div className="datetime-field">
                      <select name="due_month" value={editData.due_month} onChange={handleChange} className="date-select small">
                        {monthOptions.map(month => (
                          <option key={month} value={month.toString()}>{month}</option>
                        ))}
                      </select>
                      <span className="datetime-field-label">月</span>
                    </div>
                    <div className="datetime-field">
                      <select name="due_day" value={editData.due_day} onChange={handleChange} className="date-select small">
                        {dayOptions.map(day => (
                          <option key={day} value={day.toString()}>{day}</option>
                        ))}
                      </select>
                      <span className="datetime-field-label">日</span>
                    </div>
                  </div>
                </div>
                
                <div className="datetime-section">
                  <div className="datetime-section-header">
                    <div className="datetime-section-label">時刻</div>
                    <div className="all-day-field">
                      <label className="all-day-checkbox">
                        <input type="checkbox" name="is_all_day" checked={editData.is_all_day} onChange={handleChange} />
                        <span className="all-day-label">終日</span>
                      </label>
                    </div>
                  </div>
                  <div className="datetime-row time-row">
                    <div className="datetime-field">
                      <select name="due_hour" value={editData.due_hour} onChange={handleChange} className="time-select small" disabled={editData.is_all_day}>
                        {Array.from({length: 15}, (_, i) => i + 8).map(hour => (
                          <option key={hour} value={hour.toString()}>{hour}</option>
                        ))}
                      </select>
                      <span className="datetime-field-label">時</span>
                    </div>
                    <div className="datetime-field">
                      <select name="due_minute" value={editData.due_minute} onChange={handleChange} className="time-select small" disabled={editData.is_all_day}>
                        {[0, 15, 30, 45].map(minute => (
                          <option key={minute} value={minute.toString()}>{minute.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="datetime-field-label">分</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>想定作業時間</label>
              <div className="option-buttons">
                {estimatedHoursOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={`option-btn small ${editData.estimated_hours === option.value ? 'active' : ''}`}
                    style={{
                      backgroundColor: editData.estimated_hours === option.value ? '#2196f3' : 'transparent',
                      borderColor: '#2196f3'
                    }}
                    onClick={() => handleOptionSelect('estimated_hours', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="detail-actions">
              <button onClick={handleSave} className="save-button">保存</button>
              <button onClick={handleCancel} className="cancel-button">キャンセル</button>
            </div>
          </div>
        ) : (
          <div className="task-detail-content">
            <div className="task-info">
              <h3 className={task.completed ? 'completed-text' : ''}>{task.title}</h3>
              
              <div className="task-badges">
                <span className="priority-badge" style={{ backgroundColor: getUrgencyColor(task.urgency) }}>
                  緊急度: {task.urgency_display}
                </span>
                <span className="importance-badge" style={{ backgroundColor: getImportanceColor(task.importance) }}>
                  重要度: {task.importance_display}
                </span>
                {task.is_all_day && <span className="all-day-badge">終日</span>}
                {task.completed && <span className="completed-badge">完了</span>}
                {task.is_overdue && <span className="overdue-badge">期限切れ</span>}
              </div>
              
              <div className="task-description">
                <strong>説明:</strong>
                <p>{task.description || '説明がありません'}</p>
              </div>
              
              {task.due_date && (
                <div className="task-meta">
                  <strong>期限:</strong> {formatDate(task.due_date, task.is_all_day)}
                </div>
              )}
              
              {task.estimated_hours_display && (
                <div className="task-meta">
                  <strong>想定作業時間:</strong> {task.estimated_hours_display}
                </div>
              )}
              
              <div className="task-dates">
                <div><strong>作成:</strong> {formatDate(task.created_at)}</div>
                <div><strong>更新:</strong> {formatDate(task.updated_at)}</div>
              </div>
            </div>
            
            <div className="detail-actions">
              <button 
                onClick={handleComplete} 
                className={`complete-button ${task.completed ? 'completed' : ''} ${isUpdating ? 'updating' : ''}`}
                disabled={isUpdating}
              >
                {isUpdating ? '更新中...' : (task.completed ? '未完了にする' : '完了にする')}
              </button>
              <button onClick={handleEdit} className="edit-button" disabled={isUpdating}>編集</button>
              <button onClick={handleDelete} className="delete-button" disabled={isUpdating}>削除</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetail; 