import { useCallback, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import "./kanban.css";

const COLUMNS = [
  { id: "todo", title: "📋 لازم أعمله" },
  { id: "progress", title: "⚡ شغالة عليه" },
  { id: "done", title: "✅ خلصت" },
];

const PRIORITIES = {
  urgent: { label: "عاجل", emoji: "🔴" },
  important: { label: "مهم", emoji: "🟡" },
  normal: { label: "عادي", emoji: "🟢" },
};

const INITIAL_TASKS = {
  todo: [
    { id: "t1", title: "إصلاح باج تسجيل الدخول", note: "الـ token بيخلص بدري على الموبايل", priority: "urgent" },
    { id: "t2", title: "كتابة اختبارات لـ API الشات", note: "Jest + supertest", priority: "important" },
    { id: "t3", title: "تحديث الـ README", note: "خطوات التشغيل والنشر", priority: "normal" },
  ],
  progress: [
    { id: "t4", title: "ربط الواجهة بـ Supabase", note: "المصادقة وجدول المحادثات", priority: "important" },
    { id: "t5", title: "تحسين أداء قائمة الرسائل", note: "virtualization للمحادثات الطويلة", priority: "normal" },
  ],
  done: [
    { id: "t6", title: "تجهيز المشروع للنشر", note: "متغيرات البيئة و build", priority: "urgent" },
    { id: "t7", title: "إضافة الوضع الداكن", note: "", priority: "normal" },
  ],
};

function move(state, source, destination) {
  const from = [...state[source.droppableId]];
  const [item] = from.splice(source.index, 1);
  if (source.droppableId === destination.droppableId) {
    from.splice(destination.index, 0, item);
    return { ...state, [source.droppableId]: from };
  }
  const to = [...state[destination.droppableId]];
  to.splice(destination.index, 0, item);
  return { ...state, [source.droppableId]: from, [destination.droppableId]: to };
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [landedId, setLandedId] = useState(null);

  const onDragEnd = useCallback(({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    setTasks((prev) => move(prev, source, destination));
    setLandedId(draggableId);
  }, []);

  return (
    <div dir="rtl" className="kanban">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map((col, i) => {
            const items = tasks[col.id];
            return (
              <section
                key={col.id}
                className={`kanban-col col-${col.id}`}
                style={{ "--i": i }}
              >
                <header className="col-header">
                  <h2 className="col-title">{col.title}</h2>
                  <span key={items.length} className="count-badge">
                    {items.length}
                  </span>
                </header>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`col-body ${snapshot.isDraggingOver ? "over" : ""} ${
                        items.length === 0 ? "is-empty" : ""
                      }`}
                    >
                      {items.map((task, index) => {
                        const p = PRIORITIES[task.priority];
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(drag, snap) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className="card-wrap"
                              >
                                <article
                                  className={[
                                    "task-card",
                                    snap.isDragging && !snap.isDropAnimating ? "dragging" : "",
                                    landedId === task.id && !snap.isDragging ? "landed" : "",
                                  ].join(" ")}
                                  onAnimationEnd={() =>
                                    landedId === task.id && setLandedId(null)
                                  }
                                >
                                  <span className={`priority priority-${task.priority}`}>
                                    {p.emoji} {p.label}
                                  </span>
                                  <h3 className="task-title">{task.title}</h3>
                                  {task.note && <p className="task-note">{task.note}</p>}
                                </article>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="empty-col">اسحبي مهمة هنا</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </section>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
