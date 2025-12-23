import azure.functions as func
import logging
import os
import json
import uuid
from datetime import datetime
import mimetypes  # NEW: For guessing file types
from azure.storage.blob import BlobServiceClient

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# --- Global Blob config (reuse for data + documents) ---
BLOB_CONNECTION_STRING = os.getenv("BLOB_CONNECTION_STRING")
DATA_CONTAINER = os.getenv("BLOB_DATA_CONTAINER", "data-container")
DOCUMENTS_CONTAINER = os.getenv("BLOB_DOCUMENTS_CONTAINER", "documents-container")

# Initialize client once globally to reuse connections
if not BLOB_CONNECTION_STRING:
    raise ValueError("BLOB_CONNECTION_STRING is not set in environment variables")

blob_service_client = BlobServiceClient.from_connection_string(BLOB_CONNECTION_STRING)


# ---------- Internal helpers ----------

def _get_blob_json(blob_path: str):
    """Read JSON from a blob path in the data container."""
    # Uses the global client and container constant
    container_client = blob_service_client.get_container_client(DATA_CONTAINER)
    blob_client = container_client.get_blob_client(blob_path)

    download_stream = blob_client.download_blob()
    data = download_stream.readall().decode("utf-8")
    return json.loads(data)


def _set_blob_json(blob_path: str, data):
    """Write JSON to a blob path in the data container."""
    # Uses the global client and container constant
    container_client = blob_service_client.get_container_client(DATA_CONTAINER)
    blob_client = container_client.get_blob_client(blob_path)

    json_bytes = json.dumps(data, indent=2).encode("utf-8")
    blob_client.upload_blob(json_bytes, overwrite=True)


def _utc_now_iso():
    """Return current UTC time in ISO format."""
    return datetime.utcnow().isoformat() + "Z"


def _find_by_id(items: list, item_id: str):
    """Find an item in a list by id. Return (item, index) or (None, None)."""
    for idx, item in enumerate(items):
        if item.get("id") == item_id:
            return item, idx
    return None, None


def _json_response(body, status_code=200):
    """Shorthand for JSON response."""
    return func.HttpResponse(
        body=json.dumps(body),
        mimetype="application/json",
        status_code=status_code
    )


# ========== EMPLOYEES ==========

@app.route(route="employees", methods=["GET"])
def get_employees(req: func.HttpRequest) -> func.HttpResponse:
    """GET /api/employees - List all employees."""
    logging.info("GetEmployees called")
    try:
        employees = _get_blob_json("employees/employees.json")
        return _json_response(employees)
    except Exception as e:
        logging.exception("Error in get_employees")
        return _json_response({"error": str(e)}, 500)


@app.route(route="employees/{employee_id}", methods=["GET"])
def get_employee(req: func.HttpRequest) -> func.HttpResponse:
    """GET /api/employees/{employee_id} - Get one employee by id."""
    logging.info("GetEmployee called")
    try:
        employee_id = req.route_params.get("employee_id")
        employees = _get_blob_json("employees/employees.json")
        
        item, _ = _find_by_id(employees, employee_id)
        if not item:
            return _json_response({"error": "Employee not found"}, 404)
        
        return _json_response(item)
    except Exception as e:
        logging.exception("Error in get_employee")
        return _json_response({"error": str(e)}, 500)


@app.route(route="employees", methods=["POST"])
def create_employee(req: func.HttpRequest) -> func.HttpResponse:
    """POST /api/employees - Create a new employee."""
    logging.info("CreateEmployee called")
    try:
        try:
            payload = req.get_json()
        except ValueError:
            return _json_response({"error": "Invalid JSON body"}, 400)

        name = payload.get("name")
        email = payload.get("email")
        position = payload.get("position")
        department = payload.get("department")

        if not all([name, email, position, department]):
            return _json_response(
                {"error": "name, email, position, department are required"}, 400
            )

        employees = _get_blob_json("employees/employees.json")
        if not isinstance(employees, list):
            employees = []

        now = _utc_now_iso()
        new_employee = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "position": position,
            "department": department,
            "created_at": now,
            "updated_at": now
        }

        employees.append(new_employee)
        _set_blob_json("employees/employees.json", employees)

        return _json_response(new_employee, 201)

    except Exception as e:
        logging.exception("Error in create_employee")
        return _json_response({"error": str(e)}, 500)


