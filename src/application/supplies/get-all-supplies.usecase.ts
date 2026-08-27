import {
  ISupplyRepository,
  FindAllSuppliesOptions,
  PaginatedSupplies,
} from '../../domain/supplies/supply.repository.interface';

export class GetAllSuppliesUseCase {
  constructor(private supplyRepository: ISupplyRepository) {}

  async execute(options: FindAllSuppliesOptions): Promise<PaginatedSupplies> {
    return this.supplyRepository.findAll(options);
  }
}
