import {
  ISupplyRepository,
  CreateSupplyDto,
} from '../../domain/supplies/supply.repository.interface';
import { SupplyEntity } from '../../domain/supplies/supply.entity';

export class CreateSupplyUseCase {
  constructor(private supplyRepository: ISupplyRepository) {}

  async execute(data: CreateSupplyDto): Promise<SupplyEntity> {
    if (!data.name || !data.name.trim()) {
      throw new Error('El nombre del material/suministro es obligatorio.');
    }
    return this.supplyRepository.create(data);
  }
}