@app.route(route="employees/{employee_id}", methods=["PUT"])
def update_employee(req: func.HttpRequest) -> func.HttpResponse:
    """PUT /api/employees/{employee_id} - Update an employee."""
    logging.info("UpdateEmployee called")
    try:
        employee_id = req.route_params.get("employee_id")
        try:
            payload = req.get_json()
        except ValueError:
            return _json_response({"error": "Invalid JSON body"}, 400)

        employees = _get_blob_json("employees/employees.json")
        item, idx = _find_by_id(employees, employee_id)
        
        if not item:
            return _json_response({"error": "Employee not found"}, 404)

        # Update fields if provided
        if "name" in payload:
            item["name"] = payload["name"]
        if "email" in payload:
            item["email"] = payload["email"]
        if "position" in payload:
            item["position"] = payload["position"]
        if "department" in payload:
            item["department"] = payload["department"]

        item["updated_at"] = _utc_now_iso()
        employees[idx] = item
        _set_blob_json("employees/employees.json", employees)

        return _json_response(item)

    except Exception as e:
        logging.exception("Error in update_employee")
        return _json_response({"error": str(e)}, 500)


@app.route(route="employees/{employee_id}", methods=["DELETE"])
def delete_employee(req: func.HttpRequest) -> func.HttpResponse:
    """DELETE /api/employees/{employee_id} - Delete an employee."""
    logging.info("DeleteEmployee called")
    try:
        employee_id = req.route_params.get("employee_id")
        employees = _get_blob_json("employees/employees.json")
        
        item, idx = _find_by_id(employees, employee_id)
        if not item:
            return _json_response({"error": "Employee not found"}, 404)

        deleted_item = employees.pop(idx)
        _set_blob_json("employees/employees.json", employees)

        return _json_response({"message": "Employee deleted", "item": deleted_item})

    except Exception as e:
        logging.exception("Error in delete_employee")
        return _json_response({"error": str(e)}, 500)


# ========== TASKS ==========

@app.route(route="tasks", methods=["GET"])
def get_tasks(req: func.HttpRequest) -> func.HttpResponse:
    """GET /api/tasks - List all tasks."""
    logging.info("GetTasks called")
    try:
        tasks = _get_blob_json("tasks/tasks.json")
        return _json_response(tasks)
    except Exception as e:
        logging.exception("Error in get_tasks")
        return _json_response({"error": str(e)}, 500)


@app.route(route="tasks/{task_id}", methods=["GET"])
def get_task(req: func.HttpRequest) -> func.HttpResponse:
    """GET /api/tasks/{task_id} - Get one task by id."""
    logging.info("GetTask called")
    try:
        task_id = req.route_params.get("task_id")
        tasks = _get_blob_json("tasks/tasks.json")
        
        item, _ = _find_by_id(tasks, task_id)
        if not item:
            return _json_response({"error": "Task not found"}, 404)
        
        return _json_response(item)
    except Exception as e:
        logging.exception("Error in get_task")
        return _json_response({"error": str(e)}, 500)


@app.route(route="tasks", methods=["POST"])
def create_task(req: func.HttpRequest) -> func.HttpResponse:
    """POST /api/tasks - Create a new task."""
    logging.info("CreateTask called")
    try:
        try:
            payload = req.get_json()
        except ValueError:
            return _json_response({"error": "Invalid JSON body"}, 400)

        title = payload.get("title")
        employee_id = payload.get("employee_id")
        status = payload.get("status", "pending")
        description = payload.get("description")
        due_date = payload.get("due_date")

        if not all([title, employee_id]):
            return _json_response(
                {"error": "title and employee_id are required"}, 400
            )

        tasks = _get_blob_json("tasks/tasks.json")
        if not isinstance(tasks, list):
            tasks = []

        now = _utc_now_iso()
        new_task = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "employee_id": employee_id,
            "status": status,
            "due_date": due_date,
            "created_at": now,
            "updated_at": now
        }

        tasks.append(new_task)
        _set_blob_json("tasks/tasks.json", tasks)

        return _json_response(new_task, 201)

    except Exception as e:
        logging.exception("Error in create_task")
        return _json_response({"error": str(e)}, 500)


