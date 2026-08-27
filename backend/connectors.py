from sqlalchemy import create_engine, inspect

def test_db_connection_and_get_tables(db_type, host, port, username, password, database_name):
    """
    Attempts to connect to the provided database credentials.
    If successful, returns a list of all table names.
    If fails, raises an Exception.
    """
    if db_type == "postgres":
        url = f"postgresql://{username}:{password}@{host}:{port}/{database_name}"
    elif db_type == "mysql":
        url = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database_name}"
    else:
        raise ValueError(f"Unsupported database type: {db_type}")
        
    # Short timeout so it doesn't hang forever if invalid host
    engine = create_engine(url, connect_args={"connect_timeout": 5} if db_type == "postgres" else {"connect_timeout": 5})
    
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        return tables
    except Exception as e:
        raise Exception(f"Failed to connect or fetch schema: {str(e)}")
