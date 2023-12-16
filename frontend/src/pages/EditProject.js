import React, { useState } from 'react';

const EditProject = ({ project, handleUpdate, handleCancel }) => {
  const [editedProject, setEditedProject] = useState({ ...project });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedProject((prevProject) => ({
      ...prevProject,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleUpdate(editedProject);
    resetForm();
  };

  const resetForm = () => {
    setEditedProject({
      // Reset the fields as needed for the project
      // Example:
      name: '',
      description: '',
      prmatcost: '',
      prlabcost: '',
      sale: '',
      realmatcost: '',
      reallabcost: '',
      totalcost: '',
      // Add other fields here
    });
  };

  return (
    <div className="container">
      <h2 className="heading">Edit Project</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className='form-row'>
          <div className='form-group'>
            <label>
              Project Name:
              <input
                type="text"
                name="name"
                value={editedProject.name}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className='form-group'>
            <label>
              Description:
              <input
                type="text"
                name="description"
                value={editedProject.description}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className='form-group'>
            <label>
              Projected Material Cost:
              <input
                type="number"
                name="prmatcost"
                value={editedProject.prmatcost}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className='form-group'>
            <label>
              Projected Labor Cost:
              <input
                type="number"
                name="prlabcost"
                value={editedProject.prlabcost}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className='form-group'>
            <label>
              Sale:
              <input
                type="number"
                name="sale"
                value={editedProject.sale}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className='form-group'>
            <label>
              Real Material Cost:
              <input
                type="number"
                name="realmatcost"
                value={editedProject.realmatcost}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className='form-group'>
            <label>
              Real Labor Cost:
              <input
                type="number"
                name="reallabcost"
                value={editedProject.reallabcost}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className='form-group'>
            <label>
              Totalcost:
              <input
                type="number"
                name="totalcost"
                value={editedProject.totalcost}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <button type="submit">Edit project</button>
          <button type="button" className="add_btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>

    </div>
  );
};

export default EditProject;
