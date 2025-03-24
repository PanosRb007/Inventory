import React, { useState, useRef, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./CalendarComponent.css";

const CalendarComponent = ({ apiBaseUrl, userRole }) => {
    const [events, setEvents] = useState([
        { id: "1", title: "Project A", start: "2025-03-12T10:00:00", category: "", color: "#ccc" },
        { id: "2", title: "Project B", start: "2025-03-15T14:00:00", category: "", color: "#ccc" },
    ]);

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, eventId: null });
    const [calendarView, setCalendarView] = useState("dayGridMonth");
    const calendarRef = useRef(null);
    const contextMenuRef = useRef(null);
    const [projects, setProjects] = useState([]);

    const fetchAPI = useCallback(async (url, options = {}) => {
        const authToken = sessionStorage.getItem('authToken');
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.message || `Error fetching ${url}`);
        }
        return response.json();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const projectResponse = await fetchAPI(`${apiBaseUrl}/projectsAPI`);
            setProjects(projectResponse);
        } catch (error) {
            console.error('Error fetching data:', error);
        } 
    }, [apiBaseUrl, fetchAPI]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const categories = [
        { name: "Development", color: "#ff5733" },
        { name: "Marketing", color: "#33a1ff" },
        { name: "Sales", color: "#33ff57" }
    ];

    const handleEventDrop = (info) => {
        setEvents((prevEvents) =>
            prevEvents.map((event) =>
                event.id === info.event.id
                    ? { ...event, start: info.event.startStr }
                    : event
            )
        );
    };

    const handleEventRightClick = (event, e) => {
        e.preventDefault();

        let newX = e.clientX - 180; // ✅ Μετακίνηση 100px αριστερά
        newX = Math.max(newX, 0); // ✅ Αποτροπή εξόδου εκτός αριστερής άκρης

        setContextMenu({
            visible: true,
            x: newX,
            y: e.clientY,
            eventId: event.id
        });
    };

    const handleCategorySelection = (category) => {
        setEvents((prevEvents) =>
            prevEvents.map((event) =>
                event.id === contextMenu.eventId ? { ...event, category: category.name, color: category.color } : event
            )
        );
        setContextMenu({ ...contextMenu, visible: false });
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
    }, [contextMenu, contextMenu.visible]);

    const changeView = (view) => {
        setCalendarView(view);
        if (calendarRef.current) {
            calendarRef.current.getApi().changeView(view); // ✅ Χρησιμοποιούμε το FullCalendar API για να αλλάξουμε δυναμικά τη θέαση
        }
    };

    const handleEventReceive = async (info) => {
        if (!info.draggedEl) {
            console.error("Dragged element is null");
            return;
        }
    
        const eventDataStr = info.draggedEl.getAttribute("data-event");
        if (!eventDataStr) {
            console.error("No data-event attribute found");
            return;
        }
    
        let eventData;
        try {
            eventData = JSON.parse(eventDataStr);
        } catch (error) {
            console.error("Error parsing data-event JSON", error);
            return;
        }
    
        if (!eventData.id) {
            console.error("Event data is missing an ID");
            return;
        }
    
        const newEvent = {
            id: eventData.id,
            title: eventData.title,
            start: info.dateStr,
            color: eventData.color || "#ccc",
        };
    
        // Ενημέρωση του state
        setEvents((prevEvents) => [...prevEvents, newEvent]);
    
        // Αποθήκευση στο backend
        try {
            await fetchAPI(`${apiBaseUrl}/saveEventAPI`, {
                method: "POST",
                body: JSON.stringify(newEvent),
            });
        } catch (error) {
            console.error("Failed to save event:", error);
        }
    };
    
    

    return (
        <div className='container'>
            {/* ✅ Λίστα Projects για Drag & Drop */}
            <div className="draggable-items">
                <h3>Projects</h3>
                {projects.map((project) => (
                    <div
                    key={project.prid}
                    className="draggable-project"
                    data-event={JSON.stringify({
                        id: project.prid,
                        title: project.name,
                        color: project.color || "#007bff",
                    })}
                    draggable="true"
                    onDragStart={(e) => {
                        e.dataTransfer.setData(
                            "text",
                            JSON.stringify({
                                id: project.prid,
                                title: project.name,
                                color: project.color || "#007bff",
                            })
                        );
                    }}
                >
                    {project.name}
                </div>
                ))}
            </div>

            <div className="calendar-container" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
                <div className="calendar-toolbar">
                    <button onClick={() => changeView("dayGridMonth")}>Μήνας</button>
                    <button onClick={() => changeView("timeGridWeek")}>Εβδομάδα</button>
                    <button onClick={() => changeView("timeGridDay")}>Ημέρα</button>
                </div>
                <FullCalendar
                    ref={calendarRef} // ✅ Προσθήκη ref
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={calendarView}
                    editable={true}
                    droppable={true}
                    eventReceive={handleEventReceive} // ✅ Όταν γίνεται drop ένα event

                    height="100%" // ✅ Προσθέτουμε height 100%
                    events={events}
                    eventDrop={handleEventDrop}
                    eventContent={(eventInfo) => (
                        <div
                            style={{
                                backgroundColor: eventInfo.event.extendedProps.color,
                                padding: "5px",
                                borderRadius: "5px",
                                cursor: "pointer"
                            }}
                            onContextMenu={(e) => handleEventRightClick(eventInfo.event, e)}
                        >
                            {eventInfo.event.title} <br />
                            <small>{eventInfo.event.extendedProps.category || "No Category"}</small>
                        </div>
                    )}
                    key={calendarView} // Για να ανανεώνεται σωστά το ημερολόγιο
                />
                {/* Context Menu */}
                {contextMenu.visible && (
                    <ul className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        {categories.map((category) => (
                            <li key={category.name} onClick={() => handleCategorySelection(category)} style={{ background: category.color }}>
                                {category.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CalendarComponent;
