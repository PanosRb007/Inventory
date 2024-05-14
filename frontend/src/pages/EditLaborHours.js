import React, { useState } from 'react';
import Select from 'react-select';

const EditLaborHours = ({ labhour, handleUpdate, handleCancel, projects }) => {
  const [editedLabHour, setEditedLabHour] = useState({ ...labhour });

  const handleInputChange = (name, value) => {
    setEditedLabHour((prevLabHour) => ({
      ...prevLabHour,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleUpdate({
      ...editedLabHour,
      date: new Date(editedLabHour.date).toISOString().split('T')[0] // Ensure date is saved without time
    });
  };

  return (
    <div className="container">
      <h2 className="heading">Edit Lab</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Project:</label>
            <Select
              name="projectid"
              value={projects.find(project => project.prid === editedLabHour.projectid) ? { value: editedLabHour.projectid, label: projects.find(project => project.prid === editedLabHour.projectid).name } : null}
              options={projects.map(project => ({
                value: project.prid,
                label: project.name,
              }))}
              onChange={selectedOption => handleInputChange('projectid', selectedOption.value)}
              placeholder="Select a Project"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="start">Start Time (24h format)</label>
            <input
              id="start"
              type="time"
              name="start"
              value={editedLabHour.start}
              onChange={e => handleInputChange(e.target.name, e.target.value)}
              placeholder="HH:MM" // Hinting at the expected format
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="end">End Time (24h format)</label>
            <input
              id="end"
              type="time"
              name="end"
              value={editedLabHour.end}
              onChange={e => handleInputChange(e.target.name, e.target.value)}
              placeholder="HH:MM" // Hinting at the expected format
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              name="date"
              value={editedLabHour.date.split('T')[0]}  // Ensure date input displays correctly without time
              onChange={e => handleInputChange(e.target.name, e.target.value)}
              className="form-control"
              required
            />
          </div>
          <button type="submit">Save</button>
          <button type="button" className="add_btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditLaborHours;
