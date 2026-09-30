import { useCallback, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useTranslation } from "./hooks/useTranslation";
import "./kanban.css";

const COLUMNS = ["todo", "progress", "done"];

const PRIORITY_EMOJI = { urgent: "🔴", important: "🟡", normal: "🟢" };

const TASKS_KEY = "kanban-tasks";

// Chat saves priorities as high/medium/low; the card styles use urgent/important/normal
const PRIORITY_MAP = { high: "urgent", medium: "important", low: "normal" };

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // storage full or unavailable
  }
}

const inColumn = (tasks, colId) => tasks.filter((task) => task.status === colId);

function move(tasks, source, destination) {
  const cols = Object.fromEntries(COLUMNS.map((c) => [c, inColumn(tasks, c)]));
  const [item] = cols[source.droppableId].splice(source.index, 1);
  cols[destination.droppableId].splice(destination.index, 0, {
    ...item,
    status: destination.droppableId,
  });
  return COLUMNS.flatMap((c) => cols[c]);
}

export default function KanbanBoard() {
  const { t, dir } = useTranslation();
  const [tasks, setTasks] = useState(loadTasks);
  const [landedId, setLandedId] = useState(null);

  const onDragEnd = useCallback(
    ({ source, destination, draggableId }) => {
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;
      const next = move(tasks, source, destination);
      setTasks(next);
      saveTasks(next);
      setLandedId(draggableId);
    },
    [tasks]
  );

  return (
    <div dir={dir} className="kanban">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map((colId, i) => {
            const items = inColumn(tasks, colId);
            return (
              <section
                key={colId}
                className={`kanban-col col-${colId}`}
                style={{ "--i": i }}
              >
                <header className="col-header">
                  <h2 className="col-title">{t(`kanban.columns.${colId}`)}</h2>
                  <span key={items.length} className="count-badge">
                    {items.length}
                  </span>
                </header>

                <Droppable droppableId={colId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`col-body ${snapshot.isDraggingOver ? "over" : ""} ${
                        items.length === 0 ? "is-empty" : ""
                      }`}
                    >
                      {items.map((task, index) => {
                        const priority = PRIORITY_MAP[task.priority] ?? "normal";
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
                                  <span className={`priority priority-${priority}`}>
                                    {PRIORITY_EMOJI[priority]} {t(`kanban.priority.${priority}`)}
                                  </span>
                                  <h3 className="task-title" dir="auto">
                                    {task.text}
                                  </h3>
                                </article>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="empty-col">{t("kanban.emptyColumn")}</div>
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
