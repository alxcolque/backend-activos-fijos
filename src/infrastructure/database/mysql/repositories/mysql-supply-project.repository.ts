import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { mysqlPool } from '../mysql.client';
import {
  ISupplyProjectRepository,
  AssignSupplyToProjectDto,
  ReleaseSupplyFromProjectDto,
} from '../../../../domain/supply-projects/supply-project.repository.interface';
import { SupplyProjectEntity } from '../../../../domain/supply-projects/supply-project.entity';

export class MySQLSupplyProjectRepository implements ISupplyProjectRepository {
  async findByProjectId(projectId: string): Promise<SupplyProjectEntity[]> {
    const sql = `
      SELECT sp.id, sp.supply_id, sp.project_id, sp.quantity, sp.output_quantity, sp.assigned_at, sp.released_at,
             sp.observations, sp.created_at, sp.updated_at,
             s.name AS supply_name, s.unit AS supply_unit, s.category_id, s.location_id,
             c.name AS category_name, l.name AS location_name,
             p.name AS project_name
      FROM supply_projects sp
      JOIN supplies s ON s.id = sp.supply_id
      JOIN projects p ON p.id = sp.project_id
      LEFT JOIN asset_categories c ON c.id = s.category_id
      LEFT JOIN locations l ON l.id = s.location_id
      WHERE sp.project_id = ?
      ORDER BY sp.created_at DESC
    `;
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [projectId]);

    return rows.map((r: any) => ({
      id: r.id,
      supplyId: r.supply_id,
      projectId: r.project_id,
      quantity: Number(r.quantity),
      outputQuantity: Number(r.output_quantity || 0),
      assignedAt: new Date(r.assigned_at),
      releasedAt: r.released_at ? new Date(r.released_at) : null,
      observations: r.observations || null,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      supply: {
        id: r.supply_id,
        name: r.supply_name,
        unit: r.supply_unit || 'PZA',
        categoryId: r.category_id || null,
        locationId: r.location_id || null,
        category: r.category_id ? { id: r.category_id, name: r.category_name } : null,
        location: r.location_id ? { id: r.location_id, name: r.location_name } : null,
      },
      project: {
        id: r.project_id,
        name: r.project_name,
      },
    }));
  }

  async findById(id: string): Promise<SupplyProjectEntity | null> {
    const sql = `
      SELECT sp.id, sp.supply_id, sp.project_id, sp.quantity, sp.output_quantity, sp.assigned_at, sp.released_at,
             sp.observations, sp.created_at, sp.updated_at,
             s.name AS supply_name, s.unit AS supply_unit, s.category_id, s.location_id,
             c.name AS category_name, l.name AS location_name,
             p.name AS project_name
      FROM supply_projects sp
      JOIN supplies s ON s.id = sp.supply_id
      JOIN projects p ON p.id = sp.project_id
      LEFT JOIN asset_categories c ON c.id = s.category_id
      LEFT JOIN locations l ON l.id = s.location_id
      WHERE sp.id = ?
      LIMIT 1
    `;
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      supplyId: r.supply_id,
      projectId: r.project_id,
      quantity: Number(r.quantity),
      outputQuantity: Number(r.output_quantity || 0),
      assignedAt: new Date(r.assigned_at),
      releasedAt: r.released_at ? new Date(r.released_at) : null,
      observations: r.observations || null,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      supply: {
        id: r.supply_id,
        name: r.supply_name,
        unit: r.supply_unit || 'PZA',
        categoryId: r.category_id || null,
        locationId: r.location_id || null,
        category: r.category_id ? { id: r.category_id, name: r.category_name } : null,
        location: r.location_id ? { id: r.location_id, name: r.location_name } : null,
      },
      project: {
        id: r.project_id,
        name: r.project_name,
      },
    };
  }

  async assign(data: AssignSupplyToProjectDto): Promise<SupplyProjectEntity> {
    const id = uuidv4();
    const now = new Date();
    const quantity = Math.max(1, Number(data.quantity || 1));
    const outputQuantity = Math.max(0, Number(data.outputQuantity || 0));

    if (outputQuantity > quantity) {
      throw new Error(
        `La cantidad de salida del proyecto (${outputQuantity}) no puede superar la cantidad asignada (${quantity}).`
      );
    }

    const observations = data.observations || null;

    await mysqlPool.execute(
      'INSERT INTO supply_projects (id, supply_id, project_id, quantity, output_quantity, assigned_at, observations, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.supplyId, data.projectId, quantity, outputQuantity, now, observations, now, now],
    );

    await mysqlPool.execute(
      'UPDATE supplies SET output_quantity = output_quantity + ? WHERE id = ?',
      [quantity, data.supplyId],
    );

    const created = await this.findById(id);
    if (!created) throw new Error('Error al recuperar asignación creada.');
    return created;
  }

  async release(data: ReleaseSupplyFromProjectDto): Promise<SupplyProjectEntity> {
    const existing = await this.findById(data.id);
    if (!existing) throw new Error('Asignación de suministro no encontrada.');

    const releaseQty = data.quantityToRelease ? Math.min(existing.quantity, Math.max(1, Number(data.quantityToRelease))) : existing.quantity;
    const newOutputQuantity = Math.min(existing.quantity, existing.outputQuantity + releaseQty);
    const remainingStockInProject = existing.quantity - newOutputQuantity;
    const now = new Date();

    if (remainingStockInProject <= 0) {
      await mysqlPool.execute(
        'UPDATE supply_projects SET output_quantity = ?, released_at = ?, observations = ?, updated_at = ? WHERE id = ?',
        [
          existing.quantity,
          now,
          data.observations
            ? `${existing.observations || ''} [Liberado: ${now.toLocaleDateString()}] - ${data.observations}`.trim()
            : existing.observations,
          now,
          data.id,
        ],
      );
    } else {
      await mysqlPool.execute(
        'UPDATE supply_projects SET output_quantity = ?, observations = ?, updated_at = ? WHERE id = ?',
        [
          newOutputQuantity,
          data.observations
            ? `${existing.observations || ''} [Se liberaron ${releaseQty} unid.] - ${data.observations}`.trim()
            : existing.observations,
          now,
          data.id,
        ],
      );
    }

    await mysqlPool.execute(
      'UPDATE supplies SET output_quantity = GREATEST(0, output_quantity - ?) WHERE id = ?',
      [releaseQty, existing.supplyId],
    );

    const updated = await this.findById(data.id);
    if (!updated) throw new Error('Error al recuperar asignación actualizada.');
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (existing && !existing.releasedAt) {
      const activeQuantity = Math.max(0, existing.quantity - existing.outputQuantity);
      if (activeQuantity > 0) {
        await mysqlPool.execute(
          'UPDATE supplies SET output_quantity = GREATEST(0, output_quantity - ?) WHERE id = ?',
          [activeQuantity, existing.supplyId],
        );
      }
    }

    await mysqlPool.execute('DELETE FROM supply_projects WHERE id = ?', [id]);
    return true;
  }
}
