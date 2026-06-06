FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend project files
COPY backend /app/

# Default to SQLite environment
ENV DB_ENGINE=sqlite
ENV PYTHONUNBUFFERED=1

# Expose port 8000
EXPOSE 8000

# Run migrations, seed demo data, and start Daphne ASGI server
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_demo_data && daphne -b 0.0.0.0 -p $PORT config.asgi:application"]
