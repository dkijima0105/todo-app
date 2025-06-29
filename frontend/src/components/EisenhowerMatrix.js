import React, { useState, useRef, useEffect } from 'react';

function EisenhowerMatrix({ tasks, onTaskClick, onTaskUpdate }) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDownStartTime, setMouseDownStartTime] = useState(null);
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 });
  const dragPreviewRef = useRef(null);
  
  // refで状態を追跡（useEffectで安定した参照のため）
  const stateRef = useRef({
    draggedTask: null,
    isDragging: false,
    mouseDownStartTime: null,
    mouseDownPosition: { x: 0, y: 0 },
    dragOverQuadrant: null,
    onTaskClick: onTaskClick,
    onTaskUpdate: onTaskUpdate
  });

  // 状態変更時にrefも更新
  useEffect(() => {
    stateRef.current.draggedTask = draggedTask;
  }, [draggedTask]);

  useEffect(() => {
    stateRef.current.isDragging = isDragging;
  }, [isDragging]);

  useEffect(() => {
    stateRef.current.mouseDownStartTime = mouseDownStartTime;
  }, [mouseDownStartTime]);

  useEffect(() => {
    stateRef.current.mouseDownPosition = mouseDownPosition;
  }, [mouseDownPosition]);

  useEffect(() => {
    stateRef.current.dragOverQuadrant = dragOverQuadrant;
  }, [dragOverQuadrant]);

  useEffect(() => {
    stateRef.current.onTaskClick = onTaskClick;
  }, [onTaskClick]);

  useEffect(() => {
    stateRef.current.onTaskUpdate = onTaskUpdate;
  }, [onTaskUpdate]);

  // 重要度と緊急度の組み合わせでタスクを分類（完了タスクは除外）
  const getQuadrantTasks = (importance, urgency) => {
    return tasks.filter(task => 
      task.importance === importance && 
      task.urgency === urgency && 
      !task.completed
    );
  };

  // ポインター座標を取得する共通関数
  const getPointerCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      // タッチイベント
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      // タッチエンドイベント
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    } else {
      // マウスイベント
      return { x: e.clientX, y: e.clientY };
    }
  };

  // ポインターダウン時の処理（ドラッグ開始）- マウス・タッチ統合
  const handlePointerDown = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getPointerCoordinates(e);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = coords.x - rect.left;
    const offsetY = coords.y - rect.top;
    
    // 初期状態の記録
    setMouseDownStartTime(Date.now());
    setMouseDownPosition({ x: coords.x, y: coords.y });
    setDraggedTask(task);
    setDragOffset({ x: offsetX, y: offsetY });
    setDragPosition({ x: coords.x, y: coords.y });
    
    // まだドラッグ状態ではない（移動で判定）
  };

  // グローバルポインターイベントの管理（マウス・タッチ統合）
  useEffect(() => {
    if (!draggedTask) return;

    const handleGlobalPointerMove = (e) => {
      const { draggedTask: currentDraggedTask, isDragging: currentIsDragging, mouseDownStartTime: currentMouseDownStartTime, mouseDownPosition: currentMouseDownPosition, dragOverQuadrant: currentDragOverQuadrant } = stateRef.current;
      
      if (!currentDraggedTask || !currentMouseDownStartTime) return;
      
      const coords = getPointerCoordinates(e);
      
      // 移動距離を計算
      const deltaX = coords.x - currentMouseDownPosition.x;
      const deltaY = coords.y - currentMouseDownPosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // 5ピクセル以上移動したらドラッグ開始
      if (!currentIsDragging && distance > 5) {
        setIsDragging(true);
        document.body.classList.add('drag-in-progress');
      }
      
      if (currentIsDragging) {
        setDragPosition({ x: coords.x, y: coords.y });
        
        // ポインター位置の下にある要素を取得
        const elementsBelow = document.elementsFromPoint(coords.x, coords.y);
        
        let quadrant = null;
        for (const element of elementsBelow) {
          if (element.classList.contains('matrix-quadrant')) {
            // 象限の判定
            if (element.classList.contains('quadrant-1')) {
              quadrant = { importance: 'important', urgency: 'urgent' };
            } else if (element.classList.contains('quadrant-2')) {
              quadrant = { importance: 'important', urgency: 'not_urgent' };
            } else if (element.classList.contains('quadrant-3')) {
              quadrant = { importance: 'not_important', urgency: 'urgent' };
            } else if (element.classList.contains('quadrant-4')) {
              quadrant = { importance: 'not_important', urgency: 'not_urgent' };
            }
            break;
          }
        }
        
        if (quadrant) {
          setDragOverQuadrant(quadrant);
        } else if (currentDragOverQuadrant) {
          setDragOverQuadrant(null);
        }
      }
    };

    const handleGlobalPointerUp = async (e) => {
      const { draggedTask: currentDraggedTask, isDragging: currentIsDragging, mouseDownStartTime: currentMouseDownStartTime, dragOverQuadrant: currentDragOverQuadrant, onTaskClick: currentOnTaskClick, onTaskUpdate: currentOnTaskUpdate } = stateRef.current;
      
      if (!currentDraggedTask || !currentMouseDownStartTime) {
        return;
      }
      
      const clickDuration = Date.now() - currentMouseDownStartTime;
      
      // ドラッグ状態でない場合はクリック処理
      if (!currentIsDragging && clickDuration < 300) {
        currentOnTaskClick(currentDraggedTask);
      } else if (currentIsDragging) {
        // ドラッグ&ドロップ処理
        if (currentDragOverQuadrant && currentOnTaskUpdate) {
          
          // 異なる象限にドロップされた場合のみ更新
          if (currentDraggedTask.importance !== currentDragOverQuadrant.importance || 
              currentDraggedTask.urgency !== currentDragOverQuadrant.urgency) {
            
            const updatedTask = {
              ...currentDraggedTask,
              importance: currentDragOverQuadrant.importance,
              urgency: currentDragOverQuadrant.urgency
            };
            
            try {
              await currentOnTaskUpdate(updatedTask);
            } catch (error) {
              // エラーはユーザーに通知
              console.error('タスク更新エラー:', error);
              alert('タスクの更新に失敗しました: ' + error.message);
            }
                      }
          }
      }
      
      // 状態をクリア
      setDraggedTask(null);
      setDragOverQuadrant(null);
      setIsDragging(false);
      setDragPosition({ x: 0, y: 0 });
      setMouseDownStartTime(null);
      setMouseDownPosition({ x: 0, y: 0 });
      document.body.classList.remove('drag-in-progress');
    };

    // マウスイベント
    document.addEventListener('mousemove', handleGlobalPointerMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalPointerUp, { passive: false });
    // タッチイベント
    document.addEventListener('touchmove', handleGlobalPointerMove, { passive: false });
    document.addEventListener('touchend', handleGlobalPointerUp, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleGlobalPointerMove);
      document.removeEventListener('mouseup', handleGlobalPointerUp);
      document.removeEventListener('touchmove', handleGlobalPointerMove);
      document.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [draggedTask]);

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      document.body.classList.remove('drag-in-progress');
    };
  }, []);

  // 日付フォーマット関数
  const formatDate = (dateString, isAllDay = false) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // 日付のみで比較するための関数
    const isSameDate = (date1, date2) => {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    };
    
    // 相対日付の判定
    if (isSameDate(date, today)) {
      return isAllDay ? '今日' : `今日 ${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isSameDate(date, tomorrow)) {
      return isAllDay ? '明日' : `明日 ${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // 明後日以降は通常の日付表示
      return isAllDay ? 
        date.toLocaleDateString('ja-JP') : 
        date.toLocaleString('ja-JP', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
    }
  };

  return (
    <div className="eisenhower-matrix">
      <div className="matrix-container">
        {/* 上部の緊急度ラベル */}
        <div className="matrix-top-labels">
          <div className="axis-spacer"></div>
          <div className="axis-label-row">
            <div className="axis-label urgent-label">緊急</div>
            <div className="axis-label not-urgent-label">緊急ではない</div>
          </div>
        </div>

        {/* メインのマトリクス部分 */}
        <div className="matrix-main">
          {/* 左側の重要度ラベル */}
          <div className="matrix-side-labels">
            <div className="axis-label important-label">重要</div>
            <div className="axis-label not-important-label">重要ではない</div>
          </div>

          {/* マトリクスグリッド */}
          <div className="matrix-grid">
            {/* 第1象限: 緊急 & 重要 */}
            <div 
              className={`matrix-quadrant quadrant-1 ${
                dragOverQuadrant?.importance === 'important' && dragOverQuadrant?.urgency === 'urgent' ? 'drag-over' : ''
              }`}
            >
              <div className="quadrant-header">
                <h3>すぐやる</h3>
                <small>緊急 × 重要</small>
              </div>
              <div className="quadrant-tasks">
                {getQuadrantTasks('important', 'urgent').map(task => (
                  <div 
                    key={task.id}
                    className={`matrix-task ${task.is_overdue ? 'overdue' : ''} ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                    onMouseDown={(e) => handlePointerDown(e, task)}
                    onTouchStart={(e) => handlePointerDown(e, task)}
                    title={`${task.description || task.title}\n\nドラッグ&ドロップで象限を移動できます`}
                    style={{
                      cursor: 'grab',
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                  >
                    <div className="matrix-task-title">{task.title}</div>
                    {task.due_date && (
                      <div className="matrix-task-due">
                        {task.is_overdue && <span className="overdue-badge">期限切れ</span>}
                        {task.is_all_day && <span className="all-day-badge">終日</span>}
                        {formatDate(task.due_date, task.is_all_day)}
                      </div>
                    )}
                    {task.estimated_hours_display && (
                      <div className="matrix-task-time">{task.estimated_hours_display}</div>
                    )}
                  </div>
                ))}
                {dragOverQuadrant?.importance === 'important' && dragOverQuadrant?.urgency === 'urgent' && (
                  <div className="drop-placeholder">ここにドロップ</div>
                )}
              </div>
            </div>

            {/* 第2象限: 緊急ではない & 重要 */}
            <div 
              className={`matrix-quadrant quadrant-2 ${
                dragOverQuadrant?.importance === 'important' && dragOverQuadrant?.urgency === 'not_urgent' ? 'drag-over' : ''
              }`}
            >
              <div className="quadrant-header">
                <h3>計画的にやる</h3>
                <small>重要 × 緊急ではない</small>
              </div>
              <div className="quadrant-tasks">
                {getQuadrantTasks('important', 'not_urgent').map(task => (
                  <div 
                    key={task.id}
                    className={`matrix-task ${task.is_overdue ? 'overdue' : ''} ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                    onMouseDown={(e) => handlePointerDown(e, task)}
                    onTouchStart={(e) => handlePointerDown(e, task)}
                    title={`${task.description || task.title}\n\nドラッグ&ドロップで象限を移動できます`}
                    style={{
                      cursor: 'grab',
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                  >
                    <div className="matrix-task-title">{task.title}</div>
                    {task.due_date && (
                      <div className="matrix-task-due">
                        {task.is_overdue && <span className="overdue-badge">期限切れ</span>}
                        {task.is_all_day && <span className="all-day-badge">終日</span>}
                        {formatDate(task.due_date, task.is_all_day)}
                      </div>
                    )}
                    {task.estimated_hours_display && (
                      <div className="matrix-task-time">{task.estimated_hours_display}</div>
                    )}
                  </div>
                ))}
                {dragOverQuadrant?.importance === 'important' && dragOverQuadrant?.urgency === 'not_urgent' && (
                  <div className="drop-placeholder">ここにドロップ</div>
                )}
              </div>
            </div>

            {/* 第3象限: 緊急 & 重要ではない */}
            <div 
              className={`matrix-quadrant quadrant-3 ${
                dragOverQuadrant?.importance === 'not_important' && dragOverQuadrant?.urgency === 'urgent' ? 'drag-over' : ''
              }`}
            >
              <div className="quadrant-header">
                <h3>委任する</h3>
                <small>緊急 × 重要ではない</small>
              </div>
              <div className="quadrant-tasks">
                {getQuadrantTasks('not_important', 'urgent').map(task => (
                  <div 
                    key={task.id}
                    className={`matrix-task ${task.is_overdue ? 'overdue' : ''} ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                    onMouseDown={(e) => handlePointerDown(e, task)}
                    onTouchStart={(e) => handlePointerDown(e, task)}
                    title={`${task.description || task.title}\n\nドラッグ&ドロップで象限を移動できます`}
                    style={{
                      cursor: 'grab',
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                  >
                    <div className="matrix-task-title">{task.title}</div>
                    {task.due_date && (
                      <div className="matrix-task-due">
                        {task.is_overdue && <span className="overdue-badge">期限切れ</span>}
                        {task.is_all_day && <span className="all-day-badge">終日</span>}
                        {formatDate(task.due_date, task.is_all_day)}
                      </div>
                    )}
                    {task.estimated_hours_display && (
                      <div className="matrix-task-time">{task.estimated_hours_display}</div>
                    )}
                  </div>
                ))}
                {dragOverQuadrant?.importance === 'not_important' && dragOverQuadrant?.urgency === 'urgent' && (
                  <div className="drop-placeholder">ここにドロップ</div>
                )}
              </div>
            </div>

            {/* 第4象限: 緊急ではない & 重要ではない */}
            <div 
              className={`matrix-quadrant quadrant-4 ${
                dragOverQuadrant?.importance === 'not_important' && dragOverQuadrant?.urgency === 'not_urgent' ? 'drag-over' : ''
              }`}
            >
              <div className="quadrant-header">
                <h3>やらない</h3>
                <small>重要ではない × 緊急ではない</small>
              </div>
              <div className="quadrant-tasks">
                {getQuadrantTasks('not_important', 'not_urgent').map(task => (
                  <div 
                    key={task.id}
                    className={`matrix-task ${task.is_overdue ? 'overdue' : ''} ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                    onMouseDown={(e) => handlePointerDown(e, task)}
                    onTouchStart={(e) => handlePointerDown(e, task)}
                    title={`${task.description || task.title}\n\nドラッグ&ドロップで象限を移動できます`}
                    style={{
                      cursor: 'grab',
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                  >
                    <div className="matrix-task-title">{task.title}</div>
                    {task.due_date && (
                      <div className="matrix-task-due">
                        {task.is_overdue && <span className="overdue-badge">期限切れ</span>}
                        {task.is_all_day && <span className="all-day-badge">終日</span>}
                        {formatDate(task.due_date, task.is_all_day)}
                      </div>
                    )}
                    {task.estimated_hours_display && (
                      <div className="matrix-task-time">{task.estimated_hours_display}</div>
                    )}
                  </div>
                ))}
                {dragOverQuadrant?.importance === 'not_important' && dragOverQuadrant?.urgency === 'not_urgent' && (
                  <div className="drop-placeholder">ここにドロップ</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ドラッグプレビュー */}
      {isDragging && draggedTask && (
        <div 
          ref={dragPreviewRef}
          className="drag-preview"
          style={{
            position: 'fixed',
            left: dragPosition.x - dragOffset.x,
            top: dragPosition.y - dragOffset.y,
            zIndex: 9999,
            pointerEvents: 'none',
            opacity: 0.8,
            transform: 'rotate(5deg) scale(0.9)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '8px',
            color: 'white',
            fontSize: '0.75rem',
            maxWidth: '200px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="matrix-task-title">{draggedTask.title}</div>
          {draggedTask.due_date && (
            <div className="matrix-task-due" style={{ fontSize: '0.65rem' }}>
              {formatDate(draggedTask.due_date, draggedTask.is_all_day)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EisenhowerMatrix; 