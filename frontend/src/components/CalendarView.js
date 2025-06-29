import React, { useState } from 'react';

function CalendarView({ tasks, onTaskClick, onTaskUpdate, onTaskAdd, onEmptyClick, currentEditingTask }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);


  // 現在の年月を取得
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // 月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0: 日曜日, 1: 月曜日...

  // 前の期間に移動
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(currentMonth - 1);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(currentDate.getDate() - 1);
        break;
      default:
        break;
    }
    setCurrentDate(newDate);
  };

  // 次の期間に移動
  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(currentMonth + 1);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(currentDate.getDate() + 1);
        break;
      default:
        break;
    }
    setCurrentDate(newDate);
  };

  // 今日に戻る
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 表示モードに応じたタイトルを取得
  const getDisplayTitle = () => {
    switch (viewMode) {
      case 'month':
        return `${currentYear}年 ${getMonthName(currentMonth)}`;
      case 'week':
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.getFullYear()}年 ${getMonthName(weekStart.getMonth())} ${weekStart.getDate()}日 - ${getMonthName(weekEnd.getMonth())} ${weekEnd.getDate()}日`;
      case 'day':
        return `${currentYear}年 ${getMonthName(currentMonth)} ${currentDate.getDate()}日 (${getDayNames()[currentDate.getDay()]})`;
      default:
        return '';
    }
  };

  // カレンダーグリッドの日付を生成
  const generateCalendarDays = () => {
    const days = [];
    const totalDays = lastDayOfMonth.getDate();
    
    // 前月の末尾の日付を追加（月の最初が日曜日でない場合）
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDate = new Date(currentYear, currentMonth, -i);
      days.push({
        date: prevMonthDate,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    // 当月の日付を追加
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        date: date,
        isCurrentMonth: true,
        isPrevMonth: false
      });
    }

    // 次月の最初の日付を追加（グリッドを6週間分埋めるため）
    const remainingCells = 42 - days.length; // 6週間 × 7日 = 42セル
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date: nextMonthDate,
        isCurrentMonth: false,
        isPrevMonth: false
      });
    }

    return days;
  };

  // 指定した日付のタスクを取得
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      
      const taskDate = new Date(task.due_date);
      
      // 終日タスクの場合は日付のみで比較（タイムゾーン対応）
      if (task.is_all_day) {
        const taskYear = taskDate.getFullYear();
        const taskMonth = taskDate.getMonth();
        const taskDay = taskDate.getDate();
        
        const compareYear = date.getFullYear();
        const compareMonth = date.getMonth();
        const compareDay = date.getDate();
        
        return taskYear === compareYear && 
               taskMonth === compareMonth && 
               taskDay === compareDay;
      } else {
        // 通常タスクは従来通り
        return taskDate.toDateString() === date.toDateString();
      }
    });
  };

  // 今日の日付かどうかを判定
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 月名を日本語で取得
  const getMonthName = (month) => {
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return monthNames[month];
  };

  // 曜日名を取得
  const getDayNames = () => {
    return ['日', '月', '火', '水', '木', '金', '土'];
  };

  // 週表示用：週の開始日（日曜日）を取得
  const getWeekStart = (date) => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // 週表示用：週の日付配列を生成
  const generateWeekDays = () => {
    const weekStart = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // 時間軸を生成（週表示・日表示用）8時-22時、15分刻み
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push({
          hour,
          minute,
          label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        });
      }
    }
    return slots;
  };

  // 指定時間のタスクを取得（15分単位）
  const getTasksForDateAndTimeSlot = (date, hour, minute) => {
    const regularTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      
      const taskDate = new Date(task.due_date);
      
      if (task.is_all_day) {
        // 終日タスクは終日行に表示するため、時間枠には表示しない
        return false;
      } else {
        // 時刻指定タスクは該当15分枠に表示
        const taskHour = taskDate.getHours();
        const taskMinute = taskDate.getMinutes();
        const taskQuarter = Math.floor(taskMinute / 15) * 15; // 15分単位に丸める
        
        return isSameDay(taskDate, date) && 
               taskHour === hour && 
               taskQuarter === minute;
      }
    });

    // 編集中タスクも含める（終日でない場合のみ）
    if (currentEditingTask && currentEditingTask.due_date && !currentEditingTask.is_all_day) {
      const editingTaskDate = new Date(currentEditingTask.due_date);
      const editingTaskHour = editingTaskDate.getHours();
      const editingTaskMinute = editingTaskDate.getMinutes();
      const editingTaskQuarter = Math.floor(editingTaskMinute / 15) * 15;
      
      if (isSameDay(editingTaskDate, date) && 
          editingTaskHour === hour && 
          editingTaskQuarter === minute) {
        regularTasks.push(currentEditingTask);
      }
    }

    return regularTasks;
  };

  // 指定日の終日タスクを取得
  const getAllDayTasksForDate = (date) => {
    const allDayTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      
      const taskDate = new Date(task.due_date);
      return task.is_all_day && isSameDay(taskDate, date);
    });

    // 編集中の終日タスクも含める
    if (currentEditingTask && currentEditingTask.due_date && currentEditingTask.is_all_day) {
      const editingTaskDate = new Date(currentEditingTask.due_date);
      if (isSameDay(editingTaskDate, date)) {
        allDayTasks.push(currentEditingTask);
      }
    }

    return allDayTasks;
  };

  // 同じ日かどうかを判定
  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // 時間ブロッククリック処理（タスク追加フォームを開く）
  const handleTimeSlotClick = (date, hour, minute) => {
    if (!onTaskAdd) return;
    
    // 指定された日時を期限とする新しいタスクのデータを作成
    const dueDate = new Date(date);
    dueDate.setHours(hour, minute, 0, 0);
    
    // 新しいタスクの初期データ
    const newTaskData = {
      title: '',
      description: '',
      due_date: dueDate.toISOString(),
      is_all_day: false,
      importance: 'not_important', // デフォルト値
      urgency: 'not_urgent'       // デフォルト値
    };
    
    onTaskAdd(newTaskData);
  };

  // 終日エリアクリック処理（終日タスク追加）
  const handleAllDayClick = (date) => {
    if (!onTaskAdd) return;
    
    // 終日タスクの期限日時を設定（23:59:59に設定してタイムゾーン対策）
    const dueDate = new Date(date);
    dueDate.setHours(23, 59, 59, 999);
    
    // 新しい終日タスクの初期データ
    const newTaskData = {
      title: '',
      description: '',
      due_date: dueDate.toISOString(),
      is_all_day: true,
      importance: 'not_important', // デフォルト値
      urgency: 'not_urgent'       // デフォルト値
    };
    
    onTaskAdd(newTaskData);
  };

  // ドラッグ開始時の処理
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
    setDragOverDate(null);
  };

  // ドラッグオーバー時の処理
  const handleDragOver = (e, date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date.toDateString());
  };

  // ドラッグ離脱時の処理
  const handleDragLeave = (e) => {
    // セル境界を離れた時のみクリア（子要素への移動は無視）
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverDate(null);
    }
  };

  // ドロップ時の処理
  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedTask) return;

    try {
      // 新しい期限を計算
      const newDueDate = calculateNewDueDate(draggedTask, targetDate);

      // タスクを更新
      const updatedTaskData = {
        ...draggedTask,
        due_date: newDueDate
      };

      const result = await onTaskUpdate(draggedTask.id, updatedTaskData);
      
      if (!result) {
        alert('タスクの期限更新に失敗しました');
      }
    } catch (error) {
      alert('タスクの期限更新中にエラーが発生しました');
    }

    setDraggedTask(null);
  };

  // 終日エリアへのドロップ処理
  const handleAllDayDrop = async (e, targetDate) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedTask) return;

    try {
      // 終日タスクとして更新
      const newDate = new Date(targetDate);
      newDate.setHours(23, 59, 59, 0);
      
      const updatedTaskData = {
        ...draggedTask,
        due_date: newDate.toISOString(),
        is_all_day: true
      };

      const result = await onTaskUpdate(draggedTask.id, updatedTaskData);
      
      if (!result) {
        alert('終日タスクへの変換に失敗しました');
      }
    } catch (error) {
      alert('終日タスクへの変換中にエラーが発生しました');
    }

    setDraggedTask(null);
  };

  // 時間指定エリアへのドロップ処理（終日から時間指定への変換）
  const handleTimeSlotDrop = async (e, targetDate, hour, minute) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedTask) return;

    try {
      // 時間指定タスクとして更新
      const newDate = new Date(targetDate);
      newDate.setHours(hour, minute, 0, 0);
      
      const updatedTaskData = {
        ...draggedTask,
        due_date: newDate.toISOString(),
        is_all_day: false
      };

      const result = await onTaskUpdate(draggedTask.id, updatedTaskData);
      
      if (!result) {
        alert('時間指定タスクへの変換に失敗しました');
      }
    } catch (error) {
      alert('時間指定タスクへの変換中にエラーが発生しました');
    }

    setDraggedTask(null);
  };

  // 新しい期限日時を計算
  const calculateNewDueDate = (task, targetDate) => {
    if (task.is_all_day) {
      // 終日タスクの場合：新しい日付の23:59:59
      const newDate = new Date(targetDate);
      newDate.setHours(23, 59, 59, 0);
      return newDate.toISOString();
    } else {
      // 時刻指定タスクの場合：時刻は保持して日付のみ変更
      const originalDate = new Date(task.due_date);
      const newDate = new Date(targetDate);
      
      newDate.setHours(
        originalDate.getHours(),
        originalDate.getMinutes(),
        originalDate.getSeconds(),
        originalDate.getMilliseconds()
      );
      
      return newDate.toISOString();
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="calendar-view" onClick={(e) => {
      // ボタンやインタラクティブ要素をクリックした場合は何もしない
      if (e.target.closest('button, .task-item, .view-mode-btn, .nav-btn, .today-btn, .sync-btn')) {
        return;
      }
      // タイムスロット領域（タスク作成エリア）をクリックした場合は何もしない
      if (e.target.closest('.calendar-day, .week-time-cell, .day-time-cell, .week-allday-cell, .day-allday-cell')) {
        return;
      }
      // カレンダー以外の部分をクリックした場合は仮タスクをクリア
      if (onEmptyClick && !e.target.closest('.calendar-grid, .week-view, .day-view')) {
        onEmptyClick();
      }
    }}>
              {/* カレンダーヘッダー */}
        <div className="calendar-header" onClick={(e) => {
          // ボタンをクリックした場合は何もしない
          if (e.target.closest('button, .view-mode-btn, .nav-btn, .today-btn, .sync-btn')) {
            return;
          }
          // ヘッダーエリアをクリックした場合は仮タスクをクリア
          if (onEmptyClick) {
            e.stopPropagation(); // 親要素への伝播を防ぐ
            onEmptyClick();
          }
        }}>
        <div className="calendar-view-controls">
          <div className="view-mode-buttons">
            <button 
              className={`view-mode-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              月
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              週
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              日
            </button>
          </div>
        </div>
        
        <div className="calendar-navigation">
          <button className="nav-btn" onClick={goToPrevious}>
            ‹
          </button>
          <div className="current-period">
            <h2>{getDisplayTitle()}</h2>
          </div>
          <button className="nav-btn" onClick={goToNext}>
            ›
          </button>
        </div>
        
        <div className="calendar-actions">
          <button className="today-btn" onClick={goToToday}>
            今日
          </button>
          {/* 将来的なGoogle連携ボタン */}
          <button className="sync-btn" disabled title="Google連携（今後実装予定）">
            🔄 Google同期
          </button>
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="calendar-grid" onClick={(e) => {
        // タイムスロット領域（タスク作成エリア）をクリックした場合は何もしない
        if (e.target.closest('.calendar-day, .week-time-cell, .day-time-cell, .week-allday-cell, .day-allday-cell')) {
          return;
        }
        // 背景をクリックした場合は仮タスクをクリア
        if (onEmptyClick) {
          onEmptyClick();
        }
      }}>
        {viewMode === 'month' && (
          <>
            {/* 月表示：曜日ヘッダー */}
            <div className="calendar-weekdays">
              {getDayNames().map((dayName, index) => (
                <div key={index} className="weekday-header">
                  {dayName}
                </div>
              ))}
            </div>

            {/* 月表示：日付セル */}
            <div className="calendar-days">
              {calendarDays.map((day, index) => {
                const dayTasks = getTasksForDate(day.date);
                const completedTasks = dayTasks.filter(task => task.completed);
                const pendingTasks = dayTasks.filter(task => !task.completed);
                const overdueTasks = pendingTasks.filter(task => task.is_overdue);

                return (
                  <div
                    key={index}
                    className={`calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${
                      isToday(day.date) ? 'today' : ''
                    } ${dayTasks.length > 0 ? 'has-tasks' : ''} ${
                      dragOverDate === day.date.toDateString() ? 'drag-over' : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, day.date)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day.date)}
                    onClick={(e) => {
                      // タスクをクリックした場合は何もしない（タスクの onClick が処理する）
                      if (e.target.closest('.task-item')) return;
                      // 空の日付ブロックをクリックした場合は仮タスクをクリア
                      if (onEmptyClick) {
                        onEmptyClick();
                      }
                    }}
                  >
                    <div className="day-number">
                      {day.date.getDate()}
                    </div>
                    
                    {/* タスク表示 */}
                    {dayTasks.length > 0 && (
                      <div className="day-tasks">
                        {/* 期限切れタスクを優先表示 */}
                        {overdueTasks.slice(0, 2).map(task => (
                          <div
                            key={task.id}
                            className="task-item overdue draggable"
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              if (!draggedTask) {
                                onTaskClick(task);
                              }
                            }}
                            title={`${task.title} - 期限切れ（ドラッグで移動可能）`}
                          >
                            <span className="task-title">{task.title}</span>
                          </div>
                        ))}
                        
                        {/* 未完了タスク */}
                        {pendingTasks.filter(task => !task.is_overdue).slice(0, 2 - overdueTasks.length).map(task => (
                          <div
                            key={task.id}
                            className="task-item pending draggable"
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              if (!draggedTask) {
                                onTaskClick(task);
                              }
                            }}
                            title={`${task.title}（ドラッグで移動可能）`}
                          >
                            <span className="task-title">{task.title}</span>
                          </div>
                        ))}
                        
                        {/* 完了タスク */}
                        {completedTasks.slice(0, Math.max(0, 2 - pendingTasks.length)).map(task => (
                          <div
                            key={task.id}
                            className="task-item completed draggable"
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              if (!draggedTask) {
                                onTaskClick(task);
                              }
                            }}
                            title={`${task.title} - 完了（ドラッグで移動可能）`}
                          >
                            <span className="task-title">{task.title}</span>
                          </div>
                        ))}
                        
                        {/* 追加のタスク数を表示 */}
                        {dayTasks.length > 2 && (
                          <div className="more-tasks">
                            +{dayTasks.length - 2}個
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'week' && (
          <div className="week-view" onClick={(e) => {
            // タイムスロット領域（タスク作成エリア）をクリックした場合は何もしない
            if (e.target.closest('.week-time-cell, .week-allday-cell')) {
              return;
            }
            // 背景をクリックした場合は仮タスクをクリア
            if (onEmptyClick) {
              onEmptyClick();
            }
          }}>
            {/* 週表示：曜日ヘッダー */}
            <div className="week-header">
              <div className="time-header">時刻</div>
              {generateWeekDays().map((day, index) => (
                <div key={index} className="week-day-header">
                  <div className="day-name">{getDayNames()[day.getDay()]}</div>
                  <div className="day-date">{day.getDate()}</div>
                </div>
              ))}
            </div>

            {/* 週表示：時間軸とタスク */}
            <div className="week-content" onClick={(e) => {
              // タイムスロット領域（タスク作成エリア）をクリックした場合は何もしない
              if (e.target.closest('.week-time-cell, .week-allday-cell')) {
                return;
              }
              // 背景をクリックした場合は仮タスクをクリア
              if (onEmptyClick) {
                onEmptyClick();
              }
            }}>
              {/* 終日行 */}
              <div className="week-allday-row">
                <div className="time-label allday-label">終日</div>
                {generateWeekDays().map((day, dayIndex) => {
                  const allDayTasks = getAllDayTasksForDate(day);
                  
                  return (
                    <div
                      key={`allday-${dayIndex}`}
                      className={`week-allday-cell ${
                        isToday(day) ? 'today' : ''
                      } ${
                        dragOverDate === `${day.toDateString()}-allday` ? 'drag-over' : ''
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverDate(`${day.toDateString()}-allday`);
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleAllDayDrop(e, day)}
                      onClick={(e) => {
                        if (e.target.closest('.task-item')) return;
                        if (!draggedTask) {
                          handleAllDayClick(day);
                        }
                      }}
                    >
                      {/* 終日タスクアイテム */}
                      {allDayTasks.map(task => (
                        <div
                          key={task.id}
                          className={`task-item allday-task ${
                            task.isEditing ? 'temp-task-card' : 
                            task.completed ? 'completed' : 
                            task.is_overdue ? 'overdue' : 'pending'
                          } ${!task.isEditing ? 'draggable' : ''}`}
                          draggable={!task.isEditing}
                          onDragStart={!task.isEditing ? (e) => handleDragStart(e, task) : undefined}
                          onDragEnd={!task.isEditing ? handleDragEnd : undefined}
                          onClick={(e) => {
                            if (!task.isEditing) {
                              e.stopPropagation();
                              !draggedTask && onTaskClick(task);
                            }
                          }}
                          title={`${task.title} (終日)`}
                        >
                          <span className="task-title">{task.title}</span>
                          <span className="all-day-indicator">終日</span>
                        </div>
                      ))}
                      
                      {/* ドラッグオーバー表示 */}
                      {dragOverDate === `${day.toDateString()}-allday` && (
                        <div className="drag-placeholder">
                          📅 終日タスクをここにドロップ
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 時間軸の行 */}
              {generateTimeSlots().map((slot) => (
                <div key={`${slot.hour}-${slot.minute}`} className="week-time-row">
                  <div className="time-label">
                    {slot.minute === 0 ? `${slot.hour.toString().padStart(2, '0')}:00` : ''}
                  </div>
                  {generateWeekDays().map((day, dayIndex) => {
                    const timeSlotTasks = getTasksForDateAndTimeSlot(day, slot.hour, slot.minute);
                    return (
                      <div
                        key={`${slot.hour}-${slot.minute}-${dayIndex}`}
                        className={`week-time-cell ${
                          isToday(day) ? 'today' : ''
                        } ${
                          dragOverDate === `${day.toDateString()}-${slot.hour}-${slot.minute}` ? 'drag-over' : ''
                        } ${
                          slot.minute === 45 ? 'hour-boundary' : ''
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverDate(`${day.toDateString()}-${slot.hour}-${slot.minute}`);
                        }}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleTimeSlotDrop(e, day, slot.hour, slot.minute)}
                        onClick={(e) => {
                          // タスクをクリックした場合は何もしない（タスクの onClick が処理する）
                          if (e.target.closest('.task-item')) return;
                          // 空の時間ブロックをクリックした場合は新しいタスクを追加
                          handleTimeSlotClick(day, slot.hour, slot.minute);
                        }}
                      >
                        {timeSlotTasks.map(task => (
                          <div
                            key={task.id}
                            className={`task-item ${
                              task.isEditing ? 'temp-task-card' : 
                              task.completed ? 'completed' : 
                              task.is_overdue ? 'overdue' : 'pending'
                            } ${!task.isEditing ? 'draggable' : ''}`}
                            draggable={!task.isEditing}
                            onDragStart={!task.isEditing ? (e) => handleDragStart(e, task) : undefined}
                            onDragEnd={!task.isEditing ? handleDragEnd : undefined}
                            onClick={(e) => {
                              if (!task.isEditing) {
                                e.stopPropagation(); // 親の onClick を防ぐ
                                !draggedTask && onTaskClick(task);
                              }
                            }}
                            title={`${task.title}${task.is_all_day ? ' (終日)' : ''}`}
                          >
                            <span className="task-title">{task.title}</span>
                            {task.is_all_day && <span className="all-day-indicator">終日</span>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="day-view" onClick={(e) => {
            // タイムスロット領域（タスク作成エリア）をクリックした場合は何もしない
            if (e.target.closest('.day-time-cell, .day-allday-cell')) {
              return;
            }
            // 背景をクリックした場合は仮タスクをクリア
            if (onEmptyClick) {
              onEmptyClick();
            }
          }}>
            {/* 日表示：ヘッダー */}
            <div className="day-header">
              <div className="day-title">
                {currentDate.getDate()}日 ({getDayNames()[currentDate.getDay()]})
              </div>
            </div>

            {/* 日表示：時間軸とタスク */}
            <div className="day-content" onClick={(e) => {
              // タイムスロット領域（タスク作成エリア）をクリックした場合は何もしない
              if (e.target.closest('.day-time-cell, .day-allday-cell')) {
                return;
              }
                          // 背景をクリックした場合は仮タスクをクリア
            if (onEmptyClick) {
              onEmptyClick();
            }
            }}>
              {/* 終日行 */}
              <div className="day-allday-row">
                <div className="time-label allday-label">終日</div>
                <div
                  className={`day-allday-cell ${
                    dragOverDate === `${currentDate.toDateString()}-allday` ? 'drag-over' : ''
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverDate(`${currentDate.toDateString()}-allday`);
                  }}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleAllDayDrop(e, currentDate)}
                  onClick={(e) => {
                    if (e.target.closest('.task-item')) return;
                    if (!draggedTask) {
                      handleAllDayClick(currentDate);
                    }
                  }}
                >
                  {/* 終日タスクアイテム */}
                  {getAllDayTasksForDate(currentDate).map(task => (
                    <div
                      key={task.id}
                      className={`task-item allday-task ${
                        task.isEditing ? 'temp-task-card' : 
                        task.completed ? 'completed' : 
                        task.is_overdue ? 'overdue' : 'pending'
                      } ${!task.isEditing ? 'draggable' : ''}`}
                      draggable={!task.isEditing}
                      onDragStart={!task.isEditing ? (e) => handleDragStart(e, task) : undefined}
                      onDragEnd={!task.isEditing ? handleDragEnd : undefined}
                      onClick={(e) => {
                        if (!task.isEditing) {
                          e.stopPropagation();
                          !draggedTask && onTaskClick(task);
                        }
                      }}
                      title={`${task.title} (終日)`}
                    >
                      <span className="task-title">{task.title}</span>
                      <span className="all-day-indicator">終日</span>
                    </div>
                  ))}
                  
                  {/* ドラッグオーバー表示 */}
                  {dragOverDate === `${currentDate.toDateString()}-allday` && (
                    <div className="drag-placeholder">
                      📅 終日タスクをここにドロップ
                    </div>
                  )}
                </div>
              </div>

              {/* 時間軸の行 */}
              {generateTimeSlots().map((slot) => {
                const timeSlotTasks = getTasksForDateAndTimeSlot(currentDate, slot.hour, slot.minute);
                return (
                  <div key={`${slot.hour}-${slot.minute}`} className="day-time-row">
                    <div className="time-label">
                      {slot.minute === 0 ? `${slot.hour.toString().padStart(2, '0')}:00` : ''}
                    </div>
                    <div
                      className={`day-time-cell ${
                        dragOverDate === `${currentDate.toDateString()}-${slot.hour}-${slot.minute}` ? 'drag-over' : ''
                      } ${
                        slot.minute === 45 ? 'hour-boundary' : ''
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverDate(`${currentDate.toDateString()}-${slot.hour}-${slot.minute}`);
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleTimeSlotDrop(e, currentDate, slot.hour, slot.minute)}
                      onClick={(e) => {
                        // タスクをクリックした場合は何もしない（タスクの onClick が処理する）
                        if (e.target.closest('.task-item')) return;
                        // 空の時間ブロックをクリックした場合は新しいタスクを追加
                        handleTimeSlotClick(currentDate, slot.hour, slot.minute);
                      }}
                    >
                      {timeSlotTasks.map(task => (
                        <div
                          key={task.id}
                          className={`task-item ${
                            task.isEditing ? 'temp-task-card' : 
                            task.completed ? 'completed' : 
                            task.is_overdue ? 'overdue' : 'pending'
                          } ${!task.isEditing ? 'draggable' : ''}`}
                          draggable={!task.isEditing}
                          onDragStart={!task.isEditing ? (e) => handleDragStart(e, task) : undefined}
                          onDragEnd={!task.isEditing ? handleDragEnd : undefined}
                          onClick={(e) => {
                            if (!task.isEditing) {
                              e.stopPropagation(); // 親の onClick を防ぐ
                              !draggedTask && onTaskClick(task);
                            }
                          }}
                          title={`${task.title}${task.is_all_day ? ' (終日)' : ''}`}
                        >
                          <span className="task-title">{task.title}</span>
                          <div className="task-time">
                            {task.is_all_day ? '終日' : new Date(task.due_date).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* カレンダー統計 */}
      <div className="calendar-stats" onClick={(e) => {
                  // 統計エリアをクリックした場合は仮タスクをクリア
          if (onEmptyClick) {
            e.stopPropagation(); // 親要素への伝播を防ぐ
            onEmptyClick();
          }
      }}>
        <div className="stats-item">
          <span className="stats-label">今月のタスク:</span>
          <span className="stats-value">
            {tasks.filter(task => {
              if (!task.due_date) return false;
              const taskDate = new Date(task.due_date);
              return taskDate.getFullYear() === currentYear && taskDate.getMonth() === currentMonth;
            }).length}個
          </span>
        </div>
        <div className="stats-item">
          <span className="stats-label">完了済み:</span>
          <span className="stats-value">
            {tasks.filter(task => {
              if (!task.due_date || !task.completed) return false;
              const taskDate = new Date(task.due_date);
              return taskDate.getFullYear() === currentYear && taskDate.getMonth() === currentMonth;
            }).length}個
          </span>
        </div>
        <div className="stats-item">
          <span className="stats-label">期限切れ:</span>
          <span className="stats-value stats-overdue">
            {tasks.filter(task => {
              if (!task.due_date || task.completed) return false;
              const taskDate = new Date(task.due_date);
              return taskDate.getFullYear() === currentYear && 
                     taskDate.getMonth() === currentMonth && 
                     task.is_overdue;
            }).length}個
          </span>
        </div>
      </div>

      {/* 将来の拡張用：Google連携の説明 */}
      <div className="future-features" onClick={(e) => {
        // 将来の機能説明エリアをクリックした場合は仮タスクをクリア
        if (onEmptyClick) {
          e.stopPropagation(); // 親要素への伝播を防ぐ
          onEmptyClick();
        }
      }}>
        <div className="feature-note">
          <p>📅 <strong>今後の機能追加予定:</strong></p>
          <ul>
            <li>Google カレンダーとの同期</li>
            <li>週表示・日表示の切り替え</li>
            <li>カレンダー上でのタスク編集</li>
            <li>繰り返しタスクの対応</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CalendarView; 