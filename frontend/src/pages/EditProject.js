import React, { useState } from 'react';

const EditProject = ({ project, handleUpdate, handleCancel, userRole }) => {
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
      name: '',
      description: '',
      m2: '',
      prmatcost: '',
      prlabcost: '',
      sale: '',
      // Add other fields here
    });
  };

  return (
    <div className="container">
      <h2 className="heading">Edit Project</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
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
          <div className="form-group">
            <label>
              Description:
              <textarea
                type="text"
                name="description"
                value={editedProject.description}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className="form-group">
  <label>
    m2:
    <input
      type="number"
      name="m2"
      value={editedProject.m2}
      onChange={handleInputChange}
      step="0.01"
    />
  </label>
</div>

          {userRole !== 'Senior' && (
            <>
              <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group">
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
            </>
          )}
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
