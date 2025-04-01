import React, { useState, useRef, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";

import "./CalendarComponent.css";

const CalendarComponent = ({ apiBaseUrl }) => {
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, eventId: null });
  const calendarRef = useRef(null);
  const contextMenuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { name: "Development", color: "#ff5733" },
    { name: "Marketing", color: "#33a1ff" },
    { name: "Sales", color: "#33ff57" }
  ];

  const fetchAPI = useCallback(async (url, options = {}) => {
    const authToken = sessionStorage.getItem("authToken");
    if (!authToken) throw new Error("No auth token");

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      const errorText = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      throw new Error(errorText?.message || errorText || `Error fetching ${url}`);
    }

    return contentType?.includes("application/json") ? await response.json() : {};
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const projectResponse = await fetchAPI(`${apiBaseUrl}/projectsAPI`);
      const eventsResponse = await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI`);
      setProjects(projectResponse);
      setEvents(eventsResponse);
    } catch (error) {
      console.error("Error fetching data:", error.message);
    }
  }, [apiBaseUrl, fetchAPI]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (draggableInitialized.current) return;

    const containerEl = document.getElementById("external-events");
    if (containerEl) {
      new Draggable(containerEl, {
        itemSelector: ".fc-event",
        eventData: (el) => {
          const data = el.getAttribute("data-event");
          return data ? JSON.parse(data) : {};
        },
      });

      draggableInitialized.current = true;
    }
  }, []);

  const draggableInitialized = useRef(false);

  const handleEventReceive = async (info) => {
    const eventDataStr = info.draggedEl.getAttribute("data-event");
    if (!eventDataStr) return;

    const eventData = JSON.parse(eventDataStr);

    const newEvent = {
      prid: eventData.prid,
      title: eventData.title,
      start: info.event.startStr,
      color: eventData.color || "#ccc",
      categories: [],
    };

    try {
      await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI`, {
        method: "POST",
        body: JSON.stringify(newEvent),
      });

      await fetchData();
      info.event.remove();
    } catch (error) {
      console.error("❌ Error saving event:", error.message);
    }
  };

  const handleDeleteEvent = async () => {
    const eventId = contextMenu.eventId;
    setContextMenu({ ...contextMenu, visible: false });

    try {
      await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI/${eventId}`, {
        method: "DELETE",
      });

      await fetchData();
    } catch (error) {
      console.error("❌ Error deleting event:", error.message);
    }
  };

  const handleEventDrop = async (info) => {
    const updatedEvent = {
      id: info.event.id,
      start: info.event.startStr,
      end: info.event.endStr || null,
    };

    try {
      await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI/${updatedEvent.id}/date`, {
        method: "PUT",
        body: JSON.stringify(updatedEvent),
      });
      await fetchData();
    } catch (error) {
      console.error("Error updating event date:", error.message);
    }
  };

  const handleEventResize = async (info) => {
    const updatedEvent = {
      id: info.event.id,
      end: info.event.endStr || null,
    };

    try {
      await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI/${updatedEvent.id}/duration`, {
        method: "PUT",
        body: JSON.stringify(updatedEvent),
      });
      await fetchData();
    } catch (error) {
      console.error("Error updating event duration:", error.message);
    }
  };

  const handleEventRightClick = (event, e) => {
    e.preventDefault();
    const offset = 200;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const menuWidth = 180;
    const menuHeight = 200;

    let newX = e.clientX - offset;
    let newY = e.clientY - offset;

    if (newX < 0) newX = 10;
    if (newY < 0) newY = 10;
    if (newX + menuWidth > screenWidth) newX = screenWidth - menuWidth - 10;
    if (newY + menuHeight > screenHeight) newY = screenHeight - menuHeight - 10;

    setContextMenu({ visible: true, x: newX, y: newY, eventId: event.id });
  };

  const handleCategorySelection = async (category) => {
    const eventIndex = events.findIndex((e) => String(e.id) === String(contextMenu.eventId));
    if (eventIndex === -1) {
      console.error("❌ Event not found in state.");
      return;
    }

    const originalEvent = events[eventIndex];
    const currentCategories = originalEvent.categories || [];
    const newCategories = currentCategories.includes(category.name)
      ? currentCategories.filter((c) => c !== category.name)
      : [...currentCategories, category.name];

    const updatedEvent = {
      ...originalEvent,
      categories: newCategories,
      color: category.color,
    };

    const updatedEvents = [...events];
    updatedEvents[eventIndex] = updatedEvent;
    setEvents(updatedEvents);
    setContextMenu({ ...contextMenu, visible: false });

    try {
      await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI/${originalEvent.id}/categories`, {
        method: "PUT",
        body: JSON.stringify({ categories: newCategories }),
      });
    } catch (error) {
      console.error("❌ Error updating event categories:", error.message);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

  return (
    <div className="calendar-wrapper">
      <div id="external-events" className="projects-sidebar">
        <input
          className="searchbar"
          type="text"
          placeholder="🔍 Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {projects
          .filter((p) => Array.isArray(p.status?.data) && p.status.data[0] === 0)
          .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .sort((a, b) => Number(b.prid) - Number(a.prid))
          .map((project) => {
            const eventData = {
              prid: project.prid,
              title: project.name,
              color: "#007bff",
            };

            return (
              <div
                key={project.prid}
                className="draggable-project fc-event"
                data-event={JSON.stringify(eventData)}
              >
                {project.name}
              </div>
            );
          })}
      </div>

      <div
        className="calendar-container"
        onClick={() => setContextMenu({ ...contextMenu, visible: false })}
      >
        <FullCalendar
          ref={calendarRef}
          key={JSON.stringify(events.map((e) => e.id))}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          editable={true}
          droppable={true}
          eventReceive={handleEventReceive}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          events={events}
          eventContent={(eventInfo) => (
            <div
              className="fc-daygrid-event"
              style={{
                backgroundColor: eventInfo.event.backgroundColor || "#ccc",
                padding: "5px",
                borderRadius: "5px",
                cursor: "pointer",
                overflow: "hidden",         // 👈 πολύ σημαντικό
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
              onContextMenu={(e) => handleEventRightClick(eventInfo.event, e)}
            >
              {eventInfo.event.title}
              <br />
              <small>
                {eventInfo.event.extendedProps.categories?.join(", ") || "No Category"}
              </small>
            </div>
          )}
          
        />

        {contextMenu.visible && (
          <ul
            className="context-menu"
            ref={contextMenuRef}
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {categories.map((category) => (
              <li
                key={category.name}
                onClick={() => handleCategorySelection(category)}
                style={{
                  background: category.color,
                  color: "#fff",
                  padding: "5px",
                  cursor: "pointer",
                }}
              >
                {category.name}
              </li>
            ))}
            <li
              onClick={handleDeleteEvent}
              style={{
                background: "#dc3545",
                color: "#fff",
                padding: "5px",
                cursor: "pointer",
                borderTop: "1px solid #eee",
              }}
            >
              🗑 Delete
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default CalendarComponent;
