import io
import os
import shutil
import subprocess
import zipfile
from datetime import datetime
from pathlib import Path

from flask import current_app

from .models import db

RESTORE_CONFIRM_PHRASE = "RESTAURAR"


def backup_filename(prefix, extension):
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"{prefix}-{timestamp}.{extension}"


def build_database_backup():
    url = db.engine.url
    if url.get_backend_name() != "mysql":
        raise RuntimeError("Backup do banco só é suportado para MySQL/MariaDB.")

    command = [
        "mysqldump",
        f"--host={url.host or 'localhost'}",
        f"--port={url.port or 3306}",
        f"--user={url.username or ''}",
        "--single-transaction",
        "--routines",
        "--triggers",
        url.database,
    ]

    env = os.environ.copy()
    if url.password:
        env["MYSQL_PWD"] = url.password

    timeout = int(os.getenv("DB_BACKUP_TIMEOUT_SECONDS", "300"))
    try:
        result = subprocess.run(command, env=env, capture_output=True, timeout=timeout)
    except FileNotFoundError as exc:
        raise RuntimeError(
            "mysqldump não está instalado na imagem da aplicação. Adicione o pacote "
            "default-mysql-client ao Dockerfile e reconstrua o container."
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"Backup do banco excedeu o tempo limite de {timeout}s.") from exc

    if result.returncode != 0:
        error = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(error or f"mysqldump falhou com status {result.returncode}.")

    return result.stdout


def build_files_backup():
    upload_folder = Path(current_app.config["UPLOAD_FOLDER"])
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        if upload_folder.is_dir():
            for path in sorted(upload_folder.rglob("*")):
                if path.is_file():
                    archive.write(path, arcname=path.relative_to(upload_folder))
    return buffer.getvalue()


def restore_database(sql_bytes):
    url = db.engine.url
    if url.get_backend_name() != "mysql":
        raise RuntimeError("Restauração do banco só é suportada para MySQL/MariaDB.")

    command = [
        "mysql",
        f"--host={url.host or 'localhost'}",
        f"--port={url.port or 3306}",
        f"--user={url.username or ''}",
        url.database,
    ]

    env = os.environ.copy()
    if url.password:
        env["MYSQL_PWD"] = url.password

    timeout = int(os.getenv("DB_BACKUP_TIMEOUT_SECONDS", "300"))
    try:
        result = subprocess.run(command, input=sql_bytes, env=env, capture_output=True, timeout=timeout)
    except FileNotFoundError as exc:
        raise RuntimeError(
            "mysql não está instalado na imagem da aplicação. Adicione o pacote "
            "default-mysql-client ao Dockerfile e reconstrua o container."
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"Restauração do banco excedeu o tempo limite de {timeout}s.") from exc

    if result.returncode != 0:
        error = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(error or f"mysql (restauração) falhou com status {result.returncode}.")


def restore_files(zip_bytes):
    upload_folder = Path(current_app.config["UPLOAD_FOLDER"]).resolve()

    try:
        archive = zipfile.ZipFile(io.BytesIO(zip_bytes))
    except zipfile.BadZipFile as exc:
        raise RuntimeError("Arquivo enviado não é um .zip válido.") from exc

    bad_entry = archive.testzip()
    if bad_entry:
        raise RuntimeError(f"Arquivo corrompido dentro do zip: {bad_entry}")

    members = [info for info in archive.infolist() if not info.is_dir()]
    for info in members:
        member_path = (upload_folder / info.filename).resolve()
        if member_path != upload_folder and upload_folder not in member_path.parents:
            raise RuntimeError(f"Arquivo inválido no zip (fora da pasta de uploads): {info.filename}")

    upload_folder.mkdir(parents=True, exist_ok=True)
    clear_directory_contents(upload_folder)

    for info in members:
        archive.extract(info, path=upload_folder)


def clear_directory_contents(directory):
    # UPLOAD_FOLDER costuma ser um ponto de montagem Docker (bind mount) -- remover o
    # diretório em si falha com "Device or resource busy". Remove só o conteúdo.
    for child in directory.iterdir():
        if child.is_dir() and not child.is_symlink():
            shutil.rmtree(child)
        else:
            child.unlink()
