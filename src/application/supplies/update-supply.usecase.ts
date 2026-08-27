import {
  ISupplyRepository,
  UpdateSupplyDto,
} from '../../domain/supplies/supply.repository.interface';
import { SupplyEntity } from '../../domain/supplies/supply.entity';

export class UpdateSupplyUseCase {
  constructor(private supplyRepository: ISupplyRepository) {}

  async execute(id: string, data: UpdateSupplyDto): Promise<SupplyEntity> {
    const existing = await this.supplyRepository.findById(id);
    if (!existing) {
      throw new Error(`Material/Suministro con id "${id}" no existe.`);
    }
    return this.supplyRepository.update(id, data);
  }
}
