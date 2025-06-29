import React, { useState, useEffect, useCallback } from 'react';

function TaskForm({ onSubmit, prefilledData, onRealTimeUpdate }) {
  const today = new Date();
  const currentYear = today.getFullYear();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    urgency: 'not_urgent',
    importance: 'not_important',
    due_year: today.getFullYear().toString(),
    due_month: (today.getMonth() + 1).toString(),
    due_day: today.getDate().toString(),
    due_hour: '8',
    due_minute: '0',
    estimated_hours: '',
    is_all_day: false
  });

  const urgencyOptions = [
    { value: 'urgent', label: '緊急', color: '#f44336' },
    { value: 'not_urgent', label: '緊急ではない', color: '#4caf50' }
  ];

  const importanceOptions = [
    { value: 'important', label: '重要', color: '#f44336' },
    { value: 'not_important', label: '重要ではない', color: '#4caf50' }
  ];

  // 想定作業時間の選択肢（時間単位で格納）
  const estimatedHoursOptions = [
    { value: '0.25', label: '15分' },
    { value: '0.5', label: '30分' },
    { value: '1', label: '60分' },
    { value: '1.5', label: '90分' },
    { value: '2', label: '120分' }
  ];



  // 年のオプション（今年と来年のみ）
  const yearOptions = [currentYear, currentYear + 1];

  // 月のオプション
  const monthOptions = Array.from({length: 12}, (_, i) => i + 1);

  // 日のオプション
  const dayOptions = Array.from({length: 31}, (_, i) => i + 1);

  // 事前設定データが変更されたときにフォームを更新
  useEffect(() => {
    if (prefilledData) {
      const dueDate = new Date(prefilledData.due_date);
      setFormData({
        title: prefilledData.title || '',
        description: prefilledData.description || '',
        urgency: prefilledData.urgency || 'not_urgent',
        importance: prefilledData.importance || 'not_important',
        due_year: dueDate.getFullYear().toString(),
        due_month: (dueDate.getMonth() + 1).toString(),
        due_day: dueDate.getDate().toString(),
        due_hour: dueDate.getHours().toString(),
        due_minute: dueDate.getMinutes().toString(),
        estimated_hours: prefilledData.estimated_hours || '',
        is_all_day: prefilledData.is_all_day || false
      });
    }
  }, [prefilledData]);

  // 期限日時を構築する関数（useCallbackでメモ化）
  const constructDateTime = useCallback(() => {
    const { due_year, due_month, due_day, due_hour, due_minute, is_all_day } = formData;
    if (due_year && due_month && due_day) {
      if (is_all_day) {
        // 終日の場合は23:59:59に設定（タイムゾーン変換対策）
        const dateStr = `${due_year}-${due_month.padStart(2, '0')}-${due_day.padStart(2, '0')}T23:59:59`;
        return new Date(dateStr).toISOString();
      } else {
        // 通常の場合は指定時刻
        const hour = due_hour || '8';
        const minute = due_minute || '0';
        const dateStr = `${due_year}-${due_month.padStart(2, '0')}-${due_day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
        return new Date(dateStr).toISOString();
      }
    }
    return null;
  }, [formData.due_year, formData.due_month, formData.due_day, formData.due_hour, formData.due_minute, formData.is_all_day]);

  // リアルタイム更新: formDataが変更されたときにカレンダーに反映
  useEffect(() => {
    if (onRealTimeUpdate && prefilledData) {
      const updatedTask = {
        id: 'editing-current',
        title: formData.title || '新しいタスク',
        description: formData.description,
        due_date: constructDateTime(),
        is_all_day: formData.is_all_day,
        importance: formData.importance,
        urgency: formData.urgency,
        completed: false,
        is_overdue: false,
        isEditing: true
      };
      onRealTimeUpdate(updatedTask);
    }
  }, [formData, onRealTimeUpdate, prefilledData, constructDateTime]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleOptionSelect = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };





  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      urgency: formData.urgency,
      importance: formData.importance,
      due_date: constructDateTime(),
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      is_all_day: formData.is_all_day
    };

    const success = await onSubmit(taskData);
    
    // 成功時のみフォームをリセット
    if (success) {
      const today = new Date();
      setFormData({
        title: '', 
        description: '', 
        urgency: 'not_urgent', 
        importance: 'not_important',
        due_year: today.getFullYear().toString(),
        due_month: (today.getMonth() + 1).toString(),
        due_day: today.getDate().toString(),
        due_hour: '8',
        due_minute: '0',
        estimated_hours: '',
        is_all_day: false
      });
      
      // リアルタイム編集もクリア
      if (onRealTimeUpdate) {
        onRealTimeUpdate(null);
      }
    }
  };

  return (
    <div className="task-form">
      <h2>新しいタスクを追加</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="タスクのタイトル"
            required
          />
        </div>
        
        <div className="form-group">
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="タスクの説明（オプション）"
            rows="3"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>緊急度</label>
            <div className="option-buttons">
              {urgencyOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`option-btn ${formData.urgency === option.value ? 'active' : ''}`}
                  style={{
                    backgroundColor: formData.urgency === option.value ? option.color : 'transparent',
                    borderColor: option.color
                  }}
                  onClick={() => handleOptionSelect('urgency', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="criteria-help">
              <small>
                <strong>緊急:</strong> 今すぐ対応が必要<br/>
                締切が迫っている、他人を待たせている<br/>
                <strong>緊急ではない:</strong> 時間に余裕がある<br/>
                計画的に取り組むことができる
              </small>
            </div>
          </div>
          
          <div className="form-group">
            <label>重要度</label>
            <div className="option-buttons">
              {importanceOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`option-btn ${formData.importance === option.value ? 'active' : ''}`}
                  style={{
                    backgroundColor: formData.importance === option.value ? option.color : 'transparent',
                    borderColor: option.color
                  }}
                  onClick={() => handleOptionSelect('importance', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="criteria-help">
              <small>
                <strong>重要:</strong> 目標達成に直結する<br/>
                影響が大きい、自分にとって価値が高い<br/>
                <strong>重要ではない:</strong> 大きな影響がない<br/>
                他人に任せることができる
              </small>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label>期限</label>
          <div className="datetime-container">
            {/* 日付選択（1行目） */}
            <div className="datetime-section">
              <div className="datetime-section-label">日付</div>
              <div className="datetime-row date-row">
                <div className="datetime-field">
                  <select
                    name="due_year"
                    value={formData.due_year}
                    onChange={handleChange}
                    className="date-select"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <span className="datetime-field-label">年</span>
                </div>
                
                <div className="datetime-field">
                  <select
                    name="due_month"
                    value={formData.due_month}
                    onChange={handleChange}
                    className="date-select"
                  >
                    {monthOptions.map(month => (
                      <option key={month} value={month.toString()}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <span className="datetime-field-label">月</span>
                </div>
                
                <div className="datetime-field">
                  <select
                    name="due_day"
                    value={formData.due_day}
                    onChange={handleChange}
                    className="date-select"
                  >
                    {dayOptions.map(day => (
                      <option key={day} value={day.toString()}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <span className="datetime-field-label">日</span>
                </div>
              </div>
            </div>
            
            {/* 時間選択（2行目） */}
            <div className="datetime-section">
              <div className="datetime-section-header">
                <div className="datetime-section-label">時刻</div>
                <div className="all-day-field">
                  <label className="all-day-checkbox">
                    <input
                      type="checkbox"
                      name="is_all_day"
                      checked={formData.is_all_day}
                      onChange={handleChange}
                    />
                    <span className="all-day-label">終日</span>
                  </label>
                </div>
              </div>
              <div className="datetime-row time-row">
                <div className="datetime-field">
                  <select
                    name="due_hour"
                    value={formData.due_hour}
                    onChange={handleChange}
                    className="time-select"
                    disabled={formData.is_all_day}
                  >
                    {Array.from({length: 15}, (_, i) => i + 8).map(hour => (
                      <option key={hour} value={hour.toString()}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <span className="datetime-field-label">時</span>
                </div>
                
                <div className="datetime-field">
                  <select
                    name="due_minute"
                    value={formData.due_minute}
                    onChange={handleChange}
                    className="time-select"
                    disabled={formData.is_all_day}
                  >
                    {[0, 15, 30, 45].map(minute => (
                      <option key={minute} value={minute.toString()}>
                        {minute.toString().padStart(2, '0')}
                      </option>
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
                className={`option-btn ${formData.estimated_hours === option.value ? 'active' : ''}`}
                style={{
                  backgroundColor: formData.estimated_hours === option.value ? '#2196f3' : 'transparent',
                  borderColor: '#2196f3'
                }}
                onClick={() => handleOptionSelect('estimated_hours', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <button type="submit" className="submit-button">
          タスクを追加
        </button>
      </form>
    </div>
  );
}

export default TaskForm; 