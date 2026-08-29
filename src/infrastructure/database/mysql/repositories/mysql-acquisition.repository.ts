import { AcquisitionEntity } from '../../../../domain/acquisitions/acquisition.entity';
import {
  IAcquisitionRepository,
  CreateAcquisitionDTO,
  UpdateAcquisitionDTO,
  QueryAcquisitionOptions,
  CreateAcquisitionDetailDTO,
} from '../../../../domain/acquisitions/acquisition.repository.interface';
import { AcquisitionRepository } from '../../../repositories/acquisition.repository';

// Reutiliza la misma lógica de Prisma para consistencia total en desarrollo
export class MySQLAcquisitionRepository implements IAcquisitionRepository {
  private repository: AcquisitionRepository;

  constructor() {
    this.repository = new AcquisitionRepository();
  }

  public async findAll(options?: QueryAcquisitionOptions): Promise<{ data: AcquisitionEntity[]; total: number }> {
    return this.repository.findAll(options);
  }

  public async findById(id: string): Promise<AcquisitionEntity | null> {
    return this.repository.findById(id);
  }

  public async create(dto: CreateAcquisitionDTO): Promise<AcquisitionEntity> {
    return this.repository.create(dto);
  }

  public async update(id: string, dto: UpdateAcquisitionDTO): Promise<AcquisitionEntity> {
    return this.repository.update(id, dto);
  }

  public async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  public async addDetail(dto: CreateAcquisitionDetailDTO): Promise<any> {
    return this.repository.addDetail(dto);
  }

  public async deleteDetail(detailId: string): Promise<boolean> {
    return this.repository.deleteDetail(detailId);
  }
}
