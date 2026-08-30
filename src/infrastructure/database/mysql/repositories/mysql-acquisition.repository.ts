import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { mysqlPool } from '../mysql.client';
import { AcquisitionEntity } from '../../../../domain/acquisitions/acquisition.entity';
import {
  IAcquisitionRepository,
  CreateAcquisitionDTO,
  UpdateAcquisitionDTO,
  QueryAcquisitionOptions,
  CreateAcquisitionDetailDTO,
} from '../../../../domain/acquisitions/acquisition.repository.interface';
import { AppError, NotFoundError } from '../../../../shared/errors/app-error';

export class MySQLAcquisitionRepository implements IAcquisitionRepository {
  private mapRowToEntity(row: any, details: any[] = []): AcquisitionEntity {
    return new AcquisitionEntity({
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      checkoutUserId: row.checkout_user_id,
      departureDate: row.departure_date ? new Date(row.departure_date) : null,
      type: row.type || 'SUPPLY',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      user: row.userName
        ? {
            id: row.user_id,
            fullName: row.userName,
            email: row.userEmail,
            profession: row.userProfession,
          }
        : null,
      project: row.projectName
        ? {
            id: row.project_id,
            name: row.projectName,
          }
        : null,
      checkoutUser: row.checkoutUserName
        ? {
            id: row.checkout_user_id,
            fullName: row.checkoutUserName,
            email: row.checkoutUserEmail,
            profession: row.checkoutUserProfession,
          }
        : null,
      details: details.map((d: any) => ({
        id: d.id,
        acquisitionId: d.acquisition_id,
        supplyId: d.supply_id,
        assetId: d.asset_id,
        unit: d.unit,
        quantity: Number(d.quantity || 1),
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
        supply: d.supply_id ? { id: d.supply_id, name: d.supplyName, unit: d.supplyUnit } : null,
        asset: d.asset_id ? { id: d.asset_id, code: d.assetCode, name: d.assetName } : null,
      })),
    });
  }

  public async findAll(options: QueryAcquisitionOptions = {}): Promise<{ data: AcquisitionEntity[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(200, options.limit || 20));
    const offset = (page - 1) * limit;

    const whereConditions: string[] = ['1=1'];
    const params: any[] = [];

    if (options.userId) {
      whereConditions.push('a.user_id = ?');
      params.push(options.userId);
    }
    if (options.projectId) {
      whereConditions.push('a.project_id = ?');
      params.push(options.projectId);
    }
    if (options.checkoutUserId) {
      whereConditions.push('a.checkout_user_id = ?');
      params.push(options.checkoutUserId);
    }
    if (options.type) {
      whereConditions.push('a.type = ?');
      params.push(options.type);
    }

    if (options.search && options.search.trim()) {
      const q = `%${options.search.trim()}%`;
      whereConditions.push(
        '(u.fullName LIKE ? OR p.name LIKE ? OR cu.fullName LIKE ? OR EXISTS (SELECT 1 FROM acquisition_details ad LEFT JOIN supplies s ON s.id = ad.supply_id LEFT JOIN assets ast ON ast.id = ad.asset_id WHERE ad.acquisition_id = a.id AND (s.name LIKE ? OR ast.name LIKE ?)))',
      );
      params.push(q, q, q, q, q);
    }

    const whereClause = whereConditions.join(' AND ');

    const [countRows] = await mysqlPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM acquisitions a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN projects p ON p.id = a.project_id
       LEFT JOIN users cu ON cu.id = a.checkout_user_id
       WHERE ${whereClause}`,
      params,
    );
    const total = Number(countRows[0]?.total || 0);

    const sortOrder = options.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const [rows] = await mysqlPool.query<RowDataPacket[]>(
      `SELECT a.id, a.user_id, a.project_id, a.checkout_user_id, a.departure_date, a.type, a.created_at, a.updated_at,
              u.fullName as userName, u.email as userEmail, u.profession as userProfession,
              p.name as projectName,
              cu.fullName as checkoutUserName, cu.email as checkoutUserEmail, cu.profession as checkoutUserProfession
       FROM acquisitions a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN projects p ON p.id = a.project_id
       LEFT JOIN users cu ON cu.id = a.checkout_user_id
       WHERE ${whereClause}
       ORDER BY a.created_at ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params,
    );

    const acquisitionIds = rows.map((r: any) => r.id);
    const detailsByAcquisition: Record<string, any[]> = {};

