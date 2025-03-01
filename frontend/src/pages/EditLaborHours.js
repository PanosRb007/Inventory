import React, { useState, useEffect } from 'react';
import Select from 'react-select';

const EditLaborHours = ({ labhour, handleUpdate, handleCancel, projects }) => {
  const [editedLabHour, setEditedLabHour] = useState({ ...labhour });
  const [availableSubProjects, setAvailableSubProjects] = useState([]);

  useEffect(() => {
      if (editedLabHour.projectid) {
        const selectedProject = projects.find(project => project.prid === editedLabHour.projectid);
        if (selectedProject && selectedProject.quotedItems) {
          console.log('Setting availableSubProjects:', selectedProject.quotedItems);
          setAvailableSubProjects(selectedProject.quotedItems); // Ensure it sets the correct array
        } else {
          setAvailableSubProjects([]);
        }
      } else {
        setAvailableSubProjects([]);
      }
    }, [editedLabHour.projectid, projects]);


  const handleInputChange = (name, value) => {
    setEditedLabHour((prevLabHour) => ({
      ...prevLabHour,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Submitting updated lab hour:', editedLabHour); // Log data for debugging
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
          <div className='form-group'>
            <label>Sub-Project:</label>
            <Select
              name="quotedItemid"
              value={
                availableSubProjects.find(item => item.id === editedLabHour.quotedItemid)
                  ? { value: editedLabHour.quotedItemid, label: availableSubProjects.find(item => item.id === editedLabHour.quotedItemid).product_name }
                  : null
              }
              options={availableSubProjects.map((item) => ({
                value: item.id,
                label: item.product_name,
                title: item.product_description
              }))}
              getOptionLabel={(item) => (
                <span title={item.title}>{item.label}</span> // Το tooltip εμφανίζεται όταν ο χρήστης περνάει το ποντίκι
              )}
              onChange={(selectedOption) => handleInputChange('quotedItemid', selectedOption.value)}
              placeholder="Select a Sub-Project"
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
          <div className='form-group'>
            <label>
              Comments:
              <textarea
                name="comments"
                value={editedLabHour.comments}
                onChange={e => handleInputChange('comments', e.target.value)}
              />
            </label>
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
