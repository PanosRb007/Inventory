import React, { useState, useRef, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import listPlugin from '@fullcalendar/list';
import elLocale from '@fullcalendar/core/locales/el';
import ReactDOM from "react-dom";



import "./CalendarComponent.css";

const CalendarComponent = ({ apiBaseUrl }) => {
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, eventId: null });
  const calendarRef = useRef(null);
  const contextMenuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const draggableInitialized = useRef(false);
  const [copiedEvent, setCopiedEvent] = useState(null);


  const categories = [
    { name: "Αυτοψία", color: "#FF6B6B" },           // κόκκινο
    { name: "Άφιξη", color: "#FF4B6C" },           // κόκκινο
    { name: "Προμήθεια", color: "#FFD93D" },         // κίτρινο
    { name: "Μακέτα", color: "#6BCB77" },            // πράσινο
    { name: "Δημιουργικό", color: "#4D96FF" },       // μπλε
    { name: "Φανοποιία-Βαφή", color: "#C34A36" },    // σκούρο κόκκινο
    { name: "Βαφή", color: "#3A86FF" },              // έντονο μπλε
    { name: "Εφαρμογή", color: "#8338EC" },          // μοβ
    { name: "Κατασκευή", color: "#FF9F1C" },         // πορτοκαλί
    { name: "Μουσαμάς", color: "#00BBF9" },          // γαλάζιο
    { name: "RV", color: "#B5179E" },                // φούξια
    { name: "Ενδοδιακίνηση", color: "#06D6A0" },     // τιρκουάζ
    { name: "Ολοκλήρωση/Τοποθέτηση", color: "#2EC4B6" }, // πράσινο-μπλε
    { name: "Εξωτερικός Συνεργάτης", color: "#8D99AE" }, // γκρι μπλε
    { name: "Αγίας Άννης", color: "#EF476F" },       // ροζ κόκκινο
    { name: "Θεσ/κη", color: "#FFD166" }            // χρυσαφί
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target)
      ) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
  
    if (contextMenu.visible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu.visible]);
  

  const handleEventReceive = async (info) => {
    const eventDataStr = info.draggedEl?.getAttribute("data-event");
    if (!eventDataStr) return info.revert();
    const eventData = JSON.parse(eventDataStr);
    const newEvent = {
      prid: eventData.prid,
      title: eventData.title,
      start: info.event.startStr,
      color: eventData.color || "#ccc",
      categories: [],
    };

    try {
      const response = await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI`, {
        method: "POST",
        body: JSON.stringify(newEvent),
      });
      info.event.setProp("id", response.id);
      await fetchData();
      info.event.remove();
    } catch (error) {
      console.error("❌ Error saving event:", error.message);
      info.revert();
    }
  };

  const handleEventDrop = async (info) => {
    if (!info.event.id) return console.warn("No event ID on drop");
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

  const openProjectOutflowTable = useCallback((projectId) => {
    window.open(`/ProjectOutflows?projectId=${projectId}`, '_blank');
  }, []);

  const handleEventRightClick = (event, e) => {
    e.preventDefault();
  
    const menuWidth = 200;
    const menuHeight = 220;
  
    // ✅ Απόλυτες συντεταγμένες ακόμα και με scroll
    let newX = e.clientX + window.scrollX;
    let newY = e.clientY + window.scrollY;
  
    if (newX + menuWidth > window.innerWidth + window.scrollX) {
      newX = window.innerWidth + window.scrollX - menuWidth - 10;
    }
    if (newY + menuHeight > window.innerHeight + window.scrollY) {
      newY = window.innerHeight + window.scrollY - menuHeight - 10;
    }
    console.log("Pointer:", {
      clientX: e.clientX,
      pageX: e.pageX,
      scrollX: window.scrollX,
      finalX: e.clientX + window.scrollX
    });
    
  
    setContextMenu({
      visible: true,
      x: newX,
      y: newY,
      eventId: event.id,
      dateStr: event.startStr,
    });
  };

  
  const handleCategorySelection = async (category) => {
    const eventIndex = events.findIndex((e) => String(e.id) === String(contextMenu.eventId));
    if (eventIndex === -1) return;

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
                <span
                  style={{ textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => openProjectOutflowTable(project.prid)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {project.name}
                </span>
              </div>
            );
          })}
      </div>

      <div className="calendar-container">
        <FullCalendar
          locale={elLocale}
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay, listWeek'
          }}
          editable={true}
          droppable={true}
          navLinks={true}
          nowIndicator={true}
          navLinkDayClick={(date) => {
            const calendarApi = calendarRef.current?.getApi();
            if (calendarApi) {
              calendarApi.changeView('timeGridDay', date);
            }
          }}
          events={events}
          eventReceive={handleEventReceive}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={(eventInfo) => {
            const prid = eventInfo.event.extendedProps.prid;

            return (
              <div
                className="fc-daygrid-event"
                title={eventInfo.event.title}
                style={{
                  backgroundColor: eventInfo.event.backgroundColor || "#ccc",
                  padding: "5px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
                onContextMenu={(e) => handleEventRightClick(eventInfo.event, e)} // ✅ Δεξί κλικ
              >
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => openProjectOutflowTable(prid)} // ✅ Κλικ για άνοιγμα Project
                  onMouseDown={(e) => e.stopPropagation()} // για drag
                >
                  {eventInfo.event.title}
                </span>
                <br />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                  {eventInfo.event.extendedProps.categories?.length > 0 ? (
                    eventInfo.event.extendedProps.categories.map((cat, idx) => {
                      const category = categories.find(c => c.name === cat);
                      return (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: category?.color || "#999",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            lineHeight: "1",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cat}
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ fontSize: "10px", color: "#666" }}>No Category</span>
                  )}
                </div>

              </div>
            );
          }}
        />
        {contextMenu.visible &&
  ReactDOM.createPortal(
    <ul
      className="context-menu"
      ref={contextMenuRef}
      style={{
        top: `${contextMenu.y}px`,
        left: `${contextMenu.x}px`,
        position: "absolute", // Πολύ σημαντικό!
      }}
    >
      <li
        onClick={() => {
          const event = events.find(e => String(e.id) === String(contextMenu.eventId));
          setCopiedEvent(event);
          setContextMenu({ ...contextMenu, visible: false });
        }}
      >
        📋 Copy
      </li>

      <li
        onClick={handleDeleteEvent}
        style={{ color: "#dc3545" }}
      >
        🗑 Delete
      </li>

      <li className="submenu">
        🏷 Categories ▶
        <ul className="submenu-list">
          {categories.map((category) => (
            <li
            key={category.name}
            onClick={() => handleCategorySelection(category)}
            style={{ backgroundColor: category.color }}
            data-color={category.color}
            className="category-item"
          >
            {category.name}
          </li>
          
          
          ))}
        </ul>
      </li>

      {copiedEvent && (
        <li
          onClick={async () => {
            const dateStr = contextMenu.dateStr;
            if (!dateStr) return;

            const newEvent = {
              prid: copiedEvent.prid,
              title: copiedEvent.title,
              start: dateStr,
              color: copiedEvent.color || "#ccc",
              categories: copiedEvent.categories || [],
            };

            try {
              await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI`, {
                method: "POST",
                body: JSON.stringify(newEvent),
              });
              await fetchData();
            } catch (err) {
              console.error("❌ Error pasting:", err.message);
            }

            setContextMenu({ ...contextMenu, visible: false });
          }}
        >
          📌 Paste here
        </li>
      )}
    </ul>,
    document.body // 👈 Εδώ γίνεται το portal
  )}


      </div>
    </div>
  );
};

export default CalendarComponent;