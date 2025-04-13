import React, { useState, useRef, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import elLocale from "@fullcalendar/core/locales/el";
import ReactDOM from "react-dom";

import "./CalendarComponent.css";

const CalendarComponent = ({ apiBaseUrl }) => {
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobLocations, setJobLocations] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, eventId: null });
  const calendarRef = useRef(null);
  const contextMenuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const draggableInitialized = useRef(false);
  const [copiedEvent, setCopiedEvent] = useState(null);

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
      const errorText = contentType?.includes("application/json") ? await response.json() : await response.text();
      throw new Error(errorText?.message || errorText || `Error fetching ${url}`);
    }

    return contentType?.includes("application/json") ? await response.json() : {};
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [
        projectResponse,
        eventsResponse,
        employeesResponse,
        locationsResponse,
        categoriesResponse,
      ] = await Promise.all([
        fetchAPI(`${apiBaseUrl}/projectsAPI`),
        fetchAPI(`${apiBaseUrl}/calendar_eventsAPI`),
        fetchAPI(`${apiBaseUrl}/employeesAPI`),
        fetchAPI(`${apiBaseUrl}/job_locationsAPI`),
        fetchAPI(`${apiBaseUrl}/job_categoriesAPI`),
      ]);

      setProjects(projectResponse);

      // 👇 Εδώ γίνεται η προσθήκη
      const normalizedEvents = eventsResponse.map(event => {
        if (!event.end && event.start) {
          const startDate = new Date(event.start);
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // default 1 hour
          return { ...event, end: endDate.toISOString() };
        }
        return event;
      });

      setEvents(normalizedEvents);

      setEmployees(employeesResponse);
      setJobLocations(locationsResponse);
      setJobCategories(categoriesResponse);
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
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
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
    window.open(`/ProjectOutflows?projectId=${projectId}`, "_blank");
  }, []);

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

  const handleEventRightClick = (event, e) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 200;
    const menuHeight = 220;

    let newX = e.clientX + window.scrollX;
    let newY = e.clientY + window.scrollY;

    if (newX + menuWidth > window.innerWidth + window.scrollX) {
      newX = window.innerWidth + window.scrollX - menuWidth - 10;
    }
    if (newY + menuHeight > window.innerHeight + window.scrollY) {
      newY = window.innerHeight + window.scrollY - menuHeight - 10;
    }

    setContextMenu({
      visible: true,
      x: newX,
      y: newY,
      eventId: event.id,
      dateStr: event.startStr,
    });
  };

  const handleCalendarRightClick = (e) => {
    e.preventDefault();

    const menuWidth = 200;
    const menuHeight = 180;

    let newX = e.clientX + window.scrollX;
    let newY = e.clientY + window.scrollY;

    if (newX + menuWidth > window.innerWidth + window.scrollX) {
      newX = window.innerWidth + window.scrollX - menuWidth - 10;
    }
    if (newY + menuHeight > window.innerHeight + window.scrollY) {
      newY = window.innerHeight + window.scrollY - menuHeight - 10;
    }

    const element = document.elementFromPoint(e.clientX, e.clientY);
    const dateAttr = element?.closest('[data-date]')?.getAttribute('data-date');

    setContextMenu({
      visible: true,
      x: newX,
      y: newY,
      eventId: null,
      dateStr: dateAttr || calendarRef.current?.getApi().getDate()?.toISOString().split("T")[0],
    });
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
                  style={{ textDecoration: "underline", cursor: "pointer" }}
                  onClick={() => openProjectOutflowTable(project.prid)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {project.name}
                </span>
              </div>
            );
          })}
      </div>

      <div className="calendar-container" onContextMenu={handleCalendarRightClick}>
        <FullCalendar
          locale={elLocale}
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          editable={true}
          eventStartEditable={true}
          eventDurationEditable={true}
          droppable={true}

          navLinks
          nowIndicator
          navLinkDayClick={(date) => {
            const calendarApi = calendarRef.current?.getApi();
            if (calendarApi) {
              calendarApi.changeView("timeGridDay", date);
            }
          }}
          events={events}
          eventAllow={(dropInfo, draggedEvent) => {
            console.log("eventAllow:", dropInfo, draggedEvent);
            return true;
          }}

          eventReceive={handleEventReceive}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={(eventInfo) => {
            const { title, backgroundColor, extendedProps } = eventInfo.event;
            const { prid, categories = [], locations = [], employees = [] } = extendedProps;
          
            return (
              <div
                className="custom-event"
                style={{ backgroundColor: backgroundColor || "#ccc" }}
                onContextMenu={(e) => handleEventRightClick(eventInfo.event, e)}
              >
                <span
                  className="event-title"
                  onClick={() => openProjectOutflowTable(prid)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => {
                    setHoveredEvent(eventInfo.event);
                    setHoverPosition({ x: e.clientX + window.scrollX + 10, y: e.clientY + window.scrollY + 10 });
                  }}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  {title}
                </span>
          
                <div className="event-details">
                  {/* Categories */}
                  <div className="event-badges">
                    {categories.length > 0 ? (
                      categories.map((cat, idx) => {
                        const category = jobCategories.find((c) => c.name === cat);
                        return (
                          <span
                            key={`cat-${cat}-${idx}`}
                            className="badge"
                            style={{ backgroundColor: category?.color || "#999" }}
                          >
                            {cat}
                          </span>
                        );
                      })
                    ) : (
                      <span className="event-empty">No Category</span>
                    )}
                  </div>
          
                  {/* Locations */}
                  <div className="event-info">
                    📍 {locations.length > 0 ? locations.join(", ") : "No Location"}
                  </div>
          
                  {/* Employees */}
                  <div className="event-info">
                    👷 {employees.length > 0
                      ? employees
                          .map((e) => (typeof e === "object" && e.name ? e.name : `ID: ${e}`))
                          .join(", ")
                      : "No Employee"}
                  </div>
                </div>
              </div>
            );
          }}
          

        />
        {hoveredEvent && (
          <div
            className="hover-tooltip"
            style={{
              top: `${hoverPosition.y}px`,
              left: `${hoverPosition.x}px`,
              position: "absolute",
              zIndex: 100000,
            }}
          >
            <h4>{hoveredEvent.title}</h4>
            <p><strong>Κατηγορίες:</strong> {hoveredEvent.extendedProps.categories?.join(", ") || "Καμία"}</p>
            <p><strong>Τοποθεσίες:</strong> {hoveredEvent.extendedProps.locations?.join(", ") || "Καμία"}</p>
            <p><strong>Εργαζόμενοι:</strong> {hoveredEvent.extendedProps.employees?.map(e =>
              typeof e === "object" && e.name ? e.name : `ID: ${e}`
            ).join(", ") || "Κανένας"}</p>
          </div>
        )}

        {contextMenu.visible && ReactDOM.createPortal(
          <ul
            className="context-menu"
            ref={contextMenuRef}
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px`, position: "absolute", zIndex: 99999 }}
          >
            {contextMenu.eventId && (
              <>
                <li className="submenu">
                  🏭 Job Locations ▶
                  <ul className="submenu-list">
                    {jobLocations.map((loc, index) => {
                      const event = events.find(e => String(e.id) === String(contextMenu.eventId));
                      if (!event) return null;
                      const locationName = loc.name;
                      const eventLocations = event.locations || [];
                      const assigned = eventLocations.includes(locationName);

                      return (
                        <li
                          key={`loc-${index}`}
                          onClick={async () => {
                            const updated = assigned
                              ? eventLocations.filter((l) => l !== locationName)
                              : [...eventLocations, locationName];

                            try {
                              await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI/${event.id}/locations`, {
                                method: "PUT",
                                body: JSON.stringify({ locations: updated }),
                              });
                              await fetchData();
                              setContextMenu((prev) => ({ ...prev, visible: false }));
                            } catch (err) {
                              console.error("❌ Error updating locations:", err.message);
                            }
                          }}
                          className="location-item"
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            background: assigned ? "#e0e0e0" : "white",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = assigned ? "#e0e0e0" : "white")}
                        >
                          {assigned ? "✅ " : ""}{locationName}
                        </li>
                      );
                    })}
                  </ul>
                </li>

                <li className="submenu">
                  👥 Assign Employees ▶
                  <ul className="submenu-list">
                    {employees
                      .filter((emp) => emp && emp.empid && emp.name && emp.active)
                      .map((emp) => {
                        const event = events.find((e) => String(e.id) === String(contextMenu.eventId));
                        if (!event) {
                          return null;
                        }

                        // 🔧 Normalize employees to IDs
                        const eventEmployees = (event.employees || []).map((e) =>
                          typeof e === "object" ? e.id : e
                        );

                        const assigned = eventEmployees.includes(emp.empid);

                        return (
                          <li
                            key={`emp-${emp.empid}`}
                            onClick={async () => {
                              const updated = assigned
                                ? eventEmployees.filter((id) => id !== emp.empid)
                                : [...eventEmployees, emp.empid];

                              const sanitized = updated.map((e) =>
                                typeof e === "object" ? e.id : e
                              );

                              console.log("[AssignEmployees] Submitting payload to API:", {
                                employees: sanitized,
                              });

                              try {
                                await fetchAPI(
                                  `${apiBaseUrl}/calendar_eventsAPI/${event.id}/employees`,
                                  {
                                    method: "PUT",
                                    body: JSON.stringify({ employees: sanitized }),
                                  }
                                );
                                await fetchData();
                                setContextMenu((prev) => ({ ...prev, visible: false }));
                              } catch (err) {
                                console.error("❌ Error updating employees:", err.message);
                              }
                            }}
                            className="employee-item"
                            style={{
                              padding: "8px 12px",
                              cursor: "pointer",
                              background: assigned ? "#e0e0e0" : "white",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = assigned ? "#e0e0e0" : "white")}
                          >
                            {assigned ? "✅ " : ""}{emp.name}
                          </li>
                        );
                      })}
                  </ul>
                </li>

                <li className="submenu">
                  🏷 Categories ▶
                  <ul className="submenu-list">
                    {jobCategories.map((category, index) => (
                      <li
                        key={`cat-${index}-${category.name}`}
                        onClick={() => handleCategorySelection(category)}
                        style={{ backgroundColor: category.color, padding: "8px 12px", cursor: "pointer", color: "#fff" }}
                        className="category-item"
                      >
                        {category.name}
                      </li>
                    ))}
                  </ul>
                </li>

                <li
                  onClick={() => {
                    const event = events.find((e) => String(e.id) === String(contextMenu.eventId));
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
              </>
            )}

            {copiedEvent && !contextMenu.eventId && (
              <li
                onClick={async () => {
                  const dateStr = contextMenu.dateStr;
                  if (!dateStr) return;

                  const newEvent = {
                    prid: copiedEvent.extendedProps?.prid || copiedEvent.prid,
                    title: copiedEvent.title,
                    start: dateStr,
                    color: copiedEvent.color || "#ccc",
                    categories: copiedEvent.extendedProps?.categories || copiedEvent.categories || [],
                  };

                  try {
                    console.log("📌 Creating new event from copiedEvent", newEvent);

                    await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI`, {
                      method: "POST",
                      body: JSON.stringify(newEvent),
                    });
                    await fetchData();
                    console.log("✅ Event created successfully");

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
          document.body
        )}
      </div>
    </div>
  );
};

export default CalendarComponent;