@app.route(route="tasks/{task_id}", methods=["PUT"])
def update_task(req: func.HttpRequest) -> func.HttpResponse:
    """PUT /api/tasks/{task_id} - Update a task."""
    logging.info("UpdateTask called")
    try:
        task_id = req.route_params.get("task_id")
        try:
            payload = req.get_json()
        except ValueError:
            return _json_response({"error": "Invalid JSON body"}, 400)

        tasks = _get_blob_json("tasks/tasks.json")
        item, idx = _find_by_id(tasks, task_id)
        
        if not item:
            return _json_response({"error": "Task not found"}, 404)

        # Update fields if provided
        if "title" in payload:
            item["title"] = payload["title"]
        if "description" in payload:
            item["description"] = payload["description"]
        if "status" in payload:
            item["status"] = payload["status"]
        if "due_date" in payload:
            item["due_date"] = payload["due_date"]
        if "employee_id" in payload:
            item["employee_id"] = payload["employee_id"]

        item["updated_at"] = _utc_now_iso()
        tasks[idx] = item
        _set_blob_json("tasks/tasks.json", tasks)

        return _json_response(item)

    except Exception as e:
        logging.exception("Error in update_task")
        return _json_response({"error": str(e)}, 500)


@app.route(route="tasks/{task_id}", methods=["DELETE"])
def delete_task(req: func.HttpRequest) -> func.HttpResponse:
    """DELETE /api/tasks/{task_id} - Delete a task."""
    logging.info("DeleteTask called")
    try:
        task_id = req.route_params.get("task_id")
        tasks = _get_blob_json("tasks/tasks.json")
        
        item, idx = _find_by_id(tasks, task_id)
        if not item:
            return _json_response({"error": "Task not found"}, 404)

        deleted_item = tasks.pop(idx)
        _set_blob_json("tasks/tasks.json", tasks)

        return _json_response({"message": "Task deleted", "item": deleted_item})

    except Exception as e:
        logging.exception("Error in delete_task")
        return _json_response({"error": str(e)}, 500)


# ========== REMINDERS ==========

@app.route(route="reminders", methods=["GET"])
def get_reminders(req: func.HttpRequest) -> func.HttpResponse:
    """GET /api/reminders - List all reminders."""
    logging.info("GetReminders called")
    try:
        reminders = _get_blob_json("reminders/reminders.json")
        return _json_response(reminders)
    except Exception as e:
        logging.exception("Error in get_reminders")
        return _json_response({"error": str(e)}, 500)


@app.route(route="reminders/{reminder_id}", methods=["GET"])
def get_reminder(req: func.HttpRequest) -> func.HttpResponse:
    """GET /api/reminders/{reminder_id} - Get one reminder by id."""
    logging.info("GetReminder called")
    try:
        reminder_id = req.route_params.get("reminder_id")
        reminders = _get_blob_json("reminders/reminders.json")
        
        item, _ = _find_by_id(reminders, reminder_id)
        if not item:
            return _json_response({"error": "Reminder not found"}, 404)
        
        return _json_response(item)
    except Exception as e:
        logging.exception("Error in get_reminder")
        return _json_response({"error": str(e)}, 500)


@app.route(route="reminders", methods=["POST"])
def create_reminder(req: func.HttpRequest) -> func.HttpResponse:
    """POST /api/reminders - Create a new reminder."""
    logging.info("CreateReminder called")
    try:
        try:
            payload = req.get_json()
        except ValueError:
            return _json_response({"error": "Invalid JSON body"}, 400)

        title = payload.get("title")
        employee_id = payload.get("employee_id")
        reminder_date = payload.get("reminder_date")
        description = payload.get("description")

        if not all([title, employee_id, reminder_date]):
            return _json_response(
                {"error": "title, employee_id, reminder_date are required"}, 400
            )

        reminders = _get_blob_json("reminders/reminders.json")
        if not isinstance(reminders, list):
            reminders = []

        now = _utc_now_iso()
        new_reminder = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "reminder_date": reminder_date,
            "employee_id": employee_id,
            "created_at": now,
            "updated_at": now
        }

        reminders.append(new_reminder)
        _set_blob_json("reminders/reminders.json", reminders)

        return _json_response(new_reminder, 201)

    except Exception as e:
        logging.exception("Error in create_reminder")
        return _json_response({"error": str(e)}, 500)


