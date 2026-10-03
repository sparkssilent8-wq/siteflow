FROM python:3.11-slim
WORKDIR /app
COPY ml/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY ml /app/ml
ENV PYTHONPATH=/app
EXPOSE 8001
CMD ["python", "-m", "uvicorn", "ml.main:app", "--host", "0.0.0.0", "--port", "8001"]
