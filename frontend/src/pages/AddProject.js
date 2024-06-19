import React, { useState } from 'react';
import './PurchaseFunc.css';

const AddProject = ({ handleAddProject }) => {
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    prmatcost: null,
    prlabcost: null,
    sale: null,
    realmatcost: null,
    reallabcost: null,
    totalcost: null,
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
      m2: null,
      prmatcost: null,
      prlabcost: null,
      sale: null,
    
    });
  };

  return (
    <div className="container">
      <h2 className="heading">Add Project</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className='form-row'>
          <div className='form-group'>
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
          <div className='form-group'>
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
          <div className='form-group'>
            <label>
              m2:
              <input
                type="number"
                name="m2"
                value={newProject.m2}
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
                value={newProject.prmatcost}
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
                value={newProject.prlabcost}
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
                value={newProject.sale}
                onChange={handleInputChange}
              />
            </label>
          </div>
        </div>
        <div>
          <button className='add_btn' type="submit">Add project</button>
        </div>
      </form>
    </div>
  );
};

export default AddProject;
