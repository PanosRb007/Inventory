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
      prmatcost: null,
      prlabcost: null,
      sale: null,
      realmatcost: null,
      reallabcost: null,
      totalcost: null,
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
        <div className='form-row'>
          <div className='form-group'>
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
          <div className='form-group'>
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
          <div className='form-group'>
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
        </div>
      </form>
    </div>
  );
};

export default AddProject;
