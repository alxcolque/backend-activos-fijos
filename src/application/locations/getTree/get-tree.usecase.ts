import {
  ILocationRepository,
  LocationTreeNode,
} from '../../../domain/locations/location.repository.interface';
import { logger } from '../../../infrastructure/logger/logger';
import { Location } from '../../../domain/locations/location.entity';

export class GetTreeUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(): Promise<LocationTreeNode[]> {
    logger.info('Consulta árbol de ubicaciones');

    const allLocations = await this.locationRepository.findAllRaw();

    const locationMap = new Map<string, LocationTreeNode>();
    const rootNodes: LocationTreeNode[] = [];

    // First pass: create nodes
    for (const loc of allLocations) {
      locationMap.set(loc.id, {
        id: loc.id,
        parentId: loc.parentId,
        name: loc.name,
        description: loc.description,
        createdAt: loc.createdAt,
        updatedAt: loc.updatedAt,
        children: [],
      });
    }

    // Second pass: build parent-child relations
    for (const loc of allLocations) {
      const node = locationMap.get(loc.id)!;
      if (loc.parentId && locationMap.has(loc.parentId)) {
        const parentNode = locationMap.get(loc.parentId)!;
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    return rootNodes;
  }
}
