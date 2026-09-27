from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    session_token = db.Column(db.String(64), nullable=True)
    api_token_hash = db.Column(db.String(64), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class UploadBatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    office_number = db.Column(db.String(120), index=True, nullable=False)
    process_number = db.Column(db.String(25), index=True, nullable=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    sei_numbers = db.Column(db.Text, nullable=True)
    office_key = db.Column(db.String(160), index=True, nullable=True)
    expedition_date = db.Column(db.Date, nullable=True)
    removal_date = db.Column(db.Date, nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    total_found = db.Column(db.Integer, default=0, nullable=False)
    new_count = db.Column(db.Integer, default=0, nullable=False)
    existing_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class OfficeFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    office_id = db.Column(db.Integer, db.ForeignKey("upload_batch.id"), nullable=False)
    file_type = db.Column(db.String(30), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(120), nullable=True)
    removal_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class OfficeDomain(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    office_id = db.Column(db.Integer, db.ForeignKey("upload_batch.id"), nullable=False)
    domain_id = db.Column(db.Integer, db.ForeignKey("domain.id"), nullable=False)
    original_value = db.Column(db.String(500), nullable=True)
    removal_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (db.UniqueConstraint("office_id", "domain_id", name="uq_office_domain"),)


class Domain(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(253), unique=True, index=True, nullable=False)
    first_seen_batch_id = db.Column(db.Integer, db.ForeignKey("upload_batch.id"), nullable=True)
    active = db.Column(db.Boolean, default=True, nullable=False)
    redirect_target = db.Column(db.String(253), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Deployment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    deployment_type = db.Column(db.String(30), default="rpz", nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    status = db.Column(db.String(30), nullable=False)
    domain_count = db.Column(db.Integer, nullable=False)
    ip_count = db.Column(db.Integer, default=0, nullable=False)
    message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class PublicationLock(db.Model):
    name = db.Column(db.String(80), primary_key=True)
    owner = db.Column(db.String(120), nullable=True)
    acquired_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class CompanySettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(160), nullable=True)
    cnpj = db.Column(db.String(30), nullable=True)
    asn = db.Column(db.String(30), nullable=True)
    address = db.Column(db.Text, nullable=True)
    address_street = db.Column(db.String(180), nullable=True)
    address_number = db.Column(db.String(30), nullable=True)
    address_complement = db.Column(db.String(120), nullable=True)
    address_neighborhood = db.Column(db.String(120), nullable=True)
    address_city = db.Column(db.String(120), nullable=True)
    address_state = db.Column(db.String(2), nullable=True)
    address_zip = db.Column(db.String(20), nullable=True)
    anatel_responsible_name = db.Column(db.String(160), nullable=True)
    anatel_responsible_phone = db.Column(db.String(60), nullable=True)
    anatel_responsible_email = db.Column(db.String(160), nullable=True)
    duty_phone = db.Column(db.String(60), nullable=True)
    duty_email = db.Column(db.String(160), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class ParameterSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dns_primary = db.Column(db.String(160), nullable=True)
    dns_secondary = db.Column(db.String(160), nullable=True)
    extra_dns_servers = db.Column(db.Text, nullable=True)
    publish_routers = db.Column(db.Text, nullable=True)
    router_command_ipv4 = db.Column(db.Text, nullable=True)
    router_command_ipv6 = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class IpBatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    office_id = db.Column(db.Integer, db.ForeignKey("upload_batch.id"), nullable=False)
    name = db.Column(db.String(160), index=True, nullable=False)
    office_key = db.Column(db.String(160), index=True, nullable=True)
    expedition_date = db.Column(db.Date, nullable=True)
    removal_date = db.Column(db.Date, nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    total_found = db.Column(db.Integer, default=0, nullable=False)
    new_count = db.Column(db.Integer, default=0, nullable=False)
    existing_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class IpBatchFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey("ip_batch.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class IpAddress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(64), unique=True, index=True, nullable=False)
    version = db.Column(db.Integer, nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class WhitelistDomain(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(253), unique=True, index=True, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class WhitelistIp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(64), unique=True, index=True, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class IpWhoisCache(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_id = db.Column(db.Integer, db.ForeignKey("ip_address.id"), unique=True, nullable=False)
    asn = db.Column(db.Integer, nullable=True)
    as_name = db.Column(db.String(255), nullable=True)
    bgp_prefix = db.Column(db.String(80), nullable=True)
    registry = db.Column(db.String(40), nullable=True)
    country = db.Column(db.String(8), nullable=True)
    rdap_name = db.Column(db.String(255), nullable=True)
    rdap_handle = db.Column(db.String(120), nullable=True)
    rdap_country = db.Column(db.String(8), nullable=True)
    error = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class IpWhoisJob(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_id = db.Column(db.Integer, db.ForeignKey("ip_address.id"), unique=True, nullable=False)
    status = db.Column(db.String(20), default="pending", index=True, nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    error = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    started_at = db.Column(db.DateTime, nullable=True)
    finished_at = db.Column(db.DateTime, nullable=True)


class IpBatchAddress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey("ip_batch.id"), nullable=False)
    ip_id = db.Column(db.Integer, db.ForeignKey("ip_address.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (db.UniqueConstraint("batch_id", "ip_id", name="uq_ip_batch_address"),)
