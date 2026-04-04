from __future__ import annotations

import builtins
from collections.abc import Mapping, Sequence
from typing import Any, TypeVar

from sqlalchemy import Select, func, select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute
from sqlalchemy.sql.elements import BinaryExpression, ColumnElement

ModelT = TypeVar("ModelT")

FilterExpression = ColumnElement[bool] | BinaryExpression[bool]
OrderExpression = ColumnElement[Any]


class BaseRepository[ModelT]:
  def __init__(self, session: AsyncSession, model: type[ModelT]) -> None:
    self.session = session
    self.model = model

  async def add(self, entity: ModelT, refresh: bool = True) -> ModelT:
    self.session.add(entity)
    await self.flush()
    if refresh:
      await self.refresh(entity)
    return entity

  async def create(self, refresh: bool = True, **kwargs: Any) -> ModelT:
    entity = self.model(**kwargs)
    return await self.add(entity, refresh=refresh)

  async def get_by_id(self, entity_id: Any, id_attr: str = "id") -> ModelT | None:
    attr = self._get_attr(id_attr)
    return await self.get_one(filters=[attr == entity_id])

  async def get_one(
    self,
    filters: Mapping[str, Any] | Sequence[FilterExpression] | None = None,
    order_by: Sequence[OrderExpression] | None = None,
  ) -> ModelT | None:
    statement = self.build_select(filters=filters, order_by=order_by, limit=1)
    result = await self.session.execute(statement)
    return result.scalar_one_or_none()

  async def list(
    self,
    filters: Mapping[str, Any] | Sequence[FilterExpression] | None = None,
    order_by: Sequence[OrderExpression] | None = None,
    limit: int | None = None,
    offset: int | None = None,
  ) -> list[ModelT]:
    statement = self.build_select(filters=filters, order_by=order_by, limit=limit, offset=offset)
    result = await self.session.execute(statement)
    return list(result.scalars().all())

  async def count(
    self,
    filters: Mapping[str, Any] | Sequence[FilterExpression] | None = None,
  ) -> int:
    statement = select(func.count()).select_from(self.model)
    statement = self.apply_filters(statement, filters)
    result = await self.session.execute(statement)
    return int(result.scalar_one())

  async def exists(
    self,
    filters: Mapping[str, Any] | Sequence[FilterExpression] | None = None,
  ) -> bool:
    return (await self.count(filters=filters)) > 0

  async def update_many(
    self,
    filters: Mapping[str, Any] | Sequence[FilterExpression],
    values: Mapping[str, Any],
  ) -> int:
    statement = update(self.model).values(**values)
    for condition in self._normalize_filters(filters):
      statement = statement.where(condition)

    result = await self.session.execute(statement)
    typed_result = result if isinstance(result, CursorResult) else None
    if typed_result and typed_result.rowcount is not None:
      return int(typed_result.rowcount)
    return 0

  async def delete(self, entity: ModelT) -> None:
    await self.session.delete(entity)

  async def flush(self) -> None:
    await self.session.flush()

  async def refresh(self, entity: ModelT) -> None:
    await self.session.refresh(entity)

  def build_select(
    self,
    filters: Mapping[str, Any] | Sequence[FilterExpression] | None = None,
    order_by: Sequence[OrderExpression] | None = None,
    limit: int | None = None,
    offset: int | None = None,
  ) -> Select[tuple[ModelT]]:
    statement = select(self.model)
    statement = self.apply_filters(statement, filters)
    statement = self.apply_ordering(statement, order_by)
    return self.apply_pagination(statement, limit=limit, offset=offset)

  def apply_filters(
    self,
    statement: Select[Any],
    filters: Mapping[str, Any] | Sequence[FilterExpression] | None = None,
  ) -> Select[Any]:
    for condition in self._normalize_filters(filters):
      statement = statement.where(condition)
    return statement

  def apply_ordering(
    self,
    statement: Select[Any],
    order_by: Sequence[OrderExpression] | None = None,
  ) -> Select[Any]:
    if order_by:
      statement = statement.order_by(*order_by)
    return statement

  @staticmethod
  def apply_pagination(
    statement: Select[Any],
    limit: int | None = None,
    offset: int | None = None,
  ) -> Select[Any]:
    if limit is not None:
      statement = statement.limit(max(0, limit))
    if offset is not None:
      statement = statement.offset(max(0, offset))
    return statement

  def _normalize_filters(
    self,
    filters: Mapping[str, Any] | Sequence[FilterExpression] | None,
  ) -> builtins.list[FilterExpression]:
    if filters is None:
      return []

    if isinstance(filters, Mapping):
      return [self._get_attr(name) == value for name, value in filters.items()]

    return builtins.list(filters)

  def _get_attr(self, name: str) -> InstrumentedAttribute[Any]:
    attr = getattr(self.model, name, None)
    if not isinstance(attr, InstrumentedAttribute):
      raise ValueError(f"Model {self.model.__name__} does not define mapped attribute '{name}'")
    return attr
