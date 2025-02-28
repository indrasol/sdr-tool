from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime
from database import db_models, schemas, data_base

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)
db_models.Base.metadata.create_all(bind=data_base.engine)
# Helper function to generate project number
# def generate_project_number():
#     return f"P{str(uuid.uuid4())[:8].upper()}"
# Helper function to generate sequential project numbers
def generate_project_number(db: Session):
    last_project = db.query(db_models.Project).order_by(db_models.Project.project_number.desc()).first()
    
    if last_project and last_project.project_number.startswith("P"):
        last_number = int(last_project.project_number[1:])  # Extract numeric part
        new_number = f"P{last_number + 1:03d}"  # Increment and format as P001, P002, etc.
    else:
        new_number = "P001"  # Start from P001 if no projects exist
    
    return new_number

# Get all projects
@router.get("", response_model=List[schemas.Project])
def get_projects(db: Session = Depends(data_base.get_db)):
    projects = db.query(db_models.Project).all()
    return projects

# Get project by ID
@router.get("/{project_id}", response_model=schemas.Project)
def get_project(project_id: str, db: Session = Depends(data_base.get_db)):
    project = db.query(db_models.Project).filter(db_models.Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with ID {project_id} not found")
    return project

# Create new project
@router.post("", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(data_base.get_db)):
    # Generate unique project_id
    project_id = str(uuid.uuid4())
    
    # Generate project number
    project_number = generate_project_number(db)
    
    # Create new project object
    new_project = db_models.Project(
        project_id=project_id,
        project_number=project_number,
        **project.dict()
    )
    
    # Add to database
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return new_project

# Update project
@router.put("/{project_id}", response_model=schemas.Project)
def update_project(project_id: str, project_update: schemas.ProjectUpdate, db: Session = Depends(data_base.get_db)):
    # Find project
    project_query = db.query(db_models.Project).filter(db_models.Project.project_id == project_id)
    project = project_query.first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with ID {project_id} not found")
    
    # Update project with provided values, only updating fields that were passed
    update_data = project_update.dict(exclude_unset=True)
    
    # Update modified timestamp
    update_data["modified"] = datetime.now()
    
    # Update project
    project_query.update(update_data, synchronize_session=False)
    db.commit()
    
    # Return updated project
    return project_query.first()

# Delete project
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(data_base.get_db)):
    # Find project
    project_query = db.query(db_models.Project).filter(db_models.Project.project_id == project_id)
    project = project_query.first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with ID {project_id} not found")
    
    # Delete project
    project_query.delete(synchronize_session=False)
    db.commit()
    
    return None