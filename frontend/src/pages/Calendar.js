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

        return contentType?.includes("application/json")
            ? await response.json()
            : {};
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

    const draggableInitialized = useRef(false);

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


    const handleEventReceive = async (info) => {
        const eventDataStr = info.draggedEl.getAttribute("data-event");
        if (!eventDataStr) return;

        const eventData = JSON.parse(eventDataStr);

        const newEvent = {
            prid: eventData.id,
            title: eventData.title,
            start: info.event.startStr, // 👈 LOCAL FORMAT
            color: eventData.color || "#ccc",
            categories: [],
        };


        // 🔍 Ελέγχει αν ήδη υπάρχει event με το ίδιο `prid` και `start`
        const alreadyExists = events.some(
            (e) => e.prid === newEvent.prid && e.start === newEvent.start
        );

        if (alreadyExists) {
            console.warn("🚫 Event already exists. Skipping...");
            info.event.remove(); // Clean up
            return;
        }

        try {
            await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI`, {
                method: "POST",
                body: JSON.stringify(newEvent),
            });

            info.event.remove();

            // 🧼 Αντί για setEvents, φρεσκάρουμε καθαρά
            fetchData();

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

            await fetchData(); // 🔁 Φρεσκάρεις τα events μετά τη διαγραφή
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

        setEvents((prev) =>
            prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
        );

        try {
            await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI/${updatedEvent.id}/date`, {
                method: "PUT",
                body: JSON.stringify(updatedEvent),
            });
        } catch (error) {
            console.error("Error updating event date:", error.message);
        }
    };

    const handleEventResize = async (info) => {
        const updatedEvent = {
            id: info.event.id,
            end: info.event.endStr || null,
        };

        setEvents((prev) =>
            prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
        );

        try {
            await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI/${updatedEvent.id}/duration`, {
                method: "PUT",
                body: JSON.stringify(updatedEvent),
            });
        } catch (error) {
            console.error("Error updating event duration:", error.message);
        }
    };

    const handleEventRightClick = (event, e) => {
        e.preventDefault();
        let newX = Math.max(e.clientX - 180, 0);
        setContextMenu({ visible: true, x: newX, y: e.clientY, eventId: event.id });
    };

    const handleCategorySelection = async (category) => {
        const updatedEvents = events.map((event) => {
            if (event.id === contextMenu.eventId) {
                const newCategories = event.categories?.includes(category.name)
                    ? event.categories.filter((c) => c !== category.name)
                    : [...(event.categories || []), category.name];

                return { ...event, categories: newCategories, color: category.color };
            }
            return event;
        });

        setEvents(updatedEvents);
        setContextMenu({ ...contextMenu, visible: false });

        try {
            await fetchAPI(`${apiBaseUrl}/calendar_eventsAPI/${contextMenu.eventId}/categories`, {
                method: "PUT",
                body: JSON.stringify({
                    categories: updatedEvents.find(e => e.id === contextMenu.eventId).categories,
                }),
            });
        } catch (error) {
            console.error("Error updating event categories:", error.message);
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
            {/* 🔹 Sidebar με Projects */}
            <div id="external-events" className="projects-sidebar">
                {projects
                    .filter((p) => Array.isArray(p.status?.data) && p.status.data[0] === 0)
                    .sort((a, b) => Number(b.prid) - Number(a.prid)) // 👈 μετατροπή σε αριθμό
                    .map((project) => {
                        const eventData = {
                            id: project.prid,
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

            {/* 🔹 FullCalendar */}
            <div
                className="calendar-container"
                onClick={() => setContextMenu({ ...contextMenu, visible: false })}
            >
                <FullCalendar
                    ref={calendarRef}
                    key={JSON.stringify(events.map(e => e.id))}
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
                            style={{
                                backgroundColor: eventInfo.event.extendedProps.color,
                                padding: "5px",
                                borderRadius: "5px",
                                cursor: "pointer",
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

                {/* Context Menu */}
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
                                borderTop: "1px solid #eee"
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
