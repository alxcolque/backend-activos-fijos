import { ISupplyRepository } from '../../domain/supplies/supply.repository.interface';

export class DeleteSupplyUseCase {
  constructor(private supplyRepository: ISupplyRepository) {}

  async execute(id: string): Promise<boolean> {
    const existing = await this.supplyRepository.findById(id);
    if (!existing) {
      throw new Error(`Material/Suministro con id "${id}" no existe.`);
    }
    return this.supplyRepository.delete(id);
  }
}
