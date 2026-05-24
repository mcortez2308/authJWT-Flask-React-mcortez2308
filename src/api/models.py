from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, DateTime, func
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship, declarative_base

db = SQLAlchemy()

Base = declarative_base()


class User(db.Model):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(120), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=True)
    password: Mapped[str] = mapped_column(nullable=False)
    salt: Mapped[str] = mapped_column(String(120), nullable=False)
    avatar_url: Mapped[str] = mapped_column(
        String(180), default="http://i.pravatar.cc/300", nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean(), default=True, nullable=False)
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    update_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "is_active": self.is_active
        }