@app.route(route="reminders/{reminder_id}", methods=["PUT"])
def update_reminder(req: func.HttpRequest) -> func.HttpResponse:
    """PUT /api/reminders/{reminder_id} - Update a reminder."""
    logging.info("UpdateReminder called")
    try:
        reminder_id = req.route_params.get("reminder_id")
        try:
            payload = req.get_json()
        except ValueError:
            return _json_response({"error": "Invalid JSON body"}, 400)

        reminders = _get_blob_json("reminders/reminders.json")
        item, idx = _find_by_id(reminders, reminder_id)
        
        if not item:
            return _json_response({"error": "Reminder not found"}, 404)

        # Update fields if provided
        if "title" in payload:
            item["title"] = payload["title"]
        if "description" in payload:
            item["description"] = payload["description"]
        if "reminder_date" in payload:
            item["reminder_date"] = payload["reminder_date"]
        if "employee_id" in payload:
            item["employee_id"] = payload["employee_id"]

        item["updated_at"] = _utc_now_iso()
        reminders[idx] = item
        _set_blob_json("reminders/reminders.json", reminders)

        return _json_response(item)

    except Exception as e:
        logging.exception("Error in update_reminder")
        return _json_response({"error": str(e)}, 500)


@app.route(route="reminders/{reminder_id}", methods=["DELETE"])
def delete_reminder(req: func.HttpRequest) -> func.HttpResponse:
    """DELETE /api/reminders/{reminder_id} - Delete a reminder."""
    logging.info("DeleteReminder called")
    try:
        reminder_id = req.route_params.get("reminder_id")
        reminders = _get_blob_json("reminders/reminders.json")
        
        item, idx = _find_by_id(reminders, reminder_id)
        if not item:
            return _json_response({"error": "Reminder not found"}, 404)

        deleted_item = reminders.pop(idx)
        _set_blob_json("reminders/reminders.json", reminders)

        return _json_response({"message": "Reminder deleted", "item": deleted_item})

    except Exception as e:
        logging.exception("Error in delete_reminder")
        return _json_response({"error": str(e)}, 500)


# ========== DOCUMENTS ==========

@app.route(route="documents", methods=["GET"])
def get_documents(req: func.HttpRequest) -> func.HttpResponse:
    """GET /api/documents - List all documents."""
    logging.info("GetDocuments called")
    try:
        documents = _get_blob_json("documents/documents.json")
        return _json_response(documents)
    except Exception as e:
        logging.exception("Error in get_documents")
        return _json_response({"error": str(e)}, 500)


@app.route(route="documents/{document_id}", methods=["GET"])
def get_document(req: func.HttpRequest) -> func.HttpResponse:
    """GET /api/documents/{document_id} - Get one document by id."""
    logging.info("GetDocument called")
    try:
        document_id = req.route_params.get("document_id")
        documents = _get_blob_json("documents/documents.json")
        
        item, _ = _find_by_id(documents, document_id)
        if not item:
            return _json_response({"error": "Document not found"}, 404)
        
        return _json_response(item)
    except Exception as e:
        logging.exception("Error in get_document")
        return _json_response({"error": str(e)}, 500)


@app.route(route="documents", methods=["POST"])
def create_document(req: func.HttpRequest) -> func.HttpResponse:
    """
    POST /api/documents
    Accepts multipart/form-data with:
      - file: the uploaded file
      - title, description, employee_id
      - task_id, task_name, employee_name (NEW FIELDS)
    """
    logging.info("CreateDocument (file + metadata) called")
    try:
        # 1) Read multipart/form-data
        file = req.files.get("file")
        if file is None:
            return _json_response({"error": "file field is required"}, 400)

        # Existing fields
        title = req.form.get("title")
        description = req.form.get("description")
        employee_id = req.form.get("employee_id")

        # --- NEW FIELDS FROM FRONTEND ---
        task_id = req.form.get("task_id")
        task_name = req.form.get("task_name")
        employee_name = req.form.get("employee_name")

        if not title or not employee_id:
            return _json_response(
                {"error": "title and employee_id are required"},
                400
            )

        original_name = file.filename or "upload"
        mime_type = file.mimetype or mimetypes.guess_type(original_name)[0] or "application/octet-stream"
        
        file_bytes = file.stream.read()
        file_size = len(file_bytes)

        # 2) Build blob name
        _, ext = os.path.splitext(original_name)
        doc_id = str(uuid.uuid4())
        blob_name = f"{employee_id}/{doc_id}{ext}"

        # 3) Upload into documents-container
        docs_container = blob_service_client.get_container_client(DOCUMENTS_CONTAINER)
        blob_client = docs_container.get_blob_client(blob_name)
        blob_client.upload_blob(file_bytes, overwrite=True)
        
        blob_url = blob_client.url

        # 4) Append metadata
        try:
            documents = _get_blob_json("documents/documents.json")
            if not isinstance(documents, list):
                documents = []
        except Exception:
            documents = []

        now = _utc_now_iso()
        document_record = {
            "id": doc_id,
            "title": title,
            "description": description,
            "file_name": original_name,
            "file_size": file_size,
            "mime_type": mime_type,
            "blob_name": blob_name,
            "blob_url": blob_url,
            "employee_id": str(employee_id),
            
            # --- SAVE NEW FIELDS ---
            "employee_name": employee_name, 
            "task_id": task_id,
            "task_name": task_name,

            "created_at": now,
            "updated_at": now
        }

        documents.append(document_record)
        _set_blob_json("documents/documents.json", documents)

        return _json_response(document_record, 201)

    except Exception as e:
        logging.exception("Error in create_document")
        return _json_response({"error": str(e)}, 500)


