from app import app

# This is needed for gunicorn
app = app

if __name__ == "__main__":
    app.run()
