#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/920a87b50729a867e21706dd0fa5c3739e273a84ed89eb2f3525633b2d6ef85c/contract';
import startContract from '../../snapshots/920a87b50729a867e21706dd0fa5c3739e273a84ed89eb2f3525633b2d6ef85c/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c659deb47e65bd5abe10509485877881e2b218b7f062dc3972d7e52943bcf4db/contract';
import endContract from '../../snapshots/c659deb47e65bd5abe10509485877881e2b218b7f062dc3972d7e52943bcf4db/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'Post' }),
      this.dropColumn({ schema: 'public', table: 'User', column: 'username' }),
      this.createTable({
        schema: 'public',
        table: 'Comment',
        columns: [
          col('authorId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('body', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('ticketId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Ticket',
        columns: [
          col('assigneeId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('priority', 'text', {
            notNull: true,
            default: lit('MEDIUM'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('requesterId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('OPEN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Ticket_priority_check_8918b779',
            sql`"priority" IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')`,
          ),
          checkExpression(
            'Ticket_status_check_47a0f1bb',
            sql`"status" IN ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED')`,
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('role', 'text', {
          notNull: true,
          default: lit('USER'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'User',
        column: 'passwordHash',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'User',
        constraint: 'User_role_check_f222955c',
        expression: sql`"role" IN ('USER', 'AGENT', 'ADMIN')`,
      }),
      this.createIndex({
        schema: 'public',
        table: 'Comment',
        index: 'Comment_authorId_idx_e47547ed',
        columns: ['authorId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Comment',
        index: 'Comment_ticketId_idx_2fe526c3',
        columns: ['ticketId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Ticket',
        index: 'Ticket_assigneeId_idx_fd12ae38',
        columns: ['assigneeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Ticket',
        index: 'Ticket_requesterId_idx_a5f4af92',
        columns: ['requesterId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Comment',
        foreignKey: {
          name: 'Comment_ticketId_fkey',
          columns: ['ticketId'],
          references: { schema: 'public', table: 'Ticket', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Comment',
        foreignKey: {
          name: 'Comment_authorId_fkey',
          columns: ['authorId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Ticket',
        foreignKey: {
          name: 'Ticket_requesterId_fkey',
          columns: ['requesterId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Ticket',
        foreignKey: {
          name: 'Ticket_assigneeId_fkey',
          columns: ['assigneeId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
