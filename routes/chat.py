# routes/chat.py
import json
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.llm_service import get_model
from services.security import secure_eval, SecurityViolation
from engine.dataframe import DataFrame
from models import Project, Table
from services.chart_builder import build_chart_url

chat_bp = Blueprint('chat', __name__)

def get_project_context(project_id, user_id):
    """
    Helper to fetch all dataframes for a project and ensure ownership.
    Returns (schema_dict, context_dict)
    """
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    if not project:
        return None, None
    
    schema = {}
    context = {}
    
    for table in project.tables:
        # Schema for LLM
        schema[table.name] = table.columns_schema
        # Dataframe for Execution
        try:
            df = DataFrame(source=table.filepath)
            context[table.name] = df
        except Exception as e:
            print(f"Failed to load table {table.name}: {e}")
            
    return schema, context

@chat_bp.route('/api/detect-relationships', methods=['POST'])
@jwt_required()
def detect_relationships():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    project_id = data.get('project_id')
    
    if not project_id:
        return jsonify({'success': False, 'error': 'Project ID required'}), 400

    schema, _ = get_project_context(project_id, current_user_id)
    if not schema or len(schema) < 2:
        # Not enough data to fail, just return empty
        return jsonify({'success': True, 'relationships': []}) 

    model = get_model()
    if not model:
        return jsonify({'success': False, 'error': 'AI model not configured'}), 503

    # Generate Prompt
    prompt = f"""
    Analyze this database schema and identify potential Foreign Key relationships based on column names (e.g. customer_id matching id).
    Schema: {json.dumps(schema)}
    
    Return a JSON object with this EXACT format:
    {{ "relationships": [ {{ "from_table": "str", "from_column": "str", "to_table": "str", "to_column": "str" }} ] }}
    
    Strict JSON only. No markdown formatting. No comments.
    """
    
    try:
        response = model.generate_content(prompt)
        
        # --- SAFE GUARD START ---
        if not response.candidates or not response.candidates[0].content.parts:
            # If AI is silent, just return empty relationships instead of crashing
            print("AI returned empty response for relationships.")
            return jsonify({'success': True, 'relationships': []})
            
        text = response.text.strip()
        
        # Clean potential markdown code blocks
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()
        # --- SAFE GUARD END ---

        result = json.loads(text)
        return jsonify({'success': True, 'relationships': result.get('relationships', [])})
        
    except json.JSONDecodeError:
        print(f"JSON Parse Error. AI Output: {text}")
        return jsonify({'success': True, 'relationships': []}) # Fail gracefully
    except Exception as e:
        print(f"Relationship Detection Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@chat_bp.route('/api/chat', methods=['POST'])
@jwt_required()
def chat_query():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    project_id = data.get('project_id')
    user_query = data.get('query')

    if not project_id or not user_query:
        return jsonify({'type': 'error', 'data': 'Missing parameters'}), 400

    # 1. Build Context (Stateless)
    schema, context = get_project_context(project_id, current_user_id)
    if not context:
        return jsonify({'type': 'error', 'data': 'Project access denied or empty.'}), 403
    
    context['build_chart_url'] = build_chart_url

    model = get_model()
    if not model:
        return jsonify({'type': 'error', 'data': 'AI Service Unavailable'}), 503

    # 2. Construct Prompt
    # (Assuming system prompt is handled in llm_service configuration, we just send the message)
    # We explicitly inject schema here to be safe
    full_prompt = f"""
    Context: {json.dumps(schema)}
    Question: {user_query}
    Generate the Python expression now.
    """

    try:
        # 3. AI Generation
        response = model.generate_content(full_prompt)

        # --- NEW SAFE GUARD START ---
        # Check if we actually have text parts
        if not response.candidates or not response.candidates[0].content.parts:
            # Check if it was blocked by safety
            if response.prompt_feedback and response.prompt_feedback.block_reason:
                return jsonify({'type': 'error', 'data': f"AI Blocked: {response.prompt_feedback.block_reason}"}), 400
            return jsonify({'type': 'error', 'data': "AI returned an empty response."}), 500
            
        code = response.text.strip().replace("```python", "").replace("```", "").strip()
        # --- NEW SAFE GUARD END ---
        
        # 4. Secure Execution
        result = secure_eval(code, context)
        
        # 5. Result Formatting
        if isinstance(result, str) and result.startswith("http"):
             return jsonify({'type': 'chart', 'data': result, 'query': code})
        elif isinstance(result, list):
             return jsonify({'type': 'table', 'data': result, 'query': code})
        elif hasattr(result, 'to_dict'): # Handle single row dicts if any
             return jsonify({'type': 'text', 'data': str(result), 'query': code})
        else:
             return jsonify({'type': 'text', 'data': str(result), 'query': code})

    except SecurityViolation as e:
        return jsonify({'type': 'error', 'data': f"Security: {str(e)}"}), 403
    except Exception as e:
        return jsonify({'type': 'error', 'data': f"Error: {str(e)}"}), 500