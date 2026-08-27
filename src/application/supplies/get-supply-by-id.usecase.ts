import { ISupplyRepository } from '../../domain/supplies/supply.repository.interface';
import { SupplyEntity } from '../../domain/supplies/supply.entity';

export class GetSupplyByIdUseCase {
  constructor(private supplyRepository: ISupplyRepository) {}

  async execute(id: string): Promise<SupplyEntity> {
    const supply = await this.supplyRepository.findById(id);
    if (!supply) {
      throw new Error(`Material/Suministro con id "${id}" no fue encontrado.`);
    }
    return supply;
  }
}
