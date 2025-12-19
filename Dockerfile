# Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Create startup script at ROOT (/) so volume mount at /app doesn't hide it
RUN echo '#!/bin/bash\n\
# Initialize DB\n\
python -c "from app import app, db; app.app_context().push(); db.create_all()"\n\
\n\
# Start Gunicorn\n\
exec gunicorn -c gunicorn_config.py app:app\n\
' > /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 5000

# Run the script from root
CMD ["/entrypoint.sh"]