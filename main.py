from app.config import get_settings

if __name__ == "__main__":
  import uvicorn
  
  settings = get_settings()

  uvicorn.run("app.app:create_app", host=settings.host, port=settings.port, reload=settings.app_env == "development")