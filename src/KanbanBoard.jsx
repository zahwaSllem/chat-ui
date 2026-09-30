import { useCallback, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useTranslation } from "./hooks/useTranslation";
import "./kanban.css";

const COLUMNS = ["todo", "progress", "done"];

const PRIORITY_EMOJI = { urgent: "🔴", important: "🟡", normal: "🟢" };

const INITIAL_TASKS = {
  todo: [
    { id: "t1", priority: "urgent" },
    { id: "t2", priority: "important" },
    { id: "t3", priority: "normal" },
  ],
  progress: [
    { id: "t4", priority: "important" },
    { id: "t5", priority: "normal" },
  ],
  done: [
    { id: "t6", priority: "urgent" },
    { id: "t7", priority: "normal" },
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
  const { t, dir } = useTranslation();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [landedId, setLandedId] = useState(null);

  const onDragEnd = useCallback(({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    setTasks((prev) => move(prev, source, destination));
    setLandedId(draggableId);
  }, []);

  return (
    <div dir={dir} className="kanban">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map((colId, i) => {
            const items = tasks[colId];
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
                                    {PRIORITY_EMOJI[task.priority]} {t(`kanban.priority.${task.priority}`)}
                                  </span>
                                  <h3 className="task-title">{t(`kanban.tasks.${task.id}.title`)}
                                  </h3>
                                  {t(`kanban.tasks.${task.id}.note`) && (
                                    <p className="task-note">{t(`kanban.tasks.${task.id}.note`)}</p>
                                  )}
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
