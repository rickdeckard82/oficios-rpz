from . import create_app, init_database


app = create_app()
init_database(app)