    if (acquisitionIds.length > 0) {
      const placeholders = acquisitionIds.map(() => '?').join(',');
      const [detailRows] = await mysqlPool.execute<RowDataPacket[]>(
        `SELECT ad.id, ad.acquisition_id, ad.supply_id, ad.asset_id, ad.unit, ad.quantity, ad.created_at, ad.updated_at,
                s.name as supplyName, s.unit as supplyUnit,
                ast.code as assetCode, ast.name as assetName
         FROM acquisition_details ad
         LEFT JOIN supplies s ON s.id = ad.supply_id
         LEFT JOIN assets ast ON ast.id = ad.asset_id
         WHERE ad.acquisition_id IN (${placeholders})`,
        acquisitionIds,
      );

      for (const d of detailRows) {
        if (!detailsByAcquisition[d.acquisition_id]) {
          detailsByAcquisition[d.acquisition_id] = [];
        }
        detailsByAcquisition[d.acquisition_id].push(d);
      }
    }

    const data = rows.map((row) => this.mapRowToEntity(row, detailsByAcquisition[row.id] || []));
    return { data, total };
  }

  public async findById(id: string): Promise<AcquisitionEntity | null> {
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT a.id, a.user_id, a.project_id, a.checkout_user_id, a.departure_date, a.type, a.created_at, a.updated_at,
              u.fullName as userName, u.email as userEmail, u.profession as userProfession,
              p.name as projectName,
              cu.fullName as checkoutUserName, cu.email as checkoutUserEmail, cu.profession as checkoutUserProfession
       FROM acquisitions a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN projects p ON p.id = a.project_id
       LEFT JOIN users cu ON cu.id = a.checkout_user_id
       WHERE a.id = ?
       LIMIT 1`,
      [id],
    );

    if (!rows.length) return null;

    const [detailRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT ad.id, ad.acquisition_id, ad.supply_id, ad.asset_id, ad.unit, ad.quantity, ad.created_at, ad.updated_at,
              s.name as supplyName, s.unit as supplyUnit,
              ast.code as assetCode, ast.name as assetName
       FROM acquisition_details ad
       LEFT JOIN supplies s ON s.id = ad.supply_id
       LEFT JOIN assets ast ON ast.id = ad.asset_id
       WHERE ad.acquisition_id = ?`,
      [id],
    );

    return this.mapRowToEntity(rows[0], detailRows);
  }

  public async create(dto: CreateAcquisitionDTO): Promise<AcquisitionEntity> {
    if (dto.details && dto.details.length > 0) {
      for (const d of dto.details) {
        const qty = d.quantity || 1;

        if (d.assetId) {
          const [astRows] = await mysqlPool.execute<RowDataPacket[]>(
            'SELECT name, code, quantity, quantity_out FROM assets WHERE id = ? AND deletedAt IS NULL LIMIT 1',
            [d.assetId],
          );
          if (!astRows.length) {
            throw new NotFoundError('El activo fijo especificado no existe.');
          }
          const ast = astRows[0];
          const availableStock = Number(ast.quantity || 1) - Number(ast.quantity_out || 0);
          if (availableStock < qty) {
            throw new AppError(
              `El activo fijo "${ast.name}" [${ast.code}] no tiene stock disponible (Disponibles: ${availableStock}, Requeridos: ${qty}).`,
            );
          }
        }

        if (d.supplyId && dto.projectId) {
          const [spRows] = await mysqlPool.execute<RowDataPacket[]>(
            `SELECT sp.quantity, sp.output_quantity, s.name as supplyName
             FROM supply_projects sp
             LEFT JOIN supplies s ON s.id = sp.supply_id
             WHERE sp.supply_id = ? AND sp.project_id = ? AND sp.released_at IS NULL
             LIMIT 1`,
            [d.supplyId, dto.projectId],
          );
          if (!spRows.length) {
            throw new NotFoundError('El suministro seleccionado no está asignado al proyecto especificado.');
          }
          const sp = spRows[0];
          const availableStock = Number(sp.quantity || 0) - Number(sp.output_quantity || 0);
          if (availableStock < qty) {
            throw new AppError(
              `El suministro "${sp.supplyName || 'solicitado'}" no tiene stock disponible en este proyecto (Disponibles: ${availableStock}, Requeridos: ${qty}).`,
            );
          }
        }
      }
    }

    const id = uuidv4();
    const now = new Date();
    const departureDate = dto.departureDate ? new Date(dto.departureDate) : null;
    const type = dto.type || 'SUPPLY';

    await mysqlPool.execute(
      `INSERT INTO acquisitions (id, user_id, project_id, checkout_user_id, departure_date, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dto.userId, dto.projectId || null, dto.checkoutUserId || null, departureDate, type, now, now],
    );

    if (dto.details && dto.details.length > 0) {
      for (const d of dto.details) {
        const detailId = uuidv4();
        const qty = d.quantity || 1;
        const unit = d.unit || 'PZA';

        await mysqlPool.execute(
          `INSERT INTO acquisition_details (id, acquisition_id, supply_id, asset_id, unit, quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [detailId, id, d.supplyId || null, d.assetId || null, unit, qty, now, now],
        );

        if (d.assetId) {
          await mysqlPool.execute('UPDATE assets SET quantity_out = quantity_out + ? WHERE id = ?', [qty, d.assetId]);
        }

        if (d.supplyId && dto.projectId) {
          await mysqlPool.execute(
            'UPDATE supply_projects SET output_quantity = output_quantity + ? WHERE supply_id = ? AND project_id = ? AND released_at IS NULL',
            [qty, d.supplyId, dto.projectId],
          );
          await mysqlPool.execute('UPDATE supplies SET output_quantity = output_quantity + ? WHERE id = ?', [
            qty,
            d.supplyId,
          ]);
        }
      }
    }

    const created = await this.findById(id);
    return created!;
  }

  public async update(id: string, dto: UpdateAcquisitionDTO): Promise<AcquisitionEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Registro de personal no encontrado.');
    }

    const now = new Date();

    if (dto.details !== undefined) {
      // Revertir stocks anteriores
      for (const d of existing.details || []) {
        if (d.assetId) {
          await mysqlPool.execute('UPDATE assets SET quantity_out = GREATEST(0, quantity_out - ?) WHERE id = ?', [
            d.quantity,
            d.assetId,
          ]);
        }
        if (d.supplyId && existing.projectId) {
          await mysqlPool.execute(
            'UPDATE supply_projects SET output_quantity = GREATEST(0, output_quantity - ?) WHERE supply_id = ? AND project_id = ? AND released_at IS NULL',
            [d.quantity, d.supplyId, existing.projectId],
          );
          await mysqlPool.execute('UPDATE supplies SET output_quantity = GREATEST(0, output_quantity - ?) WHERE id = ?', [
            d.quantity,
            d.supplyId,
          ]);
        }
      }

      await mysqlPool.execute('DELETE FROM acquisition_details WHERE acquisition_id = ?', [id]);
    }

    const targetProjectId = dto.projectId !== undefined ? dto.projectId : existing.projectId;

    if (dto.details && dto.details.length > 0) {
      for (const d of dto.details) {
        const qty = d.quantity || 1;

        if (d.assetId) {
          const [astRows] = await mysqlPool.execute<RowDataPacket[]>(
            'SELECT name, code, quantity, quantity_out FROM assets WHERE id = ? AND deletedAt IS NULL LIMIT 1',
            [d.assetId],
          );
          if (!astRows.length) throw new NotFoundError('El activo fijo especificado no existe.');
          const ast = astRows[0];
          const availableStock = Number(ast.quantity || 1) - Number(ast.quantity_out || 0);
          if (availableStock < qty) {
            throw new AppError(
              `El activo fijo "${ast.name}" [${ast.code}] no tiene stock disponible (Disponibles: ${availableStock}, Requeridos: ${qty}).`,
            );
          }
        }

        if (d.supplyId && targetProjectId) {
          const [spRows] = await mysqlPool.execute<RowDataPacket[]>(
            `SELECT sp.quantity, sp.output_quantity, s.name as supplyName
             FROM supply_projects sp
             LEFT JOIN supplies s ON s.id = sp.supply_id
             WHERE sp.supply_id = ? AND sp.project_id = ? AND sp.released_at IS NULL
             LIMIT 1`,
            [d.supplyId, targetProjectId],
          );
          if (!spRows.length) throw new NotFoundError('El suministro no está asignado al proyecto especificado.');
          const sp = spRows[0];
          const availableStock = Number(sp.quantity || 0) - Number(sp.output_quantity || 0);
          if (availableStock < qty) {
            throw new AppError(
              `El suministro "${sp.supplyName || 'solicitado'}" no tiene stock disponible en este proyecto (Disponibles: ${availableStock}, Requeridos: ${qty}).`,
            );
          }
        }
      }
    }

    const userId = dto.userId !== undefined ? dto.userId : existing.userId;
    const projectId = dto.projectId !== undefined ? dto.projectId : existing.projectId;
    const checkoutUserId = dto.checkoutUserId !== undefined ? dto.checkoutUserId : existing.checkoutUserId;
    const departureDate =
      dto.departureDate !== undefined ? (dto.departureDate ? new Date(dto.departureDate) : null) : existing.departureDate;
    const type = dto.type !== undefined ? dto.type : existing.type;

    await mysqlPool.execute(
      `UPDATE acquisitions
       SET user_id = ?, project_id = ?, checkout_user_id = ?, departure_date = ?, type = ?, updated_at = ?
       WHERE id = ?`,
      [userId, projectId, checkoutUserId, departureDate, type, now, id],
    );

    if (dto.details && dto.details.length > 0) {
      for (const d of dto.details) {
        const detailId = uuidv4();
        const qty = d.quantity || 1;
        const unit = d.unit || 'PZA';

        await mysqlPool.execute(
          `INSERT INTO acquisition_details (id, acquisition_id, supply_id, asset_id, unit, quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [detailId, id, d.supplyId || null, d.assetId || null, unit, qty, now, now],
        );

        if (d.assetId) {
          await mysqlPool.execute('UPDATE assets SET quantity_out = quantity_out + ? WHERE id = ?', [qty, d.assetId]);
        }

        if (d.supplyId && targetProjectId) {
          await mysqlPool.execute(
            'UPDATE supply_projects SET output_quantity = output_quantity + ? WHERE supply_id = ? AND project_id = ? AND released_at IS NULL',
            [qty, d.supplyId, targetProjectId],
          );
          await mysqlPool.execute('UPDATE supplies SET output_quantity = output_quantity + ? WHERE id = ?', [
            qty,
            d.supplyId,
          ]);
        }
      }
    }

    const updated = await this.findById(id);
    return updated!;
  }

  public async delete(id: string): Promise<boolean> {
    const acquisition = await this.findById(id);
    if (!acquisition) return false;

    if (acquisition.details && acquisition.details.length > 0) {
      for (const d of acquisition.details) {
        if (d.assetId) {
          await mysqlPool.execute('UPDATE assets SET quantity_out = GREATEST(0, quantity_out - ?) WHERE id = ?', [
            d.quantity,
            d.assetId,
          ]);
        }
        if (d.supplyId && acquisition.projectId) {
          await mysqlPool.execute(
            'UPDATE supply_projects SET output_quantity = GREATEST(0, output_quantity - ?) WHERE supply_id = ? AND project_id = ? AND released_at IS NULL',
            [d.quantity, d.supplyId, acquisition.projectId],
          );
          await mysqlPool.execute('UPDATE supplies SET output_quantity = GREATEST(0, output_quantity - ?) WHERE id = ?', [
            d.quantity,
            d.supplyId,
          ]);
        }
      }
    }

    await mysqlPool.execute('DELETE FROM acquisition_details WHERE acquisition_id = ?', [id]);
    await mysqlPool.execute('DELETE FROM acquisitions WHERE id = ?', [id]);
    return true;
  }

  public async addDetail(dto: CreateAcquisitionDetailDTO): Promise<any> {
    const qty = dto.quantity || 1;

    const [acqRows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT id, project_id FROM acquisitions WHERE id = ? LIMIT 1',
      [dto.acquisitionId],
    );

    if (!acqRows.length) {
      throw new NotFoundError('El registro de personal no existe.');
    }
    const acquisition = acqRows[0];
    const now = new Date();
    const detailId = uuidv4();

    if (dto.assetId) {
      const [astRows] = await mysqlPool.execute<RowDataPacket[]>(
        'SELECT id, name, code, quantity, quantity_out FROM assets WHERE id = ? AND deletedAt IS NULL LIMIT 1',
        [dto.assetId],
      );
      if (!astRows.length) {
        throw new NotFoundError('El activo fijo especificado no existe.');
      }
      const ast = astRows[0];
      const availableStock = Number(ast.quantity || 1) - Number(ast.quantity_out || 0);
      if (availableStock < qty) {
        throw new AppError(
          `El activo fijo "${ast.name}" [${ast.code}] no tiene stock disponible (Total: ${ast.quantity}, Salida: ${ast.quantity_out || 0}, Disponibles: ${availableStock}).`,
        );
      }

      await mysqlPool.execute(
        `INSERT INTO acquisition_details (id, acquisition_id, supply_id, asset_id, unit, quantity, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
        [detailId, dto.acquisitionId, dto.assetId, dto.unit || 'PZA', qty, now, now],
      );

      await mysqlPool.execute('UPDATE assets SET quantity_out = quantity_out + ? WHERE id = ?', [qty, dto.assetId]);

      return {
        id: detailId,
        acquisitionId: dto.acquisitionId,
        supplyId: null,
        assetId: dto.assetId,
        unit: dto.unit || 'PZA',
        quantity: qty,
        createdAt: now,
        updatedAt: now,
        asset: { id: ast.id, code: ast.code, name: ast.name },
      };
    }

    if (dto.supplyId) {
      if (!acquisition.project_id) {
        throw new AppError('El registro de personal no tiene un proyecto asignado para entregar suministros.');
      }

      const [spRows] = await mysqlPool.execute<RowDataPacket[]>(
        `SELECT sp.id, sp.quantity, sp.output_quantity, s.name as supplyName, s.unit as supplyUnit
         FROM supply_projects sp
         LEFT JOIN supplies s ON s.id = sp.supply_id
         WHERE sp.supply_id = ? AND sp.project_id = ? AND sp.released_at IS NULL
         LIMIT 1`,
        [dto.supplyId, acquisition.project_id],
      );

      if (!spRows.length) {
        throw new NotFoundError('El suministro seleccionado no está asignado al proyecto de esta entrega.');
      }
      const sp = spRows[0];
      const availableStock = Number(sp.quantity || 0) - Number(sp.output_quantity || 0);
      if (availableStock < qty) {
        throw new AppError(
          `El suministro "${sp.supplyName || 'solicitado'}" no tiene stock disponible en este proyecto (Asignados: ${sp.quantity}, Entregados: ${sp.output_quantity || 0}, Disponibles: ${availableStock}).`,
        );
      }

      const unit = dto.unit || sp.supplyUnit || 'PZA';

      await mysqlPool.execute(
        `INSERT INTO acquisition_details (id, acquisition_id, supply_id, asset_id, unit, quantity, created_at, updated_at)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
        [detailId, dto.acquisitionId, dto.supplyId, unit, qty, now, now],
      );

      await mysqlPool.execute('UPDATE supply_projects SET output_quantity = output_quantity + ? WHERE id = ?', [qty, sp.id]);
      await mysqlPool.execute('UPDATE supplies SET output_quantity = output_quantity + ? WHERE id = ?', [
        qty,
        dto.supplyId,
      ]);

      return {
        id: detailId,
        acquisitionId: dto.acquisitionId,
        supplyId: dto.supplyId,
        assetId: null,
        unit,
        quantity: qty,
        createdAt: now,
        updatedAt: now,
        supply: { id: dto.supplyId, name: sp.supplyName, unit },
      };
    }

    await mysqlPool.execute(
      `INSERT INTO acquisition_details (id, acquisition_id, supply_id, asset_id, unit, quantity, created_at, updated_at)
       VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)`,
      [detailId, dto.acquisitionId, dto.unit || 'PZA', qty, now, now],
    );

    return {
      id: detailId,
      acquisitionId: dto.acquisitionId,
      supplyId: null,
      assetId: null,
      unit: dto.unit || 'PZA',
      quantity: qty,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async deleteDetail(detailId: string): Promise<boolean> {
    const [detailRows] = await mysqlPool.execute<RowDataPacket[]>(
      `SELECT ad.id, ad.acquisition_id, ad.supply_id, ad.asset_id, ad.quantity, a.project_id
       FROM acquisition_details ad
       LEFT JOIN acquisitions a ON a.id = ad.acquisition_id
       WHERE ad.id = ? LIMIT 1`,
      [detailId],
    );

    if (!detailRows.length) return false;
    const detail = detailRows[0];
    const qty = Number(detail.quantity || 1);

    if (detail.asset_id) {
      await mysqlPool.execute('UPDATE assets SET quantity_out = GREATEST(0, quantity_out - ?) WHERE id = ?', [
        qty,
        detail.asset_id,
      ]);
    }

    if (detail.supply_id && detail.project_id) {
      await mysqlPool.execute(
        'UPDATE supply_projects SET output_quantity = GREATEST(0, output_quantity - ?) WHERE supply_id = ? AND project_id = ? AND released_at IS NULL',
        [qty, detail.supply_id, detail.project_id],
      );
      await mysqlPool.execute('UPDATE supplies SET output_quantity = GREATEST(0, output_quantity - ?) WHERE id = ?', [
        qty,
        detail.supply_id,
      ]);
    }

    await mysqlPool.execute('DELETE FROM acquisition_details WHERE id = ?', [detailId]);
    return true;
  }
}
