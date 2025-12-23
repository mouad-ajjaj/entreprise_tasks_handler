# test_api.py
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:7071/api"

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def setup():
    """Initialize data files."""
    log("Setting up data...")
    r = requests.post(f"{BASE_URL}/setup-data")
    log(f"Setup: {r.status_code} - {r.json()}")

# ========== EMPLOYEES ==========

def test_employees():
    log("\n=== TESTING EMPLOYEES ===")
    
    # Create
    log("Creating employee...")
    emp_data = {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "position": "Product Manager",
        "department": "Product"
    }
    r = requests.post(f"{BASE_URL}/employees", json=emp_data)
    assert r.status_code == 201, f"Create failed: {r.status_code}"
    employee = r.json()
    emp_id = employee["id"]
    log(f"✓ Created employee: {emp_id}")
    
    # Get one
    log(f"Fetching employee {emp_id}...")
    r = requests.get(f"{BASE_URL}/employees/{emp_id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Jane Smith"
    log(f"✓ Got employee: {r.json()['name']}")
    
    # List all
    log("Listing all employees...")
    r = requests.get(f"{BASE_URL}/employees")
    assert r.status_code == 200
    employees = r.json()
    log(f"✓ Found {len(employees)} employee(s)")
    
    # Update
    log(f"Updating employee {emp_id}...")
    r = requests.put(f"{BASE_URL}/employees/{emp_id}", json={"position": "Senior Product Manager"})
    assert r.status_code == 200
    assert r.json()["position"] == "Senior Product Manager"
    log(f"✓ Updated employee position")
    
    # Delete
    log(f"Deleting employee {emp_id}...")
    r = requests.delete(f"{BASE_URL}/employees/{emp_id}")
    assert r.status_code == 200
    log(f"✓ Deleted employee")
    
    # Verify deleted
    r = requests.get(f"{BASE_URL}/employees/{emp_id}")
    assert r.status_code == 404
    log(f"✓ Confirmed employee is deleted (404)")
    
    return emp_id


# ========== TASKS ==========

def test_tasks(employee_id):
    log("\n=== TESTING TASKS ===")
    
    # Create
    log("Creating task...")
    task_data = {
        "title": "Implement new dashboard",
        "description": "Build analytics dashboard",
        "employee_id": employee_id,
        "status": "pending",
        "due_date": (datetime.now() + timedelta(days=7)).isoformat()
    }
    r = requests.post(f"{BASE_URL}/tasks", json=task_data)
    assert r.status_code == 201
    task = r.json()
    task_id = task["id"]
    log(f"✓ Created task: {task_id}")
    
    # Get one
    log(f"Fetching task {task_id}...")
    r = requests.get(f"{BASE_URL}/tasks/{task_id}")
    assert r.status_code == 200
    log(f"✓ Got task: {r.json()['title']}")
    
    # List all
    log("Listing all tasks...")
    r = requests.get(f"{BASE_URL}/tasks")
    assert r.status_code == 200
    log(f"✓ Found {len(r.json())} task(s)")
    
    # Update
    log(f"Updating task {task_id}...")
    r = requests.put(f"{BASE_URL}/tasks/{task_id}", json={"status": "in_progress"})
    assert r.status_code == 200
    assert r.json()["status"] == "in_progress"
    log(f"✓ Updated task status")
    
    # Delete
    log(f"Deleting task {task_id}...")
    r = requests.delete(f"{BASE_URL}/tasks/{task_id}")
    assert r.status_code == 200
    log(f"✓ Deleted task")
    
    # Verify deleted
    r = requests.get(f"{BASE_URL}/tasks/{task_id}")
    assert r.status_code == 404
    log(f"✓ Confirmed task is deleted (404)")


# ========== REMINDERS ==========

def test_reminders(employee_id):
    log("\n=== TESTING REMINDERS ===")
    
    # Create
    log("Creating reminder...")
    reminder_data = {
        "title": "Performance Review",
        "description": "Quarterly performance review",
        "employee_id": employee_id,
        "reminder_date": (datetime.now() + timedelta(days=1)).isoformat() + "Z"
    }
    r = requests.post(f"{BASE_URL}/reminders", json=reminder_data)
    assert r.status_code == 201
    reminder = r.json()
    reminder_id = reminder["id"]
    log(f"✓ Created reminder: {reminder_id}")
    
    # Get one
    log(f"Fetching reminder {reminder_id}...")
    r = requests.get(f"{BASE_URL}/reminders/{reminder_id}")
    assert r.status_code == 200
    log(f"✓ Got reminder: {r.json()['title']}")
    
    # List all
    log("Listing all reminders...")
    r = requests.get(f"{BASE_URL}/reminders")
    assert r.status_code == 200
    log(f"✓ Found {len(r.json())} reminder(s)")
    
    # Update
    log(f"Updating reminder {reminder_id}...")
    r = requests.put(f"{BASE_URL}/reminders/{reminder_id}", json={"title": "Q1 Performance Review"})
    assert r.status_code == 200
    assert r.json()["title"] == "Q1 Performance Review"
    log(f"✓ Updated reminder title")
    
    # Delete
    log(f"Deleting reminder {reminder_id}...")
    r = requests.delete(f"{BASE_URL}/reminders/{reminder_id}")
    assert r.status_code == 200
    log(f"✓ Deleted reminder")


# ========== DOCUMENTS ==========

def test_documents(employee_id):
    log("\n=== TESTING DOCUMENTS ===")
    
    # Create
    log("Creating document...")
    doc_data = {
        "title": "Contract",
        "file_name": "contract.pdf",
        "file_path": "docs/contract.pdf",
        "file_size": 1024000,
        "mime_type": "application/pdf",
        "employee_id": employee_id,
        "description": "Employment contract"
    }
    r = requests.post(f"{BASE_URL}/documents", json=doc_data)
    assert r.status_code == 201
    doc = r.json()
    doc_id = doc["id"]
    log(f"✓ Created document: {doc_id}")
    
    # Get one
    log(f"Fetching document {doc_id}...")
    r = requests.get(f"{BASE_URL}/documents/{doc_id}")
    assert r.status_code == 200
    log(f"✓ Got document: {r.json()['title']}")
    
    # List all
    log("Listing all documents...")
    r = requests.get(f"{BASE_URL}/documents")
    assert r.status_code == 200
    log(f"✓ Found {len(r.json())} document(s)")
    
    # Update
    log(f"Updating document {doc_id}...")
    r = requests.put(f"{BASE_URL}/documents/{doc_id}", json={"title": "Employment Contract v2"})
    assert r.status_code == 200
    assert r.json()["title"] == "Employment Contract v2"
    log(f"✓ Updated document title")
    
    # Delete
    log(f"Deleting document {doc_id}...")
    r = requests.delete(f"{BASE_URL}/documents/{doc_id}")
    assert r.status_code == 200
    log(f"✓ Deleted document")


if __name__ == "__main__":
    try:
        setup()
        
        # Create a new employee to use for other tests
        emp_data = {
            "name": "Test User",
            "email": "test@example.com",
            "position": "Developer",
            "department": "Engineering"
        }
        r = requests.post(f"{BASE_URL}/employees", json=emp_data)
        employee_id = r.json()["id"]
        log(f"Created test employee: {employee_id}")
        
        test_employees()
        test_tasks(employee_id)
        test_reminders(employee_id)
        test_documents(employee_id)
        
        log("\n✅ ALL TESTS PASSED!")
        
    except AssertionError as e:
        log(f"\n❌ TEST FAILED: {e}")
    except Exception as e:
        log(f"\n❌ ERROR: {e}")
