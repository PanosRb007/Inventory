import React, { useState } from 'react';
import './PurchaseFunc.css';

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
    <div className="container">
      <h2 className="heading">Add Project</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div>
        <label>
          Project Name:
          <input
            type="text"
            name="name"
            value={newProject.name}
            onChange={handleInputChange}
          />
        </label>
        </div>
        <div>
        <label>
          Description:
          <input
            type="text"
            name="description"
            value={newProject.description}
            onChange={handleInputChange}
          />
        </label>
        </div>
        <div>
        <label>
          Projected Material Cost:
          <input
            type="number"
            name="prmatcost"
            value={newProject.prmatcost}
            onChange={handleInputChange}
          />
        </label>
        </div>
        <div>
        <label>
          Projected Labor Cost:
          <input
            type="number"
            name="prlabcost"
            value={newProject.prlabcost}
            onChange={handleInputChange}
          />
        </label>
        </div>
        <div>
        <label>
          Sale:
          <input
            type="number"
            name="sale"
            value={newProject.sale}
            onChange={handleInputChange}
          />
        </label>
        </div>
        <div>
        <label>
          Real Material Cost:
          <input
            type="number"
            name="realmatcost"
            value={newProject.realmatcost}
            onChange={handleInputChange}
          />
        </label>
        </div>
        <div>
        <label>
          Real Labor Cost:
          <input
            type="number"
            name="reallabcost"
            value={newProject.reallabcost}
            onChange={handleInputChange}
          />
        </label>
        </div>
        <div>
        <label>
          Totalcost:
          <input
            type="number"
            name="totalcost"
            value={newProject.totalcost}
            onChange={handleInputChange}
          />
        </label>
        </div>
        <div>
        <button className='add_btn' type="submit">Add project</button>
        </div>
      </form>
    </div>
  );
};

export default AddProject;
