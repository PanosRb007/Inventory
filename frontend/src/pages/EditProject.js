import React, { useState } from 'react';

const EditProject = ({ project, handleUpdate }) => {
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
      <div className="add-project-container">
        <h2 className="add-project-heading">Add Project</h2>
        <form className="add-project-form" onSubmit={handleSubmit}>
          <label>
            Project Name:
            <input
              type="text"
              name="name"
              value={editedProject.name}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Description:
            <input
              type="text"
              name="description"
              value={editedProject.description}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Projected Material Cost:
            <input
              type="number"
              name="prmatcost"
              value={editedProject.prmatcost}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Projected Labor Cost:
            <input
              type="number"
              name="prlabcost"
              value={editedProject.prlabcost}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Sale:
            <input
              type="number"
              name="sale"
              value={editedProject.sale}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Real Material Cost:
            <input
              type="number"
              name="realmatcost"
              value={editedProject.realmatcost}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Real Labor Cost:
            <input
              type="number"
              name="reallabcost"
              value={editedProject.reallabcost}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Totalcost:
            <input
              type="number"
              name="totalcost"
              value={editedProject.totalcost}
              onChange={handleInputChange}
            />
          </label>
          <button type="submit">Edit project</button>
        </form>
      </div>
    );
  };

export default EditProject;
