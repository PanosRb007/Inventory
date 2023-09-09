import React, { useState } from 'react';

const AddProject = ({handleAddProject}) => {
  const [newProject, setNewProject] = useState({
    name: '',
    description: '', 
    prmatcost: '', 
    prlabcost: '',
    sale: '',
    realmatcost: '', 
    reallabcost: '', 
    totalcost: '',
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewProject((prevProject) => ({
      ...prevProject,
      [name]: value,
    }));
  };

 

  const handleSubmit = (event) => {
    event.preventDefault();
    handleAddProject(newProject);
    resetForm();
  };

  const resetForm = () => {
    setNewProject({
        name: '',
        description: '', 
        prmatcost: '', 
        prlabcost: '',
        sale: '',
        realmatcost: '', 
        reallabcost: '', 
        totalcost: '',
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
            value={newProject.name}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Description:
          <input
            type="text"
            name="description"
            value={newProject.description}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Projected Material Cost:
          <input
            type="number"
            name="prmatcost"
            value={newProject.prmatcost}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Projected Labor Cost:
          <input
            type="number"
            name="prlabcost"
            value={newProject.prlabcost}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Sale:
          <input
            type="number"
            name="sale"
            value={newProject.sale}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Real Material Cost:
          <input
            type="number"
            name="realmatcost"
            value={newProject.realmatcost}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Real Labor Cost:
          <input
            type="number"
            name="reallabcost"
            value={newProject.reallabcost}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Totalcost:
          <input
            type="number"
            name="totalcost"
            value={newProject.totalcost}
            onChange={handleInputChange}
          />
        </label>
        <button type="submit">Add project</button>
      </form>
    </div>
  );
};

export default AddProject;
