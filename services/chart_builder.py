# services/chart_builder.py
import json
import urllib.parse

def build_chart_url(title, chart_type, data):
    """
    Takes aggregation data (List of Dicts or DataFrame) and builds a QuickChart URL.
    """
    # Unwrap DataFrame if needed
    if hasattr(data, 'to_list'):
        data = data.to_list()
        
    if not data or not isinstance(data, list):
        print("Chart Builder Error: Data is empty or not a list")
        return None
    
    try:
        # New Aggregate Format: [{'group': 'Canada', 'total_amount': 100}, ...]
        
        # 1. Extract Labels (Groups)
        labels = [str(row.get('group', 'Unknown')) for row in data]
        
        # 2. Extract Data Values
        # Find the key that isn't 'group' to use as the value
        first_row = data[0]
        value_keys = [k for k in first_row.keys() if k != 'group']
        
        if not value_keys:
            print("Chart Builder Error: No value columns found")
            return None
            
        # Use the first numeric column found
        data_key = value_keys[0]
        dataset_label = data_key.replace('_', ' ').title()
        
        chart_data = []
        for row in data:
            val = row.get(data_key, 0)
            try:
                chart_data.append(float(val))
            except:
                chart_data.append(0)
        
        # 3. Construct Config
        chart_config = {
            'type': chart_type,
            'data': {
                'labels': labels,
                'datasets': [{
                    'label': dataset_label,
                    'data': chart_data,
                    'backgroundColor': 'rgba(14, 165, 233, 0.6)', # Sky-500
                    'borderColor': 'rgba(14, 165, 233, 1)',
                    'borderWidth': 1
                }]
            },
            'options': {
                'title': { 'display': True, 'text': title },
                'legend': { 'display': False },
                'scales': {
                    'yAxes': [{
                        'ticks': { 'beginAtZero': True }
                    }]
                }
            }
        }

        config_json = json.dumps(chart_config)
        encoded_config = urllib.parse.quote(config_json)
        return f"https://quickchart.io/chart?c={encoded_config}"
    except Exception as e:
        print(f"Error building chart: {e}")
        return None
    