@app.route(route="documents/{document_id}", methods=["PUT"])
def update_document(req: func.HttpRequest) -> func.HttpResponse:
    """PUT /api/documents/{document_id} - Update a document."""
    logging.info("UpdateDocument called")
    try:
        document_id = req.route_params.get("document_id")
        try:
            payload = req.get_json()
        except ValueError:
            return _json_response({"error": "Invalid JSON body"}, 400)

        documents = _get_blob_json("documents/documents.json")
        item, idx = _find_by_id(documents, document_id)
        
        if not item:
            return _json_response({"error": "Document not found"}, 404)

        # Update standard fields
        if "title" in payload:
            item["title"] = payload["title"]
        if "description" in payload:
            item["description"] = payload["description"]
        if "employee_id" in payload:
            item["employee_id"] = payload["employee_id"]
            
        # --- UPDATE NEW FIELDS IF PROVIDED ---
        if "task_id" in payload:
            item["task_id"] = payload["task_id"]
        if "task_name" in payload:
            item["task_name"] = payload["task_name"]

        item["updated_at"] = _utc_now_iso()
        documents[idx] = item
        _set_blob_json("documents/documents.json", documents)

        return _json_response(item)

    except Exception as e:
        logging.exception("Error in update_document")
        return _json_response({"error": str(e)}, 500)


@app.route(route="documents/{document_id}", methods=["DELETE"])
def delete_document(req: func.HttpRequest) -> func.HttpResponse:
    """DELETE /api/documents/{document_id} - Delete a document."""
    logging.info("DeleteDocument called")
    try:
        document_id = req.route_params.get("document_id")
        documents = _get_blob_json("documents/documents.json")
        
        item, idx = _find_by_id(documents, document_id)
        if not item:
            return _json_response({"error": "Document not found"}, 404)

        deleted_item = documents.pop(idx)
        _set_blob_json("documents/documents.json", documents)

        return _json_response({"message": "Document deleted", "item": deleted_item})

    except Exception as e:
        logging.exception("Error in delete_document")
        return _json_response({"error": str(e)}, 500)


# ========== SETUP DATA ==========

@app.route(route="setup-data", methods=["POST", "GET"])
def setup_data(req: func.HttpRequest) -> func.HttpResponse:
    """
    Initialize Blob containers and JSON files.
    Creates:
      data-container/employees/employees.json
      data-container/tasks/tasks.json
      data-container/reminders/reminders.json
      data-container/documents/documents.json
    Each file starts as an empty JSON array [].
    """
    logging.info("SetupData called")

    try:
        conn_str = os.getenv("BLOB_CONNECTION_STRING")
        container_name = os.getenv("BLOB_DATA_CONTAINER", "data-container")

        if not conn_str:
            return _json_response(
                {"error": "BLOB_CONNECTION_STRING not set"}, 500
            )

        blob_service = BlobServiceClient.from_connection_string(conn_str)
        container_client = blob_service.get_container_client(container_name)

        try:
            container_client.create_container()
            created_container = True
        except Exception:
            created_container = False  # already exists

        targets = [
            "employees/employees.json",
            "tasks/tasks.json",
            "reminders/reminders.json",
            "documents/documents.json",
        ]

        created_files = []
        existing_files = []

        for blob_path in targets:
            blob_client = container_client.get_blob_client(blob_path)
            if blob_client.exists():
                existing_files.append(blob_path)
            else:
                blob_client.upload_blob(b"[]", overwrite=True)
                created_files.append(blob_path)

        result = {
            "container": container_name,
            "container_created": created_container,
            "created_files": created_files,
            "existing_files": existing_files,
        }

        return _json_response(result)

    except Exception as e:
        logging.exception("Error in setup_data")
        return _json_response({"error": str(e)}, 500)