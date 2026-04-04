from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import Company, Student, University
from app.shared.repositories import BaseRepository
from app.shared.types.auth import UserTypeEnum

UserEntity = University | Company | Student


class UniversityRepository(BaseRepository[University]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=University)


class CompanyRepository(BaseRepository[Company]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=Company)


class StudentRepository(BaseRepository[Student]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=Student)


class UserRepository:
  def __init__(self, session: AsyncSession) -> None:
    self.universities = UniversityRepository(session)
    self.companies = CompanyRepository(session)
    self.students = StudentRepository(session)

  async def create_university(
    self,
    code: str,
    name: str,
    email: str,
    password_hash: str,
    public_key: str | None,
  ) -> University:
    return await self.universities.create(
      code=code,
      name=name,
      email=email,
      password_hash=password_hash,
      public_key=public_key,
      is_verified=False,
    )

  async def create_company(self, company_name: str, email: str, password_hash: str) -> Company:
    return await self.companies.create(
      company_name=company_name,
      email=email,
      password_hash=password_hash,
      is_verified=False,
    )

  async def create_student(
    self,
    email: str,
    password_hash: str,
    encrypted_last_name: str,
    encrypted_first_name: str,
    encrypted_patronymic: str | None,
  ) -> Student:
    return await self.students.create(
      email=email,
      password_hash=password_hash,
      encrypted_last_name=encrypted_last_name,
      encrypted_first_name=encrypted_first_name,
      encrypted_patronymic=encrypted_patronymic,
    )

  async def get_user_by_email(self, email: str, user_type: UserTypeEnum) -> UserEntity | None:
    repository = self._resolve_repo(user_type)
    return await repository.get_one(filters={"email": email})

  async def get_user_by_id(self, user_id: uuid.UUID, user_type: UserTypeEnum) -> UserEntity | None:
    repository = self._resolve_repo(user_type)
    return await repository.get_by_id(user_id)

  def _resolve_repo(
    self,
    user_type: UserTypeEnum,
  ) -> UniversityRepository | CompanyRepository | StudentRepository:
    if user_type is UserTypeEnum.UNIVERSITY:
      return self.universities
    if user_type is UserTypeEnum.COMPANY:
      return self.companies
    return self.students
